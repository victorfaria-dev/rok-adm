import { describe, expect, it } from "vitest";
import { buildPath, FARM_BUILD_STAGES, stepMatchesFocus, type FarmLevels } from "../src/farms-build";

const ids = (p: ReturnType<typeof buildPath>) => p.stages.flatMap((s) => s.steps.map((x) => x.id));
const step = (p: ReturnType<typeof buildPath>, id: string) => p.stages.flatMap((s) => s.steps).find((x) => x.id === id)!;

describe("FARM_BUILD_STAGES", () => {
  it("has the three stages in order", () => {
    expect(FARM_BUILD_STAGES.map((s) => s.label)).toEqual([
      "Start: CH11 / 3 marches", "Practical minimum: CH17 / 4 marches", "Strong: CH22 / 5 marches",
    ]);
  });
});

describe("buildPath", () => {
  it("nothing entered: checkable steps unknown, advice steps info, no next", () => {
    const p = buildPath({});
    expect(p.next).toBeNull();
    for (const s of p.stages.flatMap((x) => x.steps)) expect(["unknown", "info"]).toContain(s.status);
    expect(step(p, "civ").status).toBe("info");
    expect(step(p, "ch11").status).toBe("unknown");
    expect(p.stages.every((s) => !s.complete)).toBe(true);
  });

  it("marks done/todo from levels and picks the first todo as next", () => {
    const p = buildPath({ cityHall: 12, tradingPost: 8, goldmine: 8, academy: 10, commanderLevel: 20 });
    expect(step(p, "ch11").status).toBe("done");
    expect(step(p, "academy-foodwood-15").status).toBe("done");
    expect(step(p, "tp-unlock").status).toBe("done");
    expect(step(p, "goldmine").status).toBe("todo");
    expect(p.next?.id).toBe("goldmine");
    expect(p.stages[0]!.complete).toBe(true);
    expect(p.stages[1]!.complete).toBe(false);
  });

  it("null levels count as not entered", () => {
    const p = buildPath({ cityHall: null, tradingPost: 15 });
    expect(step(p, "ch11").status).toBe("unknown");
    expect(step(p, "tp15").status).toBe("done");
    expect(step(p, "tp15").current).toBe(15);
    expect(step(p, "ch11").current).toBeNull();
  });

  it("thresholds: CH11/17/22, TP 15/21, Goldmine 15, commander 37, Academy 9/15/20/25", () => {
    const at = (lv: FarmLevels, id: string) => step(buildPath(lv), id).status;
    expect(at({ cityHall: 10 }, "ch11")).toBe("todo");
    expect(at({ cityHall: 17 }, "ch17")).toBe("done");
    expect(at({ cityHall: 21 }, "ch22")).toBe("todo");
    expect(at({ tradingPost: 14 }, "tp15")).toBe("todo");
    expect(at({ tradingPost: 21 }, "tp21")).toBe("done");
    expect(at({ goldmine: 15 }, "goldmine")).toBe("done");
    expect(at({ commanderLevel: 36 }, "commander37")).toBe("todo");
    expect(at({ commanderLevel: 37 }, "commander37")).toBe("done");
    expect(at({ academy: 9 }, "academy-foodwood-15")).toBe("done");
    expect(at({ academy: 14 }, "academy-stonegold-15")).toBe("todo");
    expect(at({ academy: 20 }, "academy-foodwood-35")).toBe("done");
    expect(at({ academy: 24 }, "academy-stonegold-35")).toBe("todo");
  });

  it("focus selects the Academy steps (A03-0028)", () => {
    const all = ids(buildPath({}, "general"));
    expect(all).toEqual(expect.arrayContaining(["academy-foodwood-15", "academy-foodwood-35", "academy-stonegold-15", "academy-stonegold-35"]));
    for (const f of ["food", "wood"] as const) {
      const i = ids(buildPath({}, f));
      expect(i).toContain("academy-foodwood-15");
      expect(i).not.toContain("academy-stonegold-15");
      expect(i).not.toContain("academy-stonegold-35");
    }
    for (const f of ["stone", "gold"] as const) {
      const i = ids(buildPath({}, f));
      expect(i).toContain("academy-stonegold-35");
      expect(i).not.toContain("academy-foodwood-15");
    }
    expect(ids(buildPath({}, "gold")).length).toBe(all.length - 2);
    expect(stepMatchesFocus(undefined, "gold")).toBe(true);
  });

  it("stone focus at Academy 10: next is the stone tech, not the food one", () => {
    const p = buildPath({ cityHall: 25, tradingPost: 25, goldmine: 25, commanderLevel: 60, academy: 10 }, "stone");
    expect(p.next?.id).toBe("academy-stonegold-15");
  });

  it("everything done: all stages complete, next null", () => {
    const p = buildPath({ cityHall: 25, tradingPost: 25, goldmine: 25, academy: 25, commanderLevel: 60 });
    expect(p.next).toBeNull();
    expect(p.stages.every((s) => s.complete)).toBe(true);
  });

  it("shows the Trading Post unlock as contested and cites cards", () => {
    const p = buildPath({});
    expect(p.tradingPostUnlock.status).toBe("contested");
    const tp = step(p, "tp-unlock");
    expect(tp.facts).toEqual(["A03-0025"]);
    expect(tp.gaps).toEqual(["L-A03-04"]);
    expect(tp.confidence).toBe("low");
    expect(step(p, "ch11").confidence).toBe("medium");
    expect(p.confidence).toBe("low");
  });

  it("rejects unknown focus or level fields", () => {
    expect(() => buildPath({}, "gems" as never)).toThrow(RangeError);
    expect(() => buildPath({ wall: 3 } as never)).toThrow(RangeError);
  });

  it("NaN levels are treated as not entered", () => {
    expect(step(buildPath({ cityHall: Number.NaN }), "ch11").status).toBe("unknown");
  });
});
