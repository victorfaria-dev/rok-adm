// Every number in tools-data/ must trace to a fact card (see tools-data/README.md).
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { findCardPath, readCard } from "../scripts/research";

const DIR = resolve(__dirname, "../tools-data");
const FACT_ID_RE = /\b[A-C]\d{2}-\d{4}\b/g;

function walk(v: unknown, path: string, out: string[]): void {
  if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${path}[${i}]`, out)); return; }
  if (typeof v !== "object" || v === null) return;
  const o = v as Record<string, unknown>;
  if (typeof o.value === "number") {
    const facts = Array.isArray(o.facts) ? o.facts : [];
    if (facts.length === 0 && o.pending !== true) out.push(`${path}: numeric value without facts (mark "pending": true if no card covers it)`);
  }
  if (typeof o.evidence === "object" && o.evidence !== null) {
    for (const [id, needle] of Object.entries(o.evidence as Record<string, unknown>)) {
      if (!findCardPath(id)) { out.push(`${path}: evidence card ${id} not found`); continue; }
      const text = readCard(id).text.replace(/''/g, "'");
      if (typeof needle !== "string" || !text.includes(needle)) out.push(`${path}: "${String(needle)}" not found in ${id}`);
    }
  }
  for (const [k, x] of Object.entries(o)) walk(x, `${path}.${k}`, out);
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();

describe("tools-data", () => {
  it.each(files.length ? files : ["(none)"])("%s cites real cards with literal evidence", (f) => {
    if (f === "(none)") return;
    const text = readFileSync(join(DIR, f), "utf8");
    const data: unknown = JSON.parse(text);
    const errors: string[] = [];
    for (const id of new Set([...text.matchAll(FACT_ID_RE)].map((m) => m[0]))) {
      if (!findCardPath(id)) errors.push(`fact not found: ${id}`);
    }
    walk(data, f, errors);
    expect(errors).toEqual([]);
  });
});
