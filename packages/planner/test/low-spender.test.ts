import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LOW_SPENDER_DATA, lowPurchases, lowTier, lowVipTimeline, lowSpenderTargets, timesPerMonth, MONTH_DAYS, VALUE_METHOD_FACT,
} from "../src/low-spender";
import { realityCheck, vipTimeline } from "../src/budget";
import { BUNDLED_FACTS, indexFacts } from "../src/facts";
import { readCard, PLANNER_DATA_DIR } from "../scripts/research";
import { buildData } from "../scripts/build-data";
import { profile } from "./helpers";

const index = indexFacts();
const byId = Object.fromEntries(lowPurchases(index).map((p) => [p.id, p]));

describe("low-spender.json is tied to the cards", () => {
  it("build-data checks its evidence substrings (no errors)", () => {
    expect(buildData().errors).toEqual([]);
    const raw = readFileSync(join(PLANNER_DATA_DIR, "low-spender.json"), "utf8");
    expect(raw).toMatch(/"evidence"/);
  });

  it("every cited fact is in the bundled index and verified", () => {
    const ids = new Set(BUNDLED_FACTS.map((f) => f.id));
    const cited = [
      ...LOW_SPENDER_DATA.purchases.flatMap((p) => [...p.facts, ...p.priceFacts, ...p.gemFacts]),
      ...LOW_SPENDER_DATA.tiers.flatMap((t) => t.facts),
      ...LOW_SPENDER_DATA.recharge.facts,
      ...LOW_SPENDER_DATA.valueMethod.facts,
    ];
    for (const id of cited) {
      expect(ids.has(id), id).toBe(true);
      expect(BUNDLED_FACTS.find((f) => f.id === id)!.status, id).toBe("verificado");
    }
  });

  it("VIP 0–6 privileges total is the sum of the per-level prices in A05-0600", () => {
    expect(readCard("A05-0600").text).toContain("$0.99 at VIP 0-3, $4.99 at VIP 4-5, $9.99 at VIP 6");
    expect(byId["vip-privileges-0-6"]!.price.value).toBeCloseTo(4 * 0.99 + 2 * 4.99 + 9.99, 2);
    expect(byId["vip-privileges-0-6"]!.price.derived).toBe(true);
  });

  it("purchase ids are unique and every tier references known purchases", () => {
    const ids = LOW_SPENDER_DATA.purchases.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of LOW_SPENDER_DATA.tiers) for (const pid of t.purchaseIds) expect(ids).toContain(pid);
  });
});

describe("per-dollar ratios follow the A12-0618 method", () => {
  it("match the derived values written in the method card", () => {
    const card = readCard(VALUE_METHOD_FACT).text;
    expect(byId["growth-fund"]!.gemsPerUsd!.value).toBe(5400);
    expect(card).toContain("81,000 / 15 = 5,400 gems/$");
    expect(byId["gem-supply-30d"]!.gemsPerUsd!.value).toBe(1952);
    expect(card).toContain("19,500 / 9.99 = 1,952 gems/$");
    expect(byId["lucerne-scrolls-paid"]!.gemsPerUsd!.value).toBe(660);
    expect(byId["lucerne-scrolls-paid"]!.vipPerUsd!.value).toBe(1100);
    expect(card).toContain("Lucerne $5 tier 660 gems/$ and 1,100 VIP/$");
    expect(byId["super-value-5"]!.gemsPerUsd!.value).toBe(210);
    expect(byId["super-value-5"]!.vipPerUsd!.value).toBe(105);
    expect(card).toContain("210 gems/$ and 105 VIP/$ at $5");
  });

  it("ratios are derived, cite the method card, and are never stronger than their inputs", () => {
    for (const p of lowPurchases(index)) {
      for (const r of [p.gemsPerUsd, p.vipPerUsd]) {
        if (!r) continue;
        expect(r.derived).toBe(true);
        expect(r.facts).toContain(VALUE_METHOD_FACT);
        expect(r.confidence).toBe("low"); // A12-0618 is baixa
      }
    }
    expect(byId["vip-privileges-0-6"]!.gemsPerUsd).toBeNull();
  });

  it("price rows carry the regional price warning and their gaps", () => {
    for (const p of lowPurchases(index)) {
      expect(p.price.note).toMatch(/região/);
      expect(p.price.unit).toBe("USD");
    }
    expect(byId["gem-supply-30d"]!.price.pendingGaps).toContain("L-A12-01");
  });
});

