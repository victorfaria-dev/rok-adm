import { afterEach, describe, expect, it } from "vitest";
import { BODY_MAX_BYTES, normalizeInviteCode } from "@rokadm/core";
import { ORIGIN, farmsData, rawRequest, startTest, type TestServer } from "./helpers";

let s: TestServer | undefined;
afterEach(async () => {
  await s?.stop();
  s = undefined;
});

async function server(opts: Parameters<typeof startTest>[0] = {}): Promise<TestServer> {
  s = await startTest(opts);
  return s;
}

describe("authentication and authorization", () => {
  it("401 without, with malformed and with unknown tokens", async () => {
    const t = await server();
    const { space } = await t.createSpace();
    const p = `/v1/spaces/${space.id}`;
    const none = await t.call("GET", p);
    expect(none.status).toBe(401);
    expect(none.body.error).toBe("unauthorized");
    expect(none.headers.get("www-authenticate")).toMatch(/^Bearer/);
    for (const auth of ["Bearer", "Bearer x", "Basic abc", "bearer kot_x", `Bearer kot_${"a".repeat(42)}`, `Bearer kot_${"a".repeat(43)} extra`]) {
      expect((await t.call("GET", p, { headers: { authorization: auth } })).status).toBe(401);
    }
    expect((await t.call("GET", p, { token: `kot_${"A".repeat(43)}` })).status).toBe(401);
  });

  it("403 with a token from another space, also for a space that does not exist", async () => {
    const t = await server();
    const a = await t.createSpace("A");
    const b = await t.createSpace("B");
    const r = await t.call("GET", `/v1/spaces/${b.space.id}/members`, { token: a.token });
    expect(r.status).toBe(403);
    expect(r.body.error).toBe("forbidden");
    expect((await t.call("GET", `/v1/spaces/sp_doesnotexist000000000`, { token: a.token })).status).toBe(403);
    expect((await t.call("DELETE", `/v1/spaces/${b.space.id}`, { token: a.token })).status).toBe(403);
    expect((await t.call("GET", `/v1/spaces/${b.space.id}/docs/farms/x`, { token: a.token })).status).toBe(403);
  });

  it("403 for members on admin routes and admin-only doc kinds", async () => {
    const t = await server();
    const admin = await t.createSpace();
    const m = await t.join(admin.invite.code);
    const sp = admin.space.id;
    for (const [method, path] of [
      ["GET", `/v1/spaces/${sp}/invites`],
      ["POST", `/v1/spaces/${sp}/invites`],
      ["DELETE", `/v1/spaces/${sp}/invites/${admin.invite.id}`],
      ["GET", `/v1/spaces/${sp}/audit`],
      ["GET", `/v1/spaces/${sp}/export`],
      ["DELETE", `/v1/spaces/${sp}`],
    ] as const) {
      const r = await t.call(method, path, { token: m.token });
      expect(r.status, `${method} ${path}`).toBe(403);
    }
    for (const kind of ["mge-plan", "council-requirements", "kingdom"]) {
      const r = await t.call("PUT", `/v1/spaces/${sp}/docs/${kind}/x`, { token: m.token, body: { baseVersion: 0, data: {} } });
      expect(r.status, kind).toBe(403);
    }
  });

  it("403 when a member overwrites or deletes another member's farms doc", async () => {
    const t = await server();
    const admin = await t.createSpace();
    const b = await t.join(admin.invite.code, "Bruno");
    const c = await t.join(admin.invite.code, "Carla");
    const p = `/v1/spaces/${admin.space.id}/docs/farms/${b.member.id}`;
    expect((await t.call("PUT", p, { token: b.token, body: { baseVersion: 0, data: farmsData() } })).status).toBe(201);
    expect((await t.call("PUT", p, { token: c.token, body: { baseVersion: 1, data: farmsData("hijack") } })).status).toBe(403);
    // Not even an admin may overwrite a member's farms.
    expect((await t.call("PUT", p, { token: admin.token, body: { baseVersion: 1, data: farmsData("hijack") } })).status).toBe(403);
    expect((await t.call("DELETE", `${p}?version=1`, { token: c.token })).status).toBe(403);
    expect((await t.call("GET", p, { token: c.token })).body.doc.data.farms[0].name).toBe("Farm 1");
    // An admin may delete it (moderation).
    expect((await t.call("DELETE", `${p}?version=1`, { token: admin.token })).status).toBe(204);
  });
});

