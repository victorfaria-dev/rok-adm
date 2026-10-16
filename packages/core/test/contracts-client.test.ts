import { describe, expect, it } from "vitest";
import { ApiError, ROUTES, createApiClient, type FetchLike, type SyncDoc } from "../src/index";

interface Call {
  url: string;
  init: RequestInit;
}

function fakeFetch(respond: (c: Call) => Response = () => json(200, {})) {
  const calls: Call[] = [];
  const fetch: FetchLike = async (url, init) => {
    const c = { url, init };
    calls.push(c);
    return respond(c);
  };
  return { fetch, calls };
}
function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}
const headersOf = (c: Call | undefined) => (c?.init.headers ?? {}) as Record<string, string>;

const BASE = "http://127.0.0.1:8787";
const SP = "sp_abcdefghijklmnop";
const TOKEN = "tok_secret-value";

describe("createApiClient", () => {
  it("validates baseUrl", () => {
    expect(() => createApiClient({ baseUrl: "ftp://x" })).toThrow(TypeError);
    expect(() => createApiClient({ baseUrl: "javascript:alert(1)" })).toThrow(TypeError);
    expect(() => createApiClient({ baseUrl: "not a url" })).toThrow(TypeError);
    expect(() => createApiClient({ baseUrl: "http://u:p@host" })).toThrow(TypeError);
    expect(() => createApiClient({ baseUrl: "http://host/?token=x" })).toThrow(TypeError);
    expect(createApiClient({ baseUrl: "http://127.0.0.1:8787/" }).baseUrl).toBe(BASE);
    expect(createApiClient({ baseUrl: "https://example.test/api/" }).baseUrl).toBe("https://example.test/api");
  });

  it("rejects tokens that could break the header", () => {
    expect(() => createApiClient({ baseUrl: BASE, token: "a\r\nX-Evil: 1" })).toThrow(TypeError);
    expect(() => createApiClient({ baseUrl: BASE, token: "" })).toThrow(TypeError);
  });

  it("sends no Authorization header without a token", async () => {
    const f = fakeFetch(() => json(200, { status: "ok", version: "v1" }));
    const api = createApiClient({ baseUrl: BASE, fetch: f.fetch });
    expect(await api.health()).toEqual({ status: "ok", version: "v1" });
    expect(f.calls[0]?.url).toBe(`${BASE}/v1/health`);
    expect(f.calls[0]?.init.method).toBe("GET");
    expect(headersOf(f.calls[0])).not.toHaveProperty("authorization");
    expect(f.calls[0]?.init.body).toBeUndefined();
    expect(f.calls[0]?.init.credentials).toBe("omit");
  });

  it("posts JSON bodies and withToken adds the bearer header (never in the URL)", async () => {
    const f = fakeFetch(() => json(201, { token: TOKEN }));
    const anon = createApiClient({ baseUrl: BASE, fetch: f.fetch });
    await anon.createSpace({ name: "Reino", displayName: "Rei" });
    const c = f.calls[0];
    expect(c?.init.method).toBe("POST");
    expect(c?.url).toBe(`${BASE}/v1/spaces`);
    expect(headersOf(c)["content-type"]).toBe("application/json");
    expect(JSON.parse(String(c?.init.body))).toEqual({ name: "Reino", displayName: "Rei" });

    const api = anon.withToken(TOKEN);
    await api.me(SP);
    expect(headersOf(f.calls[1]).authorization).toBe(`Bearer ${TOKEN}`);
    expect(f.calls[1]?.url).not.toContain(TOKEN);
    expect(headersOf(f.calls[1])).not.toHaveProperty("content-type");
  });

  it("uses the method and path of every route", async () => {
    const f = fakeFetch(() => json(200, {}));
    const api = createApiClient({ baseUrl: BASE, token: TOKEN, fetch: f.fetch });
    const doc = { baseVersion: 0, data: {} };
    const runs: [keyof typeof ROUTES, () => Promise<unknown>, string][] = [
      ["health", () => api.health(), "/v1/health"],
      ["createSpace", () => api.createSpace({ name: "a", displayName: "b" }), "/v1/spaces"],
      ["join", () => api.join({ inviteCode: "ABCD-EFGH-JKMN", displayName: "b" }), "/v1/join"],
      ["me", () => api.me(SP), `/v1/spaces/${SP}`],
      ["deleteSpace", () => api.deleteSpace(SP), `/v1/spaces/${SP}`],
      ["members", () => api.members(SP), `/v1/spaces/${SP}/members`],
      ["removeMember", () => api.removeMember(SP, "me"), `/v1/spaces/${SP}/members/me`],
      ["invites", () => api.invites(SP), `/v1/spaces/${SP}/invites`],
      ["createInvite", () => api.createInvite(SP), `/v1/spaces/${SP}/invites`],
      ["revokeInvite", () => api.revokeInvite(SP, "iv_abcdefghijklmnop"), `/v1/spaces/${SP}/invites/iv_abcdefghijklmnop`],
      ["docs", () => api.docs(SP), `/v1/spaces/${SP}/docs`],
      ["getDoc", () => api.getDoc(SP, "farms", "main"), `/v1/spaces/${SP}/docs/farms/main`],
      ["putDoc", () => api.putDoc(SP, "kingdom", "main", doc), `/v1/spaces/${SP}/docs/kingdom/main`],
      ["deleteDoc", () => api.deleteDoc(SP, "mge-plan", "x", 3), `/v1/spaces/${SP}/docs/mge-plan/x?version=3`],
      ["audit", () => api.audit(SP), `/v1/spaces/${SP}/audit`],
      ["exportSpace", () => api.exportSpace(SP), `/v1/spaces/${SP}/export`],
    ];
    expect(runs.map((r) => r[0]).sort()).toEqual(Object.keys(ROUTES).sort());
    for (const [name, run, path] of runs) {
      f.calls.length = 0;
      await run();
      expect(f.calls[0]?.init.method, name).toBe(ROUTES[name].method);
      expect(f.calls[0]?.url, name).toBe(BASE + path);
    }
  });

  it("builds query strings and encodes path params", async () => {
    const f = fakeFetch(() => json(200, {}));
    const api = createApiClient({ baseUrl: BASE, token: TOKEN, fetch: f.fetch });
    await api.docs(SP, "farms");
    await api.audit(SP, { limit: 50, before: 120 });
    await api.audit(SP, { limit: 10 });
    await api.getDoc(SP, "farms", "a/b");
    await api.createInvite(SP, { ttlHours: 24 });
    expect(f.calls.map((c) => c.url)).toEqual([
      `${BASE}/v1/spaces/${SP}/docs?kind=farms`,
      `${BASE}/v1/spaces/${SP}/audit?limit=50&before=120`,
      `${BASE}/v1/spaces/${SP}/audit?limit=10`,
      `${BASE}/v1/spaces/${SP}/docs/farms/a%2Fb`,
      `${BASE}/v1/spaces/${SP}/invites`,
    ]);
    expect(JSON.parse(String(f.calls[4]?.init.body))).toEqual({ ttlHours: 24 });
  });

  it("returns undefined for 204", async () => {
    const f = fakeFetch(() => new Response(null, { status: 204 }));
    const api = createApiClient({ baseUrl: BASE, token: TOKEN, fetch: f.fetch });
    expect(await api.deleteDoc(SP, "farms", "main", 1)).toBeUndefined();
    expect(await api.removeMember(SP, "me")).toBeUndefined();
  });

  it("maps error bodies to ApiError", async () => {
    const issues = [{ path: "/name", message: "must be 1..60 characters" }];
    const f = fakeFetch(() => json(400, { error: "validation_failed", message: "invalid body", issues }));
    const api = createApiClient({ baseUrl: BASE, fetch: f.fetch });
    const err = await api.createSpace({ name: "", displayName: "x" }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 400, code: "validation_failed", message: "invalid body", issues });
    expect((err as ApiError).current).toBeUndefined();
  });

  it("falls back to the status when the body is not a known error", async () => {
    const cases: [number, string, string][] = [
      [401, "nope", "unauthorized"],
      [429, "{}", "rate_limited"],
      [500, "<html>", "internal"],
      [404, JSON.stringify({ error: "made_up", message: "x" }), "not_found"],
    ];
    for (const [status, body, code] of cases) {
      const f = fakeFetch(() => new Response(body, { status }));
      const err = await createApiClient({ baseUrl: BASE, fetch: f.fetch }).health().catch((e: unknown) => e);
      expect(err).toMatchObject({ status, code });
    }
  });

  it("exposes the current document on a 409 conflict", async () => {
    const current: SyncDoc = {
      id: "main", kind: "kingdom", ownerId: "mb_abcdefghijklmnop", version: 4,
      updatedAt: "2026-10-13T10:00:00.000Z", updatedBy: "mb_abcdefghijklmnop", data: { a: 1 },
    };
    const f = fakeFetch(() => json(409, { error: "version_conflict", message: "stale", current }));
    const api = createApiClient({ baseUrl: BASE, token: TOKEN, fetch: f.fetch });
    const err = await api.putDoc(SP, "kingdom", "main", { baseVersion: 3, data: {} }).catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 409, code: "version_conflict", current });

    const gone = fakeFetch(() => json(409, { error: "version_conflict", message: "gone", current: null }));
    const e2 = await createApiClient({ baseUrl: BASE, fetch: gone.fetch }).deleteDoc(SP, "kingdom", "main", 2).catch((e: unknown) => e);
    expect((e2 as ApiError).current).toBeNull();

    const full = fakeFetch(() => json(409, { error: "limit_reached", message: "full" }));
    const e3 = await createApiClient({ baseUrl: BASE, fetch: full.fetch }).join({ inviteCode: "x", displayName: "y" }).catch((e: unknown) => e);
    expect(e3).toMatchObject({ status: 409, code: "limit_reached" });
    expect((e3 as ApiError).current).toBeUndefined();
  });
});
