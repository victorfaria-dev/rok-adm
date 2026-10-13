import type { Question, QuestionOption } from "@rokadm/core";
import type { Ref } from "preact";
import { rangeText } from "../../lib/questionnaire-flow";

interface Props {
  question: Question;
  value: unknown;
  error: string | null;
  onAnswer: (value: unknown) => void;
  inputRef: Ref<HTMLInputElement>;
}

const BOOLEAN_OPTIONS: ReadonlyArray<QuestionOption<boolean>> = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
];

function Option(props: { name: string; index: number; option: QuestionOption<unknown>; checked: boolean; onPick: () => void; describedBy?: string }) {
  const { name, index, option, checked, onPick, describedBy } = props;
  const id = `${name}-${index}`;
  return (
    <label class="q-option" for={id}>
      <input
        type="radio"
        id={id}
        name={name}
        value={String(index)}
        checked={checked}
        onChange={onPick}
        aria-describedby={option.help ? `${id}-help` : describedBy}
      />
      <span class="q-option-text">
        <span class="q-option-label">{option.label}</span>
        {option.help && <span class="q-option-help" id={`${id}-help`}>{option.help}</span>}
      </span>
    </label>
  );
}

function ErrorText({ error }: { error: string | null }) {
  // Always in the DOM so screen readers pick up changes via aria-describedby on the field.
  return <p class="q-error" id="q-error" hidden={!error}>{error}</p>;
}

/** One question: large radio options, or number presets plus an "Other" field. */
export function QuestionStep({ question: q, value, error, onAnswer, inputRef }: Props) {
  const name = `q-${q.id}`;

  if (q.type === "choice" || q.type === "boolean") {
    const options = (q.type === "boolean" ? BOOLEAN_OPTIONS : q.options) as ReadonlyArray<QuestionOption<unknown>>;
    return (
      <div class="q-body">
        <div class="q-options" role="radiogroup" aria-labelledby="q-title" aria-describedby="q-help" aria-invalid={error ? true : undefined}>
          {options.map((o, i) => (
            <Option key={i} name={name} index={i} option={o} checked={value === o.value} onPick={() => onAnswer(o.value)} />
          ))}
        </div>
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
        <div class="q-options" role="radiogroup" aria-labelledby="q-title" aria-describedby="q-help">
          {presets.map((p, i) => (
            <Option key={i} name={name} index={i} option={p} checked={value === p.value} onPick={() => onAnswer(p.value)} />
          ))}
        </div>
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
          enterKeyHint="next"
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
