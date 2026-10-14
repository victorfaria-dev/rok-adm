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

export const DEFAULT_LANGUAGE_NOTE = "Escrito em português; as traduções são informais, o original prevalece.";

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
  return t.label || t.lang || `Idioma ${index + 2}`;
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
export const TRANSLATION_NOTE = "Tradução feita pelo conselho. Se houver diferença, o original prevalece.";
export const UNTRANSLATED_NOTE = "Ainda não traduzido. Mostrado no idioma original.";

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
export function parseRulesDoc(input: unknown): RulesDoc | null {
  if (!isRecord(input)) return null;
  // Share links made since Q2 carry the compact form (template references + diffs); older links the full doc.
  const x = Object.hasOwn(input, "c") ? expandRulesShare(input) : input;
  if (!x) return null;
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
  if (doc.kingdom) return `Regras do reino ${doc.kingdom}`;
  return "Regras do reino";
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
    heading: "Liderança e conselho",
    body: [
      "O reino é conduzido por [um conselho das principais alianças / o rei e um conselho].",
      "",
      "- Rei: [nome ou 'escolhido por ...']",
      "- Membros do conselho: [tags das alianças e seus assentos]",
      "- Como alguém entra ou sai do conselho: [regra]",
      "- Como o rei é escolhido e por quanto tempo: [regra]",
    ].join("\n"),
  },
  {
    key: "decisions",
    heading: "Como as decisões são tomadas",
    body: [
      "As decisões são tomadas por [voto da maioria dos assentos do conselho / consenso / o rei, depois de ouvir o conselho].",
      "",
      "- Quem pode propor uma mudança: [regra]",
      "- Por quanto tempo uma votação fica aberta: [dias]",
      "- Onde as decisões ficam registradas para os membros lerem: [canal ou documento]",
      "- Quando estas regras são revisadas: [por exemplo, antes de cada KvK]",
    ].join("\n"),
  },
  {
    key: "kvk",
    heading: "Requisitos da KvK e DKP",
    body: [
      "Toda conta acima de [poder] deve cumprir o requisito da KvK.",
      "",
      "- Fórmula do DKP: [pontos de abate T4 × ..., T5 × ..., mortes × ...]",
      "- Requisito: [meta de DKP por faixa de poder]",
      "- Onde conferir a sua meta: [link para o cartão de requisitos do conselho, feito em /kingdom/requirements/]",
      "- O que acontece quando o requisito não é cumprido: [regra]",
    ].join("\n"),
  },
  {
    key: "mge",
    heading: "Política de MGE",
    body: [
      "O MGE neste reino é [fixo / em rodízio / livre para todos].",
      "",
      "- Quem pode ficar com as primeiras posições: [regra, por exemplo por DKP ou ordem do rodízio]",
      "- Como a lista é publicada: [canal ou link]",
      "- Teto de pontos para todos os outros: [número ou 'nenhum']",
      "- O que acontece quando alguém passa uma posição fixa: [regra]",
    ].join("\n"),
  },
  {
    key: "migration",
    heading: "Migração e novos membros",
    body: [
      "A migração para o reino é [aberta / por candidatura / fechada].",
      "",
      "- Mínimos para migrantes: [poder, pontos de abate, nível da Prefeitura, outros]",
      "- Como se candidatar: [com quem falar e onde]",
      "- Colocação em aliança depois da chegada: [regra]",
      "- Primeiros dias: [o que os novos membros devem ler ou fazer]",
    ].join("\n"),
  },
  {
    key: "farms",
    heading: "Farms e contas alternativas",
    body: [
      "Farms e contas alternativas são [permitidas / permitidas com registro / proibidas].",
      "",
      "- Onde ficam as farms: [aliança ou zona]",
      "- Registro: [como registrar uma farm no conselho]",
      "- Farms na KvK e no MGE: [regra]",
    ].join("\n"),
  },
  {
    key: "warnings",
    heading: "Advertências, aviso de saída e recursos",
    body: [
      "Quebrar estas regras leva a [uma advertência, depois ...].",
      "",
      "1. Primeira vez: [ação]",
      "2. Segunda vez: [ação]",
      "3. Depois disso: [ação]",
      "",
      "- Como recorrer: [com quem falar, em quantos dias]",
      "- Sair do reino: [prazo de aviso e como avisar o conselho]",
    ].join("\n"),
  },
  {
    key: "activity",
    heading: "Expectativas de atividade",
    body: [
      "Espera-se que os membros [participem de ...].",
      "",
      "- Eventos de que todos participam: [lista]",
      "- Contas inativas: [depois de quantos dias, e o que acontece]",
      "- Avisar o conselho de que você vai se ausentar: [como]",
    ].join("\n"),
  },
  {
    key: "communication",
    heading: "Comunicação e idiomas",
    body: [
      "Os comunicados oficiais são publicados em [chat do reino / canal do Discord / outro].",
      "",
      "- Idiomas usados: [lista]",
      "- Tradutores ou contatos por idioma: [nomes ou funções]",
      "- Respeito entre os grupos de idiomas: [regra]",
      "- Links: compartilhe-os no Discord ou em outros canais fora do jogo, não no chat do jogo.",
    ].join("\n"),
  },
  {
    key: "conflicts",
    heading: "Conflitos com outros reinos e alianças",
    body: [
      "Os acordos com outros reinos (NAPs, fronteiras, zonas) são feitos por [quem].",
      "",
      "- Os acordos atuais estão listados em: [canal ou documento]",
      "- Atacar um alvo protegido: [regra]",
      "- Disputas entre as nossas próprias alianças: [quem decide, como]",
    ].join("\n"),
  },
];

