// The /tools/ hub list (client-safe, no data). Each entry is a page shipped in wave D.
export interface ToolEntry {
  href: string;
  title: string;
  blurb: string;
  /** Feature ids in produto/arvore-funcionalidades.md. */
  features: string[];
  group: "calculators" | "plan" | "learn";
}

export const TOOLS: readonly ToolEntry[] = [
  { href: "/tools/vip/", title: "Gems to VIP", blurb: "Points, gems and days to your next VIP level.", features: ["F-21"], group: "calculators" },
  { href: "/tools/gems/", title: "Gem value table", blurb: "What each gem use buys: VIP, Action Points, VIP Shop items.", features: ["F-21"], group: "calculators" },
  { href: "/tools/speedups/", title: "Speedups and time", blurb: "Add up your speedups and compare them with a job's time.", features: ["F-81"], group: "calculators" },
  { href: "/tools/buildings/", title: "Building costs", blurb: "Resources and raw time from one level to another, any building.", features: ["F-81"], group: "calculators" },
  { href: "/tools/healing/", title: "Healing planner", blurb: "Hospital capacity and what one full hospital costs to heal.", features: ["F-22"], group: "calculators" },
  { href: "/tools/pack-value/", title: "Pack value", blurb: "Gems and VIP points per dollar at the price you see. Items are not counted.", features: ["F-14"], group: "calculators" },
  { href: "/tools/action-points/", title: "Action Points", blurb: "Barbarian hits per AP and the gem price of buying more.", features: ["F-81"], group: "calculators" },
  { href: "/tools/migration/", title: "Migration checker", blurb: "Can you migrate, and what is missing, for the current rules.", features: ["F-31"], group: "plan" },
  { href: "/tools/kvk/", title: "KvK readiness", blurb: "A checklist for your first KvK, with a plain season explainer.", features: ["F-26"], group: "plan" },
  { href: "/tools/hoard/", title: "Hoard advisor", blurb: "What to save for which event, without guessing dates.", features: ["F-25"], group: "plan" },
  { href: "/tools/screenshot/", title: "Read my screenshots (experimental)", blurb: "Suggested power, kill points, City Hall and VIP from screenshots of your own account, read on your device. You check every value.", features: ["F-54"], group: "plan" },
  { href: "/tools/zeroed/", title: "Zeroed? Recovery plan", blurb: "A 30-second log-off checklist and what to rebuild first.", features: ["F-13"], group: "plan" },
  { href: "/tools/safety/", title: "Play it safe", blurb: "What gets accounts banned, and a support ticket builder.", features: ["F-32", "F-82"], group: "learn" },
  { href: "/glossary/", title: "Glossary", blurb: "DKP, MGE, seed, T4 and more in two lines each.", features: ["F-88"], group: "learn" },
  { href: "/changes/", title: "What changed since…", blurb: "Pick when you stopped playing and see the patches since.", features: ["F-28"], group: "learn" },
];

export const GROUPS: readonly { id: ToolEntry["group"]; title: string }[] = [
  { id: "calculators", title: "Calculators" },
  { id: "plan", title: "Plan" },
  { id: "learn", title: "Learn" },
];
