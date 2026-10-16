// Supabase settings come only from the build environment (PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY;
// see apps/web/.env.example and supabase/README.md). Never put keys in the repository.
// When either is missing (CI, local, previews today) sign-in is off and the site works as before:
// no route guard, no Supabase code loaded.
// This module has no imports, so any island or inline check can use it without pulling Supabase in.

export interface AuthConfig {
  url: string;
  anonKey: string;
}

/** Read and check the two values; null when sign-in is not configured. */
export function readAuthConfig(env: { PUBLIC_SUPABASE_URL?: unknown; PUBLIC_SUPABASE_ANON_KEY?: unknown }): AuthConfig | null {
  const url = typeof env.PUBLIC_SUPABASE_URL === "string" ? env.PUBLIC_SUPABASE_URL.trim() : "";
  const anonKey = typeof env.PUBLIC_SUPABASE_ANON_KEY === "string" ? env.PUBLIC_SUPABASE_ANON_KEY.trim() : "";
  if (!url || !anonKey) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) return null;
  return { url: parsed.origin, anonKey };
}

/** Inlined at build time by Vite. */
export const AUTH_CONFIG: AuthConfig | null = readAuthConfig({
  PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
});

export const authConfigured = (): boolean => AUTH_CONFIG !== null;
