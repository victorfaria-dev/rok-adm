import { describe, expect, it } from "vitest";
import { makeShipment, type ShipmentEntry } from "@rokadm/planner";
import {
  FARMS_KEY, MAX_FARMS, MAX_SHIPMENTS, FARM_NAME_MAX, FARM_NOTE_MAX,
  defaultFarmsStore, parseFarmsStore, parseFarm, parseShipment, readFarms, writeFarms, clearFarms,
  addFarm, updateFarm, removeFarm, addShipment, removeShipment, exportFarms, importFarms, newId, cleanFarmName, isIsoDay,
} from "./farms-store";

function memory(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k),
    clear: () => m.clear(), key: () => null, get length() { return m.size; },
  } as Storage;
}

const farmRaw = (over: Record<string, unknown> = {}) => ({
  id: "f1", name: "Farm A", role: "food", note: "", levels: { cityHall: 12, tradingPost: 5, goldmine: null, academy: 9, commanderLevel: 30 },
  gatheringUntil: "2026-10-13T18:40:00.000Z", daily: { date: "2026-10-13", done: ["ship-surplus"] }, goal: { resource: "food", amount: 1000 },
  createdAt: "2026-10-13T10:00:00.000Z", ...over,
});
const shipment = (over: Partial<ShipmentEntry> = {}): ShipmentEntry => ({
  ...makeShipment({ id: "s1", farmId: "f1", date: "2026-10-13", resource: "food", taxRate: 0.21, gross: 1000 }), ...over,
});

describe("parseFarmsStore", () => {
  it("defaults for missing, corrupt, wrong version or non-object", () => {
    expect(parseFarmsStore(null)).toEqual(defaultFarmsStore());
    expect(parseFarmsStore("")).toEqual(defaultFarmsStore());
    expect(parseFarmsStore("{not json")).toEqual(defaultFarmsStore());
    expect(parseFarmsStore(JSON.stringify({ v: 2, farms: [farmRaw()] }))).toEqual(defaultFarmsStore());
    expect(parseFarmsStore("[]")).toEqual(defaultFarmsStore());
    expect(parseFarmsStore("null")).toEqual(defaultFarmsStore());
    expect(defaultFarmsStore()).toEqual({ v: 1, farms: [], shipments: [], showHypotheses: false });
  });

  it("round-trips a valid store", () => {
    const s = { v: 1 as const, farms: [parseFarm(farmRaw())!], shipments: [shipment()], showHypotheses: true };
    expect(parseFarmsStore(JSON.stringify(s))).toEqual(s);
  });

  it("drops malformed farms and shipments individually, keeps the rest", () => {
    const s = parseFarmsStore(JSON.stringify({
      v: 1,
      farms: [farmRaw(), { id: "", name: "x" }, { id: "f2", name: "   " }, "junk", farmRaw({ id: "f3", name: "Farm C" }), farmRaw({ name: "dup id" })],
      shipments: [shipment(), { ...shipment({ id: "s2" }), gross: -1 }, { ...shipment({ id: "s3" }), date: "2026-02-30" },
        { ...shipment({ id: "s4" }), resource: "gems" }, { ...shipment({ id: "s5" }), taxRate: 1 }, { ...shipment({ id: "s6" }), net: 5000 },
        null, shipment({ id: "s7" }), shipment()],
      showHypotheses: "yes",
    }));
    expect(s.farms.map((f) => f.id)).toEqual(["f1", "f3"]);
    expect(s.shipments.map((e) => e.id)).toEqual(["s1", "s7"]);
    expect(s.showHypotheses).toBe(false);
  });

  it("defaults bad fields inside a kept farm", () => {
    const f = parseFarm(farmRaw({
      role: "gems", note: 42, levels: { cityHall: 30, tradingPost: 2.5, goldmine: "10", academy: -1, commanderLevel: 60 },
      gatheringUntil: "soon", daily: { date: "yesterday", done: [] }, goal: { resource: "food", amount: Number.NaN }, createdAt: 5,
    }))!;
    expect(f.role).toBe("general");
    expect(f.note).toBe("");
    expect(f.levels).toEqual({ cityHall: null, tradingPost: null, goldmine: null, academy: null, commanderLevel: 60 });
    expect(f.gatheringUntil).toBeNull();
    expect(f.daily).toBeNull();
    expect(f.goal).toBeNull();
    expect(f.createdAt).toBe("1970-01-01T00:00:00.000Z");
  });

  it("trims and truncates name and note; dedupes daily marks", () => {
    const f = parseFarm(farmRaw({ name: `  ${"n".repeat(60)}  `, note: "x".repeat(300), daily: { date: "2026-10-13", done: ["a", "a", 3, ""] }, levels: "bad" }))!;
    expect(f.name).toHaveLength(FARM_NAME_MAX);
    expect(f.note).toHaveLength(FARM_NOTE_MAX);
    expect(f.daily).toEqual({ date: "2026-10-13", done: ["a"] });
    expect(f.levels.cityHall).toBeNull();
  });

  it("caps farms at MAX_FARMS and shipments at MAX_SHIPMENTS (oldest dropped)", () => {
    const farms = Array.from({ length: MAX_FARMS + 3 }, (_, i) => farmRaw({ id: `f${i}`, name: `Farm ${i}` }));
    const shipments = Array.from({ length: MAX_SHIPMENTS + 5 }, (_, i) => shipment({ id: `s${i}` }));
    const s = parseFarmsStore(JSON.stringify({ v: 1, farms, shipments }));
    expect(s.farms).toHaveLength(MAX_FARMS);
    expect(s.farms[0]!.id).toBe("f0");
    expect(s.shipments).toHaveLength(MAX_SHIPMENTS);
    expect(s.shipments[0]!.id).toBe("s5");
    expect(s.shipments.at(-1)!.id).toBe(`s${MAX_SHIPMENTS + 4}`);
  });

  it("non-array farms/shipments become empty", () => {
    const s = parseFarmsStore(JSON.stringify({ v: 1, farms: { a: 1 }, shipments: "x", showHypotheses: true }));
    expect(s).toEqual({ ...defaultFarmsStore(), showHypotheses: true });
  });
});

