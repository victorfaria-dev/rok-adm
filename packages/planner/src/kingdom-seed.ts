// F-39 Seed simulator (EXPERIMENTAL). Implements only the documented 1.0.95 rule (B08-0008, also
// B01-0001): each governor's power counts toward kingdom power in marginal bands, and only each
// kingdom's top 300 governors by individual power count. The patch note words each band as a part
// of the power ("80% of your power from 150,000,000 to 300,000,000 will be factored in"), so the
// rate applies to the slice inside the band, like tax brackets: 200M counts 150M + 0.8 × 50M.
// Not modelled: seed letters and their thresholds (unknown; only Imperium's 23.5B is stated),
// and 1.0.96 matchmaking inputs "average power and total kill points".
// Pure functions, no fact data (bundle rule).

import { cleanLine, isRecord, parseQuantity, type KingdomDocBase } from "./kingdom-common";
import { splitNameAndNumber, type KingdomSource, type LineError } from "./kingdom-mge";

export interface SeedBand {
  key: "0-150M" | "150-300M" | "300-500M" | ">500M";
  label: string;
  from: number;
  /** Exclusive upper bound; Infinity for the last band. */
  to: number;
  rate: number;
}

/** B08-0008 bands (patch 1.0.95, 2025-06-12). */
export const SEED_BANDS: readonly SeedBand[] = [
  { key: "0-150M", label: "Up to 150M", from: 0, to: 150e6, rate: 1 },
  { key: "150-300M", label: "150M to 300M", from: 150e6, to: 300e6, rate: 0.8 },
  { key: "300-500M", label: "300M to 500M", from: 300e6, to: 500e6, rate: 0.5 },
  { key: ">500M", label: "Above 500M", from: 500e6, to: Number.POSITIVE_INFINITY, rate: 0 },
];

export const SEED_RULE = {
  facts: ["B08-0008", "B01-0001"],
  patch: "1.0.95",
  patchDate: "2025-06-12",
  /** data_validade of B08-0008: the date the card should have been re-checked by. */
  checkBy: "2026-06-30",
  topN: 300,
  imperiumThreshold: 23_500_000_000,
} as const;

/** Cards the seed simulator cites (confidence pinned to the card files by a unit test). */
export const SEED_SOURCES: readonly KingdomSource[] = [
  { id: "B08-0008", confidence: "alta", text: "Since 1.0.95 each governor's power counts 100% up to 150M, 80% from 150M to 300M, 50% from 300M to 500M, 0% above 500M; only the top 300 governors count; Imperium threshold 23.5B." },
  { id: "B01-0001", confidence: "alta", text: "Season of Conquest seeds (Imperium, A, B, C, D) are set by this kingdom power." },
  { id: "B03-0007", confidence: "alta", text: "Vacation Permit holders are not counted toward the kingdom's matchmaking score." },
];

/** Most power one governor can add: 150M + 120M + 100M. */
export const SEED_MAX_COUNTED_PER_GOVERNOR = 370_000_000;

export const SEED_LIMITS = { governors: 2000, name: 40, title: 80, power: 5_000_000_000, text: 80_000 } as const;

/** Power that counts toward kingdom power for one governor. */
export function countedPower(power: number): number {
  if (!Number.isFinite(power) || power <= 0) return 0;
  let sum = 0;
  for (const b of SEED_BANDS) sum += Math.max(0, Math.min(power, b.to) - b.from) * b.rate;
  return sum;
}

/** "Last verified for patch 1.0.95; check date passed, may be outdated" once `today` is past checkBy. */
export function seedRuleFreshness(today: string): { stale: boolean; text: string } {
  const stale = today > SEED_RULE.checkBy;
  return {
    stale,
    text: stale
      ? `Last verified for patch ${SEED_RULE.patch}; check date passed, may be outdated.`
      : `Last verified for patch ${SEED_RULE.patch}; next check due ${SEED_RULE.checkBy}.`,
  };
}

export interface SeedGovernor {
  /** Stable key: "L<line>" for pasted lists, "Q<band>-<n>" for quick mode. */
  id: string;
  name: string;
  power: number;
}

export interface SeedWhatIf {
  /** Governor ids marked as holding a Vacation Permit (hypothesis: removed from the count). */
  vacation: string[];
  /** Governor id → power after being "zeroed" (troops lost), as typed by the council. */
  zeroed: Record<string, number>;
}

export const emptyWhatIf = (): SeedWhatIf => ({ vacation: [], zeroed: {} });

export interface SeedBandRow {
  key: SeedBand["key"];
  label: string;
  rate: number;
  /** Raw power of the counted governors that falls inside this band. */
  rawPower: number;
  /** rawPower × rate. */
  countedPower: number;
}

export interface SeedRow {
  rank: number;
  id: string;
  name: string;
  power: number;
  counted: number;
}

