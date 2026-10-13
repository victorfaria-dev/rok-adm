// Guide set registry (wave H): which block files exist in guides/data, which
// guide each one is, and which guides a profile should be offered. Pure
// functions, no I/O: the caller loads the JSON files and passes them in.

import { selectBlocks, mergeBlockSets, type SelectOptions, type StructuredGuide } from "./blocks";
import {
  SPENDING_PROFILES,
  type AccountProfile,
  type GuideBlock,
  type GuideSection,
  type KingdomStage,
  type SpendingProfile,
} from "./types";

export type GuideSetId = "f2p" | "newkingdom" | "low" | "returning" | "first30" | "recovery" | "kingdomadmin" | "farms" | "latestage";

/**
 * - `base`: a full guide that profile deltas extend (the F2P guide).
 * - `profile-delta`: blocks that replace (same id) or add to the base guide for one spending profile.
 * - `guide`: a standalone guide with its own blocks.
 */
export type GuideSetKind = "base" | "profile-delta" | "guide";

export interface GuideSetInfo {
  id: GuideSetId;
  /** File name under guides/data. */
  file: string;
  kind: GuideSetKind;
  title: string;
  /** Feature-tree IDs (produto/arvore-funcionalidades.md). */
  features: string[];
  /** For `profile-delta` sets: the spending profile the delta is written for. */
  deltaFor?: SpendingProfile;
  /** Chapter titles for this guide when they differ from the F2P guide's. */
  sectionTitles?: Partial<Record<GuideSection, string>>;
}

/** Situations the questionnaire does not ask about but a page can pass (e.g. a "I was zeroed" button). */
export interface GuideSituation {
  /** The player was just zeroed (lost most troops/resources to an attack). */
  zeroed?: boolean;
}

/**
 * City Hall up to which the First 30 Days path is offered. The profile has no
 * account age, so CH is the proxy: the F2P plan puts days 15–40 at about
 * CH12 → CH17 (PHASE_TITLES in blocks.ts), so day 30 is around CH16.
 */
export const FIRST30_MAX_CITY_HALL = 16;

/** Last kingdom day for which the New Kingdom Start guide is offered (its blocks cover days 0–14). */
export const NEWKINGDOM_MAX_DAY = 14;

/** Kingdom stages after KvK1, for which the late-game guide (wave J, `blocks.latestage.json`) is offered. */
export const LATE_STAGES: readonly KingdomStage[] = ["kvk2", "kvk3", "soc"];

export function isLateStage(stage: KingdomStage): boolean {
  return LATE_STAGES.includes(stage);
}

export const GUIDE_SETS: readonly GuideSetInfo[] = [
  {
    id: "f2p",
    file: "blocks.f2p.json",
    kind: "base",
    title: "Early-kingdom guide",
    features: ["F-02", "F-14"],
  },
  {
    id: "low",
    file: "blocks.low.json",
    kind: "profile-delta",
    deltaFor: "low",
    title: "Low spender (pass-only) delta",
    features: ["F-75"],
  },
  {
    id: "newkingdom",
    file: "blocks.newkingdom.json",
    kind: "guide",
    title: "New kingdom start and day-1 survival",
    features: ["F-12"],
  },
  {
    id: "first30",
    file: "blocks.first30.json",
    kind: "guide",
    title: "Your first 30 days",
    features: ["F-11"],
    sectionTitles: {
      overview: "1. What the first 30 days are for",
      day0: "2. Days 1–3",
      plan: "3. Days 4–30",
      mistakes: "4. Mistakes to avoid",
      open: "5. Open questions and pending measurements",
    },
  },
  {
    id: "returning",
    file: "blocks.returning.json",
    kind: "guide",
    title: "Coming back to the game",
    features: ["F-29", "F-28"],
    sectionTitles: {
      overview: "1. What changed while you were away",
      recovery: "2. Your 14-day catch-up plan, and stay, migrate or restart",
      mistakes: "3. Mistakes returners make",
      open: "4. Open questions and pending measurements",
    },
  },
  {
    id: "recovery",
    file: "blocks.recovery.json",
    kind: "guide",
    title: "Recovering after being zeroed",
    features: ["F-13"],
    sectionTitles: {
      recovery: "1. Recovery plan: first, don't quit today",
      mistakes: "2. Log-off risk checklist",
      open: "3. Open questions and pending measurements",
    },
  },
  {
    id: "kingdomadmin",
    file: "blocks.kingdomadmin.json",
    kind: "guide",
    title: "Kingdom administration for kings and council",
    features: ["F-33", "F-34", "F-35"],
    sectionTitles: {
      overview: "1. What a council does",
      plan: "2. Running the kingdom",
      events: "3. KvK, MGE and the event cycle",
      mistakes: "4. Failure points",
      open: "5. Open questions and pending measurements",
    },
  },
  {
    // Wave J: progression after KvK1 (ids `ls-*`). Offered first when kingdomStage is kvk2, kvk3 or soc.
    id: "latestage",
    file: "blocks.latestage.json",
    kind: "guide",
    title: "Late game: KvK2, KvK3 and Season of Conquest",
    features: ["F-02", "F-14"],
    sectionTitles: {
      overview: "1. What changes after KvK1",
      plan: "2. Late-game plan: troops, healing, commanders and gear",
      events: "3. Events after KvK1",
      open: "4. Open questions and pending measurements",
    },
  },
  {
    // Farm guide (wave C, /guides/farms/): its own pages route blocks by id prefix;
    // registered here so every blocks file in guides/data is known. Never offered by guidesForProfile.
    id: "farms",
    file: "blocks.farms.json",
    kind: "guide",
    title: "Farm accounts",
    features: ["F-03", "F-65", "F-66", "F-67", "F-71"],
  },
];

