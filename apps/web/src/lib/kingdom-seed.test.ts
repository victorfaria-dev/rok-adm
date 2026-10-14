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
    expect(seedSummary(compareWhatIf([], { vacation: [], zeroed: {} }))).toBe("Nenhum governador informado ainda.");
  });

  it("states counted power, ignored governors, Imperium gap and the what-if change", () => {
    const govs = [...Array.from({ length: 300 }, (_, i) => g(`g${i}`, 200 * M)), g("x", 10 * M)];
    const s = seedSummary(compareWhatIf(govs, { vacation: ["g0"], zeroed: {} }));
    expect(s).toContain("Poder do reino contado: 57B, dos 300 primeiros de 301 governadores.");
    expect(s).toContain("1 governador está abaixo do top 300 e não conta.");
    expect(s).toContain("No limite do Imperium");
    expect(s).toContain("o poder contado cai 180M e vai a 56.8B");
  });

  it("formats power", () => {
    expect(powerText(23_500_000_000)).toBe("23.5B (23,500,000,000)");
  });
});
