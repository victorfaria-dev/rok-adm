// Runs for every page at build time (static output) and in dev. Two jobs, both off unless needed:
// 1. Sign-in configured: put the route guard (lib/auth/guard.ts) in <head> of gated app areas.
// 2. Dev without sign-in configured: show a small "auth not configured" notice.
// Without Supabase settings the built HTML is byte-for-byte what it was before sign-in existed.
import { defineMiddleware } from "astro:middleware";
import { authConfigured } from "./lib/auth/config";
import { devNoticeHtml, guardScript } from "./lib/auth/guard";
import { isGatedPath } from "./lib/auth/paths";

export const onRequest = defineMiddleware(async (ctx, next) => {
  const res = await next();
  const configured = authConfigured();
  const gate = configured && isGatedPath(ctx.url.pathname);
  const notice = !configured && import.meta.env.DEV;
  if (!gate && !notice) return res;
  if (!(res.headers.get("content-type") ?? "").includes("text/html")) return res;
  let html = await res.text();
  if (gate) html = html.replace("</head>", `<script data-auth-guard>${guardScript()}</script></head>`);
  if (notice) html = html.replace("</body>", `${devNoticeHtml()}</body>`);
  return new Response(html, { status: res.status, statusText: res.statusText, headers: res.headers });
});