export function guideSetById(id: GuideSetId): GuideSetInfo {
  const s = GUIDE_SETS.find((g) => g.id === id);
  if (!s) throw new Error(`unknown guide set ${id}`);
  return s;
}

/**
 * Profile delta sets that apply to a spending profile: every delta from `low`
 * up to the chosen profile, in profile order (guides/README.md: "Load the base
 * F2P file plus the delta files up to the chosen profile").
 */
export function deltaSetsFor(spending: SpendingProfile): GuideSetInfo[] {
  const rank = SPENDING_PROFILES.indexOf(spending);
  return GUIDE_SETS.filter(
    (s) => s.kind === "profile-delta" && s.deltaFor !== undefined && SPENDING_PROFILES.indexOf(s.deltaFor) <= rank,
  ).sort((a, b) => SPENDING_PROFILES.indexOf(a.deltaFor!) - SPENDING_PROFILES.indexOf(b.deltaFor!));
}

export interface OfferedGuide {
  set: GuideSetInfo;
  /** Why this guide is offered, English. */
  reason: string;
}

/**
 * Guides (base and standalone, not deltas) to offer for a profile, most
 * specific first. The base guide is always last so a returning player or a
 * king sees their own guide first.
 */
export function guidesForProfile(profile: AccountProfile, situation: GuideSituation = {}): OfferedGuide[] {
  const out: OfferedGuide[] = [];
  const add = (id: GuideSetId, reason: string) => out.push({ set: guideSetById(id), reason });

  if (situation.zeroed) add("recovery", "You said you were just zeroed.");
  if (profile.returningPlayer) add("returning", "You are coming back after a break.");
  // Late game right after the situations the player reported (zeroed, returning): for a KvK2+ kingdom it is
  // the plan itself, since the base guide's phase plan ends at KvK1.
  if (isLateStage(profile.kingdomStage)) add("latestage", "Your kingdom is past KvK1: the plan for KvK2, KvK3 and Season of Conquest.");
  if (profile.role === "lider") add("kingdomadmin", "You lead an alliance or sit on the kingdom council.");
  if (profile.kingdomStage === "pre_kvk" && (profile.kingdomDay === null || profile.kingdomDay <= NEWKINGDOM_MAX_DAY))
    add("newkingdom", profile.kingdomDay === null
      ? "Your kingdom is before its first KvK."
      : `Your kingdom is on day ${profile.kingdomDay} (≤ ${NEWKINGDOM_MAX_DAY}).`);
  if (!profile.returningPlayer && profile.cityHall <= FIRST30_MAX_CITY_HALL)
    add("first30", `You are a new player (CH${profile.cityHall} ≤ ${FIRST30_MAX_CITY_HALL}).`);
  const deltas = deltaSetsFor(profile.spending).map((d) => d.title);
  add("f2p", deltas.length > 0 ? `Base guide, with: ${deltas.join(", ")}.` : "Base guide.");
  return out;
}

export type LoadedGuideSets = Partial<Record<GuideSetId, readonly GuideBlock[]>>;

/**
 * The blocks of one guide for a profile. For the base guide, the profile's delta
 * sets are merged in (a delta block with the same id replaces the base block).
 * Missing files count as empty.
 */
export function blocksForGuide(id: GuideSetId, loaded: LoadedGuideSets, profile: AccountProfile): GuideBlock[] {
  const set = guideSetById(id);
  if (set.kind === "profile-delta") throw new Error(`${id} is a profile delta; select the base guide instead`);
  const own = loaded[id] ?? [];
  if (set.kind !== "base") return [...own];
  return mergeBlockSets(own, ...deltaSetsFor(profile.spending).map((d) => loaded[d.id] ?? []));
}

/** `selectBlocks` for one guide set, with the set's chapter titles. */
export function selectGuide(
  id: GuideSetId,
  loaded: LoadedGuideSets,
  profile: AccountProfile,
  opts: SelectOptions = {},
): StructuredGuide {
  const set = guideSetById(id);
  return selectBlocks(blocksForGuide(id, loaded, profile), profile, {
    ...opts,
    sectionTitles: { ...set.sectionTitles, ...opts.sectionTitles },
  });
}
