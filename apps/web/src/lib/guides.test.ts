import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { defaultProfile, GUIDE_SETS, selectGuide, type AccountProfile, type GuideBlock } from "@rokadm/core";
import { BLOCK_SETS, buildGuidePayload } from "./guide-payload";
import { confidenceCounts, deltaUrl, fullGuide, selectGuide as selectPayload, withDeltas } from "./guide-view";
import { defaultGuideLinks, GUIDE_PAGES, guidesForYou, hasLowDelta, STATIC_GUIDES } from "./guides";
import { SECONDARY } from "./nav";

const make = (p: Partial<AccountProfile>): AccountProfile => ({ ...defaultProfile(), ...p });

describe("guide directory", () => {
  it("has one page per guide set (deltas included) plus farms, each with a summary and an audience", () => {
    const sets = GUIDE_PAGES.map((g) => g.set).sort();
    expect(sets).toEqual([...GUIDE_SETS.map((s) => s.id), "farms"].sort());
    for (const g of GUIDE_PAGES) {
      expect(g.summary.length, g.set).toBeGreaterThan(10);
      expect(g.audience.length, g.set).toBeGreaterThan(10);
      expect(g.href, g.set).toMatch(/^\/guides?\/(?:[a-z0-9-]+\/)*$/);
      expect(BLOCK_SETS[g.set], g.set).toBeDefined();
    }
  });

  it("builds static pages at the agreed slugs", () => {
    expect(STATIC_GUIDES.map((g) => g.slug).sort()).toEqual(["first-30-days", "kingdom-admin", "low-spender", "recovery", "returning"]);
    for (const g of STATIC_GUIDES) expect(g.href).toBe(`/guides/${g.slug}/`);
  });

  it("links All guides from the secondary nav, not the new kingdom guide", () => {
    expect(SECONDARY[0]).toEqual({ href: "/guides/", label: "All guides" });
    expect(SECONDARY.map((s) => s.href)).not.toContain("/guides/new-kingdom/");
  });
});

describe("guides for you", () => {
  it("never lists the base guide or a delta as its own guide, except the Low page for Low+", () => {
    const f2p = guidesForYou(make({ spending: "f2p" }));
    expect(f2p.map((l) => l.set)).not.toContain("f2p");
    expect(f2p.map((l) => l.set)).not.toContain("low");
    for (const spending of ["low", "medium", "whale"] as const) {
      expect(hasLowDelta(make({ spending })), spending).toBe(true);
      expect(guidesForYou(make({ spending })).at(-1)?.set, spending).toBe("low");
    }
  });

  it("puts Returning first for a returning player, Recovery first when zeroed", () => {
    const back = make({ returningPlayer: true, cityHall: 20 });
    expect(guidesForYou(back)[0]?.set).toBe("returning");
    expect(guidesForYou(back).map((l) => l.set)).not.toContain("first30");
    expect(guidesForYou(back, { zeroed: true }).map((l) => l.set).slice(0, 2)).toEqual(["recovery", "returning"]);
  });

  it("offers First 30 days to a new player and Kingdom administration to leaders", () => {
    expect(guidesForYou(make({ returningPlayer: false, cityHall: 8 })).map((l) => l.set)).toContain("first30");
    const lead = guidesForYou(make({ role: "lider", cityHall: 22 }));
    expect(lead.map((l) => l.set)).toContain("kingdomadmin");
    expect(lead.find((l) => l.set === "kingdomadmin")?.href).toBe("/guides/kingdom-admin/");
  });

  it("without a profile, lists the situational guides with who they are for", () => {
    const links = defaultGuideLinks();
    expect(links.map((l) => l.set)).toEqual(["newkingdom", "first30", "returning", "recovery"]);
    for (const l of links) expect(l.reason.length).toBeGreaterThan(10);
  });
});

describe("profile deltas on the client", () => {
  const f2p = buildGuidePayload("f2p");
  const low = buildGuidePayload("low");

  it("merges like core's selectGuide: same ids replaced, new ids added, badges combined", () => {
    const merged = withDeltas(f2p, [low]);
    const lowIds = new Set(low.blocks.map((b) => b.id));
    const f2pIds = new Set(f2p.blocks.map((b) => b.id));
    expect(merged.blocks.length).toBe(new Set([...f2pIds, ...lowIds]).size);
    for (const b of merged.blocks) if (lowIds.has(b.id)) expect(b).toBe(low.blocks.find((l) => l.id === b.id));
    for (const id of Object.keys(low.badges)) expect(merged.badges[id]).toBeDefined();
    expect(withDeltas(f2p, [])).toBe(f2p);

    const profile = make({ spending: "low", cityHall: 10 });
    const core = selectGuide("f2p",{ f2p: BLOCK_SETS.f2p, low: BLOCK_SETS.low }, profile);
    const web = selectPayload(merged, profile);
    const ids = (g: { sections: { blocks: { block: GuideBlock }[] }[] }) => g.sections.flatMap((s) => s.blocks.map((b) => b.block.id));
    expect(ids(web)).toEqual(ids(core));
    expect(ids(web)).toContain("low-growth-fund");
  });

  it("ships each delta as its own lean payload", () => {
    expect(deltaUrl("low")).toBe("/data/guide-low.json");
    const text = JSON.stringify(low);
    expect(gzipSync(text).length).toBeLessThanOrEqual(15 * 1024);
    for (const marker of ["invalidatedBy", "accessedAt"]) expect(text).not.toContain(marker);
  });

  it("does not grow the F2P payload with other guides", () => {
    expect(f2p.blocks.every((b) => !b.id.startsWith("low-"))).toBe(true);
  });
});

describe("static guide pages", () => {
  it("render every block with the guide's own chapter titles", () => {
    for (const g of STATIC_GUIDES) {
      const view = fullGuide(buildGuidePayload(g.set), GUIDE_SETS.find((s) => s.id === g.set)?.sectionTitles);
      expect(view.meta.shownBlocks, g.set).toBe(BLOCK_SETS[g.set]!.length);
    }
    const ret = fullGuide(buildGuidePayload("returning"), GUIDE_SETS.find((s) => s.id === "returning")!.sectionTitles);
    expect(ret.sections[0]!.title).toBe("1. What changed while you were away");
  });

  it("counts blocks by confidence, high to pending, without empty levels", () => {
    expect(confidenceCounts([{ confidence: "pending" }, { confidence: "high" }, { confidence: "pending" }])).toEqual([
      { level: "high", count: 1 },
      { level: "pending", count: 2 },
    ]);
  });

  it("guides files on disk match the registry", () => {
    for (const s of GUIDE_SETS) {
      const raw = JSON.parse(readFileSync(join(__dirname, "../../../../guides/data", s.file), "utf8")) as GuideBlock[];
      expect(BLOCK_SETS[s.id]!.length, s.id).toBe(raw.length);
    }
  });
});
