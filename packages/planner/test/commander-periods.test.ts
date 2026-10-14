import { describe, expect, it } from "vitest";
import {
  COMMANDER_PERIODS, COMMANDER_RELEASES, classifyCommanders, commanderTiming, commanderTimingById, getCommanderRelease,
  groupCommandersByPeriod, progressFromProfile, shouldAskAboutCommander, type CommanderRelease,
} from "../src/commander-periods";
import { COMMANDER_SHELF_LIFE } from "../src/commander";
import { BUNDLED_FACTS, factConfidence, indexFacts } from "../src/facts";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkCommanderPeriods } from "../scripts/build-data";
import { PLANNER_DATA_DIR, readCard, type RawCard } from "../scripts/research";
import { profile } from "./helpers";

const c = (id: string): CommanderRelease => {
  const x = getCommanderRelease(id);
  if (!x) throw new Error(`missing ${id}`);
  return x;
};

describe("commander-periods data", () => {
  it("cites only bundled fact cards and has unique kebab-case ids", () => {
    const ids = new Set(BUNDLED_FACTS.map((f) => f.id));
    const seen = new Set<string>();
    for (const x of COMMANDER_RELEASES) {
      expect(x.id).toMatch(/^[a-z0-9-]+$/);
      expect(seen.has(x.id), x.id).toBe(false);
      seen.add(x.id);
      expect(x.facts.length, x.id).toBeGreaterThan(0);
      for (const f of x.facts) expect(ids.has(f), `${x.id}: ${f}`).toBe(true);
    }
  });

  it("never claims more confidence than its best card, and conflicts are low", () => {
    const index = indexFacts();
    const rank = { pending: 0, low: 1, medium: 2, high: 3 } as const;
    for (const x of COMMANDER_RELEASES) {
      const best = Math.max(...x.facts.map((f) => rank[factConfidence(index.get(f))]));
      expect(rank[x.confidence], x.id).toBeLessThanOrEqual(best);
      if (x.conflict) expect(x.confidence, x.id).toBe("low");
    }
  });

  it("covers every commander of the shelf-life table", () => {
    for (const s of COMMANDER_SHELF_LIFE) expect(getCommanderRelease(s.id), s.id).toBeDefined();
  });

  it("follows the sourced cases (1.0.55, 1.0.94, 1.0.96, SoC-only Ragnar Prime)", () => {
    expect(c("yi-seong-gye")).toMatchObject({ period: "kvk1", offseasonUnlock: true, confidence: "high" });
    for (const id of ["saladin", "genghis-khan", "edward-of-woodstock", "tomyris"]) {
      expect(c(id)).toMatchObject({ period: "kvk2", offseasonUnlock: true, confidence: "high" });
    }
    for (const id of ["takeda", "cyrus", "cheok-jun-gyeong", "bertrand"]) {
      expect(c(id)).toMatchObject({ period: "kvk2", conflict: true, confidence: "low" });
    }
    expect(c("archimedes").period).toBe("kvk2");
    expect(c("ragnar-lodbrok-prime").period).toBe("soc");
    expect(c("sun-tzu").period).toBe("launch");
  });

  it("the build check accepts the file and rejects over-confident or conflicting rows", () => {
    const text = readFileSync(join(PLANNER_DATA_DIR, "commander-periods.json"), "utf8");
    const ids = new Set(COMMANDER_RELEASES.flatMap((x) => x.facts));
    const cards = new Map<string, RawCard>([...ids].map((id) => [id, readCard(id)]));
    expect(checkCommanderPeriods(text, cards)).toEqual([]);

    const doc = JSON.parse(text) as { commanders: Array<Record<string, unknown>> };
    doc.commanders = [
      { id: "x-only-rkg", period: "kvk3", confidence: "high", conflict: false, facts: ["A06-0700"], lastConfirmed: "2026-10-01" },
      { id: "x-conflict", period: "kvk2", confidence: "high", conflict: true, facts: ["C04-0021"], lastConfirmed: "2025-05-06" },
      { id: "x-period", period: "kvk9", confidence: "low", conflict: false, facts: ["A06-0700"], lastConfirmed: "2026" },
    ];
    const errors = checkCommanderPeriods(JSON.stringify(doc), cards);
    expect(errors.some((e) => e.includes("x-only-rkg") && e.includes("above its best card"))).toBe(true);
    expect(errors.some((e) => e.includes("x-conflict") && e.includes("must be low"))).toBe(true);
    expect(errors.some((e) => e.includes("x-period") && e.includes("unknown period"))).toBe(true);
    expect(errors.some((e) => e.includes("x-period") && e.includes("lastConfirmed"))).toBe(true);
  });
});

