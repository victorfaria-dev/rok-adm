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

const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const MAX_BUYS = 20;

/** F-21: AP price ladder, VIP Shop items by VIP level, City Hall reward gems still to come. */
export default function GemsCalc({ ap, shop, chGems, cites }: GemsCalcProps) {
  const maxVip = Math.max(...shop.map((r) => r.vip));
  const { values: v, set, shared, shareUrl } = useToolInputs("gems", { apBuys: 3, cityHall: 15, shopVip: "all" });
  const buys = Math.min(MAX_BUYS, Math.max(1, v.apBuys));
  const rows = ladderRows(buys, ap);
  const last = rows.at(-1)!;
  const vipFilter = v.shopVip === "all" ? null : Number(v.shopVip);
  const shown = shopForVip(shop, Number.isFinite(vipFilter) ? vipFilter : null);
  const vipOptions = [{ value: "all", label: "All VIP levels" }, ...Array.from({ length: maxVip }, (_, i) => ({ value: String(i + 1), label: `VIP ${i + 1} and below` }))];

  return (
    <div class="t-page-body" data-tool="gems">
      <section class="t-section" aria-labelledby="ap-h">
        <h2 id="ap-h">Action Points bought with gems</h2>
        <p class="t-note">You can buy {fmt(ap.perPurchase)} AP with gems only when you have no AP recovery items left. The price goes up with each purchase and resets at the daily server reset.</p>
        <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Action Point purchase inputs">
          <NumberField id="gems-ap-buys" label="Purchases today" value={v.apBuys} min={1} max={MAX_BUYS} onChange={(x) => set({ apBuys: x })}
            help={`How many times you buy ${fmt(ap.perPurchase)} AP today (1 to ${MAX_BUYS}).`} />
          <NumberField id="gems-ch" label="Your City Hall level" value={v.cityHall} min={1} max={25} onChange={(x) => set({ cityHall: x })}
            help="For the one-time gems City Hall upgrades still give you." />
        </form>
        <Results>
          <ResultRow testId="gems-ap-total" label={`Gems for ${buys} purchase${buys === 1 ? "" : "s"} today`} value={fmt(ladderTotal(buys, ap))} cite={cites.ap}
            notes={[`That is ${fmt(last.amount)} AP. The last purchase costs ${fmt(last.price)} gems (${fmt(last.perUnit, 2)} gems per AP).`]} />
          <ResultRow testId="gems-ch-left" label={`One-time gems still to come from City Hall rewards above level ${v.cityHall}`}
            value={fmt(gemsStillToCome(v.cityHall, chGems))} cite={cites.ch}
            notes={[`Already collected up to City Hall ${v.cityHall}: ${fmt(gemsCollected(v.cityHall, chGems))} gems.`]} />
        </Results>
        <div class="t-table" role="region" aria-label="Action Point price by purchase" tabindex={0}>
          <table>
            <caption>Price of each purchase today <Cite cite={cites.ap} /></caption>
            <thead><tr><th scope="col">Purchase</th><th scope="col">Price (gems)</th><th scope="col">Total so far</th><th scope="col">AP so far</th><th scope="col">Gems per AP</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.n}><td class="mono">{r.n}</td><td class="mono">{fmt(r.price)}</td><td class="mono">{fmt(r.total)}</td><td class="mono">{fmt(r.amount)}</td><td class="mono">{fmt(r.perUnit, 2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section class="t-section" aria-labelledby="shop-h">
        <h2 id="shop-h">VIP Shop items priced in gems</h2>
        <p class="t-note">The shop restocks weekly. "Gems per minute" is derived (price ÷ the minutes in the item name) and only shown for speedups.</p>
        <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="VIP Shop filter">
          <SelectField id="gems-shop-vip" label="Show items you can buy at" value={v.shopVip} options={vipOptions} onChange={(x) => set({ shopVip: x })} />
        </form>
        <p class="t-progress" aria-live="polite" data-testid="gems-shop-count">{shown.length} of {shop.length} items shown</p>
        <div class="t-table" role="region" aria-label="VIP Shop items priced in gems" tabindex={0}>
          <table data-testid="gems-shop">
            <caption>VIP Shop, gem prices <Cite cite={cites.shop} /></caption>
            <thead>
              <tr><th scope="col">Item</th><th scope="col">Gems</th><th scope="col">VIP needed</th><th scope="col">Per week</th><th scope="col">Gems per minute (derived)</th></tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={`${r.item}-${r.vip}`}>
                  <td>{r.item}</td>
                  <td class="mono">{fmt(r.price)}</td>
                  <td class="mono">{r.vip}</td>
                  <td class="mono">{fmt(r.qty)}</td>
                  <td class="mono">{r.gemsPerMinute === null ? "n/a" : fmt(r.gemsPerMinute, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <ShareBar shareUrl={shareUrl} shared={shared} />
    </div>
  );
}
