// Migration eligibility and passport pages (F-31). Every limit arrives as an argument with its
// fact ids and the patch it was checked on (B06-0001, B06-0002, B06-0003, C04-0008, C04-0025).
import { nonNeg } from "./types";

export type MigrationRoute = "same-soc" | "cross-s2" | "cross-s3";

export const ROUTES: readonly { id: MigrationRoute; label: string }[] = [
  { id: "same-soc", label: "Same-season, into a Season of Conquest kingdom in its first story" },
  { id: "cross-s2", label: "Cross-season, into a Season 2 kingdom" },
  { id: "cross-s3", label: "Cross-season, into a Season 3 kingdom" },
];

export const isRoute = (x: unknown): x is MigrationRoute => ROUTES.some((r) => r.id === x);

/** A limit and where it comes from. */
export interface RuleSource { facts: string[]; patch: string }

/** Passport pages known for one power band (millions). `toM: null` = "above fromM" (fromM excluded). */
export interface PassportBand { fromM: number; toM: number | null; pages: number }

export interface MigrationRules {
  chMin: { value: number } & RuleSource;
  cooldownDays: { value: number } & RuleSource;
  /** Max days the character may be older than the target kingdom, per route. */
  ageLimit: Record<MigrationRoute, { value: number } & RuleSource>;
  passport: { bands: PassportBand[] } & RuleSource;
  /** Cross-season power window (millions): below min or above max is not eligible. */
  crossPower: { minM: number; maxM: number } & RuleSource;
  /** Personal rules (no alliance, troops home, resources protected). */
  personal: RuleSource;
  /** Kingdom rules set by its leadership (power cap, intake minimums). */
  kingdom: RuleSource;
}

export interface MigrationInput {
  cityHall: number;
  powerM: number;
  inAlliance: boolean;
  troopsHome: boolean;
  resourcesProtected: boolean;
  cooldownActive: boolean;
  characterAgeDays: number;
  kingdomAgeDays: number;
  route: MigrationRoute;
  /** The target kingdom's normal immigration power cap in millions; 0 or less = not given. */
  targetPowerCapM?: number;
  /** The target kingdom's own minimum power in millions; 0 or less = not given. */
  targetMinPowerM?: number;
}

export type PassportPages =
  | { kind: "exact"; pages: number; band: PassportBand }
  | { kind: "between"; low: number; high: number };

const inBand = (p: number, b: PassportBand): boolean => (b.toM === null ? p > b.fromM : p >= b.fromM && p <= b.toM);

/**
 * Passport pages for a displayed power (millions). Only the card's data points are exact; between two
 * known bands the answer is a range ("between X and Y pages"), never an interpolated number.
 */
export function passportPages(powerM: number, bands: readonly PassportBand[]): PassportPages {
  const p = nonNeg(powerM);
  const sorted = [...bands].sort((a, b) => a.fromM - b.fromM);
  if (sorted.length === 0) throw new RangeError("no passport bands");
  const hit = sorted.find((b) => inBand(p, b));
  if (hit) return { kind: "exact", pages: hit.pages, band: hit };
  const below = [...sorted].reverse().find((b) => b.toM !== null && p > b.toM);
  const above = sorted.find((b) => (b.toM === null ? p <= b.fromM : p < b.fromM));
  return { kind: "between", low: below?.pages ?? sorted[0]!.pages, high: above?.pages ?? sorted.at(-1)!.pages };
}

/** Days the character is older than the target kingdom (negative = younger). */
export const ageGapDays = (characterAgeDays: number, kingdomAgeDays: number): number =>
  Math.floor(nonNeg(characterAgeDays)) - Math.floor(nonNeg(kingdomAgeDays));

export interface RuleCheck {
  id: string;
  /** true = passes, false = blocks the move. */
  ok: boolean;
  text: string;
  facts: string[];
  patch: string;
}

export interface MigrationResult {
  eligible: boolean;
  checks: RuleCheck[];
  /** Only the checks that block the move. */
  blockers: RuleCheck[];
  passport: PassportPages;
  passportSource: RuleSource;
}

const fmtM = (n: number): string => `${Number(n.toFixed(2))}M`;

/** Every rule for the inputs, in a fixed order, each with its cards and patch. */
export function checkMigration(input: MigrationInput, rules: MigrationRules): MigrationResult {
  const checks: RuleCheck[] = [];
  const add = (id: string, ok: boolean, text: string, src: RuleSource): void => {
    checks.push({ id, ok, text, facts: [...src.facts], patch: src.patch });
  };
  const ch = Math.floor(nonNeg(input.cityHall));
  const power = nonNeg(input.powerM);

  add("ch", ch >= rules.chMin.value,
    ch >= rules.chMin.value ? `City Hall ${ch} meets the minimum of ${rules.chMin.value}.` : `City Hall ${ch} is below the minimum of ${rules.chMin.value}.`,
    rules.chMin);
  add("alliance", !input.inAlliance, input.inAlliance ? "You are in an alliance: leave it before you move." : "Not in an alliance.", rules.personal);
  add("troops", input.troopsHome, input.troopsHome ? "All troops are home." : "Troops are out of the city: bring every march home.", rules.personal);
  add("resources", input.resourcesProtected,
    input.resourcesProtected ? "Resources are within storehouse protection." : "Resources above storehouse protection: spend them or move them first.",
    rules.personal);
  add("cooldown", !input.cooldownActive,
    input.cooldownActive ? `Migration cooldown still active (a standard move normally starts a ${rules.cooldownDays.value}-day cooldown).` : "No migration cooldown active.",
    rules.cooldownDays);

  const lim = rules.ageLimit[input.route];
  const gap = ageGapDays(input.characterAgeDays, input.kingdomAgeDays);
  const gapText = gap >= 0 ? `${gap} days older than` : `${-gap} days younger than`;
  add("age", gap <= lim.value, `Your character is ${gapText} the target kingdom; this route allows at most ${lim.value} days older.`, lim);

  if (input.route !== "same-soc") {
    const { minM, maxM } = rules.crossPower;
    add("cross-power", power >= minM && power <= maxM,
      power < minM ? `Cross-season immigration needs at least ${fmtM(minM)} power; you have ${fmtM(power)}.`
        : power > maxM ? `Cross-season immigration allows at most ${fmtM(maxM)} power; you have ${fmtM(power)}.`
        : `Power ${fmtM(power)} is inside the cross-season window (${fmtM(minM)} to ${fmtM(maxM)}).`,
      rules.crossPower);
  }

  const cap = nonNeg(input.targetPowerCapM ?? 0);
  if (cap > 0) {
    add("cap", power <= cap,
      power <= cap ? `Power ${fmtM(power)} is within the kingdom's power cap of ${fmtM(cap)}.`
        : `Power ${fmtM(power)} is above the kingdom's power cap of ${fmtM(cap)}: only special immigration approved by the king can let you in.`,
      rules.kingdom);
  }
  const min = nonNeg(input.targetMinPowerM ?? 0);
  if (min > 0) {
    add("kingdom-min", power >= min,
      power >= min ? `Power ${fmtM(power)} meets the kingdom's own minimum of ${fmtM(min)}.` : `Power ${fmtM(power)} is below the kingdom's own minimum of ${fmtM(min)}.`,
      rules.kingdom);
  }

  const blockers = checks.filter((c) => !c.ok);
  return { eligible: blockers.length === 0, checks, blockers, passport: passportPages(power, rules.passport.bands), passportSource: rules.passport };
}
