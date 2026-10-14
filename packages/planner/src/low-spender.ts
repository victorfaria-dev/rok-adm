// F-14 Budget Reality Check, Low spender targets (wave J). Pure functions over data/low-spender.json.
// Every number comes from a fact card (build-data checks the evidence substrings); per-dollar ratios and
// monthly totals are derived here and flagged `derived: true`. Method: A12-0618 (raw gems/VIP per USD only).
import type { AccountProfile, Confidence } from "@rokadm/core";
import lowJson from "../data/low-spender.json";
import budgetJson from "../data/budget-inputs.json";
import { confidenceOf, indexFacts, minConfidence, BUNDLED_FACTS, type FactIndex, type FactMeta } from "./facts";
import { dayToReach, VIP_LEVELS, type Sourced, type VipIncome, type VipMilestone } from "./budget";

export type LowPurchaseKind = "one-time" | "recurring" | "per-edition" | "per-trigger";
export type LowTierId = "pass-only" | "low-full";

interface PurchaseRow {
  id: string;
  label: string;
  kind: LowPurchaseKind;
  periodDays: number | null;
  priceUsd: number;
  gems: number | null;
  vipPoints: number | null;
  items: string;
  facts: string[];
  priceFacts: string[];
  gemFacts: string[];
  derived?: boolean;
  pendingGaps: string[];
  note: string;
}
interface TierRow {
  id: LowTierId;
  label: string;
  purchaseIds: string[];
  monthlyAssumptions: Record<string, number>;
  facts: string[];
  pendingGaps: string[];
  note: string;
}
interface LowData {
  asOf: string;
  profileRangeUsdPerMonth: { min: number; max: number; note: string };
  priceWarning: string;
  purchases: PurchaseRow[];
  tiers: TierRow[];
  recharge: { text: string; facts: string[]; pendingGaps: string[] };
  valueMethod: { text: string; facts: string[] };
}

export const LOW_SPENDER_DATA = lowJson as unknown as LowData;

/** Days in the "month" used to normalise recurring purchases (the 30-day Gem Supply period). */
export const MONTH_DAYS = 30;
/** The method card behind every per-dollar ratio. */
export const VALUE_METHOD_FACT = "A12-0618";

export interface LowPurchase {
  id: string;
  label: string;
  kind: LowPurchaseKind;
  periodDays: number | null;
  items: string;
  note: string;
  price: Sourced<number>;
  gems: Sourced<number> | null;
  vipPoints: Sourced<number> | null;
  /** Raw gems per USD (A12-0618 method). */
  gemsPerUsd: Sourced<number> | null;
  /** Raw VIP points per USD (A12-0618 method). */
  vipPerUsd: Sourced<number> | null;
  /** Weakest card behind the row. */
  confidence: Confidence;
  facts: string[];
}

const round = (n: number, dp = 0) => Math.round(n * 10 ** dp) / 10 ** dp;

function src(value: number, unit: string, facts: string[], index: FactIndex, extra: Partial<Sourced<number>> = {}): Sourced<number> {
  return { value, unit, facts: [...facts], confidence: confidenceOf(facts, index), derived: false, pendingGaps: [], ...extra };
}

function ratio(num: Sourced<number> | null, price: Sourced<number>, unit: string, index: FactIndex): Sourced<number> | null {
  if (!num || price.value <= 0) return null;
  const facts = [...new Set([...num.facts, ...price.facts, VALUE_METHOD_FACT])];
  return { value: round(num.value / price.value), unit, facts, confidence: confidenceOf(facts, index), derived: true, pendingGaps: [], note: "Razão bruta (A12-0618); itens não precificados." };
}

export function lowPurchases(index: FactIndex = indexFacts(), data: LowData = LOW_SPENDER_DATA): LowPurchase[] {
  return data.purchases.map((p) => {
    const price = src(p.priceUsd, "USD", p.priceFacts, index, { derived: p.derived ?? false, pendingGaps: [...p.pendingGaps], note: data.priceWarning });
    const gems = p.gems === null ? null : src(p.gems, "gems", p.gemFacts, index);
    const vipPoints = p.vipPoints === null ? null : src(p.vipPoints, "pontos VIP", p.gemFacts, index);
    return {
      id: p.id,
      label: p.label,
      kind: p.kind,
      periodDays: p.periodDays,
      items: p.items,
      note: p.note,
      price,
      gems,
      vipPoints,
      gemsPerUsd: ratio(gems, price, "gemas por USD", index),
      vipPerUsd: ratio(vipPoints, price, "pontos VIP por USD", index),
      confidence: confidenceOf(p.facts, index),
      facts: [...p.facts],
    };
  });
}

