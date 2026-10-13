// F-34 / F-30 requirements card: a kingdom's DKP formula plus its KvK requirement, as plain JSON.
// Requirements are usually "DKP ≥ X% of power", flat or by power band, measured as the change
// (delta) between a start and an end scan (B08-0002). Which power is the base is undocumented
// (gap L-B08-02), so the card always states the council's own choice (powerBasis).
// Imports only types from ./facts (bundle rule).
import { cleanLine, cleanText, isIsoTime, isRecord, newDocId, type KingdomDocBase } from "./kingdom-common";
import {
  FORMULA_MAX_CHARS, FORMULA_VARS, evaluate, linearWeights, parseFormula, usedVariables,
  type FormulaError, type FormulaVar, type FormulaVars,
} from "./kingdom-formula";

export const REQ_STAGES = ["KvK1", "KvK2", "KvK3", "SoC", "other"] as const;
export type ReqStage = (typeof REQ_STAGES)[number];

export const REQ_KINGDOM_MAX = 40;
export const REQ_TITLE_MAX = 80;
export const REQ_STAGE_OTHER_MAX = 40;
export const REQ_BASIS_MAX = 120;
export const REQ_NOTES_MAX = 1000;
export const REQ_MAX_BANDS = 10;
export const REQ_MAX_SAMPLES = 20;
export const REQ_SAMPLE_NAME_MAX = 40;
/** Highest percent of power accepted for one band (100× power). */
export const REQ_MAX_PERCENT = 10_000;
/** Largest power or stat accepted (1e15; real accounts are far below). */
export const REQ_MAX_NUMBER = 1e15;

export const DEFAULT_POWER_BASIS = "Power at the start scan";
/** How progress is measured (B08-0002): gains between the start and end scans. */
export const MEASURED_AS = "Gains between the start scan and the end scan (delta), not lifetime totals.";

export interface PowerBand {
  /** Inclusive lower bound. */
  minPower: number;
  /** Exclusive upper bound, or null for "and above" (last band only). */
  maxPower: number | null;
  /** DKP target as a percent of power, e.g. 250. */
  percent: number;
}

export type Requirement =
  | { mode: "percent"; bands: PowerBand[] }
  | { mode: "fixed"; target: number };

export interface SampleAccount {
  id: string;
  name: string;
  stats: FormulaVars;
}

export interface RequirementsCard extends KingdomDocBase {
  kingdom: string;
  title: string;
  stage: ReqStage;
  /** Free text when stage is "other". */
  stageOther: string;
  formula: string;
  /** Preset the formula started from (informational). */
  presetId: string | null;
  requirement: Requirement;
  powerBasis: string;
  notes: string;
  /** Local sandbox only: never in a share link unless asked. */
  sampleAccounts: SampleAccount[];
  /** Local sandbox only: second formula to compare rankings. */
  compareFormula: string;
}

const num = (x: unknown): number | null => (typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= REQ_MAX_NUMBER ? x : null);

// ---------------------------------------------------------------------------
// Bands

export interface BandIssue {
  /** Index of the band at fault, or -1 for the list as a whole. */
  index: number;
  message: string;
}

/** Strict validation for the editor: 1..10 bands, sorted, non-overlapping, open end only last. */
export function validateBands(bands: readonly PowerBand[]): BandIssue[] {
  const out: BandIssue[] = [];
  if (bands.length === 0) out.push({ index: -1, message: "Add at least one power band." });
  if (bands.length > REQ_MAX_BANDS) out.push({ index: -1, message: `Use at most ${REQ_MAX_BANDS} power bands.` });
  bands.forEach((b, i) => {
    const n = i + 1;
    if (num(b.minPower) === null) out.push({ index: i, message: `Band ${n}: the lowest power must be 0 or more.` });
    if (b.maxPower === null) {
      if (i !== bands.length - 1) out.push({ index: i, message: `Band ${n}: only the last band can have no upper limit.` });
    } else if (num(b.maxPower) === null || b.maxPower <= b.minPower) {
      out.push({ index: i, message: `Band ${n}: the upper limit must be more than the lowest power.` });
    }
    if (!(typeof b.percent === "number" && Number.isFinite(b.percent) && b.percent > 0 && b.percent <= REQ_MAX_PERCENT)) {
      out.push({ index: i, message: `Band ${n}: the percent must be more than 0 and at most ${REQ_MAX_PERCENT.toLocaleString("en-US")}.` });
    }
    if (i > 0) {
      const prev = bands[i - 1]!;
      if (b.minPower < prev.minPower) out.push({ index: i, message: `Band ${n}: sort bands from low to high power.` });
      else if (prev.maxPower === null || b.minPower < prev.maxPower) out.push({ index: i, message: `Band ${n} overlaps band ${i}: start it at or above where band ${i} ends.` });
    }
  });
  return out;
}

