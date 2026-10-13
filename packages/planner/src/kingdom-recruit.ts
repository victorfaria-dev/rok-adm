// F-42: recruitment post generator. The council fills in facts about its own kingdom; this module
// turns them into a post for Discord, Reddit or plain text. Deterministic (no dates, no random),
// empty fields are left out and nothing is claimed that the council did not enter or tick.
// Imports only helpers (no fact data, see NOTES.md bundle rule).

import { cleanLine, cleanText, formatCompact, isIsoTime, isRecord, parseQuantity, type KingdomDocBase } from "./kingdom-common";

export const RECRUIT_LIMITS = {
  kingdom: 40,
  stageOther: 40,
  seed: 60,
  languages: 120,
  timezones: 120,
  minPower: 20,
  otherReq: 300,
  roleNote: 120,
  roles: 12,
  roleCount: 99,
  migrationNote: 600,
  contact: 160,
} as const;

/** Discord message limit (characters) for non-Nitro accounts. */
export const DISCORD_LIMIT = 2000;
/** Reddit post title limit (characters). */
export const REDDIT_TITLE_LIMIT = 300;
/** Reddit self-post body limit (characters). */
export const REDDIT_BODY_LIMIT = 40_000;

export const RECRUIT_STAGES = [
  { value: "", label: "Not stated" },
  { value: "pre-kvk", label: "Pre-KvK" },
  { value: "kvk1", label: "KvK1" },
  { value: "kvk2", label: "KvK2" },
  { value: "kvk3", label: "KvK3" },
  { value: "soc", label: "Season of Conquest" },
  { value: "other", label: "Other" },
] as const;
export type RecruitStage = (typeof RECRUIT_STAGES)[number]["value"];

export const RECRUIT_OFFERS = [
  { key: "mge-rules", label: "Transparent MGE rules" },
  { key: "dkp-rules", label: "Published DKP rules" },
  { key: "written-rules", label: "Written kingdom rules" },
  { key: "returners", label: "Returning players welcome" },
  { key: "farm-friendly", label: "Farm-friendly" },
  { key: "discord", label: "Active Discord" },
  { key: "beginners", label: "Help for beginners" },
  { key: "languages", label: "Players of several languages welcome" },
] as const;
export type RecruitOffer = (typeof RECRUIT_OFFERS)[number]["key"];

export const RECRUIT_ROLES = [
  { key: "rally-leader", label: "Rally leader" },
  { key: "garrison-leader", label: "Garrison leader" },
  { key: "scout", label: "Scout / map officer" },
  { key: "event-officer", label: "Event / MGE officer" },
  { key: "data-officer", label: "Data officer" },
  { key: "translator", label: "Translator" },
  { key: "alliance-leader", label: "Alliance leader" },
  { key: "farmers", label: "Farmers / new players" },
  { key: "other", label: "Other" },
] as const;
export type RecruitRoleKey = (typeof RECRUIT_ROLES)[number]["key"];

export interface RecruitRole {
  role: RecruitRoleKey;
  /** How many people (1–99), or null when not stated. */
  count: number | null;
  note: string;
}

export interface RecruitInput {
  /** Kingdom number or name, as the council writes it (e.g. "1234" or "K1234"). */
  kingdom: string;
  stage: RecruitStage;
  /** Label when stage is "other". */
  stageOther: string;
  seed: string;
  languages: string;
  timezones: string;
  /** Minimum power as typed ("30m", "30,000,000"); see parseQuantity. */
  minPower: string;
  /** Minimum City Hall level as typed (1–25). */
  minCityHall: string;
  otherReq: string;
  offers: RecruitOffer[];
  roles: RecruitRole[];
  migrationNote: string;
  contact: string;
}

export interface RecruitDoc extends KingdomDocBase, RecruitInput {}

export function emptyRecruitInput(): RecruitInput {
  return {
    kingdom: "", stage: "", stageOther: "", seed: "", languages: "", timezones: "",
    minPower: "", minCityHall: "", otherReq: "", offers: [], roles: [], migrationNote: "", contact: "",
  };
}

const STAGE_SET = new Set<string>(RECRUIT_STAGES.map((s) => s.value));
const OFFER_SET = new Set<string>(RECRUIT_OFFERS.map((o) => o.key));
const ROLE_SET = new Set<string>(RECRUIT_ROLES.map((r) => r.key));

function parseCount(x: unknown): number | null {
  const n = typeof x === "string" ? Number(x.trim()) : x;
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= RECRUIT_LIMITS.roleCount ? n : null;
}

