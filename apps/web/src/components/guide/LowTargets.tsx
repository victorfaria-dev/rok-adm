import type { AccountProfile } from "@rokadm/core";
import type { LowBudgetPayload, LowPurchaseRow, LowValue } from "../../lib/guide-types";
import { lowBudgetView } from "../../lib/guide-view";
import { Confidence, FactIds } from "./Confidence";

interface Props {
  low: LowBudgetPayload;
  profile: AccountProfile;
  /** Kingdom day KvK1 starts (from the F2P payload), to mark VIP levels reached before it. */
  kvk1Day: number;
}

const n = (x: number, d = 0) => x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const usd = (x: number) => `$${n(x, Number.isInteger(x) ? 0 : 2)}`;

/** Short regional warning, on every line that shows a price (the full warning is at the top). */
function PriceWarn() {
  return <span class="g-price-warn" data-price-warning>List price in USD; your store's price depends on region, currency and tax.</span>;
}

function Meta({ v }: { v: Pick<LowValue, "confidence" | "facts" | "derived" | "gaps"> }) {
  return (
    <span class="g-kv-meta">
      <Confidence level={v.confidence} />
      {v.derived && <span> · computed from the cards</span>}
      {" · "}
      <FactIds ids={v.facts} />
      {v.gaps.length > 0 && <> · waiting on <span class="mono">{v.gaps.join(", ")}</span></>}
    </span>
  );
}

function Purchase({ p, times, assumed }: { p: LowPurchaseRow; times: number | null; assumed: boolean }) {
  const every = p.kind === "one-time" ? "once" : p.periodDays ? `every ${p.periodDays} days` : p.kind === "per-trigger" ? "when it appears" : "per edition";
  return (
    <li class="g-low-item" data-low-purchase={p.id}>
      <span class="g-kv-value">{p.label}</span>
      <span>
        <span class="mono">{usd(p.priceUsd.value)}</span> {every}
        {times !== null && times > 0 && (
          <> · counted <span class="mono">{n(times, times % 1 ? 2 : 0)}</span>× per 30 days{assumed && <span class="g-tag g-tag-up">Assumed</span>}</>
        )}
        {". "}
        <PriceWarn />
      </span>
      {(p.gems || p.vipPoints) && (
        <span>
          {p.gems && <><span class="mono">{n(p.gems.value)}</span> gems</>}
          {p.gems && p.vipPoints && ", "}
          {p.vipPoints && <><span class="mono">{n(p.vipPoints.value)}</span> VIP points</>}
          {(p.gemsPerUsd || p.vipPerUsd) && (
            <>
              {" → "}
              {p.gemsPerUsd && <><span class="mono">{n(p.gemsPerUsd.value)}</span> gems per $</>}
              {p.gemsPerUsd && p.vipPerUsd && ", "}
              {p.vipPerUsd && <><span class="mono">{n(p.vipPerUsd.value)}</span> VIP points per $</>}
              {" (gems and raw VIP only)"}
            </>
          )}
        </span>
      )}
      <span class="g-kv-note">{p.items} {p.note}</span>
      <span class="g-kv-meta">
        <Confidence level={p.confidence} /> · <FactIds ids={p.facts} />
        {p.priceUsd.gaps.length > 0 && <> · waiting on <span class="mono">{p.priceUsd.gaps.join(", ")}</span></>}
      </span>
    </li>
  );
}

