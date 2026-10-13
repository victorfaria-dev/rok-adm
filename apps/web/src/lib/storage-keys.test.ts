import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BACKUP_SECTIONS } from "./backup";
import { CARD_KEY } from "./card";
import { CREST_KEY } from "./crest";
import { FARMS_KEY } from "./farms-store";
import { KINGDOM_KEY, WEBHOOK_KEY } from "./kingdom-store";
import { STORE_KEY } from "./store";
import { TOOLS_KEY } from "./tools-store";
import { BACKUP_KEYS, KO_EVENT_NAMES, STORAGE_KEYS, USER_DATA_KEYS, clearAllKeys } from "./storage-keys";

const SRC = fileURLToPath(new URL("..", import.meta.url));

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...sourceFiles(p));
    else if (/\.(ts|tsx|astro|js|mjs)$/.test(f) && !/\.test\.tsx?$/.test(f) && f !== "storage-keys.ts") out.push(p);
  }
  return out;
}

class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
  keys() { return [...this.m.keys()]; }
}

describe("storage key manifest", () => {
  it("lists every ko:* key literal used in src/ (add new keys to lib/storage-keys.ts)", () => {
    const known = new Set([...STORAGE_KEYS.map((k) => k.key), ...KO_EVENT_NAMES]);
    const missing: string[] = [];
    for (const file of sourceFiles(SRC)) {
      for (const m of readFileSync(file, "utf8").matchAll(/["'`](ko:[A-Za-z0-9:_.-]+)["'`]/g)) {
        if (!known.has(m[1]!)) missing.push(`${relative(SRC, file)}: ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("matches the stores' own key constants and the backup sections", () => {
    const keys = STORAGE_KEYS.map((k) => k.key);
    for (const k of [STORE_KEY, CARD_KEY, CREST_KEY, TOOLS_KEY, FARMS_KEY, KINGDOM_KEY, WEBHOOK_KEY]) expect(keys).toContain(k);
    expect(BACKUP_SECTIONS.map((s) => s.key).sort()).toEqual([...BACKUP_KEYS].sort());
    expect(BACKUP_KEYS).not.toContain(WEBHOOK_KEY);
    expect(new Set(keys).size).toBe(keys.length);
    expect(USER_DATA_KEYS.map((k) => k.key)).toContain(WEBHOOK_KEY);
  });

  it("clearAllKeys removes every ko:* key (webhook and unknown future keys too) and nothing else", () => {
    const local = new MemStorage(), session = new MemStorage();
    for (const k of STORAGE_KEYS) (k.area === "local" ? local : session).setItem(k.key, "{}");
    local.setItem("ko:future:v9", "x");
    local.setItem("other-app", "keep");
    const removed = clearAllKeys(local as unknown as Storage, session as unknown as Storage);
    expect(local.keys()).toEqual(["other-app"]);
    expect(session.keys()).toEqual([]);
    expect(removed).toContain(WEBHOOK_KEY);
    expect(removed).toContain("ko:future:v9");
    expect(removed).toHaveLength(STORAGE_KEYS.length + 1);
  });

  it("never throws on blocked storage", () => {
    const bad = { get length(): number { throw new Error("blocked"); }, key: () => null, getItem: () => null, removeItem: () => undefined };
    expect(clearAllKeys(bad as unknown as Storage, null)).toEqual([]);
  });
});
