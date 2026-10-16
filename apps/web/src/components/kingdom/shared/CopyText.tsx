import { useRef, useState } from "preact/hooks";

interface Props {
  id: string;
  label: string;
  text: string;
  /** "link" = one-line field; "text" = multi-line block. */
  variant?: "link" | "text";
  copyLabel?: string;
  hint?: string;
}

/** Saída só de leitura com botão Copiar. Falls back to selecting the text when the clipboard is blocked. */
export default function CopyText({ id, label, text, variant = "text", copyLabel = "Copiar", hint }: Props) {
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const hintId = hint ? `${id}-hint` : undefined;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copiado.");
    } catch {
      ref.current?.focus();
      ref.current?.select();
      setStatus("Seu navegador bloqueou a cópia. O texto está selecionado: aperte Ctrl+C (ou segure o dedo e toque em Copiar).");
    }
  }

  return (
    <div class="kg-field">
      <label for={id}>{label}</label>
      {hint && <p id={hintId} class="kg-hint">{hint}</p>}
      {variant === "link"
        ? <input id={id} ref={ref} class="kg-output kg-link-out" readOnly value={text} aria-describedby={hintId} onFocus={(e) => (e.currentTarget as HTMLInputElement).select()} />
        : <textarea id={id} ref={ref} class="kg-output" readOnly value={text} rows={10} aria-describedby={hintId} />}
      <div class="kg-actions">
        <button type="button" class="btn btn-primary" onClick={copy} data-copy={id}>{copyLabel}</button>
        <p class="kg-status" role="status" aria-live="polite">{status}</p>
      </div>
    </div>
  );
}
