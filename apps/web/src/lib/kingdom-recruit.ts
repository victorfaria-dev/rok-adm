// Web glue for the recruitment post generator (F-42): drafts in ko:kingdom:v1 (kind "recruit").
// The post builder lives in @rokadm/planner (kingdom-recruit).
import { REDDIT_TITLE_LIMIT, kingdomLabel, parseRecruitDoc, type RecruitDoc, type RecruitInput, type RecruitPost } from "@rokadm/planner";
import { listDocs, saveDoc, type StorageLike } from "./kingdom-store";

export const RECRUIT_KIND = "recruit";

export interface RecruitListItem {
  id: string;
  title: string;
  updatedAt: string;
  doc: RecruitDoc;
}

export function recruitTitle(i: Pick<RecruitInput, "kingdom">): string {
  return i.kingdom.trim() ? `${kingdomLabel(i.kingdom)} recruitment post` : "Recruitment post";
}

/** Saved drafts, most recently edited first. */
export function listRecruit(st: StorageLike | null): RecruitListItem[] {
  const out: RecruitListItem[] = [];
  for (const d of listDocs(RECRUIT_KIND, st)) {
    const doc = parseRecruitDoc(d.data);
    if (!doc) continue;
    doc.id = d.id;
    out.push({ id: d.id, title: d.title || recruitTitle(doc), updatedAt: d.updatedAt, doc });
  }
  return out;
}

/** Save a draft under `id`. Throws with a message the user can act on. */
export function saveRecruit(id: string, input: RecruitInput, st: StorageLike | null, now: Date = new Date()): RecruitDoc {
  const doc: RecruitDoc = { ...input, id, updatedAt: now.toISOString() };
  saveDoc({ id, kind: RECRUIT_KIND, title: recruitTitle(input), data: doc }, st, now);
  return doc;
}

/** Drop the envelope fields so a stored draft can be edited as form input. */
export function draftInput(doc: RecruitDoc): RecruitInput {
  const { id: _id, updatedAt: _u, ...input } = doc;
  return input;
}

const fmt = (n: number): string => n.toLocaleString("en-US");

/** Warning when the post body is over its format's limit ("" when it fits or has no limit). */
export function overLimitText(post: Pick<RecruitPost, "format" | "chars" | "limit" | "over">): string {
  if (!post.over || post.limit === null) return "";
  const by = fmt(post.chars - post.limit);
  return post.format === "reddit"
    ? `This post body is ${fmt(post.chars)} characters, over Reddit's ${fmt(post.limit)}-character limit by ${by}. Shorten the notes before you post.`
    : `This post is ${fmt(post.chars)} characters, over Discord's ${fmt(post.limit)}-character limit by ${by}. Shorten the notes or split it into two messages.`;
}

/** Note when the Reddit title had to be cut to fit ("" otherwise). */
export function titleCutText(post: Pick<RecruitPost, "titleCut">): string {
  return post.titleCut ? `Reddit titles stop at ${fmt(REDDIT_TITLE_LIMIT)} characters, so the end was cut (…). Shorten the kingdom name or stage, or list fewer roles.` : "";
}

/** "1,234 / 2,000 characters". */
export function charCount(chars: number, limit: number | null): string {
  const n = chars.toLocaleString("en-US");
  return limit === null ? `${n} characters` : `${n} / ${limit.toLocaleString("en-US")} characters`;
}
