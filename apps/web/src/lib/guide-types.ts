// Shapes of the lean guide payload (/data/guide.json). Client-safe: types only.
// Built at build time by src/lib/guide-payload.ts; read by the guide island.
import type { Confidence, GuideBlock, SpendingProfile } from "@rokadm/core";

/** "Verified on patch X" badge for one block (F-50 v0). */
export interface PatchBadge {
  /** First version in the block's patch_ref, e.g. "1.1.09". */
  version: string;
  /** Rest of patch_ref, e.g. "latest official EN notes; 1.1.12 reported live (T3)". */
  note: string | null;
  /** Date the block was last checked (as_of). */
  asOf: string;
}

/** Badge of one fact card cited by a block (from factBadge in @rokadm/data). */
export interface CardBadge {
  title: string;
  /** e.g. "Verified on patch 1.1.09 · 2026-06-30", "Unverified", "Disputed". */
  label: string;
  confidence: Confidence;
  usable: boolean;
  /** Source slugs without the "src:" prefix, e.g. ["rkg", "fandom"]. */
  sources: string[];
}

/**
 * A guide block as shipped to the browser. Same fields as GuideBlock (so
 * selectBlocks works on it), except that the Markdown is rendered at build:
 * body_md / why_md are empty and the HTML lives in bodyHtml / whyHtml;
 * uncertain_notes, low_spender_note and split_views hold HTML, not Markdown.
 */
export interface PayloadBlock extends GuideBlock {
  bodyHtml: string;
  whyHtml: string;
  patch: PatchBadge;
}

export interface GuidePayload {
  v: 1;
  /** Which blocks file this came from, e.g. "f2p". */
  set: string;
  blocks: PayloadBlock[];
  badges: Record<string, CardBadge>;
}

// ---------------------------------------------------------------------------
// Budget Reality Check (F-14), precomputed at build from @rokadm/planner.

export interface SourcedValue<T> {
  value: T;
  unit: string;
  facts: string[];
  confidence: Confidence;
  derived: boolean;
  note?: string;
}

export interface BudgetLine {
  text: string;
  facts: string[];
  confidence: Confidence;
}

export interface VipRow {
  vip: number;
  threshold: number;
  /** Day reached with the daily VIP chest only, or null when beyond the horizon. */
  chestOnly: number | null;
  /** Day reached when all guaranteed gems also go to VIP. */
  withGems: number | null;
}

export interface DayRow {
  day: number;
  gems: number;
  vipChestOnly: number;
  vipWithGems: number;
}

export interface BudgetPayload {
  asOf: string;
  /** Kingdom day KvK1 starts (about). */
  kvk1Day: SourcedValue<number>;
  /** By KvK1: what an F2P can reach. */
  targets: Array<{ label: string; value: string } & Omit<SourcedValue<unknown>, "value" | "unit">>;
  /** Income the numbers assume. */
  income: Array<{ label: string; value: string } & Omit<SourcedValue<unknown>, "value" | "unit">>;
  vip: {
    rows: VipRow[];
    chestOnly: { label: string; confidence: Confidence; facts: string[]; note: string };
    withGems: { label: string; confidence: Confidence; facts: string[]; note: string };
  };
  /** Fixed checkpoints shown in the table (days). */
  checkpoints: number[];
  /** One row per kingdom day 1..kvk1Day, for the "you are here" row. */
  byDay: DayRow[];
  oneTimeGems: Array<{ id: string; label: string; gems: number; unlockCityHall: number | null; confidence: Confidence; facts: string[] }>;
  assumptions: Array<{ text: string; facts: string[]; gaps: string[] }>;
  /** "What buying doesn't change" (shown to Low). */
  unchanged: BudgetLine[];
  /** Profiles with fact-backed numbers (only f2p today). */
  researched: SpendingProfile[];
}

export interface GuideData {
  guide: GuidePayload;
  budget: BudgetPayload;
}
