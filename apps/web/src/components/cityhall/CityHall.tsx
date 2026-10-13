import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { PROFILE_NAMES, defaultProfile, getQuestion, profileWarnings, type AccountProfile } from "@rokadm/core";
import { ROUTINE_TASKS, planRoutine, withEffectiveSpending } from "@rokadm/planner";
import { accountsOf, migrationPatch, switchAccountPatch } from "../../lib/accounts";
import {
  cityAlerts, gauge, nextLevel, stageTools, todayTop,
  type ChRow, type CityHallTargets, type Gauge,
} from "../../lib/city-hall";
import { profileFromCode } from "../../lib/profile";
import { countDone, doneToday, gameWeekday, setDone } from "../../lib/routine-day";
import { readStore, writeStore, type SavedProfile, type StoreV1 } from "../../lib/store";
import { encodeShare } from "../../lib/tools-store";
import { TileIcon, type TileIconName } from "./TileIcon";
import "./cityhall.css";

// Every user-facing string of this island, in one place (i18n later).
const S = {
  title: "City Hall",
  yourCity: "Your city",
  accounts: "Your accounts",
  slide: (i: number, n: number, name: string) => `${i} of ${n}: ${name}`,
  showCard: (name: string) => `Show ${name}`,
  chLevel: "City Hall",
  defaults: "Default answers",
  sheetH: "Quick actions",
  expand: "Show status and today's tasks",
  collapse: "Show less",
  tiles: {
    today: (left: number) => (left > 0 ? `Today's tasks (${left} left)` : "Today's tasks"),
    next: (to: number | null) => (to ? `Next: CH ${to}` : "City Hall"),
    routine: "Full routine",
    commanders: "My commanders",
  },
  statusH: "Status",
  next: (to: number) => `Next: City Hall ${to}`,
  needs: "Needs first",
  cost: "Cost",
  items: "Items",
  rawTime: "Raw build time",
  topLevel: "City Hall 25 is the top level. Nothing left to build here.",
  planMore: "Plan more levels",
  chForKvk: (n: number) => `City Hall ${n} for KvK1`,
  lostKingdom: (n: number) => `City Hall ${n} for Lost Kingdom`,
  kingdomDay: (d: number) => `Kingdom day to KvK1 (around day ${d})`,
  gaugeText: (g: Gauge, unit: string) => `${unit} ${g.current} of ${g.target}${g.reached ? " · reached" : ""}`,
  targetsFacts: (t: CityHallTargets) => [
    `Player reports call CH ${t.chWorkable}+ workable for KvK1; CH ${t.chNotExpected} is not expected without spending.`,
    `T4 troops usually around kingdom day ${t.t4Day}. Power around KvK1: ${t.powerMillions.min}M to ${t.powerMillions.max}M.`,
    ...(t.vipTargets.length ? [`VIP targets: ${t.vipTargets.map((x) => `VIP ${x}`).join(", then ")}.`] : []),
  ],
  kingdomDayUnknown: (d: number) => `KvK1 starts around kingdom day ${d}. Add your kingdom's age on Me to track it here.`,
  milestonesH: "City Hall rewards",
  milestone: (m: { label: string; gems: number; cityHall: number }) => `CH ${m.cityHall}: ${m.label} (${m.gems.toLocaleString("en-US")} gems)`,
  reached: "reached",
  targetsNote: "Targets are the F2P baseline from the guide's Budget reality check.",
  readWhy: "Read the reasoning",
  alertsH: "Alerts",
  noAlerts: "Nothing needs your attention.",
  todayH: "Today's must-dos",
  done: (n: number, of: number) => `${n} of ${of} done`,
  seeAll: (n: number) => `See all ${n} tasks`,
  mustDo: "must-do",
  nothing: "Nothing fits today's time. Open the full list to pick more minutes.",
} as const;

interface Props {
  rows: ChRow[];
  targets: CityHallTargets;
  /** Clock; tests inject a fixed day. */
  now?: () => Date;
}

const stageLabel = (p: AccountProfile): string => {
  const q = getQuestion("kingdomStage");
  return q.type === "choice" ? (q.options.find((o) => o.value === p.kingdomStage)?.label ?? p.kingdomStage) : p.kingdomStage;
};