describe("parseShipment", () => {
  it("keeps a trimmed note and drops an empty one", () => {
    expect(parseShipment({ ...shipment(), note: "  hi " })!.note).toBe("hi");
    expect("note" in parseShipment({ ...shipment(), note: "   " })!).toBe(false);
  });
});

describe("storage", () => {
  it("writes under its own key and reads back", () => {
    const st = memory();
    writeFarms({ showHypotheses: true }, st);
    expect(readFarms(st).showHypotheses).toBe(true);
    expect(JSON.parse(st.getItem(FARMS_KEY)!).v).toBe(1);
    expect(st.getItem("ko:v1")).toBeNull();
    clearFarms(st);
    expect(readFarms(st)).toEqual(defaultFarmsStore());
  });

  it("survives a storage that throws, and no storage at all", () => {
    const bad = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
    expect(readFarms(bad)).toEqual(defaultFarmsStore());
    expect(writeFarms({ showHypotheses: true }, bad).showHypotheses).toBe(true);
    expect(() => clearFarms(bad)).not.toThrow();
    expect(readFarms(null)).toEqual(defaultFarmsStore());
    expect(addFarm({ name: "Mem" }, null).store.farms).toHaveLength(1);
  });
});

describe("farms CRUD", () => {
  it("addFarm trims the name, sets defaults and createdAt", () => {
    const st = memory();
    const { farm, store } = addFarm({ name: "  Farm A  ", role: "wood", levels: { cityHall: 11 } }, st, new Date("2026-10-13T10:00:00Z"));
    expect(farm.name).toBe("Farm A");
    expect(farm.role).toBe("wood");
    expect(farm.levels).toEqual({ cityHall: 11, tradingPost: null, goldmine: null, academy: null, commanderLevel: null });
    expect(farm.createdAt).toBe("2026-10-13T10:00:00.000Z");
    expect(farm.id).not.toBe("");
    expect(store.farms).toEqual([farm]);
    expect(readFarms(st).farms).toEqual([farm]);
  });

  it("addFarm rejects bad names and the 11th farm", () => {
    const st = memory();
    expect(() => addFarm({ name: "   " }, st)).toThrow(/name/);
    expect(() => addFarm({ name: "x".repeat(FARM_NAME_MAX + 1) }, st)).toThrow(/1–40/);
    for (let i = 0; i < MAX_FARMS; i++) addFarm({ name: `F${i}` }, st);
    expect(() => addFarm({ name: "one more" }, st)).toThrow(/up to 10/);
  });

  it("updateFarm merges fields and levels, keeps id/createdAt, validates name", () => {
    const st = memory();
    const { farm } = addFarm({ name: "A", levels: { cityHall: 11 } }, st);
    const s = updateFarm(farm.id, { name: " B ", levels: { tradingPost: 15 }, gatheringUntil: "2026-10-13T18:40:00Z", goal: { resource: "stone", amount: 500 } }, st);
    const f = s.farms[0]!;
    expect(f.name).toBe("B");
    expect(f.levels.cityHall).toBe(11);
    expect(f.levels.tradingPost).toBe(15);
    expect(f.gatheringUntil).toBe("2026-10-13T18:40:00Z");
    expect(f.goal).toEqual({ resource: "stone", amount: 500 });
    expect(f.id).toBe(farm.id);
    expect(f.createdAt).toBe(farm.createdAt);
    expect(() => updateFarm(farm.id, { name: "" }, st)).toThrow(/name/);
    expect(updateFarm("missing", { name: "Z" }, st)).toEqual(readFarms(st));
    expect(updateFarm(farm.id, { levels: { cityHall: 99 } }, st).farms[0]!.levels.cityHall).toBeNull();
    expect(updateFarm(farm.id, { gatheringUntil: null }, st).farms[0]!.gatheringUntil).toBeNull();
  });

  it("removeFarm also removes its shipments", () => {
    const st = memory();
    const a = addFarm({ name: "A" }, st).farm;
    const b = addFarm({ name: "B" }, st).farm;
    addShipment(shipment({ id: "s1", farmId: a.id }), st);
    addShipment(shipment({ id: "s2", farmId: b.id }), st);
    const s = removeFarm(a.id, st);
    expect(s.farms.map((f) => f.id)).toEqual([b.id]);
    expect(s.shipments.map((e) => e.id)).toEqual(["s2"]);
  });
});