/** Low spender targets (wave J) inside #budget: Low numbers only, apart from the F2P baseline. */
export function LowTargets({ low, profile, kvk1Day }: Props) {
  const v = lowBudgetView(low, profile);
  return (
    <div class="g-sub g-low" id="budget-low" data-low-targets>
      <h3>Low spender targets</h3>
      <p>
        {low.message} These are Low numbers from the fact cards, separate from the F2P baseline further down.{" "}
        Overall: <Confidence level={low.confidence} />.
      </p>
      <p class="g-callout" data-price-warning>{low.priceWarning}</p>

      <div class="g-low-method" id="budget-low-method">
        <h4>How value per dollar is counted</h4>
        <p>
          Gems and raw VIP points per dollar only. {low.valueMethod.text}{" "}
          <span class="g-kv-meta"><Confidence level={low.valueMethod.confidence} /> · <FactIds ids={low.valueMethod.facts} /></span>
        </p>
        <p><a href="/tools/pack-value/">Check a pack at the price you see</a> with the same method.</p>
      </div>

      {v.tiers.map((t) => (
        <div class="g-low-tier" key={t.id} data-low-tier={t.id}>
          <h4>{t.label}</h4>
          <p class="g-small">{t.note}</p>
          <dl class="g-kv">
            <div>
              <dt>Recurring spend</dt>
              <dd>
                <span class="g-kv-value"><span class="mono">{usd(t.monthlyUsd.value)}</span> per 30 days. <PriceWarn /></span>
                <Meta v={t.monthlyUsd} />
                <span class="g-kv-note">
                  {t.withinLowRange
                    ? `Inside the Low range of ${usd(low.rangeUsdPerMonth.min)}–${usd(low.rangeUsdPerMonth.max)} a month.`
                    : `Outside the Low range of ${usd(low.rangeUsdPerMonth.min)}–${usd(low.rangeUsdPerMonth.max)} a month.`}{" "}
                  {low.rangeUsdPerMonth.note}
                </span>
              </dd>
            </div>
            <div>
              <dt>Gems from recurring purchases</dt>
              <dd>
                <span class="g-kv-value"><span class="mono">{n(t.monthlyGems.value)}</span> per 30 days (floor)</span>
                <Meta v={t.monthlyGems} />
              </dd>
            </div>
            {t.monthlyVipPoints.value > 0 && (
              <div>
                <dt>VIP points from packs</dt>
                <dd>
                  <span class="g-kv-value"><span class="mono">{n(t.monthlyVipPoints.value)}</span> per 30 days</span>
                  <Meta v={t.monthlyVipPoints} />
                </dd>
              </div>
            )}
            <div>
              <dt>One-time purchases</dt>
              <dd>
                <span class="g-kv-value"><span class="mono">{usd(t.oneTimeUsd.value)}</span> once, for <span class="mono">{n(t.oneTimeGems.value)}</span> gems. <PriceWarn /></span>
                <Meta v={t.oneTimeUsd} />
              </dd>
            </div>
          </dl>
          <ul class="g-low-list">
            {t.lines.map((l) => <Purchase key={l.purchase.id} p={l.purchase} times={l.timesPerMonth} assumed={l.assumed} />)}
          </ul>
        </div>
      ))}

      {v.outside.length > 0 && (
        <div class="g-low-tier" data-low-outside>
          <h4>Not in either tier</h4>
          <p class="g-small">Listed for comparison. The daily offers are the ceiling of the Low range, not a recommendation.</p>
          <ul class="g-low-list">
            {v.outside.map((p) => <Purchase key={p.id} p={p} times={null} assumed={false} />)}
          </ul>
        </div>
      )}

      <div class="g-low-tier">
        <h4>Growth Fund at City Hall 25</h4>
        <p>
          <span class="mono">{n(low.growthFund.ch25Gems.value)}</span> gems at the City Hall 25 milestone.{" "}
          {v.reachedCH25 ? <span class="g-tag">Reached</span> : <span class="g-tag g-tag-up">At CH 25</span>} {low.growthFund.note}{" "}
          <Meta v={low.growthFund.ch25Gems} />
        </p>
      </div>

      <div class="g-low-tier">
        <h4>VIP timeline with the 30-day Gem Supply</h4>
        <p class="g-small">
          {low.vip.label}. <Confidence level={low.vip.confidence} /> · <FactIds ids={low.vip.facts} />
          {low.vip.gaps.length > 0 && <> · waiting on <span class="mono">{low.vip.gaps.join(", ")}</span></>}
        </p>
        <div class="ko-table" tabindex={0} role="region" aria-label="VIP timeline with the Gem Supply, scrolls sideways">
          <table>
            <thead>
              <tr><th scope="col">VIP</th><th scope="col">Points</th><th scope="col">Day reached (Low, with supply)</th></tr>
            </thead>
            <tbody>
              {low.vip.rows.map((r) => (
                <tr key={r.vip}>
                  <th scope="row" class="mono">{r.vip}</th>
                  <td class="mono">{n(r.threshold)}</td>
                  <td>
                    {r.day === null ? "over 10 years" : <><span class="mono">day {n(r.day)}</span>{r.day <= kvk1Day && <span class="g-by"> by KvK1</span>}</>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p class="g-small">{low.vip.note}</p>
      </div>

      <p class="g-small">
        {low.recharge.text} <Confidence level={low.recharge.confidence} /> · <FactIds ids={low.recharge.facts} />
        {low.recharge.gaps.length > 0 && <> · waiting on <span class="mono">{low.recharge.gaps.join(", ")}</span></>}
      </p>
    </div>
  );
}
