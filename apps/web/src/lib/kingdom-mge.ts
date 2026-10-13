// Web glue for the MGE planner (F-35): saved plans in ko:kingdom:v1 (kind "mge"), pasted
// candidate lists and the public ledger link. Logic lives in @rokadm/planner (kingdom-mge.ts).
import {
  MGE_LIMITS, decodeShare, encodeShare, mgePublicPayload, newDocId, parseCandidateLines, parseMgeDoc, parseMgePublic, shareFromHash,
  type DecodeResult, type LineError, type MgeDoc, type MgePlan, type MgePublic,
} from "@rokadm/planner";
import { getDoc, listDocs, removeDoc, saveDoc, type StorageLike, type StoredDoc } from "./kingdom-store";
import { linkLengthHint, shareUrl } from "./kingdom-share";

export const MGE_KIND = "mge";
export const MGE_VIEW_PATH = "/kingdom/mge/view/";

export function listMgePlans(st: StorageLike | null): StoredDoc[] {
  return listDocs(MGE_KIND, st);
}

export function loadMgePlan(id: string, st: StorageLike | null): MgeDoc | null {
  const d = getDoc(id, st);
  if (!d || d.kind !== MGE_KIND) return null;
  return { ...parseMgeDoc(d.data, d.id), id: d.id, updatedAt: d.updatedAt };
}

/** Save (insert or replace). Throws with a user-facing message on limits. */
export function saveMgePlan(doc: MgeDoc, st: StorageLike | null, now: Date = new Date()): MgeDoc {
  const updatedAt = now.toISOString();
  const data = { ...doc, updatedAt };
  saveDoc({ id: doc.id, kind: MGE_KIND, title: doc.title, data }, st, now);
  return data;
}

export function deleteMgePlan(id: string, st: StorageLike | null): void {
  removeDoc(id, st);
}

export interface AddCandidatesResult {
  doc: MgeDoc;
  added: number;
  /** Lines whose name was already in the list (kept as they were). */
  duplicates: string[];
  /** Lines dropped because the list is full. */
  overLimit: number;
  errors: LineError[];
}

/** Add candidates from pasted "Name, score" lines. Names already listed (any case) are skipped. */
export function addCandidatesFromText(doc: MgeDoc, text: string, makeId: () => string = newDocId): AddCandidatesResult {
  const { rows, errors } = parseCandidateLines(text);
  const seen = new Set(doc.candidates.map((c) => c.name.toLowerCase()));
  const candidates = [...doc.candidates];
  const duplicates: string[] = [];
  let added = 0, overLimit = 0;
  for (const r of rows) {
    const k = r.name.toLowerCase();
    if (seen.has(k)) {
      duplicates.push(r.name);
      continue;
    }
    if (candidates.length >= MGE_LIMITS.candidates) {
      overLimit++;
      continue;
    }
    seen.add(k);
    candidates.push({ id: makeId(), name: r.name, score: r.score, tags: [] });
    added++;
  }
  return { doc: { ...doc, candidates }, added, duplicates, overLimit, errors };
}

/** YYYY-MM-DD in the user's local time zone. */
export function localDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** "Thu, Oct 1, 2026" for YYYY-MM-DD. */
export function longDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export interface PublishedLink {
  url: string;
  hint: "ok" | "long";
  payload: MgePublic;
}

/** Build the public, view-only ledger link. Scores stay out unless `includeScores`. */
export async function publishMge(doc: MgeDoc, plan: MgePlan, includeScores: boolean, today: string, origin?: string): Promise<PublishedLink> {
  const payload = mgePublicPayload(doc, includeScores, today, plan);
  const code = await encodeShare(MGE_KIND, payload);
  const url = shareUrl(MGE_VIEW_PATH, code, origin);
  return { url, hint: linkLengthHint(url), payload };
}

/** Read a ledger from a location hash (#d=...). Never throws. */
export function readMgeLink(hash: string): Promise<DecodeResult<MgePublic>> {
  return decodeShare(shareFromHash(hash), MGE_KIND, parseMgePublic);
}
