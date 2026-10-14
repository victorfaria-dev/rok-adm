import { describe, expect, it } from "vitest";
import type { SpendingProfile } from "@rokadm/core";
import { SPENDING_PROFILES } from "@rokadm/core";
import {
  VIP_LEVELS, vipPointsAfter, dayToReach, defaultVipIncome, vipLevelForPoints, realityCheck, checkpointAt,
} from "../src/budget";
import { BUNDLED_FACTS } from "../src/facts";
import { readCard, readFactsCsv } from "../scripts/research";
import { buildData, serialize } from "../scripts/build-data";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PLANNER_DATA_DIR } from "../scripts/research";
import { profile } from "./helpers";

describe("data is in sync with research/facts", () => {
  it("build-data reports no errors (facts, gaps, evidence substrings)", () => {
    expect(buildData().errors).toEqual([]);
  });

  it("generated JSON matches research/ (run `pnpm --filter @rokadm/planner build:data` if this fails)", () => {
    const res = buildData();
    const facts = JSON.parse(readFileSync(join(PLANNER_DATA_DIR, "facts-meta.json"), "utf8"));
    const vip = JSON.parse(readFileSync(join(PLANNER_DATA_DIR, "vip-levels.json"), "utf8"));
    expect(facts.facts).toEqual(JSON.parse(serialize(res.factsMeta)));
    expect(vip.levels).toEqual(JSON.parse(serialize(res.vipLevels)));
  });

  it("VIP thresholds equal research/facts/A05/data/vip-levels.csv", () => {
    const csv = readFactsCsv("A05/data/vip-levels.csv");
    expect(VIP_LEVELS.map((l) => [l.vip, l.threshold])).toEqual(csv.map((r) => [Number(r["vip_level"]), Number(r["vip_points_threshold"])]));
    expect(VIP_LEVELS.find((l) => l.vip === 6)?.threshold).toBe(11500);
    expect(VIP_LEVELS.find((l) => l.vip === 10)?.threshold).toBe(150000);
  });
});

describe("VIP math (A05-0003, A05-0001, A05-0007)", () => {
  const chest = defaultVipIncome(false);
  const gems = defaultVipIncome(true);

  it("streak ramp: 40, 60 … 200; first 9 days = 1,080 (A05-0003)", () => {
    expect(vipPointsAfter(1, chest)).toBe(40);
    expect(vipPointsAfter(2, chest)).toBe(100);
    expect(vipPointsAfter(9, chest)).toBe(1080);
    expect(vipPointsAfter(10, chest)).toBe(1280);
    expect(vipPointsAfter(9, gems)).toBe(1980);
  });

  it("days to VIP 5/6/7/8/10 match the derived values published in A05-0007", () => {
    const card = readCard("A05-0007").text;
    const parse = (label: string) => {
      const line = card.split("\n").find((l) => l.includes(label));
      const m = line && /valor: ([\d /]+),/.exec(line);
      return m ? m[1]!.split("/").map((x) => Number(x.trim())) : [];
    };
    const chestOnly = parse("daily-chest only: VIP5 / VIP6 / VIP7 / VIP8 / VIP10");
    const withGems = parse("chest + 100 gems/day: VIP5 / VIP6 / VIP7 / VIP8 / VIP10");
    expect(chestOnly).toEqual([34, 62, 92, 179, 754]);
    expect(withGems).toEqual([23, 41, 61, 120, 503]);
    const t = (v: number) => VIP_LEVELS.find((l) => l.vip === v)!.threshold;
    expect([5, 6, 7, 8, 10].map((v) => dayToReach(t(v), chest))).toEqual(chestOnly);
    expect([5, 6, 7, 8, 10].map((v) => dayToReach(t(v), gems))).toEqual(withGems);
  });

  it("level lookup and horizon", () => {
    expect(vipLevelForPoints(0)).toBe(0);
    expect(vipLevelForPoints(11500)).toBe(6);
    expect(vipLevelForPoints(11499)).toBe(5);
    expect(dayToReach(4_000_000, chest, 100)).toBeNull();
    expect(checkpointAt(41).vipLevel.withGems).toBe(6);
    expect(checkpointAt(41).guaranteedGemsCumulative).toBe(4100);
  });
});

