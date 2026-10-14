// Validator for packages/data/i18n/glossary.json (game-term glossary for localization).
// Run: pnpm --filter @rokadm/data check:glossary (part of the root `pnpm validate` / `pnpm check`).
//
// Rules: all 13 site languages on every term, a status on every cell, no empty strings,
// a source for every verified-official/community cell, ISO dates, unique ids, and links to the EN glossary that resolve.
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const GLOSSARY_LANGUAGES = ["en", "pt-BR", "es", "fr", "de", "it", "ru", "tr", "id", "vi", "ko", "zh-Hant", "ar"] as const;
export type GlossaryLanguage = (typeof GLOSSARY_LANGUAGES)[number];
export const GLOSSARY_STATUSES = ["verified-official", "community", "unverified"] as const;
export type GlossaryStatus = (typeof GLOSSARY_STATUSES)[number];
export const GLOSSARY_KINDS = ["game", "jargon", "proper"] as const;
export const RTL_LANGUAGES: readonly GlossaryLanguage[] = ["ar"];

export interface GlossaryCell {
  text: string;
  status: GlossaryStatus;
  /** https URL, or an in-client screenshot note ("owner screenshot YYYY-MM-DD", "reviewer <id> screenshot YYYY-MM-DD"). Null only when status is "unverified". */
  source: string | null;
  date: string;
  note: string;
}
export interface GlossaryTerm {
  id: string;
  category: string;
  kind: (typeof GLOSSARY_KINDS)[number];
  en: string;
  aliases: string[];
  /** Id in packages/planner/tools-data/glossary.json (EN definition), when one exists. */
  enGlossaryId: string | null;
  translations: Record<GlossaryLanguage, GlossaryCell>;
}
export interface GlossaryDoc {
  schemaVersion: number;
  asOf: string;
  languages: { code: string; name: string; script: string; dir: "ltr" | "rtl"; note?: string }[];
  statuses: string[];
  terms: GlossaryTerm[];
}

export const MIN_TERMS = 150;
export const MAX_TERMS = 300;
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** In-client screenshots count as official text: the owner's, or a named native reviewer's ("reviewer ko-1 screenshot 2026-11-02"). */
const SCREENSHOT_RE = /^(owner|reviewer [a-z0-9-]+) screenshot \d{4}-\d{2}-\d{2}$/;

function validDate(s: unknown): boolean {
  if (typeof s !== "string" || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function nonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

/** Returns a list of problems; empty means the glossary is valid. */
export function validateGlossary(doc: GlossaryDoc, enGlossaryIds?: ReadonlySet<string>): string[] {
  const errors: string[] = [];
  const codes = (doc.languages ?? []).map((l) => l.code);
  for (const lang of GLOSSARY_LANGUAGES) if (!codes.includes(lang)) errors.push(`languages: missing ${lang}`);
  for (const code of codes) if (!(GLOSSARY_LANGUAGES as readonly string[]).includes(code)) errors.push(`languages: unknown ${code}`);
  for (const l of doc.languages ?? []) {
    const want = RTL_LANGUAGES.includes(l.code as GlossaryLanguage) ? "rtl" : "ltr";
    if (l.dir !== want) errors.push(`languages: ${l.code} dir must be ${want}`);
  }
  if (JSON.stringify(doc.statuses) !== JSON.stringify(GLOSSARY_STATUSES)) errors.push(`statuses must be ${GLOSSARY_STATUSES.join(", ")}`);
  if (!validDate(doc.asOf)) errors.push("asOf: not an ISO date");

  const terms = doc.terms ?? [];
  if (terms.length < MIN_TERMS || terms.length > MAX_TERMS) errors.push(`terms: ${terms.length}, expected ${MIN_TERMS}–${MAX_TERMS}`);
  const seen = new Set<string>();
  for (const [i, t] of terms.entries()) {
    const where = `terms[${i}] ${t?.id ?? "?"}`;
    if (!nonEmpty(t.id) || !ID_RE.test(t.id)) errors.push(`${where}: bad id`);
    else if (seen.has(t.id)) errors.push(`${where}: duplicate id`);
    else seen.add(t.id);
    if (!nonEmpty(t.en)) errors.push(`${where}: empty en`);
    if (!nonEmpty(t.category)) errors.push(`${where}: empty category`);
    if (!(GLOSSARY_KINDS as readonly string[]).includes(t.kind)) errors.push(`${where}: bad kind ${t.kind}`);
    if (!Array.isArray(t.aliases) || t.aliases.some((a) => !nonEmpty(a))) errors.push(`${where}: aliases must be non-empty strings`);
    if (t.enGlossaryId !== null && t.enGlossaryId !== undefined) {
      if (!nonEmpty(t.enGlossaryId)) errors.push(`${where}: empty enGlossaryId`);
      else if (enGlossaryIds && !enGlossaryIds.has(t.enGlossaryId)) errors.push(`${where}: enGlossaryId ${t.enGlossaryId} not in the EN glossary`);
    }
    const tr = (t.translations ?? {}) as Record<string, GlossaryCell>;
    for (const lang of GLOSSARY_LANGUAGES) {
      const c = tr[lang];
      const at = `${where} [${lang}]`;
      if (!c) {
        errors.push(`${at}: missing language`);
        continue;
      }
      if (!nonEmpty(c.text)) errors.push(`${at}: empty string`);
      else if (c.text !== c.text.trim()) errors.push(`${at}: leading/trailing spaces`);
      if (!c.status) errors.push(`${at}: missing status`);
      else if (!(GLOSSARY_STATUSES as readonly string[]).includes(c.status)) errors.push(`${at}: bad status ${c.status}`);
      if (!validDate(c.date)) errors.push(`${at}: bad date ${c.date}`);
      if (c.status === "verified-official" || c.status === "community") {
        if (!nonEmpty(c.source)) errors.push(`${at}: ${c.status} needs a source`);
        else if (!/^https:\/\//.test(c.source) && !(c.status === "verified-official" && SCREENSHOT_RE.test(c.source))) {
          errors.push(`${at}: source must be an https URL${c.status === "verified-official" ? " or an in-client screenshot note" : ""}`);
        }
      }
      if (c.status === "unverified" && !nonEmpty(c.note)) errors.push(`${at}: unverified needs a note`);
    }
    for (const lang of Object.keys(tr)) if (!(GLOSSARY_LANGUAGES as readonly string[]).includes(lang)) errors.push(`${where}: unknown language ${lang}`);
  }
  return errors;
}

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const GLOSSARY_PATH = resolve(PKG, "i18n/glossary.json");
export const EN_GLOSSARY_PATH = resolve(PKG, "../planner/tools-data/glossary.json");

export function loadEnGlossaryIds(): Set<string> | undefined {
  if (!existsSync(EN_GLOSSARY_PATH)) return undefined;
  const en = JSON.parse(readFileSync(EN_GLOSSARY_PATH, "utf8")) as { terms: { id: string }[] };
  return new Set(en.terms.map((t) => t.id));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const doc = JSON.parse(readFileSync(GLOSSARY_PATH, "utf8")) as GlossaryDoc;
  const errors = validateGlossary(doc, loadEnGlossaryIds());
  if (errors.length) {
    console.error(`glossary.json: ${errors.length} problem(s)`);
    for (const e of errors.slice(0, 50)) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`glossary.json OK: ${doc.terms.length} terms × ${GLOSSARY_LANGUAGES.length} languages`);
}
