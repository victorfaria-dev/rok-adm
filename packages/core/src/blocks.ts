// F-51 Content Block Engine (I-05): filter, order and flag guide blocks for one
// account profile. Pure functions, no I/O. Rules follow guides/README.md
// ("How the questionnaire will filter the blocks").

import type {
  AccountProfile,
  Confidence,
  GuideBlock,
  GuidePhase,
  GuideSection,
  SpendingProfile,
} from "./types";

// ---------------------------------------------------------------------------
// Constants

/** Guide chapters in display order, with the titles used by the assembled guide. */
export const GUIDE_SECTIONS: ReadonlyArray<{ id: GuideSection; title: string }> = [
  { id: "overview", title: "1. Visão geral e expectativas realistas" },
  { id: "day0", title: "2. Preparação dos dias 0–3: civilização e primeiras escolhas" },
  { id: "plan", title: "3. Plano fase a fase até a KvK1" },
  { id: "daily", title: "4. Rotina diária por tempo disponível" },
  { id: "events", title: "5. Calendário de eventos e preparação" },
  { id: "farms", title: "6. Farms" },
  { id: "mistakes", title: "7. Erros a evitar" },
  { id: "recovery", title: "8. Se você foi zerado" },
  { id: "open", title: "9. Perguntas em aberto e medições pendentes" },
];

export const GUIDE_PHASES: readonly GuidePhase[] = [
  "overview", "day0-3", "day4-14", "day15-40", "day41-90", "pre-kvk1", "daily", "event", "anytime",
];

/** Sub-headings of the "plan" section (by phase). */
export const PHASE_TITLES: Partial<Record<GuidePhase, string>> = {
  "day4-14": "Dias 4–14 (Prefeitura 8 → 12, aproximadamente)",
  "day15-40": "Dias 15–40 (Prefeitura 12 → 17, VIP 6, aproximadamente)",
  "day41-90": "Dias 41–90 (Prefeitura 17 → 21/22, T4)",
  "pre-kvk1": "Pré-KvK1 e KvK1 (aproximadamente dia 85–100+)",
};

/**
 * Last kingdom day of each dated phase. A phase is "past" when the kingdom day
 * is greater than this value. Undated phases (overview, daily, event, anytime)
 * and pre-kvk1 (open-ended) are never past.
 */
export const PHASE_LAST_DAY: Partial<Record<GuidePhase, number>> = {
  "day0-3": 3,
  "day4-14": 14,
  "day15-40": 40,
  "day41-90": 90,
};

export const PROFILE_NAMES: Record<SpendingProfile, string> = {
  f2p: "F2P", low: "Low", medium: "Medium", high: "High", whale: "Whale", kraken: "Kraken",
};

/** Confidence / consensus as shown to the reader (the stored values stay English enums). */
export const CONFIDENCE_LABELS: Record<string, string> = { high: "alta", medium: "média", low: "baixa", pending: "pendente" };
export const CONSENSUS_LABELS: Record<string, string> = {
  unanimous: "unânime", majority: "maioria", split: "dividido", mechanic: "mecânica",
  single_source: "fonte única", "single-source": "fonte única", minority: "minoria", "n/a": "n/d",
};

/** Daily-routine blocks that are cumulative time tiers (each one says "everything in the lower tier, plus"). */
export const DEFAULT_DAILY_TIER_PATTERN = /^daily-\d+min$/;

// ---------------------------------------------------------------------------
// Types

