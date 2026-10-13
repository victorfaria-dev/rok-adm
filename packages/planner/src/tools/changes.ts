// "What changed since…" (F-28). Patches arrive as arguments (lean rows of packages/data patches.json).
//
// Dates are ISO days ("2025-01-07") or partial months ("2024-05"), on both sides.
// Rule for the same month when either date is only a month: the patch is SHOWN and flagged
// `sameMonth`, because we cannot tell whether it landed before or after the player stopped, and
// hiding a change they missed is worse than repeating one they saw. Same day counts as "since"
// (the patch may have shipped after the player's last session that day), also flagged.

export type PatchConfidence = "alta" | "media" | "baixa";

export interface PatchRow {
  version: string;
  /** "YYYY-MM-DD", "YYYY-MM" or null (unknown). */
  date: string | null;
  confidence: PatchConfidence;
  summary: string;
  factIds: string[];
}

export interface ChangeItem<P extends PatchRow = PatchRow> {
  patch: P;
  /** True when the patch falls in the stop month (or day) and may predate the stop. */
  sameMonth: boolean;
}

interface Ymd { y: number; m: number; d: number | null }

/** "2024-05" → {2024, 5, null}; "2024-05-13" → {2024, 5, 13}; anything else → null. */
export function parseYmd(s: string | null | undefined): Ymd | null {
  if (typeof s !== "string") return null;
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = m[3] === undefined ? null : Number(m[3]);
  if (mo < 1 || mo > 12) return null;
  if (d !== null && (d < 1 || d > 31)) return null;
  return { y, m: mo, d };
}

/** Numeric compare of "1.0.90" style versions (missing parts count as 0). */
export function compareVersion(a: string, b: string): number {
  const pa = a.split(".").map((x) => Number.parseInt(x, 10) || 0);
  const pb = b.split(".").map((x) => Number.parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/**
 * Where a patch date sits relative to a stop date: "after", "before", or "same" (same month with a
 * partial date on either side, or the same day). Unknown patch dates count as "same" (can't rule out).
 */
export function relativeToStop(patchDate: string | null, stop: string): "after" | "before" | "same" {
  const p = parseYmd(patchDate), s = parseYmd(stop);
  if (!s) throw new RangeError(`Not a date: ${stop}`);
  if (!p) return "same";
  const pm = p.y * 12 + p.m, sm = s.y * 12 + s.m;
  if (pm !== sm) return pm > sm ? "after" : "before";
  if (p.d === null || s.d === null) return "same";
  return p.d > s.d ? "after" : p.d < s.d ? "before" : "same";
}

/** Every patch on or after the stop date (see the rule at the top), newest version first. */
export function patchesSince<P extends PatchRow>(patches: readonly P[], stop: string): ChangeItem<P>[] {
  return patches
    .map((patch) => ({ patch, rel: relativeToStop(patch.date, stop) }))
    .filter((x) => x.rel !== "before")
    .sort((a, b) => compareVersion(b.patch.version, a.patch.version))
    .map(({ patch, rel }) => ({ patch, sameMonth: rel === "same" }));
}

/** Every patch, newest first (the "show all" view and the no-JS page). */
export function allPatches<P extends PatchRow>(patches: readonly P[]): ChangeItem<P>[] {
  return [...patches].sort((a, b) => compareVersion(b.version, a.version)).map((patch) => ({ patch, sameMonth: false }));
}

/**
 * The data has no impact field, so the only honest split is by source: patches with official notes
 * (confidence "alta") and patches known only from secondary reports ("media"/"baixa").
 */
export function groupBySource<P extends PatchRow>(items: readonly ChangeItem<P>[]): { official: ChangeItem<P>[]; reported: ChangeItem<P>[] } {
  return {
    official: items.filter((i) => i.patch.confidence === "alta"),
    reported: items.filter((i) => i.patch.confidence !== "alta"),
  };
}

export const PATCH_CONFIDENCE_WORDS: Record<PatchConfidence, string> = {
  alta: "Official patch notes",
  media: "Medium confidence: no official notes found, reported by other sources",
  baixa: "Low confidence: third-party reports only, not confirmed",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2025-01-07" → "7 Jan 2025"; "2023-03" → "Mar 2023"; null → "Date unknown". */
export function formatPatchDate(date: string | null): string {
  const p = parseYmd(date);
  if (!p) return "Date unknown";
  return p.d === null ? `${MONTHS[p.m - 1]} ${p.y}` : `${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
}

/** "2024-05" → "May 2024". */
export function formatMonth(ym: string): string {
  const p = parseYmd(ym);
  return p ? `${MONTHS_LONG[p.m - 1]} ${p.y}` : ym;
}

/** Months from `to` back to `from` inclusive, newest first, as "YYYY-MM" (for the stop-month picker). */
export function monthsBetween(from: string, to: string): string[] {
  const a = parseYmd(from), b = parseYmd(to);
  if (!a || !b) return [];
  const out: string[] = [];
  for (let k = b.y * 12 + (b.m - 1); k >= a.y * 12 + (a.m - 1); k--) {
    out.push(`${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, "0")}`);
  }
  return out;
}
