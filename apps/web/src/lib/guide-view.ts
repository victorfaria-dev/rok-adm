// Client-safe guide logic (used by the island and by the static render).
// Imports only pure functions from @rokadm/core and payload types.
import {
  blockFlags,
  compareBlocks,
  decodeProfile,
  defaultProfile,
  GUIDE_SECTIONS,
  guideSetById,
  isLateStage,
  mergeBlockSets,
  selectBlocks,
  type AccountProfile,
  type GuideSection,
  type KingdomStage,
  type SelectedBlock,
  type StructuredGuide,
  type StructuredGuideSection,
} from "@rokadm/core";
import type { BudgetPayload, DayRow, GuidePayload, LowBudgetPayload, LowPurchaseRow, LowTierRow, PayloadBlock } from "./guide-types";

// ---------------------------------------------------------------------------
// Which profile the guide shows

export type ProfileSource = "url" | "saved" | "default";

export interface ProfileChoice {
  source: ProfileSource;
  profile: AccountProfile;
  /** Profile code in use (url or saved); null for the default guide. */
  code: string | null;
  /** Message when ?p= was present but invalid (the default guide is shown). */
  error: string | null;
  /** True when ?p= is valid and differs from the saved profile ("Use this profile"). */
  canSave: boolean;
}

/**
 * Precedence (ADR 0002, plan §4 screen 3): a valid ?p= wins over the saved
 * profile but never overwrites it. An invalid ?p= shows an error and falls back
 * to the default guide. Without ?p=, the saved profile; else the default guide.
 */
