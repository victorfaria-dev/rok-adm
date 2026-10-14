import { useEffect, useState } from "preact/hooks";

interface Props {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onValue: (n: number) => void;
  hint?: string;
  disabled?: boolean;
}

/** Whole-number field: keeps what the user typed, commits only valid values, error below. */
export default function NumberField({ id, label, value, min, max, onValue, hint, disabled }: Props) {
  const [text, setText] = useState(String(value));
  const [error, setError] = useState("");
  useEffect(() => {
    setText(String(value));
    setError("");
  }, [value]);
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-error` : undefined;
  return (
    <div class="kg-field">
      <label for={id}>{label}</label>
      {hint && <p id={hintId} class="kg-hint">{hint}</p>}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={text}
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={[hintId, errId].filter(Boolean).join(" ") || undefined}
        onInput={(e) => {
          const v = (e.currentTarget as HTMLInputElement).value;
          setText(v);
          const t = v.trim();
          const n = Number(t);
          if (/^\d{1,3}$/.test(t) && n >= min && n <= max) {
            setError("");
            if (n !== value) onValue(n);
          } else setError(`Digite um número inteiro de ${min} a ${max}.`);
        }}
      />
      {error && <p id={errId} class="kg-error">{error}</p>}
    </div>
  );
}
