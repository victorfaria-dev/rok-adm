import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ENTITY_ID_PATTERN, normalizeInviteCode, type ExportResponse } from "@rokadm/core";
import { farmsData, startTest, type TestServer } from "./helpers";

let s: TestServer;
beforeEach(async () => {
  s = await startTest();
});
afterEach(async () => {
  await s.stop();
});

describe("health", () => {
  it("answers ok with security headers", async () => {
    const r = await s.call("GET", "/v1/health");
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ status: "ok", version: "v1" });
    expect(r.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(r.headers.get("x-content-type-options")).toBe("nosniff");
    expect(r.headers.get("referrer-policy")).toBe("no-referrer");
    expect(r.headers.get("content-security-policy")).toBe("default-src 'none'; frame-ancestors 'none'");
  });

  it("404 for unknown paths, 405 with Allow for a known path", async () => {
    expect((await s.call("GET", "/v1/nope")).status).toBe(404);
    expect((await s.call("GET", "/v1/health/")).body.error).toBe("not_found");
    const r = await s.call("POST", "/v1/health", { body: {} });
    expect(r.status).toBe(405);
    expect(r.headers.get("allow")).toBe("GET");
    expect(r.body.error).toBe("method_not_allowed");
    const r2 = await s.call("PATCH", "/v1/spaces/sp_aaaaaaaaaaaaaaaaaaaaaa");
    expect(r2.status).toBe(405);
    expect(r2.headers.get("allow")).toBe("GET, DELETE");
  });

  it("400 for a path segment that is not valid percent-encoding", async () => {
    const r = await s.call("GET", "/v1/spaces/%E0%A4%A/members");
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("bad_request");
  });
});

