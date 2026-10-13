import { useState } from "preact/hooks";
import { FARM_DAILY_TASKS, RESOURCES, dailyState, goalProgress, shippedNet, toggleDaily, type Resource, type ShipmentEntry } from "@rokadm/planner";
import type { Farm, FarmPatch } from "../../../lib/farms-store";
import {
  FOCUS_LABEL, RESOURCE_LABEL, fmtNumber, formatDuration, formatLocalTime, levelsSummary, parseResourceAmount,
  timeInputValue, untilAtLocalTime, untilInHours,
} from "../../../lib/farms-hub";
import { Sourced } from "../shared/Sourced";
import ConfirmAction from "./ConfirmAction";

const QUICK_HOURS = [1, 2, 4, 8] as const;

interface Props {
  farm: Farm;
  now: Date;
  today: string;
  shipments: readonly ShipmentEntry[];
  clock: () => Date;
  onUpdate: (patch: FarmPatch, message: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function GatheringStatus({ farm, now }: { farm: Farm; now: Date }) {
  const until = farm.gatheringUntil ? Date.parse(farm.gatheringUntil) : Number.NaN;
  if (!Number.isFinite(until)) return <p class="fh-status">Idle: no return time set.</p>;
  if (until <= now.getTime()) return <p class="fh-status">Marches back since {formatLocalTime(farm.gatheringUntil!, now)}. Send them out again.</p>;
  const left = Math.ceil((until - now.getTime()) / 60000);
  return <p class="fh-status">Gathering: back in {formatDuration(left)} (at {formatLocalTime(farm.gatheringUntil!, now)}).</p>;
}

export default function FarmCard({ farm, now, today, shipments, clock, onUpdate, onEdit, onDelete }: Props) {
  const pre = `fc-${farm.id}`;
  const marks = dailyState(farm.daily, today);
  const required = FARM_DAILY_TASKS.filter((t) => !t.optional);
  const doneRequired = required.filter((t) => marks.done.includes(t.id)).length;
  const levels = levelsSummary(farm.levels);
  const q = encodeURIComponent(farm.id);

  const [goalRes, setGoalRes] = useState<Resource>(farm.goal?.resource ?? (farm.role === "general" ? "food" : farm.role));
  const [goalAmt, setGoalAmt] = useState(farm.goal ? String(farm.goal.amount) : "");
  const [goalErr, setGoalErr] = useState<string | null>(null);
  const progress = farm.goal ? goalProgress(farm.goal, shippedNet(shipments, { date: today, farmId: farm.id, resource: farm.goal.resource })) : null;

  const saveGoal = (e: Event): void => {
    e.preventDefault();
    const n = parseResourceAmount(goalAmt);
    if (n === null || Number.isNaN(n) || n <= 0) {
      setGoalErr("Enter the amount the main should receive today above 0, e.g. 500000, 500k or 1.5m.");
      document.getElementById(`${pre}-goal-amt`)?.focus();
      return;
    }
    setGoalErr(null);
    onUpdate({ goal: { resource: goalRes, amount: n } }, `Daily goal saved for ${farm.name}.`);
  };

  return (
    <article class="fm-card fh-farm" aria-labelledby={`${pre}-h`} data-farm={farm.id}>
      <header class="fh-farm-head">
        <h3 id={`${pre}-h`} tabIndex={-1}>{farm.name}</h3>
        <p class="fh-meta"><span class="fh-chip">{FOCUS_LABEL[farm.role]}</span> {levels ? <span class="mono">{levels}</span> : <span class="fm-note">No levels saved.</span>}</p>
        {farm.note && <p class="fm-note">{farm.note}</p>}
        <p class="fh-links">
          <a href={`/farms/build/?farm=${q}`}>Build path<span class="visually-hidden"> for {farm.name}</span></a>
          <a href={`/farms/trading-post/?farm=${q}`}>Trading Post calculator<span class="visually-hidden"> for {farm.name}</span></a>
        </p>
      </header>

      <fieldset class="fh-fieldset fh-section">
        <legend class="fm-label">Gathering until</legend>
        <GatheringStatus farm={farm} now={now} />
        <div class="fh-quick" role="group" aria-label={`Set ${farm.name} back time from now`}>
          {QUICK_HOURS.map((h) => (
            <button
              type="button" class="btn btn-secondary fh-small" key={h}
              onClick={() => onUpdate({ gatheringUntil: untilInHours(clock(), h) }, `${farm.name}: back in ${h} h.`)}
            >+{h} h</button>
          ))}
        </div>
        <div class="fh-row">
          <div class="fm-field fh-time">
            <label for={`${pre}-time`}>Back at (your local time)</label>
            <input
              id={`${pre}-time`} type="time" value={timeInputValue(farm.gatheringUntil)}
              onChange={(e) => {
                const iso = untilAtLocalTime(clock(), (e.target as HTMLInputElement).value);
                if (iso) onUpdate({ gatheringUntil: iso }, `${farm.name}: back time saved.`);
              }}
            />
          </div>
          {farm.gatheringUntil && (
            <button type="button" class="btn btn-secondary fh-small" onClick={() => onUpdate({ gatheringUntil: null }, `${farm.name}: back time cleared.`)}>
              Clear<span class="visually-hidden"> back time for {farm.name}</span>
            </button>
          )}
        </div>
      </fieldset>

      <fieldset class="fh-fieldset fh-section">
        <legend class="fm-label">Today's checklist: {doneRequired} of {required.length} done</legend>
        <ul class="fh-tasks">
          {FARM_DAILY_TASKS.map((t) => {
            const id = `${pre}-t-${t.id}`;
            return (
              <li key={t.id}>
                <div class="fh-task">
                  <input
                    id={id} type="checkbox" checked={marks.done.includes(t.id)} aria-describedby={`${id}-d`}
                    onChange={() => onUpdate({ daily: toggleDaily(farm.daily, today, t.id) }, `${farm.name}: checklist saved.`)}
                  />
                  <label for={id}>{t.label}{t.optional && <span class="fh-chip fh-optional">Optional</span>}</label>
                </div>
                <p class="fm-hint fh-task-detail" id={`${id}-d`}>{t.detail}</p>
                <details class="fh-why">
                  <summary>Why<span class="visually-hidden">: {t.label}</span></summary>
                  <Sourced confidence={t.confidence} facts={t.facts} gaps={t.gaps} hypothesis={t.hypothesis} />
                </details>
              </li>
            );
          })}
        </ul>
        <p class="fm-hint">Ticks reset at local midnight.</p>
      </fieldset>

      <form class="fh-section fh-goal" onSubmit={saveGoal} aria-labelledby={`${pre}-goal-h`} noValidate>
        <h4 id={`${pre}-goal-h`} class="fm-label">Daily goal (optional)</h4>
        <p class="fm-hint">What the main should receive from this farm today. You set the number; we don't suggest one because farm yields are not measured yet.</p>
        <div class="fh-row">
          <div class="fm-field">
            <label for={`${pre}-goal-res`}>Resource</label>
            <select id={`${pre}-goal-res`} value={goalRes} onChange={(e) => setGoalRes((e.target as HTMLSelectElement).value as Resource)}>
              {RESOURCES.map((r) => <option value={r} key={r}>{RESOURCE_LABEL[r]}</option>)}
            </select>
          </div>
          <div class="fm-field">
            <label for={`${pre}-goal-amt`}>Amount received</label>
            <input
              id={`${pre}-goal-amt`} type="text" inputMode="numeric" autocomplete="off" value={goalAmt}
              aria-invalid={goalErr ? "true" : undefined} aria-describedby={goalErr ? `${pre}-goal-err` : undefined}
              onInput={(e) => setGoalAmt((e.target as HTMLInputElement).value)}
            />
          </div>
        </div>
        {goalErr && <p class="fm-error" id={`${pre}-goal-err`} role="alert">{goalErr}</p>}
        <div class="fm-actions">
          <button type="submit" class="btn btn-secondary fh-small">Save goal<span class="visually-hidden"> for {farm.name}</span></button>
          {farm.goal && (
            <button type="button" class="btn btn-secondary fh-small" onClick={() => { setGoalAmt(""); onUpdate({ goal: null }, `${farm.name}: daily goal removed.`); }}>
              Remove goal<span class="visually-hidden"> for {farm.name}</span>
            </button>
          )}
        </div>
        {progress && (
          <div class="fh-progress">
            <p id={`${pre}-goal-p`}>
              {progress.done ? "Goal met: " : ""}
              <span class="mono">{fmtNumber(progress.shipped)}</span> of <span class="mono">{fmtNumber(progress.target)}</span> {RESOURCE_LABEL[progress.resource].toLowerCase()} received today ({Math.round(progress.ratio * 100)}%)
              {!progress.done && <>, <span class="mono">{fmtNumber(progress.remaining)}</span> to go</>}.
            </p>
            <progress max={100} value={Math.round(progress.ratio * 100)} aria-labelledby={`${pre}-goal-p`} />
            <p class="fm-hint">Counts today's entries in the <a href="/farms/log/">shipment log</a> (net received).</p>
          </div>
        )}
      </form>

      <div class="fm-actions fh-farm-actions">
        <button type="button" class="btn btn-secondary" onClick={onEdit}>Edit<span class="visually-hidden"> {farm.name}</span></button>
        <ConfirmAction label="Delete" ariaLabel={`Delete ${farm.name}`} question={`Delete ${farm.name} and its shipments?`} onConfirm={onDelete} />
      </div>
    </article>
  );
}
