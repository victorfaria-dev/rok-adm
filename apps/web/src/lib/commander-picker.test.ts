import {
  COMMANDER_RELEASES,
  PORTRAIT_ATTRIBUTION,
  commanderPortrait,
  groupCommandersByPeriod,
  hasCommanderPortrait,
  shouldAskAboutCommander,
  type KingdomProgress,
} from "@rokadm/planner";
import { describe, expect, it } from "vitest";
import {
  PORTRAIT_CREDIT,
  arrivesText,
  filterCommanders,
  groupForPicker,
  initials,
  matchesName,
  normalizeName,
  portraitSrc,
  shouldAsk,
  type PickerCommander,
} from "./commander-picker";
import { buildPickerRoster } from "./commander-roster";

const roster = buildPickerRoster();
const ids = (list: readonly PickerCommander[]): string[] => list.map((c) => c.id);

describe("lean roster", () => {
  it("has every commander, in game order, with only the fields the picker needs", () => {
    expect(roster.commanders).toHaveLength(COMMANDER_RELEASES.length);
    expect(ids(roster.commanders)).toEqual(groupCommandersByPeriod().flatMap((g) => g.commanders.map((c) => c.id)));
    const keys = new Set(roster.commanders.flatMap((c) => Object.keys(c)));
    expect([...keys].sort()).toEqual(["fromDay", "id", "name", "offseasonUnlock", "period", "portrait", "rarity"].filter((k) => keys.has(k)).sort());
    for (const banned of ["facts", "sources", "note", "routes", "confidence", "lastConfirmed"]) expect(keys.has(banned)).toBe(false);
    expect(JSON.stringify(roster)).not.toContain("accessedAt");
  });

  it("marks the commanders without a portrait so they get the initials tile", () => {
    const missing = roster.commanders.filter((c) => !c.portrait).map((c) => c.id);
    expect(missing.length).toBeGreaterThan(0);
    for (const id of missing) expect(hasCommanderPortrait(id)).toBe(false);
  });

  it("builds the same portrait paths as the planner and the same credit as the manifest", () => {
    const p = commanderPortrait("sun-tzu", 96)!;
    expect(portraitSrc("sun-tzu")).toEqual({ src: p.src, srcset: p.srcset });
    expect(PORTRAIT_CREDIT).toBe(`Portraits: ${PORTRAIT_ATTRIBUTION}. Fan site, not affiliated.`);
  });
});

describe("search", () => {
  it("ignores accents, case, hyphens and spaces", () => {
    expect(normalizeName("Æthelflæd")).toBe("aethelflaed");
    expect(matchesName("Æthelflæd", "aethel")).toBe(true);
    expect(matchesName("Cheok Jun-gyeong", "jun gyeong")).toBe(true);
    expect(matchesName("Cheok Jun-gyeong", "JUNGYEONG")).toBe(true);
    expect(matchesName("Yi Seong-Gye", "yi s")).toBe(true);
    expect(matchesName("Hermann", "hérmann")).toBe(true);
    expect(matchesName("Sun Tzu", "")).toBe(true);
    expect(matchesName("Sun Tzu", "caesar")).toBe(false);
  });

  it("filters the roster by name", () => {
    expect(ids(filterCommanders(roster.commanders, { query: "sun t" }, null))).toEqual(["sun-tzu"]);
    expect(filterCommanders(roster.commanders, { query: "zzzz" }, null)).toEqual([]);
  });
});

