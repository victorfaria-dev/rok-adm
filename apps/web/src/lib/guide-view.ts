// Client-safe guide logic (used by the island and by the static render).
// Imports only pure functions from @rokadm/core and payload types.
import {
  blockFlags,
  compareBlocks,
  decodeProfile,
  defaultProfile,
  GUIDE_SECTIONS,
  selectBlocks,
  type AccountProfile,
  type SelectedBlock,
  type StructuredGuide,
  type StructuredGuideSection,
} from "@rokadm/core";
import type { BudgetPayload, DayRow, GuidePayload, PayloadBlock } from "./guide-types";

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
    return { ...fallback, error: "This profile link is not valid, so you are seeing the default F2P guide. Ask for a new link or build your own profile." };
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
}
export interface GuideView extends StructuredGuide {
  sections: ViewSection[];
  alreadyDone: ViewBlock[];
}

/** selectBlocks over payload blocks (same objects come back, so the HTML fields stay attached). */
export function selectGuide(payload: GuidePayload, profile: AccountProfile): GuideView {
  return selectBlocks(payload.blocks, profile) as GuideView;
}

/**
 * Every block of a payload in GUIDE_SECTIONS order, without profile filtering
 * (static guides such as the new-kingdom guide, which apply to every profile).
 */
export function fullGuide(payload: GuidePayload): GuideView {
  const profile = defaultProfile();
  const base = selectBlocks([], profile);
  const sorted = [...payload.blocks].sort(compareBlocks);
  const sections = GUIDE_SECTIONS.map((s) => ({
    id: s.id,
    title: s.title,
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
// Share

/** Link to the guide carrying only the profile code. */
export function shareUrl(origin: string, code: string | null): string {
  const u = new URL("/guide/", origin);
  if (code) u.searchParams.set("p", code);
  return u.toString();
}
