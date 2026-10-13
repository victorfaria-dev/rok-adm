// Formula library (F-50 v0). Every number comes from a fact card or its CSV table; nothing about the
// game is hardcoded here except which card/table/column a formula reads. Each result carries the
// fact ids it used and the minimum confidence among them.
import type { Fact, UsabilityPolicy } from "@rokadm/core";
import { getTable, requireFact, type DataTable } from "./dataset";
import { DEFAULT_POLICY, isUsable, minConfidence } from "./policy";

export interface FormulaResult<T> {
  value: T;
  /** Fact ids the value was derived from. */
  inputs: string[];
  /** Minimum confidence of the inputs. */
  confidence: Fact["confidence"];
  /** True only if every input passes the usability policy (firm statement allowed). */
  usable: boolean;
  /** Readings/assumptions the value depends on (shown next to the number). */
  assumptions: string[];
}

/** Injectable data access, so formulas can be tested against fixtures. Defaults to the generated dataset. */
export interface FormulaData {
  fact(id: string): Fact;
  table(name: string): DataTable;
}

export const defaultData: FormulaData = { fact: requireFact, table: getTable };

function result<T>(value: T, ids: string[], data: FormulaData, assumptions: string[] = [], policy: UsabilityPolicy = DEFAULT_POLICY): FormulaResult<T> {
  const fs = ids.map((id) => data.fact(id));
  return {
    value,
    inputs: [...ids],
    confidence: minConfidence(fs.map((f) => f.confidence)),
    usable: fs.every((f) => isUsable(f, policy)),
    assumptions,
  };
}

/** Table rows keyed by an integer level column. */
function levelRows(t: DataTable, levelCol: string): Map<number, Record<string, string | number | null>> {
  const m = new Map<number, Record<string, string | number | null>>();
  for (const r of t.rows) {
    const lv = r[levelCol];
    if (typeof lv === "number") m.set(lv, r);
  }
  return m;
}

function num(v: unknown, what: string): number {
  if (typeof v !== "number" || !Number.isFinite(v)) throw new Error(`${what}: no numeric value in the data`);
  return v;
}

function checkRange(from: number, to: number, levels: Map<number, unknown>, what: string, minFrom = 1): void {
  const max = Math.max(...levels.keys());
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < minFrom || to > max || from > to) {
    throw new RangeError(`${what}: need integers ${minFrom} <= from <= to <= ${max}, got ${from}..${to}`);
  }
}

// ---------------------------------------------------------------- A01 City Hall

export const CITY_HALL = { fact: "A01-0001", table: "A01-city-hall", level: "Level", seconds: "time_seconds" } as const;

/** Raw (unbuffed) City Hall build time in seconds to go from level `from` to level `to`
 * (sum of the upgrade times of levels from+1..to). Source: A01-0001 / city-hall.csv. */
export function cityHallBuildSeconds(from: number, to: number, data: FormulaData = defaultData): FormulaResult<number> {
  const rows = levelRows(data.table(CITY_HALL.table), CITY_HALL.level);
  checkRange(from, to, rows, "cityHallBuildSeconds");
  let s = 0;
  for (let lv = from + 1; lv <= to; lv++) s += num(rows.get(lv)?.[CITY_HALL.seconds], `City Hall level ${lv} time`);
  return result(s, [CITY_HALL.fact], data, ["raw build times, no speed buffs or helps; City Hall only (not its prerequisite buildings)"]);
}

export interface ResourceCost { food: number; wood: number; stone: number; gold: number; extra: string[] }

/** Raw City Hall upgrade cost from `from` to `to` (levels from+1..to). Empty cells count as 0 of that resource. */
export function cityHallUpgradeCost(from: number, to: number, data: FormulaData = defaultData): FormulaResult<ResourceCost> {
  const rows = levelRows(data.table(CITY_HALL.table), CITY_HALL.level);
  checkRange(from, to, rows, "cityHallUpgradeCost");
  const c: ResourceCost = { food: 0, wood: 0, stone: 0, gold: 0, extra: [] };
  for (let lv = from + 1; lv <= to; lv++) {
    const r = rows.get(lv)!;
    for (const k of ["food", "wood", "stone", "gold"] as const) {
      const v = r[k];
      if (v !== null && v !== undefined) c[k] += num(v, `City Hall level ${lv} ${k}`);
    }
    const extra = r.extra_cost;
    if (typeof extra === "string" && extra !== "None") c.extra.push(`L${lv}: ${extra}`);
  }
  return result(c, [CITY_HALL.fact], data, ["raw costs, no cost reductions"]);
}

// ---------------------------------------------------------------- A05 VIP

export const VIP = { fact: "A05-0001", table: "A05-vip-levels", level: "vip_level", points: "vip_points_threshold" } as const;

/** VIP points needed to go from VIP `from` to VIP `to`, reading the A05-0001 thresholds as cumulative
 * totals (VIP 0 = 0 points). */
export function vipPointsBetween(from: number, to: number, data: FormulaData = defaultData): FormulaResult<number> {
  const rows = levelRows(data.table(VIP.table), VIP.level);
  checkRange(from, to, rows, "vipPointsBetween", 0);
  const at = (lv: number) => (lv === 0 ? 0 : num(rows.get(lv)?.[VIP.points], `VIP ${lv} threshold`));
  return result(at(to) - at(from), [VIP.fact], data, [
    "thresholds read as cumulative totals (A05-0001 notes: T4-supported, T0 pending)",
  ]);
}

// ---------------------------------------------------------------- A03 Trading Post

export const TRADING_POST = { fact: "A03-0024", table: "A03-trading-post", level: "Level", tax: "Tax Rate" } as const;

/** Trading Post tax rate at a level, as a fraction (0.35 = 35%). Source: A03-0024 / trading-post.csv. */
export function tradingPostTaxRate(level: number, data: FormulaData = defaultData): FormulaResult<number> {
  const rows = levelRows(data.table(TRADING_POST.table), TRADING_POST.level);
  checkRange(level, level, rows, "tradingPostTaxRate");
  const raw = rows.get(level)?.[TRADING_POST.tax];
  const m = typeof raw === "string" ? /^(\d+(?:\.\d+)?)%$/.exec(raw.trim()) : null;
  if (!m?.[1]) throw new Error(`Trading Post level ${level}: tax '${String(raw)}' is not a percentage`);
  return result(Number(m[1]) / 100, [TRADING_POST.fact], data);
}

/** Resources the receiver gets when `sent` is transferred at a Trading Post level: sent × (1 − tax). */
export function tradingPostReceived(sent: number, level: number, data: FormulaData = defaultData): FormulaResult<number> {
  const t = tradingPostTaxRate(level, data);
  return { ...t, value: sent * (1 - t.value), assumptions: ["in-game rounding not modelled"] };
}

/** Resources that must be sent so the receiver gets `received`: received / (1 − tax) (A03-0024 notes). */
export function tradingPostSendFor(received: number, level: number, data: FormulaData = defaultData): FormulaResult<number> {
  const t = tradingPostTaxRate(level, data);
  return { ...t, value: received / (1 - t.value), assumptions: ["in-game rounding not modelled"] };
}
