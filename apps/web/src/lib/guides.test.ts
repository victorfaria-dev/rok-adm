import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { defaultProfile, GUIDE_SETS, selectGuide, type AccountProfile, type GuideBlock } from "@rokadm/core";
import { BLOCK_SETS, buildGuidePayload } from "./guide-payload";
import { confidenceCounts, deltaUrl, fullGuide, selectGuide as selectPayload, withDeltas } from "./guide-view";
import { defaultGuideLinks, GUIDE_PAGES, guidesForYou, hasLowDelta, STATIC_GUIDES } from "./guides";
import { HUB_GROUPS, tagsFor } from "./guides-hub";
import { LEADER_NAV, PLAYER_NAV } from "./nav";

const make = (p: Partial<AccountProfile>): AccountProfile => ({ ...defaultProfile(), ...p });

describe("guide directory", () => {
  it("has one page per guide set (deltas included) plus farms, each with a summary and an audience", () => {
    const sets = GUIDE_PAGES.map((g) => g.set).sort();
    expect(sets).toEqual(GUIDE_SETS.map((s) => s.id).sort());
    for (const g of GUIDE_PAGES) {
      expect(g.summary.length, g.set).toBeGreaterThan(10);
      expect(g.audience.length, g.set).toBeGreaterThan(10);
      expect(g.href, g.set).toMatch(/^\/guides?\/(?:[a-z0-9-]+\/)*$/);
      expect(BLOCK_SETS[g.set], g.set).toBeDefined();
    }
  });

  it("builds static pages at the agreed slugs", () => {
    expect(STATIC_GUIDES.map((g) => g.slug).sort()).toEqual(["first-30-days", "kingdom-admin", "late-game", "low-spender", "recovery", "returning"]);
    for (const g of STATIC_GUIDES) expect(g.href).toBe(`/guides/${g.slug}/`);
  });

  it("guides are not a tab (they open from a row on Me); the hub is the one entry, not a single guide", () => {
    for (const nav of [PLAYER_NAV, LEADER_NAV]) {
      expect(nav.map((d) => d.href)).not.toContain("/guides/");
      expect(nav.map((d) => d.href)).not.toContain("/guides/new-kingdom/");
    }
    const me = readFileSync(join(__dirname, "../components/me/Me.tsx"), "utf8");
    expect(me).toMatch(/LinkRow href="\/guides\/"/);
  });
});

describe("guides hub (UX stage 1)", () => {
  const hrefs = HUB_GROUPS.flatMap((g) => g.items.map((i) => i.href));

  it("lists every guide page once, plus the safety FAQ, zeroed plan and what changed", () => {
    for (const g of GUIDE_PAGES) expect(hrefs.filter((h) => h === g.href), g.href).toHaveLength(1);
    for (const h of ["/tools/safety/", "/tools/zeroed/", "/changes/", "/commanders/"]) expect(hrefs).toContain(h);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("links the four farm resource guides under Farm accounts", () => {
    const farms = HUB_GROUPS.flatMap((g) => g.items).find((i) => i.href === "/guides/farms/");
    expect(farms?.links?.map((l) => l.href)).toEqual(["/guides/farms/food/", "/guides/farms/wood/", "/guides/farms/stone/", "/guides/farms/gold/"]);
  });

  it("filters by profile: the base guide always, admin for leaders, returning for returners", () => {
    const f2p = tagsFor(make({ spending: "f2p" }), "player");
    expect(f2p.has("always")).toBe(true);
    expect(f2p.has("kingdomadmin")).toBe(false);
    expect(tagsFor(make({}), "leader").has("kingdomadmin")).toBe(true);
    expect(tagsFor(make({ returningPlayer: true, cityHall: 20 }), "player").has("returning")).toBe(true);
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

  it("farm accounts get the farm guides; Medium+ never see 'Low spender guide' as a match (Q2 P2-8)", () => {
    const farm = guidesForYou(make({ role: "farm", spending: "f2p", cityHall: 20 }));
    expect(farm.find((l) => l.set === "farms")?.href).toBe("/guides/farms/");
    expect(farm.find((l) => l.set === "farms")?.included).toBeUndefined();
    for (const spending of ["medium", "high", "whale"] as const) {
      const links = guidesForYou(make({ spending, cityHall: 22, returningPlayer: false, role: "lutador", kingdomStage: "kvk1" }));
      const matches = links.filter((l) => !l.included);
      expect(matches.map((l) => l.set), spending).not.toContain("low");
      const low = links.find((l) => l.set === "low")!;
      expect(low.included, spending).toBe(true);
      expect(low.title, spending).not.toBe("Low spender guide");
    }
    expect(guidesForYou(make({ spending: "low" })).find((l) => l.set === "low")?.title).toBe("Low spender guide");
  });

  it("puts Returning first for a returning player, Recovery first when zeroed", () => {
    const back = make({ returningPlayer: true, cityHall: 20 });
    expect(guidesForYou(back)[0]?.set).toBe("returning");
    expect(guidesForYou(back).map((l) => l.set)).not.toContain("first30");
    expect(guidesForYou(back, { zeroed: true }).map((l) => l.set).slice(0, 2)).toEqual(["recovery", "returning"]);
  });

  it("puts Late game first for KvK2, KvK3 and SoC, and never offers it earlier", () => {
    for (const kingdomStage of ["kvk2", "kvk3", "soc"] as const) {
      const links = guidesForYou(make({ kingdomStage, cityHall: 25, role: "lider" }));
      expect(links[0]?.set, kingdomStage).toBe("latestage");
      expect(links[0]?.href).toBe("/guides/late-game/");
      expect(links[0]?.reason).toMatch(/main plan on this page/);
    }
    for (const kingdomStage of ["pre_kvk", "kvk1"] as const)
      expect(guidesForYou(make({ kingdomStage })).map((l) => l.set), kingdomStage).not.toContain("latestage");
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
