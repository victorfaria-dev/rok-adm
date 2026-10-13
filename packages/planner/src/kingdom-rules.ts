// F-33: kingdom rules page and charter. A rules document is plain JSON (KingdomDocBase) so it can
// be saved in ko:kingdom:v1, travel in a share link (#d=) and later sync as-is. Text is written by
// the council; this module never invents rules. Section bodies use a tiny, safe markup that the UI
// renders as elements (never as HTML): blank line = new paragraph, "- " = bullet, "1. " = numbered.
// Imports only helpers (no fact data, see NOTES.md bundle rule).

import { cleanLine, cleanText, isIsoTime, isRecord, type KingdomDocBase } from "./kingdom-common";

export const RULES_LIMITS = {
  kingdom: 40,
  title: 80,
  languageNote: 200,
  intro: 2000,
  heading: 80,
  body: 4000,
  sections: 30,
  signers: 20,
  signer: 40,
} as const;

export interface RulesSection {
  id: string;
  heading: string;
  body: string;
}

export interface RulesCharter {
  /** Day the council agreed the charter (YYYY-MM-DD) or null. */
  agreedOn: string | null;
  /** Names typed by the council (who signed), in order. */
  signers: string[];
}

export interface RulesDoc extends KingdomDocBase {
  kingdom: string;
  title: string;
  languageNote: string;
  intro: string;
  sections: RulesSection[];
  charter: RulesCharter;
  /** Day the council last reviewed the rules (YYYY-MM-DD) or null. */
  lastReviewed: string | null;
}