describe("invites", () => {
  it("expired, used-up, revoked and unknown codes all give the same 404 invite_invalid", async () => {
    const t = await server();
    const admin = await t.createSpace();
    const sp = admin.space.id;
    const short = (await t.call("POST", `/v1/spaces/${sp}/invites`, { token: admin.token, body: { ttlHours: 1, maxUses: 1 } })).body.invite;
    const once = (await t.call("POST", `/v1/spaces/${sp}/invites`, { token: admin.token, body: { maxUses: 1 } })).body.invite;
    const revoked = (await t.call("POST", `/v1/spaces/${sp}/invites`, { token: admin.token })).body.invite;
    expect((await t.call("DELETE", `/v1/spaces/${sp}/invites/${revoked.id}`, { token: admin.token })).status).toBe(204);

    await t.join(once.code);
    t.advance(3_600_000);
    const bodies: unknown[] = [];
    for (const code of [short.code, once.code, revoked.code, "2222-2222-2222"]) {
      const r = await t.call("POST", "/v1/join", { body: { inviteCode: code, displayName: "X" } });
      expect(r.status).toBe(404);
      bodies.push(r.body);
    }
    expect(bodies.every((b) => JSON.stringify(b) === JSON.stringify(bodies[0]))).toBe(true);
    expect(bodies[0]).toEqual({ error: "invite_invalid", message: expect.any(String) });
    const list = (await t.call("GET", `/v1/spaces/${sp}/invites`, { token: admin.token })).body.invites;
    expect(list.find((i: { id: string }) => i.id === once.id).uses).toBe(1);
  });

  it("malformed codes are a validation error", async () => {
    const t = await server();
    const r = await t.call("POST", "/v1/join", { body: { inviteCode: "IIII-OOOO-0000", displayName: "X" } });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("validation_failed");
  });
});

describe("request bodies", () => {
  it("413 when Content-Length declares too much, before the body is sent", async () => {
    const t = await server();
    const r = await rawRequest(t.port, {
      method: "POST",
      path: "/v1/spaces",
      headers: { "content-type": "application/json", "content-length": BODY_MAX_BYTES + 1 },
      chunks: [Buffer.from("{")],
      endAfter: false,
    });
    expect(r.status).toBe(413);
    expect(JSON.parse(r.body).error).toBe("payload_too_large");
    expect(r.headers.connection).toBe("close");
  });

  it("413 when a chunked body streams past the limit", async () => {
    const t = await server();
    const chunk = Buffer.alloc(64 * 1024, 0x20);
    const r = await rawRequest(t.port, {
      method: "POST",
      path: "/v1/spaces",
      headers: { "content-type": "application/json", "transfer-encoding": "chunked" },
      chunks: Array.from({ length: Math.ceil(BODY_MAX_BYTES / chunk.length) + 4 }, () => chunk),
    });
    expect(r.status).toBe(413);
    expect(JSON.parse(r.body).error).toBe("payload_too_large");
  });

  it("413 for document data over DOC_DATA_MAX_BYTES within the body limit", async () => {
    const t = await server();
    const { space, token } = await t.createSpace();
    const big = { a: Array.from({ length: 136 }, () => "x".repeat(3900)) };
    const r = await t.call("PUT", `/v1/spaces/${space.id}/docs/kingdom/k`, { token, body: { baseVersion: 0, data: big } });
    expect(r.status).toBe(413);
  });

  it("415 for a body that is not application/json", async () => {
    const t = await server();
    const body = JSON.stringify({ name: "A", displayName: "B" });
    for (const ct of ["text/plain", "application/x-www-form-urlencoded", "application/jsonx"]) {
      const r = await t.call("POST", "/v1/spaces", { body, headers: { "content-type": ct } });
      expect(r.status, ct).toBe(415);
      expect(r.body.error).toBe("unsupported_media_type");
    }
    const ok = await t.call("POST", "/v1/spaces", { body, headers: { "content-type": "application/json; charset=utf-8" } });
    expect(ok.status).toBe(201);
  });
});

