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
  { key: "gems", kind: "gems", label: "Gemas", unit: "gemas" },
  { key: "apItems", kind: "ap", label: "Itens de recuperação de PA", unit: "itens" },
  { key: "speedupUniversalMin", kind: "speedups", label: "Acelerações universais", unit: "minutos" },
  { key: "speedupBuildingMin", kind: "speedups", label: "Acelerações de construção", unit: "minutos" },
  { key: "speedupResearchMin", kind: "speedups", label: "Acelerações de pesquisa", unit: "minutos" },
  { key: "speedupTrainingMin", kind: "speedups", label: "Acelerações de treinamento", unit: "minutos" },
  { key: "speedupHealingMin", kind: "speedups", label: "Acelerações de cura", unit: "minutos" },
] as const;

type Key = (typeof ITEMS)[number]["key"];
const INVENTORY = ["gems", "speedupUniversalMin", "speedupBuildingMin", "speedupResearchMin", "speedupTrainingMin", "speedupHealingMin"] as const;
const fmt = (n: number) => n.toLocaleString("pt-BR");
const tKey = (k: Key) => `target_${k}`;

/** F-25 (b): saved vs target per item for one goal. Saved values are shared with the other tools. */
export default function HoardCalc({ goals, cites }: HoardCalcProps) {
  const defaults: Record<string, number | string> = { goal: goals[0]!.id };
  for (const it of ITEMS) { defaults[it.key] = 0; defaults[tKey(it.key)] = 0; }
  const { values: v, set, shared, shareUrl, keepMine, useLink } = useToolInputs("hoard", defaults, [...INVENTORY]);
  const goal = goals.find((g) => g.id === v.goal) ?? goals[0]!;
  const items = ITEMS.filter((it) => (goal.save as readonly string[]).includes(it.kind));
  const num = (k: string): number => (typeof v[k] === "number" ? (v[k] as number) : 0);

  return (
    <div class="t-page-body" data-tool="hoard">
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Guardado e meta">
        <SelectField id="hoard-goal" label="Guardando para" value={goal.id} options={goals.map((g) => ({ value: g.id, label: g.title }))} onChange={(x) => set({ goal: x })} />
      </form>
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label={`Quantidades para ${goal.title}`}>
        {items.map((it) => [
          <NumberField key={it.key} id={`hoard-${it.key}`} label={`Guardado: ${it.label} (${it.unit})`} value={num(it.key)} max={10 ** 9}
            onChange={(x) => set({ [it.key]: x })} help={INVENTORY.includes(it.key as never) ? "Compartilhado com as outras ferramentas neste aparelho." : undefined} />,
          <NumberField key={tKey(it.key)} id={`hoard-t-${it.key}`} label={`Meta: ${it.label} (${it.unit})`} value={num(tKey(it.key))} max={10 ** 9}
            onChange={(x) => set({ [tKey(it.key)]: x })} pending help="Sua própria meta: nenhuma ficha traz uma." />,
        ])}
      </form>
      {goal.save.includes("resources") ? (
        <p class="t-note">Esta meta também pede recursos guardados como itens: conte-os no jogo.</p>
      ) : null}
      {items.length ? (
        <Results title="Seu resultado de acúmulo">
          {items.map((it) => {
            const g = reserveGap(num(it.key), num(tKey(it.key)));
            return (
              <ResultRow key={it.key} testId={`hoard-gap-${it.key}`} label={it.label}
                value={g.target === 0 ? `${fmt(g.saved)} guardados, sem meta definida` : g.missing === 0 ? `Meta atingida (${fmt(g.saved)} de ${fmt(g.target)})` : `Faltam ${fmt(g.missing)} ${it.unit} (${g.pct}%)`}
                cite={cites[goal.id] ?? { facts: [], confidence: "pending" }} pending={["meta"]} />
            );
          })}
        </Results>
      ) : null}
      <ShareBar shareUrl={shareUrl} shared={shared} keepMine={keepMine} useLink={useLink} />
    </div>
  );
}
