// Guide directory (client-safe: no data imports). One entry per guide page; the
// /guides/ index lists them, the static guide pages are generated from the
// entries with a `slug`, and the personal guide links them from "Guides for you".
import { deltaSetsFor, guidesForProfile, type AccountProfile, type GuideSetId, type GuideSituation } from "@rokadm/core";

export interface GuidePage {
  /** Blocks set in guides/data (`blocks.<set>.json`). */
  set: GuideSetId | "farms";
  href: string;
  /** Path segment under /guides/ for the static guide pages built by guides/[slug].astro. */
  slug?: string;
  title: string;
  /** One line: what the guide is. */
  summary: string;
  /** One line: who it is for. */
  audience: string;
}

export const GUIDE_PAGES: readonly GuidePage[] = [
  {
    set: "f2p",
    href: "/guide/",
    title: "Your guide",
    summary: "The step-by-step plan from day 0 to KvK1, with a budget reality check.",
    audience: "Every account. It filters to your spending, play time and City Hall once you answer 10 questions.",
  },
  {
    set: "newkingdom",
    href: "/guides/new-kingdom/",
    title: "New kingdom guide",
    summary: "Survive day 1 of a new kingdom and set up the first two weeks.",
    audience: "Players in a kingdom that opened in the last 14 days.",
  },
  {
    set: "first30",
    href: "/guides/first-30-days/",
    slug: "first-30-days",
    title: "Your first 30 days",
    summary: "Goals and one key concept for each stretch of your first month.",
    audience: "New players, up to about City Hall 16.",
  },
  {
    set: "low",
    href: "/guides/low-spender/",
    slug: "low-spender",
    title: "Low spender guide",
    summary: "What changes when you buy only the Growth Fund and the 30-day gem supply.",
    audience: "Pass-only Low spenders. These steps add to or replace steps in your guide.",
  },
  {
    set: "returning",
    href: "/guides/returning/",
    slug: "returning",
    title: "Coming back to the game",
    summary: "What changed while you were away, a 14-day catch-up plan, and stay, migrate or restart.",
    audience: "Players returning after a break of weeks or more.",
  },
  {
    set: "recovery",
    href: "/guides/recovery/",
    slug: "recovery",
    title: "Recovering after being zeroed",
    summary: "The first hour, the first two weeks, and a log-off risk checklist.",
    audience: "Anyone who just lost most of their troops or resources to an attack.",
  },
  {
    set: "kingdomadmin",
    href: "/guides/kingdom-admin/",
    slug: "kingdom-admin",
    title: "Kingdom administration",
    summary: "Rules, DKP, KvK and MGE preparation, migration and failure points.",
    audience: "Kings, council members and alliance leaders.",
  },
  {
    set: "farms",
    href: "/guides/farms/",
    title: "Farm accounts",
    summary: "Whether to run a farm, which one, how to build it and how to send resources.",
    audience: "Players thinking about a second account to feed their main.",
  },
];

/** The guide pages built from guides/[slug].astro. */
export const STATIC_GUIDES: readonly (GuidePage & { slug: string })[] = GUIDE_PAGES.filter(
  (g): g is GuidePage & { slug: string } => g.slug !== undefined,
);

export function guidePage(set: GuidePage["set"]): GuidePage {
  const g = GUIDE_PAGES.find((p) => p.set === set);
  if (!g) throw new Error(`no guide page for ${set}`);
  return g;
}

export interface GuideLink {
  set: GuidePage["set"];
  href: string;
  title: string;
  /** Why it is offered, English. */
  reason: string;
}

/**
 * "Guides for you" on the personal guide: core's guidesForProfile without the base
 * guide (that is the page the strip sits on), most specific first (a returning
 * player sees Returning first). Low and higher profiles also get the Low spender
 * page, whose steps their guide already merges in.
 */
export function guidesForYou(profile: AccountProfile, situation: GuideSituation = {}): GuideLink[] {
  const out: GuideLink[] = guidesForProfile(profile, situation)
    .filter((g) => g.set.kind === "guide")
    .map((g) => {
      const page = guidePage(g.set.id);
      return { set: page.set, href: page.href, title: page.title, reason: g.reason };
    });
  if (hasLowDelta(profile)) {
    const page = guidePage("low");
    out.push({ set: "low", href: page.href, title: page.title, reason: "Its steps are already merged into your guide below; read them on their own here." });
  }
  return out;
}

/** True when the profile's guide merges the Low spender delta (Low and every profile above it). */
export function hasLowDelta(profile: AccountProfile): boolean {
  return deltaSetsFor(profile.spending).some((d) => d.id === "low");
}

/** Without a profile (the default guide): the situational guides, each with who it is for. */
export function defaultGuideLinks(): GuideLink[] {
  return (["newkingdom", "first30", "returning", "recovery"] as const).map((set) => {
    const p = guidePage(set);
    return { set, href: p.href, title: p.title, reason: p.audience };
  });
}
