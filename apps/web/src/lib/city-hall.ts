// City Hall tab (UX stage 1): pure helpers. The page composes what already exists: today's must-dos
// from the routine planner, the next City Hall level from the A01 building table, and the guide's
// KvK1 targets (Budget reality check, F2P baseline) as simple gauges. No DOM, no storage.
import type { AccountProfile } from "@rokadm/core";
import type { PlannedTask } from "@rokadm/planner";
import { cleanRequirement, formatDuration, upgradeCost, type LevelCost } from "@rokadm/planner/tools";

export interface ChRow extends LevelCost { requirements: string | null }

/** Build-time numbers from the planner's reality check (F2P baseline), lean for the island. */
export interface CityHallTargets {
  kvk1Day: number;
  /** CH that player reports call workable for KvK1. */
  chWorkable: number;
  /** CH an F2P account is not expected to reach by KvK1. */
  chNotExpected: number;
  lostKingdomCH: number;
  t4Day: number;
  powerMillions: { min: number; max: number };
  vipTargets: number[];
  /** One-time gem rewards tied to a City Hall level, in level order. */
  chMilestones: { label: string; gems: number; cityHall: number }[];
}

/** Today: must-dos first, then the rest in plan order; at most `n`. */
export function todayTop(included: readonly PlannedTask[], n = 3): PlannedTask[] {
  return [...included.filter((t) => t.mustDo), ...included.filter((t) => !t.mustDo)].slice(0, n);
}

export interface NextLevel {
  from: number;
  to: number;
  /** Resource lines with an amount above zero, e.g. ["Comida 1.200.000", ...]. */
  resources: string[];
  items: string[];
  time: string | null;
  requirement: string | null;
  /** The source row is garbled: numbers left out. */
  unreadable: boolean;
}

const fmt = (n: number): string => n.toLocaleString("pt-BR");

/** The next City Hall level's cost and requirement, or null at the top level or off the table. */
export function nextLevel(rows: readonly ChRow[], cityHall: number): NextLevel | null {
  const to = cityHall + 1;
  const row = rows.find((r) => r.level === to);
  if (!row) return null;
  let cost;
  try {
    cost = upgradeCost(rows, cityHall, to);
  } catch {
    return null;
  }
  const resources = (
    [["Comida", cost.food], ["Madeira", cost.wood], ["Pedra", cost.stone], ["Ouro", cost.gold]] as const
  ).filter(([, v]) => v > 0).map(([k, v]) => `${k} ${fmt(v)}`);
  return {
    from: cityHall,
    to,
    resources,
    items: cost.items.map((i) => `${i.name} ×${fmt(i.count)}`),
    time: cost.seconds > 0 ? formatDuration(cost.seconds) : null,
    requirement: cleanRequirement(row.requirements),
    unreadable: cost.skipped.length > 0,
  };
}

export interface Gauge {
  current: number;
  target: number;
  /** 0..1 */
  ratio: number;
  reached: boolean;
}

export function gauge(current: number, target: number): Gauge {
  const ratio = target <= 0 ? 1 : Math.max(0, Math.min(1, current / target));
  return { current, target, ratio, reached: current >= target };
}

export type AlertKind = "setup" | "mustdo" | "warning" | "late" | "data";
export interface CityAlert { kind: AlertKind; text: string; href?: string; link?: string }

/** Alerts under the status gauges: built only from what the planner and the core already report. */
export function cityAlerts(o: {
  hasProfile: boolean;
  mustDoMissing: number;
  budgetMinutes: number;
  warnings: readonly string[];
  kingdomDay: number | null;
  kvk1Day: number;
  unreadableNext: boolean;
}): CityAlert[] {
  const out: CityAlert[] = [];
  if (!o.hasProfile) out.push({ kind: "setup", text: "Estas são respostas padrão. Responda a 5 perguntas rápidas para o plano combinar com a sua conta.", href: "/start/", link: "Começar" });
  if (o.mustDoMissing > 0) {
    out.push({
      kind: "mustdo",
      text: `${o.mustDoMissing} ${o.mustDoMissing === 1 ? "tarefa essencial não cabe" : "tarefas essenciais não cabem"} em ${o.budgetMinutes} min hoje.`,
      href: "/city-hall/today/", link: "Escolher mais tempo",
    });
  }
  for (const w of o.warnings) out.push({ kind: "warning", text: w });
  if (o.kingdomDay !== null && o.kingdomDay > o.kvk1Day) out.push({ kind: "late", text: "Seu reino já passou da KvK1: as metas da KvK1 abaixo ficaram para trás.", href: "/guides/late-game/", link: "Guia da fase final" });
  if (o.unreadableNext) out.push({ kind: "data", text: "A linha da tabela de origem da sua próxima Prefeitura está ilegível: confira o custo no jogo." });
  return out;
}

export interface StageTool {
  href: string;
  title: string;
  why: string;
}

const T = {
  pack: { href: "/tools/pack-value/", title: "Valor de pacotes", why: "Confira as gemas por dólar de um pacote antes de comprar." },
  buildings: { href: "/tools/buildings/", title: "Custo de construções", why: "Recursos e tempo para os próximos níveis." },
  speedups: { href: "/tools/speedups/", title: "Acelerações e tempo", why: "Some suas acelerações contra uma melhoria longa." },
  vip: { href: "/tools/vip/", title: "Gemas para VIP", why: "Dias e gemas até o seu próximo nível de VIP." },
  kvk: { href: "/tools/kvk/", title: "Preparo para a KvK", why: "Uma checklist antes da primeira KvK do seu reino." },
  healing: { href: "/tools/healing/", title: "Planejador de cura", why: "Quanto custa curar um hospital cheio." },
  migration: { href: "/tools/migration/", title: "Verificador de migração", why: "Se você pode migrar e o que falta." },
} satisfies Record<string, StageTool>;

/**
 * The tools that matter at this stage (at most 3): growth tools before KvK, fight tools after;
 * spenders get Pack value first. "Meus comandantes" is its own tile on the City Hall sheet.
 */
export function stageTools(p: AccountProfile): StageTool[] {
  const early = p.kingdomStage === "pre_kvk";
  const list: StageTool[] = early
    ? [T.buildings, T.speedups, p.cityHall >= 16 ? T.kvk : T.vip]
    : [T.healing, T.speedups, T.migration];
  if (p.spending !== "f2p") list.unshift(T.pack);
  return list.slice(0, 3);
}
