// F-65 Farm Variant Picker: need a farm? how many? which variant? Pure; follows the
// evidence table in research/context/farms.md ("Farm variants: what the evidence supports").
import type { Confidence, SpendingProfile } from "@rokadm/core";
import {
  farmConfidenceOf as confidenceOf, FARMS_DATA, RESOURCES, VARIANT_IDS, evidenceOf, farmIndex,
  type FarmEvidence, type FarmFactsOption, type Resource, type VariantId,
} from "./farms-common";

/**
 * Daily minutes from which the planner treats a player as having "a lot of time"
 * (unlocks the single-resource variant and a second farm).
 * HYPOTHESIS: no source measures farm minutes per day (gap L-A13-01); the only source
 * says "only for players that spend a lot of time" (A13-0007, A13-0009). 120 = the
 * longest daily-time preset in the questionnaire.
 */
export const LOTS_OF_TIME_MINUTES = 120;
/**
 * Below this many minutes a day the planner suggests no farm yet.
 * HYPOTHESIS (gap L-A13-01): guides only say a farm needs logins at least twice a day (A13-0007).
 */
export const MIN_FARM_MINUTES = 15;
/** At most two farms are ever suggested (about two cities per kingdom, A13-0001). */
export const MAX_FARMS_SUGGESTED = 2;

export type VariantStatus = "recommended" | "possible" | "not_recommended" | "hidden";

export interface FarmVariant extends FarmEvidence {
  id: VariantId;
  label: string;
  status: VariantStatus;
  why: string;
}

export interface FarmCountAdvice extends FarmEvidence {
  value: 0 | 1 | 2;
  why: string;
}

export interface MainBottleneck {
  resources: Resource[];
  stageLabel: string;
  facts: string[];
  confidence: Confidence;
}

export interface CivForResource {
  /** Lower-case civilization codes (same as CIVILIZATIONS in @rokadm/core). */
  civs: string[];
  bonus: string;
  facts: string[];
  confidence: Confidence;
}

export interface FarmRecommendationInput {
  mainCityHall: number | null;
  minutesPerDay: number | null;
  spending: SpendingProfile | null;
  /** Farms the player already has. */
  farmsOwned: number;
  /** The player wants more than one farm. */
  wantsMany?: boolean;
}

export interface FarmRecommendation {
  farmCount: FarmCountAdvice;
  /** null when the main's City Hall is unknown. */
  mainBottleneck: MainBottleneck | null;
  variants: FarmVariant[];
  civByResource: Record<Resource, CivForResource>;
}

function assertCityHall(ch: number): void {
  if (!Number.isInteger(ch) || ch < 1 || ch > 25) throw new RangeError("cityHall must be an integer 1..25");
}

/** The main's binding resources at its City Hall level (farms.md bottleneck table). */
export function mainBottleneck(cityHall: number, opts: FarmFactsOption = {}): MainBottleneck {
  assertCityHall(cityHall);
  const band = FARMS_DATA.bottlenecks.find((b) => cityHall >= b.minCityHall && cityHall <= b.maxCityHall);
  if (!band) throw new RangeError(`no bottleneck band for City Hall ${cityHall}`);
  return { resources: [...band.resources], stageLabel: band.stageLabel, facts: [...band.facts], confidence: confidenceOf(band.facts, farmIndex(opts)) };
}

export function civsByResource(opts: FarmFactsOption = {}): Record<Resource, CivForResource> {
  const index = farmIndex(opts);
  const out = {} as Record<Resource, CivForResource>;
  for (const r of RESOURCES) {
    const c = FARMS_DATA.civByResource[r];
    out[r] = { civs: [...c.civs], bonus: c.bonus, facts: [...c.facts], confidence: confidenceOf(c.facts, index) };
  }
  return out;
}

