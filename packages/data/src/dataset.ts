// Typed loaders for the generated dataset (packages/data/generated, built by scripts/build.ts).
import type { Fact, GuideBlock, PatchEntry } from "@rokadm/core";
import { rawBlocks, rawFacts, rawManifest, rawPatches, rawTables } from "../generated/index";
import { compareVersions } from "./version";
import { CONFIDENCE_RANK } from "./policy";

export type Cell = string | number | null;

export interface DataTable {
  name: string;
  /** Path relative to research/, as written in the card's `tabela`. */
  source: string;
  columns: string[];
  rows: Array<Record<string, Cell>>;
  factIds: string[];
}

export interface DatasetManifest {
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

export const facts: readonly Fact[] = rawFacts as Fact[];
export const patches: readonly PatchEntry[] = rawPatches as PatchEntry[];
export const guideBlocks: readonly GuideBlock[] = rawBlocks as GuideBlock[];
export const manifest: DatasetManifest = rawManifest as DatasetManifest;
const tables = rawTables as Record<string, DataTable>;

const byId = new Map(facts.map((f) => [f.id, f]));

export function getFact(id: string): Fact | undefined {
  return byId.get(id);
}

/** Like getFact, but throws for an unknown id (use for ids hardcoded in code). */
export function requireFact(id: string): Fact {
  const f = byId.get(id);
  if (!f) throw new Error(`unknown fact ${id}`);
  return f;
}

export function factsByDomain(domain: string): Fact[] {
  return facts.filter((f) => f.domain === domain);
}

export function tableNames(): string[] {
  return Object.keys(tables).sort();
}

export function getTable(name: string): DataTable {
  const t = tables[name];
  if (!t) throw new Error(`unknown table ${name}`);
  return t;
}

/** Newest patch in the dataset, optionally only among patches with at least `minConfidence`
 * (e.g. "alta" = backed by official notes; 1.1.10+ is only known from a T3 source). */
export function latestPatch(opts: { minConfidence?: Fact["confidence"] } = {}): PatchEntry | null {
  const min = CONFIDENCE_RANK[opts.minConfidence ?? "baixa"];
  const list = patches.filter((p) => CONFIDENCE_RANK[p.confidence] >= min);
  return [...list].sort((a, b) => compareVersions(a.version, b.version)).at(-1) ?? null;
}

export function getPatch(version: string): PatchEntry | undefined {
  return patches.find((p) => p.version === version);
}
