// F-66 Farm Setup Path: CH11 → CH17 → CH22, Trading Post 15 (+ Goldmine), gathering
// commander 37, per-resource Academy techs. Steps live in data/farms.json. Pure.
import type { Confidence } from "@rokadm/core";
import {
  BUILD_CHECK_FIELDS, FARMS_DATA, evidenceOf, farmIndex, isFarmFocus,
  type BuildCheckField, type BuildStageData, type FarmEvidence, type FarmFactsOption, type FarmFocus, type Resource,
} from "./farms-common";
import { minConfidence } from "./facts";
import { TP_UNLOCK_NOTE, type TradingPostUnlockNote } from "./farms-trading-post";

export type FarmLevels = Partial<Record<BuildCheckField, number | null>>;

/**
 * done/todo = the step has a level check and that level was entered;
 * unknown = the level it checks was not entered;
 * info = advice without a level check (civilization, placement, Storehouse).
 */
export type BuildStepStatus = "done" | "todo" | "unknown" | "info";

export interface BuildStep extends FarmEvidence {
  id: string;
  stageId: string;
  label: string;
  detail: string;
  check: { field: BuildCheckField; min: number } | null;
  /** Resources this step serves; null = every focus. */
  resources: Resource[] | null;
  status: BuildStepStatus;
  /** The level entered for `check.field`, if any. */
  current: number | null;
}

export interface BuildStage {
  id: string;
  label: string;
  steps: BuildStep[];
  /** Every checkable step done (info steps ignored); false if any is todo or unknown. */
  complete: boolean;
}

export interface BuildPath {
  focus: FarmFocus;
  stages: BuildStage[];
  /** First step still to do, in path order; null when nothing is known to be left. */
  next: BuildStep | null;
  /** Trading Post unlock City Hall is contested (CH12 vs CH10). */
  tradingPostUnlock: TradingPostUnlockNote;
  confidence: Confidence;
}

export const FARM_BUILD_STAGES: readonly BuildStageData[] = FARMS_DATA.buildStages;

function levelOf(levels: FarmLevels, field: BuildCheckField): number | null {
  const v = levels[field];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Steps a focus needs: "general" keeps every Academy step, a resource keeps only its own. */
export function stepMatchesFocus(resources: readonly Resource[] | undefined | null, focus: FarmFocus): boolean {
  return !resources || focus === "general" || resources.includes(focus);
}

export function buildPath(levels: FarmLevels, focus: FarmFocus = "general", opts: FarmFactsOption = {}): BuildPath {
  if (!isFarmFocus(focus)) throw new RangeError(`unknown focus: ${String(focus)}`);
  for (const k of Object.keys(levels)) {
    if (!(BUILD_CHECK_FIELDS as readonly string[]).includes(k)) throw new RangeError(`unknown level field: ${k}`);
  }
  const index = farmIndex(opts);
  const stages: BuildStage[] = FARM_BUILD_STAGES.map((stage) => {
    const steps: BuildStep[] = stage.steps
      .filter((s) => stepMatchesFocus(s.resources, focus))
      .map((s) => {
        const current = s.check ? levelOf(levels, s.check.field) : null;
        const status: BuildStepStatus = !s.check ? "info" : current === null ? "unknown" : current >= s.check.min ? "done" : "todo";
        return {
          id: s.id, stageId: stage.id, label: s.label, detail: s.detail,
          check: s.check ? { ...s.check } : null,
          resources: s.resources ? [...s.resources] : null,
          status, current,
          ...evidenceOf(s.facts, s.gaps, false, index),
        };
      });
    const checkable = steps.filter((s) => s.status !== "info");
    return { id: stage.id, label: stage.label, steps, complete: checkable.length > 0 && checkable.every((s) => s.status === "done") };
  });
  const all = stages.flatMap((s) => s.steps);
  const next = all.find((s) => s.status === "todo") ?? null;
  const known = all.filter((s) => s.status !== "info");
  const confidence = minConfidence(...known.map((s) => s.confidence));
  return { focus, stages, next, tradingPostUnlock: TP_UNLOCK_NOTE, confidence };
}