describe("filters", () => {
  it("rarity keeps only that rarity", () => {
    const epic = filterCommanders(roster.commanders, { rarity: "epic" }, null);
    expect(epic.length).toBeGreaterThan(0);
    expect(epic.every((c) => c.rarity === "epic")).toBe(true);
    expect(filterCommanders(roster.commanders, { rarity: "all" }, null)).toHaveLength(roster.commanders.length);
  });

  it("available-now hides future periods, and does nothing without a known stage", () => {
    const pre = { stage: "pre_kvk" as const };
    const now = filterCommanders(roster.commanders, { availableOnly: true }, pre);
    expect(now.every((c) => c.period === "launch" || c.period === "pre_kvk")).toBe(true);
    expect(now.length).toBeLessThan(roster.commanders.length);
    expect(filterCommanders(roster.commanders, { availableOnly: true }, null)).toHaveLength(roster.commanders.length);
  });

  it("offseason unlocks count as available in the offseason before their season", () => {
    const yi = roster.commanders.find((c) => c.id === "yi-seong-gye")!;
    expect(yi.offseasonUnlock).toBe(true);
    const stage = { stage: "pre_kvk" as const };
    expect(ids(filterCommanders([yi], { availableOnly: true }, stage))).toEqual([]);
    expect(ids(filterCommanders([yi], { availableOnly: true }, { ...stage, offseason: true }))).toEqual(["yi-seong-gye"]);
  });
});

describe("grouping", () => {
  it("groups in game order, A to Z inside a group, and drops empty groups", () => {
    const groups = groupForPicker(roster.periods, roster.commanders, null);
    expect(groups.map((g) => g.period.id)).toEqual(["launch", "pre_kvk", "kvk1", "kvk2", "kvk3", "soc"]);
    for (const g of groups) {
      const names = g.commanders.map((c) => c.name);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en")));
    }
    const some = groupForPicker(roster.periods, filterCommanders(roster.commanders, { query: "sun tzu" }, null), null);
    expect(some.map((g) => g.period.id)).toEqual(["launch"]);
  });

  it("flags the periods the kingdom has not reached", () => {
    const groups = groupForPicker(roster.periods, roster.commanders, { stage: "kvk1" });
    const future = Object.fromEntries(groups.map((g) => [g.period.id, g.future]));
    expect(future).toMatchObject({ launch: false, pre_kvk: false, kvk1: false, kvk3: true, soc: true });
    expect(groupForPicker(roster.periods, roster.commanders, null).some((g) => g.future)).toBe(false);
  });
});

describe("shouldAsk", () => {
  it("matches the planner's shouldAskAboutCommander for every commander, stage, day and offseason", () => {
    for (const stage of ["pre_kvk", "kvk1", "kvk2", "kvk3", "soc"] as const) {
      for (const offseason of [false, true]) {
        for (const kingdomDay of [null, 10, 400]) {
          const progress: KingdomProgress = { stage, offseason, kingdomDay };
          for (const c of roster.commanders) {
            expect(shouldAsk(c.id, roster.commanders, progress), c.id + " " + stage).toBe(shouldAskAboutCommander(c.id, progress));
          }
          expect(shouldAsk("not-a-commander", roster.commanders, progress)).toBe(shouldAskAboutCommander("not-a-commander", progress));
        }
      }
    }
  });

  it("asks about everything when the stage is unknown", () => {
    expect(roster.commanders.every((c) => shouldAsk(c.id, roster.commanders, null))).toBe(true);
  });
});

describe("client bundle stays lean", () => {
  it("client picker code never imports the full dataset", () => {
    const { readFileSync } = require("node:fs") as typeof import("node:fs");
    const { join } = require("node:path") as typeof import("node:path");
    const files = ["lib/commander-picker.ts", "components/commanders/CommanderPicker.tsx", "components/commanders/CommanderTile.tsx", "components/commanders/Commanders.tsx"];
    for (const f of files) {
      const imports = (readFileSync(join(__dirname, "..", f), "utf8").match(/^import[\s\S]*?from\s*"[^"]+";/gm) ?? []).join("\n");
      expect(imports, f).not.toMatch(/commander-roster|\.json"|shouldAskAboutCommander|commanderTimingById|COMMANDER_RELEASES|commanderPortrait\b/);
    }
  });
});

describe("text", () => {
  it("initials and the arrival line", () => {
    expect(initials("Yi Seong-Gye")).toBe("YG");
    expect(initials("Achilles")).toBe("AC");
    expect(initials("Casimir III")).toBe("CI");
    expect(arrivesText("Guan Yu", roster.periods.find((p) => p.id === "kvk3"))).toBe("Guan Yu arrives in Season 3 (KvK3). Nothing to decide yet.");
  });
});