function farmCountAdvice(input: FarmRecommendationInput, lotsOfTime: boolean, index: ReturnType<typeof farmIndex>): FarmCountAdvice {
  const owned = input.farmsOwned;
  const ownedNote = owned > 0 ? ` Você já tem ${owned}.` : "";
  const overNote = owned > MAX_FARMS_SUGGESTED ? ` O planejador nunca sugere mais que ${MAX_FARMS_SUGGESTED}.` : "";
  const d = FARMS_DATA.farmCount;
  // The count rule itself is planner reasoning (no data per tier, gap L-A13-04): always a hypothesis.
  if (input.minutesPerDay !== null && input.minutesPerDay < MIN_FARM_MINUTES) {
    return { value: 0, why: d.zero.why + ownedNote, ...evidenceOf(d.zero.facts, d.zero.gaps, true, index) };
  }
  if (input.wantsMany && lotsOfTime) {
    return { value: 2, why: d.two.why + ownedNote + overNote, ...evidenceOf(d.two.facts, d.two.gaps, true, index) };
  }
  return { value: 1, why: d.base.why + ownedNote + overNote, ...evidenceOf(d.base.facts, d.base.gaps, true, index) };
}

/**
 * Variant statuses follow the evidence table exactly:
 * - general: recommended (the norm);
 * - single-resource: possible only with a lot of declared time (threshold is a hypothesis), else not recommended;
 * - gold: not recommended for F2P/low/unknown spending until T0 (A03-0027 vs A13-0004); possible otherwise;
 * - pair-food-wood: always hidden (hypothesis, L-A13-03) — the UI shows it only behind "show hypotheses".
 */
export function recommendFarms(input: FarmRecommendationInput, opts: FarmFactsOption = {}): FarmRecommendation {
  if (!Number.isInteger(input.farmsOwned) || input.farmsOwned < 0) throw new RangeError("farmsOwned must be an integer >= 0");
  if (input.minutesPerDay !== null && (!Number.isFinite(input.minutesPerDay) || input.minutesPerDay < 0)) {
    throw new RangeError("minutesPerDay must be a finite number >= 0");
  }
  if (input.mainCityHall !== null) assertCityHall(input.mainCityHall);
  const index = farmIndex(opts);
  const lotsOfTime = input.minutesPerDay !== null && input.minutesPerDay >= LOTS_OF_TIME_MINUTES;
  const lowSpender = input.spending === null || input.spending === "f2p" || input.spending === "low";

  const variants: FarmVariant[] = VARIANT_IDS.map((id) => {
    const v = FARMS_DATA.variants[id];
    let status: VariantStatus;
    let why = v.why;
    let hypothesis = v.hypothesis;
    switch (id) {
      case "general":
        status = "recommended";
        break;
      case "single-resource":
        status = lotsOfTime ? "possible" : "not_recommended";
        why += lotsOfTime
          ? ` Evidência fraca. Mostrado porque você declarou ${LOTS_OF_TIME_MINUTES}+ minutos por dia (o limite do planejador para "muito tempo" é uma hipótese).`
          : ` Evidência fraca. Só aparece como possível a partir de ${LOTS_OF_TIME_MINUTES} minutos por dia (limite do planejador, uma hipótese).`;
        hypothesis = hypothesis || lotsOfTime;
        break;
      case "gold":
        status = lowSpender ? "not_recommended" : "possible";
        why += lowSpender ? "Não recomendado para F2P nem para quem gasta pouco até uma verificação no jogo confirmar a transferência e o rendimento." : "";
        break;
      case "pair-food-wood":
        status = "hidden";
        hypothesis = true;
        break;
    }
    const ev = evidenceOf(v.facts, v.gaps, hypothesis, index);
    return { id, label: v.label, status, why, ...ev };
  });

  return {
    farmCount: farmCountAdvice(input, lotsOfTime, index),
    mainBottleneck: input.mainCityHall !== null ? mainBottleneck(input.mainCityHall, opts) : null,
    variants,
    civByResource: civsByResource(opts),
  };
}
