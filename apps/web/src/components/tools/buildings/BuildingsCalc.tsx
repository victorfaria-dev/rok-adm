import { buffedSeconds, cleanRequirement, formatDuration, upgradeCost, type Cite, type LevelCost, type UpgradeCost } from "@rokadm/planner/tools";
import { NumberField, SelectField } from "../kit/NumberField";
import { ResultRow, Results } from "../kit/Result";
import { ShareBar } from "../kit/ShareBar";
import { useToolInputs } from "../kit/useToolInputs";

export interface BuildingRow extends LevelCost { requirements: string | null }

export interface BuildingTable { id: string; name: string; rows: BuildingRow[]; cite: Cite }

export interface BuildingsCalcProps { tables: BuildingTable[] }

const fmt = (n: number) => n.toLocaleString("en-US");
const res = (n: number) => (n === 0 ? "None" : fmt(n));
const levels = (xs: number[]) => xs.join(", ");

/** F-81: resources, items and raw time from one level to another, any building. */
export default function BuildingsCalc({ tables }: BuildingsCalcProps) {
  const first = tables[0]!;
  const { values: v, set, shared, shareUrl } = useToolInputs("buildings", { building: first.id, from: 9, to: 10, bonusPct: 0 });
  const table = tables.find((t) => t.id === v.building) ?? first;
  const max = table.rows.reduce((m, r) => Math.max(m, r.level), 0);
  const from = Math.min(Math.max(0, Math.floor(v.from)), max);
  const to = Math.min(Math.max(1, Math.floor(v.to)), max);

  let cost: UpgradeCost | null = null;
  let error: string | null = null;
  try {
    cost = upgradeCost(table.rows, from, to);
  } catch (e) {
    error = e instanceof RangeError ? "Pick a target level above your current level." : "These levels cannot be read.";
  }
  const target = table.rows.find((r) => r.level === to);
  const req = cleanRequirement(target?.requirements);
  const c = table.cite;
  const notes: string[] = [];
  if (cost?.skipped.length) notes.push(`Level ${levels(cost.skipped)} left out: that row of the source table is garbled. Check it in game.`);
  if (cost?.missingTime.length) notes.push(`No raw time in the table for level ${levels(cost.missingTime)}: the time shown leaves it out.`);
  const bonusNote = "Read as raw time ÷ (1 + bonus). Your bonus is your own figure (pending measurement).";

  return (
    <div class="t-page-body" data-tool="buildings">
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Building and levels">
        <SelectField id="b-building" label="Building" value={table.id} onChange={(x) => set({ building: x })}
          options={tables.map((t) => ({ value: t.id, label: t.name }))} />
        <SelectField id="b-from" label="Current level" value={from} onChange={(x) => set({ from: x })}
          options={[{ value: 0, label: "Not built yet" }, ...table.rows.map((r) => ({ value: r.level, label: `Level ${r.level}` }))]} />
        <SelectField id="b-to" label="Target level" value={to} onChange={(x) => set({ to: x })}
          options={table.rows.map((r) => ({ value: r.level, label: `Level ${r.level}` }))} />
        <NumberField id="b-bonus" label="Your build speed bonus" suffix="%" value={v.bonusPct} max={1000} integer={false} pending
          onChange={(x) => set({ bonusPct: x })} help="From your City Hall info screen. 0 shows raw time." />
      </form>
      {error || !cost ? (
        <p class="t-error" role="alert" data-testid="b-error">{error}</p>
      ) : (
        <>
        {from === to ? <p class="t-note" data-testid="b-same">You are already at this level: nothing to pay.</p> : null}
        <Results title={`${table.name}: level ${from} to ${to}`}>
          <ResultRow testId="b-food" label="Food" value={res(cost.food)} cite={c} notes={notes} />
          <ResultRow testId="b-wood" label="Wood" value={res(cost.wood)} cite={c} />
          <ResultRow testId="b-stone" label="Stone" value={res(cost.stone)} cite={c} />
          <ResultRow testId="b-gold" label="Gold" value={res(cost.gold)} cite={c} />
          <ResultRow testId="b-items" label="Items" cite={c}
            value={cost.items.length ? cost.items.map((i) => `${i.name} ×${fmt(i.count)}`).join(", ") : "None"}
            notes={cost.unreadableExtra.length ? [`Item cell for level ${levels(cost.unreadableExtra)} is not readable in the source table.`] : []} />
          <ResultRow testId="b-time" label="Raw build time" value={formatDuration(cost.seconds)} cite={c} />
          <ResultRow testId="b-time-buffed" label={`Time with a ${fmt(v.bonusPct)}% speed bonus`} value={formatDuration(buffedSeconds(cost.seconds, v.bonusPct))}
            cite={c} pending={["build speed bonus"]} notes={[bonusNote]} />
          <ResultRow testId="b-req" label={`Needed for level ${to}`} value={req ?? "Nothing listed"} cite={c} />
        </Results>
        </>
      )}
      <ShareBar shareUrl={shareUrl} shared={shared} />
    </div>
  );
}
