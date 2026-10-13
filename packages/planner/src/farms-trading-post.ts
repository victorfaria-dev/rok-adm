// F-67 Trading Post transfer calculator. Pure functions; no UI, no I/O.
import type { Confidence } from "@rokadm/core";
import tradingPostJson from "../data/trading-post.json";
import { confidenceOf, minConfidence } from "./facts";
import { FARMS_DATA, farmIndex, evidenceOf, isResource, type FarmFactsOption, type Resource, type TransferWarningCode } from "./farms-common";

export interface TradingPostLevel {
  level: number;
  /** 0.35 = 35% (A03-0024, alta). */
  taxRate: number;
  /** Capacity per trip (A03-0025: L25 official; L1–L24 one wiki table, contested). */
  capacity: number;
  /** Requirement as written in the table, e.g. "City Hall Lv.12", "Goldmine Lv.10"; "" when none. */
  requirement: string;
  facts: string[];
}

/** Levels 1..25, generated from research/facts/A03/data/trading-post.csv. */
export const TRADING_POST_LEVELS: readonly TradingPostLevel[] = (tradingPostJson as { levels: TradingPostLevel[] }).levels;
export const TRADING_POST_MAX_LEVEL = 25;

export interface TradingPostUnlockNote {
  text: string;
  /** City Hall level the most sources point to (12). */
  probableCityHall: number;
  /** The other value in circulation (10). */
  otherCityHall: number;
  status: "contested";
  facts: string[];
  gaps: string[];
  confidence: Confidence;
}

/** Trading Post unlock City Hall is contested (CH12 vs CH10, A03-0025): show it as such. */
export const TP_UNLOCK_NOTE: TradingPostUnlockNote = (() => {
  const u = FARMS_DATA.tradingPostUnlock;
  return {
    text: u.text, probableCityHall: u.probableCityHall, otherCityHall: u.otherCityHall, status: "contested",
    facts: [...u.facts], gaps: [...u.gaps], confidence: confidenceOf(u.facts, farmIndex()),
  };
})();

export function tradingPostLevel(level: number): TradingPostLevel | undefined {
  return TRADING_POST_LEVELS.find((l) => l.level === level);
}

// ---------------------------------------------------------------------------
// Tax math

function assertAmount(name: string, v: number): void {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) throw new RangeError(`${name} must be a finite number >= 0`);
}
function assertTax(t: number): void {
  if (typeof t !== "number" || !Number.isFinite(t) || t < 0 || t >= 1) throw new RangeError("taxRate must be in [0, 1)");
}
/** Float-safe rounding: 79 / 0.79 must give 100, not 101. */
function nearInt(x: number): number | null {
  const r = Math.round(x);
  return Math.abs(x - r) <= Math.max(1e-9, Math.abs(x) * 8 * Number.EPSILON) ? r : null;
}
function finiteOrThrow(x: number): number {
  if (!Number.isFinite(x)) throw new RangeError("result is too large");
  return x;
}

/** Amount the farm must send so the main receives `net`: ceil(net / (1 − tax)). DERIVED from A03-0024. */
export function grossForNet(net: number, taxRate: number): number {
  assertAmount("net", net);
  assertTax(taxRate);
  const x = net / (1 - taxRate);
  return finiteOrThrow(nearInt(x) ?? Math.ceil(x));
}

/** Amount the main receives when the farm sends `gross`: floor(gross × (1 − tax)). */
export function netForGross(gross: number, taxRate: number): number {
  assertAmount("gross", gross);
  assertTax(taxRate);
  const x = gross * (1 - taxRate);
  return finiteOrThrow(nearInt(x) ?? Math.floor(x));
}

/** How many times the net the farm must send: 1 / (1 − tax). 21% → 1.27×, 10% → 1.11× (A03-0024, derived). */
export function grossRatio(taxRate: number): number {
  assertTax(taxRate);
  return 1 / (1 - taxRate);
}

// ---------------------------------------------------------------------------
// Transfer plan

export interface TransferInput {
  /** What the main must receive. */
  netNeeded: number;
  /** Farm Trading Post level (1..25), or null when unknown. */
  level?: number | null;
  /** Tax rate seen in game (0..<1). Wins over the table. */
  taxRateOverride?: number | null;
  /** Capacity per trip seen in game. Wins over the table. */
  capacityOverride?: number | null;
  resource: Resource;
  /** Raw stock of `resource` on the farm. */
  farmStock?: number | null;
  /** Farm Storehouse protection for `resource` (typed by the player; sources differ, A03-0006). */
  storehouseProtection?: number | null;
  /** Free march queues on the farm (each trip uses one, A03-0026). */
  marches?: number | null;
}

export interface TransferWarning {
  code: TransferWarningCode;
  text: string;
  facts: string[];
  gaps: string[];
  confidence: Confidence;
  hypothesis: boolean;
}

export type ValueSource = "table" | "override" | "unknown";

