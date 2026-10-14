import { useLayoutEffect, useState } from "preact/hooks";
import { PROFILE_NAMES, defaultProfile } from "@rokadm/core";
import {
  BREAK_MODE_NOTES,
  ESTIMATE_NOTICE,
  ROUTINE_META,
  ROUTINE_TASKS,
  breakMode,
  effectiveProfile,
  planRoutine,
  realityCheck,
  withEffectiveSpending,
  type Note,
  type PlannedTask,
  type SkippedTask,
} from "@rokadm/planner";
import { profileFromCode } from "../../lib/profile";
import { countDone, doneToday, gameWeekday, resetLocalTime, setDone } from "../../lib/routine-day";
import { readStore, writeStore, type RoutinePrefs, type StoreV1 } from "../../lib/store";
import { CalendarExport } from "./CalendarExport";
import "./routine.css";

interface Props {
  /** Clock; tests inject a fixed day. */
  now?: () => Date;
}

/** Budget presets offered on the page (F-15). "usual" = the profile's minutes per day. */
export const BUDGETS = [15, 30, 60] as const;
type BudgetChoice = (typeof BUDGETS)[number] | "usual";

const WEEKLY_TASKS = ROUTINE_TASKS.filter((t) => t.frequency === "weekly");
const ESTIMATE_LABEL = ESTIMATE_NOTICE.label;

export const fmtMin = (n: number): string => (Math.round(n * 10) / 10).toLocaleString("pt-BR");
export const minutesText = (minutes: number, isEstimate: boolean): string =>
  isEstimate ? `~${fmtMin(minutes)} min · medição pendente` : `${fmtMin(minutes)} min`;

function choiceOf(prefs: RoutinePrefs | null): BudgetChoice {
  const m = prefs?.minutes;
  return (BUDGETS as readonly number[]).includes(m ?? -1) ? (m as BudgetChoice) : "usual";
}

/** Planner text for a skipped task, with the weekly case worded for the page. */
function skipText(s: SkippedTask): string {
  if (s.reason === "not_today" && s.task.frequency === "weekly") {
    const cadence = ROUTINE_META[s.id]?.cadence;
    return `Tarefa semanal${cadence ? `: ${cadence}` : ""}. Ative as tarefas semanais acima no dia dela.`;
  }
  return s.detail;
}

/** Plan notes not already shown elsewhere on the page (estimate notice, must-do list). */
const extraNotes = (notes: readonly Note[]): Note[] =>
  notes.filter((n) => !n.text.startsWith(ESTIMATE_LABEL) && !n.text.startsWith("Budget too small for must-do"));

function NoteList({ notes }: { notes: readonly Note[] }) {
  if (!notes.length) return null;
  return (
    <ul class="rt-notes">
      {notes.map((n) => (
        <li key={n.text}>
          {n.pending && <strong class="rt-pending">Pesquisa pendente: </strong>}
          {n.text}
          {n.facts.length > 0 && <span class="mono rt-facts"> ({n.facts.join(", ")})</span>}
        </li>
      ))}
    </ul>
  );
}

function TaskRow({ t, checked, onToggle }: { t: PlannedTask; checked: boolean; onToggle: (id: string, done: boolean) => void }) {
  const id = `rt-task-${t.id}`;
  return (
    <li class="rt-item">
      <label class="rt-task" for={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(t.id, (e.currentTarget as HTMLInputElement).checked)}
        />
        <span class="rt-task-text">
          <span class="rt-task-title">{t.title}</span>
          <span class={t.isEstimate ? "rt-min rt-min-est" : "rt-min"}>
            <span class="mono">{t.isEstimate ? `~${fmtMin(t.minutes)}` : fmtMin(t.minutes)} min</span>
            {t.isEstimate && " · medição pendente"}
            {t.mustDo && " · essencial"}
          </span>
        </span>
      </label>
      {t.why && (
        <details class="rt-why">
          <summary>Por quê<span class="visually-hidden">: {t.title}</span></summary>
          <p>{t.why}</p>
        </details>
      )}
    </li>
  );
}

function Checklist({ tasks, done, onToggle, label }: { tasks: readonly PlannedTask[]; done: readonly string[]; onToggle: (id: string, d: boolean) => void; label: string }) {
  const n = countDone(tasks.map((t) => t.id), done);
  return (
    <>
      <p class="rt-progress" role="status" aria-live="polite">
        <span class="mono">{n}</span> de <span class="mono">{tasks.length}</span> concluídas
      </p>
      {tasks.length ? (
        <ul class="rt-list" aria-label={label}>
          {tasks.map((t) => <TaskRow key={t.id} t={t} checked={done.includes(t.id)} onToggle={onToggle} />)}
        </ul>
      ) : (
        <p class="rt-empty">Nada cabe neste tempo. Escolha mais minutos acima.</p>
      )}
    </>
  );
}

