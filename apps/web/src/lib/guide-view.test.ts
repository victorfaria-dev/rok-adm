import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultProfile, encodeProfile, flattenGuide, GUIDE_SECTIONS, selectBlocks, type AccountProfile, type GuideBlock } from "@rokadm/core";
import { buildBudgetPayload, buildGuidePayload, buildLowBudgetPayload } from "./guide-payload";
import { budgetView, chooseProfile, FALLBACK_STAGE, lowBudgetView, selectGuide, selectGuideWithFallback, shareUrl, showsLowTargets, stageHasContent, withDeltas } from "./guide-view";

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
      expect(c.error, bad).toMatch(/não é válido/);
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

describe("stage-aware guide (KvK2, KvK3, SoC)", () => {
  const late = buildGuidePayload("latestage");
  const low = buildGuidePayload("low");
  const ids = (v: { sections: { blocks: { block: { id: string } }[] }[] }) => v.sections.flatMap((s) => s.blocks.map((b) => b.block.id));

  for (const stage of ["kvk2", "kvk3", "soc"] as const) {
    it(`${stage}: the late-game plan is the main content, the daily routine stays, KvK1 only where no late step exists`, () => {
      const p = make({ spending: "f2p", kingdomStage: stage, cityHall: 25, minutesPerDay: 120 });
      expect(stageHasContent(payload, stage)).toBe(false);
      expect(stageHasContent(late, stage)).toBe(true);
      const sel = selectGuideWithFallback(payload, p, late);
      expect(sel.lateStage).toBe(true);
      const shown = ids(sel.view);
      // Late-game blocks fitting the stage are all in; none of the KvK1 phase plan or day 0-3 setup is.
      for (const b of selectBlocks(late.blocks, p).sections.flatMap((s) => s.blocks)) expect(shown).toContain(b.block.id);
      expect(shown.some((id) => id.startsWith("ls-"))).toBe(true);
      const plan = sel.view.sections.find((s) => s.id === "plan")!;
      expect(plan.fallback).toBeUndefined();
      expect(plan.blocks.every((b) => b.block.id.startsWith("ls-"))).toBe(true);
      expect(sel.view.sections.find((s) => s.id === "day0")).toBeUndefined();
      // Daily routine kept, never labelled as a fallback.
      const daily = sel.view.sections.find((s) => s.id === "daily")!;
      expect(daily.blocks.map((b) => b.block.id)).toContain("daily-15min");
      expect(daily.fallback).toBeUndefined();
      // Fallback only for sections without a late-stage step, labelled per section.
      expect(sel.fallbackSections.length).toBeGreaterThan(0);
      expect(sel.fallbackFrom).toBe(stage);
      for (const s of sel.view.sections) {
        const isFallback = sel.fallbackSections.includes(s.id);
        expect(s.fallback === true, s.id).toBe(isFallback);
        if (isFallback) expect(s.blocks.every((b) => !b.block.id.startsWith("ls-")), s.id).toBe(true);
        else expect(s.blocks.every((b) => b.block.stage.includes(stage) || b.block.stage.includes("todos")), s.id).toBe(true);
      }
      for (const id of ["plan", "day0", "overview", "daily", "open"] as const) expect(sel.fallbackSections, id).not.toContain(id);
      expect(sel.fallbackSections).toContain("mistakes");
      // Sections in GUIDE_SECTIONS order; counts add up.
      const order = GUIDE_SECTIONS.map((s) => s.id);
      const secIds = sel.view.sections.map((s) => s.id);
      expect([...secIds].sort((x, y) => order.indexOf(x) - order.indexOf(y))).toEqual(secIds);
      expect(sel.view.meta.shownBlocks).toBe(shown.length);
      expect(sel.view.meta.totalBlocks).toBe(payload.blocks.length + late.blocks.length);
    });
  }

  it("uses the late-game chapter titles for the late sections", () => {
    const sel = selectGuideWithFallback(payload, make({ kingdomStage: "kvk2", cityHall: 25 }), late);
    expect(sel.view.sections.find((s) => s.id === "plan")!.title).toMatch(/Late-game plan/);
  });

  it("Low at KvK3 gets the Low-only late block; F2P does not", () => {
    const lowP = make({ spending: "low", kingdomStage: "kvk3", cityHall: 25 });
    const merged = withDeltas(payload, [low]);
    expect(ids(selectGuideWithFallback(merged, lowP, late).view)).toContain("ls-low-spender-late");
    expect(ids(selectGuideWithFallback(payload, { ...lowP, spending: "f2p" }, late).view)).not.toContain("ls-low-spender-late");
  });

  it("without the late-game payload (failed to load), the whole guide falls back to KvK1, labelled", () => {
    const p = make({ spending: "f2p", kingdomStage: "soc", cityHall: 12 });
    const sel = selectGuideWithFallback(payload, p, null);
    expect(sel.lateStage).toBe(false);
    expect(sel.fallbackFrom).toBe("soc");
    expect(FALLBACK_STAGE).toBe("kvk1");
    const kvk1 = selectGuide(payload, { ...p, kingdomStage: "kvk1" });
    expect(sel.view.meta.shownBlocks).toBe(kvk1.meta.shownBlocks);
    expect(sel.fallbackSections).toEqual(kvk1.sections.map((s) => s.id));
  });

  it("pre-KvK and KvK1 never fall back and never use the late guide", () => {
    for (const stage of ["pre_kvk", "kvk1"] as const) {
      const sel = selectGuideWithFallback(payload, make({ kingdomStage: stage }), late);
      expect(sel.fallbackFrom).toBeNull();
      expect(sel.lateStage).toBe(false);
      expect(ids(sel.view).some((id) => id.startsWith("ls-"))).toBe(false);
    }
  });
});

describe("Low spender targets view (wave J)", () => {
  const low = buildLowBudgetPayload();

  it("is shown to the Low profile only (F2P numbers never shown as Low's, Low numbers never shown to others)", () => {
    expect(showsLowTargets(LOW_D20_CH12)).toBe(true);
    for (const spending of ["f2p", "medium", "high", "whale", "kraken"] as const) expect(showsLowTargets(make({ spending })), spending).toBe(false);
  });

  it("resolves each tier's purchases and the purchases outside the tiers", () => {
    const v = lowBudgetView(low, LOW_D20_CH12);
    expect(v.tiers.map((t) => t.id)).toEqual(["pass-only", "low-full"]);
    for (const t of v.tiers) for (const l of t.lines) expect(l.purchase.id).toBe(low.purchases.find((p) => p.id === l.purchase.id)!.id);
    expect(v.tiers[0]!.lines.map((l) => l.purchase.id)).toContain("gem-supply-30d");
    expect(v.outside.map((p) => p.id)).toContain("daily-special-offers");
  });

  it("marks the Growth Fund City Hall 25 milestone from the player's City Hall", () => {
    expect(lowBudgetView(low, make({ spending: "low", cityHall: 24 })).reachedCH25).toBe(false);
    expect(lowBudgetView(low, make({ spending: "low", cityHall: 25 })).reachedCH25).toBe(true);
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
