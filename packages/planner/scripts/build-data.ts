// Builds packages/planner/data/{facts-meta,vip-levels,trading-post}.json straight from research/facts
// and validates the hand-authored planner data against the fact cards:
//   - every cited fact ID exists;
//   - every gap ID exists in some _lacunas.md;
//   - every `evidence` substring in budget-inputs.json and farms.json is literally present in its card.
// Usage: pnpm --filter @rokadm/planner build:data   (add --check to fail on drift without writing)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PLANNER_DATA_DIR, readCard, findCardPath, readGapIds, readFactsCsv, type RawCard } from "./research";

export const AUTHORED_FILES = [
  "routine-tasks.json",
  "routine-task-meta.json",
  "budget-inputs.json",
  "commander-checklist.json",
  "commander-shelf-life.json",
  "farms.json",
] as const;

export interface FactMetaRow {
  id: string;
  title: string;
  confidence: "alta" | "media" | "baixa";
  status: string;
  consensus: string;
  validUntil: string | null;
  invalidatedBy: string | null;
  gameVersion: string | null;
}

export interface VipLevelRow {
  vip: number;
  threshold: number;
  reading: string;
  facts: string[];
}

const FACT_ID_RE = /\b[A-C]\d{2}-\d{4}\b/g;
const GAP_ID_RE = /\bL-[A-C]\d{2}-\d{2}\b/g;

function nullable(v: string | undefined): string | null {
  if (v === undefined) return null;
  const s = v.trim();
  return s === "" || s === "null" ? null : s;
}

function toMeta(card: RawCard): FactMetaRow {
  const f = card.fields;
  const conf = f["confianca"];
  if (conf !== "alta" && conf !== "media" && conf !== "baixa") throw new Error(`${card.id}: bad confianca ${conf}`);
  return {
    id: card.id,
    title: f["titulo"] ?? "",
    confidence: conf,
    status: f["status"] ?? "bruto",
    consensus: f["consenso"] ?? "n/a",
    validUntil: nullable(f["data_validade"]),
    invalidatedBy: nullable(f["invalidado_por"]),
    gameVersion: nullable(f["versao_jogo"]),
  };
}

export interface TradingPostRow {
  level: number;
  /** 0.35 = 35%. */
  taxRate: number;
  /** Transport capacity per trip (Fandom; L1–L24 contested, A03-0025). */
  capacity: number;
  /** Requirement column as written in the table ("" when none). */
  requirement: string;
  facts: string[];
}

export interface BuildResult {
  factsMeta: FactMetaRow[];
  vipLevels: VipLevelRow[];
  tradingPost: TradingPostRow[];
  errors: string[];
}

/** Collects every `evidence: { factId: substring }` map nested anywhere in a JSON value. */
function collectEvidence(v: unknown, path: string, out: Array<[string, Record<string, string>]>): void {
  if (Array.isArray(v)) { v.forEach((x, i) => collectEvidence(x, `${path}[${i}]`, out)); return; }
  if (typeof v !== "object" || v === null) return;
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
    if (k === "evidence" && typeof x === "object" && x !== null && !Array.isArray(x)) out.push([path, x as Record<string, string>]);
    else collectEvidence(x, path ? `${path}.${k}` : k, out);
  }
}

