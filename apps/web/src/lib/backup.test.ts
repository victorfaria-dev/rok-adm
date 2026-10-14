import { describe, expect, it } from "vitest";
import { BACKUP_APP, applyRestore, backupFileName, backupText, buildBackup, planRestore } from "./backup";
import { memoryStorage, WEBHOOK_KEY } from "./kingdom-store";

const filled = () => {
  const st = memoryStorage();
  st.setItem("ko:v1", JSON.stringify({ v: 1, theme: "light", profileCode: null, commanders: { "cao-cao": { q1: "a" } }, junk: 1 }));
  st.setItem("ko:card:v1", JSON.stringify({ v: 1, name: "Ana", tag: "abc", color: "jade", reduceMotion: null }));
  st.setItem("ko:crest:v1", JSON.stringify({ v: 1, shape: "heater", color: "cobalt", tag: "K1", emblem: "crown" }));
  st.setItem("ko:farms:v1", JSON.stringify({ v: 1, farms: [], shipments: [], showHypotheses: true }));
  st.setItem("ko:kingdom:v1", "{broken");
  st.setItem(WEBHOOK_KEY, JSON.stringify({ v: 1, url: "https://discord.com/api/webhooks/1/secret" }));
  st.setItem("ko:kingdom:probe", "1");
  return st;
};

describe("buildBackup", () => {
  it("holds every usable ko:* section, cleaned by its parser; never the webhook or probes", () => {
    const b = buildBackup(filled(), new Date("2026-10-13T12:00:00Z"));
    expect(b.app).toBe(BACKUP_APP);
    expect(b.v).toBe(1);
    expect(b.exportedAt).toBe("2026-10-13T12:00:00.000Z");
    expect(Object.keys(b.keys).sort()).toEqual(["ko:card:v1", "ko:crest:v1", "ko:farms:v1", "ko:v1"]);
    expect(b.keys["ko:v1"]).not.toHaveProperty("junk");
    expect(b.keys["ko:card:v1"]).toMatchObject({ tag: "ABC" });
    const text = backupText(b);
    expect(text).not.toContain("secret");
    expect(text).not.toContain("probe");
    expect(backupFileName(new Date(2026, 9, 3))).toBe("kingdomops-backup-2026-10-03.json");
  });

  it("an empty device gives an empty file", () => {
    expect(buildBackup(memoryStorage()).keys).toEqual({});
  });
});

describe("planRestore / applyRestore", () => {
  it("compares per section: add, replace, same, invalid; unknown keys ignored; nothing written before apply", () => {
    const from = buildBackup(filled());
    const file = JSON.parse(backupText(from));
    file.keys["ko:farms:v1"] = { v: 1, farms: [{ id: "f", name: "Alpha", role: "food", note: "", levels: {}, createdAt: "2026-10-01T00:00:00Z" }], shipments: [] };
    file.keys["ko:tools:v1"] = { v: 1, inventory: { gems: 5 }, inputs: {}, checks: {} };
    file.keys["ko:crest:v1"] = "not a crest";
    file.keys["ko:other:v9"] = { x: 1 };

    const device = filled();
    const plan = planRestore(JSON.stringify(file), device);
    const by = Object.fromEntries(plan.rows.map((r) => [r.key, r]));
    expect(by["ko:v1"]!.change).toBe("same");
    expect(by["ko:card:v1"]!.change).toBe("same");
    expect(by["ko:farms:v1"]).toMatchObject({ change: "replace", now: "0 farms, 0 envios", incoming: "1 farm, 0 envios" });
    expect(by["ko:tools:v1"]).toMatchObject({ change: "add", now: null, incoming: "0 calculadoras, 1 valor de inventário, 0 checklists" });
    expect(by["ko:crest:v1"]).toMatchObject({ change: "invalid", incoming: null });
    expect(by["ko:kingdom:v1"]).toBeUndefined();
    expect(plan.unknown).toEqual(["ko:other:v9"]);
    expect(Object.keys(plan.writes).sort()).toEqual(["ko:farms:v1", "ko:tools:v1"]);
    expect(device.getItem("ko:tools:v1")).toBeNull();

    expect(applyRestore(plan, device)).toBe(2);
    expect(JSON.parse(device.getItem("ko:farms:v1")!).farms[0].name).toBe("Alpha");
    expect(JSON.parse(device.getItem("ko:tools:v1")!).inventory).toEqual({ gems: 5 });
    expect(device.getItem("ko:kingdom:v1")).toBe("{broken");
    expect(device.getItem(WEBHOOK_KEY)).toContain("secret");
  });

  it("refuses files that are not backups, and newer versions", () => {
    expect(() => planRestore("nope", null)).toThrow(/não é um backup do KingdomOps/);
    expect(() => planRestore(JSON.stringify({ app: "kingdomops", v: 1 }), null)).toThrow(/não é um backup do KingdomOps/);
    expect(() => planRestore(JSON.stringify({ app: BACKUP_APP, v: 2, keys: {} }), null)).toThrow(/versão mais nova/);
  });

  it("a section that is not a v1 object is invalid, not silently reset to defaults", () => {
    const plan = planRestore(JSON.stringify({ app: BACKUP_APP, v: 1, keys: { "ko:v1": { v: 3 }, "ko:farms:v1": [1, 2] } }), memoryStorage());
    expect(plan.rows.map((r) => r.change)).toEqual(["invalid", "invalid"]);
    expect(plan.writes).toEqual({});
  });
});
