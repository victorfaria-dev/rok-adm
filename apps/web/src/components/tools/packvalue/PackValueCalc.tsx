import type { Cite as CiteData } from "@rokadm/planner/tools";
import { compareGems, packValue, type PackReference } from "../../../lib/pack-value";
import { NumberField, SelectField } from "../kit/NumberField";
import { ResultRow, Results } from "../kit/Result";
import { ShareBar } from "../kit/ShareBar";
import { useToolInputs } from "../kit/useToolInputs";

export interface PackValueCalcProps {
  refs: PackReference[];
  /** The method card (A12-0618). */
  method: CiteData;
}

const fmt = (n: number, d = 0) => n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Gems and raw VIP points per unit of money, at the price the player sees (A12-0618 method only). */
export default function PackValueCalc({ refs, method }: PackValueCalcProps) {
  const { values: v, set, shared, shareUrl, keepMine, useLink } = useToolInputs("packvalue", { price: 4.99, gems: 1050, vip: 525, currency: "usd" });
  const currency = v.currency === "other" ? "other" : "usd";
  const unit = currency === "usd" ? "dólar" : "unidade da sua moeda";
  const value = packValue({ price: v.price, gems: v.gems, vipPoints: v.vip });
  const cmp = value ? compareGems(value, refs, currency) : null;

  return (
    <section class="t-section" aria-labelledby="pv-h" data-tool="pack-value">
      <h2 id="pv-h">Seu pacote</h2>
      <p class="t-note">Digite o que a loja mostra. Só as gemas e os pontos VIP contam; o resto do pacote fica de fora.</p>
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Dados do pacote">
        <NumberField id="pv-price" label="Preço que você vê" value={v.price} integer={false} min={0} onChange={(x) => set({ price: x })}
          help="Na moeda da sua loja, com impostos se a sua loja os mostrar." />
        <SelectField id="pv-currency" label="Moeda" value={currency} onChange={(x) => set({ currency: x })}
          options={[{ value: "usd", label: "Dólares americanos" }, { value: "other", label: "Outra moeda" }]}
          help="Os pacotes de referência usam preços de tabela em USD, então só são comparados quando a sua loja mostra USD." />
        <NumberField id="pv-gems" label="Gemas no pacote" value={v.gems} min={0} onChange={(x) => set({ gems: x })} />
        <NumberField id="pv-vip" label="Pontos VIP no pacote" value={v.vip} min={0} onChange={(x) => set({ vip: x })} />
      </form>
      <ShareBar shared={shared} shareUrl={shareUrl} keepMine={keepMine} useLink={useLink} />
      {value ? (
        <Results>
          <ResultRow testId="pv-gems-per" label={`Gemas por ${unit}`} value={fmt(value.gemsPerUnit, 1)} cite={method}
            notes={["Razão bruta: gemas ÷ preço. Os itens não são convertidos em gemas."]} />
          <ResultRow testId="pv-vip-per" label={`Pontos VIP por ${unit}`} value={fmt(value.vipPerUnit, 1)} cite={method}
            notes={["Razão bruta: pontos VIP ÷ preço."]} />
        </Results>
      ) : (
        <p class="t-note" role="status" data-testid="pv-empty">Digite um preço maior que zero para ver as razões.</p>
      )}
      {cmp && (
        <p class="t-note" data-testid="pv-compare">
          Só pelas gemas brutas por dólar, este pacote dá mais que {cmp.moreGemsThan.length > 0 ? cmp.moreGemsThan.join(", ") : "nenhum dos pacotes de referência"}
          {cmp.fewerGemsThan.length > 0 && <>, e menos que {cmp.fewerGemsThan.join(", ")}</>}. Isso não diz nada sobre os itens, que podem valer
          mais ou menos para você do que as gemas.
        </p>
      )}
      {value && currency === "other" && (
        <p class="t-note" data-testid="pv-no-compare">Não comparado com os pacotes de referência: os preços deles são preços de tabela em USD, e os preços das lojas variam por região.</p>
      )}
    </section>
  );
}
