import { describe, expect, it } from "vitest";
import { defaultStore, exportStore, importStore, parseStore, readStore, STORE_KEY, writeStore } from "./store";

function memory(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k),
    clear: () => m.clear(), key: () => null, get length() { return m.size; },
  } as Storage;
}

describe("store", () => {
  it("defaults to dark theme and no profile", () => {
    expect(parseStore(null)).toEqual(defaultStore());
    expect(defaultStore().theme).toBe("dark");
  });

  it("falls back to defaults on corrupted JSON or wrong version", () => {
    expect(parseStore("{not json")).toEqual(defaultStore());
    expect(parseStore(JSON.stringify({ v: 2, theme: "light" }))).toEqual(defaultStore());
  });

  it("keeps valid fields and drops malformed ones", () => {
    const s = parseStore(JSON.stringify({ v: 1, theme: "purple", profileCode: "1.0.0.0.12.60....0", routine: { date: "2026-10-13", done: [1] } }));
    expect(s.theme).toBe("dark");
    expect(s.profileCode).toBe("1.0.0.0.12.60....0");
    expect(s.routine).toBeNull();
  });

  it("writes and reads back through storage", () => {
    const st = memory();
    writeStore({ theme: "light" }, st);
    expect(readStore(st).theme).toBe("light");
    expect(JSON.parse(st.getItem(STORE_KEY)!).v).toBe(1);
  });

  it("survives a storage that throws", () => {
    const bad = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => {} };
    expect(readStore(bad)).toEqual(defaultStore());
    expect(writeStore({ theme: "system" }, bad).theme).toBe("system");
  });

  it("export then import is identical", () => {
    const s = { ...defaultStore(), theme: "light" as const, profileCode: "1.1.1.0.10.30....0", routine: { date: "2026-10-13", done: ["a", "b"] } };
    expect(importStore(exportStore(s))).toEqual(s);
  });

  it("rejects files that are not exports with an actionable message", () => {
    expect(() => importStore("{}")).toThrow(/not a KingdomOps export/);
    expect(() => importStore("nope")).toThrow(/Pick the .json file/);
  });

  it("parses wave B fields tolerantly", () => {
    const s = parseStore(JSON.stringify({
      v: 1, profileOverride: "whale", routinePrefs: { minutes: 45, breakMode: true },
      commanders: { "sun-tzu": { purpose: "field_main", bad: 3 }, junk: 7 },
    }));
    expect(s.profileOverride).toBe("whale");
    expect(s.routinePrefs).toEqual({ minutes: 45, breakMode: true });
    expect(s.commanders).toEqual({ "sun-tzu": { purpose: "field_main" } });
    const bad = parseStore(JSON.stringify({ v: 1, profileOverride: "gold", routinePrefs: { minutes: -5, breakMode: "yes" }, commanders: [] }));
    expect(bad.profileOverride).toBeNull();
    expect(bad.routinePrefs).toEqual({ minutes: null, breakMode: false });
    expect(bad.commanders).toEqual({});
  });

  it("export then import keeps wave B fields", () => {
    const s = { ...defaultStore(), profileOverride: "low" as const, routinePrefs: { minutes: 15, breakMode: false }, commanders: { cyrus: { purpose: "gatherer" } } };
    expect(importStore(exportStore(s))).toEqual(s);
  });
});
