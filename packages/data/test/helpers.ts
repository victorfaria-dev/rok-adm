import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const ROOT = resolve(PKG, "../..");

/** Reads a research CSV directly (independent of the pipeline's parser) for cross-checks. */
export function rawCsvColumn(rel: string, keyCol: string, valCol: string): Map<string, string> {
  const lines = readFileSync(join(ROOT, "research", rel), "utf8").trim().split("\n");
  const split = (l: string) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, ""));
  const header = split(lines[0]!);
  const k = header.indexOf(keyCol);
  const v = header.indexOf(valCol);
  return new Map(lines.slice(1).map((l) => { const c = split(l); return [c[k]!, c[v]!]; }));
}
