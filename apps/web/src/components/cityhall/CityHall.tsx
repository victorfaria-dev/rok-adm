import { useLayoutEffect, useState } from "preact/hooks";
import { PROFILE_NAMES, defaultProfile } from "@rokadm/core";
import { ROUTINE_TASKS, planRoutine, withEffectiveSpending } from "@rokadm/planner";
import { gauge, nextLevel, stageTools, todayTop, type ChRow, type CityHallTargets, type Gauge } from "../../lib/city-hall";
import { profileFromCode } from "../../lib/profile";
import { countDone, doneToday, gameWeekday, setDone } from "../../lib/routine-day";
import { readStore, writeStore, type StoreV1 } from "../../lib/store";
import { encodeShare } from "../../lib/tools-store";
import "./cityhall.css";

// Every user-facing string of this island, in one place (i18n later).
const S = {
  title: "City Hall",
  lead: "Your account at a glance: today's must-dos, your next City Hall and how far you are from the KvK1 targets.",
  noProfile: "These are default answers. Answer 5 quick questions so the plan fits your account.",
  start: "Start",
  editOnMe: "Edit on Me",
  todayH: "Today",
  done: (n: number, of: number) => `${n} of ${of} done`,
  seeAll: (n: number) => `See all ${n} tasks`,
  mustDo: "must-do",
  nothing: "Nothing fits today's time. Open the full list to pick more minutes.",
  chH: "Your City Hall",
  chNow: "Now",
  next: (to: number) => `Next: City Hall ${to}`,
  needs: "Needs first",
  cost: "Cost",
  items: "Items",
  rawTime: "Raw build time",
  unreadable: "The source table row for this level is garbled: check the cost in game.",
  topLevel: "City Hall 25 is the top level. Nothing left to build here.",
  planMore: "Plan more levels",
  targetsH: "Targets by KvK1",
  targetsNote: "F2P baseline from the guide's Budget reality check: what any account reaches without spending.",
  readWhy: "Read the reasoning",
  chForKvk: (n: number) => `City Hall ${n} for KvK1`,
  chForKvkHelp: (n: number, no: number) => `Player reports call CH ${n}+ workable for KvK1; CH ${no} is not expected without spending.`,
  lostKingdom: (n: number) => `City Hall ${n} for Lost Kingdom`,
  kingdomDay: (d: number) => `Kingdom day to KvK1 (around day ${d})`,
  kingdomDayUnknown: (d: number) => `KvK1 starts around kingdom day ${d}. Add your kingdom's age on Me to track it here.`,
  pastKvk1: "Your kingdom is past KvK1. Use the late game guide for what comes next.",
  power: (a: number, b: number) => `Power around KvK1: ${a}M to ${b}M.`,
  t4: (d: number) => `T4 troops usually around kingdom day ${d}.`,
  vip: (v: number[]) => `VIP targets: ${v.map((x) => `VIP ${x}`).join(", then ")}.`,
  milestonesH: "City Hall rewards",
  milestone: (m: { label: string; gems: number; cityHall: number }) => `CH ${m.cityHall}: ${m.label} (${m.gems.toLocaleString("en-US")} gems)`,
  reached: "reached",
  toolsH: "Tools for this stage",
  gaugeText: (g: Gauge, unit: string) => `${unit} ${g.current} of ${g.target}${g.reached ? " · reached" : ""}`,
} as const;

interface Props {
  rows: ChRow[];
  targets: CityHallTargets;
  /** Clock; tests inject a fixed day. */
  now?: () => Date;
}

function Bar({ g, label, unit }: { g: Gauge; label: string; unit: string }) {
  return (
    <li class="ch-gauge" data-gauge data-reached={g.reached ? "" : undefined}>
      <span class="ch-gauge-label">{label}</span>
      <span class="ch-bar" aria-hidden="true"><span style={{ transform: `scaleX(${g.ratio})` }} /></span>
      <span class="ch-gauge-text mono">{S.gaugeText(g, unit)}</span>
    </li>
  );
}

