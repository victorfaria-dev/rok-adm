// Building upgrade costs (F-81). Rows arrive as arguments (lean A01 tables built at build time):
// the row of level L is what it costs to reach L from L-1.

/** One level of a building table (structurally the same as apps/web LevelRow). */
export interface LevelCost {
  level: number;
  food: number | null;
  wood: number | null;
  stone: number | null;
  gold: number | null;
  /** Raw build time in seconds; null when the table has none. */
  seconds: number | null;
  /** Non-resource cost text, e.g. "Book of Covenant x2". */
  extra: string | null;
  /** The source row is garbled (merged wiki cells, "?"): its numbers are not used. */
  garbled?: boolean;
}

export interface ItemCount { name: string; count: number }

/** Read the items out of an extra-cost cell. `unreadable` when the cell has text but no item we recognise. */
export function parseExtra(text: string | null | undefined): { items: ItemCount[]; unreadable: boolean } {
  if (!text || text === "None") return { items: [], unreadable: false };
  const items: ItemCount[] = [];
  for (const m of text.matchAll(/([A-Z][A-Za-z']*(?: [A-Z][A-Za-z']*| of)*) x(\d+)/g)) items.push({ name: m[1]!, count: Number(m[2]) });
  const bp = /(?:(\d+)x\s*)?Master's Blueprint/.exec(text);
  if (bp) items.push({ name: "Master's Blueprint", count: bp[1] ? Number(bp[1]) : 1 });
  return { items, unreadable: items.length === 0 };
}

export interface UpgradeCost {
  food: number;
  wood: number;
  stone: number;
  gold: number;
  /** Raw seconds of the levels that have a time. */
  seconds: number;
  items: ItemCount[];
  /** Levels counted. */
  levels: number[];
  /** Levels whose row is garbled and left out of every total. */
  skipped: number[];
  /** Levels with no raw time in the table. */
  missingTime: number[];
  /** Levels whose extra-cost cell could not be read. */
  unreadableExtra: number[];
}

/**
 * Total cost from level `from` to level `to` (sum of rows from+1 … to). `from` = 0 means not built yet.
 * Throws RangeError for non-integer levels, from > to, or a level outside the table.
 */
export function upgradeCost(rows: readonly LevelCost[], from: number, to: number): UpgradeCost {
  if (!Number.isInteger(from) || !Number.isInteger(to)) throw new RangeError("levels must be whole numbers");
  if (from < 0) throw new RangeError("from must be 0 or more");
  if (from > to) throw new RangeError("from must not be above to");
  const byLevel = new Map(rows.map((r) => [r.level, r]));
  const max = rows.reduce((m, r) => Math.max(m, r.level), 0);
  if (to > max) throw new RangeError(`level ${to} is not in the table (max ${max})`);
  const out: UpgradeCost = { food: 0, wood: 0, stone: 0, gold: 0, seconds: 0, items: [], levels: [], skipped: [], missingTime: [], unreadableExtra: [] };
  const items = new Map<string, number>();
  for (let lv = from + 1; lv <= to; lv++) {
    const r = byLevel.get(lv);
    if (!r) throw new RangeError(`level ${lv} is not in the table`);
    if (r.garbled) { out.skipped.push(lv); continue; }
    out.levels.push(lv);
    out.food += r.food ?? 0;
    out.wood += r.wood ?? 0;
    out.stone += r.stone ?? 0;
    out.gold += r.gold ?? 0;
    const free = r.food === null && r.wood === null && r.stone === null && r.gold === null;
    if (r.seconds === null) { if (!free) out.missingTime.push(lv); } else out.seconds += r.seconds;
    const ex = parseExtra(r.extra);
    if (ex.unreadable) out.unreadableExtra.push(lv);
    for (const it of ex.items) items.set(it.name, (items.get(it.name) ?? 0) + it.count);
  }
  out.items = [...items].map(([name, count]) => ({ name, count }));
  return out;
}

/** Drop the quote marks the wiki puts around building names ("'Wall' Lv.2" → "Wall Lv.2"). */
export function cleanRequirement(text: string | null | undefined): string | null {
  if (!text || text === "None" || text === "-") return null;
  return text.replace(/'([^']+)'/g, "$1").replace(/\s+/g, " ").trim();
}