/** Tolerant: drop malformed bands, sort, drop overlaps, open end only on the last one. */
export function normaliseBands(x: unknown): PowerBand[] {
  if (!Array.isArray(x)) return [];
  const raw: PowerBand[] = [];
  for (const b of x) {
    if (!isRecord(b)) continue;
    const minPower = num(b.minPower);
    const maxPower = b.maxPower === null || b.maxPower === undefined ? null : num(b.maxPower);
    const percent = typeof b.percent === "number" && Number.isFinite(b.percent) && b.percent > 0 && b.percent <= REQ_MAX_PERCENT ? b.percent : null;
    if (minPower === null || percent === null) continue;
    if (b.maxPower !== null && b.maxPower !== undefined && (maxPower === null || maxPower <= minPower)) continue;
    raw.push({ minPower, maxPower, percent });
  }
  raw.sort((a, b) => a.minPower - b.minPower);
  const out: PowerBand[] = [];
  for (const b of raw) {
    const prev = out[out.length - 1];
    if (prev && (prev.maxPower === null || b.minPower < prev.maxPower)) continue;
    out.push(b);
    if (out.length === REQ_MAX_BANDS) break;
  }
  return out;
}

/** The band that holds this power (min ≤ power < max), or undefined when it falls in a gap. */
export function bandFor(bands: readonly PowerBand[], power: number): PowerBand | undefined {
  return bands.find((b) => power >= b.minPower && (b.maxPower === null || power < b.maxPower));
}

// ---------------------------------------------------------------------------
// Card

export function defaultRequirementsCard(over: Partial<RequirementsCard> = {}, now: Date = new Date()): RequirementsCard {
  return {
    id: newDocId(),
    updatedAt: now.toISOString(),
    kingdom: "",
    title: "",
    stage: "KvK1",
    stageOther: "",
    formula: "",
    presetId: null,
    requirement: { mode: "percent", bands: [] },
    powerBasis: DEFAULT_POWER_BASIS,
    notes: "",
    sampleAccounts: [],
    compareFormula: "",
    ...over,
  };
}

function parseStats(x: unknown): FormulaVars {
  const out: FormulaVars = {};
  if (!isRecord(x)) return out;
  for (const v of FORMULA_VARS) {
    const n = num(x[v]);
    if (n !== null) out[v] = n;
  }
  return out;
}

function parseRequirement(x: unknown): Requirement {
  if (isRecord(x) && x.mode === "fixed") {
    const t = num(x.target);
    if (t !== null) return { mode: "fixed", target: t };
  }
  return { mode: "percent", bands: isRecord(x) ? normaliseBands(x.bands) : [] };
}

/**
 * Tolerant parse of untrusted JSON (storage or share link): fixes or drops bad fields.
 * null only when the value is not an object.
 */
export function parseRequirementsCard(x: unknown): RequirementsCard | null {
  if (!isRecord(x)) return null;
  const stage = REQ_STAGES.includes(x.stage as ReqStage) ? (x.stage as ReqStage) : "other";
  const samples: SampleAccount[] = [];
  if (Array.isArray(x.sampleAccounts)) {
    for (const s of x.sampleAccounts) {
      if (!isRecord(s) || samples.length >= REQ_MAX_SAMPLES) continue;
      samples.push({ id: typeof s.id === "string" && s.id && s.id.length <= 64 ? s.id : newDocId(), name: cleanLine(s.name, REQ_SAMPLE_NAME_MAX), stats: parseStats(s.stats) });
    }
  }
  const basis = cleanLine(x.powerBasis, REQ_BASIS_MAX);
  return {
    id: typeof x.id === "string" && x.id && x.id.length <= 64 ? x.id : newDocId(),
    updatedAt: isIsoTime(x.updatedAt) ? x.updatedAt : new Date(0).toISOString(),
    kingdom: cleanLine(x.kingdom, REQ_KINGDOM_MAX),
    title: cleanLine(x.title, REQ_TITLE_MAX),
    stage,
    stageOther: stage === "other" ? cleanLine(x.stageOther, REQ_STAGE_OTHER_MAX) : "",
    formula: cleanLine(x.formula, FORMULA_MAX_CHARS),
    presetId: typeof x.presetId === "string" && x.presetId.length <= 40 ? x.presetId : null,
    requirement: parseRequirement(x.requirement),
    powerBasis: basis || DEFAULT_POWER_BASIS,
    notes: cleanText(x.notes, REQ_NOTES_MAX),
    sampleAccounts: samples,
    compareFormula: cleanLine(x.compareFormula, FORMULA_MAX_CHARS),
  };
}