export function chooseProfile(search: string, savedCode: string | null): ProfileChoice {
  const params = new URLSearchParams(search);
  const fallback: ProfileChoice = { source: "default", profile: defaultProfile(), code: null, error: null, canSave: false };
  if (params.has("p")) {
    const code = (params.get("p") ?? "").trim();
    const r = decodeProfile(code);
    if ("profile" in r) {
      // A link to your own saved profile (e.g. right after the questionnaire) is "Your profile".
      if (code === savedCode) return { source: "saved", profile: r.profile, code, error: null, canSave: false };
      return { source: "url", profile: r.profile, code, error: null, canSave: true };
    }
    return { ...fallback, error: "Este link de perfil não é válido, então você está vendo o guia F2P padrão. Peça um link novo ou monte o seu próprio perfil." };
  }
  if (savedCode) {
    const r = decodeProfile(savedCode);
    if ("profile" in r) return { source: "saved", profile: r.profile, code: savedCode, error: null, canSave: false };
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Selection on the payload

export interface ViewBlock extends SelectedBlock {
  block: PayloadBlock;
  lowSpenderNote: string | null; // HTML
  folded: ViewBlock[];
}
export interface ViewSection extends StructuredGuideSection {
  blocks: ViewBlock[];
  /**
   * Stage-aware guide: the section has no step for the player's (late) stage, so it shows the steps written
   * for FALLBACK_STAGE instead, labelled. Absent otherwise.
   */
  fallback?: true;
}
export interface GuideView extends StructuredGuide {
  sections: ViewSection[];
  alreadyDone: ViewBlock[];
}

/** selectBlocks over payload blocks (same objects come back, so the HTML fields stay attached). */
export function selectGuide(payload: GuidePayload, profile: AccountProfile): GuideView {
  return selectBlocks(payload.blocks, profile) as GuideView;
}

/** Stage the web layer falls back to when a later stage has no researched content yet. */
export const FALLBACK_STAGE: KingdomStage = "kvk1";

export const STAGE_NAMES: Record<KingdomStage, string> = {
  pre_kvk: "pré-KvK",
  kvk1: "KvK1",
  kvk2: "KvK2",
  kvk3: "KvK3",
  soc: "Temporada de Conquista",
};

export interface GuideSelection {
  view: GuideView;
  /**
   * The player's real stage when some or all of the guide shows the closest available stage
   * (FALLBACK_STAGE) instead; else null. With the late-game payload only the sections in
   * `fallbackSections` fall back; without it the whole guide does.
   */
  fallbackFrom: KingdomStage | null;
  /** Sections showing FALLBACK_STAGE steps (empty when nothing falls back). */
  fallbackSections: GuideSection[];
  /** True when the main plan comes from the late-game guide (KvK2, KvK3, SoC). */
  lateStage: boolean;
}

/**
 * True when at least one block of the payload is written for this stage. Blocks for
 * every stage ("todos", e.g. the daily routine tiers since wave H) do not count:
 * they say nothing about whether the stage itself was researched.
 */
export function stageHasContent(payload: GuidePayload, stage: KingdomStage): boolean {
  return payload.blocks.some((b) => b.stage.includes(stage));
}

/**
 * Sections of the base guide that walk the road to KvK1 (day 0–3 setup, the phase plan). For a late-stage
 * profile the late-game plan replaces them; they never fall back to KvK1 steps.
 */
export const LATE_REPLACES: readonly GuideSection[] = ["day0", "plan"];

/** Blocks set of the late-game guide (wave J), fetched by the island for KvK2, KvK3 and SoC profiles. */
export const LATE_SET = "latestage";

/**
 * selectGuide plus an honest fallback, done here in the web layer (core keeps its strict stage filter).
 *
 * - pre-KvK and KvK1: the plain selection.
 * - KvK2, KvK3, SoC with the late-game payload: the late-game blocks, and every base block that fits the
 *   real stage (such as the daily routine), selected at the player's real stage, are the guide. A section
 *   with no step for that stage shows its KvK1 steps instead, flagged `fallback`, except the day 0–3 setup
 *   and the phase plan, which the late-game plan replaces.
 * - Without the late-game payload (it failed to load): the whole KvK1 selection, labelled, as before wave J.
 */
export function selectGuideWithFallback(payload: GuidePayload, profile: AccountProfile, late: GuidePayload | null = null): GuideSelection {
  const stage = profile.kingdomStage;
  if (!isLateStage(stage)) return { view: selectGuide(payload, profile), fallbackFrom: null, fallbackSections: [], lateStage: false };
  if (late && stageHasContent(late, stage)) return lateStageGuide(payload, late, profile);
  if (stageHasContent(payload, stage)) return { view: selectGuide(payload, profile), fallbackFrom: null, fallbackSections: [], lateStage: false };
  const view = selectGuide(payload, { ...profile, kingdomStage: FALLBACK_STAGE });
  return { view, fallbackFrom: stage, fallbackSections: view.sections.map((s) => s.id), lateStage: false };
}

function lateStageGuide(payload: GuidePayload, late: GuidePayload, profile: AccountProfile): GuideSelection {
  const strict = selectBlocks([...payload.blocks, ...late.blocks], profile, { sectionTitles: guideSetById("latestage").sectionTitles }) as GuideView;
  const kvk1 = selectGuide(payload, { ...profile, kingdomStage: FALLBACK_STAGE });
  const covered = new Set(strict.sections.map((s) => s.id));
  const fallbackSections = kvk1.sections.map((s) => s.id).filter((id) => !covered.has(id) && !LATE_REPLACES.includes(id));
  const order = (id: GuideSection) => GUIDE_SECTIONS.findIndex((s) => s.id === id);
  const sections: ViewSection[] = [
    ...strict.sections,
    ...kvk1.sections.filter((s) => fallbackSections.includes(s.id)).map((s): ViewSection => ({ ...s, fallback: true })),
  ].sort((a, b) => order(a.id) - order(b.id));
  const alreadyDone = [...strict.alreadyDone, ...kvk1.alreadyDone.filter((b) => fallbackSections.includes(b.block.section))];
  const shown = sections.reduce((n, s) => n + s.blocks.reduce((m, b) => m + 1 + b.folded.length, 0), 0);
  const view: GuideView = {
    ...strict,
    sections,
    alreadyDone,
    meta: { ...strict.meta, totalBlocks: payload.blocks.length + late.blocks.length, shownBlocks: shown },
  };
  return { view, fallbackFrom: fallbackSections.length > 0 ? profile.kingdomStage : null, fallbackSections, lateStage: true };
}

/**
 * Every block of a payload in GUIDE_SECTIONS order, without profile filtering
 * (static guides such as the new-kingdom guide, which apply to every profile).
 */
export function fullGuide(payload: GuidePayload, sectionTitles: Partial<Record<GuideSection, string>> = {}): GuideView {
  const profile = defaultProfile();
  const base = selectBlocks([], profile);
  const sorted = [...payload.blocks].sort(compareBlocks);
  const sections = GUIDE_SECTIONS.map((s) => ({
    id: s.id,
    title: sectionTitles[s.id] ?? s.title,
    blocks: sorted.filter((b) => b.section === s.id).map((b) => ({ block: b, flags: blockFlags(b, profile), lowSpenderNote: null, folded: [] })),
  })).filter((s) => s.blocks.length > 0);
  const first = sorted[0];
  return {
    ...base,
    sections,
    alreadyDone: [],
    meta: { asOf: first?.as_of ?? null, patchRef: first?.patch_ref ?? null, totalBlocks: sorted.length, shownBlocks: sorted.length },
  };
}

/** Number of blocks the page shows for a selection: guide + "Already done?". */
export function shownCount(g: StructuredGuide): { guide: number; alreadyDone: number } {
  return { guide: g.meta.shownBlocks, alreadyDone: g.alreadyDone.length };
}

/** Section heading without the ordinal prefix of GUIDE_SECTIONS ("3. Phase-by-phase…" → "Phase-by-phase…"). */
export function sectionTitle(title: string): string {
  return title.replace(/^\d+\.\s*/, "");
}

// ---------------------------------------------------------------------------
// Budget for a profile (all numbers precomputed at build)

export interface BudgetView {
  researched: boolean;
  /** Show "What buying doesn't change" (Low). */
  showUnchanged: boolean;
  /** The player's row in the day table, when their kingdom day is known and ≤ KvK1. */
  here: DayRow | null;
  /** Kingdom day is past KvK1 start. */
  pastKvK1: boolean;
  daysToKvK1: number | null;
  /** Rows of the checkpoint table, with the player's day merged in. */
  rows: DayRow[];
  /** One-time gems with reached state for the player's City Hall. */
  oneTime: Array<BudgetPayload["oneTimeGems"][number] & { reached: boolean | null }>;
}

export function budgetView(b: BudgetPayload, p: AccountProfile): BudgetView {
  const kvk = b.kvk1Day.value;
  const day = p.kingdomDay;
  const here = day !== null && day >= 1 && day <= kvk ? (b.byDay[day - 1] ?? null) : null;
  const days = new Set(b.checkpoints);
  if (here) days.add(here.day);
  const rows = [...days].sort((a, c) => a - c).map((d) => b.byDay[d - 1]).filter((r): r is DayRow => r !== undefined);
  return {
    researched: b.researched.includes(p.spending),
    showUnchanged: p.spending === "low",
    here,
    pastKvK1: day !== null && day > kvk,
    daysToKvK1: day !== null ? Math.max(0, kvk - day) : null,
    rows,
    oneTime: b.oneTimeGems.map((g) => ({ ...g, reached: g.unlockCityHall === null ? null : p.cityHall >= g.unlockCityHall })),
  };
}

// ---------------------------------------------------------------------------
// Low spender targets (wave J), for the Low profile only

/** Precomputed Low targets, fetched by the island for the Low profile. */
export const LOW_BUDGET_URL = "/data/guide-low-budget.json";

/**
 * Low targets are shown to the Low profile only. Medium and above are not Low (and their own targets are
 * not researched), and F2P has its own numbers; never the other way round either.
 */
export function showsLowTargets(p: AccountProfile): boolean {
  return p.spending === "low";
}

export interface LowBudgetView {
  tiers: Array<Omit<LowTierRow, "lines"> & { lines: Array<{ purchase: LowPurchaseRow; timesPerMonth: number; assumed: boolean }> }>;
  /** Purchases in no tier (the daily-offers ceiling, the one-time half-price coupon). */
  outside: LowPurchaseRow[];
  reachedCH25: boolean;
}

export function lowBudgetView(b: LowBudgetPayload, p: AccountProfile): LowBudgetView {
  const byId = new Map(b.purchases.map((x) => [x.id, x]));
  const get = (id: string): LowPurchaseRow => {
    const x = byId.get(id);
    if (!x) throw new Error(`unknown low purchase ${id}`);
    return x;
  };
  return {
    tiers: b.tiers.map((t) => ({ ...t, lines: t.lines.map((l) => ({ purchase: get(l.purchaseId), timesPerMonth: l.timesPerMonth, assumed: l.assumed })) })),
    outside: b.outsideTiers.map(get),
    reachedCH25: p.cityHall >= 25,
  };
}

// ---------------------------------------------------------------------------
// Share

/** Link to the guide carrying only the profile code. */
export function shareUrl(origin: string, code: string | null): string {
  const u = new URL("/guide/", origin);
  if (code) u.searchParams.set("p", code);
  return u.toString();
}

// ---------------------------------------------------------------------------
// Profile deltas (wave H: blocks.low.json over the F2P base)

/** Lean payload URL of a profile delta set, e.g. /data/guide-low.json. */
export const deltaUrl = (set: string): string => `/data/guide-${set}.json`;

/**
 * The base payload with delta payloads merged in, as core's selectGuide does for
 * the base guide: a delta block with the same id replaces the base block, new ids
 * are added, and the card badges are combined.
 */
export function withDeltas(base: GuidePayload, deltas: readonly GuidePayload[]): GuidePayload {
  if (deltas.length === 0) return base;
  return {
    ...base,
    blocks: mergeBlockSets(base.blocks, ...deltas.map((d) => d.blocks)) as PayloadBlock[],
    badges: Object.assign({}, base.badges, ...deltas.map((d) => d.badges)),
  };
}

// ---------------------------------------------------------------------------
// Confidence summary (static guide pages)

export type ConfidenceLevel = PayloadBlock["confidence"];
const CONFIDENCE_ORDER: readonly ConfidenceLevel[] = ["high", "medium", "low", "pending"];

/** How many blocks sit at each confidence level, high → pending, zero counts dropped. */
export function confidenceCounts(blocks: readonly { confidence: ConfidenceLevel }[]): Array<{ level: ConfidenceLevel; count: number }> {
  return CONFIDENCE_ORDER.map((level) => ({ level, count: blocks.filter((b) => b.confidence === level).length })).filter((c) => c.count > 0);
}
