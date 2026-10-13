import { formatDuration, healWave, mergeCites, overflow, totalCapacity, type Cite, type HospitalLevel } from "@rokadm/planner/tools";
import { Cite as CiteTag } from "../kit/Cite";
import { NumberField, SelectField } from "../kit/NumberField";
import { ResultRow, Results } from "../kit/Result";
import { ShareBar } from "../kit/ShareBar";
import { useToolInputs } from "../kit/useToolInputs";

export interface HealingCalcProps {
  capacities: HospitalLevel[];
  cites: { capacity: Cite; overflow: Cite; t5: Cite };
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const NO = "No card covers this";

/** F-22: hospital capacity, what dies beyond it, and the cost and time of healing one full hospital wave. */
export default function HealingCalc({ capacities, cites }: HealingCalcProps) {
  const { values: v, set, shared, shareUrl, keepMine, useLink } = useToolInputs(
    "healing",
    { hospitalLevel: 10, hospitals: 1, wounded: 0, healFood: 0, healWood: 0, healStone: 0, healGold: 0, healSeconds: 0, speedupHealingMin: 0 },
    ["speedupHealingMin"],
  );
  const level = capacities.some((c) => c.level === v.hospitalLevel) ? v.hospitalLevel : capacities[0]!.level;
  const one = totalCapacity(level, 1, capacities);
  const all = totalCapacity(level, v.hospitals, capacities);
  const dead = overflow(v.wounded, all);
  const wave = healWave(all, { food: v.healFood, wood: v.healWood, stone: v.healStone, gold: v.healGold, seconds: v.healSeconds }, v.speedupHealingMin);
  const perTroop = ["heal cost per troop"];

  return (
    <div class="t-page-body" data-tool="healing">
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Hospital inputs">
        <SelectField id="h-level" label="Hospital level" value={level} onChange={(x) => set({ hospitalLevel: x })}
          options={capacities.map((c) => ({ value: c.level, label: `Level ${c.level} (${fmt(c.capacity)} each)` }))} />
        <NumberField id="h-count" label="Hospitals in your city" value={v.hospitals} min={1} max={20} pending onChange={(x) => set({ hospitals: x })}
          help={`Count them in your city, all at the level above. ${NO}.`} />
        <NumberField id="h-wounded" label="Wounded you expect in a fight" value={v.wounded} max={100000000} onChange={(x) => set({ wounded: x })}
          help="Optional. Shows how many would die for lack of beds." />
      </form>

      <section class="t-sp-job" aria-labelledby="h-per-h">
        <h2 id="h-per-h">Heal cost per troop</h2>
        <p class="t-help">Open your hospital, select a single troop of the tier you heal most, and copy the cost and time it shows. {NO}: these are your own figures.</p>
        <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Heal cost per troop">
          <NumberField id="h-food" label="Food per troop" value={v.healFood} integer={false} max={1000000} pending onChange={(x) => set({ healFood: x })} />
          <NumberField id="h-wood" label="Wood per troop" value={v.healWood} integer={false} max={1000000} pending onChange={(x) => set({ healWood: x })} />
          <NumberField id="h-stone" label="Stone per troop" value={v.healStone} integer={false} max={1000000} pending onChange={(x) => set({ healStone: x })} />
          <NumberField id="h-gold" label="Gold per troop" value={v.healGold} integer={false} max={1000000} pending onChange={(x) => set({ healGold: x })} />
          <NumberField id="h-seconds" label="Heal time per troop" suffix="seconds" value={v.healSeconds} integer={false} max={100000} pending onChange={(x) => set({ healSeconds: x })} />
          <NumberField id="h-speedups" label="Healing speedups you hold" suffix="minutes" value={v.speedupHealingMin} max={100000000} onChange={(x) => set({ speedupHealingMin: x })}
            help="Filled in from the Speedups calculator when you used it on this device." />
        </form>
      </section>

      <Results title="Your hospitals">
        <ResultRow testId="h-cap-one" label={`One level ${level} hospital holds`} value={`${fmt(one)} troops`} cite={cites.capacity} />
        <ResultRow testId="h-cap-all" label={`${fmt(v.hospitals)} hospital${v.hospitals === 1 ? "" : "s"} hold`} value={`${fmt(all)} troops`} cite={cites.capacity}
          pending={["number of hospitals"]} />
        <ResultRow testId="h-dead" label="Wounded beyond capacity (they die)" value={`${fmt(dead)} troops`} cite={mergeCites(cites.capacity, cites.overflow)}
          notes={["Wounded troops beyond hospital capacity die. Clear your hospitals before a fight."]} />
        <ResultRow testId="h-wave-cost" label={`Resources to heal a full wave (${fmt(all)} troops)`} cite={cites.capacity} pending={perTroop}
          value={wave.costUnknown ? <span class="t-prompt">Enter the heal cost per troop from your hospital screen</span>
            : `Food ${fmt(wave.food)} · Wood ${fmt(wave.wood)} · Stone ${fmt(wave.stone)} · Gold ${fmt(wave.gold)}`} />
        <ResultRow testId="h-wave-time" label="Heal time for that wave (no speed bonus)" cite={cites.capacity} pending={["heal time per troop"]}
          value={wave.seconds === null ? <span class="t-prompt">Enter the heal time per troop from your hospital screen</span> : formatDuration(wave.seconds)}
          notes={["Alliance helps and healing speed bonuses are not counted."]} />
        <ResultRow testId="h-wave-speedups" label="Healing speedups still needed" cite={cites.capacity} pending={["heal time per troop"]}
          value={wave.speedupShortMin === null ? <span class="t-prompt">Needs the heal time per troop</span>
            : wave.speedupShortMin === 0 ? `None: your ${formatDuration(v.speedupHealingMin * 60)} cover it` : formatDuration(wave.speedupShortMin * 60)} />
      </Results>

      <aside class="t-callout" aria-label="Tier note">
        <p>T5 heals cost much more resources and time than T4. Without a steady economy, fight with T4 and keep a T4 reserve.</p>
        <CiteTag cite={cites.t5} />
      </aside>
      <ShareBar shareUrl={shareUrl} shared={shared} keepMine={keepMine} useLink={useLink} />
    </div>
  );
}
