import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  QUICK_DEFAULT_AVERAGE, SEED_BANDS, SEED_MAX_COUNTED_PER_GOVERNOR, SEED_RULE, SEED_SOURCES, applyWhatIf, compareWhatIf, remapWhatIf, countedPower, emptyQuick,
  emptySeedDoc, parseGovernorLines, parseSeedDoc, quickAverageFits, quickToGovernors, seedGovernors, seedRuleFreshness, simulateSeed,
  type SeedGovernor,
} from "../src/kingdom-seed";

const M = 1e6;
const gov = (id: string, power: number, name = ""): SeedGovernor => ({ id, name, power });

describe("countedPower (marginal bands, B08-0008)", () => {
  it.each([
    [0, 0], [-5, 0], [NaN, 0],
    [100 * M, 100 * M],
    [150 * M, 150 * M],
    [200 * M, 190 * M], // 150 + 0.8 × 50
    [300 * M, 270 * M], // 150 + 120
    [400 * M, 320 * M], // 270 + 0.5 × 100
    [500 * M, 370 * M],
    [900 * M, 370 * M],
  ])("%d → %d", (p, c) => expect(countedPower(p)).toBeCloseTo(c, 0));

  it("never exceeds the per-governor maximum and never decreases with power", () => {
    let prev = 0;
    for (let p = 0; p <= 1_000 * M; p += 7 * M) {
      const c = countedPower(p);
      expect(c).toBeGreaterThanOrEqual(prev);
      expect(c).toBeLessThanOrEqual(SEED_MAX_COUNTED_PER_GOVERNOR);
      prev = c;
    }
  });

  it("bands match the card", () => {
    expect(SEED_BANDS.map((b) => [b.from, b.rate])).toEqual([[0, 1], [150 * M, 0.8], [300 * M, 0.5], [500 * M, 0]]);
    expect(SEED_RULE.topN).toBe(300);
    expect(SEED_RULE.imperiumThreshold).toBe(23_500_000_000);
  });
});

describe("simulateSeed", () => {
  it("counts only the top 300 (305 pasted → 5 ignored, the smallest)", () => {
    const govs = Array.from({ length: 305 }, (_, i) => gov(`g${i}`, (i + 1) * M));
    const r = simulateSeed(govs);
    expect(r.totalGovernors).toBe(305);
    expect(r.countedGovernors).toBe(300);
    expect(r.ignoredGovernors).toBe(5);
    expect(r.ignoredPower).toBe((1 + 2 + 3 + 4 + 5) * M);
    expect(r.top[0]!.power).toBe(305 * M);
    expect(r.top[299]!.power).toBe(6 * M);
  });

  it("band breakdown for a known input", () => {
    // 600M, 400M, 200M, 100M
    const r = simulateSeed([gov("a", 600 * M), gov("b", 400 * M), gov("c", 200 * M), gov("d", 100 * M)]);
    expect(r.bands.map((b) => [b.key, b.rawPower, b.countedPower])).toEqual([
      ["0-150M", 550 * M, 550 * M],
      ["150-300M", 350 * M, 280 * M],
      ["300-500M", 300 * M, 150 * M],
      [">500M", 100 * M, 0],
    ]);
    expect(r.counted).toBe(980 * M); // 370 + 320 + 190 + 100
    expect(r.bands.reduce((s, b) => s + b.countedPower, 0)).toBe(r.counted);
    expect([r.above150M, r.above300M, r.above500M]).toEqual([3, 2, 1]);
    expect(r.rawTopPower).toBe(1300 * M);
    expect(r.imperium).toEqual({ threshold: 23_500_000_000, reached: false, gap: 23_500_000_000 - 980 * M });
  });

  it("Imperium is reached at or above 23.5B", () => {
    const r = simulateSeed(Array.from({ length: 300 }, (_, i) => gov(`g${i}`, 500 * M)));
    expect(r.counted).toBe(300 * 370 * M);
    expect(r.imperium.reached).toBe(true);
  });

  it("empty input", () => {
    const r = simulateSeed([]);
    expect(r.counted).toBe(0);
    expect(r.top).toEqual([]);
    expect(r.bands.every((b) => b.rawPower === 0)).toBe(true);
  });

  it("ties rank by name then id", () => {
    const r = simulateSeed([gov("2", 5 * M, "B"), gov("1", 5 * M, "B"), gov("3", 5 * M, "A")]);
    expect(r.top.map((x) => x.id)).toEqual(["3", "1", "2"]);
  });
});

