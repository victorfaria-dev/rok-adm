import { reserveGap, type Cite as CiteData } from "@rokadm/planner/tools";
import { NumberField, SelectField } from "../kit/NumberField";
import { ResultRow, Results } from "../kit/Result";
import { ShareBar } from "../kit/ShareBar";
import { useToolInputs } from "../kit/useToolInputs";

/** What a goal asks you to save (from tools-data/hoard.json). */
export type SaveKind = "ap" | "gems" | "speedups" | "resources";

export interface HoardGoal { id: string; title: string; save: SaveKind[] }

export interface HoardCalcProps {
  goals: HoardGoal[];
  /** Cite per goal (its rules' cards). */
  cites: Record<string, CiteData>;
}

const ITEMS = [
  { key: "gems", kind: "gems", label: "Gems", unit: "gems" },
  { key: "apItems", kind: "ap", label: "AP recovery items", unit: "items" },
  { key: "speedupUniversalMin", kind: "speedups", label: "Universal speedups", unit: "minutes" },
  { key: "speedupBuildingMin", kind: "speedups", label: "Building speedups", unit: "minutes" },
  { key: "speedupResearchMin", kind: "speedups", label: "Research speedups", unit: "minutes" },
  { key: "speedupTrainingMin", kind: "speedups", label: "Training speedups", unit: "minutes" },
  { key: "speedupHealingMin", kind: "speedups", label: "Healing speedups", unit: "minutes" },
] as const;

type Key = (typeof ITEMS)[number]["key"];
const INVENTORY = ["gems", "speedupUniversalMin", "speedupBuildingMin", "speedupResearchMin", "speedupTrainingMin", "speedupHealingMin"] as const;
const fmt = (n: number) => n.toLocaleString("en-US");
const tKey = (k: Key) => `target_${k}`;

/** F-25 (b): saved vs target per item for one goal. Saved values are shared with the other tools. */
export default function HoardCalc({ goals, cites }: HoardCalcProps) {
  const defaults: Record<string, number | string> = { goal: goals[0]!.id };
  for (const it of ITEMS) { defaults[it.key] = 0; defaults[tKey(it.key)] = 0; }
  const { values: v, set, shared, shareUrl } = useToolInputs("hoard", defaults, [...INVENTORY]);
  const goal = goals.find((g) => g.id === v.goal) ?? goals[0]!;
  const items = ITEMS.filter((it) => (goal.save as readonly string[]).includes(it.kind));
  const num = (k: string): number => (typeof v[k] === "number" ? (v[k] as number) : 0);

  return (
    <div class="t-page-body" data-tool="hoard">
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Saved versus target">
        <SelectField id="hoard-goal" label="Saving for" value={goal.id} options={goals.map((g) => ({ value: g.id, label: g.title }))} onChange={(x) => set({ goal: x })} />
      </form>
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label={`Amounts for ${goal.title}`}>
        {items.map((it) => [
          <NumberField key={it.key} id={`hoard-${it.key}`} label={`${it.label} saved (${it.unit})`} value={num(it.key)} max={10 ** 9}
            onChange={(x) => set({ [it.key]: x })} help={INVENTORY.includes(it.key as never) ? "Shared with the other tools on this device." : undefined} />,
          <NumberField key={tKey(it.key)} id={`hoard-t-${it.key}`} label={`${it.label} target (${it.unit})`} value={num(tKey(it.key))} max={10 ** 9}
            onChange={(x) => set({ [tKey(it.key)]: x })} pending help="Your own target: no card gives one." />,
        ])}
      </form>
      {goal.save.includes("resources") ? (
        <p class="t-note">This goal also asks for resources saved as items: count those in game.</p>
      ) : null}
      {items.length ? (
        <Results title="Saved vs target">
          {items.map((it) => {
            const g = reserveGap(num(it.key), num(tKey(it.key)));
            return (
              <ResultRow key={it.key} testId={`hoard-gap-${it.key}`} label={it.label}
                value={g.target === 0 ? `${fmt(g.saved)} saved, no target set` : g.missing === 0 ? `On target (${fmt(g.saved)} of ${fmt(g.target)})` : `${fmt(g.missing)} ${it.unit} to go (${g.pct}%)`}
                cite={cites[goal.id] ?? { facts: [], confidence: "pending" }} pending={["target"]} />
            );
          })}
        </Results>
      ) : null}
      <ShareBar shareUrl={shareUrl} shared={shared} />
    </div>
  );
}
