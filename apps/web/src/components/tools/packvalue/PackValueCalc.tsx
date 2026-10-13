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

const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Gems and raw VIP points per unit of money, at the price the player sees (A12-0618 method only). */
export default function PackValueCalc({ refs, method }: PackValueCalcProps) {
  const { values: v, set, shared, shareUrl, keepMine, useLink } = useToolInputs("packvalue", { price: 4.99, gems: 1050, vip: 525, currency: "usd" });
  const currency = v.currency === "other" ? "other" : "usd";
  const unit = currency === "usd" ? "dollar" : "unit of your currency";
  const value = packValue({ price: v.price, gems: v.gems, vipPoints: v.vip });
  const cmp = value ? compareGems(value, refs, currency) : null;

  return (
    <section class="t-section" aria-labelledby="pv-h" data-tool="pack-value">
      <h2 id="pv-h">Your pack</h2>
      <p class="t-note">Type what the store shows you. Only the gems and the VIP points count; everything else in the pack is left out.</p>
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Pack inputs">
        <NumberField id="pv-price" label="Price you see" value={v.price} integer={false} min={0} onChange={(x) => set({ price: x })}
          help="In your store's currency, taxes included if your store shows them." />
        <SelectField id="pv-currency" label="Currency" value={currency} onChange={(x) => set({ currency: x })}
          options={[{ value: "usd", label: "US dollars" }, { value: "other", label: "Another currency" }]}
          help="The reference packs use USD list prices, so they are compared only when your store shows USD." />
        <NumberField id="pv-gems" label="Gems in the pack" value={v.gems} min={0} onChange={(x) => set({ gems: x })} />
        <NumberField id="pv-vip" label="VIP points in the pack" value={v.vip} min={0} onChange={(x) => set({ vip: x })} />
      </form>
      <ShareBar shared={shared} shareUrl={shareUrl} keepMine={keepMine} useLink={useLink} />
      {value ? (
        <Results>
          <ResultRow testId="pv-gems-per" label={`Gems per ${unit}`} value={fmt(value.gemsPerUnit, 1)} cite={method}
            notes={["Raw ratio: gems ÷ price. Items are not converted to gems."]} />
          <ResultRow testId="pv-vip-per" label={`VIP points per ${unit}`} value={fmt(value.vipPerUnit, 1)} cite={method}
            notes={["Raw ratio: VIP points ÷ price."]} />
        </Results>
      ) : (
        <p class="t-note" role="status" data-testid="pv-empty">Enter a price above zero to see the ratios.</p>
      )}
      {cmp && (
        <p class="t-note" data-testid="pv-compare">
          By raw gems per dollar only, this pack gives more than {cmp.moreGemsThan.length > 0 ? cmp.moreGemsThan.join(", ") : "none of the reference packs"}
          {cmp.fewerGemsThan.length > 0 && <>, and fewer than {cmp.fewerGemsThan.join(", ")}</>}. That says nothing about the items, which can be
          worth more or less to you than the gems.
        </p>
      )}
      {value && currency === "other" && (
        <p class="t-note" data-testid="pv-no-compare">Not compared with the reference packs: their prices are USD list prices, and store prices differ by region.</p>
      )}
    </section>
  );
}