describe("space lifecycle", () => {
  it("create -> join -> members -> farms doc put/get/conflict/delete", async () => {
    const created = await s.createSpace();
    expect(created.space).toMatchObject({ name: "Reino 1234", kingdom: 1234 });
    expect(created.space.id).toMatch(ENTITY_ID_PATTERN);
    expect(created.member).toMatchObject({ displayName: "Ana", role: "admin" });
    expect(created.member.id).toMatch(ENTITY_ID_PATTERN);
    expect(created.token).toMatch(/^kot_[A-Za-z0-9_-]{43}$/);
    expect(created.invite.code).toMatch(/^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
    expect(created.invite).toMatchObject({ maxUses: 50, uses: 0, revoked: false, expiresAt: "2026-03-04T12:00:00.000Z" });

    // Lowercase, with extra dashes/spaces: still accepted.
    const code = created.invite.code.toLowerCase().replace(/-/g, " - ");
    const joined = await s.join(code, "Bruno");
    expect(joined.space.id).toBe(created.space.id);
    expect(joined.member.role).toBe("member");
    const spaceId = created.space.id;

    const me = await s.call("GET", `/v1/spaces/${spaceId}`, { token: joined.token });
    expect(me.status).toBe(200);
    expect(me.body).toEqual({ space: created.space, member: joined.member });

    s.advance(1000);
    const members = await s.call("GET", `/v1/spaces/${spaceId}/members`, { token: joined.token });
    expect(members.body.members.map((m: { displayName: string }) => m.displayName)).toEqual(["Ana", "Bruno"]);

    const docPath = `/v1/spaces/${spaceId}/docs/farms/${joined.member.id}`;
    const put1 = await s.call("PUT", docPath, { token: joined.token, body: { baseVersion: 0, data: farmsData() } });
    expect(put1.status).toBe(201);
    expect(put1.body.doc).toMatchObject({ id: joined.member.id, kind: "farms", version: 1, ownerId: joined.member.id, updatedBy: joined.member.id });

    const get1 = await s.call("GET", docPath, { token: created.token });
    expect(get1.status).toBe(200);
    expect(get1.body.doc.data).toEqual(farmsData());

    const put2 = await s.call("PUT", docPath, { token: joined.token, body: { baseVersion: 1, data: farmsData("Farm renamed") } });
    expect(put2.status).toBe(200);
    expect(put2.body.doc.version).toBe(2);

    const stale = await s.call("PUT", docPath, { token: joined.token, body: { baseVersion: 1, data: farmsData("stale") } });
    expect(stale.status).toBe(409);
    expect(stale.body.error).toBe("version_conflict");
    expect(stale.body.current.version).toBe(2);
    expect(stale.body.current.data.farms[0].name).toBe("Farm renamed");

    // A farms document id must be the writer's own member id.
    const squat = await s.call("PUT", `/v1/spaces/${spaceId}/docs/farms/${created.member.id}`, { token: joined.token, body: { baseVersion: 0, data: farmsData() } });
    expect(squat.status).toBe(403);
    const fresh = await s.call("PUT", `/v1/spaces/${spaceId}/docs/kingdom/profile`, { token: created.token, body: { baseVersion: 3, data: {} } });
    expect(fresh.status).toBe(409);
    expect(fresh.body).toMatchObject({ error: "version_conflict", current: null });

    const list = await s.call("GET", `/v1/spaces/${spaceId}/docs?kind=farms`, { token: joined.token });
    expect(list.status).toBe(200);
    expect(list.body.docs).toHaveLength(1);
    expect(list.body.docs[0]).not.toHaveProperty("data");

    expect((await s.call("DELETE", docPath, { token: joined.token })).status).toBe(400);
    expect((await s.call("DELETE", `${docPath}?version=abc`, { token: joined.token })).status).toBe(400);
    const delStale = await s.call("DELETE", `${docPath}?version=1`, { token: joined.token });
    expect(delStale.status).toBe(409);
    expect(delStale.body.current.version).toBe(2);
    expect((await s.call("DELETE", `${docPath}?version=2`, { token: joined.token })).status).toBe(204);
    expect((await s.call("GET", docPath, { token: joined.token })).status).toBe(404);
    expect((await s.call("DELETE", `${docPath}?version=2`, { token: joined.token })).status).toBe(404);
  });

  it("validates bodies with issues", async () => {
    const r = await s.call("POST", "/v1/spaces", { body: { name: "", displayName: "x".repeat(40), extra: 1 } });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("validation_failed");
    expect(r.body.issues.map((i: { path: string }) => i.path).sort()).toEqual(["/displayName", "/extra", "/name"]);
    expect((await s.call("POST", "/v1/spaces", { body: "{not json" })).body.error).toBe("bad_request");
    expect((await s.call("POST", "/v1/spaces")).status).toBe(400);
    const { space, token } = await s.createSpace();
    const { member } = (await s.call("GET", `/v1/spaces/${space.id}`, { token })).body;
    const bad = await s.call("PUT", `/v1/spaces/${space.id}/docs/farms/${member.id}`, { token, body: { baseVersion: 0, data: { farms: "x" } } });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toBe("validation_failed");
    expect((await s.call("GET", `/v1/spaces/${space.id}/docs?kind=nope`, { token })).status).toBe(400);
    expect((await s.call("GET", `/v1/spaces/${space.id}/docs/nope/a`, { token })).status).toBe(400);
  });

  it("generic admin docs: admin writes, member reads", async () => {
    const admin = await s.createSpace();
    const member = await s.join(admin.invite.code);
    const p = `/v1/spaces/${admin.space.id}/docs/mge-plan/week-1`;
    const put = await s.call("PUT", p, { token: admin.token, body: { baseVersion: 0, data: { slots: [1, 2, 3] } } });
    expect(put.status).toBe(201);
    const get = await s.call("GET", p, { token: member.token });
    expect(get.body.doc.data).toEqual({ slots: [1, 2, 3] });
    const all = await s.call("GET", `/v1/spaces/${admin.space.id}/docs`, { token: member.token });
    expect(all.body.docs.map((d: { kind: string }) => d.kind)).toEqual(["mge-plan"]);
    // The member cannot delete the admin's doc.
    expect((await s.call("DELETE", `${p}?version=1`, { token: member.token })).status).toBe(403);
  });

  it("invites: create (empty body ok), list without codes, revoke", async () => {
    const { space, token } = await s.createSpace();
    const base = `/v1/spaces/${space.id}/invites`;
    const empty = await s.call("POST", base, { token });
    expect(empty.status).toBe(201);
    expect(empty.body.invite).toMatchObject({ maxUses: 50, uses: 0, revoked: false });
    const custom = await s.call("POST", base, { token, body: { ttlHours: 1, maxUses: 2 } });
    expect(custom.status).toBe(201);
    expect(custom.body.invite).toMatchObject({ maxUses: 2, expiresAt: "2026-03-01T13:00:00.000Z" });
    expect((await s.call("POST", base, { token, body: { maxUses: 0 } })).body.error).toBe("validation_failed");

    const list = await s.call("GET", base, { token });
    expect(list.body.invites).toHaveLength(3);
    for (const i of list.body.invites) expect(i).not.toHaveProperty("code");

    const id = custom.body.invite.id as string;
    expect((await s.call("DELETE", `${base}/${id}`, { token })).status).toBe(204);
    expect((await s.call("DELETE", `${base}/iv_aaaaaaaaaaaaaaaaaaaaaa`, { token })).status).toBe(404);
    const after = await s.call("GET", base, { token });
    expect(after.body.invites.find((i: { id: string }) => i.id === id).revoked).toBe(true);
  });

  it("members leave and are removed, with their farms docs", async () => {
    const admin = await s.createSpace();
    const b = await s.join(admin.invite.code, "Bruno");
    const c = await s.join(admin.invite.code, "Carla");
    const sp = admin.space.id;
    await s.call("PUT", `/v1/spaces/${sp}/docs/farms/${b.member.id}`, { token: b.token, body: { baseVersion: 0, data: farmsData() } });
    await s.call("PUT", `/v1/spaces/${sp}/docs/farms/${c.member.id}`, { token: c.token, body: { baseVersion: 0, data: farmsData() } });

    // Member cannot remove someone else.
    expect((await s.call("DELETE", `/v1/spaces/${sp}/members/${c.member.id}`, { token: b.token })).status).toBe(403);
    // Admin removes Carla; her doc goes too.
    expect((await s.call("DELETE", `/v1/spaces/${sp}/members/${c.member.id}`, { token: admin.token })).status).toBe(204);
    expect((await s.call("GET", `/v1/spaces/${sp}`, { token: c.token })).status).toBe(401);
    expect((await s.call("GET", `/v1/spaces/${sp}/docs/farms/${c.member.id}`, { token: admin.token })).status).toBe(404);
    expect((await s.call("DELETE", `/v1/spaces/${sp}/members/${c.member.id}`, { token: admin.token })).status).toBe(404);

    // Last admin cannot leave while Bruno remains.
    const stuck = await s.call("DELETE", `/v1/spaces/${sp}/members/me`, { token: admin.token });
    expect(stuck.status).toBe(409);
    expect(stuck.body.error).toBe("limit_reached");

    // Bruno leaves; his doc goes too.
    expect((await s.call("DELETE", `/v1/spaces/${sp}/members/me`, { token: b.token })).status).toBe(204);
    expect((await s.call("GET", `/v1/spaces/${sp}/docs/farms/${b.member.id}`, { token: admin.token })).status).toBe(404);

    const audit = await s.call("GET", `/v1/spaces/${sp}/audit`, { token: admin.token });
    expect(audit.body.entries.map((e: { action: string }) => e.action)).toEqual([
      "member.leave",
      "member.remove",
      "doc.put",
      "doc.put",
      "member.join",
      "member.join",
      "space.create",
    ]);

    // Alone now: leaving deletes the space.
    expect((await s.call("DELETE", `/v1/spaces/${sp}/members/me`, { token: admin.token })).status).toBe(204);
    expect((await s.call("GET", `/v1/spaces/${sp}`, { token: admin.token })).status).toBe(401);
    expect(s.app.db.prepare("SELECT COUNT(*) AS n FROM spaces").get()).toEqual({ n: 0 });
  });

  it("audit pages newest first with limit and before", async () => {
    const { space, token } = await s.createSpace();
    for (let i = 0; i < 4; i++) await s.call("POST", `/v1/spaces/${space.id}/invites`, { token });
    const page1 = await s.call("GET", `/v1/spaces/${space.id}/audit?limit=2`, { token });
    expect(page1.body.entries).toHaveLength(2);
    const [first, second] = page1.body.entries;
    expect(first.id).toBeGreaterThan(second.id);
    const page2 = await s.call("GET", `/v1/spaces/${space.id}/audit?limit=10&before=${second.id}`, { token });
    expect(page2.body.entries.map((e: { action: string }) => e.action)).toEqual(["invite.create", "invite.create", "space.create"]);
    expect((await s.call("GET", `/v1/spaces/${space.id}/audit?limit=201`, { token })).status).toBe(400);
    expect((await s.call("GET", `/v1/spaces/${space.id}/audit?limit=0`, { token })).status).toBe(400);
  });

  it("export holds docs with data and no hashes; audits itself", async () => {
    const admin = await s.createSpace();
    const b = await s.join(admin.invite.code);
    await s.call("PUT", `/v1/spaces/${admin.space.id}/docs/farms/${b.member.id}`, { token: b.token, body: { baseVersion: 0, data: farmsData() } });
    const r = await s.call("GET", `/v1/spaces/${admin.space.id}/export`, { token: admin.token });
    expect(r.status).toBe(200);
    expect(r.headers.get("content-disposition")).toBe(`attachment; filename="kingdomops-space-${admin.space.id}.json"`);
    const ex = r.body as ExportResponse;
    expect(ex).toMatchObject({ format: "kingdomops-space-export", formatVersion: 1, space: admin.space });
    expect(ex.members).toHaveLength(2);
    expect(ex.invites).toHaveLength(1);
    expect(ex.docs).toHaveLength(1);
    expect(ex.docs[0]!.data).toEqual(farmsData());
    expect(ex.audit.at(-1)!.action).toBe("space.export");
    const text = JSON.stringify(ex);
    for (const k of ["token_hash", "code_hash", "tokenHash", "codeHash", "token", "code"]) expect(text).not.toContain(`"${k}"`);
    expect(text).not.toContain(admin.token);
    expect(text).not.toContain(normalizeInviteCode(admin.invite.code)!);
  });

  it("delete space erases everything and invalidates every token", async () => {
    const admin = await s.createSpace();
    const b = await s.join(admin.invite.code);
    const sp = admin.space.id;
    await s.call("PUT", `/v1/spaces/${sp}/docs/farms/${b.member.id}`, { token: b.token, body: { baseVersion: 0, data: farmsData() } });
    expect((await s.call("DELETE", `/v1/spaces/${sp}`, { token: b.token })).status).toBe(403);
    expect((await s.call("DELETE", `/v1/spaces/${sp}`, { token: admin.token })).status).toBe(204);
    expect((await s.call("GET", `/v1/spaces/${sp}`, { token: admin.token })).status).toBe(401);
    expect((await s.call("GET", `/v1/spaces/${sp}/members`, { token: b.token })).status).toBe(401);
    expect((await s.call("GET", `/v1/spaces/${sp}/export`, { token: admin.token })).status).toBe(401);
    for (const table of ["spaces", "members", "invites", "docs", "audit"]) {
      expect(s.app.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()).toEqual({ n: 0 });
    }
    // Its invite code is gone too.
    const j = await s.call("POST", "/v1/join", { body: { inviteCode: admin.invite.code, displayName: "Zé" } });
    expect(j.status).toBe(404);
  });
});