/** City Hall tab: composed from the routine planner, the City Hall table and the guide's targets. */
export default function CityHall({ rows, targets: t, now = () => new Date() }: Props) {
  const [store, setStore] = useState<StoreV1 | null>(null);
  useLayoutEffect(() => setStore(readStore()), []);

  const saved = profileFromCode(store?.profileCode ?? null);
  const base = saved ?? defaultProfile();
  const profile = withEffectiveSpending(base, store?.profileOverride ?? null);
  const today = store ? now() : null;
  const budget = store?.routinePrefs?.minutes ?? base.minutesPerDay;
  const plan = planRoutine(ROUTINE_TASKS, profile, budget, {
    weekday: today ? gameWeekday(today) : null,
    includeWeekly: store?.routinePrefs?.includeWeekly === true,
    includeEvents: store?.routinePrefs?.includeEvents === true,
  });
  const top = todayTop(plan.included);
  const done = today ? doneToday(store?.routine ?? null, today) : [];
  const n = countDone(plan.included.map((x) => x.id), done);
  const toggle = (id: string, d: boolean): void => {
    setStore(writeStore({ routine: setDone(readStore().routine, id, d, now()) }));
  };

  const ch = base.cityHall;
  const next = nextLevel(rows, ch);
  const plannerLink = `/tools/buildings/?s=${encodeShare({ building: "A01-city-hall", from: ch, to: Math.min(ch + 5, 25), bonusPct: 0 })}`;
  const day = base.kingdomDay;

  return (
    <div class="ch" data-ready={store ? "" : undefined}>
      <header class="ch-head">
        <h1>{S.title}</h1>
        <p class="ch-lead">{S.lead}</p>
        {saved && (
          <p class="ch-for">
            <span class="mono">{PROFILE_NAMES[profile.spending]} · {base.minutesPerDay} min · CH {ch}</span>{" "}
            <a href="/me/">{S.editOnMe}</a>
          </p>
        )}
      </header>

      {store && !saved && (
        <div class="ch-banner" data-no-profile>
          <p>{S.noProfile}</p>
          <a class="btn btn-primary" href="/start/">{S.start}</a>
        </div>
      )}

      <section class="ch-card" aria-labelledby="ch-today-h" data-today>
        <div class="ch-card-head">
          <h2 id="ch-today-h">{S.todayH}</h2>
          <p class="ch-count mono" role="status" aria-live="polite">{S.done(n, plan.included.length)}</p>
        </div>
        {top.length ? (
          <ul class="ch-tasks" aria-label="Today's top tasks">
            {top.map((x) => (
              <li key={x.id}>
                <label class="ch-task" for={`ch-task-${x.id}`}>
                  <input id={`ch-task-${x.id}`} type="checkbox" checked={done.includes(x.id)}
                    onChange={(e) => toggle(x.id, (e.currentTarget as HTMLInputElement).checked)} />
                  <span>
                    <span class="ch-task-title">{x.title}</span>
                    <span class="ch-task-meta"><span class="mono">{x.isEstimate ? "~" : ""}{Math.round(x.minutes)} min</span>{x.mustDo && ` · ${S.mustDo}`}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p class="ch-muted">{S.nothing}</p>
        )}
        <a class="ch-more" href="/city-hall/today/" data-see-all>{S.seeAll(plan.included.length)}</a>
      </section>

      <section class="ch-card" aria-labelledby="ch-level-h" data-next-level>
        <div class="ch-card-head">
          <h2 id="ch-level-h">{S.chH}</h2>
          <p class="ch-level"><span class="ch-muted">{S.chNow}</span> <span class="mono">CH {ch}</span></p>
        </div>
        {next ? (
          <>
            <h3>{S.next(next.to)}</h3>
            <dl class="ch-kv">
              {next.requirement && <div><dt>{S.needs}</dt><dd>{next.requirement}</dd></div>}
              {next.resources.length > 0 && <div><dt>{S.cost}</dt><dd class="mono">{next.resources.join(" · ")}</dd></div>}
              {next.items.length > 0 && <div><dt>{S.items}</dt><dd>{next.items.join(", ")}</dd></div>}
              {next.time && <div><dt>{S.rawTime}</dt><dd class="mono">{next.time}</dd></div>}
            </dl>
            {next.unreadable && <p class="ch-muted">{S.unreadable}</p>}
          </>
        ) : (
          <p class="ch-muted">{S.topLevel}</p>
        )}
        {ch < 25 && <a class="ch-more" href={plannerLink}>{S.planMore}</a>}
      </section>

      <section class="ch-card" aria-labelledby="ch-targets-h" data-targets>
        <h2 id="ch-targets-h">{S.targetsH}</h2>
        <ul class="ch-gauges">
          <Bar g={gauge(ch, t.chWorkable)} label={S.chForKvk(t.chWorkable)} unit="CH" />
          <Bar g={gauge(ch, t.lostKingdomCH)} label={S.lostKingdom(t.lostKingdomCH)} unit="CH" />
          {day !== null && day <= t.kvk1Day && <Bar g={gauge(day, t.kvk1Day)} label={S.kingdomDay(t.kvk1Day)} unit="Day" />}
        </ul>
        <ul class="ch-facts">
          <li>{S.chForKvkHelp(t.chWorkable, t.chNotExpected)}</li>
          {day === null && <li>{S.kingdomDayUnknown(t.kvk1Day)}</li>}
          {day !== null && day > t.kvk1Day && <li>{S.pastKvk1} <a href="/guides/late-game/">Late game guide</a></li>}
          <li>{S.t4(t.t4Day)}</li>
          <li>{S.power(t.powerMillions.min, t.powerMillions.max)}</li>
          {t.vipTargets.length > 0 && <li>{S.vip(t.vipTargets)}</li>}
        </ul>
        {t.chMilestones.length > 0 && (
          <>
            <h3>{S.milestonesH}</h3>
            <ul class="ch-milestones">
              {t.chMilestones.map((m) => (
                <li key={m.label} data-reached={ch >= m.cityHall ? "" : undefined}>
                  <span aria-hidden="true" class="ch-dot" />
                  {S.milestone(m)}
                  {ch >= m.cityHall && <span class="ch-tag">{S.reached}</span>}
                </li>
              ))}
            </ul>
          </>
        )}
        <p class="ch-muted ch-small">{S.targetsNote} <a href="/guide/#budget">{S.readWhy}</a></p>
      </section>

      <section class="ch-card" aria-labelledby="ch-tools-h" data-stage-tools>
        <h2 id="ch-tools-h">{S.toolsH}</h2>
        <ul class="ch-links">
          {stageTools(profile).map((x) => (
            <li key={x.href}><a href={x.href}><strong>{x.title}</strong><span>{x.why}</span></a></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
