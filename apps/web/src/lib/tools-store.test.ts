import { describe, expect, it } from "vitest";
import {
  TOOLS_KEY, cleanInputs, decodeShare, defaultToolsStore, encodeShare, parseToolsStore, readToolsStore,
  writeChecks, writeInventory, writeToolInputs, clearToolsStore,
} from "./tools-store";

function memory(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    map: m,
  };
}

describe("tools store", () => {
  it("uses its own key, never ko:v1", () => {
    const st = memory({ "ko:v1": "{\"v\":1}" });
    writeToolInputs("vip", { target: 6 }, st);
    expect(st.map.get("ko:v1")).toBe("{\"v\":1}");
    expect(JSON.parse(st.map.get(TOOLS_KEY)!).inputs.vip).toEqual({ target: 6 });
  });

  it("is tolerant of garbage", () => {
    for (const raw of [null, "", "{", "[]", "{\"v\":2}", "{\"v\":1,\"inputs\":5}"]) {
      expect(parseToolsStore(raw)).toEqual(defaultToolsStore());
    }
    const s = parseToolsStore(JSON.stringify({ v: 1, inventory: { gems: 5, bad: { x: 1 }, nan: null }, inputs: { a: { x: 1 }, b: 7 }, checks: { k: ["a", "a", 3] } }));
    expect(s.inventory).toEqual({ gems: 5 });
    expect(s.inputs).toEqual({ a: { x: 1 }, b: {} });
    expect(s.checks).toEqual({ k: ["a"] });
  });

  it("survives a storage that throws", () => {
    const bad = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("quota"); }, removeItem: () => { throw new Error("x"); } };
    expect(readToolsStore(bad)).toEqual(defaultToolsStore());
    expect(writeInventory({ gems: 1 }, bad).inventory).toEqual({ gems: 1 });
    expect(() => clearToolsStore(bad)).not.toThrow();
  });

  it("merges inventory and checks", () => {
    const st = memory();
    writeInventory({ gems: 10 }, st);
    writeInventory({ vipPoints: 400 }, st);
    writeChecks("kvk", ["a", "b", "a"], st);
    const s = readToolsStore(st);
    expect(s.inventory).toEqual({ gems: 10, vipPoints: 400 });
    expect(s.checks.kvk).toEqual(["a", "b"]);
  });

  it("drops non-finite numbers and long strings", () => {
    expect(cleanInputs({ a: Number.NaN, b: Infinity, c: "x".repeat(501), d: true, e: "ok" })).toEqual({ d: true, e: "ok" });
  });

  it("share codes round-trip and reject junk", () => {
    const code = encodeShare({ target: 10, note: "ção" });
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeShare(code)).toEqual({ target: 10, note: "ção" });
    expect(decodeShare("!!")).toBeNull();
    expect(decodeShare("bm90IGpzb24")).toBeNull();
    expect(decodeShare(null)).toBeNull();
  });
});
