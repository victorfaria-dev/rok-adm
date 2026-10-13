// Farm hub: shared types and the authored data (data/farms.json). Pure; no UI, no I/O.
import type { Confidence } from "@rokadm/core";
import farmsJson from "../data/farms.json";
import { confidenceOf, indexFacts, minConfidence, BUNDLED_FACTS, type FactIndex, type FactMeta } from "./facts";

export type Resource = "food" | "wood" | "stone" | "gold";
export const RESOURCES: readonly Resource[] = ["food", "wood", "stone", "gold"];

/** What a farm mainly gathers. */
export type FarmFocus = "general" | Resource;
export const FARM_FOCUSES: readonly FarmFocus[] = ["general", ...RESOURCES];

export function isResource(x: unknown): x is Resource {
  return typeof x === "string" && (RESOURCES as readonly string[]).includes(x);
}
export function isFarmFocus(x: unknown): x is FarmFocus {
  return typeof x === "string" && (FARM_FOCUSES as readonly string[]).includes(x);
}

/** Common evidence fields on every farm recommendation. */
export interface FarmEvidence {
  facts: string[];
  confidence: Confidence;
  gaps: string[];
  /** true = planner reasoning that no source states (show as "Hypothesis"). */
  hypothesis: boolean;
}

/** Options shared by the farm functions: pass a full Fact[] (e.g. from @rokadm/data) instead of the bundled index. */
export interface FarmFactsOption {
  facts?: readonly FactMeta[];
}

const BUNDLED_INDEX: FactIndex = indexFacts(BUNDLED_FACTS);

export function farmIndex(opts: FarmFactsOption = {}): FactIndex {
  return opts.facts ? indexFacts(opts.facts) : BUNDLED_INDEX;
}

/** Confidence over the cited cards; hypotheses are capped at low. */
export function evidenceOf(facts: readonly string[], gaps: readonly string[], hypothesis: boolean, index: FactIndex): FarmEvidence {
  let confidence = confidenceOf(facts, index);
  if (hypothesis) confidence = minConfidence(confidence, "low");
  return { facts: [...facts], confidence, gaps: [...gaps], hypothesis };
}

// ---------------------------------------------------------------------------
// Authored data shape (data/farms.json)

export type Evidence = Record<string, string>;

export interface SourcedText {
  text: string;
  facts: string[];
  gaps: string[];
  hypothesis: boolean;
  evidence?: Evidence;
}

export interface BottleneckBand {
  id: string;
  minCityHall: number;
  maxCityHall: number;
  stageLabel: string;
  resources: Resource[];
  facts: string[];
  evidence?: Evidence;
}

export interface CivBonus { civs: string[]; bonus: string; facts: string[]; evidence?: Evidence }

export type VariantId = "general" | "single-resource" | "gold" | "pair-food-wood";
export const VARIANT_IDS: readonly VariantId[] = ["general", "single-resource", "gold", "pair-food-wood"];

export interface VariantText { label: string; why: string; facts: string[]; gaps: string[]; hypothesis: boolean; evidence?: Evidence }

export type BuildCheckField = "cityHall" | "tradingPost" | "goldmine" | "academy" | "commanderLevel";
export const BUILD_CHECK_FIELDS: readonly BuildCheckField[] = ["cityHall", "tradingPost", "goldmine", "academy", "commanderLevel"];

export interface BuildStepData {
  id: string;
  label: string;
  detail: string;
  facts: string[];
  gaps: string[];
  /** Resources this step serves; absent = every focus. */
  resources?: Resource[];
  check?: { field: BuildCheckField; min: number };
  evidence?: Evidence;
}
export interface BuildStageData { id: string; label: string; steps: BuildStepData[] }

export interface DailyTaskData {
  id: string;
  label: string;
  detail: string;
  facts: string[];
  gaps: string[];
  optional: boolean;
  evidence?: Evidence;
}

export type TransferWarningCode =
  | "gold_pending_t0"
  | "protected_not_shippable"
  | "protection_is_input"
  | "capacity_contested"
  | "capacity_unknown"
  | "capacity_counts_gross"
  | "march_queue"
  | "tax_unknown";

export interface FarmsData {
  asOf: string;
  tradingPostUnlock: { text: string; probableCityHall: number; otherCityHall: number; facts: string[]; gaps: string[]; evidence?: Evidence };
  transferWarnings: Record<TransferWarningCode, SourcedText>;
  bottlenecks: BottleneckBand[];
  civByResource: Record<Resource, CivBonus>;
  variants: Record<VariantId, VariantText>;
  farmCount: Record<"base" | "two" | "zero", { why: string; facts: string[]; gaps: string[]; evidence?: Evidence }>;
  buildStages: BuildStageData[];
  dailyTasks: DailyTaskData[];
}

export const FARMS_DATA = farmsJson as unknown as FarmsData;
