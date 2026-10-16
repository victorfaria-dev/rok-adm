// Glossary helpers (F-88). Terms arrive as arguments (tools-data/glossary.json, read at build time).

export interface GlossaryTerm {
  /** Anchor id on /glossary/ (lowercase, a-z0-9 and dashes). */
  id: string;
  term: string;
  aliases: string[];
  /** Our own words, at most two sentences. */
  definition: string;
  /** Fact cards the definition rests on (at least one). */
  facts: string[];
  /** Ids of other terms worth reading next. */
  related?: string[];
}

/** Lowercase, strip accents and punctuation, collapse spaces ("Lohar's  Trial" → "lohars trial"). */
export function normalizeQuery(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

/** Sentence count: runs of text ending in . ! or ? followed by a space or the end (decimals like 1.5 don't split). */
export function countSentences(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/(?<=[.!?])\s+(?=[A-Z0-9"(])/).filter((x) => x.trim().length > 0).length;
}

/**
 * Terms matching `query` in the term, an alias or the definition. Order: exact term/alias match,
 * then term/alias starting with the query, then term/alias containing it, then definition matches;
 * input order within each rank. Empty query returns every term.
 */
export function searchGlossary<T extends GlossaryTerm>(terms: readonly T[], query: string): T[] {
  const q = normalizeQuery(query);
  if (!q) return [...terms];
  const ranked: { t: T; rank: number; i: number }[] = [];
  terms.forEach((t, i) => {
    const names = [t.term, ...t.aliases].map(normalizeQuery);
    let rank = -1;
    if (names.some((n) => n === q)) rank = 0;
    else if (names.some((n) => n.startsWith(q))) rank = 1;
    else if (names.some((n) => n.includes(q))) rank = 2;
    else if (normalizeQuery(t.definition).includes(q)) rank = 3;
    if (rank >= 0) ranked.push({ t, rank, i });
  });
  return ranked.sort((a, b) => a.rank - b.rank || a.i - b.i).map((r) => r.t);
}

/** Whole UTC days since 1970-01-01 (stable "day index" for a concept of the day). */
export function utcDayIndex(d: Date): number {
  return Math.floor(d.getTime() / 86_400_000);
}

/** Concept of the day (for F-11): the term for day `dayIndex`, cycling through terms sorted by id. */
export function conceptOfDay<T extends GlossaryTerm>(terms: readonly T[], dayIndex: number): T | null {
  if (terms.length === 0) return null;
  const sorted = [...terms].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const n = sorted.length;
  const i = Number.isFinite(dayIndex) ? ((Math.floor(dayIndex) % n) + n) % n : 0;
  return sorted[i]!;
}
