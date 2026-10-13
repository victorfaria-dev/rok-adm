// Regression tests for the findings of the adversarial security review (wave F).
import { statSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { AUDIT_KEEP_PER_SPACE, ISSUES_MAX, routePath, ROUTES } from "@rokadm/core";
import { farmsData, rawRequest, startTest, type TestServer } from "./helpers";

let s: TestServer | undefined;
afterEach(async () => {
  await s?.stop();
  s = undefined;
});

describe("hardening", () => {
  it("refuses foreign Host headers (DNS rebinding)", async () => {
    s = await startTest();
    const get = (host: string) => rawRequest(s!.port, { method: "GET", path: "/v1/health", headers: { host }, chunks: [] });
    expect((await get("evil.example")).status).toBe(403);
    expect((await get("evil.example:8787")).status).toBe(403);
    expect((await get(`127.0.0.1:${s.port}`)).status).toBe(200);
    expect((await get(`localhost:${s.port}`)).status).toBe(200);
    expect((await get(`[::1]:${s.port}`)).status).toBe(200);
  });

  it("refuses disallowed origins before the rate limiter counts them", async () => {
    s = await startTest({ rateLimit: { strict: 2, general: 5 } });
    for (let i = 0; i < 10; i++) {
      const r = await s.call("POST", "/v1/spaces", { body: { name: "x", displayName: "y" }, headers: { origin: "http://evil.example" } });
      expect(r.status).toBe(403);
      expect(r.headers.get("access-control-allow-origin")).toBeNull();
    }
    expect((await s.call("POST", "/v1/spaces", { body: { name: "x", displayName: "y" } })).status).toBe(201);
  });

  it("caps validation issues", async () => {
    s = await startTest();
    const body: Record<string, number> = { name: 1, displayName: 1 } as never;
    for (let i = 0; i < 3000; i++) body[`k${i}${"x".repeat(100)}`] = 1;
    const r = await s.call("POST", "/v1/spaces", { body });
    expect(r.status).toBe(400);
    expect(r.body.issues.length).toBeLessThanOrEqual(ISSUES_MAX);
    for (const i of r.body.issues) expect(i.path.length).toBeLessThanOrEqual(40);
  });

  it("refuses bidi overrides and zero-width characters in names", async () => {
    s = await startTest();
    for (const name of ["Ad‮min", "Ad​min", "⁦Admin", "Admin﻿"]) {
      expect((await s.call("POST", "/v1/spaces", { body: { name: "K", displayName: name } })).status).toBe(400);
    }
  });

  it("farms documents are keyed by the member id and do not count toward the council quota", async () => {
    s = await startTest();
    const admin = await s.createSpace();
    const b = await s.join(admin.invite.code);
    const sp = admin.space.id;
    expect((await s.call("PUT", `/v1/spaces/${sp}/docs/farms/main`, { token: b.token, body: { baseVersion: 0, data: farmsData() } })).status).toBe(403);
    expect((await s.call("PUT", `/v1/spaces/${sp}/docs/farms/${b.member.id}`, { token: b.token, body: { baseVersion: 0, data: farmsData() } })).status).toBe(201);
  });

  it("revoking twice is idempotent and audited once", async () => {
    s = await startTest();
    const { space, token, invite } = await s.createSpace();
    const p = `/v1/spaces/${space.id}/invites/${invite.id}`;
    expect((await s.call("DELETE", p, { token })).status).toBe(204);
    expect((await s.call("DELETE", p, { token })).status).toBe(204);
    const audit = await s.call("GET", `/v1/spaces/${space.id}/audit`, { token });
    expect(audit.body.entries.filter((e: { action: string }) => e.action === "invite.revoke")).toHaveLength(1);
  });

  it("prunes the audit log per space", async () => {
    s = await startTest();
    const { space } = await s.createSpace();
    const at = new Date().toISOString();
    for (let i = 0; i < AUDIT_KEEP_PER_SPACE + 50; i++) s.app.store.audit(space.id, at, null, "doc.put", `x/${i}`);
    const n = s.app.db.prepare("SELECT COUNT(*) AS n FROM audit WHERE space_id = ?").get(space.id) as { n: number };
    expect(n.n).toBeLessThanOrEqual(AUDIT_KEEP_PER_SPACE + 1);
  });

  it("database files are private to the user", async () => {
    s = await startTest();
    await s.createSpace();
    expect(statSync(s.dbPath).mode & 0o077).toBe(0);
  });

  it("the client refuses dot path segments", () => {
    expect(() => routePath(ROUTES.getDoc.path, { spaceId: "sp_x", kind: "farms", docId: ".." })).toThrow();
    expect(() => routePath(ROUTES.getDoc.path, { spaceId: "sp_x", kind: "farms", docId: "." })).toThrow();
  });
});
