export type IconName = "guide" | "routine" | "commanders" | "you";

export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the 80 px tablet rail. */
  short: string;
  icon: IconName;
}

/** The 4 destinations, same on every screen size (plano-app-shell.md §3). */
export const DESTINATIONS: readonly NavItem[] = [
  { href: "/guide/", label: "Guide", short: "Guide", icon: "guide" },
  { href: "/routine/", label: "Routine", short: "Routine", icon: "routine" },
  { href: "/commanders/", label: "Commanders", short: "Cmdrs", icon: "commanders" },
  { href: "/me/", label: "You", short: "You", icon: "you" },
];

export const SECONDARY: readonly { href: string; label: string }[] = [
  { href: "/guides/new-kingdom/", label: "New kingdom guide" },
  { href: "/trust/", label: "Trust & privacy" },
  { href: "/farms/", label: "Farms" },
];

const norm = (p: string): string => (p.endsWith("/") ? p : `${p}/`);

/** A destination is active on its own path and on any sub-path. */
export function isActive(href: string, pathname: string): boolean {
  const h = norm(href), p = norm(pathname);
  return p === h || p.startsWith(h);
}
