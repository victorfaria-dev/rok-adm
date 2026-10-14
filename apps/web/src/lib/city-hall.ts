// City Hall tab (UX stage 1): pure helpers. The page composes what already exists: today's must-dos
// from the routine planner, the next City Hall level from the A01 building table, and the guide's
// KvK1 targets (Budget reality check, F2P baseline) as simple gauges. No DOM, no storage.
import type { AccountProfile } from "@rokadm/core";
import type { PlannedTask } from "@rokadm/planner";
import { cleanRequirement, formatDuration, upgradeCost, type LevelCost } from "@rokadm/planner/tools";

export interface ChRow extends LevelCost { requirements: string | null }

/** Build-time numbers from the planner's reality check (F2P baseline), lean for the island. */
export interface CityHallTargets {
  kvk1Day: number;
  /** CH that player reports call workable for KvK1. */
  chWorkable: number;
  /** CH an F2P account is not expected to reach by KvK1. */
  chNotExpected: number;
  lostKingdomCH: number;
  t4Day: number;
  powerMillions: { min: number; max: number };
  vipTargets: number[];
  /** One-time gem rewards tied to a City Hall level, in level order. */
  chMilestones: { label: string; gems: number; cityHall: number }[];
}

/** Today: must-dos first, then the rest in plan order; at most `n`. */
export function todayTop(included: readonly PlannedTask[], n = 3): PlannedTask[] {
  return [...included.filter((t) => t.mustDo), ...included.filter((t) => !t.mustDo)].slice(0, n);
}

export interface NextLevel {
  from: number;
  to: number;
  /** Resource lines with an amount above zero, e.g. ["Food 1,200,000", ...]. */
  resources: string[];
  items: string[];
  time: string | null;
  requirement: string | null;
  /** The source row is garbled: numbers left out. */
  unreadable: boolean;
}

const fmt = (n: number): string => n.toLocaleString("en-US");

/** The next City Hall level's cost and requirement, or null at the top level or off the table. */
export function nextLevel(rows: readonly ChRow[], cityHall: number): NextLevel | null {
  const to = cityHall + 1;
  const row = rows.find((r) => r.level === to);
  if (!row) return null;
  let cost;
  try {
    cost = upgradeCost(rows, cityHall, to);
  } catch {
    return null;
  }
  const resources = (
    [["Food", cost.food], ["Wood", cost.wood], ["Stone", cost.stone], ["Gold", cost.gold]] as const
  ).filter(([, v]) => v > 0).map(([k, v]) => `${k} ${fmt(v)}`);
  return {
    from: cityHall,
    to,
    resources,
    items: cost.items.map((i) => `${i.name} ×${fmt(i.count)}`),
    time: cost.seconds > 0 ? formatDuration(cost.seconds) : null,
    requirement: cleanRequirement(row.requirements),
    unreadable: cost.skipped.length > 0,
  };
}

export interface Gauge {
  current: number;
  target: number;
  /** 0..1 */
  ratio: number;
  reached: boolean;
}

export function gauge(current: number, target: number): Gauge {
  const ratio = target <= 0 ? 1 : Math.max(0, Math.min(1, current / target));
  return { current, target, ratio, reached: current >= target };
}

export type AlertKind = "setup" | "mustdo" | "warning" | "late" | "data";
export interface CityAlert { kind: AlertKind; text: string; href?: string; link?: string }

/** Alerts under the status gauges: built only from what the planner and the core already report. */
export function cityAlerts(o: {
  hasProfile: boolean;
  mustDoMissing: number;
  budgetMinutes: number;
  warnings: readonly string[];
  kingdomDay: number | null;
  kvk1Day: number;
  unreadableNext: boolean;
}): CityAlert[] {
  const out: CityAlert[] = [];
  if (!o.hasProfile) out.push({ kind: "setup", text: "These are default answers. Answer 5 quick questions so the plan fits your account.", href: "/start/", link: "Start" });
  if (o.mustDoMissing > 0) {
    out.push({
      kind: "mustdo",
      text: `${o.mustDoMissing} must-do ${o.mustDoMissing === 1 ? "task does" : "tasks do"} not fit in ${o.budgetMinutes} min today.`,
      href: "/city-hall/today/", link: "Pick more time",
    });
  }
  for (const w of o.warnings) out.push({ kind: "warning", text: w });
  if (o.kingdomDay !== null && o.kingdomDay > o.kvk1Day) out.push({ kind: "late", text: "Your kingdom is past KvK1: the KvK1 targets below are behind you.", href: "/guides/late-game/", link: "Late game guide" });
  if (o.unreadableNext) out.push({ kind: "data", text: "The source table row for your next City Hall is garbled: check its cost in game." });
  return out;
}

export interface StageTool {
  href: string;
  title: string;
  why: string;
}

const T = {
  pack: { href: "/tools/pack-value/", title: "Pack value", why: "Check a pack's gems per dollar before you buy." },
  buildings: { href: "/tools/buildings/", title: "Building costs", why: "Resources and time for the next levels." },
  speedups: { href: "/tools/speedups/", title: "Speedups and time", why: "Add up your speedups against a long upgrade." },
  vip: { href: "/tools/vip/", title: "Gems to VIP", why: "Days and gems to your next VIP level." },
  kvk: { href: "/tools/kvk/", title: "KvK readiness", why: "A checklist before your kingdom's first KvK." },
  healing: { href: "/tools/healing/", title: "Healing planner", why: "What one full hospital costs to heal." },
  migration: { href: "/tools/migration/", title: "Migration checker", why: "Can you move, and what is missing." },
} satisfies Record<string, StageTool>;

/**
 * The tools that matter at this stage (at most 3): growth tools before KvK, fight tools after;
 * spenders get Pack value first. "My commanders" is its own tile on the City Hall sheet.
 */
export function stageTools(p: AccountProfile): StageTool[] {
  const early = p.kingdomStage === "pre_kvk";
  const list: StageTool[] = early
    ? [T.buildings, T.speedups, p.cityHall >= 16 ? T.kvk : T.vip]
    : [T.healing, T.speedups, T.migration];
  if (p.spending !== "f2p") list.unshift(T.pack);
  return list.slice(0, 3);
}