/** Tolerant parse of untrusted recruit data (storage, imports). Null only when it is not an object. */
export function parseRecruitDoc(x: unknown): RecruitDoc | null {
  if (!isRecord(x)) return null;
  const offers = Array.isArray(x.offers) ? [...new Set(x.offers.filter((o): o is RecruitOffer => typeof o === "string" && OFFER_SET.has(o)))] : [];
  const roles: RecruitRole[] = [];
  if (Array.isArray(x.roles)) {
    for (const r of x.roles) {
      if (roles.length >= RECRUIT_LIMITS.roles) break;
      if (!isRecord(r) || typeof r.role !== "string" || !ROLE_SET.has(r.role)) continue;
      roles.push({ role: r.role as RecruitRoleKey, count: parseCount(r.count), note: cleanLine(r.note, RECRUIT_LIMITS.roleNote) });
    }
  }
  return {
    id: typeof x.id === "string" && x.id.trim() ? cleanLine(x.id, 64) : "draft",
    updatedAt: isIsoTime(x.updatedAt) ? x.updatedAt : new Date(0).toISOString(),
    kingdom: cleanLine(x.kingdom, RECRUIT_LIMITS.kingdom),
    stage: typeof x.stage === "string" && STAGE_SET.has(x.stage) ? (x.stage as RecruitStage) : "",
    stageOther: cleanLine(x.stageOther, RECRUIT_LIMITS.stageOther),
    seed: cleanLine(x.seed, RECRUIT_LIMITS.seed),
    languages: cleanLine(x.languages, RECRUIT_LIMITS.languages),
    timezones: cleanLine(x.timezones, RECRUIT_LIMITS.timezones),
    minPower: cleanLine(x.minPower, RECRUIT_LIMITS.minPower),
    minCityHall: cleanLine(x.minCityHall, 4),
    otherReq: cleanText(x.otherReq, RECRUIT_LIMITS.otherReq),
    offers,
    roles,
    migrationNote: cleanText(x.migrationNote, RECRUIT_LIMITS.migrationNote),
    contact: cleanLine(x.contact, RECRUIT_LIMITS.contact),
  };
}

// ---------------------------------------------------------------------------
// Validation of typed numbers (UI shows the message under the field).

export interface RecruitErrors {
  minPower?: string;
  minCityHall?: string;
}