describe("what-if", () => {
  const govs = [...Array.from({ length: 300 }, (_, i) => gov(`g${i}`, 200 * M)), gov("bench", 50 * M)];

  it("Vacation Permit (hypothesis) removes a governor and the 301st moves in", () => {
    const c = compareWhatIf(govs, { vacation: ["g0"], zeroed: {} });
    expect(c.vacationCount).toBe(1);
    expect(c.after.countedGovernors).toBe(300);
    expect(c.after.top.some((r) => r.id === "bench")).toBe(true);
    expect(c.delta).toBe(Math.round(50 * M - 190 * M));
  });

  it("zeroed governors count with the typed power; increases are ignored", () => {
    const c = compareWhatIf(govs, { vacation: [], zeroed: { g1: 20 * M, g2: 900 * M, ghost: 1 } });
    expect(c.zeroedCount).toBe(1);
    // g1 drops to 20M and falls below bench (50M), so bench enters the top 300 and g1 drops out.
    expect(c.delta).toBe(Math.round(50 * M - 190 * M));
    expect(applyWhatIf(govs, { vacation: [], zeroed: { g2: 900 * M } }).find((g) => g.id === "g2")!.power).toBe(200 * M);
  });

  it("no marks → no change", () => {
    expect(compareWhatIf(govs, { vacation: [], zeroed: {} }).delta).toBe(0);
  });
});

describe("pasted list", () => {
  it("accepts 1.5m, 300k, 1,200,000 and Name, power", () => {
    const r = parseGovernorLines("1.5m\n300k\n\n1,200,000\nAlpha, 2.4b\nBeta\t150000000\nbad line\nGamma, lots\n9b");
    expect(r.governors).toEqual([
      { id: "L1", name: "", power: 1_500_000 },
      { id: "L2", name: "", power: 300_000 },
      { id: "L4", name: "", power: 1_200_000 },
      { id: "L5", name: "Alpha", power: 2_400_000_000 },
      { id: "L6", name: "Beta", power: 150_000_000 },
    ]);
    expect(r.errors.map((e) => e.line)).toEqual([7, 8, 9]);
    expect(r.errors[2]!.message).toMatch(/higher than any governor/);
    expect(r.truncated).toBe(false);
  });

  it("caps the number of governors", () => {
    const r = parseGovernorLines(Array.from({ length: 2005 }, () => "1m").join("\n"));
    expect(r.governors).toHaveLength(2000);
    expect(r.truncated).toBe(true);
  });
});

describe("quick mode", () => {
  it("expands counts per band at the average, or the band default", () => {
    const q = emptyQuick();
    q["0-150M"] = { count: 2, average: 100 * M };
    q[">500M"] = { count: 1, average: null };
    const g = quickToGovernors(q);
    expect(g.map((x) => x.power)).toEqual([100 * M, 100 * M, QUICK_DEFAULT_AVERAGE[">500M"]]);
    expect(simulateSeed(g).counted).toBe(200 * M + 370 * M);
  });

  it("checks the average fits its band", () => {
    expect(quickAverageFits("0-150M", 150 * M)).toBe(true);
    expect(quickAverageFits("0-150M", 151 * M)).toBe(false);
    expect(quickAverageFits("150-300M", 150 * M)).toBe(false);
    expect(quickAverageFits(">500M", 800 * M)).toBe(true);
    const q = emptyQuick();
    q["150-300M"] = { count: 1, average: 10 * M };
    expect(quickToGovernors(q)[0]!.power).toBe(QUICK_DEFAULT_AVERAGE["150-300M"]);
  });
});

