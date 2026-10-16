// @vitest-environment happy-dom
// Sign-in and profile islands with a fake Supabase client (lib/auth/fake-supabase.ts): no network.
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { h } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseForTests } from "../../lib/auth/client";
import { fakeSupabase } from "../../lib/auth/fake-supabase";
import ProfileEdit from "../profile/ProfileEdit";
import ProfileView from "../profile/ProfileView";
import VerifyAccount from "../profile/VerifyAccount";
import AccountPanel from "./AccountPanel";
import Login from "./Login";

const ME = "11111111-1111-1111-1111-111111111111";
const BOB = "22222222-2222-2222-2222-222222222222";
const bob = { id: BOB, handle: "bob", display_name: "Bob", bio: "Farmer in 1234", kingdom_number: 1234, avatar_path: null, banner_path: null, visibility: "public", verified_level: 3, created_at: "", updated_at: "" };

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  setSupabaseForTests(undefined);
});

describe("not configured (CI, previews today)", () => {
  it("login, profile and verify pages say accounts are off; the /me/ panel renders nothing", async () => {
    setSupabaseForTests(null);
    const { container } = render(h("div", null, h(Login, null), h(ProfileView, { handle: "bob" }), h(ProfileEdit, null), h(VerifyAccount, null), h(AccountPanel, null)));
    await waitFor(() => expect(container.querySelectorAll("[data-auth-off]")).toHaveLength(4));
    expect(container.querySelector("[data-account-panel]")).toBeNull();
  });
});

describe("login", () => {
  it("sends the e-mail link, then signs in with the 6-digit code", async () => {
    const f = fakeSupabase();
    setSupabaseForTests(f.client);
    const navigate = vi.fn();
    render(h(Login, { navigate }));
    const email = await screen.findByLabelText("E-mail");
    fireEvent.input(email, { target: { value: "p@example.test" } });
    fireEvent.click(screen.getByText("Receber um link de login por e-mail"));
    const code = await screen.findByLabelText("Código do e-mail");
    expect(f.calls[0]!.op).toBe("auth.signInWithOtp");
    fireEvent.input(code, { target: { value: "123456" } });
    fireEvent.click(screen.getByText("Entrar"));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/auth/callback/?next=%2Fme%2F"));
    expect(screen.getByText(/nunca pede a sua conta ou senha do Rise of Kingdoms ou da Lilith/)).toBeTruthy();
  });
  it("shows the error instead of moving on", async () => {
    setSupabaseForTests(fakeSupabase({ auth: { signInWithOtp: { message: "rate limit", status: 429 } } }).client);
    render(h(Login, null));
    fireEvent.input(await screen.findByLabelText("E-mail"), { target: { value: "p@example.test" } });
    fireEvent.click(screen.getByText("Receber um link de login por e-mail"));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Muitas tentativas/);
  });
});

