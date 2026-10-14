// The one Supabase client, loaded on demand. `@supabase/supabase-js` is only reached through the
// dynamic import below, so it is a lazy chunk: never in the "/" bundle and never on a page until
// something asks for the client (scripts/check-budget.ts caps the chunk). Without configuration
// (lib/auth/config.ts) getSupabase() resolves to null and nothing is downloaded.
import type { SupabaseClient } from "@supabase/supabase-js";
import { AUTH_CONFIG, type AuthConfig } from "./config";
import type { Database } from "./database.types";
import { AUTH_STORAGE_KEY } from "./session";

export type KoSupabase = SupabaseClient<Database>;

let pending: Promise<KoSupabase | null> | null = null;
let override: KoSupabase | null | undefined;

/** Options shared by every client: PKCE (code in the callback URL, no tokens in the hash), session in ko:auth:v1. */
export function clientOptions() {
  return {
    auth: {
      storageKey: AUTH_STORAGE_KEY,
      flowType: "pkce" as const,
      persistSession: true,
      autoRefreshToken: true,
      // /auth/callback/ exchanges the code itself, so other pages never touch the URL.
      detectSessionInUrl: false,
    },
  };
}

async function create(cfg: AuthConfig): Promise<KoSupabase> {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient<Database>(cfg.url, cfg.anonKey, clientOptions());
}

/** The shared client, or null when sign-in is not configured. Rejects only if the chunk fails to load. */
export function getSupabase(): Promise<KoSupabase | null> {
  if (override !== undefined) return Promise.resolve(override);
  if (!AUTH_CONFIG) return Promise.resolve(null);
  pending ??= create(AUTH_CONFIG).catch((e: unknown) => {
    pending = null; // let a later call retry (offline, chunk failed)
    throw e;
  });
  return pending;
}

/** Tests: use a fake client (or null for "not configured"); undefined restores the real one. */
export function setSupabaseForTests(client: KoSupabase | null | undefined): void {
  override = client;
  pending = null;
}
