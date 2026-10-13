import type { JSX } from "preact";

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onValue: (v: string) => void;
  hint?: string;
  error?: string;
  inputMode?: "numeric" | "decimal" | "text";
  placeholder?: string;
}

/** Labelled text input; hint and error are wired through aria-describedby, invalid state via aria-invalid. */
export function TextField({ id, label, value, onValue, hint, error, inputMode = "numeric", placeholder }: TextFieldProps): JSX.Element {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;
  return (
    <div class="fm-field">
      <label for={id}>{label}</label>
      {hint && <p id={hintId} class="fm-hint">{hint}</p>}
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        spellcheck={false}
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        onInput={(e) => onValue((e.currentTarget as HTMLInputElement).value)}
      />
      {error && <p id={errId} class="fm-error">{error}</p>}
    </div>
  );
}

interface SelectFieldProps<V extends string> {
  id: string;
  label: string;
  value: V;
  options: ReadonlyArray<{ value: V; label: string }>;
  onValue: (v: V) => void;
  hint?: string;
}

export function SelectField<V extends string>({ id, label, value, options, onValue, hint }: SelectFieldProps<V>): JSX.Element {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div class="fm-field">
      <label for={id}>{label}</label>
      {hint && <p id={hintId} class="fm-hint">{hint}</p>}
      <select id={id} value={value} aria-describedby={hintId} onChange={(e) => onValue((e.currentTarget as HTMLSelectElement).value as V)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

interface CheckFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onValue: (v: boolean) => void;
  hint?: string;
}

export function CheckField({ id, label, checked, onValue, hint }: CheckFieldProps): JSX.Element {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div class="ft-check">
      <input id={id} type="checkbox" checked={checked} aria-describedby={hintId} onChange={(e) => onValue((e.currentTarget as HTMLInputElement).checked)} />
      <div>
        <label for={id}>{label}</label>
        {hint && <p id={hintId} class="fm-hint">{hint}</p>}
      </div>
    </div>
  );
}
