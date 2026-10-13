// Governor card (F-60): display fields the player types, kept apart from the profile in their own key.
// Everything here is pure or storage-tolerant; the island only renders.
import type { AccountProfile, SpendingProfile } from "@rokadm/core";
import { PROFILE_NAMES } from "@rokadm/core";
import { isF2PAchiever, rarityForCityHall, type Rarity } from "./rarity";

export const CARD_KEY = "ko:card:v1";

/** The 12 alliance swatches, same names as the --ko-alliance-* tokens. */
export const ALLIANCE_COLORS = [
  "crimson", "ember", "amber", "lime", "jade", "teal", "sky", "cobalt", "indigo", "violet", "orchid", "rose",
] as const;
export type AllianceColor = (typeof ALLIANCE_COLORS)[number];

export const NAME_MAX = 16;
export const TAG_MIN = 2;
export const TAG_MAX = 4;
const TAG_RE = /^[A-Z0-9]{2,4}$/;

export interface CardV1 {
  v: 1;
  name: string;
  tag: string;
  color: AllianceColor;
  /** null = follow the OS setting; true/false = the player's own choice on the card page. */
  reduceMotion: boolean | null;
}

export function defaultCard(): CardV1 {
  return { v: 1, name: "", tag: "", color: "cobalt", reduceMotion: null };
}

export interface FieldResult {
  /** Cleaned value, always safe to show and store (falls back to "" when invalid). */
  value: string;
  error: string | null;
}

/** Governor name: trimmed, single spaces, no control characters, up to 16 characters. */
export function validateName(raw: string): FieldResult {
  const value = raw.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
  if (value.length > NAME_MAX) return { value: value.slice(0, NAME_MAX), error: `Up to ${NAME_MAX} characters.` };
  return { value, error: null };
}

/** Alliance tag: 2–4 letters or digits, shown as [ABC]. Brackets and case are forgiven; empty is allowed. */
export function validateTag(raw: string): FieldResult {
  const value = raw.replace(/[\[\]\s]/g, "").toUpperCase();
  if (value === "") return { value: "", error: null };
  if (!TAG_RE.test(value)) return { value: "", error: `${TAG_MIN} to ${TAG_MAX} letters or digits, like ABC.` };
  return { value, error: null };
}

export const isAllianceColor = (x: unknown): x is AllianceColor => ALLIANCE_COLORS.includes(x as AllianceColor);

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/** Parse stored JSON; any field that is missing or malformed gets its default. */
export function parseCard(raw: string | null | undefined): CardV1 {
  const c = defaultCard();
  if (!raw) return c;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return c;
  }
  if (!isRecord(data) || data.v !== 1) return c;
  if (typeof data.name === "string") c.name = validateName(data.name).value;
  if (typeof data.tag === "string") c.tag = validateTag(data.tag).value;
  if (isAllianceColor(data.color)) c.color = data.color;
  if (typeof data.reduceMotion === "boolean") c.reduceMotion = data.reduceMotion;
  return c;
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function storage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function readCard(st: StorageLike | null = storage()): CardV1 {
  try {
    return parseCard(st?.getItem(CARD_KEY));
  } catch {
    return defaultCard();
  }
}

/** Merge a patch into the stored card. Never touches ko:v1. Returns the new state even when storage fails. */
export function writeCard(patch: Partial<Omit<CardV1, "v">>, st: StorageLike | null = storage()): CardV1 {
  const next: CardV1 = { ...readCard(st), ...patch, v: 1 };
  try {
    st?.setItem(CARD_KEY, JSON.stringify(next));
  } catch {
    // Private mode or quota: keep the in-memory state for this page.
  }
  return next;
}

/** Everything the card shows, derived once from the profile and the display fields. */
export interface CardData {
  name: string;
  tag: string;
  color: AllianceColor;
  cityHall: number;
  spending: SpendingProfile;
  spendingLabel: string;
  rarity: Rarity;
  f2pAchiever: boolean;
  /** No saved profile: the card shows sample numbers and says so. */
  example: boolean;
  /** Screenshot verification (F-54) is not built yet, so every card is self-reported. */
  proof: "self-reported";
}

/** Sample numbers for the "Example" card: an F2P account at City Hall 22 shows every mark the card has. */
export const EXAMPLE = { name: "Valerius", tag: "OPS", cityHall: 22, spending: "f2p" as SpendingProfile };

export function cardData(profile: Pick<AccountProfile, "cityHall" | "spending"> | null, card: CardV1): CardData {
  const example = profile === null;
  const cityHall = Math.min(Math.max(Math.floor(profile?.cityHall ?? EXAMPLE.cityHall), 1), 25);
  const spending = profile?.spending ?? EXAMPLE.spending;
  const rarity = rarityForCityHall(cityHall);
  return {
    name: card.name || (example ? EXAMPLE.name : "Governor"),
    tag: card.tag || (example ? EXAMPLE.tag : ""),
    color: card.color,
    cityHall,
    spending,
    spendingLabel: PROFILE_NAMES[spending],
    rarity,
    f2pAchiever: isF2PAchiever(spending, rarity),
    example,
    proof: "self-reported",
  };
}

/** File name for the PNG: letters and digits from the name, or just the brand. */
export function pngFileName(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug ? `kingdomops-card-${slug}.png` : "kingdomops-card.png";
}