export interface TransferPlan {
  resource: Resource;
  netNeeded: number;
  taxRate: number | null;
  taxSource: ValueSource;
  capacityPerTrip: number | null;
  capacitySource: ValueSource;
  /** Amount the farm sends (before tax), or null when the tax rate is unknown. */
  gross: number | null;
  /** gross − netNeeded. */
  tax: number | null;
  /** ceil(gross / capacity). Assumes the gross amount counts against capacity (hypothesis, see warnings). */
  trips: number | null;
  /** farmStock − protection, floored at 0; null if either is unknown. */
  shippable: number | null;
  /** gross − shippable when positive, 0 when it fits, null when unknown. */
  shortfall: number | null;
  /** ceil(trips / marches) when both are known. */
  rounds: number | null;
  warnings: TransferWarning[];
  facts: string[];
  confidence: Confidence;
}

function optAmount(name: string, v: number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  assertAmount(name, v);
  return v;
}

export function planTransfer(input: TransferInput, opts: FarmFactsOption = {}): TransferPlan {
  const index = farmIndex(opts);
  assertAmount("netNeeded", input.netNeeded);
  if (!isResource(input.resource)) throw new RangeError(`unknown resource: ${String(input.resource)}`);
  const level = input.level ?? null;
  if (level !== null && (!Number.isInteger(level) || level < 1 || level > TRADING_POST_MAX_LEVEL)) {
    throw new RangeError(`level must be an integer 1..${TRADING_POST_MAX_LEVEL}`);
  }
  const taxOverride = input.taxRateOverride ?? null;
  if (taxOverride !== null) assertTax(taxOverride);
  const capOverride = input.capacityOverride ?? null;
  if (capOverride !== null && (!Number.isFinite(capOverride) || capOverride <= 0)) throw new RangeError("capacityOverride must be > 0");
  const farmStock = optAmount("farmStock", input.farmStock);
  const protection = optAmount("storehouseProtection", input.storehouseProtection);
  const marches = input.marches ?? null;
  if (marches !== null && (!Number.isInteger(marches) || marches < 1)) throw new RangeError("marches must be an integer >= 1");

  const row = level !== null ? tradingPostLevel(level) : undefined;
  const taxRate = taxOverride ?? row?.taxRate ?? null;
  const taxSource: ValueSource = taxOverride !== null ? "override" : row ? "table" : "unknown";
  const capacityPerTrip = capOverride ?? row?.capacity ?? null;
  const capacitySource: ValueSource = capOverride !== null ? "override" : row ? "table" : "unknown";

  const gross = taxRate !== null ? grossForNet(input.netNeeded, taxRate) : null;
  const tax = gross !== null ? gross - input.netNeeded : null;
  // Capacity cap: we assume the amount the farm SENDS (gross, before tax) counts against
  // capacity per trip. No card states whether the cap applies before or after tax
  // (A03-0025), so this is flagged as a hypothesis in the warnings ("capacity_counts_gross").
  const trips = gross !== null && capacityPerTrip !== null ? Math.ceil(gross / capacityPerTrip) : null;
  const shippable = farmStock !== null && protection !== null ? Math.max(0, farmStock - protection) : null;
  const shortfall = gross !== null && shippable !== null ? Math.max(0, gross - shippable) : null;
  const rounds = trips !== null && marches !== null ? Math.ceil(trips / marches) : null;

  const codes: TransferWarningCode[] = [];
  if (taxRate === null) codes.push("tax_unknown");
  if (input.resource === "gold") codes.push("gold_pending_t0");
  codes.push("protected_not_shippable", "protection_is_input");
  if (capacitySource === "unknown") codes.push("capacity_unknown");
  else if (capacitySource === "table" && level !== TRADING_POST_MAX_LEVEL) codes.push("capacity_contested");
  if (trips !== null) codes.push("capacity_counts_gross");
  codes.push("march_queue");
  const warnings: TransferWarning[] = codes.map((code) => {
    const w = FARMS_DATA.transferWarnings[code];
    const ev = evidenceOf(w.facts, w.gaps, w.hypothesis, index);
    return { code, text: w.text, facts: ev.facts, gaps: ev.gaps, confidence: ev.confidence, hypothesis: ev.hypothesis };
  });

  // Numbers rest on the tax formula (A03-0024) and, when taken from the table, the capacity table (A03-0025).
  const numberFacts = ["A03-0024", ...(capacitySource === "table" ? ["A03-0025"] : [])];
  let confidence = confidenceOf(numberFacts, index);
  if (taxRate === null) confidence = "pending";
  else if (trips !== null) confidence = minConfidence(confidence, "low"); // trips rest on the capacity-vs-gross hypothesis
  const facts = [...new Set([...numberFacts, ...warnings.flatMap((w) => w.facts)])].sort();

  return {
    resource: input.resource, netNeeded: input.netNeeded,
    taxRate, taxSource, capacityPerTrip, capacitySource,
    gross, tax, trips, shippable, shortfall, rounds,
    warnings, facts, confidence,
  };
}