describe("stored simulation", () => {
  it("parses tolerantly", () => {
    const d = parseSeedDoc({ id: "s", title: " K1 ", mode: "quick", listText: 5, quick: { "0-150M": { count: 3.7, average: 999 * M }, junk: 1 }, whatIf: { vacation: ["L1", "L1", 3], zeroed: { L2: 5, L3: -1 } } });
    expect(d.title).toBe("K1");
    expect(d.mode).toBe("quick");
    expect(d.listText).toBe("");
    expect(d.quick["0-150M"]).toEqual({ count: 3, average: null });
    expect(d.whatIf).toEqual({ vacation: ["L1"], zeroed: { L2: 5 } });
    expect(parseSeedDoc(null, "fb").id).toBe("fb");
    expect(seedGovernors(d).governors).toHaveLength(3);
    expect(seedGovernors({ ...emptySeedDoc("x"), listText: "1m\n2m" }).governors).toHaveLength(2);
  });
});

describe("freshness and sources", () => {
  it("flags the passed check date", () => {
    expect(seedRuleFreshness("2026-10-13")).toEqual({ stale: true, text: "Last verified for patch 1.0.95; check date passed, may be outdated." });
    expect(seedRuleFreshness("2026-01-01").stale).toBe(false);
  });

  const card = (id: string) => readFileSync(join(__dirname, "../../../research/facts", id.slice(0, 3), `${id}.md`), "utf8");
  it.each(SEED_SOURCES.map((s) => [s.id, s.confidence] as const))("%s confidence shown (%s) matches the card file", (id, conf) => {
    expect(/^confianca:\s*(\S+)/m.exec(card(id))?.[1]).toBe(conf);
  });

  it("B08-0008 still states the patch, check date, top 300 and the marginal wording", () => {
    const c = card("B08-0008");
    expect(c).toMatch(/^versao_jogo: "1\.0\.95"/m);
    expect(c).toMatch(new RegExp(`^data_validade: ${SEED_RULE.checkBy}`, "m"));
    expect(c).toContain("80% of your power from 150,000,000 to 300,000,000");
    expect(c).toContain("top 300 governors by individual power");
    expect(c).toContain("23,500,000,000");
  });

  it("B03-0007 still words the exclusion as the matchmaking score (hypothesis label stays)", () => {
    expect(card("B03-0007")).toContain("not be counted towards their kingdom's matchmaking score");
    expect(readFileSync(join(__dirname, "../../../research/facts/B03/_lacunas.md"), "utf8")).toContain("L-B03-03");
  });
});

describe("quick mode default for the top band", () => {
  it("fits its own band and counts as above 500M", () => {
    expect(quickAverageFits(">500M", QUICK_DEFAULT_AVERAGE[">500M"])).toBe(true);
    expect(QUICK_DEFAULT_AVERAGE[">500M"]).toBeGreaterThan(500e6);
  });
});

describe("remapWhatIf", () => {
  it("keeps marks on the same governor when lines are inserted, drops marks of removed governors", () => {
    const old = "Alpha, 400m\nBravo, 300m\nCharlie, 200m";
    const w = { vacation: ["L1"], zeroed: { L3: 50e6 } };
    const r = remapWhatIf(old, "Newbie, 450m\n" + old, w);
    expect(r).toEqual({ vacation: ["L2"], zeroed: { L4: 50e6 } });
    expect(remapWhatIf(old, "Bravo, 300m\nCharlie, 200m", w)).toEqual({ vacation: [], zeroed: { L2: 50e6 } });
    expect(remapWhatIf(old, "Alpha, 410m\nBravo, 300m", w)).toEqual({ vacation: [], zeroed: {} });
  });
});
