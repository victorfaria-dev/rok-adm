import { useState } from "preact/hooks";
import { PendingTag } from "./Cite";

interface Props {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Short help under the label. */
  help?: string;
  /** No fact card covers this value: the user types their own (shown as "Pending measurement"). */
  pending?: boolean;
  suffix?: string;
  integer?: boolean;
  /** Empty is allowed: shown as "" and reported as EMPTY_NUMBER (-1) so the tool can show a neutral state. */
  optional?: boolean;
}

/** Value of an optional NumberField the user has not filled in. */
export const EMPTY_NUMBER = -1;

/** Labelled number input: label above, help, error below (never placeholder-as-label). */
export function NumberField({ id, label, value, onChange, min = 0, max, step, help, pending, suffix, integer = true, optional = false }: Props) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shown = text ?? (optional && value < 0 ? "" : String(value));
  const describedBy = [help ? `${id}-help` : null, error ? `${id}-err` : null].filter(Boolean).join(" ") || undefined;

  const commit = (raw: string): void => {
    setText(raw);
    const t = raw.trim().replace(/,/g, "");
    if (t === "") {
      if (optional) { setError(null); onChange(EMPTY_NUMBER); return; }
      setError("Enter a number.");
      return;
    }
    const v = Number(t);
    if (!Number.isFinite(v) || (integer && !Number.isInteger(v))) { setError(integer ? "Enter a whole number." : "Enter a number."); return; }
    if (v < min) { setError(`Use ${min} or more.`); return; }
    if (max !== undefined && v > max) { setError(`Use ${max} or less.`); return; }
    setError(null);
    onChange(v);
  };

  return (
    <div class={`t-field${error ? " t-field-error" : ""}`}>
      <label for={id}>
        {label}
        {pending ? <> <PendingTag /></> : null}
      </label>
      {help ? <p id={`${id}-help`} class="t-help">{help}</p> : null}
      <div class="t-input">
        <input
          id={id}
          type="text"
          inputMode={integer ? "numeric" : "decimal"}
          autoComplete="off"
          value={shown}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          onInput={(e) => commit((e.currentTarget as HTMLInputElement).value)}
          onBlur={() => { if (!error) setText(null); }}
          {...(step ? { "data-step": step } : {})}
        />
        {suffix ? <span class="t-suffix" aria-hidden="true">{suffix}</span> : null}
      </div>
      {error ? <p id={`${id}-err`} class="t-error">{error}</p> : null}
    </div>
  );
}

interface SelectProps<T extends string | number> {
  id: string;
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  help?: string;
}

export function SelectField<T extends string | number>({ id, label, value, options, onChange, help }: SelectProps<T>) {
  return (
    <div class="t-field">
      <label for={id}>{label}</label>
      {help ? <p id={`${id}-help`} class="t-help">{help}</p> : null}
      <select
        id={id}
        value={String(value)}
        aria-describedby={help ? `${id}-help` : undefined}
        onChange={(e) => {
          const raw = (e.currentTarget as HTMLSelectElement).value;
          const hit = options.find((o) => String(o.value) === raw);
          if (hit) onChange(hit.value);
        }}
      >
        {options.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
      </select>
    </div>
  );
}
