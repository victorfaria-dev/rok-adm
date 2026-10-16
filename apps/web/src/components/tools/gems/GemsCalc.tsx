import {
  gemsCollected, gemsStillToCome, ladderRows, ladderTotal, shopForVip,
  type Cite as CiteData, type LadderRule, type LevelGems, type ShopRowView,
} from "@rokadm/planner/tools";
import { Cite } from "../kit/Cite";
import { NumberField, SelectField } from "../kit/NumberField";
import { ResultRow, Results } from "../kit/Result";
import { ShareBar } from "../kit/ShareBar";
import { useToolInputs } from "../kit/useToolInputs";

export interface GemsCalcProps {
  ap: LadderRule;
  shop: ShopRowView[];
  chGems: LevelGems[];
  cites: { ap: CiteData; shop: CiteData; ch: CiteData };
}

const fmt = (n: number, d = 0) => n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const MAX_BUYS = 20;

/** F-21: AP price ladder, VIP Shop items by VIP level, City Hall reward gems still to come. */
export default function GemsCalc({ ap, shop, chGems, cites }: GemsCalcProps) {
  const maxVip = Math.max(...shop.map((r) => r.vip));
  const { values: v, set, shared, shareUrl, keepMine, useLink } = useToolInputs("gems", { apBuys: 3, cityHall: 15, shopVip: "all" });
  const buys = Math.min(MAX_BUYS, Math.max(1, v.apBuys));
  const rows = ladderRows(buys, ap);
  const last = rows.at(-1)!;
  const vipFilter = v.shopVip === "all" ? null : Number(v.shopVip);
  const shown = shopForVip(shop, Number.isFinite(vipFilter) ? vipFilter : null);
  const vipOptions = [{ value: "all", label: "Todos os níveis de VIP" }, ...Array.from({ length: maxVip }, (_, i) => ({ value: String(i + 1), label: `VIP ${i + 1} ou menos` }))];

  return (
    <div class="t-page-body" data-tool="gems">
      <section class="t-section" aria-labelledby="ap-h">
        <h2 id="ap-h">Pontos de Ação comprados com gemas</h2>
        <p class="t-note">Você só pode comprar {fmt(ap.perPurchase)} PA com gemas quando não tem mais itens de recuperação de PA. O preço sobe a cada compra e volta ao normal no reset diário do servidor.</p>
        <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Dados da compra de Pontos de Ação">
          <NumberField id="gems-ap-buys" label="Compras hoje" value={v.apBuys} min={1} max={MAX_BUYS} onChange={(x) => set({ apBuys: x })}
            help={`Quantas vezes você compra ${fmt(ap.perPurchase)} PA hoje (1 a ${MAX_BUYS}).`} />
          <NumberField id="gems-ch" label="Nível da sua Prefeitura" value={v.cityHall} min={1} max={25} onChange={(x) => set({ cityHall: x })}
            help="Para as gemas únicas que as melhorias da Prefeitura ainda dão." />
        </form>
        <Results>
          <ResultRow testId="gems-ap-total" label={`Gemas para ${buys} ${buys === 1 ? "compra" : "compras"} hoje`} value={fmt(ladderTotal(buys, ap))} cite={cites.ap}
            notes={[`Isso dá ${fmt(last.amount)} PA. A última compra custa ${fmt(last.price)} gemas (${fmt(last.perUnit, 2)} gemas por PA).`]} />
          <ResultRow testId="gems-ch-left" label={`Gemas únicas que ainda virão das recompensas da Prefeitura acima do nível ${v.cityHall}`}
            value={fmt(gemsStillToCome(v.cityHall, chGems))} cite={cites.ch}
            notes={[`Já coletadas até a Prefeitura ${v.cityHall}: ${fmt(gemsCollected(v.cityHall, chGems))} gemas.`]} />
        </Results>
        <div class="t-table" role="region" aria-label="Preço dos Pontos de Ação por compra" tabindex={0}>
          <table>
            <caption>Preço de cada compra hoje <Cite cite={cites.ap} /></caption>
            <thead><tr><th scope="col">Compra</th><th scope="col">Preço (gemas)</th><th scope="col">Total até agora</th><th scope="col">PA até agora</th><th scope="col">Gemas por PA</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.n}><td class="mono">{r.n}</td><td class="mono">{fmt(r.price)}</td><td class="mono">{fmt(r.total)}</td><td class="mono">{fmt(r.amount)}</td><td class="mono">{fmt(r.perUnit, 2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section class="t-section" aria-labelledby="shop-h">
        <h2 id="shop-h">Itens da Loja VIP vendidos em gemas</h2>
        <p class="t-note">A loja reabastece toda semana. "Gemas por minuto" é calculado (preço ÷ os minutos no nome do item) e só aparece para acelerações.</p>
        <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Filtro da Loja VIP">
          <SelectField id="gems-shop-vip" label="Mostrar itens que você pode comprar com" value={v.shopVip} options={vipOptions} onChange={(x) => set({ shopVip: x })} />
        </form>
        <p class="t-progress" aria-live="polite" data-testid="gems-shop-count">{shown.length} de {shop.length} itens exibidos</p>
        <div class="t-table" role="region" aria-label="Tabela de preços da Loja VIP" tabindex={0}>
          <table data-testid="gems-shop">
            <caption>Loja VIP, preços em gemas <Cite cite={cites.shop} /></caption>
            <thead>
              <tr><th scope="col">Item</th><th scope="col">Gemas</th><th scope="col">VIP necessário</th><th scope="col">Por semana</th><th scope="col">Gemas por minuto (calculado)</th></tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={`${r.item}-${r.vip}`}>
                  <td>{r.item}</td>
                  <td class="mono">{fmt(r.price)}</td>
                  <td class="mono">{r.vip}</td>
                  <td class="mono">{fmt(r.qty)}</td>
                  <td class="mono">{r.gemsPerMinute === null ? "n/d" : fmt(r.gemsPerMinute, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <ShareBar shareUrl={shareUrl} shared={shared} keepMine={keepMine} useLink={useLink} />
    </div>
  );
}
