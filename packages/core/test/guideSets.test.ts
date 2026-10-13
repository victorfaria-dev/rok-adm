import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  GUIDE_SETS,
  blocksForGuide,
  defaultProfile,
  deltaSetsFor,
  flattenGuide,
  guidesForProfile,
  selectBlocks,
  selectGuide,
  type AccountProfile,
  type GuideBlock,
  type GuideSetId,
  type LoadedGuideSets,
} from "../src/index";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const DATA = resolve(ROOT, "guides/data");
const load = (file: string): GuideBlock[] => JSON.parse(readFileSync(resolve(DATA, file), "utf8"));
const LOADED: LoadedGuideSets = Object.fromEntries(GUIDE_SETS.map((s) => [s.id, load(s.file)]));

const profile = (over: Partial<AccountProfile> = {}): AccountProfile => ({
  ...defaultProfile(),
  minutesPerDay: 120,
  ...over,
});
const offered = (p: AccountProfile, z = false) => guidesForProfile(p, { zeroed: z }).map((g) => g.set.id);
const shownIds = (id: GuideSetId, p: AccountProfile) => flattenGuide(selectGuide(id, LOADED, p)).map((s) => s.block.id);

describe("guide set registry", () => {
  it("every blocks.*.json file in guides/data is registered, and every registered file exists", () => {
    const files = readdirSync(DATA).filter((f) => /^blocks\..+\.json$/.test(f) && f !== "blocks.schema.json").sort();
    expect(GUIDE_SETS.map((s) => s.file).sort()).toEqual(files);
  });

  it("each wave H set has blocks and ids are unique across non-delta sets", () => {
    for (const id of ["low", "returning", "first30", "recovery", "kingdomadmin"] as const)
      expect(LOADED[id]!.length, id).toBeGreaterThan(0);
    const seen = new Map<string, string>();
    for (const s of GUIDE_SETS.filter((g) => g.kind !== "profile-delta"))
      for (const b of LOADED[s.id]!) {
        expect(seen.get(b.id), `${b.id} in ${s.id} and ${seen.get(b.id)}`).toBeUndefined();
        seen.set(b.id, s.id);
      }
  });

  it("chapter titles are given for every section a set uses", () => {
    for (const s of GUIDE_SETS.filter((g) => g.sectionTitles))
      for (const b of LOADED[s.id]!) expect(s.sectionTitles![b.section], `${s.id}/${b.id} ${b.section}`).toBeDefined();
  });

  it("kingdom admin blocks are for leaders only", () => {
    for (const b of LOADED.kingdomadmin!) expect(b.funcao).toEqual(["lider"]);
  });
});

describe("guidesForProfile", () => {
  it("a new F2P player in a fresh kingdom gets new-kingdom, first-30 and the base guide", () => {
    expect(offered(profile({ kingdomDay: 3 }))).toEqual(["newkingdom", "first30", "f2p"]);
  });

  it("the base guide is always offered, last", () => {
    for (const p of [profile(), profile({ returningPlayer: true, role: "lider", cityHall: 25, kingdomStage: "kvk2" })]) {
      expect(offered(p, true).at(-1)).toBe("f2p");
    }
  });

  it("returning players get the returning guide and not the first-30 path", () => {
    const ids = offered(profile({ returningPlayer: true, cityHall: 10 }));
    expect(ids[0]).toBe("returning");
    expect(ids).not.toContain("first30");
  });

  it("first-30 stops after the CH proxy; new-kingdom stops after day 14 or pre-KvK", () => {
    expect(offered(profile({ cityHall: 17 }))).not.toContain("first30");
    expect(offered(profile({ kingdomDay: 15 }))).not.toContain("newkingdom");
    expect(offered(profile({ kingdomStage: "kvk1" }))).not.toContain("newkingdom");
  });

  it("leaders get the kingdom admin guide; the recovery guide only on request", () => {
    expect(offered(profile({ role: "lider" }))).toContain("kingdomadmin");
    expect(offered(profile({ role: "farm" }))).not.toContain("kingdomadmin");
    expect(offered(profile())).not.toContain("recovery");
    expect(offered(profile(), true)[0]).toBe("recovery");
  });

  it("profile deltas are never offered as guides of their own", () => {
    for (const sp of ["f2p", "low", "medium", "kraken"] as const)
      for (const g of guidesForProfile(profile({ spending: sp }), { zeroed: true })) expect(g.set.kind).not.toBe("profile-delta");
  });
});

