// "Playing as: Player / Leader" (UX stage 1). Saved in the ko:v1 store (StoreV1.playingAs) and
// mirrored on <html data-role>, which picks the tab set (Shell.astro) before the first paint.
import { HOME_FOR } from "./nav";
import { PLAYING_AS, readStore, writeStore, type PlayingAs } from "./store";

export const ROLE_LABEL: Readonly<Record<PlayingAs, string>> = { player: "Player", leader: "Leader" };

export const isPlayingAs = (x: unknown): x is PlayingAs => PLAYING_AS.includes(x as PlayingAs);

/**
 * Inline <head> script: sets <html data-role> from the store before CSS paints the tabs.
 * Mirrors parseStore for this one field; keep in sync (tested in role.test.ts).
 */
export const ROLE_BOOT_SCRIPT =
  `(function(){var r="player";try{var s=JSON.parse(localStorage.getItem("ko:v1")||"null");` +
  `if(s&&s.v===1&&s.playingAs==="leader")r="leader"}catch(e){}` +
  `document.documentElement.setAttribute("data-role",r)})();`;

/**
 * Inline <head> script for the landing page: a returning visitor (saved profile) goes straight to
 * their role's home tab. "/?about" always shows the landing page (footer link).
 */
export const LANDING_REDIRECT_SCRIPT =
  `(function(){try{if(/[?&]about\\b/.test(location.search))return;var s=JSON.parse(localStorage.getItem("ko:v1")||"null");` +
  `if(s&&s.v===1&&typeof s.profileCode==="string"&&s.profileCode)` +
  `location.replace(s.playingAs==="leader"?${JSON.stringify(HOME_FOR.leader)}:${JSON.stringify(HOME_FOR.player)})}catch(e){}})();`;

export function readPlayingAs(): PlayingAs {
  return readStore().playingAs;
}

/** Save the role and swap the tab set on this page at once. */
export function setPlayingAs(role: PlayingAs, root: HTMLElement | null = typeof document === "undefined" ? null : document.documentElement): void {
  writeStore({ playingAs: role });
  root?.setAttribute("data-role", role);
}
