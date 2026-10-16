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

const n = (x: number, d = 0) => x.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const usd = (x: number) => `US$ ${n(x, Number.isInteger(x) ? 0 : 2)}`;

/** Short regional warning, on every line that shows a price (the full warning is at the top). */
function PriceWarn() {
  return <span class="g-price-warn" data-price-warning>Preço de tabela em dólares; o preço na sua loja depende da região, da moeda e dos impostos.</span>;
}

function Meta({ v }: { v: Pick<LowValue, "confidence" | "facts" | "derived" | "gaps"> }) {
  return (
    <span class="g-kv-meta">
      <Confidence level={v.confidence} />
      {v.derived && <span> · calculado a partir das fichas</span>}
      {" · "}
      <FactIds ids={v.facts} />
      {v.gaps.length > 0 && <> · aguardando <span class="mono">{v.gaps.join(", ")}</span></>}
    </span>
  );
}

function Purchase({ p, times, assumed }: { p: LowPurchaseRow; times: number | null; assumed: boolean }) {
  const every = p.kind === "one-time" ? "uma vez" : p.periodDays ? `a cada ${p.periodDays} dias` : p.kind === "per-trigger" ? "quando aparece" : "por edição";
  return (
    <li class="g-low-item" data-low-purchase={p.id}>
      <span class="g-kv-value">{p.label}</span>
      <span>
        <span class="mono">{usd(p.priceUsd.value)}</span> {every}
        {times !== null && times > 0 && (
          <> · contado <span class="mono">{n(times, times % 1 ? 2 : 0)}</span>× por 30 dias{assumed && <span class="g-tag g-tag-up">Suposto</span>}</>
        )}
        {". "}
        <PriceWarn />
      </span>
      {(p.gems || p.vipPoints) && (
        <span>
          {p.gems && <><span class="mono">{n(p.gems.value)}</span> gemas</>}
          {p.gems && p.vipPoints && ", "}
          {p.vipPoints && <><span class="mono">{n(p.vipPoints.value)}</span> pontos de VIP</>}
          {(p.gemsPerUsd || p.vipPerUsd) && (
            <>
              {" → "}
              {p.gemsPerUsd && <><span class="mono">{n(p.gemsPerUsd.value)}</span> gemas por US$</>}
              {p.gemsPerUsd && p.vipPerUsd && ", "}
              {p.vipPerUsd && <><span class="mono">{n(p.vipPerUsd.value)}</span> pontos de VIP por US$</>}
              {" (só gemas e VIP bruto)"}
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
      <h3>Metas para quem gasta pouco</h3>
      <p>
        {low.message} Estes são números do perfil Low, tirados das fichas de fatos, separados da base F2P mais abaixo.{" "}
        No geral: <Confidence level={low.confidence} />.
      </p>
      <p class="g-callout" data-price-warning>{low.priceWarning}</p>

      <div class="g-low-method" id="budget-low-method">
        <h4>Como se conta o valor por dólar</h4>
        <p>
          Só gemas e pontos de VIP brutos por dólar. {low.valueMethod.text}{" "}
          <span class="g-kv-meta"><Confidence level={low.valueMethod.confidence} /> · <FactIds ids={low.valueMethod.facts} /></span>
        </p>
        <p><a href="/tools/pack-value/">Confira um pacote pelo preço que você vê</a> com o mesmo método.</p>
      </div>

      {v.tiers.map((t) => (
        <div class="g-low-tier" key={t.id} data-low-tier={t.id}>
          <h4>{t.label}</h4>
          <p class="g-small">{t.note}</p>
          <dl class="g-kv">
            <div>
              <dt>Gasto recorrente</dt>
              <dd>
                <span class="g-kv-value"><span class="mono">{usd(t.monthlyUsd.value)}</span> por 30 dias. <PriceWarn /></span>
                <Meta v={t.monthlyUsd} />
                <span class="g-kv-note">
                  {t.withinLowRange
                    ? `Dentro da faixa Low de ${usd(low.rangeUsdPerMonth.min)}–${usd(low.rangeUsdPerMonth.max)} por mês.`
                    : `Fora da faixa Low de ${usd(low.rangeUsdPerMonth.min)}–${usd(low.rangeUsdPerMonth.max)} por mês.`}{" "}
                  {low.rangeUsdPerMonth.note}
                </span>
              </dd>
            </div>
            <div>
              <dt>Gemas de compras recorrentes</dt>
              <dd>
                <span class="g-kv-value"><span class="mono">{n(t.monthlyGems.value)}</span> por 30 dias (mínimo)</span>
                <Meta v={t.monthlyGems} />
              </dd>
            </div>
            {t.monthlyVipPoints.value > 0 && (
              <div>
                <dt>Pontos de VIP dos pacotes</dt>
                <dd>
                  <span class="g-kv-value"><span class="mono">{n(t.monthlyVipPoints.value)}</span> por 30 dias</span>
                  <Meta v={t.monthlyVipPoints} />
                </dd>
              </div>
            )}
            <div>
              <dt>Compras únicas</dt>
              <dd>
                <span class="g-kv-value"><span class="mono">{usd(t.oneTimeUsd.value)}</span> uma vez, por <span class="mono">{n(t.oneTimeGems.value)}</span> gemas. <PriceWarn /></span>
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
          <h4>Em nenhuma das faixas</h4>
          <p class="g-small">Listadas para comparação. As ofertas diárias são o teto da faixa Low, não uma recomendação.</p>
          <ul class="g-low-list">
            {v.outside.map((p) => <Purchase key={p.id} p={p} times={null} assumed={false} />)}
          </ul>
        </div>
      )}

      <div class="g-low-tier">
        <h4>Fundo de Crescimento na Prefeitura 25</h4>
        <p>
          <span class="mono">{n(low.growthFund.ch25Gems.value)}</span> gemas no marco da Prefeitura 25.{" "}
          {v.reachedCH25 ? <span class="g-tag">Alcançado</span> : <span class="g-tag g-tag-up">Na Pref. 25</span>} {low.growthFund.note}{" "}
          <Meta v={low.growthFund.ch25Gems} />
        </p>
      </div>

      <div class="g-low-tier">
        <h4>Linha do tempo do VIP com o Suprimento de Gemas de 30 dias</h4>
        <p class="g-small">
          {low.vip.label}. <Confidence level={low.vip.confidence} /> · <FactIds ids={low.vip.facts} />
          {low.vip.gaps.length > 0 && <> · waiting on <span class="mono">{low.vip.gaps.join(", ")}</span></>}
        </p>
        <div class="ko-table" tabindex={0} role="region" aria-label="Linha do tempo do VIP com o Suprimento de Gemas, rola para os lados">
          <table>
            <thead>
              <tr><th scope="col">VIP</th><th scope="col">Pontos</th><th scope="col">Dia alcançado (Low, com suprimento)</th></tr>
            </thead>
            <tbody>
              {low.vip.rows.map((r) => (
                <tr key={r.vip}>
                  <th scope="row" class="mono">{r.vip}</th>
                  <td class="mono">{n(r.threshold)}</td>
                  <td>
                    {r.day === null ? "mais de 10 anos" : <><span class="mono">dia {n(r.day)}</span>{r.day <= kvk1Day && <span class="g-by"> até o KvK1</span>}</>}
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