/** Templates pre-selected for a new kingdom charter (F-33 charter story). */
export const CHARTER_STARTER_KEYS: readonly string[] = ["leadership", "decisions", "kvk", "mge", "migration", "warnings", "communication"];

export function sectionFromTemplate(key: string, id: string): RulesSection | null {
  const t = RULES_TEMPLATES.find((x) => x.key === key);
  return t ? { id, heading: t.heading, body: t.body } : null;
}

export const CHARTER_INTRO = "Esta carta é acordada pelo conselho de [reino]. Ela explica como o reino é conduzido e o que todo membro pode esperar.";

/** A new charter: starter sections plus an intro prompt; the council fills in the [brackets]. */
export function newCharterDoc(id: string, now: Date = new Date(), sectionId: (i: number) => string = (i) => `s${i + 1}`): RulesDoc {
  const doc = emptyRulesDoc(id, now);
  doc.title = "Carta do reino";
  doc.intro = CHARTER_INTRO;
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
  if (labelled || !v.isOriginal) out.push(`Idioma: ${v.name}${v.isOriginal ? " (original)" : ""}`, "");
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
    out.push("", s.heading || "Seção sem título");
    if (s.fallback) out.push(`(${UNTRANSLATED_NOTE})`);
    if (s.body) out.push(s.body);
  }
  const { agreedOn, signers } = doc.charter;
  if (agreedOn || signers.length) {
    out.push("", "Carta");
    if (agreedOn) out.push(`Acordada em ${agreedOn}`);
    if (signers.length) out.push(`Assinada por: ${signers.join(", ")}`);
  }
  if (doc.lastReviewed) out.push("", `Última revisão: ${doc.lastReviewed}`);
  return out.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Compact share form (Q2 P2-1). A charter built from templates was ~2,700 characters as a link, over
// Discord's 2,000 per message before any edit. Links now name template sections as "key@version"
// and carry only the lines that differ. Template text is versioned: never edit a published version,
// add the old text to RULES_TEMPLATE_HISTORY and bump RULES_TEMPLATE_VERSION, so old links still
// expand to what their author saw. Links without "c" (older ones) are read as full documents.

/** Version of the current RULES_TEMPLATES text, as referenced by share links. */
export const RULES_TEMPLATE_VERSION = 1;
/** Template text of earlier versions, "key@version" → section (empty while only version 1 exists). */
export const RULES_TEMPLATE_HISTORY: Readonly<Record<string, { heading: string; body: string }>> = {};
/** Compact form version (the "c" field). */
export const RULES_COMPACT_VERSION = 1;

function templateByRef(ref: string): { heading: string; body: string } | null {
  if (Object.hasOwn(RULES_TEMPLATE_HISTORY, ref)) return RULES_TEMPLATE_HISTORY[ref]!;
  const m = /^([a-z0-9-]{1,40})@(\d{1,4})$/.exec(ref);
  if (!m || Number(m[2]) !== RULES_TEMPLATE_VERSION) return null;
  const t = RULES_TEMPLATES.find((x) => x.key === m[1]);
  return t ? { heading: t.heading, body: t.body } : null;
}