export interface SelectOptions {
  /** "Minimum plan" view: keep only blocks with priority ≥ this. Default 1 (all). */
  minPriority?: number;
  /** Hide `low` and `pending` confidence blocks. Default false (uncertainty stays visible). */
  hideLowConfidence?: boolean;
  /**
   * Blocks whose `ch_range` ends below the player's CH, or whose phase is already
   * past by kingdom day, go to `alreadyDone` (true, default) or are dropped (false).
   */
  includeAlreadyDone?: boolean;
  /** Use `profile.kingdomDay` to move past phases to `alreadyDone`. Default true. */
  usePhaseByKingdomDay?: boolean;
  /**
   * Daily time tiers: "all" (default) lists every tier that fits;
   * "fold" keeps only the highest fitting tier and nests the lower ones in it.
   */
  dailyTiers?: "all" | "fold";
  /**
   * Profiles that inherit the blocks of a lower profile while their own delta file
   * does not exist. Default `{ low: "f2p" }`: the Low guide is a delta over F2P and
   * F2P blocks carry `low_spender_note` for it (guides/README.md). Pass `{}` for a
   * strict `perfil` match.
   */
  profileFallback?: Partial<Record<SpendingProfile, SpendingProfile>>;
  /** Which block ids are cumulative daily tiers. Default: ids like `daily-15min`. */
  isDailyTier?: (block: GuideBlock) => boolean;
  /**
   * Chapter titles that replace the F2P guide's defaults (`GUIDE_SECTIONS`) for
   * another guide, e.g. the kingdom administration guide. Default `{}`.
   */
  sectionTitles?: Partial<Record<GuideSection, string>>;
}

export type CheckCriterion =
  | "spending" | "role" | "stage" | "time" | "cityHall" | "civilization"
  | "kingdomDay" | "priority" | "confidence";

export interface SelectionCheck {
  criterion: CheckCriterion;
  passed: boolean;
  /** Human-readable explanation, English. */
  detail: string;
}

export type Placement = "guide" | "alreadyDone" | "excluded";

export interface SelectionExplanation {
  blockId: string;
  placement: Placement;
  included: boolean; // placement !== "excluded"
  checks: SelectionCheck[];
  /** One-line summaries: failed checks for excluded blocks, notes otherwise. */
  reasons: string[];
}

export interface BlockFlags {
  /** profile.spending ∈ recommended_for. */
  recommended: boolean;
  confidence: Confidence;
  /** confidence === "pending" (waits for in-game measurement). */
  isPending: boolean;
  /** Block references open gaps (pending measurements or research). */
  hasGaps: boolean;
  /** Block has uncertain notes, a split consensus or low/pending confidence. */
  hasUncertainty: boolean;
  /** Block cites C04 patch cards not yet verified. */
  hasPatchState: boolean;
  /** CH below the block's ch_range: an upcoming step. */
  upcoming: boolean;
  priority: GuideBlock["priority"];
}

export interface SelectedBlock {
  block: GuideBlock;
  flags: BlockFlags;
  /** `low_spender_note`, only for the `low` profile; null otherwise. */
  lowSpenderNote: string | null;
  /** In `dailyTiers: "fold"` mode, lower daily tiers folded into this one. */
  folded: SelectedBlock[];
}

export interface StructuredGuideSection {
  id: GuideSection;
  title: string;
  blocks: SelectedBlock[];
}