export function buildData(): BuildResult {
  const errors: string[] = [];
  const texts = AUTHORED_FILES.map((f) => readFileSync(join(PLANNER_DATA_DIR, f), "utf8"));
  const all = texts.join("\n");

  // Facts cited anywhere in authored data, plus the VIP table card and the derived VIP card used in tests.
  const ids = new Set<string>([...all.matchAll(FACT_ID_RE)].map((m) => m[0]));
  ids.add("A05-0001");
  ids.add("A05-0007");
  ids.add("A03-0024");
  ids.add("A03-0025");
  const cards = new Map<string, RawCard>();
  for (const id of [...ids].sort()) {
    if (!findCardPath(id)) { errors.push(`fact not found in research/facts: ${id}`); continue; }
    cards.set(id, readCard(id));
  }

  const gapIds = readGapIds();
  for (const m of all.matchAll(GAP_ID_RE)) {
    if (!gapIds.has(m[0])) errors.push(`gap not declared in any _lacunas.md: ${m[0]}`);
  }

  // Evidence substrings (numbers in budget-inputs.json must be literally in the cards).
  const budget = JSON.parse(texts[2] ?? "{}") as {
    inputs: Record<string, { evidence?: Record<string, string> }>;
    oneTimeGems: Array<{ id: string; evidence?: Record<string, string> }>;
  };
  const farmEvidence: Array<[string, Record<string, string>]> = [];
  collectEvidence(JSON.parse(texts[AUTHORED_FILES.indexOf("farms.json")] ?? "{}"), "farms", farmEvidence);
  const evidenceSets = [
    ...Object.entries(budget.inputs).map(([k, v]) => [k, v.evidence ?? {}] as const),
    ...budget.oneTimeGems.map((g) => [g.id, g.evidence ?? {}] as const),
    ...farmEvidence,
  ];
  for (const [key, ev] of evidenceSets) {
    for (const [id, needle] of Object.entries(ev)) {
      const card = cards.get(id);
      if (!card) { errors.push(`${key}: evidence card ${id} missing`); continue; }
      const hay = card.text.replace(/''/g, "'");
      if (!hay.includes(needle)) errors.push(`${key}: "${needle}" not found in ${id}`);
    }
  }

  // VIP thresholds from the A05 CSV (A05-0001).
  const vipLevels: VipLevelRow[] = readFactsCsv("A05/data/vip-levels.csv").map((r) => ({
    vip: Number(r["vip_level"]),
    threshold: Number(r["vip_points_threshold"]),
    reading: r["reading"] ?? "",
    facts: ["A05-0001"],
  }));
  if (vipLevels.some((r) => !Number.isFinite(r.vip) || !Number.isFinite(r.threshold))) errors.push("vip-levels.csv: non-numeric row");

  // Trading Post tax and capacity from the A03 CSV (A03-0024 tax, A03-0025 capacity).
  const tradingPost: TradingPostRow[] = readFactsCsv("A03/data/trading-post.csv").map((r) => {
    const req = (r["Requirements"] ?? "").trim();
    return {
      level: Number(r["Level"]),
      taxRate: Number((r["Tax Rate"] ?? "").replace("%", "")) / 100,
      capacity: Number((r["Transportation Capacity"] ?? "").replace(/,/g, "")),
      requirement: req === "-" ? "" : req,
      facts: ["A03-0024", "A03-0025"],
    };
  });
  if (tradingPost.length !== 25 || tradingPost.some((r, i) => r.level !== i + 1 || !Number.isFinite(r.taxRate) || !(r.capacity > 0) || r.taxRate <= 0 || r.taxRate >= 1)) {
    errors.push("trading-post.csv: expected levels 1..25 with numeric tax and capacity");
  }

  return { factsMeta: [...cards.values()].map(toMeta), vipLevels, tradingPost, errors };
}

export function serialize(v: unknown): string {
  return JSON.stringify(v, null, 2) + "\n";
}

const isMain = process.argv[1] !== undefined && /build-data\.ts$/.test(process.argv[1]);
if (isMain) {
  const check = process.argv.includes("--check");
  const res = buildData();
  if (res.errors.length) {
    console.error(res.errors.map((e) => `ERROR ${e}`).join("\n"));
    process.exit(1);
  }
  const outputs: Array<[string, unknown]> = [
    ["facts-meta.json", { _generated: "by scripts/build-data.ts from research/facts — do not edit", facts: res.factsMeta }],
    ["vip-levels.json", { _generated: "by scripts/build-data.ts from research/facts/A05/data/vip-levels.csv — do not edit", levels: res.vipLevels }],
    ["trading-post.json", { _generated: "by scripts/build-data.ts from research/facts/A03/data/trading-post.csv — do not edit", levels: res.tradingPost }],
  ];
  let drift = false;
  for (const [file, data] of outputs) {
    const path = join(PLANNER_DATA_DIR, file);
    const next = serialize(data);
    let prev = "";
    try { prev = readFileSync(path, "utf8"); } catch { /* new file */ }
    if (prev !== next) {
      drift = true;
      if (!check) writeFileSync(path, next);
    }
  }
  console.log(`${res.factsMeta.length} facts, ${res.vipLevels.length} VIP levels, ${res.tradingPost.length} Trading Post levels${check ? (drift ? " — DRIFT" : " — in sync") : " — written"}`);
  if (check && drift) process.exit(1);
}
