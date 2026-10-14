// Site navigation (UX stage 1, produto/roadmap-autonomo.md "Etapa UX 1"): two tab sets, one per
// "Playing as" choice. Both are rendered on every page; <html data-role> (set before paint by
// ROLE_BOOT_SCRIPT in lib/role.ts) shows one of them. Labels are English and live here only.
import type { PlayingAs } from "./store";

export type IconName = "cityhall" | "tools" | "you" | "kingdom" | "members" | "events";

export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the 80 px tablet rail. */
  short: string;
  icon: IconName;
  /** Path prefixes that belong to this tab (the longest match across the set wins). */
  match: readonly string[];
}

/**
 * Guide content, wherever its URL lives. Guides are public and are not a tab: they open from a row
 * on Me (and from the landing page and links), so these paths mark the Me tab.
 */
export const GUIDE_PATHS: readonly string[] = ["/guides/", "/guide/", "/commanders/", "/glossary/", "/changes/", "/tools/safety/", "/tools/zeroed/"];

/** Player: City Hall · Tools · Me. */
export const PLAYER_NAV: readonly NavItem[] = [
  { href: "/city-hall/", label: "City Hall", short: "City Hall", icon: "cityhall", match: ["/city-hall/", "/routine/"] },
  { href: "/tools/", label: "Tools", short: "Tools", icon: "tools", match: ["/tools/", "/farms/"] },
  { href: "/me/", label: "Me", short: "Me", icon: "you", match: ["/me/", "/start/", "/card/", "/crest/", ...GUIDE_PATHS] },
];

/** Leader: Kingdom · Members · Events · Me. */
export const LEADER_NAV: readonly NavItem[] = [
  { href: "/kingdom/", label: "Kingdom", short: "Kingdom", icon: "kingdom", match: ["/kingdom/", "/crest/"] },
  { href: "/kingdom/requirements/", label: "Members", short: "Members", icon: "members", match: ["/kingdom/requirements/", "/kingdom/recruit/", "/kingdom/my/"] },
  { href: "/kingdom/mge/", label: "Events", short: "Events", icon: "events", match: ["/kingdom/mge/", "/tools/kvk/"] },
  { href: "/me/", label: "Me", short: "Me", icon: "you", match: ["/me/", "/start/", "/card/", ...GUIDE_PATHS] },
];

export const NAVS: Readonly<Record<PlayingAs, readonly NavItem[]>> = { player: PLAYER_NAV, leader: LEADER_NAV };

/** Each role's home tab: where the landing page and the end of onboarding send a returning visitor. */
export const HOME_FOR: Readonly<Record<PlayingAs, string>> = { player: "/city-hall/", leader: "/kingdom/" };

/** Off-nav pages, linked once from the footer. */
export const FOOTER_LINKS: readonly { href: string; label: string }[] = [
  { href: "/?about", label: "About KingdomOps" },
  { href: "/trust/", label: "Trust & privacy" },
  { href: "/brand/", label: "Brand" },
];

const norm = (p: string): string => (p.endsWith("/") ? p : `${p}/`);

/** A path is under a prefix on the prefix itself and on any sub-path. */
export function isActive(href: string, pathname: string): boolean {
  const h = norm(href), p = norm(pathname);
  return p === h || p.startsWith(h);
}

/** The tab of `nav` that owns `pathname` (longest matching prefix), or null (e.g. the landing page). */
export function activeTab(nav: readonly NavItem[], pathname: string): string | null {
  let best: { href: string; len: number } | null = null;
  for (const item of nav) {
    for (const m of item.match) {
      if (isActive(m, pathname) && (!best || m.length > best.len)) best = { href: item.href, len: m.length };
    }
  }
  return best?.href ?? null;
}
