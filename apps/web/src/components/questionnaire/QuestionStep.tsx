import type { Question, QuestionOption } from "@rokadm/core";
import type { Ref } from "preact";
import { useRef } from "preact/hooks";
import { rangeText } from "../../lib/questionnaire-flow";

interface Props {
  question: Question;
  value: unknown;
  error: string | null;
  /** Select an answer (keyboard arrows, typing): stays on this step. */
  onAnswer: (value: unknown) => void;
  /** Tap or click on a quick reply: answer and send in one go. */
  onSend: (value: unknown) => void;
  inputRef: Ref<HTMLInputElement>;
}

/** A pointer press shortly before the click means a tap; arrow keys also fire click but no pointerdown. */
const TAP_WINDOW_MS = 1000;

function Option(props: {
  name: string;
  index: number;
  option: QuestionOption<unknown>;
  checked: boolean;
  onPick: () => void;
  onTap: () => void;
  tapAt: { current: number };
}) {
  const { name, index, option, checked, onPick, onTap, tapAt } = props;
  const id = `${name}-${index}`;
  return (
    <label
      class="q-option"
      for={id}
      onPointerDown={() => (tapAt.current = Date.now())}
      onPointerCancel={() => (tapAt.current = 0)}
      onKeyDown={() => (tapAt.current = 0)}
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={String(index)}
        checked={checked}
        onClick={() => {
          const tap = Date.now() - tapAt.current < TAP_WINDOW_MS;
          tapAt.current = 0;
          if (tap) onTap();
          else onPick();
        }}
        onChange={onPick}
        aria-describedby={option.help ? `${id}-help` : undefined}
      />
      <span class="q-option-text">
        <span class="q-option-label">{option.label}</span>
        {option.help && <span class="q-option-help" id={`${id}-help`}>{option.help}</span>}
      </span>
      <svg class="q-option-check" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </label>
  );
}

function ErrorText({ error }: { error: string | null }) {
  // Always in the DOM so screen readers pick up changes via aria-describedby on the field.
  return <p class="q-error" id="q-error" hidden={!error}>{error}</p>;
}

function Options(props: { name: string; options: ReadonlyArray<QuestionOption<unknown>>; value: unknown; invalid?: boolean; onAnswer: (v: unknown) => void; onSend: (v: unknown) => void }) {
  const { name, options, value, invalid, onAnswer, onSend } = props;
  const tapAt = useRef(0);
  return (
    <div class="q-options" role="radiogroup" aria-labelledby="q-title" aria-describedby="q-help" aria-invalid={invalid ? true : undefined}>
      {options.map((o, i) => (
        <Option key={i} name={name} index={i} option={o} checked={value === o.value} onPick={() => onAnswer(o.value)} onTap={() => onSend(o.value)} tapAt={tapAt} />
      ))}
    </div>
  );
}

/** One question's reply area: quick-reply options, or number presets plus an "Other" field. */
export function QuestionStep({ question: q, value, error, onAnswer, onSend, inputRef }: Props) {
  const name = `q-${q.id}`;

  if (q.type === "choice" || q.type === "boolean") {
    return (
      <div class="q-body">
        <Options name={name} options={q.options as ReadonlyArray<QuestionOption<unknown>>} value={value} invalid={!!error} onAnswer={onAnswer} onSend={onSend} />
        {q.id === "kingdomStage" && (
          <p class="q-note" data-stage-note>From KvK2 on, the guide uses the late-game plan; sections it does not cover yet show KvK1 steps, labelled.</p>
        )}
        <ErrorText error={error} />
      </div>
    );
  }

  const presets = q.presets ?? [];
  const isPreset = typeof value === "number" && presets.some((p) => p.value === value);
  const text = typeof value === "string" ? value : typeof value === "number" && !isPreset ? String(value) : "";
  const hint = `Whole number ${rangeText(q)}.`;
  const describedBy = error ? "q-hint q-error" : "q-hint";

  return (
    <div class="q-body">
      {presets.length > 0 && (
        <Options name={name} options={presets as ReadonlyArray<QuestionOption<unknown>>} value={value} onAnswer={onAnswer} onSend={onSend} />
      )}
      <div class="q-field">
        {presets.length > 0 ? (
          <label class="q-label" for="q-input">Other</label>
        ) : null}
        <p class="q-hint" id="q-hint">{hint}</p>
        <input
          ref={inputRef}
          id="q-input"
          class="q-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="send"
          aria-labelledby={presets.length > 0 ? undefined : "q-title"}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          value={text}
          onInput={(e) => onAnswer(e.currentTarget.value)}
        />
        <ErrorText error={error} />
      </div>
    </div>
  );
}