export interface SeedResult {
  totalGovernors: number;
  countedGovernors: number;
  /** Governors ranked 301 and below (their power is ignored). */
  ignoredGovernors: number;
  ignoredPower: number;
  /** Sum of raw power of the top 300. */
  rawTopPower: number;
  counted: number;
  bands: SeedBandRow[];
  /** Among the top 300: governors above each threshold. */
  above150M: number;
  above300M: number;
  above500M: number;
  imperium: { threshold: number; reached: boolean; gap: number };
  /** Top 300, highest first. */
  top: SeedRow[];
}

/** Rank by power (desc), then name, then id, so ties are deterministic. */
function rank(govs: SeedGovernor[]): SeedGovernor[] {
  return [...govs].sort((a, b) => (b.power !== a.power ? b.power - a.power : a.name !== b.name ? (a.name < b.name ? -1 : 1) : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function simulateSeed(governors: SeedGovernor[]): SeedResult {
  const ranked = rank(governors.filter((g) => Number.isFinite(g.power) && g.power >= 0));
  const top = ranked.slice(0, SEED_RULE.topN);
  const rest = ranked.slice(SEED_RULE.topN);
  const bands: SeedBandRow[] = SEED_BANDS.map((b) => ({ key: b.key, label: b.label, rate: b.rate, rawPower: 0, countedPower: 0 }));
  let counted = 0;
  const rows: SeedRow[] = top.map((g, i) => {
    SEED_BANDS.forEach((b, j) => {
      const slice = Math.max(0, Math.min(g.power, b.to) - b.from);
      bands[j]!.rawPower += slice;
      bands[j]!.countedPower += slice * b.rate;
    });
    const c = countedPower(g.power);
    counted += c;
    return { rank: i + 1, id: g.id, name: g.name, power: g.power, counted: c };
  });
  counted = Math.round(counted);
  for (const b of bands) b.countedPower = Math.round(b.countedPower);
  return {
    totalGovernors: ranked.length,
    countedGovernors: top.length,
    ignoredGovernors: rest.length,
    ignoredPower: rest.reduce((s, g) => s + g.power, 0),
    rawTopPower: top.reduce((s, g) => s + g.power, 0),
    counted,
    bands,
    above150M: top.filter((g) => g.power > 150e6).length,
    above300M: top.filter((g) => g.power > 300e6).length,
    above500M: top.filter((g) => g.power > 500e6).length,
    imperium: { threshold: SEED_RULE.imperiumThreshold, reached: counted >= SEED_RULE.imperiumThreshold, gap: SEED_RULE.imperiumThreshold - counted },
    top: rows,
  };
}

/**
 * Apply the what-if marks: Vacation Permit holders are removed before ranking (hypothesis, gap
 * L-B03-03: the card says they leave the "matchmaking score", not this power), so the next governor
 * moves into the top 300; zeroed governors count with the typed power.
 */
export function applyWhatIf(governors: SeedGovernor[], w: SeedWhatIf): SeedGovernor[] {
  const vac = new Set(w.vacation);
  return governors.filter((g) => !vac.has(g.id)).map((g) => {
    const z = w.zeroed[g.id];
    return z !== undefined && Number.isFinite(z) && z >= 0 && z < g.power ? { ...g, power: z } : g;
  });
}

export interface SeedComparison {
  before: SeedResult;
  after: SeedResult;
  /** after.counted − before.counted (negative = kingdom power drops). */
  delta: number;
  vacationCount: number;
  zeroedCount: number;
}

export function compareWhatIf(governors: SeedGovernor[], w: SeedWhatIf): SeedComparison {
  const ids = new Set(governors.map((g) => g.id));
  const vacation = w.vacation.filter((id) => ids.has(id));
  const zeroed = Object.keys(w.zeroed).filter((id) => ids.has(id) && !vacation.includes(id) && w.zeroed[id]! < governors.find((g) => g.id === id)!.power);
  const before = simulateSeed(governors);
  const after = simulateSeed(applyWhatIf(governors, w));
  return { before, after, delta: after.counted - before.counted, vacationCount: vacation.length, zeroedCount: zeroed.length };
}

// ---------------------------------------------------------------------------
// Input: pasted list or quick counts per band

/** One power per line ("1.5m", "300k", "1,200,000") or "Name, power". Blank lines are skipped. */
export function parseGovernorLines(text: string): { governors: SeedGovernor[]; errors: LineError[]; truncated: boolean } {
  const governors: SeedGovernor[] = [];
  const errors: LineError[] = [];
  const lines = text.slice(0, SEED_LIMITS.text).split(/\r\n?|\n/);
  let truncated = false;
  lines.forEach((raw, i) => {
    const t = raw.trim();
    if (!t) return;
    if (governors.length >= SEED_LIMITS.governors) {
      truncated = true;
      return;
    }
    const direct = parseQuantity(t);
    let name = "";
    let power: number | null = direct;
    if (direct === null) {
      const s = splitNameAndNumber(t);
      if (s.number === null) return void errors.push({ line: i + 1, text: t, message: "No power on this line (write 1.5m, 300k or 1,200,000)." });
      power = parseQuantity(s.number);
      name = cleanLine(s.name, SEED_LIMITS.name);
      if (power === null) return void errors.push({ line: i + 1, text: t, message: "The power is not a number (write 1.5m, 300k or 1,200,000)." });
    }
    if (power! > SEED_LIMITS.power) return void errors.push({ line: i + 1, text: t, message: "This power is higher than any governor can have. Check the number." });
    governors.push({ id: `L${i + 1}`, name, power: power! });
  });
  return { governors, errors, truncated };
}

export type QuickBandKey = SeedBand["key"];
export interface QuickBandInput {
  count: number;
  /** Average power of the governors in this band; null = use the band default. */
  average: number | null;
}
export type QuickInput = Record<QuickBandKey, QuickBandInput>;

/** Average used when quick mode leaves it empty (assumption, listed on the page). */
export const QUICK_DEFAULT_AVERAGE: Readonly<Record<QuickBandKey, number>> = {
  "0-150M": 75e6,
  "150-300M": 225e6,
  "300-500M": 400e6,
  ">500M": 500e6,
};

export const emptyQuick = (): QuickInput => ({
  "0-150M": { count: 0, average: null },
  "150-300M": { count: 0, average: null },
  "300-500M": { count: 0, average: null },
  ">500M": { count: 0, average: null },
});

/** true when `average` fits inside its band (the top band has no upper bound). */
export function quickAverageFits(key: QuickBandKey, average: number): boolean {
  const b = SEED_BANDS.find((x) => x.key === key)!;
  if (key === "0-150M") return average > 0 && average <= b.to;
  return average > b.from && (b.to === Number.POSITIVE_INFINITY ? average <= SEED_LIMITS.power : average <= b.to);
}

/** Expand counts per band into governors (each at the band average). */
export function quickToGovernors(q: QuickInput): SeedGovernor[] {
  const out: SeedGovernor[] = [];
  for (const b of SEED_BANDS) {
    const row = q[b.key];
    const count = Math.max(0, Math.min(SEED_LIMITS.governors, Math.floor(row.count)));
    const avg = row.average !== null && quickAverageFits(b.key, row.average) ? row.average : QUICK_DEFAULT_AVERAGE[b.key];
    for (let i = 0; i < count && out.length < SEED_LIMITS.governors; i++) out.push({ id: `Q${b.key}-${i + 1}`, name: "", power: avg });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Stored simulation (kind "seed", local only)

export interface SeedDoc extends KingdomDocBase {
  title: string;
  mode: "list" | "quick";
  listText: string;
  quick: QuickInput;
  whatIf: SeedWhatIf;
}

export function emptySeedDoc(id: string, now: Date = new Date()): SeedDoc {
  return { id, updatedAt: now.toISOString(), title: "Seed simulation", mode: "list", listText: "", quick: emptyQuick(), whatIf: emptyWhatIf() };
}

const nonNeg = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0;

export function parseSeedDoc(x: unknown, fallbackId = "seed"): SeedDoc {
  const r = isRecord(x) ? x : {};
  const base = emptySeedDoc(typeof r.id === "string" && r.id && r.id.length <= 64 ? r.id : fallbackId, new Date(0));
  const quick = emptyQuick();
  if (isRecord(r.quick)) {
    for (const b of SEED_BANDS) {
      const q = (r.quick as Record<string, unknown>)[b.key];
      if (!isRecord(q)) continue;
      quick[b.key] = {
        count: nonNeg(q.count) ? Math.min(SEED_LIMITS.governors, Math.floor(q.count)) : 0,
        average: nonNeg(q.average) && quickAverageFits(b.key, q.average) ? q.average : null,
      };
    }
  }
  const whatIf = emptyWhatIf();
  if (isRecord(r.whatIf)) {
    const w = r.whatIf;
    if (Array.isArray(w.vacation)) whatIf.vacation = [...new Set(w.vacation.filter((v): v is string => typeof v === "string" && v.length <= 32))].slice(0, SEED_LIMITS.governors);
    if (isRecord(w.zeroed)) {
      for (const [k, v] of Object.entries(w.zeroed).slice(0, SEED_LIMITS.governors)) if (k.length <= 32 && nonNeg(v) && v <= SEED_LIMITS.power) whatIf.zeroed[k] = v;
    }
  }
  return {
    id: base.id,
    updatedAt: typeof r.updatedAt === "string" && Number.isFinite(Date.parse(r.updatedAt)) ? r.updatedAt : base.updatedAt,
    title: cleanLine(r.title, SEED_LIMITS.title) || base.title,
    mode: r.mode === "quick" ? "quick" : "list",
    listText: typeof r.listText === "string" ? r.listText.slice(0, SEED_LIMITS.text) : "",
    quick,
    whatIf,
  };
}

/** Governors of a stored simulation, from whichever input mode it uses. */
export function seedGovernors(doc: SeedDoc): { governors: SeedGovernor[]; errors: LineError[]; truncated: boolean } {
  if (doc.mode === "quick") return { governors: quickToGovernors(doc.quick), errors: [], truncated: false };
  return parseGovernorLines(doc.listText);
}