describe("rate limiting", () => {
  it("429 with Retry-After on the strict bucket, then recovers after the window", async () => {
    const t = await server({ rateLimit: { strict: 3, general: 100 } });
    for (let i = 0; i < 3; i++) expect((await t.call("POST", "/v1/join", { body: { inviteCode: "2222-2222-2222", displayName: "X" } })).status).toBe(404);
    const r = await t.call("POST", "/v1/join", { body: { inviteCode: "2222-2222-2222", displayName: "X" } });
    expect(r.status).toBe(429);
    expect(r.body.error).toBe("rate_limited");
    expect(Number(r.headers.get("retry-after"))).toBeGreaterThan(0);
    // Other routes still use the general bucket.
    expect((await t.call("GET", "/v1/health")).status).toBe(200);
    t.advance(60_000);
    expect((await t.call("POST", "/v1/join", { body: { inviteCode: "2222-2222-2222", displayName: "X" } })).status).toBe(404);
  });

  it("general bucket counts failed auth attempts too", async () => {
    const t = await server({ rateLimit: { general: 5 } });
    for (let i = 0; i < 5; i++) expect((await t.call("GET", "/v1/spaces/sp_aaaaaaaaaaaaaaaaaaaaaa", { token: `kot_${"b".repeat(43)}` })).status).toBe(401);
    const r = await t.call("GET", "/v1/spaces/sp_aaaaaaaaaaaaaaaaaaaaaa", { token: `kot_${"b".repeat(43)}` });
    expect(r.status).toBe(429);
    expect(r.headers.get("retry-after")).toBe("60");
  });
});

describe("SQL injection", () => {
  it("names are stored verbatim, hostile doc ids are rejected, tables survive", async () => {
    const t = await server();
    const evil = "x'; DROP TABLE docs;--";
    const created = await t.createSpace(`Robert'); DROP TABLE spaces;--`, evil);
    expect(created.space.name).toBe(`Robert'); DROP TABLE spaces;--`);
    const joined = await t.join(created.invite.code, `" OR 1=1 --`);
    const members = await t.call("GET", `/v1/spaces/${created.space.id}/members`, { token: joined.token });
    expect(members.body.members.map((m: { displayName: string }) => m.displayName)).toEqual([evil, `" OR 1=1 --`]);

    const r = await t.call("GET", `/v1/spaces/${created.space.id}/docs/farms/${encodeURIComponent(evil)}`, { token: created.token });
    expect(r.status).toBe(400);
    const put = await t.call("PUT", `/v1/spaces/${created.space.id}/docs/farms/${encodeURIComponent(evil)}`, {
      token: created.token,
      body: { baseVersion: 0, data: farmsData() },
    });
    expect(put.status).toBe(400);
    const q = await t.call("GET", `/v1/spaces/${created.space.id}/docs?kind=${encodeURIComponent("farms' OR '1'='1")}`, { token: created.token });
    expect(q.status).toBe(400);

    const tables = (t.app.db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as { name: string }[]).map((x) => x.name);
    expect(tables).toEqual(expect.arrayContaining(["audit", "docs", "invites", "members", "spaces"]));
    expect(t.app.db.prepare("SELECT COUNT(*) AS n FROM spaces").get()).toEqual({ n: 1 });
  });
});

