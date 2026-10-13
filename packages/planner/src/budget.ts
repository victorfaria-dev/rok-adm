// F-14 Budget Reality Check. Pure functions; every number comes from data/ (fact-backed).
import type { AccountProfile, Confidence, SpendingProfile } from "@rokadm/core";
import budgetJson from "../data/budget-inputs.json";
import vipJson from "../data/vip-levels.json";
import { confidenceOf, indexFacts, minConfidence, missingFacts, BUNDLED_FACTS, type FactIndex, type FactMeta } from "./facts";

export interface Sourced<T> {
  value: T;
  unit: string;
  facts: string[];
  confidence: Confidence;
  /** true when the planner computed it from card values (not stated by a card). */
  derived: boolean;
  /** Gaps that a T0 measurement would settle. */
  pendingGaps: string[];
  note?: string;
}

interface InputRow<T> { value: T; unit: string; facts: string[]; derived?: boolean; pendingGaps?: string[]; confidenceCap?: Confidence }
interface BudgetData {
  asOf: string;
  researchedProfiles: SpendingProfile[];
  inputs: {
    dailyObjectivesGems: InputRow<number>;
    vipDailyStart: InputRow<number>;
    vipDailyIncrement: InputRow<number>;
    vipDailyCap: InputRow<number>;
    gemToVip: InputRow<number>;
    dailyObjectivesSpeedupMinutes: InputRow<number>;
    kvk1StartDay: InputRow<number>;
    chAtKvK1F2P: InputRow<{ workableMin: number; notExpected: number }>;
    t4Day: InputRow<number>;
    powerAtKvK1F2P: InputRow<{ minMillions: number; maxMillions: number }>;
    lostKingdomEntryCH: InputRow<number>;
    vipTargets: InputRow<number[]>;
  };
  oneTimeGems: Array<{ id: string; label: string; value: number; unlockCityHall: number | null; facts: string[]; confidenceCap?: Confidence }>;
  unquantifiedGemSources: { text: string; facts: string[]; gaps: string[] };
  checkpoints: number[];
}

export const BUDGET_DATA = budgetJson as unknown as BudgetData;
export interface VipLevel { vip: number; threshold: number; reading: string; facts: string[] }
export const VIP_LEVELS: readonly VipLevel[] = (vipJson as { levels: VipLevel[] }).levels;

