// Minimal readers for research/facts (fact cards = Markdown with YAML front matter,
// tables = CSV). Used only by build-data.ts and by tests that check the generated
// JSON is still in sync with research/. No dependency on @rokadm/data (built in parallel).
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(here, "../../..");
export const FACTS_DIR = join(REPO_ROOT, "research", "facts");
export const PLANNER_DATA_DIR = resolve(here, "../data");

export interface RawCard {
  id: string;
  path: string;
  /** Top-level scalar keys of the front matter (quotes stripped). */
  fields: Record<string, string>;
  /** Full text of the card (front matter + body), for evidence checks. */
  text: string;
}

function unquote(v: string): string {
  const s = v.trim();
  if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1).replace(/''/g, "'");
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1).replace(/\\"/g, '"');
  return s;
}

/** Parses the first `---` block; only single-line top-level `key: value` pairs are kept. */
export function parseCard(text: string, path = ""): RawCard {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") throw new Error(`No front matter in ${path}`);
  const fields: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.trim() === "---") break;
    const m = /^([a-z_]+):\s?(.*)$/.exec(line);
    if (m && m[1]) fields[m[1]] = unquote(m[2] ?? "");
  }
  const id = fields["id"];
  if (!id) throw new Error(`Card without id: ${path}`);
  return { id, path, fields, text };
}

export function findCardPath(id: string): string | null {
  const dom = id.split("-")[0] ?? "";
  const p = join(FACTS_DIR, dom, `${id}.md`);
  return existsSync(p) ? p : null;
}

export function readCard(id: string): RawCard {
  const p = findCardPath(id);
  if (!p) throw new Error(`Fact card not found: ${id}`);
  return parseCard(readFileSync(p, "utf8"), p);
}

/** All gap IDs (L-XNN-NN) declared in research/facts/<dom>/_lacunas.md files. */
export function readGapIds(): Set<string> {
  const out = new Set<string>();
  for (const dom of readdirSync(FACTS_DIR)) {
    const p = join(FACTS_DIR, dom, "_lacunas.md");
    if (!existsSync(p)) continue;
    for (const m of readFileSync(p, "utf8").matchAll(/^\|\s*(L-[A-Z]\d{2}-\d{2})\s*\|/gm)) {
      if (m[1]) out.add(m[1]);
    }
  }
  return out;
}

/** Small CSV parser (RFC 4180 quotes). */
export function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQ = false;
      else cell += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); if (row.some((x) => x !== "")) rows.push(row); }
  const [header, ...body] = rows;
  if (!header) return [];
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

export function readFactsCsv(relPath: string): Array<Record<string, string>> {
  return parseCsv(readFileSync(join(FACTS_DIR, relPath), "utf8"));
}