describe("CORS", () => {
  it("echoes an allowed origin and answers its preflight", async () => {
    const t = await server();
    const r = await t.call("GET", "/v1/health", { headers: { origin: ORIGIN } });
    expect(r.headers.get("access-control-allow-origin")).toBe(ORIGIN);
    expect(r.headers.get("vary")).toBe("Origin");
    const pre = await t.call("OPTIONS", "/v1/spaces", {
      headers: { origin: ORIGIN, "access-control-request-method": "POST", "access-control-request-headers": "content-type" },
    });
    expect(pre.status).toBe(204);
    expect(pre.headers.get("access-control-allow-origin")).toBe(ORIGIN);
    expect(pre.headers.get("access-control-allow-methods")).toBe("GET, POST, PUT, DELETE");
    expect(pre.headers.get("access-control-allow-headers")).toBe("authorization, content-type");
    expect(pre.headers.get("access-control-max-age")).toBe("600");
  });

  it("refuses a disallowed origin's preflight and never sends it ACAO", async () => {
    const t = await server();
    const evil = "https://evil.example";
    const pre = await t.call("OPTIONS", "/v1/spaces", { headers: { origin: evil, "access-control-request-method": "POST" } });
    expect(pre.status).toBe(403);
    expect(pre.headers.get("access-control-allow-origin")).toBeNull();
    expect(pre.headers.get("access-control-allow-methods")).toBeNull();
    const r = await t.call("GET", "/v1/health", { headers: { origin: evil } });
    expect(r.headers.get("access-control-allow-origin")).toBeNull();
    // Lookalike origins are not prefix-matched.
    const r2 = await t.call("GET", "/v1/health", { headers: { origin: `${ORIGIN}.evil.example` } });
    expect(r2.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("secrets at rest and in logs", () => {
  it("stores only hashes of tokens and invite codes", async () => {
    const t = await server();
    const admin = await t.createSpace();
    const m = await t.join(admin.invite.code);
    const extra = (await t.call("POST", `/v1/spaces/${admin.space.id}/invites`, { token: admin.token })).body.invite.code as string;
    const secrets = [admin.token, m.token, normalizeInviteCode(admin.invite.code)!, admin.invite.code, normalizeInviteCode(extra)!, extra];
    const dump: string[] = [];
    for (const table of ["spaces", "members", "invites", "docs", "audit"]) {
      dump.push(...t.app.db.prepare(`SELECT * FROM ${table}`).all().map((row) => JSON.stringify(row)));
    }
    const all = dump.join("\n");
    for (const sec of secrets) expect(all).not.toContain(sec);
    const hashes = t.app.db.prepare("SELECT token_hash AS h FROM members").all() as { h: string }[];
    for (const { h } of hashes) expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("logs carry route templates, never tokens, codes, names or query strings", async () => {
    const t = await server();
    const admin = await t.createSpace("Segredo do Reino", "NomeSecreto");
    const m = await t.join(admin.invite.code, "OutroNome");
    await t.call("GET", `/v1/spaces/${admin.space.id}/docs?kind=farms`, { token: m.token });
    await t.call("GET", `/v1/spaces/${admin.space.id}/members`, { token: `kot_${"z".repeat(43)}` });
    await t.call("POST", "/v1/join", { body: { inviteCode: "3333-3333-3333", displayName: "TerceiroNome" } });
    expect(t.logs.length).toBeGreaterThanOrEqual(5);
    const text = t.logs.join("\n");
    for (const sec of [
      admin.token,
      m.token,
      "z".repeat(43),
      admin.invite.code,
      normalizeInviteCode(admin.invite.code)!,
      "333333333333",
      "3333-3333-3333",
      "NomeSecreto",
      "OutroNome",
      "TerceiroNome",
      "Segredo do Reino",
      "kind=farms",
      "127.0.0.1",
      admin.space.id,
    ]) {
      expect(text, sec).not.toContain(sec);
    }
    const lines = t.logs.map((l) => JSON.parse(l));
    expect(lines.map((l) => l.route)).toContain("/v1/spaces/{spaceId}/docs");
    for (const l of lines) {
      expect(Object.keys(l).sort()).toEqual(["level", "method", "ms", "msg", "reqId", "route", "status", "t"]);
    }
  });
});

describe("limits", () => {
  it("409 limit_reached when the space already has MEMBERS_PER_SPACE_MAX members", async () => {
    const t = await server({ file: false });
    const admin = await t.createSpace();
    // Fill the space directly (299 more rows) rather than through 299 HTTP joins.
    const insert = t.app.db.prepare("INSERT INTO members (id, space_id, display_name, role, token_hash, joined_at) VALUES (?, ?, ?, 'member', ?, ?)");
    for (let i = 0; i < 299; i++) insert.run(`mb_fill${String(i).padStart(16, "0")}`, admin.space.id, `m${i}`, `h${i}`, "2026-03-01T12:00:00.000Z");
    const r = await t.call("POST", "/v1/join", { body: { inviteCode: admin.invite.code, displayName: "Late" } });
    expect(r.status).toBe(409);
    expect(r.body.error).toBe("limit_reached");
    const inv = (await t.call("GET", `/v1/spaces/${admin.space.id}/invites`, { token: admin.token })).body.invites[0];
    expect(inv.uses).toBe(0);
  });
});
