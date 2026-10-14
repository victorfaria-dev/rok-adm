// Commander release periods (owner decision, produto/backlog-pos-ux.md § Comandantes): commanders are grouped by
// WHEN they become obtainable in a new kingdom, and questions about a commander are only asked once the player's
// kingdom is in or past that commander's period. Pure functions over data/commander-periods.json; no UI here.
import type { AccountProfile, KingdomStage } from "@rokadm/core";
import periodsJson from "../data/commander-periods.json";

/** Game order: launch (from kingdom start) < pre_kvk < kvk1 < kvk2 < kvk3 < soc. */
export type CommanderPeriodId = "launch" | "pre_kvk" | "kvk1" | "kvk2" | "kvk3" | "soc";

export interface CommanderPeriod {
  id: CommanderPeriodId;
  /** Kingdom stage the period belongs to (launch and pre_kvk are both the Preparation Season). */
  stage: KingdomStage;
  label: string;
}

export interface CommanderRelease {
  id: string;
  name: string;
  rarity: string;
  period: CommanderPeriodId;
  /** Unlocks in the offseason just before its season (e.g. Yi Seong-Gye before Season 1, A06-0701). */
  offseasonUnlock: boolean;
  /** How it is obtained when the sources say so: starting_civ, gold_chest, wheel_of_fortune, … */
  routes: string[];
  confidence: "high" | "medium" | "low";
  /** Sources disagree on the period; the period follows the newest official note. */
  conflict: boolean;
  facts: string[];
  sources: string[];
  lastConfirmed: string;
  note: string;
  /** Optional kingdom day within the period's stage before which it is not obtainable. */
  fromDay?: number | null;
}

interface PeriodsFile { asOf: string; periods: CommanderPeriod[]; commanders: CommanderRelease[] }
const DATA = periodsJson as unknown as PeriodsFile;

export const COMMANDER_PERIODS: readonly CommanderPeriod[] = DATA.periods;
export const COMMANDER_RELEASES: readonly CommanderRelease[] = DATA.commanders;
export const COMMANDER_PERIODS_AS_OF: string = DATA.asOf;

const STAGES: readonly KingdomStage[] = ["pre_kvk", "kvk1", "kvk2", "kvk3", "soc"];
const PERIOD_ORDER: readonly CommanderPeriodId[] = ["launch", "pre_kvk", "kvk1", "kvk2", "kvk3", "soc"];
const PERIOD_STAGE: Record<CommanderPeriodId, KingdomStage> = {
  launch: "pre_kvk", pre_kvk: "pre_kvk", kvk1: "kvk1", kvk2: "kvk2", kvk3: "kvk3", soc: "soc",
};

/** Where the player's kingdom is. */
export interface KingdomProgress {
  stage: KingdomStage;
  /** Days since the kingdom opened, if known. Only used for commanders with `fromDay`. */
  kingdomDay?: number | null;
  /** The kingdom is in the offseason right after `stage`, before the next season starts. */
  offseason?: boolean;
}

/** past = its period is earlier than the player's; current = same period; future = not reached yet. */
export type CommanderTiming = "past" | "current" | "future";

function stageIndex(stage: KingdomStage): number {
  const i = STAGES.indexOf(stage);
  if (i < 0) throw new Error(`Unknown kingdom stage: ${String(stage)}`);
  return i;
}

export function periodStage(period: CommanderPeriodId): KingdomStage {
  const s = PERIOD_STAGE[period];
  if (!s) throw new Error(`Unknown commander period: ${String(period)}`);
  return s;
}

/** Progress from the questionnaire profile. The profile has no offseason flag, so pass it when known. */
export function progressFromProfile(
  profile: Pick<AccountProfile, "kingdomStage" | "kingdomDay">,
  offseason = false,
): KingdomProgress {
  return { stage: profile.kingdomStage, kingdomDay: profile.kingdomDay, offseason };
}

/** Timing of one commander relative to the player's kingdom. */
export function commanderTiming(commander: CommanderRelease, progress: KingdomProgress): CommanderTiming {
  const own = stageIndex(periodStage(commander.period));
  const player = stageIndex(progress.stage);
  if (own < player) return "past";
  if (own === player) {
    const day = progress.kingdomDay;
    const from = commander.fromDay;
    return from != null && day != null && day < from ? "future" : "current";
  }
  if (own === player + 1 && progress.offseason && commander.offseasonUnlock) return "current";
  return "future";
}

export function getCommanderRelease(id: string, list: readonly CommanderRelease[] = COMMANDER_RELEASES): CommanderRelease | undefined {
  return list.find((c) => c.id === id);
}

/** Timing by id; "unknown" when the commander is not in the dataset (no sourced period). */
export function commanderTimingById(
  id: string,
  progress: KingdomProgress,
  list: readonly CommanderRelease[] = COMMANDER_RELEASES,
): CommanderTiming | "unknown" {
  const c = getCommanderRelease(id, list);
  return c ? commanderTiming(c, progress) : "unknown";
}

/**
 * Should the app ask the player about this commander? Only when the kingdom is in or past the commander's period.
 * A commander with no sourced period ("unknown") is not hidden: missing data must not remove a question.
 */
export function shouldAskAboutCommander(
  id: string,
  progress: KingdomProgress,
  list: readonly CommanderRelease[] = COMMANDER_RELEASES,
): boolean {
  return commanderTimingById(id, progress, list) !== "future";
}

function byGameOrder(a: CommanderRelease, b: CommanderRelease): number {
  return PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period) || a.name.localeCompare(b.name);
}

export interface ClassifiedCommanders {
  current: CommanderRelease[];
  past: CommanderRelease[];
  future: CommanderRelease[];
}

/** Splits commanders into current, past and future for the player's kingdom, each in game order. */
export function classifyCommanders(
  progress: KingdomProgress,
  list: readonly CommanderRelease[] = COMMANDER_RELEASES,
): ClassifiedCommanders {
  const out: ClassifiedCommanders = { current: [], past: [], future: [] };
  for (const c of [...list].sort(byGameOrder)) out[commanderTiming(c, progress)].push(c);
  return out;
}

export interface CommanderPeriodGroup { period: CommanderPeriod; commanders: CommanderRelease[] }

/** Commanders grouped by release period, in game order (empty periods kept so the progression stays visible). */
export function groupCommandersByPeriod(list: readonly CommanderRelease[] = COMMANDER_RELEASES): CommanderPeriodGroup[] {
  return COMMANDER_PERIODS.map((period) => ({
    period,
    commanders: list.filter((c) => c.period === period.id).sort(byGameOrder),
  }));
}
