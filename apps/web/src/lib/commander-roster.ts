// Build-time only (Astro frontmatter and tests): turns the planner's commander periods into the lean roster the
// picker islands receive as props. Importing this from client code would ship the full dataset; don't.
import { COMMANDER_PERIODS, COMMANDER_RELEASES, hasCommanderPortrait, groupCommandersByPeriod } from "@rokadm/planner";
import type { PickerCommander, PickerRarity, PickerRoster } from "./commander-picker";

const RARITIES: readonly PickerRarity[] = ["legendary", "epic"];

export function buildPickerRoster(): PickerRoster {
  const commanders: PickerCommander[] = groupCommandersByPeriod(COMMANDER_RELEASES).flatMap((g) =>
    g.commanders.map((c) => {
      if (!RARITIES.includes(c.rarity as PickerRarity)) throw new Error(`Unknown rarity "${c.rarity}" for ${c.id}`);
      const row: PickerCommander = { id: c.id, name: c.name, rarity: c.rarity as PickerRarity, period: c.period, portrait: hasCommanderPortrait(c.id) };
      if (c.offseasonUnlock) row.offseasonUnlock = true;
      if (c.fromDay != null) row.fromDay = c.fromDay;
      return row;
    }),
  );
  return {
    periods: COMMANDER_PERIODS.map((p) => ({ id: p.id, stage: p.stage, label: p.label })),
    commanders,
  };
}
