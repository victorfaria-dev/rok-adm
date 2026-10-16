// Visual guide (wave VG), client-safe: the "account/kingdom development" timeline, the "you are here"
// position, the progress tower floors and the kingdom-day calendar strip, all derived from block metadata
// (phase, ch_range) and the prebuilt calendar. Pure functions; the components render them.
import { isLateStage, PHASE_LAST_DAY, PHASE_TITLES, type AccountProfile, type GuidePhase } from "@rokadm/core";
import type { CalendarMilestone, CardBadge, PayloadBlock } from "./guide-types";
import { STAGE_NAMES, type GuideView, type ViewBlock } from "./guide-view";

export type LaneId = "start" | "day0-3" | "day4-14" | "day15-40" | "day41-90" | "pre-kvk1" | "any";

export interface Lane {
  id: LaneId;
  title: string;
  /** Second line: City Hall range or what the lane holds. */
  sub: string;
  /** Kingdom days the lane covers; null for undated lanes. */
  days: [number, number] | null;
}

/** "Days 4–14 (about CH8 → CH12)" → ["Days 4–14", "about CH8 → CH12"]. */
function splitTitle(phase: GuidePhase, fallback: string, sub: string): [string, string] {
  const m = /^(.*?)\s*\((.*)\)$/.exec(PHASE_TITLES[phase] ?? "");
  return m ? [m[1]!, m[2]!] : [fallback, sub];
}

const dated = (phase: GuidePhase, from: number, fallback: string, sub: string): Lane => {
  const [title, s] = splitTitle(phase, fallback, sub);
  return { id: phase as LaneId, title, sub: s, days: [from, PHASE_LAST_DAY[phase] ?? 100] };
};

/** Lanes top to bottom. The five dated lanes are the phases of core (PHASE_TITLES, PHASE_LAST_DAY). */
export const LANES: readonly Lane[] = [
  { id: "start", title: "Antes de começar", sub: "Leia uma vez", days: null },
  dated("day0-3", 0, "Dias 0–3", "Preparação e primeiras escolhas"),
  dated("day4-14", 4, "Dias 4–14", ""),
  dated("day15-40", 15, "Dias 15–40", ""),
  dated("day41-90", 41, "Dias 41–90", ""),
  { ...dated("pre-kvk1", 85, "Pré-KvK1 e KvK1", ""), days: [85, 100] },
  { id: "any", title: "Qualquer dia", sub: "Rotina diária, eventos e hábitos", days: null },
];

/** The phases that form the progress tower, bottom floor first. */
export const FLOOR_LANES: readonly LaneId[] = ["day0-3", "day4-14", "day15-40", "day41-90", "pre-kvk1"];

export function laneOf(phase: GuidePhase): LaneId {
  if (phase === "overview") return "start";
  if (phase === "daily" || phase === "event" || phase === "anytime") return "any";
  return phase;
}

export interface TimelineNode {
  id: string;
  title: string;
  gist: string;
  confidence: PayloadBlock["confidence"];
  /** Source site slugs of the cited cards. */
  sources: string[];
  cards: string[];
  /** In "Already done?" for this profile. */
  done: boolean;
  /** City Hall range of the step, when it has one. */
  ch: [number, number] | null;
}

export interface TimelineLane extends Lane {
  nodes: TimelineNode[];
}

export interface Timeline {
  lanes: TimelineLane[];
  /** Show the timeline: at least two dated phases have steps (else the plain list is clearer). */
  show: boolean;
}

const flat = (items: readonly ViewBlock[]): ViewBlock[] => items.flatMap((b) => [b, ...b.folded]);

export function nodeOf(item: ViewBlock, badges: Record<string, CardBadge>, done: boolean): TimelineNode {
  const b = item.block;
  const cards = [...new Set([...b.cards, ...b.patch_cards])];
  return {
    id: b.id,
    title: b.title,
    gist: b.gist ?? "",
    confidence: b.confidence,
    sources: [...new Set(cards.flatMap((c) => badges[c]?.sources ?? []))],
    cards,
    done,
    ch: b.ch_range,
  };
}

/** Every step of a view placed on its lane, in page order; "Already done?" steps are flagged. */
export function buildTimeline(view: GuideView, badges: Record<string, CardBadge>): Timeline {
  const byLane = new Map<LaneId, TimelineNode[]>();
  const add = (item: ViewBlock, done: boolean) => {
    const lane = laneOf(item.block.phase);
    byLane.set(lane, [...(byLane.get(lane) ?? []), nodeOf(item, badges, done)]);
  };
  for (const s of view.sections) for (const b of flat(s.blocks)) add(b, false);
  for (const b of view.alreadyDone) add(b, true);
  const lanes = LANES.map((l) => ({ ...l, nodes: byLane.get(l.id) ?? [] })).filter((l) => l.nodes.length > 0);
  return { lanes, show: lanes.filter((l) => l.days !== null).length >= 2 };
}

