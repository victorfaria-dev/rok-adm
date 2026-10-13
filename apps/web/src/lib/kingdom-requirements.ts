// Web glue for the requirements card (F-34) and My requirements (F-30): defaults, form text ↔ card,
// and the device store (ko:kingdom:v1, kinds "requirements" and "my-requirements").
import {
  FORMULA_PRESETS, FORMULA_VARS, REQ_MAX_BANDS, REQ_MAX_NUMBER, REQ_MAX_PERCENT, REQ_MAX_SAMPLES, cardSharePayload, defaultRequirementsCard,
  encodeShare, isRecord, newDocId, parseQuantity, parseRequirementsCard, validateBands,
  type BandIssue, type FormulaVar, type FormulaVars, type PowerBand, type ReqStage, type RequirementsCard, type SampleAccount,
} from "@rokadm/planner";
import { listDocs, removeDoc, saveDoc, type StorageLike } from "./kingdom-store";
import { shareUrl } from "./kingdom-share";

export const MY_PATH = "/kingdom/my/";
export const SHARE_KIND = "requirements";

/** Example requirement used to pre-fill a new card: "250% of power" (B08-0002). The council sets its own. */
export const EXAMPLE_PERCENT = 250;

/** Clearly fictional sandbox accounts (stable ids so server and browser render the same). */
export function sampleAccounts(): SampleAccount[] {
  return [
    { id: "sample-a", name: "Sample A", stats: { power: 10_500_000, t4: 600_000, t5: 0, deads: 300_000 } },
    { id: "sample-b", name: "Sample B", stats: { power: 35_000_000, t4: 2_000_000, t5: 1_500_000, deads: 900_000 } },
    { id: "sample-c", name: "Sample C", stats: { power: 80_000_000, t4: 1_000_000, t5: 6_000_000, deads: 2_500_000 } },
  ];
}

/** A new card pre-filled with the first preset, the example requirement and three sample accounts. */
export function newCard(now: Date = new Date()): RequirementsCard {
  const p = FORMULA_PRESETS[0]!;
  return defaultRequirementsCard({
    formula: p.formula,
    presetId: p.id,
    stage: p.stage as ReqStage,
    requirement: { mode: "percent", bands: [{ minPower: 0, maxPower: null, percent: EXAMPLE_PERCENT }] },
    sampleAccounts: sampleAccounts(),
  }, now);
}

// ---------------------------------------------------------------------------
// Text inputs

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string } | null;

const QTY_ERROR = "Enter a whole number like 1,200,000, 10.5m or 300k.";

/** Optional game quantity ("10.5m", "1,200,000"); null when empty. */
export function parseQty(text: string): Parsed<number> {
  if (!text.trim()) return null;
  const v = parseQuantity(text);
  if (v === null) return { ok: false, error: QTY_ERROR };
  if (v > REQ_MAX_NUMBER) return { ok: false, error: "This number is too large." };
  return { ok: true, value: v };
}

/** Percent such as "250" or "312.5" (a trailing % is allowed). */
export function parsePct(text: string): Parsed<number> {
  const s = text.trim().replace(/%$/, "").trim();
  if (!s) return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return { ok: false, error: "Enter a percent like 250." };
  const v = Number(s);
  if (v <= 0 || v > REQ_MAX_PERCENT) return { ok: false, error: `Enter more than 0 and at most ${REQ_MAX_PERCENT.toLocaleString("en-US")}.` };
  return { ok: true, value: v };
}

export const errorOf = (p: Parsed<unknown>): string | undefined => (p && !p.ok ? p.error : undefined);
export const valueOf = <T>(p: Parsed<T>): T | null => (p && p.ok ? p.value : null);

const qtyText = (n: number | null | undefined): string => (typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("en-US") : "");

// ---------------------------------------------------------------------------
// Form state (strings, as typed) ↔ card

export interface BandRow { key: string; min: string; max: string; pct: string }
export interface SampleRow { id: string; name: string; values: Record<FormulaVar, string> }

export interface CardForm {
  id: string;
  kingdom: string;
  title: string;
  stage: ReqStage;
  stageOther: string;
  formula: string;
  presetId: string | null;
  mode: "percent" | "fixed";
  bands: BandRow[];
  fixed: string;
  powerBasis: string;
  notes: string;
  samples: SampleRow[];
  compare: string;
}

let keySeq = 0;
export const rowKey = (): string => `k${++keySeq}`;

export function statsToValues(stats: FormulaVars): Record<FormulaVar, string> {
  return Object.fromEntries(FORMULA_VARS.map((v) => [v, qtyText(stats[v])])) as Record<FormulaVar, string>;
}

export function emptyBand(min = ""): BandRow {
  return { key: rowKey(), min, max: "", pct: "" };
}

export function emptySample(n: number): SampleRow {
  return { id: newDocId(), name: `Sample ${String.fromCharCode(65 + (n % 26))}`, values: statsToValues({}) };
}

export function cardToForm(c: RequirementsCard): CardForm {
  return {
    id: c.id,
    kingdom: c.kingdom,
    title: c.title,
    stage: c.stage,
    stageOther: c.stageOther,
    formula: c.formula,
    presetId: c.presetId,
    mode: c.requirement.mode,
    bands: c.requirement.mode === "percent"
      ? c.requirement.bands.map((b) => ({ key: rowKey(), min: qtyText(b.minPower), max: b.maxPower === null ? "" : qtyText(b.maxPower), pct: String(b.percent) }))
      : [{ key: rowKey(), min: "0", max: "", pct: String(EXAMPLE_PERCENT) }],
    fixed: c.requirement.mode === "fixed" ? qtyText(c.requirement.target) : "",
    powerBasis: c.powerBasis,
    notes: c.notes,
    samples: c.sampleAccounts.map((s) => ({ id: s.id, name: s.name, values: statsToValues(s.stats) })),
    compare: c.compareFormula,
  };
}

