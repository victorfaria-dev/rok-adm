// Which routes need a signed-in user, and where sign-in sends people back to. No imports: used by
// src/middleware.ts at build time and by islands.
//
// Public without login (owner decision 2026-10-13): the landing page "/", every guide ("/guide/",
// "/guides/*"), sign-in itself, public profiles ("/u/*", each profile has its own visibility),
// and the site pages (trust, brand, glossary, changes, more, 404). Everything else that holds the
// player's own data is an app area and is gated when sign-in is configured.

/** App areas. A path is gated when it is one of these or below one. Edit here to gate a new area. */
export const GATED_PREFIXES: readonly string[] = [
  "/city-hall/", // City Hall (navigation stage UX 1)
  "/tools/",
  "/me/",
  "/kingdom/", // Kingdom (leader)
  "/members/", // Members (leader)
  "/events/", // Events (leader)
  // Current app areas until the navigation restructure moves them under City Hall / Me:
  "/routine/",
  "/commanders/",
  "/farms/",
  "/card/",
  "/crest/",
];

export const LOGIN_PATH = "/login/";
export const CALLBACK_PATH = "/auth/callback/";
/** Where a sign-in without a "next" lands. The navigation agent may point this at City Hall. */
export const DEFAULT_AFTER_LOGIN = "/me/";

const withSlash = (p: string): string => (p.endsWith("/") ? p : `${p}/`);

export function isGatedPath(pathname: string): boolean {
  const p = withSlash(pathname.split(/[?#]/, 1)[0] ?? "/");
  return GATED_PREFIXES.some((g) => p === g || p.startsWith(g));
}

/**
 * The "next" value from a sign-in link, kept only when it is a path on this site (no other origin,
 * no protocol-relative "//", no backslash tricks) and not the sign-in pages themselves.
 */
export function safeNext(raw: string | null | undefined, fallback: string = DEFAULT_AFTER_LOGIN): string {
  if (!raw || typeof raw !== "string") return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || /[\u0000-\u001f]/.test(raw)) return fallback;
  let u: URL;
  try {
    u = new URL(raw, "https://kingdomops.invalid");
  } catch {
    return fallback;
  }
  if (u.origin !== "https://kingdomops.invalid") return fallback;
  if (u.pathname.startsWith(LOGIN_PATH) || u.pathname.startsWith("/auth/")) return fallback;
  return `${u.pathname}${u.search}${u.hash}`;
}

export function loginHref(next: string): string {
  return `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;
}

/** Public profile URL. Netlify serves /u/<handle>/ from the /u/ shell; /u/?h=<handle> works everywhere. */
export function profileHref(handle: string): string {
  return `/u/${encodeURIComponent(handle)}/`;
}

/** The handle a /u/ page is showing: from /u/<handle>/ or from ?h=<handle>. */
export function handleFromLocation(pathname: string, search: string): string | null {
  const m = /^\/u\/([^/]+)\/?$/.exec(pathname);
  let raw: string | null = m ? m[1]! : new URLSearchParams(search).get("h");
  if (!raw) return null;
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const h = raw.trim().toLowerCase().replace(/^@/, "");
  return /^[a-z0-9_]{3,20}$/.test(h) ? h : null;
}
