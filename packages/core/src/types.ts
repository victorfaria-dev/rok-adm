// Shared domain types for the megahub.
// Contract between packages: @rokadm/data produces these shapes, @rokadm/core and
// @rokadm/planner consume them. Change only with a note in docs/adr.

/** Spending profiles (research/perfis.md). */
export type SpendingProfile = "f2p" | "low" | "medium" | "high" | "whale" | "kraken";
export const SPENDING_PROFILES: readonly SpendingProfile[] = ["f2p", "low", "medium", "high", "whale", "kraken"];

/** Account role. Codes follow research/schemas/fato.md (`funcao`). */
export type Role = "lutador" | "farm" | "rally" | "guarnicao" | "lider";

/** Kingdom stage (`estagio_reino`). */
export type KingdomStage = "pre_kvk" | "kvk1" | "kvk2" | "kvk3" | "soc";

/** Confidence shown to the user. `pending` = waits for in-game measurement (T0). */
export type Confidence = "high" | "medium" | "low" | "pending";

export type Consensus = "unanimous" | "majority" | "split" | "single_source" | "n/a";

// ---------------------------------------------------------------------------
// Knowledge base (F-50 Rules & Formula Library)

export interface SourceRef {
  /** Source slug from research/fontes.md, e.g. "src:lilith-forum". */
  id: string;
  url: string | null;
  quote: string | null;
  accessedAt: string | null;
}

/** One fact card from research/facts, normalized for the app. */
export interface Fact {
  id: string;                 // e.g. "A01-0001"
  domain: string;             // e.g. "A01"
  title: string;
  kind: "mecanica" | "estrategia" | "evento" | "regra" | "ferramenta" | "derivado";
  statement: string;
  values: Array<{ key: string; value: string; unit?: string | null }>;
  /** Relative path to a CSV table under research/facts/<dom>/data, if any. */
  table: string | null;
  profiles: Array<SpendingProfile | "todos">;
  roles: Array<Role | "todas">;
  stages: Array<KingdomStage | "todos">;
  confidence: "alta" | "media" | "baixa";
  status: "bruto" | "organizado" | "verificado" | "contestado" | "parcialmente_obsoleto" | "obsoleto";
  /** Patch the fact is valid from / was verified on, when known. */
  patch: string | null;
  validUntil: string | null;   // data_validade
  invalidatedBy: string | null;
  sources: SourceRef[];
}

/** Rule used by the app: a fact is usable as a firm statement only if this returns true. */
export interface UsabilityPolicy {
  minConfidence: "alta" | "media" | "baixa";
  allowedStatuses: Fact["status"][];
}

export interface PatchEntry {
  version: string;        // e.g. "1.1.09"
  date: string | null;    // ISO date
  confidence: "alta" | "media" | "baixa";
  summary: string;
  factIds: string[];      // C04 cards
}

// ---------------------------------------------------------------------------
// Guide content (F-51 Content Block Engine). Mirrors guides/data/blocks.schema.json.

export type GuidePhase = "overview" | "day0-3" | "day4-14" | "day15-40" | "day41-90" | "pre-kvk1" | "daily" | "event" | "anytime";
export type GuideSection = "overview" | "day0" | "plan" | "daily" | "events" | "farms" | "mistakes" | "recovery" | "open";

export interface GuideBlock {
  id: string;
  title: string;
  phase: GuidePhase;
  section: GuideSection;
  order: number;
  stage: Array<KingdomStage | "todos">;
  perfil: Array<SpendingProfile | "todos">;
  funcao: Array<Role | "todas">;
  hours_min_per_day: number | null;
  time_cost_min: number | null;
  priority: 1 | 2 | 3 | 4 | 5;
  recommended_for: SpendingProfile[];
  ch_range: [number, number] | null;
  civ: string[];
  consensus: string;
  split_views: unknown;
  body_md: string;
  why_md: string;
  cards: string[];
  patch_cards: string[];
  confidence: Confidence;
  uncertain_notes: string | null;
  gaps: string[];
  low_spender_note: string | null;
  as_of: string;
  patch_ref: string | null;
}

// ---------------------------------------------------------------------------
// Questionnaire (F-01) — answers the user gives once; reused by every tool
// (the "Account Snapshot" idea from research/brainstorm/solucoes/_matriz.md).

export interface AccountProfile {
  spending: SpendingProfile;
  /** Rough lifetime spend in USD; past spending changes advice even for current F2P. */
  lifetimeSpendUsd: number | null;
  minutesPerDay: number;            // typical daily play time
  sessionsPerDay: number | null;
  role: Role;
  kingdomStage: KingdomStage;
  kingdomDay: number | null;        // days since the kingdom opened, if known
  cityHall: number;                 // 1..25
  civilization: string | null;
  returningPlayer: boolean;
}

// ---------------------------------------------------------------------------
// Routine (F-15 Time-Boxed Routine)

export interface RoutineTask {
  id: string;
  title: string;
  /** Measured minutes (T0) or null while unmeasured. */
  minutes: number | null;
  /** Estimate used while `minutes` is null, always flagged to the user. */
  estimatedMinutes: number;
  frequency: "daily" | "weekly" | "event";
  value: 1 | 2 | 3 | 4 | 5;         // relative value for account growth
  safeToSkip: boolean;
  unlockCityHall: number | null;
  profiles: Array<SpendingProfile | "todos">;
  roles: Array<Role | "todas">;
  facts: string[];
  gaps: string[];
}