function Bar({ g, label, unit }: { g: Gauge; label: string; unit: string }) {
  return (
    <li class="ch-gauge" data-gauge data-reached={g.reached ? "" : undefined}>
      <span class="ch-gauge-label">{label}</span>
      <span class="ch-bar" aria-hidden="true"><span style={{ transform: `scaleX(${g.ratio})` }} /></span>
      <span class="ch-gauge-text mono">{S.gaugeText(g, unit)}</span>
    </li>
  );
}

/** The hero card for one account. Banner art is a token-drawn pattern (swap via --ch-card-art). */
function HeroCard({ card, active, profile, index, total, defaults }: { card: SavedProfile | null; active: boolean; profile: AccountProfile; index: number; total: number; defaults: boolean }) {
  const name = card?.name ?? S.yourCity;
  return (
    <article class="ch-card-hero" data-layer="2" data-city-card={card?.id ?? "default"} data-active={active ? "" : undefined}
      aria-roledescription="slide" aria-label={S.slide(index + 1, total, name)}>
      <div class="ch-card-art" aria-hidden="true" />
      <div class="ch-card-body">
        <p class="ch-card-tag">{defaults ? S.defaults : PROFILE_NAMES[profile.spending]}</p>
        <h2 class="ch-card-name">{name}</h2>
        <p class="ch-card-level"><span class="ch-card-level-label">{S.chLevel}</span> <span class="mono">{profile.cityHall}</span></p>
        <p class="ch-card-stage">{stageLabel(profile)}</p>
      </div>
    </article>
  );
}

/**
 * City Hall tab (UX stage 1): hero city card(s) on top (one per saved account, as a carousel),
 * then a sheet with quick-action tiles, status gauges, alerts and today's must-dos. The sheet never
 * needs dragging: a button expands it (drag is a shortcut); reduced motion and wide screens show it
 * expanded and static.
 */