/** F-15 Time-Boxed Routine + Break Mode island. Storage is read in a layout effect (server render = defaults). */
export default function Routine({ now = () => new Date() }: Props) {
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<StoreV1 | null>(null);

  useLayoutEffect(() => {
    setStore(readStore());
    setReady(true);
  }, []);

  const saved = profileFromCode(store?.profileCode ?? null);
  const base = saved ?? defaultProfile();
  const override = store?.profileOverride ?? null;
  const eff = effectiveProfile(base, override);
  const profile = withEffectiveSpending(base, override);
  const prefs: RoutinePrefs = store?.routinePrefs ?? { minutes: null, breakMode: false };
  const weekly = prefs.includeWeekly === true;
  const events = prefs.includeEvents === true;
  const choice = choiceOf(prefs);
  const budget = choice === "usual" ? base.minutesPerDay : choice;
  const today = ready ? now() : null;
  const done = today ? doneToday(store?.routine ?? null, today) : [];

  const plan = planRoutine(ROUTINE_TASKS, profile, budget, {
    weekday: today ? gameWeekday(today) : null,
    includeWeekly: weekly,
    includeEvents: events,
  });
  const pause = breakMode(ROUTINE_TASKS, { profile });
  const rc = realityCheck(profile);
  const onBreak = prefs.breakMode;

  const savePrefs = (patch: Partial<RoutinePrefs>): void => {
    const next = { ...prefs, ...patch };
    setStore(writeStore({ routinePrefs: next }));
  };
  const toggle = (id: string, d: boolean): void => {
    setStore(writeStore({ routine: setDone(readStore().routine, id, d, now()) }));
  };

  const qualifier = eff.source === "lifetime" ? " (perfil efetivo, pelo seu gasto total)" : eff.source === "override" ? " (escolhido à mão)" : "";
  const forText = `${PROFILE_NAMES[eff.effective]}${qualifier} · CH ${base.cityHall}`;

  const safeSkips = plan.skipped.filter((s) => s.safeToSkip);
  const otherSkips = plan.skipped.filter((s) => !s.safeToSkip);
  const mustMissing = plan.skipped.filter((s) => plan.mustDoSkipped.includes(s.id));
  // Break Mode (Q2 P2-9): the streak task plus the loss-prevention tasks the routine data has
  // (refill queues incl. healing, send gatherers). No shield or resource-protection task exists yet.
  const breakTasks = [...pause.daily, ...pause.beforePause];
  const shown = onBreak ? breakTasks : plan.included;
  const shownMinutes = onBreak ? Math.round((pause.dailyMinutes + pause.beforePauseMinutes) * 10) / 10 : plan.totalMinutes;
  const estimates = shown.filter((t) => t.isEstimate);
  const estimateMinutes = estimates.reduce((s, t) => s + t.minutes, 0);
  const gems = rc.guaranteedGemsPerDay;

  return (
    <div class="rt" data-ready={ready ? "" : undefined}>
      <div class="rt-head">
        <h1>Rotina de hoje</h1>
        <p class="rt-lede">O que fazer hoje no tempo que você tem, o mais valioso primeiro.</p>
        <p class="rt-for">
          Planejada para:{" "}
          {saved ? <a href="/me/">{forText}</a> : <span>respostas padrão ({forText})</span>}
        </p>
        {today && (
          <p class="rt-help">As marcações zeram na virada diária do jogo, 00:00 UTC ({resetLocalTime(today)} no seu horário).</p>
        )}
      </div>

      {ready && !saved && (
        <div class="rt-banner">
          <p>Este plano usa respostas padrão. Responda a 5 perguntas rápidas para ele combinar com a sua conta.</p>
          <a class="btn btn-primary" href="/start/">Configurar seu perfil</a>
        </div>
      )}

      <label class="rt-switch">
        <input type="checkbox" role="switch" checked={onBreak} onChange={(e) => savePrefs({ breakMode: (e.currentTarget as HTMLInputElement).checked })} />
        <span>
          <span class="rt-switch-label">Modo Pausa: dia corrido ou pausa no jogo</span>
          <span class="rt-help">O mínimo: manter a sequência de VIP e as filas e coletores trabalhando enquanto você está fora.</span>
        </span>
      </label>

      {!onBreak && (
        <section class="rt-section" aria-labelledby="rt-plan-title">
          <h2 id="rt-plan-title">Plano</h2>
          <fieldset class="rt-budget">
            <legend>Tempo hoje</legend>
            <div class="rt-choices">
              {BUDGETS.map((m) => (
                <label class="rt-choice" key={m}>
                  <input type="radio" name="rt-budget" value={m} checked={choice === m} onChange={() => savePrefs({ minutes: m })} />
                  <span class="mono">{m} min</span>
                </label>
              ))}
              <label class="rt-choice">
                <input type="radio" name="rt-budget" value="usual" checked={choice === "usual"} onChange={() => savePrefs({ minutes: null })} />
                <span>{saved ? "Meu padrão" : "Padrão"} (<span class="mono">{base.minutesPerDay}</span> min)</span>
              </label>
            </div>
          </fieldset>

          <fieldset class="rt-extra">
            <legend>Planejar também</legend>
            <label class="rt-check">
              <input type="checkbox" checked={weekly} onChange={(e) => savePrefs({ includeWeekly: (e.currentTarget as HTMLInputElement).checked })} />
              <span>
                Tarefas semanais, no dia delas
                <span class="rt-help">{WEEKLY_TASKS.map((t) => `${t.title}${ROUTINE_META[t.id]?.cadence ? `: ${ROUTINE_META[t.id]!.cadence}` : ""}`).join(". ")}.</span>
              </span>
            </label>
            <label class="rt-check">
              <input type="checkbox" checked={events} onChange={(e) => savePrefs({ includeEvents: (e.currentTarget as HTMLInputElement).checked })} />
              <span>
                Um evento está em andamento
                <span class="rt-help">Confira o calendário do jogo; os eventos não têm horário fixo.</span>
              </span>
            </label>
          </fieldset>
        </section>
      )}

      <section class="rt-section" aria-labelledby="rt-list-title">
        <h2 id="rt-list-title">{onBreak ? "Modo Pausa: o mínimo" : "Checklist"}</h2>
        {onBreak && (
          <p class="rt-help" data-break-scope>
            Mantém a sequência de VIP e mantém construtores, pesquisa, treinamento, cura e coletores ocupados enquanto você está fora.
            Não cobre escudos nem proteção de recursos: o KingdomOps ainda não tem fatos conferidos sobre isso.
          </p>
        )}
        <Checklist tasks={shown} done={done} onToggle={toggle} label={onBreak ? "Tarefas diárias do Modo Pausa" : "Tarefas de hoje"} />

        {!onBreak && mustMissing.length > 0 && (
          <div class="rt-warn">
            <h3>Tarefas essenciais que não couberam</h3>
            <ul>
              {mustMissing.map((s) => <li key={s.id}>{s.title}: {s.detail}</li>)}
            </ul>
            <p>Escolha mais tempo para encaixá-las.</p>
          </div>
        )}

        {!onBreak && (
          <>
            <details class="rt-more">
              <summary>Pode pular hoje (<span class="mono">{safeSkips.length}</span>)</summary>
              <SkipList items={safeSkips} />
            </details>
            <details class="rt-more">
              <summary>Fora do plano de hoje (<span class="mono">{otherSkips.length}</span>)</summary>
              <SkipList items={otherSkips} />
            </details>
          </>
        )}

        {onBreak && (
          <>
            <details class="rt-more">
              <summary>Pode largar durante a pausa (<span class="mono">{pause.dropWhilePaused.length}</span>)</summary>
              <ul class="rt-plain">
                {pause.dropWhilePaused.map((t) => <li key={t.id}>{t.title}</li>)}
              </ul>
            </details>
            <NoteList notes={BREAK_MODE_NOTES} />
          </>
        )}
      </section>

      <section class="rt-section rt-reality" aria-labelledby="rt-reality-title">
        <h2 id="rt-reality-title">Checagem de realidade</h2>
        <ul class="rt-facts-list">
          <li>
            Planejado: <span class="mono">{fmtMin(shownMinutes)}</span> de <span class="mono">{fmtMin(plan.budgetMinutes)}</span> min{onBreak ? " (Modo Pausa)" : ""}.
          </li>
          <li>
            {estimates.length === 0
              ? "Todos os tempos das tarefas aqui foram medidos no jogo."
              : <><span class="mono">{estimates.length}</span> de <span class="mono">{shown.length}</span> tempos de tarefas (<span class="mono">{fmtMin(estimateMinutes)}</span> min) são estimativas, com medição no jogo pendente.</>}
          </li>
          <li>
            {rc.message}
            {gems && (
              <> Gemas garantidas por dia: <span class="mono">{gems.value}</span> {gems.unit} (confiança: {gems.confidence}).</>
            )}
          </li>
        </ul>
        {!onBreak && <NoteList notes={extraNotes(plan.notes)} />}
        <p class="rt-help">
          <strong>Sobre "medição pendente":</strong> {ESTIMATE_NOTICE.basis}
        </p>
      </section>

      <CalendarExport tasks={shown} totalMinutes={shownMinutes} now={now} />
    </div>
  );
}

function SkipList({ items }: { items: readonly SkippedTask[] }) {
  if (!items.length) return <p class="rt-help">Nenhuma hoje.</p>;
  return (
    <ul class="rt-plain">
      {items.map((s) => (
        <li key={s.id}>
          <span class="rt-skip-title">{s.title}</span>
          <span class="rt-help">{skipText(s)}</span>
        </li>
      ))}
    </ul>
  );
}
