import type { ThemePref } from "./store";

/** Value for <html data-theme>; null means "follow the system" (tokens use prefers-color-scheme). */
export function themeAttribute(pref: ThemePref): "dark" | "light" | null {
  return pref === "system" ? null : pref;
}

export function applyTheme(pref: ThemePref, root: HTMLElement = document.documentElement): void {
  const attr = themeAttribute(pref);
  if (attr) root.setAttribute("data-theme", attr);
  else root.removeAttribute("data-theme");
  syncThemeColor(root);
}

/** Keep <meta name="theme-color"> equal to the current --ko-background. */
export function syncThemeColor(root: HTMLElement = document.documentElement): void {
  const meta = document.querySelector('meta[name="theme-color"]');
  const bg = getComputedStyle(root).getPropertyValue("--ko-background").trim();
  if (meta && bg) meta.setAttribute("content", bg);
}

/**
 * Inline <head> script, runs before CSS so the first paint already has the right theme.
 * Mirrors readStore + themeAttribute; keep in sync (tested in theme.test.ts).
 */
export const THEME_BOOT_SCRIPT =
  `(function(){var t="dark";try{var s=JSON.parse(localStorage.getItem("ko:v1")||"null");` +
  `if(s&&s.v===1&&(s.theme==="light"||s.theme==="system"||s.theme==="dark"))t=s.theme}catch(e){}` +
  `if(t!=="system")document.documentElement.setAttribute("data-theme",t)})();`;
