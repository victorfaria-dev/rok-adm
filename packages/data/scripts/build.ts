// F-50 v0 data pipeline: research/facts + guides/data -> packages/data/generated (versioned JSON).
// Run: pnpm --filter @rokadm/data build
//
// Output is deterministic: object keys are sorted, arrays have a fixed order, and manifest.json keeps
// its builtAt/gitCommit when the dataset version (hash of inputs) has not changed, so a rebuild without
// input changes produces no diff.
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Fact, GuideBlock, PatchEntry } from "@rokadm/core";
import {
  CARD_FILE_RE, buildPatches, cardToFact, csvToTable, parseFrontMatter, parseTimeline, stableStringify, tableName,
  type DataTable,
} from "./lib";
import { compareVersions } from "../src/version";
import { isUsable } from "../src/policy";

/** Bump when the build logic changes the output shape, so the dataset version changes too. */
export const PIPELINE_VERSION = 1;

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(PKG, "../..");
const RESEARCH = join(ROOT, "research");
const FACTS_DIR = join(RESEARCH, "facts");
const BLOCKS = join(ROOT, "guides/data/blocks.f2p.json");
const TIMELINE = join(RESEARCH, "context/game-state-and-patch-timeline.md");
const OUT = join(PKG, "generated");

const BLOCK_KEYS = ["id", "title", "phase", "section", "order", "stage", "perfil", "funcao", "hours_min_per_day", "time_cost_min",
  "priority", "recommended_for", "ch_range", "civ", "consensus", "split_views", "body_md", "why_md", "cards", "patch_cards",
  "confidence", "uncertain_notes", "gaps", "low_spender_note", "as_of", "patch_ref"] as const;

export interface Manifest {
  datasetVersion: string;
  pipelineVersion: number;
  builtAt: string;
  gitCommit: string | null;
  counts: { facts: number; factsByDomain: Record<string, number>; usableFacts: number; patches: number; blocks: number; tables: number; tableRows: number };
  latestKnownPatch: PatchEntry | null;
  latestOfficialPatch: PatchEntry | null;
  tables: string[];
  inputs: number;
}

function rel(p: string): string {
  return relative(ROOT, p).split("\\").join("/");
}

export interface BuildResult {
  manifest: Manifest;
  /** Output files, path relative to generated/ -> content. */
  files: Record<string, string>;
}

