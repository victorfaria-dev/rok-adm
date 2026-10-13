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
  /** Extra language versions written by the council (the original does not count). */
  translations: 5,
  langLabel: 40,
  langCode: 35,
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

/**
 * A language version of the rules written by the council (never machine translated). Sections are
 * aligned to the original by id; a section missing here is shown in the original language.
 */
export interface RulesTranslation {
  /** Stable id inside the document ("t1", or a random id from the builder). */
  id: string;
  /** Name of the language as its readers write it, e.g. "Español". */
  label: string;
  /** Optional BCP-47 code for the lang attribute ("es", "pt-BR"), or "" when unknown. */
  lang: string;
  title: string;
  intro: string;
  sections: RulesSection[];
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
  /** Name of the original's language, e.g. "English" ("" = not stated). */
  originalLabel: string;
  /** BCP-47 code of the original ("" = not stated). */
  originalLang: string;
  /** 0–5 council-written translations. The original (this document) always prevails. */
  translations: RulesTranslation[];
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
    originalLabel: "",
    originalLang: "",
    translations: [],
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

// ---------------------------------------------------------------------------
// Language versions (F-84 on demand): written by the council, never machine translated.

let displayNames: Intl.DisplayNames | null | undefined;
/** true when the browser/Node knows a display name for this primary language subtag. */
function knownLanguage(primary: string): boolean {
  try {
    displayNames ??= new Intl.DisplayNames(["en"], { type: "language", fallback: "none" });
    return displayNames.of(primary.toLowerCase()) !== undefined;
  } catch {
    displayNames = null;
    return true; // No Intl.DisplayNames: keep the shape check only.
  }
}

/** Canonical BCP-47 form ("spa" → "es", "pt-br" → "pt-BR"), or null when it cannot be canonicalised. */
function canonical(code: string): string | null {
  try {
    return Intl.getCanonicalLocales(code)[0] ?? null;
  } catch {
    return null;
  }
}

/** Simple BCP-47 shape check for a lang attribute: "es", "pt-BR", "zh-Hant", "sr-Latn-RS". */
const LANG_CODE = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i;

/**
 * true for a code that can go in a lang attribute (empty is not a code): well formed, a known
 * language, and already in its shortest form (axe rejects "spa" or "eng"; use "es", "en").
 */
export function isLangCode(x: unknown): x is string {
  if (typeof x !== "string" || x.length > RULES_LIMITS.langCode || !LANG_CODE.test(x)) return false;
  const c = canonical(x);
  if (c && c.split("-")[0] !== x.split("-")[0]!.toLowerCase()) return false;
  return knownLanguage(x.split("-")[0]!);
}

/** Valid code in canonical form ("spa" → "es"), else "". */
export function cleanLangCode(x: unknown): string {
  const s = typeof x === "string" ? x.trim() : "";
  if (!s) return "";
  if (isLangCode(s)) return canonical(s) ?? s;
  const c = canonical(s);
  return c && isLangCode(c) ? c : "";
}

function parseTranslation(x: unknown, i: number, seen: Set<string>, known: ReadonlySet<string>): RulesTranslation | null {
  if (!isRecord(x)) return null;
  let id = typeof x.id === "string" ? cleanLine(x.id, 64) : "";
  if (!id || seen.has(id)) {
    let n = i + 1;
    while (seen.has(`t${n}`)) n++;
    id = `t${n}`;
  }
  seen.add(id);
  const sections: RulesSection[] = [];
  const sSeen = new Set<string>();
  if (Array.isArray(x.sections)) {
    for (const s of x.sections) {
      if (!isRecord(s) || typeof s.id !== "string") continue;
      const sid = cleanLine(s.id, 64);
      // Only sections that still exist in the original, once each.
      if (!known.has(sid) || sSeen.has(sid)) continue;
      sSeen.add(sid);
      sections.push({ id: sid, heading: cleanLine(s.heading, RULES_LIMITS.heading), body: cleanText(s.body, RULES_LIMITS.body) });
    }
  }
  return {
    id,
    label: cleanLine(x.label, RULES_LIMITS.langLabel),
    lang: cleanLangCode(x.lang),
    title: cleanLine(x.title, RULES_LIMITS.title),
    intro: cleanText(x.intro, RULES_LIMITS.intro),
    sections,
  };
}

/** A new, empty language version. */
export function emptyTranslation(id: string, label = "", lang = ""): RulesTranslation {
  return { id, label: cleanLine(label, RULES_LIMITS.langLabel), lang: cleanLangCode(lang), title: "", intro: "", sections: [] };
}

/** Name to show for a translation: the council's label, else the code, else "Language N". */
export function translationName(t: Pick<RulesTranslation, "label" | "lang">, index: number): string {
  return t.label || t.lang || `Language ${index + 2}`;
}

/** Name to show for the original: its label, else its code, else "Original". */
export function originalName(doc: Pick<RulesDoc, "originalLabel" | "originalLang">): string {
  return doc.originalLabel || doc.originalLang || "Original";
}

/** Set the translation of one section (cleared when both texts are empty). */
export function setTranslatedSection(t: RulesTranslation, sectionId: string, patch: Partial<Pick<RulesSection, "heading" | "body">>): RulesTranslation {
  const cur = t.sections.find((s) => s.id === sectionId) ?? { id: sectionId, heading: "", body: "" };
  const next = { ...cur, ...patch };
  const rest = t.sections.filter((s) => s.id !== sectionId);
  return { ...t, sections: next.heading || next.body ? [...rest, next] : rest };
}

/** Drop translated sections whose original section no longer exists. */
export function pruneTranslations(doc: RulesDoc): RulesDoc {
  const known = new Set(doc.sections.map((s) => s.id));
  return {
    ...doc,
    translations: doc.translations.map((t) => ({ ...t, intro: doc.intro ? t.intro : "", sections: t.sections.filter((s) => known.has(s.id)) })),
  };
}

/** The document with the original and at most one translation (null = original only), for a shorter link. */
export function rulesWithOnly(doc: RulesDoc, translationId: string | null): RulesDoc {
  return { ...doc, translations: doc.translations.filter((t) => t.id === translationId) };
}

export interface ResolvedSection {
  id: string;
  heading: string;
  body: string;
  /** true when this section is shown in the original because it is not translated yet. */
  fallback: boolean;
}

/** One language version as a reader sees it. */
export interface ResolvedRules {
  /** ORIGINAL_KEY or the translation id. */
  key: string;
  name: string;
  /** Lang attribute for this version's own text ("" = not stated). */
  lang: string;
  isOriginal: boolean;
  title: string;
  titleFallback: boolean;
  intro: string;
  introFallback: boolean;
  sections: ResolvedSection[];
  /** How many parts (intro and sections) are still shown in the original. */
  untranslated: number;
}

export const ORIGINAL_KEY = "original";
export const TRANSLATION_NOTE = "Translation by the council. If it differs, the original prevails.";
export const UNTRANSLATED_NOTE = "Not translated yet. Shown in the original language.";

/**
 * A document as one language version reads it. A section counts as translated only when every field
 * the original fills is filled too; otherwise the whole section is shown in the original with a
 * note, so nobody reads a translated heading over an original-language body without being told.
 */
export function resolveRules(doc: RulesDoc, key: string = ORIGINAL_KEY): ResolvedRules {
  const t = key === ORIGINAL_KEY ? undefined : doc.translations.find((x) => x.id === key);
  const origTitle = rulesDisplayTitle(doc);
  if (!t) {
    return {
      key: ORIGINAL_KEY, name: originalName(doc), lang: cleanLangCode(doc.originalLang), isOriginal: true,
      title: origTitle, titleFallback: false, intro: doc.intro, introFallback: false,
      sections: doc.sections.map((s) => ({ ...s, fallback: false })), untranslated: 0,
    };
  }
  const byId = new Map(t.sections.map((s) => [s.id, s]));
  let untranslated = 0;
  const sections = doc.sections.map((s): ResolvedSection => {
    const tr = byId.get(s.id);
    const ok = !!tr && (!s.heading || !!tr.heading) && (!s.body || !!tr.body) && (!!tr.heading || !!tr.body);
    if (!ok) untranslated++;
    return ok ? { id: s.id, heading: tr!.heading, body: tr!.body, fallback: false } : { ...s, fallback: true };
  });
  // No original intro means no intro in any version (a stale translated intro is ignored).
  const introFallback = !!doc.intro && !t.intro;
  if (introFallback) untranslated++;
  return {
    key: t.id, name: translationName(t, doc.translations.indexOf(t)), lang: cleanLangCode(t.lang), isOriginal: false,
    title: t.title || origTitle, titleFallback: !t.title,
    intro: doc.intro ? (introFallback ? doc.intro : t.intro) : "", introFallback,
    sections, untranslated,
  };
}

/** Every version, original first. */
export function rulesVersions(doc: RulesDoc): ResolvedRules[] {
  return [resolveRules(doc), ...doc.translations.map((t) => resolveRules(doc, t.id))];
}

/** Names of the versions whose own text still has [bracket] prompts. */
export function versionsWithPrompts(doc: RulesDoc): string[] {
  const out: string[] = [];
  if ([doc.intro, ...doc.sections.map((s) => s.body)].some(hasPrompts)) out.push(originalName(doc));
  doc.translations.forEach((t, i) => {
    if ([t.title, doc.intro ? t.intro : "", ...t.sections.flatMap((s) => [s.heading, s.body])].some(hasPrompts)) out.push(translationName(t, i));
  });
  return out;
}

/**
 * The version that best matches the reader's languages (navigator.languages or a ?lang= choice):
 * exact code first, then the same primary language ("pt-BR" ↔ "pt"); the original when none match.
 */
export function pickVersion(doc: RulesDoc, preferred: readonly string[]): string {
  const versions = [{ key: ORIGINAL_KEY, lang: doc.originalLang }, ...doc.translations.map((t) => ({ key: t.id, lang: t.lang }))]
    .filter((v) => v.lang)
    .map((v) => ({ key: v.key, lang: v.lang.toLowerCase() }));
  for (const p of preferred) {
    const want = p.trim().toLowerCase();
    if (!want) continue;
    const exact = versions.find((v) => v.lang === want);
    if (exact) return exact.key;
    const base = want.split("-")[0];
    const near = versions.find((v) => v.lang.split("-")[0] === base);
    if (near) return near.key;
  }
  return ORIGINAL_KEY;
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
  const known = new Set(sections.map((s) => s.id));
  const translations: RulesTranslation[] = [];
  const tSeen = new Set<string>();
  if (Array.isArray(x.translations)) {
    for (const [i, t] of x.translations.entries()) {
      if (translations.length >= RULES_LIMITS.translations) break;
      const tr = parseTranslation(t, i, tSeen, known);
      if (tr) translations.push(tr);
    }
  }
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
    originalLabel: cleanLine(x.originalLabel, RULES_LIMITS.langLabel),
    originalLang: cleanLangCode(x.originalLang),
    translations,
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

/**
 * Plain text of one version (the original by default). With `all`, the original comes first and
 * each translation follows under a "Language:" line, so one file carries every version.
 */
export function rulesToPlainText(doc: RulesDoc, opts: { version?: string; all?: boolean } = {}): string {
  const keys = opts.all ? [ORIGINAL_KEY, ...doc.translations.map((t) => t.id)] : [opts.version ?? ORIGINAL_KEY];
  return keys.map((k) => versionText(doc, resolveRules(doc, k), keys.length > 1)).join("\n----------------------------------------\n\n");
}

function versionText(doc: RulesDoc, v: ResolvedRules, labelled: boolean): string {
  const out: string[] = [];
  if (labelled || !v.isOriginal) out.push(`Language: ${v.name}${v.isOriginal ? " (original)" : ""}`, "");
  out.push(v.title);
  if (doc.kingdom && doc.title) out.push(doc.kingdom);
  if (!v.isOriginal) out.push(TRANSLATION_NOTE);
  if (doc.languageNote) out.push(doc.languageNote);
  if (v.intro) {
    out.push("");
    if (v.introFallback) out.push(`(${UNTRANSLATED_NOTE})`);
    out.push(v.intro);
  }
  for (const s of v.sections) {
    out.push("", s.heading || "Untitled section");
    if (s.fallback) out.push(`(${UNTRANSLATED_NOTE})`);
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