export interface ShareOptions {
  /** Include the sandbox accounts (off by default: they may be other players' numbers). */
  includeSamples?: boolean;
}

/** What goes into a published link: the card without local-only sandbox data. */
export function cardSharePayload(card: RequirementsCard, opts: ShareOptions = {}): Record<string, unknown> {
  const { sampleAccounts, compareFormula: _c, ...rest } = card;
  return opts.includeSamples ? { ...rest, sampleAccounts } : rest;
}

/** Stage label for display: "KvK2", or the free text for "other". */
export function stageLabel(card: Pick<RequirementsCard, "stage" | "stageOther">): string {
  return card.stage === "other" ? card.stageOther || "Other" : card.stage;
}

// ---------------------------------------------------------------------------
// Targets and progress

export interface TargetInfo {
  target: number;
  /** Band used (percent mode only). */
  band?: PowerBand;
}

/** DKP target for this power, or null when no band covers it. */
export function targetFor(card: Pick<RequirementsCard, "requirement">, power: number): TargetInfo | null {
  const r = card.requirement;
  if (r.mode === "fixed") return { target: r.target };
  const p = Number.isFinite(power) && power > 0 ? power : 0;
  const band = bandFor(r.bands, p);
  if (!band) return null;
  const target = Math.max(0, Math.ceil((p * band.percent) / 100 - 1e-9));
  return Number.isFinite(target) ? { target, band } : null;
}

export interface Way {
  variable: FormulaVar;
  unitsNeeded: number;
}

export interface PlayerProgress {
  dkp: number;
  /** null when no band covers this power. */
  target: number | null;
  band?: PowerBand;
  /** DKP as a percent of target; null when the target is 0 or unknown. */
  percentOfTarget: number | null;
  /** DKP as a percent of power; null at zero power. */
  percentOfPower: number | null;
  /** DKP still needed (0 when met); null when the target is unknown. */
  remaining: number | null;
  met: boolean | null;
  /** Units of one variable alone that would close the gap (linear formulas only, positive weights, power excluded). */
  ways: Way[];
  /** false when the formula is not linear, so `ways` cannot be computed. */
  linear: boolean;
}

export type EvaluatePlayerResult = ({ ok: true } & PlayerProgress) | { ok: false; error: FormulaError };

/** Score one player against the card. `stats` holds gains since the start scan plus power. Never throws. */
export function evaluatePlayer(card: Pick<RequirementsCard, "formula" | "requirement">, stats: FormulaVars): EvaluatePlayerResult {
  const p = parseFormula(card.formula);
  if (!p.ok) return p;
  const r = evaluate(p.ast, stats);
  if (!r.ok) return r;
  const dkp = r.value;
  const power = typeof stats.power === "number" && Number.isFinite(stats.power) && stats.power > 0 ? stats.power : 0;
  const t = targetFor(card, power);
  const target = t ? t.target : null;
  const remaining = target === null ? null : Math.max(0, Math.ceil(target - dkp - 1e-9));
  const lin = linearWeights(p.ast);
  const ways: Way[] = [];
  if (lin && remaining !== null && remaining > 0) {
    for (const v of usedVariables(p.ast)) {
      const w = lin.weights[v];
      if (v === "power" || w === undefined || w <= 0) continue;
      const units = Math.ceil(remaining / w - 1e-9);
      if (Number.isFinite(units)) ways.push({ variable: v, unitsNeeded: units });
    }
  }
  return {
    ok: true,
    dkp,
    target,
    band: t?.band,
    percentOfTarget: target !== null && target > 0 ? (dkp / target) * 100 : null,
    percentOfPower: power > 0 ? (dkp / power) * 100 : null,
    remaining,
    met: target === null ? null : dkp >= target,
    ways,
    linear: lin !== null,
  };
}

export interface RankedRow {
  id: string;
  name: string;
  /** null when the formula fails for this account. */
  dkp: number | null;
  /** 1-based rank by DKP (ties share a rank); null when dkp is null. */
  rank: number | null;
}

/** Rank sample accounts by a formula (highest DKP first). */
export function rankSamples(formula: string, samples: readonly SampleAccount[]): RankedRow[] {
  const p = parseFormula(formula);
  const rows: RankedRow[] = samples.map((s) => {
    if (!p.ok) return { id: s.id, name: s.name, dkp: null, rank: null };
    const r = evaluate(p.ast, s.stats);
    return { id: s.id, name: s.name, dkp: r.ok ? r.value : null, rank: null };
  });
  const scored = rows.filter((r) => r.dkp !== null).sort((a, b) => b.dkp! - a.dkp!);
  scored.forEach((r, i) => {
    r.rank = i > 0 && scored[i - 1]!.dkp === r.dkp ? scored[i - 1]!.rank : i + 1;
  });
  return rows;
}
