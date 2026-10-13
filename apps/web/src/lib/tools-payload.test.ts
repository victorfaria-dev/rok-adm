import { describe, expect, it } from "vitest";
import { cite, dataStamp, levelTable, sourceRows, sourced } from "./tools-payload";

describe("tools payload (build time)", () => {
  it("cites with the weakest confidence and flags unknown cards", () => {
    expect(cite(["A09-0001"]).confidence).toBe("high");
    expect(cite(["A09-0001", "A05-0003"]).confidence).toBe("medium");
    const unknown = cite(["Z99-9999"]);
    expect(unknown.confidence).toBe("pending");
    expect(unknown.stale).toBe(true);
  });

  it("parses a building table into numeric rows", () => {
    const h = levelTable("A01-buildings-hospital", ["Hospital Capacity"]);
    expect(h.rows).toHaveLength(25);
    expect(h.rows[0]!.level).toBe(1);
    expect(h.rows[0]!.seconds).toBeNull();
    expect(h.rows[0]!.stats["Hospital Capacity"]).toBe(7500);
    expect(h.rows[24]!.stats["Hospital Capacity"]).toBe(75000);
    expect(h.cite.facts).toContain("A01-0008");
    const academy = levelTable("A01-buildings-academy");
    expect(academy.rows[0]!.food).toBe(500);
  });

  it("stamps the dataset and lists sources", () => {
    const s = dataStamp();
    expect(s.datasetVersion).toMatch(/^[0-9a-f]+$/);
    expect(s.official?.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(sourceRows(["A05-0003", "A05-0003"]).map((r) => r.id)).toEqual(["A05-0003"]);
    expect(sourced({ value: 1, unit: "x", facts: ["A05-0004"] })).toMatchObject({ value: 1, unit: "x", facts: ["A05-0004"] });
  });
});