/** How many times a purchase is bought in a 30-day month under a tier's assumptions (0 for one-time). */
export function timesPerMonth(p: Pick<LowPurchase, "id" | "kind" | "periodDays">, assumptions: Record<string, number> = {}): number {
  if (p.kind === "one-time") return 0;
  if (p.kind === "recurring") return p.periodDays && p.periodDays > 0 ? MONTH_DAYS / p.periodDays : 0;
  return assumptions[p.id] ?? 0;
}

export interface LowTierLine { purchase: LowPurchase; timesPerMonth: number; assumed: boolean }

export interface LowTier {
  id: LowTierId;
  label: string;
  note: string;
  lines: LowTierLine[];
  /** Recurring spend normalised to 30 days (derived). */
  monthlyUsd: Sourced<number>;
  /** Gems from recurring purchases per 30 days (derived; floor values). */
  monthlyGems: Sourced<number>;
  monthlyVipPoints: Sourced<number>;
  /** One-time purchases in this tier (bought once, not monthly). */
  oneTimeUsd: Sourced<number>;
  oneTimeGems: Sourced<number>;
  /** true when the monthly spend fits the Low range of research/perfis.md. */
  withinLowRange: boolean;
  pendingGaps: string[];
}

function sumSourced(parts: Array<{ value: number; facts: string[] }>, unit: string, index: FactIndex, extraFacts: string[], gaps: string[]): Sourced<number> {
  const facts = [...new Set([...parts.flatMap((p) => p.facts), ...extraFacts])];
  return {
    value: round(parts.reduce((s, p) => s + p.value, 0), 2),
    unit,
    facts,
    confidence: facts.length ? confidenceOf(facts, index) : "pending",
    derived: true,
    pendingGaps: [...new Set(gaps)],
  };
}

export function lowTier(id: LowTierId, index: FactIndex = indexFacts(), data: LowData = LOW_SPENDER_DATA): LowTier {
  const t = data.tiers.find((x) => x.id === id);
  if (!t) throw new Error(`unknown low tier ${id}`);
  const all = new Map(lowPurchases(index, data).map((p) => [p.id, p]));
  const lines: LowTierLine[] = t.purchaseIds.map((pid) => {
    const purchase = all.get(pid);
    if (!purchase) throw new Error(`tier ${id}: unknown purchase ${pid}`);
    return { purchase, timesPerMonth: timesPerMonth(purchase, t.monthlyAssumptions), assumed: pid in t.monthlyAssumptions };
  });
  const gaps = [...t.pendingGaps, ...lines.flatMap((l) => l.purchase.price.pendingGaps)];
  const monthly = lines.filter((l) => l.timesPerMonth > 0);
  const once = lines.filter((l) => l.purchase.kind === "one-time");
  const times = (l: LowTierLine, s: Sourced<number> | null) => (s ? [{ value: s.value * l.timesPerMonth, facts: s.facts }] : []);
  const monthlyUsd = sumSourced(monthly.flatMap((l) => times(l, l.purchase.price)), "USD por 30 dias", index, t.facts, gaps);
  const lo = data.profileRangeUsdPerMonth;
  return {
    id: t.id,
    label: t.label,
    note: t.note,
    lines,
    monthlyUsd,
    monthlyGems: sumSourced(monthly.flatMap((l) => times(l, l.purchase.gems)), "gemas por 30 dias (piso)", index, [], gaps),
    monthlyVipPoints: sumSourced(monthly.flatMap((l) => times(l, l.purchase.vipPoints)), "pontos VIP por 30 dias (dos pacotes)", index, [], gaps),
    oneTimeUsd: sumSourced(once.map((l) => ({ value: l.purchase.price.value, facts: l.purchase.price.facts })), "USD uma vez", index, [], gaps),
    oneTimeGems: sumSourced(once.flatMap((l) => (l.purchase.gems ? [{ value: l.purchase.gems.value, facts: l.purchase.gems.facts }] : [])), "gemas uma vez", index, [], gaps),
    withinLowRange: monthlyUsd.value >= lo.min && monthlyUsd.value <= lo.max,
    pendingGaps: monthlyUsd.pendingGaps,
  };
}

// ---------------------------------------------------------------------------
// VIP timeline with the 30-day Gem Supply (same ramp and thresholds as the F2P scenarios).

interface BudgetInputsLite { inputs: Record<string, { value: number }> }
const BUDGET = budgetJson as unknown as BudgetInputsLite;