/** Body as edits of a template body: a number keeps template line n, a string is a new line. */
type LineOps = Array<number | string>;

function diffLines(base: string, body: string): LineOps {
  const from = base.split("\n");
  const index = new Map<string, number>();
  from.forEach((l, i) => { if (!index.has(l)) index.set(l, i); });
  return body.split("\n").map((l) => index.get(l) ?? l);
}

function applyLines(base: string, ops: unknown): string | null {
  if (!Array.isArray(ops) || ops.length > 400) return null;
  const from = base.split("\n");
  const out: string[] = [];
  for (const op of ops) {
    if (typeof op === "string") out.push(op);
    else if (typeof op === "number" && Number.isInteger(op) && op >= 0 && op < from.length) out.push(from[op]!);
    else return null;
  }
  return out.join("\n");
}

/** The share payload for a rules document: template sections by reference, only changed lines inline. */
export function compactRulesShare(doc: RulesDoc): Record<string, unknown> {
  const sections = doc.sections.map((s) => {
    let best: { ref: string; t: RulesTemplate; kept: number } | null = null;
    for (const t of RULES_TEMPLATES) {
      const ops = diffLines(t.body, s.body);
      const kept = ops.filter((o) => typeof o === "number").length;
      if (kept > 0 && (!best || kept > best.kept)) best = { ref: `${t.key}@${RULES_TEMPLATE_VERSION}`, t, kept };
    }
    if (!best) return { i: s.id, h: s.heading, b: s.body };
    const out: Record<string, unknown> = { i: s.id, f: best.ref };
    if (s.heading !== best.t.heading) out.h = s.heading;
    if (s.body !== best.t.body) out.b = diffLines(best.t.body, s.body);
    return out;
  });
  const out: Record<string, unknown> = { c: RULES_COMPACT_VERSION, id: doc.id, u: doc.updatedAt, s: sections };
  if (doc.kingdom) out.k = doc.kingdom;
  if (doc.title) out.t = doc.title;
  if (doc.languageNote !== DEFAULT_LANGUAGE_NOTE) out.l = doc.languageNote;
  if (doc.intro) out.n = doc.intro === CHARTER_INTRO ? 0 : doc.intro;
  if (doc.charter.agreedOn) out.a = doc.charter.agreedOn;
  if (doc.charter.signers.length) out.g = doc.charter.signers;
  if (doc.lastReviewed) out.r = doc.lastReviewed;
  // Language versions: council-written text, never template text, so they travel as written.
  if (doc.originalLabel) out.ol = doc.originalLabel;
  if (doc.originalLang) out.og = doc.originalLang;
  if (doc.translations.length) out.x = doc.translations;
  return out;
}

/** Expand a compact share payload to the full document shape (still untrusted: parseRulesDoc cleans it). */
export function expandRulesShare(x: Record<string, unknown>): Record<string, unknown> | null {
  if (x.c !== RULES_COMPACT_VERSION || !Array.isArray(x.s) || x.s.length > RULES_LIMITS.sections) return null;
  const sections: Array<{ id: unknown; heading: unknown; body: unknown }> = [];
  for (const s of x.s) {
    if (!isRecord(s)) return null;
    if (s.f === undefined) {
      sections.push({ id: s.i, heading: s.h, body: s.b });
      continue;
    }
    const t = typeof s.f === "string" ? templateByRef(s.f) : null;
    if (!t) return null;
    const body = s.b === undefined ? t.body : applyLines(t.body, s.b);
    if (body === null) return null;
    sections.push({ id: s.i, heading: s.h === undefined ? t.heading : s.h, body });
  }
  return {
    id: x.id,
    updatedAt: x.u,
    kingdom: x.k,
    title: x.t,
    languageNote: x.l === undefined ? DEFAULT_LANGUAGE_NOTE : x.l,
    intro: x.n === 0 ? CHARTER_INTRO : x.n,
    sections,
    charter: { agreedOn: x.a, signers: x.g },
    lastReviewed: x.r,
    originalLabel: x.ol,
    originalLang: x.og,
    translations: x.x,
  };
}