describe("commanderTiming", () => {
  it("pre-KvK: starting and Preparation Season commanders are current, later seasons are future", () => {
    const p = { stage: "pre_kvk" as const };
    expect(commanderTiming(c("sun-tzu"), p)).toBe("current");
    expect(commanderTiming(c("aethelflaed"), p)).toBe("current");
    expect(commanderTiming(c("yi-seong-gye"), p)).toBe("future");
    expect(commanderTiming(c("saladin"), p)).toBe("future");
    expect(commanderTiming(c("ragnar-lodbrok-prime"), p)).toBe("future");
  });

  it("an offseason unlock becomes current in the offseason before its season, others do not", () => {
    expect(commanderTiming(c("yi-seong-gye"), { stage: "pre_kvk", offseason: true })).toBe("current");
    expect(commanderTiming(c("saladin"), { stage: "kvk1", offseason: true })).toBe("current");
    expect(commanderTiming(c("takeda"), { stage: "kvk1", offseason: true })).toBe("future");
    // Only the very next season can open early.
    expect(commanderTiming(c("saladin"), { stage: "pre_kvk", offseason: true })).toBe("future");
  });

  it("later stages: earlier periods are past", () => {
    const kvk1 = { stage: "kvk1" as const };
    expect(commanderTiming(c("sun-tzu"), kvk1)).toBe("past");
    expect(commanderTiming(c("yi-seong-gye"), kvk1)).toBe("current");
    expect(commanderTiming(c("saladin"), kvk1)).toBe("future");
    const soc = { stage: "soc" as const };
    expect(commanderTiming(c("guan-yu"), soc)).toBe("past");
    expect(commanderTiming(c("ragnar-lodbrok-prime"), soc)).toBe("current");
  });

  it("fromDay gates a commander inside its stage when the kingdom day is known", () => {
    const gated: CommanderRelease = { ...c("richard-i"), fromDay: 38 };
    expect(commanderTiming(gated, { stage: "pre_kvk", kingdomDay: 20 })).toBe("future");
    expect(commanderTiming(gated, { stage: "pre_kvk", kingdomDay: 38 })).toBe("current");
    expect(commanderTiming(gated, { stage: "pre_kvk", kingdomDay: null })).toBe("current");
    expect(commanderTiming(gated, { stage: "kvk1", kingdomDay: 10 })).toBe("past");
  });

  it("rejects unknown stages", () => {
    expect(() => commanderTiming(c("sun-tzu"), { stage: "kvk9" as never })).toThrow(/Unknown kingdom stage/);
  });
});

describe("shouldAskAboutCommander / classify / group", () => {
  it("asks only in or after the period; unknown commanders are not hidden", () => {
    const p = progressFromProfile(profile({ kingdomStage: "pre_kvk", kingdomDay: 20 }));
    expect(p).toEqual({ stage: "pre_kvk", kingdomDay: 20, offseason: false });
    expect(shouldAskAboutCommander("sun-tzu", p)).toBe(true);
    expect(shouldAskAboutCommander("saladin", p)).toBe(false);
    expect(shouldAskAboutCommander("yi-seong-gye", progressFromProfile(profile(), true))).toBe(true);
    expect(commanderTimingById("not-a-commander", p)).toBe("unknown");
    expect(shouldAskAboutCommander("not-a-commander", p)).toBe(true);
  });

  it("classify partitions every commander, in game order", () => {
    const res = classifyCommanders({ stage: "kvk2" });
    expect(res.past.length + res.current.length + res.future.length).toBe(COMMANDER_RELEASES.length);
    expect(res.current.every((x) => x.period === "kvk2")).toBe(true);
    expect(res.future.every((x) => x.period === "kvk3" || x.period === "soc")).toBe(true);
    const order = ["launch", "pre_kvk", "kvk1"];
    const idx = res.past.map((x) => order.indexOf(x.period));
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
  });

  it("groups by period in game order and keeps every commander once", () => {
    const groups = groupCommandersByPeriod();
    expect(groups.map((g) => g.period.id)).toEqual(COMMANDER_PERIODS.map((p) => p.id));
    expect(groups.map((g) => g.period.id)).toEqual(["launch", "pre_kvk", "kvk1", "kvk2", "kvk3", "soc"]);
    expect(groups.reduce((n, g) => n + g.commanders.length, 0)).toBe(COMMANDER_RELEASES.length);
  });
});
