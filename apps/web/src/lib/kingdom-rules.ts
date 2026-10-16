// Web glue for the rules page (F-33): rules documents in ko:kingdom:v1 (kind "rules") and the
// view-only share link. The document model and its parser live in @rokadm/planner (kingdom-rules).
import { ORIGINAL_KEY, compactRulesShare, encodeShare, newDocId, parseRulesDoc, rulesDisplayTitle, rulesWithOnly, type RulesDoc } from "@rokadm/planner";
import { listDocs, saveDoc, type StorageLike } from "./kingdom-store";
import { shareUrl } from "./kingdom-share";

export const RULES_KIND = "rules";
export const RULES_BUILDER_PATH = "/kingdom/rules/";
export const RULES_VIEW_PATH = "/kingdom/rules/view/";

export interface RulesListItem {
  id: string;
  title: string;
  updatedAt: string;
  doc: RulesDoc;
}

/** Saved rules documents, most recently edited first. The envelope id wins over the inner one. */
export function listRules(st: StorageLike | null): RulesListItem[] {
  const out: RulesListItem[] = [];
  for (const d of listDocs(RULES_KIND, st)) {
    const doc = parseRulesDoc(d.data);
    if (!doc) continue;
    doc.id = d.id;
    out.push({ id: d.id, title: d.title || rulesDisplayTitle(doc), updatedAt: d.updatedAt, doc });
  }
  return out;
}

/** Save (insert or replace) a rules document. Throws with a message the user can act on. */
export function saveRules(doc: RulesDoc, st: StorageLike | null, now: Date = new Date()): RulesDoc {
  const data: RulesDoc = { ...doc, updatedAt: now.toISOString() };
  saveDoc({ id: doc.id, kind: RULES_KIND, title: rulesDisplayTitle(doc), data }, st, now);
  return data;
}

/** Save a copy of a (shared) document under a new id; returns the new id. */
export function saveRulesCopy(doc: RulesDoc, st: StorageLike | null, now: Date = new Date(), id: string = newDocId()): string {
  saveRules({ ...doc, id }, st, now);
  return id;
}

/**
 * Absolute view-only link for a rules document. `only` keeps the original plus one translation
 * (null = original only) for when every language together is too long for a link.
 * Throws ShareTooLargeError (from encodeShare) when the link would be refused by the view page.
 */
export async function rulesShareLink(doc: RulesDoc, origin?: string, only?: string | null): Promise<string> {
  const data = only === undefined ? doc : rulesWithOnly(doc, only);
  // Compact form: template sections by reference, only edited lines inline (fits a Discord message).
  return shareUrl(RULES_VIEW_PATH, await encodeShare(RULES_KIND, compactRulesShare(data)), origin);
}

/** The version a "lang=" hash param asks for: a translation by code or id, the original by its code or "original". */
export function versionFromHash(doc: RulesDoc, hash: string): string | null {
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  const part = h.split("&").find((p) => p.startsWith("lang="));
  if (!part) return null;
  let v: string;
  try {
    v = decodeURIComponent(part.slice(5));
  } catch {
    return null;
  }
  if (!v) return null;
  if (v === ORIGINAL_KEY || (doc.originalLang && v.toLowerCase() === doc.originalLang.toLowerCase())) return ORIGINAL_KEY;
  const t = doc.translations.find((x) => x.id === v || (x.lang && x.lang.toLowerCase() === v.toLowerCase()));
  return t ? t.id : null;
}

/** The hash with "lang=" set to a version (its code when it has one), keeping the document part. */
export function hashWithVersion(doc: RulesDoc, hash: string, key: string): string {
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  const parts = h.split("&").filter((p) => p && !p.startsWith("lang="));
  const t = doc.translations.find((x) => x.id === key);
  // Use the language code only when it names exactly one version; otherwise the id (codes can repeat).
  const codes = [doc.originalLang, ...doc.translations.map((x) => x.lang)].filter(Boolean).map((c) => c.toLowerCase());
  const unique = (c: string): boolean => !!c && codes.filter((x) => x === c.toLowerCase()).length === 1;
  const value = key === ORIGINAL_KEY ? (unique(doc.originalLang) ? doc.originalLang : ORIGINAL_KEY) : t ? (unique(t.lang) ? t.lang : t.id) : null;
  if (value && doc.translations.length > 0) parts.push(`lang=${encodeURIComponent(value)}`);
  return `#${parts.join("&")}`;
}

/** "?doc=<id>" → id, or null. */
export function docFromSearch(search: string): string | null {
  const id = new URLSearchParams(search).get("doc");
  return id && id.length <= 64 ? id : null;
}

/** "13 de out. de 2026" para um dia AAAA-MM-DD (UTC, so the day never shifts). */
export function formatDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  if (!Number.isFinite(d.getTime())) return day;
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
