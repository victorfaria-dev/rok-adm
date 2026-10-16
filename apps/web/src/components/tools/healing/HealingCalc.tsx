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

const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");
const NO = "Nenhuma ficha cobre isto";

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
  const perTroop = ["custo de cura por tropa"];

  return (
    <div class="t-page-body" data-tool="healing">
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Dados do hospital">
        <SelectField id="h-level" label="Nível do hospital" value={level} onChange={(x) => set({ hospitalLevel: x })}
          options={capacities.map((c) => ({ value: c.level, label: `Nível ${c.level} (${fmt(c.capacity)} cada)` }))} />
        <NumberField id="h-count" label="Hospitais na sua cidade" value={v.hospitals} min={1} max={20} pending onChange={(x) => set({ hospitals: x })}
          help={`Conte os da sua cidade, todos no nível acima. ${NO}.`} />
        <NumberField id="h-wounded" label="Feridos que você espera numa luta" value={v.wounded} max={100000000} onChange={(x) => set({ wounded: x })}
          help="Opcional. Mostra quantos morreriam por falta de leitos." />
      </form>

      <section class="t-sp-job" aria-labelledby="h-per-h">
        <h2 id="h-per-h">Custo de cura por tropa</h2>
        <p class="t-help">Abra o seu hospital, selecione uma única tropa do nível que você mais cura e copie o custo e o tempo que aparecem. {NO}: são números seus.</p>
        <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Custo de cura por tropa">
          <NumberField id="h-food" label="Comida por tropa" value={v.healFood} integer={false} max={1000000} pending onChange={(x) => set({ healFood: x })} />
          <NumberField id="h-wood" label="Madeira por tropa" value={v.healWood} integer={false} max={1000000} pending onChange={(x) => set({ healWood: x })} />
          <NumberField id="h-stone" label="Pedra por tropa" value={v.healStone} integer={false} max={1000000} pending onChange={(x) => set({ healStone: x })} />
          <NumberField id="h-gold" label="Ouro por tropa" value={v.healGold} integer={false} max={1000000} pending onChange={(x) => set({ healGold: x })} />
          <NumberField id="h-seconds" label="Tempo de cura por tropa" suffix="segundos" value={v.healSeconds} integer={false} max={100000} pending onChange={(x) => set({ healSeconds: x })} />
          <NumberField id="h-speedups" label="Acelerações de cura que você tem" suffix="minutos" value={v.speedupHealingMin} max={100000000} onChange={(x) => set({ speedupHealingMin: x })}
            help="Preenchido pela calculadora de acelerações quando você a usou neste aparelho." />
        </form>
      </section>

      <Results title="Seus hospitais">
        <ResultRow testId="h-cap-one" label={`Um hospital de nível ${level} comporta`} value={`${fmt(one)} tropas`} cite={cites.capacity} />
        <ResultRow testId="h-cap-all" label={v.hospitals === 1 ? "1 hospital comporta" : `${fmt(v.hospitals)} hospitais comportam`} value={`${fmt(all)} tropas`} cite={cites.capacity}
          pending={["número de hospitais"]} />
        <ResultRow testId="h-dead" label="Feridos além da capacidade (eles morrem)" value={`${fmt(dead)} tropas`} cite={mergeCites(cites.capacity, cites.overflow)}
          notes={["Tropas feridas além da capacidade do hospital morrem. Esvazie seus hospitais antes de uma luta."]} />
        <ResultRow testId="h-wave-cost" label={`Recursos para curar uma leva cheia (${fmt(all)} tropas)`} cite={cites.capacity} pending={perTroop}
          value={wave.costUnknown ? <span class="t-prompt">Digite o custo de cura por tropa da tela do seu hospital</span>
            : `Comida ${fmt(wave.food)} · Madeira ${fmt(wave.wood)} · Pedra ${fmt(wave.stone)} · Ouro ${fmt(wave.gold)}`} />
        <ResultRow testId="h-wave-time" label="Tempo de cura dessa leva (sem bônus de velocidade)" cite={cites.capacity} pending={["tempo de cura por tropa"]}
          value={wave.seconds === null ? <span class="t-prompt">Digite o tempo de cura por tropa da tela do seu hospital</span> : formatDuration(wave.seconds)}
          notes={["Ajudas da aliança e bônus de velocidade de cura não entram na conta."]} />
        <ResultRow testId="h-wave-speedups" label="Acelerações de cura ainda necessárias" cite={cites.capacity} pending={["tempo de cura por tropa"]}
          value={wave.speedupShortMin === null ? <span class="t-prompt">Precisa do tempo de cura por tropa</span>
            : wave.speedupShortMin === 0 ? `Nenhuma: as suas ${formatDuration(v.speedupHealingMin * 60)} cobrem` : formatDuration(wave.speedupShortMin * 60)} />
      </Results>

      <aside class="t-callout" aria-label="Nota sobre níveis de tropa">
        <p>Curar T5 custa muito mais recursos e tempo do que T4. Sem uma economia estável, lute com T4 e mantenha uma reserva de T4.</p>
        <CiteTag cite={cites.t5} />
      </aside>
      <ShareBar shareUrl={shareUrl} shared={shared} keepMine={keepMine} useLink={useLink} />
    </div>
  );
}