export interface FormCheck {
  card: RequirementsCard;
  /** Field errors keyed by input id suffix, e.g. "fixed", "band-0-min", "sample-<id>-t4". */
  errors: Record<string, string>;
  bandIssues: BandIssue[];
}

/** Build a card from the form; errors list every field that blocks saving or publishing. */
export function formToCard(f: CardForm, now: Date = new Date()): FormCheck {
  const errors: Record<string, string> = {};
  const bands: PowerBand[] = [];
  let bandIssues: BandIssue[] = [];
  if (f.mode === "percent") {
    f.bands.forEach((b, i) => {
      const min = b.min.trim() ? parseQty(b.min) : { ok: true as const, value: 0 };
      const max = parseQty(b.max);
      const pct = parsePct(b.pct);
      if (errorOf(min)) errors[`band-${i}-min`] = errorOf(min)!;
      if (errorOf(max)) errors[`band-${i}-max`] = errorOf(max)!;
      if (errorOf(pct)) errors[`band-${i}-pct`] = errorOf(pct)!;
      else if (!pct) errors[`band-${i}-pct`] = "Enter the percent of power for this band.";
      bands.push({ minPower: valueOf(min) ?? 0, maxPower: valueOf(max), percent: valueOf(pct) ?? 0 });
    });
    if (Object.keys(errors).length === 0) bandIssues = validateBands(bands);
    if (f.bands.length === 0) bandIssues = validateBands([]);
  }
  const fixed = parseQty(f.fixed);
  if (f.mode === "fixed") {
    if (errorOf(fixed)) errors.fixed = errorOf(fixed)!;
    else if (!fixed) errors.fixed = "Enter the DKP target.";
  }
  const samples: SampleAccount[] = f.samples.slice(0, REQ_MAX_SAMPLES).map((s) => {
    const stats: FormulaVars = {};
    for (const v of FORMULA_VARS) {
      const p = parseQty(s.values[v] ?? "");
      if (errorOf(p)) errors[`sample-${s.id}-${v}`] = errorOf(p)!;
      const x = valueOf(p);
      if (x !== null) stats[v] = x;
    }
    return { id: s.id, name: s.name.replace(/\s+/g, " ").trim().slice(0, 40), stats };
  });
  const card = parseRequirementsCard({
    id: f.id,
    updatedAt: now.toISOString(),
    kingdom: f.kingdom,
    title: f.title,
    stage: f.stage,
    stageOther: f.stageOther,
    formula: f.formula,
    presetId: f.presetId,
    requirement: f.mode === "fixed" ? { mode: "fixed", target: valueOf(fixed) ?? 0 } : { mode: "percent", bands },
    powerBasis: f.powerBasis,
    notes: f.notes,
    sampleAccounts: samples,
    compareFormula: f.compare,
  })!;
  return { card, errors, bandIssues };
}

/** Text title for the store list. */
export function cardTitle(c: Pick<RequirementsCard, "title" | "kingdom">): string {
  return c.title || (c.kingdom ? `${c.kingdom} requirements` : "Untitled requirements card");
}

// ---------------------------------------------------------------------------
// Store

export function listCards(st: StorageLike | null): RequirementsCard[] {
  return listDocs("requirements", st).map((d) => parseRequirementsCard({ ...(isRecord(d.data) ? d.data : {}), id: d.id, updatedAt: d.updatedAt })).filter((c): c is RequirementsCard => c !== null);
}

export function saveCard(card: RequirementsCard, st: StorageLike | null): void {
  saveDoc({ id: card.id, kind: "requirements", title: cardTitle(card), data: card }, st);
}

export function deleteCard(id: string, st: StorageLike | null): void {
  removeDoc(id, st);
}

/** Publish link for players: /kingdom/my/#d=... (sample accounts never included). */
export async function publishLink(card: RequirementsCard, origin?: string): Promise<string> {
  const code = await encodeShare(SHARE_KIND, cardSharePayload(card));
  return shareUrl(MY_PATH, code, origin);
}

// ---------------------------------------------------------------------------
// My requirements (player side)

export interface MyRequirementsDoc {
  card: RequirementsCard;
  /** Raw text the player typed, per variable. */
  myStats: Partial<Record<FormulaVar, string>>;
  /** true when the player built the card themselves (no council link). */
  selfMade: boolean;
}

export function parseMyDoc(x: unknown): MyRequirementsDoc | null {
  if (!isRecord(x)) return null;
  const card = parseRequirementsCard(x.card);
  if (!card) return null;
  const myStats: Partial<Record<FormulaVar, string>> = {};
  if (isRecord(x.myStats)) {
    for (const v of FORMULA_VARS) {
      const s = x.myStats[v];
      if (typeof s === "string") myStats[v] = s.slice(0, 30);
    }
  }
  return { card: { ...card, sampleAccounts: [], compareFormula: "" }, myStats, selfMade: x.selfMade === true };
}

export function saveMine(doc: MyRequirementsDoc, st: StorageLike | null): void {
  const card = { ...doc.card, sampleAccounts: [], compareFormula: "" };
  saveDoc({ id: `my-${card.id}`.slice(0, 64), kind: "my-requirements", title: cardTitle(card), data: { ...doc, card } }, st);
}

/** The most recently saved My requirements document on this device. */
export function latestMine(st: StorageLike | null): MyRequirementsDoc | null {
  for (const d of listDocs("my-requirements", st)) {
    const m = parseMyDoc(d.data);
    if (m) return m;
  }
  return null;
}

export const MAX_BANDS = REQ_MAX_BANDS;
