import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FARMS_DATA, FARM_FACTS, RESOURCES, VARIANT_IDS, BUILD_CHECK_FIELDS, farmConfidenceOf, farmFactConfidence, farmMinConfidence,
} from "../src/farms-common";
import { TRADING_POST_LEVELS } from "../src/farms-trading-post";
import { BUNDLED_FACTS, confidenceOf, factConfidence, indexFacts, minConfidence } from "../src/facts";
import { buildData, serialize } from "../scripts/build-data";
import { PLANNER_DATA_DIR, readCard, readFactsCsv, readGapIds } from "../scripts/research";

const factIds = new Set(BUNDLED_FACTS.map((f) => f.id));

function allSourced(): Array<{ where: string; facts: string[]; gaps?: string[] }> {
  const d = FARMS_DATA;
  return [
    { where: "tradingPostUnlock", ...d.tradingPostUnlock },
    ...Object.entries(d.transferWarnings).map(([k, v]) => ({ where: `warning ${k}`, ...v })),
    ...d.bottlenecks.map((b) => ({ where: `bottleneck ${b.id}`, facts: b.facts })),
    ...RESOURCES.map((r) => ({ where: `civ ${r}`, facts: d.civByResource[r].facts })),
    ...VARIANT_IDS.map((v) => ({ where: `variant ${v}`, ...d.variants[v] })),
    ...Object.entries(d.farmCount).map(([k, v]) => ({ where: `count ${k}`, ...v })),
    ...d.buildStages.flatMap((s) => s.steps.map((st) => ({ where: `step ${st.id}`, ...st }))),
    ...d.dailyTasks.map((t) => ({ where: `daily ${t.id}`, ...t })),
  ];
}

describe("farms data is in sync with research/facts", () => {
  it("build-data reports no errors (facts, gaps, evidence substrings incl. farms.json)", () => {
    expect(buildData().errors).toEqual([]);
  });

  it("trading-post.json matches the A03 CSV (run build:data if this fails)", () => {
    const res = buildData();
    const tp = JSON.parse(readFileSync(join(PLANNER_DATA_DIR, "trading-post.json"), "utf8"));
    expect(tp.levels).toEqual(JSON.parse(serialize(res.tradingPost)));
    const csv = readFactsCsv("A03/data/trading-post.csv");
    expect(TRADING_POST_LEVELS.map((l) => l.level)).toEqual(csv.map((r) => Number(r["Level"])));
  });

  it("farms-facts.json is in sync and matches facts-meta.json for every cited card", () => {
    const res = buildData();
    const ff = JSON.parse(readFileSync(join(PLANNER_DATA_DIR, "farms-facts.json"), "utf8"));
    expect(ff.facts).toEqual(JSON.parse(serialize(res.farmFacts)));
    expect(JSON.stringify(ff)).not.toContain("invalidatedBy"); // client-bundle dataset marker
    const meta = new Map(BUNDLED_FACTS.map((f) => [f.id, f]));
    for (const f of FARM_FACTS) {
      expect(meta.get(f.id)?.confidence, f.id).toBe(f.confidence);
      expect(meta.get(f.id)?.status, f.id).toBe(f.status);
    }
    for (const s of allSourced()) for (const id of s.facts) expect(FARM_FACTS.some((f) => f.id === id), `${s.where}: ${id}`).toBe(true);
  });

  it("farm confidence helpers behave exactly like facts.ts", () => {
    const index = indexFacts(BUNDLED_FACTS);
    for (const f of BUNDLED_FACTS) expect(farmFactConfidence(f), f.id).toBe(factConfidence(f));
    expect(farmFactConfidence(undefined)).toBe(factConfidence(undefined));
    const sets = [[], ["A03-0024"], ["A03-0024", "A03-0025"], ["A13-0004", "A03-0009"], ["NOPE-0001", "A03-0024"]];
    for (const ids of sets) expect(farmConfidenceOf(ids, index)).toBe(confidenceOf(ids, index));
    const cs = ["high", "medium", "low", "pending"] as const;
    for (const a of cs) for (const b of cs) expect(farmMinConfidence(a, b)).toBe(minConfidence(a, b));
    expect(farmMinConfidence()).toBe(minConfidence());
  });

  it("farm modules import only types from ./facts (keeps facts-meta.json out of client bundles)", () => {
    const dir = join(PLANNER_DATA_DIR, "..", "src");
    for (const f of readdirSync(dir).filter((n) => n.startsWith("farms"))) {
      const src = readFileSync(join(dir, f), "utf8");
      for (const line of src.split("\n").filter((l) => /from "\.\/facts"/.test(l))) expect(line, f).toMatch(/^import type /);
      expect(src, f).not.toMatch(/from "\.\.\/data\/facts-meta\.json"|BUNDLED_FACTS/);
    }
  });

  it("every cited fact is bundled and every gap is declared", () => {
    const gaps = readGapIds();
    for (const s of allSourced()) {
      expect(s.facts.length, s.where).toBeGreaterThan(0);
      for (const f of s.facts) expect(factIds.has(f), `${s.where}: ${f}`).toBe(true);
      for (const g of s.gaps ?? []) expect(gaps.has(g), `${s.where}: ${g}`).toBe(true);
    }
  });

  it("bottleneck bands cover CH1..25 without gaps or overlaps", () => {
    const covered: number[] = [];
    for (const b of FARMS_DATA.bottlenecks) for (let c = b.minCityHall; c <= b.maxCityHall; c++) covered.push(c);
    expect(covered).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
  });

  it("build-step checks use known fields and unique ids", () => {
    const steps = FARMS_DATA.buildStages.flatMap((s) => s.steps);
    expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
    for (const s of steps) if (s.check) expect(BUILD_CHECK_FIELDS).toContain(s.check.field);
  });

  it("numbers in build steps appear in the cited cards", () => {
    // Academy minimums are the top of each range in A03-0028.
    const a28 = readCard("A03-0028").text;
    for (const range of ["Academy 5–9", "Academy 12–15", "Academy 17–20", "Academy 20–25"]) expect(a28).toContain(range);
    expect(readCard("A03-0017").text).toContain("level 37");
    const a23 = readCard("A03-0023").text;
    for (const s of ["3 from CH11", "4 from CH17", "5 from CH22"]) expect(a23).toContain(s);
  });

  it("no daily task has measured minutes (gap L-A13-01)", () => {
    for (const t of FARMS_DATA.dailyTasks) expect(t.gaps).toContain("L-A13-01");
  });
});
