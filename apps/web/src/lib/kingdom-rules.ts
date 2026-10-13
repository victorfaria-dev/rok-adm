// Web glue for the rules page (F-33): rules documents in ko:kingdom:v1 (kind "rules") and the
// view-only share link. The document model and its parser live in @rokadm/planner (kingdom-rules).
import { compactRulesShare, encodeShare, newDocId, parseRulesDoc, rulesDisplayTitle, type RulesDoc } from "@rokadm/planner";
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

/** Absolute view-only link for a rules document. */
export async function rulesShareLink(doc: RulesDoc, origin?: string): Promise<string> {
  // Compact form: template sections by reference, only edited lines inline (fits a Discord message).
  return shareUrl(RULES_VIEW_PATH, await encodeShare(RULES_KIND, compactRulesShare(doc)), origin);
}

/** "?doc=<id>" → id, or null. */
export function docFromSearch(search: string): string | null {
  const id = new URLSearchParams(search).get("doc");
  return id && id.length <= 64 ? id : null;
}

/** "13 Oct 2026" for a YYYY-MM-DD day (UTC, so the day never shifts). */
export function formatDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  if (!Number.isFinite(d.getTime())) return day;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
