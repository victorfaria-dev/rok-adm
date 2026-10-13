import { PROFILE_NAMES, type AccountProfile } from "@rokadm/core";
import type { BudgetPayload } from "../../lib/guide-types";
import { budgetView } from "../../lib/guide-view";
import { Confidence, FactIds } from "./Confidence";

interface Props {
  budget: BudgetPayload;
  profile: AccountProfile;
}

const n = (x: number) => x.toLocaleString("en-US");

type Row = BudgetPayload["targets"][number];

function DayCell({ day, kvk }: { day: number | null; kvk: number }) {
  if (day === null) return <td>over 10 years</td>;
  return (
    <td>
      <span class="mono">day {n(day)}</span>
      {day <= kvk && <span class="g-by"> by KvK1</span>}
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
              {r.derived && <span> · computed from the cards</span>}
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
export function Budget({ budget: b, profile }: Props) {
  const v = budgetView(b, profile);
  const name = PROFILE_NAMES[profile.spending];
  const kvk = b.kvk1Day.value;
  const baseline = v.researched ? "" : " (F2P baseline)";

  return (
    <section class="g-section g-budget" id="budget" aria-labelledby="budget-h">
      <h2 id="budget-h">Budget reality check</h2>
      <p class="g-lede">
        What {v.researched ? `a ${name} account` : "an account"} can reach by KvK1, which starts around kingdom day{" "}
        <span class="mono">{kvk}</span>. Only guaranteed income is counted, so day counts are upper bounds.
      </p>

      {!v.researched && (
        <p class="g-callout">
          Targets for {name} are not researched yet, so nothing here is estimated for {name}. The numbers below are the
          F2P baseline: what any account reaches without spending.
        </p>
      )}

      {v.showUnchanged && (
        <div class="g-sub" id="budget-unchanged">
          <h3>What buying doesn't change</h3>
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
            ? <>Your kingdom is on day <span class="mono">{profile.kingdomDay}</span>, past the KvK1 start. The tables show the path to it.</>
            : <>Your kingdom is on day <span class="mono">{profile.kingdomDay}</span>: <span class="mono">{v.daysToKvK1}</span> days to KvK1. Your row is marked in the checkpoints.</>}
        </p>
      )}

      <div class="g-sub">
        <h3>By KvK1{baseline}</h3>
        <SourcedList rows={b.targets} />
      </div>

      <div class="g-sub">
        <h3>Income used{baseline}</h3>
        <SourcedList rows={b.income} />
      </div>

      <div class="g-sub">
        <h3>VIP timeline{baseline}</h3>
        <p class="g-small">
          Day each VIP level is reached; levels marked “by KvK1” come before it. Chest only: <Confidence level={b.vip.chestOnly.confidence} />.
          Chest + gems: <Confidence level={b.vip.withGems.confidence} />. <FactIds ids={[...new Set([...b.vip.chestOnly.facts, ...b.vip.withGems.facts])]} />
        </p>
        <div class="ko-table" tabindex={0} role="region" aria-label="VIP timeline, scrolls sideways">
          <table>
            <thead>
              <tr><th scope="col">VIP</th><th scope="col">Points</th><th scope="col">Chest only</th><th scope="col">Chest + gems</th></tr>
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
        <h3>Checkpoints{baseline}</h3>
        <div class="ko-table" tabindex={0} role="region" aria-label="Checkpoints by kingdom day, scrolls sideways">
          <table>
            <thead>
              <tr><th scope="col">Day</th><th scope="col">Guaranteed gems</th><th scope="col">VIP, chest only</th><th scope="col">VIP, chest + gems</th></tr>
            </thead>
            <tbody>
              {v.rows.map((r) => {
                const you = v.here?.day === r.day;
                return (
                  <tr key={r.day} class={you ? "g-row-you" : undefined}>
                    <th scope="row" class="mono">{r.day}{you && <span class="g-you"> you</span>}</th>
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
        <h3>One-time gems</h3>
        <p class="g-small">Listed apart, not added to the timeline.</p>
        <ul class="g-list">
          {v.oneTime.map((g) => (
            <li key={g.id}>
              {g.label}: <span class="mono">{n(g.gems)}</span> gems
              {g.reached === true && <span class="g-tag">Reached</span>}
              {g.reached === false && g.unlockCityHall !== null && <span class="g-tag g-tag-up">At CH {g.unlockCityHall}</span>}{" "}
              <span class="g-kv-meta"><Confidence level={g.confidence} /> · <FactIds ids={g.facts} /></span>
            </li>
          ))}
        </ul>
      </div>

      <details class="g-assume">
        <summary>Assumptions behind these numbers</summary>
        <ul class="g-list">
          {b.assumptions.map((a) => (
            <li key={a.text}>
              {a.text} <FactIds ids={a.facts} />
              {a.gaps.length > 0 && <> · waiting on <span class="mono">{a.gaps.join(", ")}</span></>}
            </li>
          ))}
        </ul>
      </details>
      <p class="g-small">Numbers as of <span class="mono">{b.asOf}</span>.</p>
    </section>
  );
}
