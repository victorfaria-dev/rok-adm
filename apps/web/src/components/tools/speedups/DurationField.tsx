import { useState } from "preact/hooks";
import { formatDuration, parseDuration } from "@rokadm/planner/tools";

interface Props {
  id: string;
  label: string;
  /** Saved text, e.g. "1d 4h". */
  value: string;
  onChange: (text: string, seconds: number) => void;
  help?: string;
}

/** Labelled duration input ("2d 4h 30m"). Keeps the last good value while the text is invalid. */
export function DurationField({ id, label, value, onChange, help }: Props) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shown = text ?? value;
  const secs = parseDuration(shown);
  const describedBy = [help ? `${id}-help` : null, error ? `${id}-err` : `${id}-read`].filter(Boolean).join(" ");

  const commit = (raw: string): void => {
    setText(raw);
    const s = parseDuration(raw);
    if (s === null) { setError("Digite um tempo como 2d 4h 30m."); return; }
    setError(null);
    onChange(raw.trim(), s);
  };

  return (
    <div class={`t-field${error ? " t-field-error" : ""}`}>
      <label for={id}>{label}</label>
      {help ? <p id={`${id}-help`} class="t-help">{help}</p> : null}
      <div class="t-input">
        <input id={id} type="text" autoComplete="off" value={shown} aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy} onInput={(e) => commit((e.currentTarget as HTMLInputElement).value)}
          onBlur={() => { if (!error) setText(null); }} />
      </div>
      {error ? <p id={`${id}-err`} class="t-error">{error}</p> : <p id={`${id}-read`} class="t-help">Lido como {formatDuration(secs ?? 0)}.</p>}
    </div>
  );
}