describe("tiers", () => {
  it("timesPerMonth: one-time 0, recurring by period, others only by assumption", () => {
    expect(timesPerMonth({ id: "x", kind: "one-time", periodDays: null })).toBe(0);
    expect(timesPerMonth({ id: "x", kind: "recurring", periodDays: 30 })).toBe(1);
    expect(timesPerMonth({ id: "x", kind: "recurring", periodDays: 7 })).toBeCloseTo(MONTH_DAYS / 7);
    expect(timesPerMonth({ id: "x", kind: "per-trigger", periodDays: null })).toBe(0);
    expect(timesPerMonth({ id: "x", kind: "per-trigger", periodDays: null }, { x: 1 })).toBe(1);
  });

  it("pass-only: 30-day supply + one Lucerne a month, Growth Fund once", () => {
    const t = lowTier("pass-only", index);
    expect(t.monthlyUsd.value).toBe(14.99);
    expect(t.monthlyGems.value).toBe(19500 + 3300);
    expect(t.monthlyVipPoints.value).toBe(5500);
    expect(t.oneTimeUsd.value).toBe(15);
    expect(t.oneTimeGems.value).toBe(81000);
    expect(t.withinLowRange).toBe(true);
    expect(t.monthlyUsd.derived).toBe(true);
    expect(t.monthlyUsd.confidence).toBe("low");
    expect(t.lines.find((l) => l.purchase.id === "lucerne-scrolls-paid")!.assumed).toBe(true);
    expect(t.pendingGaps).toContain("L-A12-07");
  });

  it("low-full adds weekly packs and pop-ups and stays inside $5–100", () => {
    const t = lowTier("low-full", index);
    const expected = 9.99 + 5 + 5 + 5 * (30 / 7) + 5 * (30 / 7);
    expect(t.monthlyUsd.value).toBeCloseTo(expected, 2);
    expect(t.oneTimeUsd.value).toBeCloseTo(15 + 23.93, 2);
    expect(t.monthlyGems.value).toBeCloseTo(19500 + 3300 + 1050 + 1000 * (30 / 7) + 1050 * (30 / 7), 1);
    expect(t.withinLowRange).toBe(true);
    expect(t.monthlyUsd.value).toBeGreaterThan(lowTier("pass-only", index).monthlyUsd.value);
  });

  it("Daily Special Offers are a listed ceiling, not part of a tier", () => {
    for (const t of LOW_SPENDER_DATA.tiers) expect(t.purchaseIds).not.toContain("daily-special-offers");
    expect(byId["daily-special-offers"]!.price.value).toBe(90);
  });

  it("unknown tier throws", () => {
    expect(() => lowTier("whale" as never, index)).toThrow();
  });
});

describe("VIP timeline with the 30-day supply", () => {
  it("adds 650 gems/day to the F2P 'with gems' scenario and reaches each VIP level no later", () => {
    const low = lowVipTimeline(index);
    expect(low.income.extraPerDay).toBe(100 + 650);
    const f2p = vipTimeline(index)[1]!;
    for (const m of low.milestones) {
      const f = f2p.milestones.find((x) => x.vip === m.vip)!;
      if (f.day !== null) expect(m.day!).toBeLessThanOrEqual(f.day);
    }
    expect(low.milestones.find((m) => m.vip === 6)!.day!).toBeLessThan(f2p.milestones.find((m) => m.vip === 6)!.day!);
    expect(low.confidence).toBe("low");
    expect(low.facts).toContain("A12-0601");
  });
});

describe("lowSpenderTargets", () => {
  it("bundles tiers, purchases, Growth Fund status, recharge timing and the method", () => {
    const r = lowSpenderTargets(profile({ spending: "low", cityHall: 25 }));
    expect(r.tiers.map((t) => t.id)).toEqual(["pass-only", "low-full"]);
    expect(r.purchases.length).toBe(LOW_SPENDER_DATA.purchases.length);
    expect(r.growthFund.ch25Gems.value).toBe(40000);
    expect(r.growthFund.ch25Gems.confidence).toBe("low");
    expect(r.growthFund.reachedCH25).toBe(true);
    expect(lowSpenderTargets(profile({ spending: "low", cityHall: 20 })).growthFund.reachedCH25).toBe(false);
    expect(r.recharge.facts).toContain("A11-0601");
    expect(r.valueMethod.facts).toContain(VALUE_METHOD_FACT);
    expect(r.confidence).toBe("low");
    expect(r.priceWarning).toMatch(/região/);
  });

  it("missing facts become pending; realityCheck for low is unchanged (F2P baseline stays unresearched)", () => {
    expect(lowSpenderTargets(profile({ spending: "low" }), []).confidence).toBe("pending");
    expect(realityCheck(profile({ spending: "low" })).researched).toBe(false);
  });
});
