// Commander picker (CMD-*): pure helpers over a lean roster. Client-safe: no dataset JSON is imported here.
// The roster is built at build time (commander-roster.ts) and handed to islands as props, so the client gets
// id, name, rarity, period and a portrait flag only, never facts, sources or notes.
import {
  commanderTiming,
  type CommanderPeriodId,
  type CommanderTiming,
  type KingdomProgress,
} from "@rokadm/planner";
import type { KingdomStage } from "@rokadm/core";

export type PickerRarity = "legendary" | "epic";

export interface PickerCommander {
  id: string;
  name: string;
  rarity: PickerRarity;
  period: CommanderPeriodId;
  /** Unlocks in the offseason before its season (only set when true, to keep props small). */
  offseasonUnlock?: true;
  /** Kingdom day before which it is not obtainable (only set when known). */
  fromDay?: number;
  /** We serve a portrait for it (/commanders/<id>-{96,192}.webp); false = initials tile. */
  portrait: boolean;
}

export interface PickerPeriod {
  id: CommanderPeriodId;
  stage: KingdomStage;
  label: string;
}

export interface PickerRoster {
  /** Game order. */
  periods: PickerPeriod[];
  /** Game order, then A to Z. */
  commanders: PickerCommander[];
}

/** Shown wherever portraits render. Kept in sync with the portrait manifest by a unit test. */
export const PORTRAIT_CREDIT = "Retratos: Rise of Kingdoms © Lilith Games. Site de fã, sem afiliação.";

export const RARITY_TEXT: Record<PickerRarity, string> = { legendary: "Lendário", epic: "Épico" };

/** Short chip for a period ("Season 2"); the header carries the full label. */
export const PERIOD_CHIP: Record<CommanderPeriodId, string> = {
  launch: "Início",
  pre_kvk: "Pré-temporada",
  kvk1: "Temporada 1",
  kvk2: "Temporada 2",
  kvk3: "Temporada 3",
  soc: "Conquista",
};

/** Portrait paths (same pattern as packages/planner commanderPortrait; a test checks they match). */
export function portraitSrc(id: string): { src: string; srcset: string } {
  return { src: `/commanders/${id}-96.webp`, srcset: `/commanders/${id}-96.webp 1x, /commanders/${id}-192.webp 2x` };
}

/** First letters of the first and last words ("Yi Seong-Gye" → "YG"); one word → its first two letters. */
export function initials(name: string): string {
  const words = name.split(/[\s\-']+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

/** Lower case, accents dropped, punctuation and spaces collapsed: "Cheok Jun-gyeong" ≈ "cheok jun gyeong". */
export function normalizeName(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/æ/gi, "ae")
    .replace(/œ/gi, "oe")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Every query word must start a word of the name, or the query (without spaces) must be inside the name. */
export function matchesName(name: string, query: string): boolean {
  const q = normalizeName(query);
  if (q === "") return true;
  const n = normalizeName(name);
  if (n.replace(/ /g, "").includes(q.replace(/ /g, ""))) return true;
  const words = n.split(" ");
  return q.split(" ").every((part) => words.some((w) => w.startsWith(part)));
}

/** Timing for the player's kingdom; null progress (no profile yet) = everything counts as available. */
export function timingFor(c: PickerCommander, progress: KingdomProgress | null): CommanderTiming {
  if (!progress) return "current";
  return commanderTiming({ id: c.id, period: c.period, offseasonUnlock: c.offseasonUnlock === true, fromDay: c.fromDay ?? null }, progress);
}

export function isFuture(c: PickerCommander, progress: KingdomProgress | null): boolean {
  return timingFor(c, progress) === "future";
}

export interface PickerFilter {
  query?: string;
  rarity?: PickerRarity | "all";
  /** Hide commanders whose period the kingdom has not reached. Ignored without progress. */
  availableOnly?: boolean;
}

export function filterCommanders(
  list: readonly PickerCommander[],
  filter: PickerFilter,
  progress: KingdomProgress | null,
): PickerCommander[] {
  const rarity = filter.rarity ?? "all";
  return list.filter(
    (c) =>
      (rarity === "all" || c.rarity === rarity) &&
      (!filter.availableOnly || !isFuture(c, progress)) &&
      matchesName(c.name, filter.query ?? ""),
  );
}

export interface PickerGroup {
  period: PickerPeriod;
  /** The kingdom has not reached this period yet. */
  future: boolean;
  commanders: PickerCommander[];
}

/** Groups in game order; empty groups are dropped (a filtered grid only shows what matched). */
export function groupForPicker(
  periods: readonly PickerPeriod[],
  list: readonly PickerCommander[],
  progress: KingdomProgress | null,
): PickerGroup[] {
  return periods
    .map((period) => {
      const commanders = list
        .filter((c) => c.period === period.id)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      // A period is "coming later" when none of its commanders is reachable yet.
      const future = commanders.length > 0 && commanders.every((c) => isFuture(c, progress));
      return { period, future, commanders };
    })
    .filter((g) => g.commanders.length > 0);
}

/** "Genghis Khan chega em Temporada 3 (KvK3). Ainda não há o que decidir." */
export function arrivesText(name: string, period: PickerPeriod | undefined): string {
  return `${name} chega em ${period?.label ?? "uma temporada posterior"}. Ainda não há o que decidir.`;
}

/**
 * Same answer as the planner's shouldAskAboutCommander (a unit test checks every commander and stage), over the
 * lean roster. The planner function defaults its list to the full dataset, so importing it would ship that dataset.
 * Unknown ids are asked about: missing data must not remove a question.
 */
export function shouldAsk(id: string, list: readonly PickerCommander[], progress: KingdomProgress | null): boolean {
  const c = list.find((x) => x.id === id);
  return !c || !isFuture(c, progress);
}
