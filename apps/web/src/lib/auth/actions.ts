// Sign-in, callback and sign-out. Every function takes the client, so tests pass a fake (no network).
// Providers: e-mail (one link + a 6-digit code in the same e-mail) and Google. There is no Lilith /
// game login and the site never asks for game credentials.
import type { KoSupabase } from "./client";
import { CALLBACK_PATH, safeNext } from "./paths";

export type ActionResult = { ok: true } | { ok: false; message: string };

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmail(s: string): boolean {
  return s.length <= 254 && EMAIL_RE.test(s.trim());
}

/** The callback URL Supabase sends people back to; must be in the project's redirect allow list. */
export function callbackUrl(origin: string, next: string): string {
  return `${origin}${CALLBACK_PATH}?next=${encodeURIComponent(safeNext(next))}`;
}

/** Plain-language text for the errors people actually hit. */
export function friendlyError(e: unknown): string {
  const msg = typeof e === "object" && e !== null && "message" in e ? String((e as { message: unknown }).message) : String(e ?? "");
  const status = typeof e === "object" && e !== null && "status" in e ? Number((e as { status: unknown }).status) : 0;
  if (status === 429 || /rate limit|too many/i.test(msg)) return "Muitas tentativas. Espere um minuto e tente de novo.";
  if (/expired|invalid.*(token|otp|code)|token.*(expired|invalid)/i.test(msg)) return "Esse código ou link expirou ou já foi usado. Peça um novo.";
  if (/code verifier|both auth code and code verifier/i.test(msg)) return "Abra o link de login no mesmo navegador em que você o pediu ou digite o código de 6 dígitos.";
  if (/failed to fetch|network|load failed/i.test(msg)) return "Sem conexão com o serviço de login. Verifique sua internet e tente de novo.";
  if (/provider is not enabled|unsupported provider/i.test(msg)) return "Esta opção de login ainda não está ativada.";
  return msg ? `O login falhou: ${msg}` : "O login falhou. Tente de novo.";
}

export async function sendEmailSignIn(client: KoSupabase, email: string, next: string, origin: string): Promise<ActionResult> {
  if (!isEmail(email)) return { ok: false, message: "Digite um e-mail válido." };
  try {
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl(origin, next), shouldCreateUser: true },
    });
    return error ? { ok: false, message: friendlyError(error) } : { ok: true };
  } catch (e) {
    return { ok: false, message: friendlyError(e) };
  }
}

/** The 6-digit code from the same e-mail; works on any device (the link needs the same browser). */
export async function verifyEmailCode(client: KoSupabase, email: string, code: string): Promise<ActionResult> {
  const token = code.replace(/\s+/g, "");
  if (!/^\d{6,10}$/.test(token)) return { ok: false, message: "Digite o código do e-mail (só números)." };
  try {
    const { error } = await client.auth.verifyOtp({ email: email.trim(), token, type: "email" });
    return error ? { ok: false, message: friendlyError(error) } : { ok: true };
  } catch (e) {
    return { ok: false, message: friendlyError(e) };
  }
}

/** Leaves the page for Google; comes back to /auth/callback/. */
export async function signInWithGoogle(client: KoSupabase, next: string, origin: string): Promise<ActionResult> {
  try {
    const { error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl(origin, next) } });
    return error ? { ok: false, message: friendlyError(error) } : { ok: true };
  } catch (e) {
    return { ok: false, message: friendlyError(e) };
  }
}

export type CallbackResult = { ok: true; next: string } | { ok: false; message: string; next: string };

/** /auth/callback/: turn ?code= into a session (PKCE). Also reads the provider's error, if any. */
export async function completeCallback(client: KoSupabase, href: string): Promise<CallbackResult> {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const next = safeNext(url.searchParams.get("next"));
  const providerError = url.searchParams.get("error_description") ?? hash.get("error_description");
  if (providerError) return { ok: false, message: friendlyError({ message: providerError }), next };
  const code = url.searchParams.get("code");
  try {
    if (code) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) return { ok: false, message: friendlyError(error), next };
      return { ok: true, next };
    }
    const { data } = await client.auth.getSession();
    return data.session ? { ok: true, next } : { ok: false, message: "Este link de login está incompleto. Comece de novo pela página de login.", next };
  } catch (e) {
    return { ok: false, message: friendlyError(e), next };
  }
}

/** Sign out on this device (other devices stay signed in). Local data on the device is kept. */
export async function signOut(client: KoSupabase): Promise<ActionResult> {
  try {
    const { error } = await client.auth.signOut({ scope: "local" });
    return error ? { ok: false, message: friendlyError(error) } : { ok: true };
  } catch (e) {
    return { ok: false, message: friendlyError(e) };
  }
}