// ---------------------------------------------------------------------------
// You are here

export interface Here {
  /** Lane of the profile, or "past" when the kingdom is beyond KvK1 (KvK2, KvK3, SoC). */
  lane: LaneId | "past";
  basis: "day" | "cityHall" | "stage";
  /** Visible reason, e.g. "Kingdom day 20" or "City Hall 12 (no kingdom day given)". */
  text: string;
  /** Kingdom day, when the profile gives one. */
  day: number | null;
}

/**
 * Where the profile stands on the road to KvK1. The kingdom day wins (phase ends from core's
 * PHASE_LAST_DAY); without it, the City Hall ranges of PHASE_TITLES (CH8 → 12 → 17 → 21/22) decide.
 */
export function hereFor(p: AccountProfile): Here {
  if (isLateStage(p.kingdomStage)) {
    return { lane: "past", basis: "stage", text: `Seu reino está no ${STAGE_NAMES[p.kingdomStage]}, depois do KvK1`, day: p.kingdomDay };
  }
  const d = p.kingdomDay;
  if (d !== null) {
    const lane = FLOOR_LANES.find((l) => d <= (PHASE_LAST_DAY[l as GuidePhase] ?? Number.POSITIVE_INFINITY)) ?? "pre-kvk1";
    return { lane, basis: "day", text: `Dia ${d} do reino`, day: d };
  }
  const ch = p.cityHall;
  const lane: LaneId = ch < 8 ? "day0-3" : ch < 12 ? "day4-14" : ch < 17 ? "day15-40" : ch < 22 ? "day41-90" : "pre-kvk1";
  return { lane, basis: "cityHall", text: `Prefeitura ${ch} (sem dia do reino informado)`, day: null };
}

// ---------------------------------------------------------------------------
// Progress tower (F-62 v0)

export interface Floor {
  lane: LaneId;
  title: string;
  sub: string;
  steps: number;
  here: boolean;
}

/** Tower floors bottom-up: one per dated phase, with the steps the view puts there. */
export function towerFloors(timeline: Timeline | null, here: Here | null): Floor[] {
  return FLOOR_LANES.map((id) => {
    const lane = LANES.find((l) => l.id === id)!;
    return {
      lane: id,
      title: lane.title,
      sub: lane.sub,
      steps: timeline?.lanes.find((l) => l.id === id)?.nodes.length ?? 0,
      here: here?.lane === id,
    };
  });
}

// ---------------------------------------------------------------------------
// Kingdom-day calendar strip

/** Last kingdom day on the strip (KvK1 start + its ~60-day length). */
export const STRIP_DAYS = 160;

/** Position on the strip, in percent (clamped). */
export const stripPos = (day: number): number => Math.round((Math.min(Math.max(day, 0), STRIP_DAYS) / STRIP_DAYS) * 1000) / 10;

export function dayText(m: Pick<CalendarMilestone, "day" | "approx">): string {
  if (!m.day) return "Pendente";
  const [a, b] = m.day;
  const range = a === b ? `Dia ${a}` : b >= STRIP_DAYS ? `Dia ${a}+` : `Dias ${a}–${b}`;
  return m.approx ? `${range.replace(/^Dias? /, (s) => `${s}~`)}` : range;
}

export interface TipLink {
  id: string;
  title: string;
}

/**
 * Steps of the view that cite one of the milestone's cards, most specific first (fewest cited cards, then
 * page order), at most `max`.
 */
export function tipsFor(m: Pick<CalendarMilestone, "facts">, blocks: readonly PayloadBlock[], max = 2): TipLink[] {
  const facts = new Set(m.facts);
  return blocks
    .map((b, i) => ({ b, i, n: new Set([...b.cards, ...b.patch_cards]).size }))
    .filter(({ b }) => [...b.cards, ...b.patch_cards].some((c) => facts.has(c)))
    .sort((x, y) => x.n - y.n || x.i - y.i)
    .slice(0, max)
    .map(({ b }) => ({ id: b.id, title: b.title }));
}

/** Blocks shown by a view, in page order ("Already done?" last). */
export function viewBlocks(view: GuideView): PayloadBlock[] {
  return [...view.sections.flatMap((s) => flat(s.blocks)), ...view.alreadyDone].map((b) => b.block);
}