/** Minimum City Hall level 1–25, or null when not a whole number in range. */
export function parseCityHall(text: string): number | null {
  const s = text.trim();
  if (!/^\d{1,2}$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= 25 ? n : null;
}

export function recruitErrors(input: RecruitInput): RecruitErrors {
  const e: RecruitErrors = {};
  if (input.minPower.trim() && parseQuantity(input.minPower) === null) e.minPower = "Write the power as a number, for example 30m, 30,000,000 or 500k.";
  if (input.minCityHall.trim() && parseCityHall(input.minCityHall) === null) e.minCityHall = "Write a City Hall level from 1 to 25.";
  return e;
}

// ---------------------------------------------------------------------------
// Escaping

export type RecruitFormat = "discord" | "reddit" | "text";

/**
 * Escape user text so it cannot break the post's formatting: inline markers (* _ ~ ` | \ and, for
 * Reddit, [ ] ^) everywhere; block markers (#, >, -, +, "1.") at the start of a line. Discord
 * mass mentions (@everyone, @here) are defused with a zero-width space. Plain text is unchanged.
 */
export function escapeMarkdown(text: string, format: RecruitFormat): string {
  if (format === "text") return text;
  const inline = format === "reddit" ? /([\\*_~`|[\]^])/g : /([\\*_~`|])/g;
  return text
    .split("\n")
    .map((line) => {
      let l = line.replace(inline, "\\$1");
      l = l.replace(/^(\s*)([#>+-])/, "$1\\$2").replace(/^(\s*\d+)([.)])(\s)/, "$1\\$2$3");
      if (format === "discord") l = l.replace(/@(everyone|here)\b/gi, "@​$1");
      return l;
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// Post builder

export interface RecruitPost {
  format: RecruitFormat;
  /** Reddit only: post title (≤ 300 characters). */
  title?: string;
  body: string;
  /** Characters in the body. */
  chars: number;
  /** Body limit for the format (null = none). */
  limit: number | null;
  over: boolean;
}

const stageLabel = (i: RecruitInput): string =>
  !i.stage ? "" : i.stage === "other" ? i.stageOther : (RECRUIT_STAGES.find((s) => s.value === i.stage)?.label ?? "");
const roleLabel = (k: RecruitRoleKey): string => RECRUIT_ROLES.find((r) => r.key === k)?.label ?? k;
const offerLabel = (k: RecruitOffer): string => RECRUIT_OFFERS.find((o) => o.key === k)?.label ?? k;

/** "Kingdom 1234" for a bare number, else the council's own text ("K1234", "Kingdom of X"). */
export function kingdomLabel(kingdom: string): string {
  const k = kingdom.trim();
  return /^\d+$/.test(k) ? `Kingdom ${k}` : k;
}

function roleLine(r: RecruitRole, esc: (s: string) => string): string {
  const count = r.count && r.count > 1 ? ` ×${r.count}` : "";
  const note = r.note ? ` — ${esc(r.note)}` : "";
  return `${roleLabel(r.role)}${count}${note}`;
}

/** Facts as label/value rows, in post order, empty ones left out. */
function factRows(i: RecruitInput, esc: (s: string) => string): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  const stage = stageLabel(i);
  if (stage) rows.push(["Stage", esc(stage)]);
  if (i.seed) rows.push(["Seed", esc(i.seed)]);
  if (i.languages) rows.push(["Languages", esc(i.languages)]);
  if (i.timezones) rows.push(["Timezones", esc(i.timezones)]);
  return rows;
}

function requirementLines(i: RecruitInput, esc: (s: string) => string): string[] {
  const out: string[] = [];
  const power = parseQuantity(i.minPower);
  if (i.minPower.trim() && power !== null) out.push(`Power: ${formatCompact(power)}+`);
  const ch = parseCityHall(i.minCityHall);
  if (ch !== null) out.push(`City Hall: ${ch}+`);
  // Lines the council already wrote as a list ("- 30 KP") lose their own marker: the post adds one.
  for (const line of i.otherReq.split("\n").map((l) => l.trim().replace(/^[-*•]\s+/, "")).filter(Boolean)) out.push(esc(line));
  return out;
}

/** Short headline used by Discord and plain text. */
function headline(i: RecruitInput, esc: (s: string) => string): string {
  return i.kingdom ? `${esc(kingdomLabel(i.kingdom))} is recruiting` : "We are recruiting";
}

/** Reddit title: "[K1234] KvK2 kingdom recruiting: Rally leader, Translator", cut to 300 characters. */
export function redditTitle(i: RecruitInput): string {
  const k = i.kingdom.trim();
  const tag = k ? (/^\d+$/.test(k) ? `[K${k}] ` : `[${k}] `) : "";
  const stage = stageLabel(i);
  const roles = [...new Set(i.roles.map((r) => roleLabel(r.role)))];
  let t = `${tag}${stage ? `${stage} kingdom` : "Kingdom"} recruiting${roles.length ? `: ${roles.join(", ")}` : ""}`;
  if (t.length > REDDIT_TITLE_LIMIT) t = `${t.slice(0, REDDIT_TITLE_LIMIT - 1).trimEnd()}…`;
  return t;
}

/**
 * Build the post. Discord uses **bold** labels and "- " lists; Reddit adds blank lines around
 * lists (Reddit needs them) and a separate title; plain text has no markup.
 */
export function recruitPost(input: RecruitInput, format: RecruitFormat): RecruitPost {
  const esc = (s: string) => escapeMarkdown(s, format);
  const md = format !== "text";
  const bold = (s: string) => (md ? `**${s}**` : s);
  const parts: string[][] = [];

  if (format !== "reddit") parts.push([bold(headline(input, esc))]);

  const facts = factRows(input, esc).map(([l, v]) => (md ? `${bold(`${l}:`)} ${v}` : `${l}: ${v}`));
  // Reddit joins lines with two trailing spaces ("  \n") so they do not collapse into one paragraph.
  if (facts.length) parts.push(format === "reddit" ? [facts.join("  \n")] : facts);

  const list = (heading: string, items: string[]) => {
    if (!items.length) return;
    const lines = items.map((x) => `- ${x}`);
    parts.push(format === "reddit" ? [bold(heading), "", ...lines] : [md ? bold(heading) : `${heading}:`, ...lines]);
  };
  list("Open roles", input.roles.map((r) => roleLine(r, esc)));
  list("Requirements", requirementLines(input, esc));
  list("What we offer", input.offers.map(offerLabel));

  if (input.migrationNote) parts.push([md ? bold("Migration") : "Migration:", esc(input.migrationNote)]);
  if (input.contact) parts.push([`${md ? bold("Contact:") : "Contact:"} ${esc(input.contact)}`]);

  const body = parts.map((p) => p.join("\n")).join("\n\n");
  const limit = format === "discord" ? DISCORD_LIMIT : format === "reddit" ? REDDIT_BODY_LIMIT : null;
  const chars = body.length;
  return {
    format,
    ...(format === "reddit" ? { title: redditTitle(input) } : {}),
    body,
    chars,
    limit,
    over: limit !== null && chars > limit,
  };
}

/** true when nothing that would appear in a post has been entered yet. */
export function recruitIsEmpty(i: RecruitInput): boolean {
  return !i.kingdom && !stageLabel(i) && !i.seed && !i.languages && !i.timezones && !i.minPower.trim() && !i.minCityHall.trim()
    && !i.otherReq && !i.offers.length && !i.roles.length && !i.migrationNote && !i.contact;
}
