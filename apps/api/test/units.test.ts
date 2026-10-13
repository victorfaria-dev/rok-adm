import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ENTITY_ID_PATTERN, INVITE_CODE_ALPHABET, normalizeInviteCode } from "@rokadm/core";
import { loadConfig } from "../src/config";
import { hashInviteCode, hashToken, newId, newInviteCode, newToken, TOKEN_PATTERN } from "../src/crypto";
import { openDb } from "../src/db";
import { HttpError } from "../src/http";
import { RateLimiter } from "../src/rate-limit";
import { matchRoute } from "../src/router";

describe("config", () => {
  it("defaults to loopback, port 8787, local DB and the web dev origins", () => {
    const dir = mkdtempSync(join(tmpdir(), "rokadm-cfg-"));
    try {
      const c = loadConfig({}, { baseDir: dir });
      expect(c.host).toBe("127.0.0.1");
      expect(c.port).toBe(8787);
      expect(c.dbPath).toBe(join(dir, ".data", "kingdomops.sqlite"));
      expect(c.origins).toEqual(["http://localhost:4321", "http://127.0.0.1:4321"]);
      expect(c.rateLimit).toEqual({ windowMs: 60_000, general: 300, strict: 20 });
      // Secret generated once, 0600 in a 0700 directory, and reused.
      const file = join(dir, ".data", "secret");
      expect(statSync(file).mode & 0o777).toBe(0o600);
      expect(statSync(join(dir, ".data")).mode & 0o777).toBe(0o700);
      expect(readFileSync(file, "utf8").trim()).toMatch(/^[0-9a-f]{64}$/);
      expect(c.secret).toHaveLength(32);
      expect(loadConfig({}, { baseDir: dir }).secret.equals(c.secret)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reads env overrides and rejects bad values", () => {
    const secret = "ab".repeat(32);
    const c = loadConfig({
      KO_API_PORT: "0",
      KO_API_HOST: "::1",
      KO_API_DB: ":memory:",
      KO_API_ORIGINS: "http://a.test, http://b.test,",
      KO_API_SECRET: secret,
      KO_API_RATE_STRICT: "5",
    });
    expect(c).toMatchObject({ port: 0, host: "::1", dbPath: ":memory:", origins: ["http://a.test", "http://b.test"] });
    expect(c.secret.toString("hex")).toBe(secret);
    expect(c.rateLimit.strict).toBe(5);
    expect(() => loadConfig({ KO_API_SECRET: "ab".repeat(31) })).toThrow(/KO_API_SECRET/);
    expect(() => loadConfig({ KO_API_SECRET: "zz".repeat(32) })).toThrow(/KO_API_SECRET/);
    expect(() => loadConfig({ KO_API_SECRET: secret, KO_API_PORT: "70000" })).toThrow(/KO_API_PORT/);
    expect(() => loadConfig({ KO_API_SECRET: secret, KO_API_PORT: "8x" })).toThrow(/KO_API_PORT/);
  });
});

describe("crypto", () => {
  it("tokens, ids and invite codes have the documented shapes", () => {
    expect(newToken()).toMatch(TOKEN_PATTERN);
    for (const p of ["sp", "mb", "iv"] as const) {
      const id = newId(p);
      expect(id).toMatch(ENTITY_ID_PATTERN);
      expect(id).toHaveLength(25);
      expect(id.startsWith(`${p}_`)).toBe(true);
    }
    for (let i = 0; i < 50; i++) {
      const code = newInviteCode();
      expect(code).toHaveLength(12);
      for (const ch of code) expect(INVITE_CODE_ALPHABET).toContain(ch);
      expect(normalizeInviteCode(code)).toBe(code);
    }
  });

  it("hashes are deterministic per secret and domain-separated", () => {
    const k1 = Buffer.alloc(32, 1);
    const k2 = Buffer.alloc(32, 2);
    expect(hashToken(k1, "kot_x")).toBe(hashToken(k1, "kot_x"));
    expect(hashToken(k1, "kot_x")).not.toBe(hashToken(k2, "kot_x"));
    expect(hashToken(k1, "ABC")).not.toBe(hashInviteCode(k1, "ABC"));
  });
});

describe("rate limiter", () => {
  it("allows `limit` hits per window per key and prunes stale keys", () => {
    let t = 0;
    const rl = new RateLimiter(2, 1000, () => t);
    expect(rl.hit("a").ok).toBe(true);
    expect(rl.hit("a").ok).toBe(true);
    const r = rl.hit("a");
    expect(r).toEqual({ ok: false, retryAfterSec: 1 });
    expect(rl.hit("b").ok).toBe(true);
    t = 1000;
    expect(rl.hit("a").ok).toBe(true);
    expect(rl.size).toBe(1); // "b" pruned
  });
});

describe("router", () => {
  it("matches templates and decodes params", () => {
    const m = matchRoute("GET", "/v1/spaces/sp_x/docs/farms/a%2Db");
    expect(m.name).toBe("getDoc");
    expect(m.params).toEqual({ spaceId: "sp_x", kind: "farms", docId: "a-b" });
    expect(matchRoute("DELETE", "/v1/spaces/sp_x/members/me").name).toBe("removeMember");
  });

  it("404, 405 and 400 errors", () => {
    const err = (f: () => unknown) => {
      try {
        f();
      } catch (e) {
        return e as HttpError;
      }
      throw new Error("no error");
    };
    expect(err(() => matchRoute("GET", "/v2/health")).status).toBe(404);
    expect(err(() => matchRoute("GET", "/v1/spaces//members")).status).toBe(404);
    const e405 = err(() => matchRoute("PUT", "/v1/spaces"));
    expect(e405.status).toBe(405);
    expect(e405.extra.headers).toEqual({ Allow: "POST" });
    expect(err(() => matchRoute("GET", "/v1/spaces/%ZZ")).status).toBe(400);
  });
});

describe("db", () => {
  it("migrates once and enables foreign keys", () => {
    const dir = mkdtempSync(join(tmpdir(), "rokadm-db-"));
    try {
      const path = join(dir, "x.sqlite");
      const db = openDb(path);
      expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 1 });
      expect(db.prepare("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });
      expect(db.prepare("PRAGMA journal_mode").get()).toEqual({ journal_mode: "wal" });
      db.close();
      const again = openDb(path);
      expect(again.prepare("PRAGMA user_version").get()).toEqual({ user_version: 1 });
      again.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
