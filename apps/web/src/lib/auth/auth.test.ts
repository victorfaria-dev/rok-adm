import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { callbackUrl, completeCallback, friendlyError, isEmail, sendEmailSignIn, signInWithGoogle, signOut, verifyEmailCode } from "./actions";
import { AUTH_CONFIG, readAuthConfig } from "./config";
import { fakeSupabase } from "./fake-supabase";
import { REDIRECTING_ATTR, devNoticeHtml, guardScript } from "./guard";
import { GATED_PREFIXES, handleFromLocation, isGatedPath, loginHref, safeNext } from "./paths";
import { AUTH_STORAGE_KEY, hasStoredSession, readSessionHint } from "./session";

const store = (v: string | null) => ({ getItem: (k: string) => (k === AUTH_STORAGE_KEY ? v : null) });
const SESSION = JSON.stringify({ access_token: "a", refresh_token: "r", expires_at: 9999999999, user: { id: "u1", email: "p@example.test" } });

describe("config", () => {
  it("is off without both values (CI, previews, local)", () => {
    expect(readAuthConfig({})).toBeNull();
    expect(readAuthConfig({ PUBLIC_SUPABASE_URL: "https://x.supabase.co" })).toBeNull();
    expect(readAuthConfig({ PUBLIC_SUPABASE_ANON_KEY: "k" })).toBeNull();
    expect(readAuthConfig({ PUBLIC_SUPABASE_URL: " ", PUBLIC_SUPABASE_ANON_KEY: "k" })).toBeNull();
    // The test run itself has no keys: the site behaves as before accounts existed.
    expect(AUTH_CONFIG).toBeNull();
  });
  it("accepts https and local http only, and keeps just the origin", () => {
    expect(readAuthConfig({ PUBLIC_SUPABASE_URL: "https://abc.supabase.co/", PUBLIC_SUPABASE_ANON_KEY: " key " })).toEqual({ url: "https://abc.supabase.co", anonKey: "key" });
    expect(readAuthConfig({ PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", PUBLIC_SUPABASE_ANON_KEY: "k" })?.url).toBe("http://127.0.0.1:54321");
    expect(readAuthConfig({ PUBLIC_SUPABASE_URL: "http://abc.supabase.co", PUBLIC_SUPABASE_ANON_KEY: "k" })).toBeNull();
    expect(readAuthConfig({ PUBLIC_SUPABASE_URL: "not a url", PUBLIC_SUPABASE_ANON_KEY: "k" })).toBeNull();
  });
  it("keeps keys out of the repo: .env.example has empty values", () => {
    const ex = readFileSync(new URL("../../../.env.example", import.meta.url), "utf8");
    expect(ex).toMatch(/^PUBLIC_SUPABASE_URL=$/m);
    expect(ex).toMatch(/^PUBLIC_SUPABASE_ANON_KEY=$/m);
  });
});

describe("paths", () => {
  it("gates app areas and leaves the landing page, guides and sign-in public", () => {
    for (const p of ["/me/", "/me/profile/", "/tools/vip/", "/kingdom/rules/", "/routine", "/city-hall/", "/members/", "/events/x/"]) expect(isGatedPath(p), p).toBe(true);
    for (const p of ["/", "/guide/", "/guides/", "/guides/farms/food/", "/login/", "/auth/callback/", "/u/", "/u/bob/", "/trust/", "/brand/", "/glossary/"]) expect(isGatedPath(p), p).toBe(false);
    expect(isGatedPath("/meadow/")).toBe(false);
    expect(GATED_PREFIXES.every((g) => g.startsWith("/") && g.endsWith("/"))).toBe(true);
  });
  it("only follows same-site next paths", () => {
    expect(safeNext("/tools/vip/?a=1#x")).toBe("/tools/vip/?a=1#x");
    for (const bad of ["https://evil.test/", "//evil.test/", "/\\evil.test", "javascript:alert(1)", "", null, "/login/?next=/me/", "/auth/callback/"]) {
      expect(safeNext(bad as string | null), String(bad)).toBe("/me/");
    }
    expect(loginHref("/me/?x=1")).toBe("/login/?next=%2Fme%2F%3Fx%3D1");
  });
  it("reads the handle from /u/<handle>/ or ?h=", () => {
    expect(handleFromLocation("/u/Bob_1/", "")).toBe("bob_1");
    expect(handleFromLocation("/u/", "?h=%40alice")).toBe("alice");
    expect(handleFromLocation("/u/", "")).toBeNull();
    expect(handleFromLocation("/u/a/", "")).toBeNull();
    expect(handleFromLocation("/u/%3Cscript%3E/", "")).toBeNull();
  });
});

describe("session hint", () => {
  it("needs a refresh token and a user id", () => {
    expect(readSessionHint(store(SESSION))).toEqual({ userId: "u1", email: "p@example.test" });
    expect(hasStoredSession(store(JSON.stringify({ currentSession: JSON.parse(SESSION) })))).toBe(true);
    expect(hasStoredSession(store(null))).toBe(false);
    expect(hasStoredSession(store("{bad"))).toBe(false);
    expect(hasStoredSession(store(JSON.stringify({ refresh_token: "", user: { id: "u" } })))).toBe(false);
    expect(hasStoredSession({ getItem: () => { throw new Error("blocked"); } })).toBe(false);
  });
});

describe("route guard script", () => {
  function run(stored: string | null) {
    let replaced: string | null = null;
    const attrs: string[] = [];
    const doc = {
      documentElement: { setAttribute: (a: string) => attrs.push(a), appendChild: () => undefined },
      createElement: () => ({ textContent: "" }),
    };
    const loc = { pathname: "/tools/vip/", search: "?x=1", hash: "", replace: (u: string) => { replaced = u; } };
    new Function("localStorage", "document", "location", guardScript())(store(stored), doc, loc);
    return { replaced, attrs };
  }
  it("lets a stored session through", () => {
    expect(run(SESSION).replaced).toBeNull();
  });
  it("sends everyone else to /login/ with next, hiding the page meanwhile", () => {
    const r = run(null);
    expect(r.replaced).toBe("/login/?next=%2Ftools%2Fvip%2F%3Fx%3D1");
    expect(r.attrs).toContain(REDIRECTING_ATTR);
    expect(run("garbage").replaced).toMatch(/^\/login\//);
  });
  it("dev notice uses tokens only", () => {
    expect(devNoticeHtml()).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(devNoticeHtml()).toContain("auth not configured");
  });
});

describe("sign-in actions (fake client, no network)", () => {
  it("checks e-mails", () => {
    expect(isEmail("a@b.co")).toBe(true);
    expect(isEmail("a@b")).toBe(false);
    expect(isEmail("not an email")).toBe(false);
  });
  it("e-mail link points to the callback with a safe next", async () => {
    const f = fakeSupabase();
    expect(await sendEmailSignIn(f.client, " p@example.test ", "/tools/", "https://k.test")).toEqual({ ok: true });
    expect(f.calls[0]).toEqual({ op: "auth.signInWithOtp", args: [{ email: "p@example.test", options: { emailRedirectTo: "https://k.test/auth/callback/?next=%2Ftools%2F", shouldCreateUser: true } }] });
    expect(callbackUrl("https://k.test", "https://evil.test")).toBe("https://k.test/auth/callback/?next=%2Fme%2F");
    expect((await sendEmailSignIn(f.client, "nope", "/", "https://k.test")).ok).toBe(false);
    expect(f.calls).toHaveLength(1);
  });
  it("6-digit code and Google", async () => {
    const f = fakeSupabase({ auth: { verifyOtp: { message: "Token has expired or is invalid" } } });
    const r = await verifyEmailCode(f.client, "p@example.test", "12 34 56");
    expect(r).toEqual({ ok: false, message: "That code or link has expired or was already used. Ask for a new one." });
    expect(f.calls[0]!.args[0]).toEqual({ email: "p@example.test", token: "123456", type: "email" });
    expect((await verifyEmailCode(f.client, "p@example.test", "abc")).ok).toBe(false);
    await signInWithGoogle(f.client, "/me/", "https://k.test");
    expect(f.calls.at(-1)).toEqual({ op: "auth.signInWithOAuth", args: [{ provider: "google", options: { redirectTo: "https://k.test/auth/callback/?next=%2Fme%2F" } }] });
  });
  it("callback exchanges the code and keeps next safe; provider errors are shown", async () => {
    const f = fakeSupabase();
    expect(await completeCallback(f.client, "https://k.test/auth/callback/?code=abc&next=%2Ftools%2F")).toEqual({ ok: true, next: "/tools/" });
    expect(f.calls[0]).toEqual({ op: "auth.exchangeCodeForSession", args: ["abc"] });
    const bad = await completeCallback(f.client, "https://k.test/auth/callback/?error_description=Access+denied&next=https://evil.test");
    expect(bad).toMatchObject({ ok: false, next: "/me/" });
    const none = await completeCallback(f.client, "https://k.test/auth/callback/");
    expect(none.ok).toBe(false);
    const signedIn = fakeSupabase({ session: { user: { id: "u1" } } });
    expect(await completeCallback(signedIn.client, "https://k.test/auth/callback/?next=/me/profile/")).toEqual({ ok: true, next: "/me/profile/" });
  });
  it("signs out on this device only", async () => {
    const f = fakeSupabase({ session: { user: { id: "u1" } } });
    expect(await signOut(f.client)).toEqual({ ok: true });
    expect(f.calls[0]).toEqual({ op: "auth.signOut", args: [{ scope: "local" }] });
  });
  it("friendly errors", () => {
    expect(friendlyError({ message: "x", status: 429 })).toMatch(/Too many/);
    expect(friendlyError(new TypeError("Failed to fetch"))).toMatch(/No connection/);
    expect(friendlyError({ message: "both auth code and code verifier should be non-empty" })).toMatch(/same browser/);
  });
});