/** Builds the dataset in memory (reads inputs and the previous manifest only). */
export function buildDataset(): BuildResult {
  const inputs: string[] = [];
  const read = (p: string): string => {
    inputs.push(p);
    return readFileSync(p, "utf8");
  };

  // 1. Fact cards
  const cardFiles = readdirSync(FACTS_DIR)
    .filter((d) => /^[A-C]\d{2}$/.test(d) && statSync(join(FACTS_DIR, d)).isDirectory())
    .flatMap((d) => readdirSync(join(FACTS_DIR, d)).filter((f) => CARD_FILE_RE.test(f)).map((f) => join(FACTS_DIR, d, f)))
    .sort();
  const errors: string[] = [];
  const parsed: Array<{ fact: Fact; raw: Record<string, unknown> }> = [];
  for (const file of cardFiles) {
    try {
      const raw = parseFrontMatter(read(file));
      parsed.push({ fact: cardToFact(raw, file.split("/").pop()!.replace(/\.md$/, "")), raw });
    } catch (e) {
      errors.push(`${rel(file)}: ${(e as Error).message}`);
    }
  }
  if (errors.length) throw new Error(`fact cards failed to parse:\n${errors.join("\n")}`);
  const facts = parsed.map((p) => p.fact).sort((a, b) => a.id.localeCompare(b.id));
  const ids = new Set<string>();
  for (const f of facts) {
    if (ids.has(f.id)) throw new Error(`duplicate fact id ${f.id}`);
    ids.add(f.id);
  }

  // 2. Tables referenced by `tabela` (a CSV path, or a directory of CSVs), relative to research/
  const tableRefs = new Map<string, Set<string>>(); // csv rel path -> fact ids
  for (const f of facts) {
    if (!f.table) continue;
    const abs = join(RESEARCH, f.table);
    if (!existsSync(abs)) throw new Error(`${f.id}: tabela not found: ${f.table}`);
    const csvs = statSync(abs).isDirectory()
      ? readdirSync(abs).filter((x) => x.endsWith(".csv")).map((x) => join(abs, x))
      : [abs];
    for (const c of csvs) {
      const key = relative(RESEARCH, c).split("\\").join("/");
      const s = tableRefs.get(key) ?? new Set<string>();
      s.add(f.id);
      tableRefs.set(key, s);
    }
  }
  const tables: DataTable[] = [...tableRefs.keys()].sort().map((p) =>
    csvToTable(tableName(p), p, read(join(RESEARCH, p)), [...(tableRefs.get(p) ?? [])]));

  // 3. Patches (C04 cards + dates/summaries from the patch timeline context pack)
  const timeline = parseTimeline(read(TIMELINE));
  const patches = buildPatches(parsed.filter((p) => p.fact.domain === "C04"), timeline);

  // 4. Guide blocks
  const blocksRaw: unknown = JSON.parse(read(BLOCKS));
  if (!Array.isArray(blocksRaw)) throw new Error("blocks.f2p.json is not an array");
  for (const b of blocksRaw as Record<string, unknown>[]) {
    const missing = BLOCK_KEYS.filter((k) => !(k in b));
    if (missing.length) throw new Error(`block ${String(b.id)} missing ${missing.join(", ")}`);
  }
  const blocks = [...(blocksRaw as GuideBlock[])].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  // 5. Manifest
  const hash = createHash("sha256");
  hash.update(`pipeline:${PIPELINE_VERSION}\n`);
  for (const p of [...inputs].sort()) {
    hash.update(`${rel(p)}\n`);
    hash.update(readFileSync(p));
    hash.update("\n");
  }
  const datasetVersion = hash.digest("hex").slice(0, 16);
  const prev = existsSync(join(OUT, "manifest.json"))
    ? (JSON.parse(readFileSync(join(OUT, "manifest.json"), "utf8")) as Partial<Manifest>)
    : null;
  let builtAt: string;
  let gitCommit: string | null;
  if (prev?.datasetVersion === datasetVersion && prev.builtAt) {
    builtAt = prev.builtAt;
    gitCommit = prev.gitCommit ?? null;
  } else {
    builtAt = process.env.SOURCE_DATE_EPOCH
      ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
      : new Date().toISOString();
    try {
      gitCommit = execSync("git rev-parse HEAD", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || null;
    } catch {
      gitCommit = null;
    }
  }
  const byDomain: Record<string, number> = {};
  for (const f of facts) byDomain[f.domain] = (byDomain[f.domain] ?? 0) + 1;
  const sortedPatches = [...patches].sort((a, b) => compareVersions(a.version, b.version));
  const manifest: Manifest = {
    datasetVersion,
    pipelineVersion: PIPELINE_VERSION,
    builtAt,
    gitCommit,
    counts: {
      facts: facts.length,
      factsByDomain: byDomain,
      usableFacts: facts.filter((f) => isUsable(f)).length,
      patches: patches.length,
      blocks: blocks.length,
      tables: tables.length,
      tableRows: tables.reduce((n, t) => n + t.rows.length, 0),
    },
    latestKnownPatch: sortedPatches.at(-1) ?? null,
    latestOfficialPatch: sortedPatches.filter((p) => p.confidence === "alta").at(-1) ?? null,
    tables: tables.map((t) => t.name),
    inputs: inputs.length,
  };

  // 6. Files
  const files: Record<string, string> = {};
  const write = (name: string, data: unknown) => { files[name] = stableStringify(data); };
  write("facts.json", facts);
  write("patches.json", patches);
  write("blocks.f2p.json", blocks);
  for (const t of tables) write(`tables/${t.name}.json`, t);
  write("manifest.json", manifest);
  // Typed static entry point for the app (all JSON is bundled; the dataset is small).
  const ident = (n: string) => "t_" + n.replace(/[^A-Za-z0-9]/g, "_");
  files["index.ts"] = [
    "// GENERATED by packages/data/scripts/build.ts — do not edit.",
    'import facts from "./facts.json";',
    'import patches from "./patches.json";',
    'import blocks from "./blocks.f2p.json";',
    'import manifest from "./manifest.json";',
    ...tables.map((t) => `import ${ident(t.name)} from "./tables/${t.name}.json";`),
    "",
    "export const rawFacts: unknown = facts;",
    "export const rawPatches: unknown = patches;",
    "export const rawBlocks: unknown = blocks;",
    "export const rawManifest: unknown = manifest;",
    "export const rawTables: Record<string, unknown> = {",
    ...tables.map((t) => `  ${JSON.stringify(t.name)}: ${ident(t.name)},`),
    "};",
    "",
  ].join("\n");
  return { manifest, files };
}

/** Builds and replaces packages/data/generated. */
export function build(): Manifest {
  const { manifest, files } = buildDataset();
  rmSync(OUT, { recursive: true, force: true });
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(OUT, name)), { recursive: true });
    writeFileSync(join(OUT, name), content);
  }
  return manifest;
}

export const GENERATED_DIR = OUT;

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const m = build();
  console.log(`@rokadm/data ${m.datasetVersion}: ${m.counts.facts} facts (${m.counts.usableFacts} usable), ` +
    `${m.counts.patches} patches, ${m.counts.blocks} blocks, ${m.counts.tables} tables (${m.counts.tableRows} rows); ` +
    `latest patch ${m.latestKnownPatch?.version ?? "?"} (${m.latestKnownPatch?.confidence ?? "?"}), ` +
    `latest official ${m.latestOfficialPatch?.version ?? "?"} -> ${rel(OUT)}`);
}