describe("shipments", () => {
  it("add, replace same id, remove", () => {
    const st = memory();
    addShipment(shipment({ id: "s1" }), st);
    addShipment(shipment({ id: "s2" }), st);
    expect(readFarms(st).shipments.map((e) => e.id)).toEqual(["s1", "s2"]);
    addShipment(shipment({ id: "s1", gross: 2000, net: 1580 }), st);
    expect(readFarms(st).shipments.map((e) => e.id)).toEqual(["s2", "s1"]);
    expect(removeShipment("s2", st).shipments.map((e) => e.id)).toEqual(["s1"]);
    expect(removeShipment("nope", st).shipments).toHaveLength(1);
  });

  it("rejects an invalid shipment", () => {
    expect(() => addShipment({ ...shipment(), net: -1 }, memory())).toThrow(/not valid/);
  });

  it("drops the oldest past MAX_SHIPMENTS", () => {
    const st = memory();
    writeFarms({ shipments: Array.from({ length: MAX_SHIPMENTS }, (_, i) => shipment({ id: `s${i}` })) }, st);
    const s = addShipment(shipment({ id: "new" }), st);
    expect(s.shipments).toHaveLength(MAX_SHIPMENTS);
    expect(s.shipments[0]!.id).toBe("s1");
    expect(s.shipments.at(-1)!.id).toBe("new");
  });
});

describe("export / import", () => {
  it("export then import is identical", () => {
    const s = { v: 1 as const, farms: [parseFarm(farmRaw())!], shipments: [shipment({ note: "for KvK" })], showHypotheses: true };
    const text = exportFarms(s);
    expect(JSON.parse(text).app).toBe("kingdomops-farms");
    expect(importFarms(text)).toEqual(s);
  });

  it("rejects non-exports and other apps with an actionable message", () => {
    expect(() => importFarms("nope")).toThrow(/not a KingdomOps farms export/);
    expect(() => importFarms("{}")).toThrow(/Pick the .json file/);
    expect(() => importFarms(JSON.stringify({ app: "kingdomops", v: 1 }))).toThrow(/farms export/);
    expect(() => importFarms(JSON.stringify({ app: "kingdomops-farms", v: 2 }))).toThrow(/version/);
  });

  it("import drops bad entries like a read does", () => {
    const s = importFarms(JSON.stringify({ app: "kingdomops-farms", v: 1, farms: [farmRaw(), { id: "x" }], shipments: [{ id: "bad" }] }));
    expect(s.farms).toHaveLength(1);
    expect(s.shipments).toEqual([]);
  });
});

describe("helpers", () => {
  it("newId is unique-ish and non-empty", () => {
    const a = newId();
    expect(a.length).toBeGreaterThan(0);
    expect(newId()).not.toBe(a);
  });

  it("cleanFarmName and isIsoDay", () => {
    expect(cleanFarmName("  ok ")).toBe("ok");
    expect(cleanFarmName("")).toBeNull();
    expect(cleanFarmName(5)).toBeNull();
    expect(isIsoDay("2026-10-13")).toBe(true);
    expect(isIsoDay("2026-02-30")).toBe(false);
  });
});