export interface StructuredGuide {
  profile: AccountProfile;
  options: Required<Omit<SelectOptions, "isDailyTier">>;
  /** Non-empty sections in display order. */
  sections: StructuredGuideSection[];
  /** "Already done?" list: CH or kingdom day is already past the block. */
  alreadyDone: SelectedBlock[];
  /** Every block not shown, with why. */
  excluded: Array<{ id: string; title: string; reasons: string[] }>;
  meta: {
    asOf: string | null;
    patchRef: string | null;
    totalBlocks: number;
    shownBlocks: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers

const DEFAULTS: Required<Omit<SelectOptions, "isDailyTier">> = {
  minPriority: 1,
  hideLowConfidence: false,
  includeAlreadyDone: true,
  usePhaseByKingdomDay: true,
  dailyTiers: "all",
  profileFallback: { low: "f2p" },
  sectionTitles: {},
};

function resolveOptions(opts: SelectOptions | undefined): Required<Omit<SelectOptions, "isDailyTier">> {
  return { ...DEFAULTS, ...stripUndefined(opts ?? {}) } as Required<Omit<SelectOptions, "isDailyTier">>;
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined && k !== "isDailyTier") (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

const sectionIndex = (s: GuideSection): number => GUIDE_SECTIONS.findIndex((x) => x.id === s);

/** Sort key: section, then order, then priority (higher first), then id. */
export function compareBlocks(a: GuideBlock, b: GuideBlock): number {
  return (
    sectionIndex(a.section) - sectionIndex(b.section) ||
    a.order - b.order ||
    b.priority - a.priority ||
    a.id.localeCompare(b.id)
  );
}

function fmtMinutes(hours: number): string {
  return `${Math.round(hours * 60)} min/dia`;
}

export function blockFlags(block: GuideBlock, profile: AccountProfile): BlockFlags {
  return {
    recommended: block.recommended_for.includes(profile.spending),
    confidence: block.confidence,
    isPending: block.confidence === "pending",
    hasGaps: block.gaps.length > 0,
    hasUncertainty:
      (block.uncertain_notes !== null && block.uncertain_notes.trim() !== "") ||
      block.consensus === "split" ||
      block.confidence === "low" ||
      block.confidence === "pending",
    hasPatchState: block.patch_cards.length > 0,
    upcoming: block.ch_range !== null && profile.cityHall < block.ch_range[0],
    priority: block.priority,
  };
}

// ---------------------------------------------------------------------------
// Explain (single source of truth for the filter)

/**
 * Why a block is in the guide, in "Already done?", or excluded for this profile.
 * `selectBlocks` uses exactly these checks.
 */
export function explainSelection(
  block: GuideBlock,
  profile: AccountProfile,
  opts?: SelectOptions,
): SelectionExplanation {
  const o = resolveOptions(opts);
  const checks: SelectionCheck[] = [];
  const notes: string[] = [];

  // Spending profile
  const direct = block.perfil.includes("todos") || block.perfil.includes(profile.spending);
  const fallback = o.profileFallback[profile.spending];
  const inherited = !direct && fallback !== undefined && block.perfil.includes(fallback);
  const spendOk = direct || inherited;
  checks.push({
    criterion: "spending",
    passed: spendOk,
    detail: spendOk
      ? block.perfil.includes("todos")
        ? "Vale para todos os perfis de gasto."
        : inherited
          ? `Escrito para ${PROFILE_NAMES[fallback!]}; ${PROFILE_NAMES[profile.spending]} segue esse conteúdo até existir o seu próprio delta.`
          : `Escrito para ${PROFILE_NAMES[profile.spending]} (${block.perfil.join(", ")}).`
      : `Só para ${block.perfil.map((p) => (p === "todos" ? "todos" : PROFILE_NAMES[p])).join(", ")}; você é ${PROFILE_NAMES[profile.spending]}.`,
  });

  // Role
  const roleOk = block.funcao.includes("todas") || block.funcao.includes(profile.role);
  checks.push({
    criterion: "role",
    passed: roleOk,
    detail: roleOk
      ? block.funcao.includes("todas") ? "Vale para todas as funções." : `Vale para a função ${profile.role}.`
      : `Só para as funções ${block.funcao.join(", ")}; a sua função é ${profile.role}.`,
  });

  // Kingdom stage
  const stageOk = block.stage.includes("todos") || block.stage.includes(profile.kingdomStage);
  checks.push({
    criterion: "stage",
    passed: stageOk,
    detail: stageOk
      ? `Relevante na etapa do reino ${profile.kingdomStage}.`
      : `Só para as etapas do reino ${block.stage.join(", ")}; o seu reino está em ${profile.kingdomStage}.`,
  });

  // Time per day
  const hours = profile.minutesPerDay / 60;
  const timeOk = block.hours_min_per_day === null || block.hours_min_per_day <= hours + 1e-9;
  checks.push({
    criterion: "time",
    passed: timeOk,
    detail:
      block.hours_min_per_day === null
        ? "Sem mínimo de tempo de jogo por dia."
        : `Exige ≥ ${fmtMinutes(block.hours_min_per_day)}; você joga ${profile.minutesPerDay} min/dia.`,
  });

  // City Hall
  let chPast = false;
  if (block.ch_range === null) {
    checks.push({ criterion: "cityHall", passed: true, detail: "Relevante em qualquer nível de Prefeitura." });
  } else {
    const [lo, hi] = block.ch_range;
    chPast = profile.cityHall > hi;
    const detail = chPast
      ? `Para Prefeitura ${lo}–${hi}; você está na Prefeitura ${profile.cityHall}, então provavelmente já foi feito.`
      : profile.cityHall < lo
        ? `Para Prefeitura ${lo}–${hi}; você está na Prefeitura ${profile.cityHall}: um passo futuro.`
        : `Para Prefeitura ${lo}–${hi}; você está na Prefeitura ${profile.cityHall}.`;
    checks.push({ criterion: "cityHall", passed: !chPast, detail });
  }

  // Civilization
  const civs = block.civ.map((c) => c.toLowerCase());
  const myCiv = profile.civilization?.toLowerCase() ?? null;
  const civOk = civs.length === 0 || (myCiv !== null && civs.includes(myCiv));
  checks.push({
    criterion: "civilization",
    passed: civOk,
    detail:
      civs.length === 0
        ? "Não é específico de uma civilização."
        : civOk
          ? `Específico de ${block.civ.join(", ")}, a sua civilização.`
          : myCiv === null
            ? `Específico de ${block.civ.join(", ")}; a sua civilização não foi definida.`
            : `Específico de ${block.civ.join(", ")}; você joga com ${profile.civilization}.`,
  });

  // Kingdom day (phase already past)
  let phasePast = false;
  const lastDay = PHASE_LAST_DAY[block.phase];
  if (o.usePhaseByKingdomDay && profile.kingdomDay !== null && lastDay !== undefined) {
    phasePast = profile.kingdomDay > lastDay;
    checks.push({
      criterion: "kingdomDay",
      passed: !phasePast,
      detail: phasePast
        ? `A fase ${block.phase} termina no dia ${lastDay} do reino; o seu reino está no dia ${profile.kingdomDay}.`
        : `A fase ${block.phase} vai até o dia ${lastDay} do reino; o seu reino está no dia ${profile.kingdomDay}.`,
    });
  }

  // View toggles
  const prioOk = block.priority >= o.minPriority;
  if (o.minPriority > 1) {
    checks.push({
      criterion: "priority",
      passed: prioOk,
      detail: `Prioridade ${block.priority}/5; a visão atual mostra prioridade ≥ ${o.minPriority}.`,
    });
  }
  const confOk = !(o.hideLowConfidence && (block.confidence === "low" || block.confidence === "pending"));
  if (o.hideLowConfidence) {
    checks.push({
      criterion: "confidence",
      passed: confOk,
      detail: confOk
        ? `Confiança ${CONFIDENCE_LABELS[block.confidence] ?? block.confidence}.`
        : `Confiança ${CONFIDENCE_LABELS[block.confidence] ?? block.confidence}; blocos de baixa confiança e pendentes ficam ocultos nesta visão.`,
    });
  }

  const hardFail = checks.filter(
    (c) => !c.passed && c.criterion !== "cityHall" && c.criterion !== "kingdomDay",
  );
  let placement: Placement;
  if (hardFail.length > 0) placement = "excluded";
  else if (chPast || phasePast) placement = o.includeAlreadyDone ? "alreadyDone" : "excluded";
  else placement = "guide";

  if (placement === "alreadyDone") notes.push("Movido para “Já feito?”: " + failedDetails(checks).join(" "));
  if (placement === "guide") {
    if (block.recommended_for.includes(profile.spending)) notes.push(`Recomendado para ${PROFILE_NAMES[profile.spending]}.`);
    if (block.ch_range !== null && profile.cityHall < block.ch_range[0]) notes.push(`Em breve: a partir da Prefeitura ${block.ch_range[0]}.`);
  }

  return {
    blockId: block.id,
    placement,
    included: placement !== "excluded",
    checks,
    reasons: placement === "excluded" ? failedDetails(checks) : notes,
  };
}

function failedDetails(checks: SelectionCheck[]): string[] {
  return checks.filter((c) => !c.passed).map((c) => c.detail);
}

// ---------------------------------------------------------------------------
// Select

function toSelected(block: GuideBlock, profile: AccountProfile): SelectedBlock {
  return {
    block,
    flags: blockFlags(block, profile),
    lowSpenderNote: profile.spending === "low" ? block.low_spender_note : null,
    folded: [],
  };
}

/**
 * Build the structured guide for a profile: filter, order (section → order →
 * priority), flag, and group by section.
 */
export function selectBlocks(
  blocks: readonly GuideBlock[],
  profile: AccountProfile,
  opts?: SelectOptions,
): StructuredGuide {
  const o = resolveOptions(opts);
  const isTier = opts?.isDailyTier ?? ((b: GuideBlock) => b.section === "daily" && DEFAULT_DAILY_TIER_PATTERN.test(b.id));
  const sorted = [...blocks].sort(compareBlocks);

  const shown: SelectedBlock[] = [];
  const alreadyDone: SelectedBlock[] = [];
  const excluded: StructuredGuide["excluded"] = [];

  for (const b of sorted) {
    const ex = explainSelection(b, profile, o);
    if (ex.placement === "guide") shown.push(toSelected(b, profile));
    else if (ex.placement === "alreadyDone") alreadyDone.push(toSelected(b, profile));
    else excluded.push({ id: b.id, title: b.title, reasons: ex.reasons });
  }

  let guideBlocks = shown;
  if (o.dailyTiers === "fold") {
    const tiers = shown.filter((s) => isTier(s.block));
    if (tiers.length > 1) {
      const top = tiers.reduce((a, b) =>
        (b.block.hours_min_per_day ?? 0) > (a.block.hours_min_per_day ?? 0) ? b : a,
      );
      const lower = tiers.filter((t) => t !== top);
      top.folded = lower;
      guideBlocks = shown.filter((s) => !lower.includes(s));
    }
  }

  const sections: StructuredGuideSection[] = GUIDE_SECTIONS.map((s) => ({
    id: s.id,
    title: o.sectionTitles[s.id] ?? s.title,
    blocks: guideBlocks.filter((g) => g.block.section === s.id),
  })).filter((s) => s.blocks.length > 0);

  const first = sorted[0];
  return {
    profile,
    options: o,
    sections,
    alreadyDone,
    excluded,
    meta: {
      asOf: first?.as_of ?? null,
      patchRef: first?.patch_ref ?? null,
      totalBlocks: blocks.length,
      shownBlocks: guideBlocks.length + guideBlocks.reduce((n, g) => n + g.folded.length, 0),
    },
  };
}

/** All shown blocks of a structured guide in display order (folded tiers right after their top tier). */
export function flattenGuide(guide: StructuredGuide): SelectedBlock[] {
  return guide.sections.flatMap((s) => s.blocks.flatMap((b) => [b, ...b.folded]));
}

/**
 * Merge a base blocks file with profile delta files (guides/README.md: a delta
 * block with the same `id` replaces the base block; new ids are added).
 * Later sets win. Order of first appearance is kept.
 */
export function mergeBlockSets(base: readonly GuideBlock[], ...deltas: ReadonlyArray<readonly GuideBlock[]>): GuideBlock[] {
  const byId = new Map<string, GuideBlock>();
  for (const set of [base, ...deltas]) for (const b of set) byId.set(b.id, b);
  return [...byId.values()];
}