describe("public profile view", () => {
  it("shows the card, the verification badge and achievements labelled by source", async () => {
    setSupabaseForTests(fakeSupabase({
      tables: {
        profiles: [bob],
        achievements: [{ id: "a", user_id: BOB, source: "self", code: "kvk", title: "Won KvK", detail: null, verified: false, earned_at: "2026" }],
      },
    }).client);
    render(h(ProfileView, { handle: "bob" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Bob" })).toBeTruthy();
    expect(screen.getByText("Posse comprovada")).toBeTruthy();
    expect(screen.getByText("Não verificada (autodeclarada)")).toBeTruthy();
    // Signed out: no report/block, a sign-in link instead.
    expect(screen.queryByText("Denunciar")).toBeNull();
    expect(screen.getByText("Entrar para denunciar ou bloquear")).toBeTruthy();
  });
  it("missing or private profile", async () => {
    setSupabaseForTests(fakeSupabase().client);
    const { container } = render(h(ProfileView, { handle: "ghost" }));
    await waitFor(() => expect(container.querySelector("[data-profile-missing]")).toBeTruthy());
  });
  it("signed in: report with a reason, then block", async () => {
    const f = fakeSupabase({ session: { user: { id: ME } }, tables: { profiles: [bob] } });
    setSupabaseForTests(f.client);
    render(h(ProfileView, { handle: "bob" }));
    fireEvent.click(await screen.findByText("Denunciar"));
    fireEvent.click(screen.getByText("Enviar denúncia"));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Escolha o que há de errado/);
    fireEvent.click(screen.getByLabelText("Uma criança pode estar em risco"));
    fireEvent.click(screen.getByText("Enviar denúncia"));
    await screen.findByText(/A denúncia foi enviada/);
    expect(f.tables.reports![0]).toMatchObject({ target_id: BOB, reason: "minor_safety" });
    fireEvent.click(screen.getByText("Bloquear"));
    fireEvent.click(screen.getAllByText("Bloquear").at(-1)!);
    await screen.findByText(/Você bloqueou este jogador/);
    expect(f.tables.blocks![0]).toMatchObject({ blocked_id: BOB });
  });
});

describe("profile editor", () => {
  it("saves a valid profile and refuses links in the bio", async () => {
    const f = fakeSupabase({ session: { user: { id: ME } }, tables: { profiles: [{ id: ME, handle: null, display_name: null, bio: null, kingdom_number: null, avatar_path: null, banner_path: null, visibility: "private", verified_level: 1 }] } });
    setSupabaseForTests(f.client);
    render(h(ProfileEdit, null));
    fireEvent.input(await screen.findByLabelText(/^Identificador/), { target: { value: "Alice" } });
    fireEvent.input(screen.getByLabelText(/^Bio/), { target: { value: "see https://spam.test" } });
    fireEvent.click(screen.getByText("Salvar perfil"));
    expect(await screen.findByText("Links não são permitidos na bio.")).toBeTruthy();
    expect(f.calls.some((c) => c.op === "profiles.upsert")).toBe(false);
    fireEvent.input(screen.getByLabelText(/^Bio/), { target: { value: "Farmer" } });
    fireEvent.click(screen.getByLabelText(/Qualquer pessoa com o link/));
    fireEvent.click(screen.getByText("Salvar perfil"));
    await screen.findByText("Perfil salvo.");
    expect(f.tables.profiles![0]).toMatchObject({ handle: "alice", bio: "Farmer", visibility: "public" });
  });
  it("offers this device's data once signed in, and the upload keeps it on the device", async () => {
    localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: "dark", profileCode: "1.0.1.0.12.30.....0" }));
    const f = fakeSupabase({ session: { user: { id: ME } }, tables: { profiles: [{ id: ME, visibility: "private", verified_level: 1 }] }, rpc: { claim_site_achievement: () => ({ data: false }) } });
    setSupabaseForTests(f.client);
    render(h(ProfileEdit, null));
    fireEvent.click(await screen.findByText("Enviar para a minha conta"));
    await screen.findByText(/Seus dados neste aparelho não mudaram/);
    expect(f.tables.local_imports).toHaveLength(1);
    expect(localStorage.getItem("ko:v1")).toContain("profileCode");
  });
  it("delete account needs APAGAR typed", async () => {
    const f = fakeSupabase({ session: { user: { id: ME } }, tables: { profiles: [{ id: ME, visibility: "private", verified_level: 1 }] }, rpc: { delete_my_account: () => ({ data: null }) } });
    setSupabaseForTests(f.client);
    const navigate = vi.fn();
    render(h(ProfileEdit, { navigate }));
    fireEvent.click(await screen.findByText("Apagar minha conta"));
    expect(await screen.findByText("Digite APAGAR para confirmar.")).toBeTruthy();
    fireEvent.input(screen.getByLabelText("Digite APAGAR para confirmar"), { target: { value: "apagar" } });
    fireEvent.click(screen.getByText("Apagar minha conta"));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/?account=deleted"));
    expect(f.calls.some((c) => c.op === "rpc.delete_my_account")).toBe(true);
  });
});

describe("verify this account", () => {
  it("starts a request and shows its code, the steps and the 1-hour countdown", async () => {
    const now = Date.parse("2026-10-13T12:00:00Z");
    const request = { id: "r1", user_id: ME, account_id: "c1", requested_level: 3, code: "042719", code_expires_at: "2026-10-13T13:00:00Z", status: "awaiting_screenshots" };
    const f = fakeSupabase({
      session: { user: { id: ME } },
      tables: { accounts: [{ id: "c1", user_id: ME, kind: "main", name: "Main", city_hall: 22, verification_level: 1, sort_order: 0 }] },
      rpc: { start_verification: () => { f.tables.verification_requests = [request]; return { data: request }; } },
    });
    setSupabaseForTests(f.client);
    const { container } = render(h(VerifyAccount, { now: () => now }));
    fireEvent.click(await screen.findByRole("button", { name: "Verificar esta conta" }));
    await waitFor(() => expect(container.querySelector('[data-code-card="042719"]'), container.textContent ?? "").toBeTruthy());
    expect(container.querySelector("[data-countdown]")!.textContent).toContain("60:00");
    expect(screen.getByText(/Perfil do Governador → Álbum → adicionar foto/)).toBeTruthy();
    expect(screen.getByText(/apagar a foto do seu Álbum/)).toBeTruthy();
    // Sending without screenshots is refused on the page.
    fireEvent.click(screen.getByText("Enviar para análise"));
    expect((await screen.findByText(/Envie primeiro os 3 prints/)).textContent).toBeTruthy();
    expect(f.calls.some((c) => c.op === "rpc.submit_verification")).toBe(false);
  });
});
