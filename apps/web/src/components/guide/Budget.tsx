import { PROFILE_NAMES, type AccountProfile } from "@rokadm/core";
import type { BudgetPayload, LowBudgetPayload } from "../../lib/guide-types";
import { budgetView, showsLowTargets } from "../../lib/guide-view";
import { Confidence, FactIds } from "./Confidence";
import { LowTargets } from "./LowTargets";

interface Props {
  budget: BudgetPayload;
  profile: AccountProfile;
  /** Low spender targets (wave J); rendered for the Low profile only. */
  low?: LowBudgetPayload | null;
}

const n = (x: number) => x.toLocaleString("pt-BR");

type Row = BudgetPayload["targets"][number];

function DayCell({ day, kvk }: { day: number | null; kvk: number }) {
  if (day === null) return <td>mais de 10 anos</td>;
  return (
    <td>
      <span class="mono">dia {n(day)}</span>
      {day <= kvk && <span class="g-by"> até o KvK1</span>}
    </td>
  );
}

function SourcedList({ rows }: { rows: Row[] }) {
  return (
    <dl class="g-kv">
      {rows.map((r) => (
        <div key={r.label}>
          <dt>{r.label}</dt>
          <dd>
            <span class="g-kv-value">{r.value}</span>
            <span class="g-kv-meta">
              <Confidence level={r.confidence} />
              {r.derived && <span> · calculado a partir das fichas</span>}
              {" · "}
              <FactIds ids={r.facts} />
            </span>
            {r.note && <span class="g-kv-note">{r.note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** F-14 Budget Reality Check (#budget). Every number comes precomputed from @rokadm/planner. */
export function Budget({ budget: b, profile, low = null }: Props) {
  const v = budgetView(b, profile);
  const lowTargets = low && showsLowTargets(profile) ? low : null;
  const name = PROFILE_NAMES[profile.spending];
  const kvk = b.kvk1Day.value;
  const baseline = v.researched ? "" : " (base F2P)";

  return (
    <section class="g-section g-budget" id="budget" aria-labelledby="budget-h">
      <h2 id="budget-h">Teste de realidade do orçamento</h2>
      <p class="g-lede">
        O que {v.researched ? `uma conta ${name}` : "uma conta"} consegue alcançar até o KvK1, que começa por volta do dia{" "}
        <span class="mono">{kvk}</span> do reino. Só conta a renda garantida, então as contagens de dias são limites máximos.
      </p>

      {lowTargets && <LowTargets low={lowTargets} profile={profile} kvk1Day={kvk} />}

      {!v.researched && (lowTargets ? (
        <p class="g-callout" data-f2p-baseline>
          As metas de KvK1 para {name} (Prefeitura, poder, VIP até o KvK1 com compras) ainda não foram pesquisadas. Tudo daqui para
          baixo é a base F2P: o que qualquer conta alcança sem gastar. Não é uma estimativa para {name}.
        </p>
      ) : (
        <p class="g-callout" data-f2p-baseline>
          As metas para {name} ainda não foram pesquisadas, então nada aqui é estimado para {name}. Os números abaixo são a
          base F2P: o que qualquer conta alcança sem gastar.
        </p>
      ))}

      {v.showUnchanged && (
        <div class="g-sub" id="budget-unchanged">
          <h3>O que comprar não muda</h3>
          <ul class="g-list">
            {b.unchanged.map((u) => (
              <li key={u.text}>
                {u.text}{" "}
                <span class="g-kv-meta">
                  <Confidence level={u.confidence} /> · <FactIds ids={u.facts} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(v.here || v.pastKvK1) && (
        <p class="g-here">
          {v.pastKvK1
            ? <>Seu reino está no dia <span class="mono">{profile.kingdomDay}</span>, depois do início do KvK1. As tabelas mostram o caminho até ele.</>
            : <>Seu reino está no dia <span class="mono">{profile.kingdomDay}</span>: faltam <span class="mono">{v.daysToKvK1}</span> dias para o KvK1. Sua linha está marcada nos pontos de controle.</>}
        </p>
      )}

      <div class="g-sub">
        <h3>Até o KvK1{baseline}</h3>
        <SourcedList rows={b.targets} />
      </div>

      <div class="g-sub">
        <h3>Renda usada{baseline}</h3>
        <SourcedList rows={b.income} />
      </div>

      <div class="g-sub">
        <h3>Linha do tempo do VIP{baseline}</h3>
        <p class="g-small">
          Dia em que cada nível de VIP é alcançado; os níveis marcados “até o KvK1” vêm antes dele. Só baú: <Confidence level={b.vip.chestOnly.confidence} />.
          Baú + gemas: <Confidence level={b.vip.withGems.confidence} />. <FactIds ids={[...new Set([...b.vip.chestOnly.facts, ...b.vip.withGems.facts])]} />
        </p>
        <div class="ko-table" tabindex={0} role="region" aria-label="Linha do tempo do VIP, rola para os lados">
          <table>
            <thead>
              <tr><th scope="col">VIP</th><th scope="col">Pontos</th><th scope="col">Só baú</th><th scope="col">Baú + gemas</th></tr>
            </thead>
            <tbody>
              {b.vip.rows.map((r) => (
                <tr key={r.vip}>
                  <th scope="row" class="mono">{r.vip}</th>
                  <td class="mono">{n(r.threshold)}</td>
                  <DayCell day={r.chestOnly} kvk={kvk} />
                  <DayCell day={r.withGems} kvk={kvk} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p class="g-small">{b.vip.withGems.note}</p>
      </div>

      <div class="g-sub">
        <h3>Pontos de controle{baseline}</h3>
        <div class="ko-table" tabindex={0} role="region" aria-label="Pontos de controle por dia do reino, rola para os lados">
          <table>
            <thead>
              <tr><th scope="col">Dia</th><th scope="col">Gemas garantidas</th><th scope="col">VIP, só baú</th><th scope="col">VIP, baú + gemas</th></tr>
            </thead>
            <tbody>
              {v.rows.map((r) => {
                const you = v.here?.day === r.day;
                return (
                  <tr key={r.day} class={you ? "g-row-you" : undefined}>
                    <th scope="row" class="mono">{r.day}{you && <span class="g-you"> você</span>}</th>
                    <td class="mono">{n(r.gems)}</td>
                    <td class="mono">{r.vipChestOnly}</td>
                    <td class="mono">{r.vipWithGems}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div class="g-sub">
        <h3>Gemas únicas</h3>
        <p class="g-small">Listadas à parte, sem entrar na linha do tempo.</p>
        <ul class="g-list">
          {v.oneTime.map((g) => (
            <li key={g.id}>
              {g.label}: <span class="mono">{n(g.gems)}</span> gemas
              {g.reached === true && <span class="g-tag">Alcançado</span>}
              {g.reached === false && g.unlockCityHall !== null && <span class="g-tag g-tag-up">Na Pref. {g.unlockCityHall}</span>}{" "}
              <span class="g-kv-meta"><Confidence level={g.confidence} /> · <FactIds ids={g.facts} /></span>
            </li>
          ))}
        </ul>
      </div>

      <details class="g-assume">
        <summary>Suposições por trás destes números</summary>
        <ul class="g-list">
          {b.assumptions.map((a) => (
            <li key={a.text}>
              {a.text} <FactIds ids={a.facts} />
              {a.gaps.length > 0 && <> · aguardando <span class="mono">{a.gaps.join(", ")}</span></>}
            </li>
          ))}
        </ul>
      </details>
      <p class="g-small">Números de <span class="mono">{b.asOf}</span>.</p>
    </section>
  );
}