/** true for a real calendar day written as YYYY-MM-DD. */
export function isCalendarDay(x: unknown): x is string {
  if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
  const d = new Date(`${x}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === x;
}

export const DEFAULT_LANGUAGE_NOTE = "Written in English; translations are informal, the original prevails.";

export function emptyRulesDoc(id: string, now: Date = new Date()): RulesDoc {
  return {
    id,
    updatedAt: now.toISOString(),
    kingdom: "",
    title: "",
    languageNote: DEFAULT_LANGUAGE_NOTE,
    intro: "",
    sections: [],
    charter: { agreedOn: null, signers: [] },
    lastReviewed: null,
  };
}

/** Signers from free text: one name per line (or comma separated), trimmed, empty lines dropped, max 20. */
export function parseSigners(x: unknown): string[] {
  const list = Array.isArray(x) ? x : typeof x === "string" ? x.split(/[\n,]/) : [];
  const out: string[] = [];
  for (const s of list) {
    const name = cleanLine(s, RULES_LIMITS.signer);
    if (name && out.length < RULES_LIMITS.signers) out.push(name);
  }
  return out;
}

function parseSection(x: unknown, i: number, seen: Set<string>): RulesSection | null {
  if (!isRecord(x)) return null;
  const heading = cleanLine(x.heading, RULES_LIMITS.heading);
  const body = cleanText(x.body, RULES_LIMITS.body);
  let id = typeof x.id === "string" ? cleanLine(x.id, 64) : "";
  if (!id || seen.has(id)) {
    let n = i + 1;
    while (seen.has(`s${n}`)) n++;
    id = `s${n}`;
  }
  seen.add(id);
  return { id, heading, body };
}

/**
 * Tolerant parse of untrusted rules data (storage, share links, imports): every field is cut to its
 * limit or replaced by its default, bad sections are dropped. Null only when it is not an object.
 */
export function parseRulesDoc(x: unknown): RulesDoc | null {
  if (!isRecord(x)) return null;
  const seen = new Set<string>();
  const sections: RulesSection[] = [];
  if (Array.isArray(x.sections)) {
    for (const [i, s] of x.sections.entries()) {
      if (sections.length >= RULES_LIMITS.sections) break;
      const sec = parseSection(s, i, seen);
      if (sec) sections.push(sec);
    }
  }
  const c = isRecord(x.charter) ? x.charter : {};
  return {
    id: typeof x.id === "string" && x.id.trim() ? cleanLine(x.id, 64) : "shared",
    updatedAt: isIsoTime(x.updatedAt) ? x.updatedAt : new Date(0).toISOString(),
    kingdom: cleanLine(x.kingdom, RULES_LIMITS.kingdom),
    title: cleanLine(x.title, RULES_LIMITS.title),
    languageNote: typeof x.languageNote === "string" ? cleanLine(x.languageNote, RULES_LIMITS.languageNote) : DEFAULT_LANGUAGE_NOTE,
    intro: cleanText(x.intro, RULES_LIMITS.intro),
    sections,
    charter: { agreedOn: isCalendarDay(c.agreedOn) ? c.agreedOn : null, signers: parseSigners(c.signers) },
    lastReviewed: isCalendarDay(x.lastReviewed) ? x.lastReviewed : null,
  };
}

/** Title to show: the council's title, else "<kingdom> rules", else "Kingdom rules". */
export function rulesDisplayTitle(doc: Pick<RulesDoc, "title" | "kingdom">): string {
  if (doc.title) return doc.title;
  if (doc.kingdom) return `${doc.kingdom} rules`;
  return "Kingdom rules";
}

/** Move the section at index `from` by `delta` (−1 up, +1 down). Out-of-range moves return the same list. */
export function moveSection<T>(list: readonly T[], from: number, delta: number): T[] {
  const to = from + delta;
  if (from < 0 || from >= list.length || to < 0 || to >= list.length) return [...list];
  const out = [...list];
  const [item] = out.splice(from, 1);
  out.splice(to, 0, item!);
  return out;
}

// ---------------------------------------------------------------------------
// Body markup → blocks (pure). Rendering is done by the UI with elements, so text stays escaped.

export type RulesBlock =
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; start: number; items: string[] };

const BULLET = /^-\s+(.*)$/;
const NUMBERED = /^(\d{1,3})[.)]\s+(.*)$/;

/**
 * Split a section body into blocks: a blank line ends a block, lines starting "- " make a bullet
 * list, "1. " (or "1) ") a numbered list starting at that number, other lines a paragraph (line
 * breaks kept). An indented line right after a list item continues that item.
 */
export function bodyToBlocks(text: string): RulesBlock[] {
  const blocks: RulesBlock[] = [];
  let cur: RulesBlock | null = null;
  const close = () => {
    if (cur) blocks.push(cur);
    cur = null;
  };
  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      close();
      continue;
    }
    const b = BULLET.exec(line);
    const n = b ? null : NUMBERED.exec(line);
    const c = cur as RulesBlock | null;
    if (b) {
      if (c?.type === "ul") c.items.push(b[1]!);
      else {
        close();
        cur = { type: "ul", items: [b[1]!] };
      }
    } else if (n) {
      if (c?.type === "ol") c.items.push(n[2]!);
      else {
        close();
        cur = { type: "ol", start: Number(n[1]), items: [n[2]!] };
      }
    } else if (c && c.type !== "p" && /^\s/.test(raw)) {
      c.items[c.items.length - 1] += ` ${line}`;
    } else if (c?.type === "p") {
      c.lines.push(line);
    } else {
      close();
      cur = { type: "p", lines: [line] };
    }
  }
  close();
  return blocks;
}

// ---------------------------------------------------------------------------
// Section templates: prompts in [brackets] for the council to replace. They state no facts about
// any kingdom; they only list the questions a written rule usually answers.

export interface RulesTemplate {
  key: string;
  heading: string;
  body: string;
}

export const RULES_TEMPLATES: readonly RulesTemplate[] = [
  {
    key: "leadership",
    heading: "Leadership & council",
    body: [
      "The kingdom is run by [a council of the top alliances / the king and a council].",
      "",
      "- King: [name or 'chosen by ...']",
      "- Council members: [alliance tags and their seats]",
      "- How someone joins or leaves the council: [rule]",
      "- How the king is chosen and for how long: [rule]",
    ].join("\n"),
  },
  {
    key: "decisions",
    heading: "How decisions are made",
    body: [
      "Decisions are made by [majority vote of council seats / consensus / the king after council advice].",
      "",
      "- Who can propose a change: [rule]",
      "- How long a vote stays open: [days]",
      "- Where decisions are logged so members can read them: [channel or document]",
      "- When these rules are reviewed: [for example, before each KvK]",
    ].join("\n"),
  },
  {
    key: "kvk",
    heading: "KvK requirements & DKP",
    body: [
      "Every account above [power] is expected to meet the KvK requirement.",
      "",
      "- DKP formula: [kill points tier 4 × ..., tier 5 × ..., deaths × ...]",
      "- Requirement: [DKP target by power band]",
      "- Where to check your own target: [link to the council's requirements card, made at /kingdom/requirements/]",
      "- What happens when the requirement is missed: [rule]",
    ].join("\n"),
  },
  {
    key: "mge",
    heading: "MGE policy",
    body: [
      "MGE in this kingdom is [fixed / on rotation / free-for-all].",
      "",
      "- Who may take the top ranks: [rule, for example by DKP or rotation order]",
      "- How the list is published: [channel or link]",
      "- Points cap for everyone else: [number or 'none']",
      "- What happens when someone overtakes a fixed rank: [rule]",
    ].join("\n"),
  },
  {
    key: "migration",
    heading: "Migration & new members",
    body: [
      "Migration into the kingdom is [open / by application / closed].",
      "",
      "- Minimums for migrants: [power, kill points, City Hall level, other]",
      "- How to apply: [who to contact and where]",
      "- Alliance placement after arrival: [rule]",
      "- First days: [what new members should read or do]",
    ].join("\n"),
  },
  {
    key: "farms",
    heading: "Farms & alt accounts",
    body: [
      "Farm and alt accounts are [allowed / allowed with registration / not allowed].",
      "",
      "- Where farms live: [alliance or zone]",
      "- Registration: [how to register a farm with the council]",
      "- Farms in KvK and MGE: [rule]",
    ].join("\n"),
  },
  {
    key: "warnings",
    heading: "Warnings, exit notice and appeals",
    body: [
      "Breaking these rules leads to [a warning, then ...].",
      "",
      "1. First time: [action]",
      "2. Second time: [action]",
      "3. After that: [action]",
      "",
      "- How to appeal: [who to contact, within how many days]",
      "- Leaving the kingdom: [notice period and how to tell the council]",
    ].join("\n"),
  },
  {
    key: "activity",
    heading: "Activity expectations",
    body: [
      "Members are expected to [take part in ...].",
      "",
      "- Events everyone joins: [list]",
      "- Inactive accounts: [after how many days, and what happens]",
      "- Telling the council you will be away: [how]",
    ].join("\n"),
  },
  {
    key: "communication",
    heading: "Communication & languages",
    body: [
      "Official announcements are posted in [kingdom chat / Discord channel / other].",
      "",
      "- Languages used: [list]",
      "- Translators or language contacts: [names or roles]",
      "- Respect between language groups: [rule]",
      "- Links: share them on Discord or other outside channels, not in in-game chat.",
    ].join("\n"),
  },
  {
    key: "conflicts",
    heading: "Conflicts with other kingdoms and alliances",
    body: [
      "Agreements with other kingdoms (NAPs, borders, zones) are made by [who].",
      "",
      "- Current agreements are listed in: [channel or document]",
      "- Attacking a protected target: [rule]",
      "- Disputes between our own alliances: [who decides, how]",
    ].join("\n"),
  },
];

/** Templates pre-selected for a new kingdom charter (F-33 charter story). */
export const CHARTER_STARTER_KEYS: readonly string[] = ["leadership", "decisions", "kvk", "mge", "migration", "warnings", "communication"];

export function sectionFromTemplate(key: string, id: string): RulesSection | null {
  const t = RULES_TEMPLATES.find((x) => x.key === key);
  return t ? { id, heading: t.heading, body: t.body } : null;
}

/** A new charter: starter sections plus an intro prompt; the council fills in the [brackets]. */
export function newCharterDoc(id: string, now: Date = new Date(), sectionId: (i: number) => string = (i) => `s${i + 1}`): RulesDoc {
  const doc = emptyRulesDoc(id, now);
  doc.title = "Kingdom charter";
  doc.intro = "This charter is agreed by the council of [kingdom]. It explains how the kingdom is run and what every member can expect.";
  doc.sections = CHARTER_STARTER_KEYS.map((k, i) => sectionFromTemplate(k, sectionId(i))!);
  return doc;
}

/** true when the text still has a [bracket] prompt to replace. */
export function hasPrompts(text: string): boolean {
  return /\[[^\]\n]+\]/.test(text);
}

// ---------------------------------------------------------------------------
// Plain-text export (when a link is too long for chat, or for a document elsewhere).

export function rulesToPlainText(doc: RulesDoc): string {
  const out: string[] = [rulesDisplayTitle(doc)];
  if (doc.kingdom && doc.title) out.push(doc.kingdom);
  if (doc.languageNote) out.push(doc.languageNote);
  if (doc.intro) out.push("", doc.intro);
  for (const s of doc.sections) {
    out.push("", s.heading || "Untitled section");
    if (s.body) out.push(s.body);
  }
  const { agreedOn, signers } = doc.charter;
  if (agreedOn || signers.length) {
    out.push("", "Charter");
    if (agreedOn) out.push(`Agreed on ${agreedOn}`);
    if (signers.length) out.push(`Signed by: ${signers.join(", ")}`);
  }
  if (doc.lastReviewed) out.push("", `Last reviewed: ${doc.lastReviewed}`);
  return out.join("\n") + "\n";
}
