// The /tools/ hub list (client-safe, no data), grouped by task (UX stage 1). Guide-like pages
// (safety FAQ, zeroed plan, glossary, what changed) live on the Guides tab; trust is in the footer.
export type ToolGroup = "spend" | "time" | "combat" | "kingdom" | "farms" | "experimental";

export interface ToolEntry {
  href: string;
  title: string;
  blurb: string;
  /** Feature ids in produto/arvore-funcionalidades.md. */
  features: string[];
  group: ToolGroup;
}

export const TOOLS: readonly ToolEntry[] = [
  { href: "/tools/pack-value/", title: "Pack value", blurb: "Gems and VIP points per dollar at the price you see. Items are not counted.", features: ["F-14"], group: "spend" },
  { href: "/tools/gems/", title: "Gem value table", blurb: "What each gem use buys: VIP, Action Points, VIP Shop items.", features: ["F-21"], group: "spend" },
  { href: "/tools/vip/", title: "Gems to VIP", blurb: "Points, gems and days to your next VIP level.", features: ["F-21"], group: "spend" },
  { href: "/tools/hoard/", title: "Hoard advisor", blurb: "What to save for which event, without guessing dates.", features: ["F-25"], group: "spend" },
  { href: "/tools/speedups/", title: "Speedups and time", blurb: "Add up your speedups and compare them with a job's time.", features: ["F-81"], group: "time" },
  { href: "/tools/buildings/", title: "Building costs", blurb: "Resources and raw time from one level to another, any building.", features: ["F-81"], group: "time" },
  { href: "/commanders/", title: "Commanders", blurb: "A checklist before you spend sculptures on a commander.", features: ["F-20"], group: "combat" },
  { href: "/tools/healing/", title: "Healing planner", blurb: "Hospital capacity and what one full hospital costs to heal.", features: ["F-22"], group: "combat" },
  { href: "/tools/action-points/", title: "Action Points", blurb: "Barbarian hits per AP and the gem price of buying more.", features: ["F-81"], group: "combat" },
  { href: "/tools/kvk/", title: "KvK readiness", blurb: "A checklist for your first KvK, with a plain season explainer.", features: ["F-26"], group: "kingdom" },
  { href: "/tools/migration/", title: "Migration checker", blurb: "Can you migrate, and what is missing, for the current rules.", features: ["F-31"], group: "kingdom" },
  { href: "/farms/", title: "Farm hub", blurb: "Your farms, a daily checklist and shipment log, plus which farm to build, its build path and the Trading Post calculator.", features: ["F-04", "F-65", "F-66", "F-68"], group: "farms" },
  { href: "/tools/screenshot/", title: "Read my screenshot", blurb: "City Hall, power and VIP from your own profile screenshot, read on your device.", features: ["F-54"], group: "experimental" },
];

export const GROUPS: readonly { id: ToolGroup; title: string }[] = [
  { id: "spend", title: "Spend & value" },
  { id: "time", title: "Speedups & time" },
  { id: "combat", title: "Combat & healing" },
  { id: "kingdom", title: "Kingdom moves" },
  { id: "farms", title: "Farms" },
  { id: "experimental", title: "Experimental" },
];