export default function CityHall({ rows, targets: t, now = () => new Date() }: Props) {
  const [store, setStore] = useState<StoreV1 | null>(null);
  // Server render (no JS yet) shows everything; a phone with motion allowed starts collapsed.
  const [expanded, setExpanded] = useState(true);
  const [toggleable, setToggleable] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const dragY = useRef<number | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const todayRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    // Older saves: the single profile becomes account #1 ("Main").
    let s = readStore();
    const m = migrationPatch(s);
    if (m) s = writeStore(m);
    setStore(s);
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const wide = window.matchMedia?.("(min-width: 900px)").matches ?? false;
    const canToggle = !still && !wide;
    setToggleable(canToggle);
    setExpanded(!canToggle);
  }, []);

  // Each card is one account; the one in use drives the whole sheet below.
  const accounts = store ? accountsOf(store) : { accounts: [] as SavedProfile[], activeId: null };
  const cards = accounts.accounts;
  const view = Math.max(0, cards.findIndex((c) => c.id === accounts.activeId));
  const saved = store ? profileFromCode(store.profileCode) : null;
  const base = saved ?? defaultProfile();
  const profile = withEffectiveSpending(base, store?.profileOverride ?? null);

  const use = (i: number): void => {
    const target = cards[i];
    if (!target || !store || target.id === accounts.activeId) return;
    const patch = switchAccountPatch(readStore(), target.id);
    if (patch) setStore(writeStore(patch));
  };

  // Show the card in use (first load, a dot, a switch made elsewhere).
  useLayoutEffect(() => {
    const el = track.current;
    if (el && cards.length > 1 && cardAt(el) !== view) {
      el.scrollTo?.({ left: leftOf(el, view), behavior: "auto" });
    }
  }, [view, cards.length]);

  // A swipe that settles on another card switches the account in use.
  useEffect(() => {
    const el = track.current;
    if (!el || cards.length < 2) return;
    const onScroll = (): void => {
      if (settle.current) clearTimeout(settle.current);
      settle.current = setTimeout(() => use(cardAt(el)), 150);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  });

  const goTo = (i: number): void => {
    use(i);
    const el = track.current;
    if (el) el.scrollTo?.({ left: leftOf(el, i), behavior: "auto" });
  };

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
  const alerts = cityAlerts({
    hasProfile: !!saved || !store, mustDoMissing: plan.mustDoSkipped.length, budgetMinutes: plan.budgetMinutes,
    warnings: saved ? profileWarnings(base) : [], kingdomDay: day, kvk1Day: t.kvk1Day, unreadableNext: !!next?.unreadable,
  });

  const openToday = (): void => {
    setExpanded(true);
    requestAnimationFrame(() => {
      todayRef.current?.scrollIntoView?.({ block: "start" });
      todayRef.current?.focus({ preventScroll: true });
    });
  };

  type Tile = { id: string; label: string; icon: TileIconName; href?: string; onClick?: () => void };
  const tiles: Tile[] = ([
    { id: "today", label: S.tiles.today(plan.included.length - n), icon: "today", onClick: openToday },
    { id: "next", label: S.tiles.next(next?.to ?? null), icon: "cityhall", href: plannerLink },
    { id: "commanders", label: S.tiles.commanders, icon: "shield", href: "/city-hall/commanders/" },
    ...stageTools(profile).map((x) => ({ id: x.href, label: x.title, icon: iconFor(x.href), href: x.href })),
  ] as Tile[]).slice(0, 5);
  tiles.push({ id: "routine", label: S.tiles.routine, icon: "list", href: "/city-hall/today/" });

  return (
    <div class="ch" data-ready={store ? "" : undefined}>
      <h1 class="visually-hidden">{S.title}</h1>

      <section class="ch-hero" aria-label={S.accounts}>
        <div class="ch-cards" ref={track} role="group" aria-roledescription="carousel" aria-label={S.accounts} data-cards={cards.length}>
          {cards.length ? cards.map((c, i) => {
            const p = profileFromCode(c.code)!;
            return <HeroCard key={c.id} card={c} active={c.id === accounts.activeId} profile={withEffectiveSpending(p, c.override)} index={i} total={cards.length} defaults={false} />;
          }) : <HeroCard card={null} active profile={profile} index={0} total={1} defaults={!!store} />}
        </div>
        {cards.length > 1 && (
          <div class="ch-dots">
            {cards.map((c, i) => (
              <button key={c.id} type="button" class="ch-dot-btn" aria-label={S.showCard(c.name)} aria-current={i === view ? "true" : undefined} onClick={() => goTo(i)}>
                <span aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section class="ch-sheet" data-layer="1" data-expanded={expanded ? "" : undefined} aria-labelledby="ch-sheet-h">
        <div
          class="ch-sheet-head"
          onPointerDown={(e) => { if (toggleable) dragY.current = e.clientY; }}
          onPointerUp={(e) => {
            if (dragY.current === null) return;
            const dy = e.clientY - dragY.current;
            dragY.current = null;
            if (dy < -30) setExpanded(true);
            else if (dy > 30) setExpanded(false);
          }}
          onPointerCancel={() => { dragY.current = null; }}
        >
          {toggleable && (
            <button type="button" class="ch-handle" aria-expanded={expanded} aria-controls="ch-sheet-more" onClick={() => setExpanded((x) => !x)} data-sheet-toggle>
              <span class="ch-grip" aria-hidden="true" />
              <span class="ch-handle-text">{expanded ? S.collapse : S.expand}</span>
            </button>
          )}
          <h2 id="ch-sheet-h" class="ch-sheet-title">{S.sheetH}</h2>
        </div>

        <ul class="ch-tiles" data-tiles>
          {tiles.map((x) => (
            <li key={x.id}>
              {x.href ? (
                <a class="ch-tile" data-layer="2" href={x.href}><TileIcon name={x.icon} /><span>{x.label}</span></a>
              ) : (
                <button type="button" class="ch-tile" data-layer="2" onClick={x.onClick}><TileIcon name={x.icon} /><span>{x.label}</span></button>
              )}
            </li>
          ))}
        </ul>

        <div id="ch-sheet-more" class="ch-sheet-more" hidden={!expanded}>
          <section class="ch-block" aria-labelledby="ch-status-h" data-targets>
            <h3 id="ch-status-h">{S.statusH}</h3>
            <ul class="ch-gauges">
              <Bar g={gauge(ch, t.chWorkable)} label={S.chForKvk(t.chWorkable)} unit="CH" />
              <Bar g={gauge(ch, t.lostKingdomCH)} label={S.lostKingdom(t.lostKingdomCH)} unit="CH" />
              {day !== null && day <= t.kvk1Day && <Bar g={gauge(day, t.kvk1Day)} label={S.kingdomDay(t.kvk1Day)} unit="Day" />}
            </ul>
            <div class="ch-next" data-next-level>
              {next ? (
                <>
                  <h4>{S.next(next.to)}</h4>
                  <dl class="ch-kv">
                    {next.requirement && <div><dt>{S.needs}</dt><dd>{next.requirement}</dd></div>}
                    {next.resources.length > 0 && <div><dt>{S.cost}</dt><dd class="mono">{next.resources.join(" · ")}</dd></div>}
                    {next.items.length > 0 && <div><dt>{S.items}</dt><dd>{next.items.join(", ")}</dd></div>}
                    {next.time && <div><dt>{S.rawTime}</dt><dd class="mono">{next.time}</dd></div>}
                  </dl>
                  <a class="ch-more" href={plannerLink}>{S.planMore}</a>
                </>
              ) : <p class="ch-muted">{S.topLevel}</p>}
            </div>
            <details class="ch-details">
              <summary>{S.milestonesH}</summary>
              <ul class="ch-facts">
                {S.targetsFacts(t).map((x) => <li key={x}>{x}</li>)}
                {day === null && <li>{S.kingdomDayUnknown(t.kvk1Day)}</li>}
              </ul>
              <ul class="ch-milestones">
                {t.chMilestones.map((m) => (
                  <li key={m.label} data-reached={ch >= m.cityHall ? "" : undefined}>
                    <span aria-hidden="true" class="ch-dot" />
                    {S.milestone(m)}
                    {ch >= m.cityHall && <span class="ch-tag">{S.reached}</span>}
                  </li>
                ))}
              </ul>
              <p class="ch-muted ch-small">{S.targetsNote} <a href="/guide/#budget">{S.readWhy}</a></p>
            </details>
          </section>

          <section class="ch-block" aria-labelledby="ch-alerts-h" data-alerts>
            <h3 id="ch-alerts-h">{S.alertsH}</h3>
            {alerts.length ? (
              <ul class="ch-alerts">
                {alerts.map((a) => (
                  <li key={a.text} class="ch-alert" data-alert={a.kind}>
                    <span>{a.text}</span>
                    {a.href && <a class={a.kind === "setup" ? "btn btn-primary" : "ch-more"} href={a.href}>{a.link}</a>}
                  </li>
                ))}
              </ul>
            ) : <p class="ch-muted">{S.noAlerts}</p>}
          </section>

          <section class="ch-block" aria-labelledby="ch-today-h" data-today ref={todayRef} tabIndex={-1}>
            <div class="ch-block-head">
              <h3 id="ch-today-h">{S.todayH}</h3>
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
            ) : <p class="ch-muted">{S.nothing}</p>}
            <a class="ch-more" href="/city-hall/today/" data-see-all>{S.seeAll(plan.included.length)}</a>
          </section>
        </div>
      </section>
    </div>
  );
}

/** scrollLeft that centres card i in the track. */
function leftOf(track: HTMLElement, i: number): number {
  const c = track.children[i] as HTMLElement | undefined;
  return c ? c.offsetLeft - (track.clientWidth - c.clientWidth) / 2 : 0;
}

/** The card nearest the track's centre. */
function cardAt(track: HTMLElement): number {
  let best = 0, dist = Infinity;
  for (let i = 0; i < track.children.length; i++) {
    const d = Math.abs(leftOf(track, i) - track.scrollLeft);
    if (d < dist) { dist = d; best = i; }
  }
  return best;
}

function iconFor(href: string): TileIconName {
  if (href.includes("pack-value") || href.includes("vip")) return "coin";
  if (href.includes("speedups")) return "clock";
  if (href.includes("buildings")) return "cityhall";
  if (href.includes("healing")) return "heal";
  if (href.includes("commanders")) return "shield";
  if (href.includes("kvk") || href.includes("migration")) return "flag";
  return "list";
}