describe("realityCheck", () => {
  const f2p = realityCheck(profile({ kingdomDay: 41, cityHall: 16 }));

  it("guaranteed gems/day = 100, sourced A04-0001, medium confidence", () => {
    expect(f2p.researched).toBe(true);
    expect(f2p.guaranteedGemsPerDay?.value).toBe(100);
    expect(f2p.guaranteedGemsPerDay?.facts).toEqual(["A04-0001"]);
    expect(f2p.guaranteedGemsPerDay?.confidence).toBe("medium");
  });

  it("VIP timeline is low confidence (derived, A05-0007 baixa) and flags pending T0", () => {
    expect(f2p.vipTimeline.map((s) => s.id)).toEqual(["chest_only", "chest_plus_daily_gems"]);
    for (const s of f2p.vipTimeline) {
      expect(s.confidence).toBe("low");
      expect(s.pendingGaps).toContain("L-A05-01");
      expect(s.facts).toContain("A05-0001");
    }
    const gems = f2p.vipTimeline[1]!;
    expect(gems.split).toBe(true);
    expect(gems.milestones.find((m) => m.vip === 6)?.day).toBe(41);
    expect(f2p.atKingdomDay?.vipLevel).toEqual({ chestOnly: 5, withGems: 6 });
  });

  it("KvK1 targets come from B01-0700 / B01-0500", () => {
    expect(f2p.kvk1?.cityHall.value).toEqual({ workableMin: 21, notExpected: 25 });
    expect(f2p.kvk1?.cityHall.facts).toEqual(["B01-0700"]);
    expect(f2p.kvk1?.cityHall.confidence).toBe("low");
    expect(f2p.kvk1?.startDay.value).toBe(100);
    expect(f2p.kvk1?.daysUntilStart).toBe(59);
    expect(f2p.checkpoints.map((c) => c.day)).toEqual([7, 14, 30, 41, 60, 90, 100]);
  });

  it("one-time gems: CH reached flags; single-source Facebook bind capped at low", () => {
    const by = Object.fromEntries(f2p.oneTimeGems.map((g) => [g.id, g]));
    expect(by["ch16"]?.reached).toBe(true);
    expect(by["ch21"]?.reached).toBe(false);
    expect(by["facebook-bind"]?.confidence).toBe("low");
  });

  it("exposes assumptions, and every cited fact exists in the bundled index", () => {
    expect(f2p.assumptions.length).toBeGreaterThanOrEqual(5);
    expect(f2p.warnings).toEqual([]);
    const ids = new Set(BUNDLED_FACTS.map((f) => f.id));
    const cited = [
      ...f2p.assumptions.flatMap((a) => a.facts),
      ...f2p.vipTimeline.flatMap((s) => s.facts),
      ...f2p.oneTimeGems.flatMap((g) => g.facts),
    ];
    for (const id of cited) expect(ids.has(id)).toBe(true);
  });

  it("unresearched profiles return placeholders, never numbers", () => {
    for (const p of SPENDING_PROFILES.filter((x): x is SpendingProfile => x !== "f2p")) {
      const r = realityCheck(profile({ spending: p }));
      expect(r.researched).toBe(false);
      expect(r.status).toBe("not_researched_yet");
      expect(r.message).toMatch(/ainda não foram pesquisadas/);
      expect(r.guaranteedGemsPerDay).toBeNull();
      expect(r.kvk1).toBeNull();
      expect(r.vipTimeline).toEqual([]);
      expect(r.placeholders.length).toBeGreaterThan(0);
    }
  });

  it("uses the provided fact index; missing facts become pending with a warning", () => {
    const r = realityCheck(profile(), []);
    expect(r.guaranteedGemsPerDay?.confidence).toBe("pending");
    expect(r.warnings.length).toBe(1);
    const upgraded = BUNDLED_FACTS.map((f) => (f.id === "A04-0001" ? { ...f, confidence: "alta" as const } : f));
    expect(realityCheck(profile(), upgraded).guaranteedGemsPerDay?.confidence).toBe("high");
  });
});