export interface LowVipScenario {
  id: "chest_plus_daily_gems_plus_supply";
  label: string;
  income: VipIncome;
  milestones: VipMilestone[];
  facts: string[];
  confidence: Confidence;
  pendingGaps: string[];
  note: string;
}

/**
 * Daily VIP chest + 100 Daily Objective gems + 650 Gem Supply gems a day, all converted to VIP at 1:1
 * on the day they arrive (the same assumptions as the F2P "with gems" scenario, plus the supply).
 */
export function lowVipTimeline(index: FactIndex = indexFacts(), horizonDays = 3650): LowVipScenario {
  const i = BUDGET.inputs;
  const supply = LOW_SPENDER_DATA.purchases.find((p) => p.id === "gem-supply-30d")!;
  const supplyPerDay = (supply.gems ?? 0) / (supply.periodDays ?? MONTH_DAYS);
  const income: VipIncome = {
    start: i["vipDailyStart"]!.value,
    increment: i["vipDailyIncrement"]!.value,
    cap: i["vipDailyCap"]!.value,
    extraPerDay: (i["dailyObjectivesGems"]!.value + supplyPerDay) * i["gemToVip"]!.value,
  };
  const facts = ["A05-0001", "A05-0003", "A05-0007", "A04-0001", "A05-0004", "A05-0008", "A12-0601"];
  return {
    id: "chest_plus_daily_gems_plus_supply",
    label: "Baú VIP diário + 100 gemas garantidas/dia + 650 gemas/dia do Suprimento de Gemas, tudo convertido em VIP",
    income,
    milestones: VIP_LEVELS.map((l) => ({ vip: l.vip, threshold: l.threshold, day: dayToReach(l.threshold, income, horizonDays) })),
    facts,
    confidence: confidenceOf(facts, index),
    pendingGaps: ["L-A05-01", "L-A04-01", "L-A05-03", "L-A12-05"],
    note: "Limite superior de dias: pontos VIP de pacotes (Lucerna, pacotes promocionais), as gemas iniciais do suprimento e as gemas de eventos não são contados. Supõe que o suprimento é renovado a cada 30 dias e coletado todo dia.",
  };
}

// ---------------------------------------------------------------------------

export interface LowSpenderTargets {
  asOf: string;
  message: string;
  priceWarning: string;
  rangeUsdPerMonth: { min: number; max: number; note: string };
  purchases: LowPurchase[];
  tiers: LowTier[];
  /** Growth Fund status for this City Hall: the CH25 milestone is about half the fund (A12-0605, weak). */
  growthFund: { ch25Gems: Sourced<number>; reachedCH25: boolean; note: string };
  vipTimeline: LowVipScenario;
  recharge: { text: string; facts: string[]; confidence: Confidence; pendingGaps: string[] };
  valueMethod: { text: string; facts: string[]; confidence: Confidence };
  /** Weakest card across the tiers' prices and gems. */
  confidence: Confidence;
}

/** Low spender targets (profile `low`); valid for any profile, but meant for `spending === "low"`. */
export function lowSpenderTargets(profile: AccountProfile, facts: readonly FactMeta[] = BUNDLED_FACTS): LowSpenderTargets {
  const index = indexFacts(facts);
  const d = LOW_SPENDER_DATA;
  const tiers = d.tiers.map((t) => lowTier(t.id, index, d));
  const ch25 = src(40000, "gemas no marco da Prefeitura 25", ["A12-0605"], index, { pendingGaps: ["L-A12-02"] });
  return {
    asOf: d.asOf,
    message: "Metas para quem gasta pouco (Low), a partir das fichas de fatos: o que as compras baratas comuns rendem, em gemas e pontos VIP brutos por dólar. Os preços são de tabela; confira a sua loja.",
    priceWarning: d.priceWarning,
    rangeUsdPerMonth: { ...d.profileRangeUsdPerMonth },
    purchases: lowPurchases(index, d),
    tiers,
    growthFund: {
      ch25Gems: ch25,
      reachedCH25: profile.cityHall >= 25,
      note: "Cerca de metade das ~81.000 gemas só é paga na Prefeitura 25 (relatos de jogadores).",
    },
    vipTimeline: lowVipTimeline(index),
    recharge: { text: d.recharge.text, facts: [...d.recharge.facts], confidence: confidenceOf(d.recharge.facts, index), pendingGaps: [...d.recharge.pendingGaps] },
    valueMethod: { text: d.valueMethod.text, facts: [...d.valueMethod.facts], confidence: confidenceOf(d.valueMethod.facts, index) },
    confidence: minConfidence(...tiers.flatMap((t) => [t.monthlyUsd.confidence, t.monthlyGems.confidence])),
  };
}
