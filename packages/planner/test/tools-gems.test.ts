import { describe, expect, it } from "vitest";
import {
  gemsCollected, gemsPerMinute, gemsStillToCome, isPlainItemName, ladderPrice, ladderRows, ladderTotal,
  reserveGap, shopForVip, shopView, itemSpeedupMinutes,
} from "../src/tools";
import gems from "../tools-data/gems.json";

const AP = { start: gems.apStartPrice.value, step: gems.apStep.value, perPurchase: gems.apPerPurchase.value };

describe("AP bought with gems (A04-0008)", () => {
  it("price of the n-th purchase of the day: 100, 150, 200…", () => {
    expect(ladderPrice(1, AP)).toBe(100);
    expect(ladderPrice(2, AP)).toBe(150);
    expect(ladderPrice(5, AP)).toBe(300);
    expect(ladderPrice(0, AP)).toBe(100);
  });
  it("total of the first n purchases", () => {
    expect(ladderTotal(0, AP)).toBe(0);
    expect(ladderTotal(1, AP)).toBe(100);
    expect(ladderTotal(3, AP)).toBe(450);
    expect(ladderTotal(-2, AP)).toBe(0);
  });
  it("rows carry AP so far and gems per AP", () => {
    const rows = ladderRows(3, AP);
    expect(rows.map((r) => r.amount)).toEqual([500, 1000, 1500]);
    expect(rows[0]!.perUnit).toBeCloseTo(0.2);
    expect(rows[2]!.perUnit).toBeCloseTo(0.4);
    expect(rows[2]!.total).toBe(450);
    expect(() => ladderRows(1, { ...AP, perPurchase: 0 })).toThrow(RangeError);
  });
});

describe("VIP Shop rows (A04-0007)", () => {
  it("reads the duration from a speedup name only", () => {
    expect(itemSpeedupMinutes("Universal Speedup (5m)")).toBe(5);
    expect(itemSpeedupMinutes("Universal Speedup (60m)")).toBe(60);
    expect(itemSpeedupMinutes("Universal Speedup (8h)")).toBe(480);
    expect(itemSpeedupMinutes("Training Speedup (24h)")).toBe(1440);
    expect(itemSpeedupMinutes("Lv.5 Tome of Knowledge (10,000 xp)")).toBeNull();
    expect(itemSpeedupMinutes("24-Hour Enhanced Defense (Advanced)")).toBeNull();
    expect(itemSpeedupMinutes("Golden Key")).toBeNull();
  });
  it("derives gems per minute as price ÷ minutes (card: 240 ÷ 480 = 0.5)", () => {
    expect(gemsPerMinute(240, 480)).toBe(0.5);
    expect(() => gemsPerMinute(1, 0)).toThrow(RangeError);
    const v = shopView([{ item: "Universal Speedup (8h)", price: 240, vip: 7, qty: 20 }, { item: "Golden Key", price: 600, vip: 4, qty: 20 }]);
    expect(v[0]!.gemsPerMinute).toBe(0.5);
    expect(v[0]!.weeklyGems).toBe(4800);
    expect(v[1]!.gemsPerMinute).toBeNull();
  });
  it("filters by VIP level", () => {
    const rows = [{ vip: 3 }, { vip: 7 }, { vip: 15 }];
    expect(shopForVip(rows, 7)).toHaveLength(2);
    expect(shopForVip(rows, null)).toHaveLength(3);
    expect(shopForVip(rows, 0)).toHaveLength(0);
  });
  it("drops wiki markup rows", () => {
    expect(isPlainItemName("Golden Key")).toBe(true);
    expect(isPlainItemName("500,000 Food")).toBe(true);
    expect(isPlainItemName("<!-- I don't have a good image -->")).toBe(false);
    expect(isPlainItemName("| [[File:x.png]] [[Items/X|Y]]")).toBe(false);
    expect(isPlainItemName("[[File:Sovereign_Key2.png|31px]]")).toBe(false);
    expect(isPlainItemName(null)).toBe(false);
  });
});

describe("City Hall reward gems (A01-0002)", () => {
  const rows = [{ level: 16, gems: 100 }, { level: 21, gems: 200 }, { level: 25, gems: 500 }, { level: 2, gems: 0 }];
  it("splits collected and still to come at the current level", () => {
    expect(gemsStillToCome(15, rows)).toBe(800);
    expect(gemsStillToCome(16, rows)).toBe(700);
    expect(gemsCollected(16, rows)).toBe(100);
    expect(gemsStillToCome(25, rows)).toBe(0);
    expect(gemsCollected(25, rows)).toBe(800);
  });
});

describe("reserve gap (F-25)", () => {
  it("missing and percent", () => {
    expect(reserveGap(3000, 7000)).toEqual({ saved: 3000, target: 7000, missing: 4000, pct: 42 });
    expect(reserveGap(9000, 7000)).toMatchObject({ missing: 0, pct: 100 });
    expect(reserveGap(5, 0)).toMatchObject({ missing: 0, pct: 100 });
    expect(reserveGap(-5, Number.NaN)).toMatchObject({ saved: 0, target: 0 });
  });
});