function sourced<T>(row: InputRow<T>, index: FactIndex, extra: Partial<Sourced<T>> = {}): Sourced<T> {
  let c = confidenceOf(row.facts, index);
  if (row.confidenceCap) c = minConfidence(c, row.confidenceCap);
  return {
    value: row.value,
    unit: row.unit,
    facts: [...row.facts],
    confidence: c,
    derived: row.derived ?? false,
    pendingGaps: [...(row.pendingGaps ?? [])],
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// VIP math (A05-0001 thresholds as cumulative totals, A05-0003 daily ramp, A05-0004 1 gem = 1 VIP)

export interface VipIncome {
  start: number;      // VIP points on day 1 of the streak
  increment: number;  // + per consecutive day
  cap: number;        // max per day
  extraPerDay: number; // e.g. gems converted to VIP points
}

export function defaultVipIncome(withDailyGems: boolean, data: BudgetData = BUDGET_DATA): VipIncome {
  const i = data.inputs;
  return {
    start: i.vipDailyStart.value,
    increment: i.vipDailyIncrement.value,
    cap: i.vipDailyCap.value,
    extraPerDay: withDailyGems ? i.dailyObjectivesGems.value * i.gemToVip.value : 0,
  };
}

/** Cumulative VIP points after `day` days of an unbroken streak (day 1 = first claim). */
export function vipPointsAfter(day: number, inc: VipIncome): number {
  if (day <= 0) return 0;
  // Days until the cap is reached (inclusive): start + increment*(k-1) >= cap.
  const rampDays = inc.increment > 0 ? Math.max(1, Math.ceil((inc.cap - inc.start) / inc.increment) + 1) : Number.POSITIVE_INFINITY;
  let chest = 0;
  const n = Math.min(day, rampDays);
  for (let k = 1; k <= n; k++) chest += Math.min(inc.start + inc.increment * (k - 1), inc.cap);
  if (day > n) chest += (day - n) * inc.cap;
  return chest + inc.extraPerDay * day;
}

/** First day on which cumulative points reach `threshold`, or null beyond `horizonDays`. */
export function dayToReach(threshold: number, inc: VipIncome, horizonDays = 3650): number | null {
  if (threshold <= 0) return 0;
  let lo = 1;
  let hi = horizonDays;
  if (vipPointsAfter(hi, inc) < threshold) return null;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (vipPointsAfter(mid, inc) >= threshold) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

export function vipLevelForPoints(points: number, levels: readonly VipLevel[] = VIP_LEVELS): number {
  let lvl = 0;
  for (const l of levels) if (points >= l.threshold && l.vip > lvl) lvl = l.vip;
  return lvl;
}

export interface VipMilestone { vip: number; threshold: number; day: number | null }
export interface VipScenario {
  id: "chest_only" | "chest_plus_daily_gems";
  label: string;
  income: VipIncome;
  milestones: VipMilestone[];
  facts: string[];
  confidence: Confidence;
  split: boolean;
  pendingGaps: string[];
  note: string;
}

export function vipTimeline(index: FactIndex, horizonDays = 3650, data: BudgetData = BUDGET_DATA): VipScenario[] {
  const make = (id: VipScenario["id"], withGems: boolean): VipScenario => {
    const income = defaultVipIncome(withGems, data);
    const facts = ["A05-0001", "A05-0003", "A05-0007", ...(withGems ? ["A04-0001", "A05-0004", "A05-0008"] : [])];
    return {
      id,
      label: withGems ? "Daily VIP chest + all 100 guaranteed gems/day converted to VIP" : "Daily VIP chest only",
      income,
      milestones: VIP_LEVELS.map((l) => ({ vip: l.vip, threshold: l.threshold, day: dayToReach(l.threshold, income, horizonDays) })),
      facts,
      confidence: confidenceOf(facts, index),
      split: withGems,
      pendingGaps: ["L-A05-01", "L-A04-01", "L-A05-03"],
      note: withGems
        ? "Majority advice is gems → VIP 6 then VIP 10 (A05-0008); AllClash dissents, and buying during More Than Gems (A11-0502) shifts timing. Upper bound on days: other gem/VIP sources are not counted."
        : "Upper bound on days: alliance gifts, caves, events and quest gems are not counted (A05-0007).",
    };
  };
  return [make("chest_only", false), make("chest_plus_daily_gems", true)];
}

// ---------------------------------------------------------------------------

export interface DayCheckpoint {
  day: number;
  guaranteedGemsCumulative: number;
  vipPoints: { chestOnly: number; withGems: number };
  vipLevel: { chestOnly: number; withGems: number };
}

export function checkpointAt(day: number, data: BudgetData = BUDGET_DATA): DayCheckpoint {
  const a = vipPointsAfter(day, defaultVipIncome(false, data));
  const b = vipPointsAfter(day, defaultVipIncome(true, data));
  return {
    day,
    guaranteedGemsCumulative: data.inputs.dailyObjectivesGems.value * Math.max(0, day),
    vipPoints: { chestOnly: a, withGems: b },
    vipLevel: { chestOnly: vipLevelForPoints(a), withGems: vipLevelForPoints(b) },
  };
}

export interface Assumption { text: string; facts: string[]; gaps: string[] }

export interface OneTimeGem extends Sourced<number> { id: string; label: string; unlockCityHall: number | null; reached: boolean | null }

export interface KvK1Targets {
  startDay: Sourced<number>;
  cityHall: Sourced<{ workableMin: number; notExpected: number }>;
  t4Day: Sourced<number>;
  power: Sourced<{ minMillions: number; maxMillions: number }>;
  lostKingdomEntryCH: Sourced<number>;
  daysUntilStart: number | null;
}

export interface RealityCheck {
  profile: SpendingProfile;
  researched: boolean;
  status: "researched" | "not_researched_yet";
  message: string;
  asOf: string;
  kingdomDay: number | null;
  guaranteedGemsPerDay: Sourced<number> | null;
  speedupMinutesPerDay: Sourced<number> | null;
  vipTargets: Sourced<number[]> | null;
  vipTimeline: VipScenario[];
  /** Fixed checkpoints + KvK1 start + the player's kingdom day (if known), sorted. */
  checkpoints: DayCheckpoint[];
  atKingdomDay: DayCheckpoint | null;
  kvk1: KvK1Targets | null;
  oneTimeGems: OneTimeGem[];
  unquantified: { text: string; facts: string[]; gaps: string[] } | null;
  assumptions: Assumption[];
  /** Field names left as placeholders for unresearched profiles. */
  placeholders: string[];
  warnings: string[];
}

export interface RealityCheckOptions { horizonDays?: number; checkpoints?: number[] }

const NOT_RESEARCHED_FIELDS = [
  "guaranteedGemsPerDay", "speedupMinutesPerDay", "vipTargets", "vipTimeline", "checkpoints", "kvk1", "oneTimeGems",
];

/**
 * Realistic targets by kingdom day for a spending profile. Only F2P is researched;
 * other profiles return placeholders marked "not researched yet" (never invented).
 * `facts` can be a full Fact[] from @rokadm/data; defaults to the bundled index.
 */
export function realityCheck(
  profile: AccountProfile,
  facts: readonly FactMeta[] = BUNDLED_FACTS,
  opts: RealityCheckOptions = {},
): RealityCheck {
  const data = BUDGET_DATA;
  const index = indexFacts(facts);
  const base = { profile: profile.spending, asOf: data.asOf, kingdomDay: profile.kingdomDay };

  if (!data.researchedProfiles.includes(profile.spending)) {
    return {
      ...base,
      researched: false,
      status: "not_researched_yet",
      message: `Targets for the "${profile.spending}" profile are not researched yet. Only F2P has fact-backed numbers (see research/perfis.md).`,
      guaranteedGemsPerDay: null,
      speedupMinutesPerDay: null,
      vipTargets: null,
      vipTimeline: [],
      checkpoints: [],
      atKingdomDay: null,
      kvk1: null,
      oneTimeGems: [],
      unquantified: null,
      assumptions: [{ text: `Profile "${profile.spending}" not researched yet; nothing is estimated for it.`, facts: [], gaps: ["L-A12-01"] }],
      placeholders: [...NOT_RESEARCHED_FIELDS],
      warnings: [],
    };
  }

  const i = data.inputs;
  const cited = new Set<string>();
  const track = <T>(s: Sourced<T>) => { s.facts.forEach((f) => cited.add(f)); return s; };

  const guaranteedGemsPerDay = track(sourced(i.dailyObjectivesGems, index, { note: "Only guaranteed, level-independent daily gem source; needs 100 Daily Objective points every day." }));
  const speedupMinutesPerDay = track(sourced(i.dailyObjectivesSpeedupMinutes, index));
  const vipTargets = track(sourced(i.vipTargets, index, { note: "VIP 6 = permanent 2nd builder (A01-0006); VIP 10 = 1 legendary sculpture/day (A05-0006). AllClash dissents on spending gems on VIP." }));
  const timeline = vipTimeline(index, opts.horizonDays, data);
  timeline.forEach((s) => s.facts.forEach((f) => cited.add(f)));

  const startDay = track(sourced(i.kvk1StartDay, index));
  const days = new Set<number>([...(opts.checkpoints ?? data.checkpoints), startDay.value]);
  if (profile.kingdomDay !== null && profile.kingdomDay > 0) days.add(profile.kingdomDay);
  const checkpoints = [...days].sort((a, b) => a - b).map((d) => checkpointAt(d, data));
  const atKingdomDay = profile.kingdomDay !== null && profile.kingdomDay > 0 ? checkpointAt(profile.kingdomDay, data) : null;

  const kvk1: KvK1Targets = {
    startDay,
    cityHall: track(sourced(i.chAtKvK1F2P, index, { note: "Player reports: CH21+ workable for KvK1; CH25 not expected for F2P." })),
    t4Day: track(sourced(i.t4Day, index, { note: "T4 'usually around the 30 day mark' (player report)." })),
    power: track(sourced(i.powerAtKvK1F2P, index)),
    lostKingdomEntryCH: track(sourced(i.lostKingdomEntryCH, index, { note: "Single T3 source; card partially obsolete." })),
    daysUntilStart: profile.kingdomDay !== null ? Math.max(0, startDay.value - profile.kingdomDay) : null,
  };

  const oneTimeGems: OneTimeGem[] = data.oneTimeGems.map((g) => {
    let c = confidenceOf(g.facts, index);
    if (g.confidenceCap) c = minConfidence(c, g.confidenceCap);
    g.facts.forEach((f) => cited.add(f));
    return {
      id: g.id, label: g.label, value: g.value, unit: "gems (once)", facts: [...g.facts], confidence: c, derived: false, pendingGaps: [],
      unlockCityHall: g.unlockCityHall,
      reached: g.unlockCityHall === null ? null : profile.cityHall >= g.unlockCityHall,
    };
  });

  const u = data.unquantifiedGemSources;
  u.facts.forEach((f) => cited.add(f));

  const assumptions: Assumption[] = [
    { text: "Daily Objectives reach 100 points every day (100 gems/day).", facts: ["A04-0001", "A10-0001"], gaps: ["L-A10-02"] },
    { text: "The daily VIP streak is never broken (40 → +20/day → 200/day cap).", facts: ["A05-0003"], gaps: [] },
    { text: "VIP thresholds are cumulative totals (T4-supported, T0 pending).", facts: ["A05-0001"], gaps: ["L-A05-01"] },
    { text: "In the gems scenario every guaranteed gem goes to VIP at 1 gem = 1 VIP point, on the day it is earned.", facts: ["A05-0004", "A05-0008"], gaps: [] },
    { text: "No other gem or VIP source is counted (alliance gifts, caves, events, quests, barbarians): day counts are upper bounds.", facts: ["A04-0006", "A05-0007"], gaps: ["L-A04-01", "L-A05-03"] },
    { text: "One-time gems (CH16/CH21/CH25, account binding) are listed separately and not added to the timeline.", facts: ["A04-0005", "A01-0002"], gaps: [] },
    { text: "KvK1 starts around kingdom day 100.", facts: ["B01-0500"], gaps: ["L-B01-02"] },
    { text: "Speedups/day come from the 2020 wiki chest contents; the task list changed in 1.1.09.", facts: ["A04-0010", "A10-0001"], gaps: ["L-A04-04"] },
  ];
  assumptions.forEach((a) => a.facts.forEach((f) => cited.add(f)));

  const missing = missingFacts([...cited], index);
  return {
    ...base,
    researched: true,
    status: "researched",
    message: "Realistic F2P targets from fact cards. Confidence is the weakest card behind each number.",
    guaranteedGemsPerDay,
    speedupMinutesPerDay,
    vipTargets,
    vipTimeline: timeline,
    checkpoints,
    atKingdomDay,
    kvk1,
    oneTimeGems,
    unquantified: { text: u.text, facts: [...u.facts], gaps: [...u.gaps] },
    assumptions,
    placeholders: [],
    warnings: missing.length ? [`Facts not found in the provided index (confidence shown as pending): ${missing.join(", ")}`] : [],
  };
}
