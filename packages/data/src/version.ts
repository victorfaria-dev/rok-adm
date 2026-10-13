// Game version helpers ("1.1.09"-style patch numbers).

export const VERSION_RE = /\b(\d+)\.(\d+)\.(\d+)\b/g;

/** Compares two "x.y.z" versions numerically. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** Every "x.y.z" token in a free-text version field, in order of appearance, deduplicated. */
export function extractVersions(text: string | null | undefined): string[] {
  if (!text) return [];
  const out: string[] = [];
  for (const m of String(text).matchAll(VERSION_RE)) {
    if (!out.includes(m[0])) out.push(m[0]);
  }
  return out;
}