describe("Low delta merge (F-75)", () => {
  it("deltas apply from low up to the chosen profile", () => {
    expect(deltaSetsFor("f2p")).toEqual([]);
    expect(deltaSetsFor("low").map((d) => d.id)).toEqual(["low"]);
    expect(deltaSetsFor("kraken").map((d) => d.id)).toEqual(["low"]);
  });

  it("an F2P player never sees Low delta blocks", () => {
    const ids = new Set(blocksForGuide("f2p", LOADED, profile()).map((b) => b.id));
    for (const b of LOADED.low!) {
      const base = LOADED.f2p!.find((x) => x.id === b.id);
      if (base) expect(blocksForGuide("f2p", LOADED, profile()).find((x) => x.id === b.id)).toBe(base);
      else expect(ids.has(b.id)).toBe(false);
    }
  });

  it("a Low player sees every Low delta block, and overrides replace the F2P version", () => {
    const p = profile({ spending: "low", role: "lutador" });
    const merged = blocksForGuide("f2p", LOADED, p);
    for (const b of LOADED.low!) expect(merged.find((x) => x.id === b.id)).toBe(b);
    const shown = new Set(shownIds("f2p", p));
    for (const b of LOADED.low!) {
      const relevant = b.stage.some((s) => s === "todos" || s === "pre_kvk") && b.funcao.some((f) => f === "todas" || f === "lutador");
      if (relevant) expect(shown.has(b.id), b.id).toBe(true);
    }
  });

  it("Low delta blocks are tagged for low", () => {
    for (const b of LOADED.low!) expect(b.perfil.some((x) => x === "low" || x === "todos"), b.id).toBe(true);
  });

  it("merging the Low delta never hides a base block from Medium+ profiles", () => {
    for (const spending of ["medium", "high", "whale", "kraken"] as const) {
      const p = profile({ spending });
      const before = flattenGuide(selectBlocks(LOADED.f2p!, p)).length;
      const after = flattenGuide(selectGuide("f2p", LOADED, p)).length;
      expect(after, spending).toBeGreaterThanOrEqual(before);
    }
  });
});

describe("selectGuide on the wave H sets", () => {
  it("uses the set's chapter titles", () => {
    const g = selectGuide("kingdomadmin", LOADED, profile({ role: "lider", kingdomStage: "kvk1" }));
    expect(g.sections.length).toBeGreaterThan(0);
    for (const s of g.sections) expect(s.title).toBe(GUIDE_SETS.find((x) => x.id === "kingdomadmin")!.sectionTitles![s.id]);
  });

  it("a non-leader sees nothing from the kingdom admin guide", () => {
    expect(shownIds("kingdomadmin", profile({ role: "lutador" }))).toEqual([]);
  });

  it("returning, recovery and first-30 guides show blocks to a typical F2P profile", () => {
    expect(shownIds("returning", profile({ returningPlayer: true, cityHall: 15 })).length).toBeGreaterThan(0);
    expect(shownIds("recovery", profile({ cityHall: 18 })).length).toBeGreaterThan(0);
    expect(shownIds("first30", profile({ kingdomDay: 1 })).length).toBeGreaterThan(0);
  });

  it("a delta id cannot be selected as a guide", () => {
    expect(() => blocksForGuide("low", LOADED, profile())).toThrow();
  });
});
