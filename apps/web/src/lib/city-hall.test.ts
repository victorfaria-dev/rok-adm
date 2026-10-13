import { describe, expect, it } from "vitest";
import { defaultProfile, type AccountProfile } from "@rokadm/core";
import type { PlannedTask } from "@rokadm/planner";
import { gauge, nextLevel, stageTools, todayTop, type ChRow } from "./city-hall";
import { levelTable } from "./tools-payload";

const make = (p: Partial<AccountProfile>): AccountProfile => ({ ...defaultProfile(), ...p });
const rows: ChRow[] = levelTable("A01-city-hall").rows;
const task = (id: string, mustDo: boolean): PlannedTask => ({ id, title: id, minutes: 1, mustDo } as unknown as PlannedTask);

describe("City Hall tab helpers", () => {
  it("today shows must-dos first, at most 3", () => {
    const top = todayTop([task("a", false), task("b", true), task("c", false), task("d", true), task("e", true), task("f", true)]);
    expect(top.map((t) => t.id)).toEqual(["b", "d", "e"]);
    expect(todayTop([task("a", false)]).map((t) => t.id)).toEqual(["a"]);
  });

  it("next level reads the A01 City Hall table: cost lines and a requirement", () => {
    const n = nextLevel(rows, 9);
    expect(n?.to).toBe(10);
    expect(n?.resources.length).toBeGreaterThan(0);
    for (const line of n!.resources) expect(line).toMatch(/^(Food|Wood|Stone|Gold) [\d,]+$/);
    expect(n?.requirement).toBeTruthy();
  });

  it("no next level at the top", () => {
    expect(nextLevel(rows, 25)).toBeNull();
  });

  it("gauges clamp to 0..1 and mark reached", () => {
    expect(gauge(10, 20)).toEqual({ current: 10, target: 20, ratio: 0.5, reached: false });
    expect(gauge(25, 21).ratio).toBe(1);
    expect(gauge(25, 21).reached).toBe(true);
  });

  it("stage tools: growth before KvK, fights after, Pack value first for spenders, at most 4", () => {
    const early = stageTools(make({ kingdomStage: "pre_kvk", cityHall: 10 })).map((t) => t.href);
    expect(early).toEqual(["/tools/buildings/", "/tools/speedups/", "/tools/vip/", "/commanders/"]);
    expect(stageTools(make({ kingdomStage: "pre_kvk", cityHall: 18 })).map((t) => t.href)).toContain("/tools/kvk/");
    const late = stageTools(make({ kingdomStage: "kvk2" })).map((t) => t.href);
    expect(late[0]).toBe("/tools/healing/");
    const low = stageTools(make({ spending: "low" }));
    expect(low[0]!.href).toBe("/tools/pack-value/");
    expect(low).toHaveLength(4);
  });
});
