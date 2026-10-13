import { compareWhatIf, emptySeedDoc, type SeedGovernor } from "@rokadm/planner";
import { describe, expect, it } from "vitest";
import { deleteSeed, listSeeds, loadSeed, powerText, saveSeed, seedSummary } from "./kingdom-seed";
import { memoryStorage } from "./kingdom-store";

const M = 1e6;
const g = (id: string, power: number): SeedGovernor => ({ id, name: "", power });

describe("seed simulations in the council store", () => {
  it("saves, lists, loads and deletes", () => {
    const st = memoryStorage();
    saveSeed({ ...emptySeedDoc("s1"), title: "Before SoC", listText: "1m\n2m" }, st, new Date("2026-10-13T10:00:00Z"));
    expect(listSeeds(st).map((d) => d.title)).toEqual(["Before SoC"]);
    expect(loadSeed("s1", st)!.listText).toBe("1m\n2m");
    deleteSeed("s1", st);
    expect(loadSeed("s1", st)).toBeNull();
  });
});

describe("seedSummary", () => {
  it("empty", () => {
    expect(seedSummary(compareWhatIf([], { vacation: [], zeroed: {} }))).toBe("No governors entered yet.");
  });

  it("states counted power, ignored governors, Imperium gap and the what-if change", () => {
    const govs = [...Array.from({ length: 300 }, (_, i) => g(`g${i}`, 200 * M)), g("x", 10 * M)];
    const s = seedSummary(compareWhatIf(govs, { vacation: ["g0"], zeroed: {} }));
    expect(s).toContain("Counted kingdom power: 57B from the top 300 of 301 governors.");
    expect(s).toContain("1 governor is below the top 300 and not counted.");
    expect(s).toContain("At or above the Imperium threshold");
    expect(s).toContain("counted power drops by 180M to 56.8B");
  });

  it("formats power", () => {
    expect(powerText(23_500_000_000)).toBe("23.5B (23,500,000,000)");
  });
});
