import { afterDailyClaim, barbarianChain, formatDuration, hoursToCap, mergeCites, packPrice, packsCost, type Cite } from "@rokadm/planner/tools";
import { NumberField } from "../kit/NumberField";
import { ResultRow, Results } from "../kit/Result";
import { ShareBar } from "../kit/ShareBar";
import { useToolInputs } from "../kit/useToolInputs";

export interface ApCalcProps {
  cap: number;
  dailyClaim: number;
  barbarian: { base: number; step: number; maxStreak: number };
  insightMax: number;
  pack: { ap: number; startGems: number; stepGems: number };
  cites: { cap: Cite; claim: Cite; barbarian: Cite; pack: Cite };
}

const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");

/** F-81: barbarian attacks per chain, AP after the daily claim, and the gem price of buying AP. */
export default function ApCalc({ cap, dailyClaim, barbarian, insightMax, pack, cites }: ApCalcProps) {
  const { values: v, set, shared, shareUrl, keepMine, useLink } = useToolInputs("ap", {
    currentAp: 1000, insight: 0, capBonus: 0, purchasesToday: 0, packsToBuy: 1, regenPerHour: 0,
  });
  const insight = Math.min(insightMax, v.insight);
  const fullCap = cap + v.capBonus;
  const chainNow = barbarianChain(v.currentAp, barbarian, insight);
  const claim = afterDailyClaim(v.currentAp, fullCap, dailyClaim);
  const chainAfter = barbarianChain(claim.ap, barbarian, insight);
  const gems = packsCost(v.purchasesToday, v.packsToBuy, pack);
  const withPacks = claim.ap + v.packsToBuy * pack.ap;
  const hours = hoursToCap(v.currentAp, fullCap, v.regenPerHour);
  const chainNote = `Leitura: o primeiro ataque custa ${barbarian.base} PA, cada seguinte sem voltar custa ${barbarian.step} a menos, até ${barbarian.base - barbarian.maxStreak}${insight ? `, menos ${insight} por Insight` : ""}.`;
  const capPending = v.capBonus ? ["bônus do limite de PA"] : [];
  const both = mergeCites(cites.cap, cites.claim);

  return (
    <div class="t-page-body" data-tool="ap">
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Dados de Pontos de Ação">
        <NumberField id="ap-now" label="Seus Pontos de Ação agora" value={v.currentAp} max={100000} onChange={(x) => set({ currentAp: x })} />
        <NumberField id="ap-insight" label="Redução do talento Insight" suffix="AP" value={v.insight} max={insightMax} onChange={(x) => set({ insight: x })}
          help={`0 sem o talento; até ${insightMax} PA a menos por ataque.`} />
        <NumberField id="ap-cap-bonus" label="Limite extra de PA pelo VIP" suffix="AP" value={v.capBonus} max={10000} pending onChange={(x) => set({ capBonus: x })}
          help="Seu nível de VIP pode aumentar o limite (A09-0001 só informa o VIP 15). 0 se não tiver certeza." />
        <NumberField id="ap-bought" label="Pacotes de PA comprados com gemas hoje" value={v.purchasesToday} max={1000} onChange={(x) => set({ purchasesToday: x })}
          help="Zera no reset diário do servidor." />
        <NumberField id="ap-more" label="Pacotes que você quer comprar agora" value={v.packsToBuy} max={1000} onChange={(x) => set({ packsToBuy: x })}
          help={`Cada pacote dá ${fmt(pack.ap)} PA. O jogo só vende quando você não tem mais itens de PA.`} />
        <NumberField id="ap-regen" label="PA que você recupera por hora" value={v.regenPerHour} integer={false} max={10000} pending onChange={(x) => set({ regenPerHour: x })}
          help="Não consta nos nossos dados: anote seus PA em dois momentos, sem bônus, e divida." />
      </form>
      <Results>
        <ResultRow testId="ap-chain-now" label="Ataques a bárbaros em uma sequência com os seus PA agora" value={`${fmt(chainNow.attacks)} ataques (${fmt(chainNow.spent)} PA gastos, sobram ${fmt(chainNow.left)})`}
          cite={cites.barbarian} notes={[chainNote]} />
        <ResultRow testId="ap-claim" label="PA depois da coleta diária" cite={both} pending={capPending}
          value={claim.claimed ? `${fmt(claim.ap)} PA${claim.overCap ? ` (${fmt(claim.overCap)} acima do limite de ${fmt(fullCap)})` : ""}` : `Não dá para coletar: você está no limite de ${fmt(fullCap)} ou acima dele`}
          notes={["A coleta funciona enquanto você está abaixo do limite e pode levá-lo acima dele."]} />
        <ResultRow testId="ap-chain-after" label="Ataques a bárbaros em uma sequência depois da coleta" value={`${fmt(chainAfter.attacks)} ataques`}
          cite={mergeCites(cites.barbarian, cites.claim)} />
        <ResultRow testId="ap-gems" label={`Gemas para mais ${fmt(v.packsToBuy)} ${v.packsToBuy === 1 ? "pacote" : "pacotes"} hoje`} value={`${fmt(gems)} gemas`} cite={cites.pack}
          notes={[`O próximo pacote custa ${fmt(packPrice(v.purchasesToday, pack))} gemas; cada um depois custa ${fmt(pack.stepGems)} a mais até o reset diário.`]} />
        <ResultRow testId="ap-total" label="PA depois da coleta e desses pacotes" value={`${fmt(withPacks)} PA`} cite={mergeCites(both, cites.pack)} />
        <ResultRow testId="ap-regen" label={`Tempo para encher até o limite de ${fmt(fullCap)}`} cite={cites.cap} pending={["PA recuperados por hora"]}
          value={hours === null ? <span class="t-prompt">Digite os PA que você recupera por hora</span> : formatDuration(hours * 3600)} />
      </Results>
      <ShareBar shareUrl={shareUrl} shared={shared} keepMine={keepMine} useLink={useLink} />
    </div>
  );
}
