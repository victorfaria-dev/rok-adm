import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultProfile, encodeProfile, flattenGuide, GUIDE_SECTIONS, selectBlocks, type AccountProfile, type GuideBlock } from "@rokadm/core";
import { buildBudgetPayload, buildGuidePayload } from "./guide-payload";
import { budgetView, chooseProfile, FALLBACK_STAGE, selectGuide, selectGuideWithFallback, shareUrl, stageHasContent } from "./guide-view";

const raw = JSON.parse(readFileSync(join(__dirname, "../../../../guides/data/blocks.f2p.json"), "utf8")) as GuideBlock[];
const payload = buildGuidePayload("f2p");

const make = (p: Partial<AccountProfile>): AccountProfile => ({ ...defaultProfile(), ...p });
const F2P_D0_CH1 = make({ spending: "f2p", kingdomDay: 0, cityHall: 1 });
const LOW_D20_CH12 = make({ spending: "low", kingdomDay: 20, cityHall: 12 });
const WHALE_CH25 = make({ spending: "whale", cityHall: 25 });

describe("profile precedence", () => {
  const saved = encodeProfile(LOW_D20_CH12);
  const url = encodeProfile(WHALE_CH25);

  it("?p= wins over the saved profile and offers to save it", () => {
    const c = chooseProfile(`?p=${url}`, saved);
    expect(c.source).toBe("url");
    expect(c.profile.spending).toBe("whale");
    expect(c.code).toBe(url);
    expect(c.canSave).toBe(true);
    expect(c.error).toBeNull();
  });

  it("?p= equal to the saved profile is 'Your profile' with no save button", () => {
    const c = chooseProfile(`?p=${saved}`, saved);
    expect(c.canSave).toBe(false);
    expect(c.source).toBe("saved");
    expect(c.code).toBe(saved);
  });

  it("uses the saved profile without ?p=", () => {
    const c = chooseProfile("", saved);
    expect(c.source).toBe("saved");
    expect(c.profile.spending).toBe("low");
    expect(c.canSave).toBe(false);
  });

  it("default guide with neither", () => {
    const c = chooseProfile("", null);
    expect(c.source).toBe("default");
    expect(c.profile).toEqual(defaultProfile());
    expect(c.error).toBeNull();
  });

  it("invalid ?p= shows an error and falls back to the default guide (not the saved one)", () => {
    for (const bad of ["garbage", "", "1.9.0.0.12.60....0", "2.0.0.0.1.60....0"]) {
      const c = chooseProfile(`?p=${bad}`, saved);
      expect(c.source, bad).toBe("default");
      expect(c.error, bad).toMatch(/not valid/);
      expect(c.profile).toEqual(defaultProfile());
      expect(c.canSave).toBe(false);
    }
  });

  it("a corrupted saved code is ignored", () => {
    expect(chooseProfile("", "nope").source).toBe("default");
  });

  it("share link carries only the profile code", () => {
    expect(shareUrl("https://x.test", url)).toBe(`https://x.test/guide/?p=${url}`);
    expect(shareUrl("https://x.test", null)).toBe("https://x.test/guide/");
  });
});

describe("block counts match selectBlocks", () => {
  for (const [name, p] of [["F2P/day 0/CH 1", F2P_D0_CH1], ["Low/day 20/CH 12", LOW_D20_CH12], ["Whale/CH 25", WHALE_CH25]] as const) {
    it(name, () => {
      const expected = selectBlocks(raw, p);
      const view = selectGuide(payload, p);
      expect(flattenGuide(view).map((s) => s.block.id)).toEqual(flattenGuide(expected).map((s) => s.block.id));
      expect(view.alreadyDone.map((s) => s.block.id)).toEqual(expected.alreadyDone.map((s) => s.block.id));
      expect(view.meta.shownBlocks).toBe(expected.meta.shownBlocks);
      // Sections come in GUIDE_SECTIONS order.
      const order = GUIDE_SECTIONS.map((s) => s.id);
      const ids = view.sections.map((s) => s.id);
      expect([...ids].sort((a, b) => order.indexOf(a) - order.indexOf(b))).toEqual(ids);
    });
  }

  it("Low gets the low spender notes as HTML, F2P does not", () => {
    const low = flattenGuide(selectGuide(payload, LOW_D20_CH12)).filter((s) => s.lowSpenderNote);
    expect(low.length).toBeGreaterThan(0);
    expect(low[0]!.lowSpenderNote).toMatch(/^<p>/);
    expect(flattenGuide(selectGuide(payload, F2P_D0_CH1)).some((s) => s.lowSpenderNote)).toBe(false);
  });
});

describe("stage fallback (KvK2+ not researched yet)", () => {
  for (const stage of ["kvk2", "kvk3", "soc"] as const) {
    it(`${stage} falls back to the KvK1 selection, labelled`, () => {
      const p = make({ spending: "f2p", kingdomStage: stage, cityHall: 12 });
      // Core stays strict: only the every-stage blocks (daily tiers) apply at this stage.
      const strict = flattenGuide(selectGuide(payload, p));
      expect(strict.every((s) => s.block.stage.includes("todos"))).toBe(true);
      expect(stageHasContent(payload, stage)).toBe(false);
      const sel = selectGuideWithFallback(payload, p);
      expect(sel.fallbackFrom).toBe(stage);
      expect(FALLBACK_STAGE).toBe("kvk1");
      const kvk1 = selectGuide(payload, { ...p, kingdomStage: "kvk1" });
      expect(kvk1.meta.shownBlocks).toBeGreaterThan(strict.length);
      expect(sel.view.meta.shownBlocks).toBe(kvk1.meta.shownBlocks);
      expect(sel.view.meta.shownBlocks).toBeGreaterThan(0);
    });
  }

  it("pre-KvK and KvK1 never fall back", () => {
    for (const stage of ["pre_kvk", "kvk1"] as const) {
      expect(selectGuideWithFallback(payload, make({ kingdomStage: stage })).fallbackFrom).toBeNull();
    }
  });
});

describe("budget view", () => {
  const b = buildBudgetPayload();

  it("F2P is researched; Low gets 'what buying doesn't change'", () => {
    expect(budgetView(b, F2P_D0_CH1).researched).toBe(true);
    expect(budgetView(b, F2P_D0_CH1).showUnchanged).toBe(false);
    const low = budgetView(b, LOW_D20_CH12);
    expect(low.researched).toBe(false);
    expect(low.showUnchanged).toBe(true);
  });

  it("marks the player's day and the days left to KvK1", () => {
    const v = budgetView(b, LOW_D20_CH12);
    expect(v.here?.day).toBe(20);
    expect(v.rows.map((r) => r.day)).toContain(20);
    expect(v.daysToKvK1).toBe(b.kvk1Day.value - 20);
    expect(budgetView(b, make({ kingdomDay: 500 })).pastKvK1).toBe(true);
  });

  it("one-time gems follow City Hall", () => {
    const at = (ch: number) => budgetView(b, make({ cityHall: ch })).oneTime.find((g) => g.unlockCityHall === 16)?.reached;
    expect(at(15)).toBe(false);
    expect(at(25)).toBe(true);
  });
});
