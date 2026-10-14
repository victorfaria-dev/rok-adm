// Route guard for app areas (lib/auth/paths.ts). The site is static, so the guard is a tiny inline
// script in <head> of gated pages: before anything paints, it checks for a stored session and, when
// there is none, replaces the page with /login/?next=<this page>. src/middleware.ts adds it at build
// time, only when sign-in is configured. No Supabase code is loaded for this.
import { LOGIN_PATH } from "./paths";
import { AUTH_STORAGE_KEY } from "./session";

/** Attribute set on <html> while redirecting; CSS in the same script hides the page meanwhile. */
export const REDIRECTING_ATTR = "data-auth-redirect";

/**
 * The inline guard. Kept in sync with readSessionHint (session.ts): a session counts when it has a
 * refresh token and a user id. Storage blocked → treated as signed out (sign-in would fail too, and
 * the login page says why).
 */
export function guardScript(): string {
  const key = JSON.stringify(AUTH_STORAGE_KEY);
  const login = JSON.stringify(LOGIN_PATH);
  const attr = JSON.stringify(REDIRECTING_ATTR);
  return `(function(){try{var r=localStorage.getItem(${key});if(r){var s=JSON.parse(r);if(s&&s.currentSession)s=s.currentSession;if(s&&typeof s.refresh_token==="string"&&s.refresh_token&&s.user&&typeof s.user.id==="string")return}}catch(e){}var d=document.documentElement;d.setAttribute(${attr},"");var st=document.createElement("style");st.textContent="html[${REDIRECTING_ATTR}] body{visibility:hidden}";d.appendChild(st);location.replace(${login}+"?next="+encodeURIComponent(location.pathname+location.search+location.hash))})();`;
}

/** Dev-only banner when sign-in is not configured (gating is off). Tokens only. */
export function devNoticeHtml(): string {
  return `<div role="note" data-auth-dev-notice style="position:fixed;z-index:200;right:var(--ko-space-2);bottom:calc(var(--ko-space-20) + env(safe-area-inset-bottom, 0px));max-width:min(320px,calc(100vw - var(--ko-space-4)));padding:var(--ko-space-2) var(--ko-space-3);background:var(--ko-surface-raised);color:var(--ko-text);border:1px dashed var(--ko-warning);border-radius:var(--ko-radius-md);font:var(--ko-text-xs)/1.4 var(--ko-font-mono);pointer-events:none;">Dev: auth not configured. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in apps/web/.env to turn on sign-in and the route guard.</div>`;
}
