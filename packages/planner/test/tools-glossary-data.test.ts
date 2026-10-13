// Integrity of tools-data/glossary.json (F-88): unique ids and names, short definitions, real cards.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { findCardPath } from "../scripts/research";
import { countSentences, normalizeQuery, type GlossaryTerm } from "../src/tools";

const data = JSON.parse(readFileSync(resolve(__dirname, "../tools-data/glossary.json"), "utf8")) as { terms: GlossaryTerm[] };
const terms = data.terms;

describe("glossary.json", () => {
  it("has 30 to 50 terms", () => {
    expect(terms.length).toBeGreaterThanOrEqual(30);
    expect(terms.length).toBeLessThanOrEqual(50);
  });

  it("has unique, anchor-safe ids", () => {
    const ids = terms.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("has unique terms and aliases (no name points at two terms)", () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const t of terms) {
      for (const name of new Set([t.term, ...t.aliases].map(normalizeQuery))) {
        const prev = seen.get(name);
        if (prev && prev !== t.id) clashes.push(`${name}: ${prev} and ${t.id}`);
        seen.set(name, t.id);
      }
    }
    expect(clashes).toEqual([]);
  });

  it("keeps every definition to two sentences or fewer", () => {
    const long = terms.filter((t) => countSentences(t.definition) > 2 || countSentences(t.definition) === 0).map((t) => t.id);
    expect(long).toEqual([]);
  });

  it("cites at least one real fact card per term", () => {
    const bad = terms.flatMap((t) =>
      t.facts.length === 0 ? [`${t.id}: no facts`] : t.facts.filter((id) => !findCardPath(id)).map((id) => `${t.id}: ${id} not found`));
    expect(bad).toEqual([]);
  });

  it("only links related terms that exist", () => {
    const ids = new Set(terms.map((t) => t.id));
    const bad = terms.flatMap((t) => (t.related ?? []).filter((r) => !ids.has(r) || r === t.id).map((r) => `${t.id} → ${r}`));
    expect(bad).toEqual([]);
  });

  it("uses no em dashes in UI text", () => {
    const bad = terms.filter((t) => /—/.test(`${t.term} ${t.aliases.join(" ")} ${t.definition}`)).map((t) => t.id);
    expect(bad).toEqual([]);
  });
});
