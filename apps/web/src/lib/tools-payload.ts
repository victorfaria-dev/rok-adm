// BUILD-TIME ONLY (like guide-payload.ts). Reads the fact dataset, the data tables and
// packages/planner/tools-data, and returns lean, client-safe values for the /tools/ islands
// (passed as props). Never import this from an island: check-budget fails the build if the
// fact dataset reaches client JS.
import { getFact, getTable, latestPatch, manifest, type Cell } from "@rokadm/data";
import { factConfidence } from "@rokadm/planner";
import { mergeCites, parseDuration, type Cite, type SourcedValue } from "@rokadm/planner/tools";
import type { Confidence } from "@rokadm/core";

export const LATEST_OFFICIAL = latestPatch({ minConfidence: "alta" });

/** A card is "re-verify" when it was withdrawn, or last confirmed before the latest official patch. */
export function isStale(id: string): boolean {
  const f = getFact(id);
  if (!f) return true;
  if (f.invalidatedBy || f.status === "obsoleto" || f.status === "parcialmente_obsoleto") return true;
  const cut = LATEST_OFFICIAL?.date ?? null;
  return !!(cut && f.validUntil && f.validUntil < cut);
}

/** Citation for a set of fact ids (weakest confidence; unknown ids → pending + stale). */
export function cite(ids: readonly string[]): Cite {
  const uniq = [...new Set(ids)].sort();
  return mergeCites(
    ...uniq.map((id) => ({ facts: [id], confidence: factConfidence(getFact(id)) as Confidence, stale: isStale(id) })),
  );
}

/** A tools-data entry ({value, unit, facts}) as a SourcedValue with computed confidence. */
export function sourced<T>(entry: { value: T; unit?: string; facts: string[] }): SourcedValue<T> {
  return { value: entry.value, ...(entry.unit ? { unit: entry.unit } : {}), ...cite(entry.facts) };
}

/** One row of a cited card for the "Sources on this page" list. */
export interface SourceRow {
  id: string;
  title: string;
  confidence: Confidence;
  verifiedOn: string | null;
  stale: boolean;
}

export function sourceRows(ids: Iterable<string>): SourceRow[] {
  return [...new Set(ids)].sort().map((id) => {
    const f = getFact(id);
    return {
      id,
      title: f?.title ?? "Ficha fora do conjunto de dados",
      confidence: factConfidence(f) as Confidence,
      verifiedOn: f?.validUntil ?? null,
      stale: isStale(id),
    };
  });
}

/** Data stamp shown on every tool (F-81 b). */
export interface DataStamp {
  datasetVersion: string;
  official: { version: string; date: string | null } | null;
  latest: { version: string; date: string | null } | null;
}

export function dataStamp(): DataStamp {
  const o = manifest.latestOfficialPatch, l = manifest.latestKnownPatch;
  return {
    datasetVersion: manifest.datasetVersion,
    official: o ? { version: o.version, date: o.date } : null,
    latest: l ? { version: l.version, date: l.date } : null,
  };
}

// ---------------------------------------------------------------- level tables

/** One level of a building table, numbers only (null = not in the table). */
export interface LevelRow {
  level: number;
  food: number | null;
  wood: number | null;
  stone: number | null;
  gold: number | null;
  /** Raw build time in seconds; null when the table has none (e.g. level 1 is free). */
  seconds: number | null;
  /** Non-resource cost, e.g. "Book of Covenant x2". */
  extra: string | null;
  /** Selected extra numeric columns (e.g. hospital capacity), parsed from "7,500" style text. */
  stats: Record<string, number | null>;
  /** "Requirements" cell as printed (e.g. "City Hall Lv.6"); null when absent or "None". */
  requirements: string | null;
  /** The cost cell is garbled in the source (merged wiki cells, "?", or no cost and no time above level 1). */
  garbled: boolean;
}

export interface LevelTable {
  name: string;
  rows: LevelRow[];
  cite: Cite;
}

const n = (c: Cell | undefined): number | null => {
  if (typeof c === "number" && Number.isFinite(c)) return c;
  if (typeof c === "string") {
    const t = c.replace(/,/g, "").trim();
    if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
  }
  return null;
};

/** A building/level table as lean rows. `levelCol` is the level column ("Level" or "Lvl"). */
export function levelTable(name: string, statCols: readonly string[] = []): LevelTable {
  const t = getTable(name);
  const levelCol = t.columns.includes("Level") ? "Level" : t.columns.includes("Lvl") ? "Lvl" : "level";
  const rows: LevelRow[] = [];
  for (const r of t.rows) {
    const level = n(r[levelCol]);
    if (level === null) continue;
    const extra = typeof r.extra_cost === "string" && r.extra_cost !== "None" ? r.extra_cost : null;
    const seconds = n(r.time_seconds) ?? (typeof r.time_raw === "string" ? parseDuration(r.time_raw) : null);
    const food = n(r.food), wood = n(r.wood), stone = n(r.stone), gold = n(r.gold);
    const costCell = typeof r.Cost === "string" ? r.Cost : typeof r.Resources === "string" ? r.Resources : "";
    // "…1x size = 24" is a wiki template fragment glued to some level-25 cells; anything else with a
    // second "=" or a "?" is a merged/unknown cell whose numbers cannot be trusted.
    const cleanCost = costCell.replace(/(1x )?size = 24.*$/, "");
    const garbled = /=.*=|\?/.test(cleanCost)
      || (level > 1 && food === null && wood === null && stone === null && gold === null && seconds === null);
    const req = typeof r.Requirements === "string" && r.Requirements !== "None" && r.Requirements !== "-" ? r.Requirements : null;
    rows.push({
      level, food, wood, stone, gold, seconds, extra,
      stats: Object.fromEntries(statCols.map((c) => [c, n(r[c])])),
      requirements: req, garbled,
    });
  }
  rows.sort((a, b) => a.level - b.level);
  return { name, rows, cite: cite(t.factIds) };
}
