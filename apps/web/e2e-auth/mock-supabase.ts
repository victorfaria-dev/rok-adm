// Mocks the Supabase HTTP API for the configured e2e mode: auth (OTP, logout), PostgREST tables,
// RPCs and Storage, all from memory. Requests are recorded for assertions.
import type { Page, Route } from "@playwright/test";

export const SUPABASE = "http://127.0.0.1:54399";
export const ME = "11111111-1111-1111-1111-111111111111";
export const BOB = "22222222-2222-2222-2222-222222222222";

type Row = Record<string, unknown>;
export interface MockState {
  tables: Record<string, Row[]>;
  rpc: Record<string, (body: Record<string, unknown>, state: MockState) => unknown>;
  requests: { method: string; path: string; body: unknown }[];
}

export function session(userId = ME, email = "me@example.test") {
  return {
    access_token: "e2e-access", refresh_token: "e2e-refresh", token_type: "bearer", expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
    user: { id: userId, aud: "authenticated", role: "authenticated", email, app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, created_at: "2026-10-01T00:00:00Z" },
  };
}

/** Put a stored session on this origin (the route guard and supabase-js both read ko:auth:v1). */
export async function signIn(page: Page, userId = ME): Promise<void> {
  await page.goto("/");
  await page.evaluate((s) => localStorage.setItem("ko:auth:v1", JSON.stringify(s)), session(userId));
}

function filterRows(rows: Row[], params: URLSearchParams): Row[] {
  let out = rows;
  for (const [k, v] of params) {
    if (["select", "order", "limit", "offset", "on_conflict", "columns"].includes(k)) continue;
    const eq = /^eq\.(.*)$/.exec(v);
    const inn = /^in\.\((.*)\)$/.exec(v);
    if (eq) out = out.filter((r) => String(r[k]) === eq[1]);
    else if (inn) {
      const vals = inn[1]!.split(",").map((s) => s.replace(/^"|"$/g, ""));
      out = out.filter((r) => vals.includes(String(r[k])));
    }
  }
  return out;
}

export async function mockSupabase(page: Page, init: Partial<Pick<MockState, "tables" | "rpc">> = {}): Promise<MockState> {
  const state: MockState = { tables: structuredClone(init.tables ?? {}), rpc: init.rpc ?? {}, requests: [] };
  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: body === undefined ? "" : JSON.stringify(body) });

  await page.route(`${SUPABASE}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    let body: unknown = null;
    try {
      body = req.postData() ? JSON.parse(req.postData()!) : null;
    } catch {
      body = req.postData();
    }
    state.requests.push({ method: req.method(), path: url.pathname + url.search, body });
    if (req.method() === "OPTIONS") {
      return route.fulfill({ status: 200, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    }
    const p = url.pathname;
    if (p.startsWith("/auth/v1/otp") || p.startsWith("/auth/v1/verify")) return json(route, {});
    if (p.startsWith("/auth/v1/logout")) return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } });
    if (p.startsWith("/auth/v1/user")) return json(route, session().user);
    const rpc = /^\/rest\/v1\/rpc\/(\w+)$/.exec(p);
    if (rpc) {
      const fn = state.rpc[rpc[1]!];
      return fn ? json(route, fn((body ?? {}) as Record<string, unknown>, state)) : json(route, { message: `no mock for ${rpc[1]}` }, 404);
    }
    const table = /^\/rest\/v1\/(\w+)$/.exec(p)?.[1];
    if (table) {
      const rows = (state.tables[table] ??= []);
      if (req.method() === "GET") {
        const out = filterRows(rows, url.searchParams);
        const single = (req.headers()["accept"] ?? "").includes("vnd.pgrst.object");
        return json(route, single ? out[0] ?? null : out);
      }
      if (req.method() === "POST") {
        for (const r of Array.isArray(body) ? body : [body]) rows.push({ id: `row-${rows.length + 1}`, ...(r as Row) });
        return json(route, undefined, 201);
      }
      if (req.method() === "PATCH") {
        for (const r of filterRows(rows, url.searchParams)) Object.assign(r, body as Row);
        return json(route, undefined, 204);
      }
      if (req.method() === "DELETE") {
        const gone = new Set(filterRows(rows, url.searchParams));
        state.tables[table] = rows.filter((r) => !gone.has(r));
        return json(route, undefined, 204);
      }
    }
    if (p.startsWith("/storage/v1/")) {
      if (req.method() === "POST" && p.includes("/object/list/")) return json(route, []);
      return json(route, { Key: p });
    }
    return json(route, { message: `unmocked ${req.method()} ${p}` }, 404);
  });
  return state;
}
