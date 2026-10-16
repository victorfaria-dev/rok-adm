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

const fmt = (n: number) => n.toLocaleString("pt-BR");
const days = (d: number | null) => (d === null ? "Mais de 10 anos" : d === 0 ? "Já chegou lá" : `${fmt(d)} ${d === 1 ? "dia" : "dias"}`);

/** F-21 (part): VIP points and gems to a target VIP, and days with the daily chest. */
export default function VipCalc({ levels, rule, perGem, dailyGems, cites }: VipCalcProps) {
  const maxVip = Math.max(...levels.map((l) => l.vip));
  const { values: v, set, shared, shareUrl, keepMine, useLink } = useToolInputs(
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
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Dados de VIP">
        <NumberField id="vip-points" label="Seus pontos VIP agora" value={v.vipPoints} onChange={(x) => set({ vipPoints: x })}
          help={`Total mostrado na sua tela de VIP. Hoje isso é VIP ${plan.currentVip}.`} />
        <SelectField id="vip-target" label="Nível de VIP desejado" value={targetVip} onChange={(x) => set({ targetVip: x })}
          options={levels.map((l) => ({ value: l.vip, label: `VIP ${l.vip} (${fmt(l.threshold)} pontos)` }))} />
        <NumberField id="vip-streak" label="Dia da sequência do baú diário" value={v.streakDay} min={1} max={10000} onChange={(x) => set({ streakDay: x })}
          help="1 se você começa uma nova sequência hoje." />
        <NumberField id="vip-gems" label="Gemas que você põe no VIP por dia" value={v.gemsPerDay} onChange={(x) => set({ gemsPerDay: x })}
          help={`Padrão: as ${fmt(dailyGems)} gemas garantidas por dia.`} />
      </form>
      <Results>
        <ResultRow testId="vip-needed" label={`Pontos VIP para chegar ao VIP ${targetVip}`} value={fmt(plan.pointsNeeded)} cite={cites.thresholds}
          notes={["Limites lidos como totais acumulados (apoiado por uma fonte; conferência no jogo pendente)."]} />
        <ResultRow testId="vip-gems-now" label="Gemas se você comprar tudo agora" value={fmt(plan.gemsIfAllNow.value)} cite={merge(cites.thresholds, cites.gems)} />
        <ResultRow testId="vip-days-chest" label="Dias só com o baú diário" value={days(plan.daysChestOnly.value)} cite={merge(cites.thresholds, cites.chest)}
          notes={plan.daysChestOnly.assumptions} />
        <ResultRow testId="vip-days-gems" label={`Dias com o baú mais ${fmt(v.gemsPerDay)} gemas por dia`} value={days(plan.daysWithGems.value)}
          cite={merge(cites.thresholds, cites.chest, cites.gems, cites.dailyGems)} notes={plan.daysWithGems.assumptions} />
      </Results>
      <ShareBar shareUrl={shareUrl} shared={shared} keepMine={keepMine} useLink={useLink} />
    </div>
  );
}
