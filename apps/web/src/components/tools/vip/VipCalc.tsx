import { mergeCites, vipPlan, type ChestRule, type Cite, type VipThreshold } from "@rokadm/planner/tools";
import { NumberField, SelectField } from "../kit/NumberField";
import { ResultRow, Results } from "../kit/Result";
import { ShareBar } from "../kit/ShareBar";
import { useToolInputs } from "../kit/useToolInputs";

export interface VipCalcProps {
  levels: VipThreshold[];
  rule: ChestRule;
  perGem: number;
  dailyGems: number;
  cites: { thresholds: Cite; chest: Cite; gems: Cite; dailyGems: Cite };
}

const fmt = (n: number) => n.toLocaleString("en-US");
const days = (d: number | null) => (d === null ? "More than 10 years" : d === 0 ? "Already there" : `${fmt(d)} day${d === 1 ? "" : "s"}`);

/** F-21 (part): VIP points and gems to a target VIP, and days with the daily chest. */
export default function VipCalc({ levels, rule, perGem, dailyGems, cites }: VipCalcProps) {
  const maxVip = Math.max(...levels.map((l) => l.vip));
  const { values: v, set, shared, shareUrl } = useToolInputs(
    "vip",
    { vipPoints: 0, targetVip: Math.min(6, maxVip), streakDay: 1, gemsPerDay: dailyGems },
    ["vipPoints"],
  );
  // Saved or linked values may name a level that is not in the table: fall back to the nearest one.
  const targetVip = levels.some((l) => l.vip === v.targetVip) ? v.targetVip : Math.min(Math.max(1, Math.round(v.targetVip) || 1), maxVip);
  const plan = vipPlan(
    { currentPoints: v.vipPoints, targetVip, streakDay: v.streakDay, gemsPerDay: v.gemsPerDay },
    levels, rule, perGem,
    { thresholds: cites.thresholds.facts, chest: cites.chest.facts, gems: cites.gems.facts },
  );
  const merge = mergeCites;

  return (
    <div class="t-page-body" data-tool="vip">
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="VIP inputs">
        <NumberField id="vip-points" label="Your VIP points now" value={v.vipPoints} onChange={(x) => set({ vipPoints: x })}
          help={`Total shown on your VIP screen. That is VIP ${plan.currentVip} today.`} />
        <SelectField id="vip-target" label="Target VIP level" value={targetVip} onChange={(x) => set({ targetVip: x })}
          options={levels.map((l) => ({ value: l.vip, label: `VIP ${l.vip} (${fmt(l.threshold)} points)` }))} />
        <NumberField id="vip-streak" label="Daily chest streak day" value={v.streakDay} min={1} max={10000} onChange={(x) => set({ streakDay: x })}
          help="1 if you start a new streak today." />
        <NumberField id="vip-gems" label="Gems you put into VIP each day" value={v.gemsPerDay} onChange={(x) => set({ gemsPerDay: x })}
          help={`Default: the ${fmt(dailyGems)} guaranteed gems a day.`} />
      </form>
      <Results>
        <ResultRow testId="vip-needed" label={`VIP points to reach VIP ${targetVip}`} value={fmt(plan.pointsNeeded)} cite={cites.thresholds}
          notes={["Thresholds read as cumulative totals (supported by one source, in-game check pending)."]} />
        <ResultRow testId="vip-gems-now" label="Gems if you buy them all now" value={fmt(plan.gemsIfAllNow.value)} cite={merge(cites.thresholds, cites.gems)} />
        <ResultRow testId="vip-days-chest" label="Days with the daily chest only" value={days(plan.daysChestOnly.value)} cite={merge(cites.thresholds, cites.chest)}
          notes={plan.daysChestOnly.assumptions} />
        <ResultRow testId="vip-days-gems" label={`Days with the chest plus ${fmt(v.gemsPerDay)} gems a day`} value={days(plan.daysWithGems.value)}
          cite={merge(cites.thresholds, cites.chest, cites.gems, cites.dailyGems)} notes={plan.daysWithGems.assumptions} />
      </Results>
      <ShareBar shareUrl={shareUrl} shared={shared} />
    </div>
  );
}
