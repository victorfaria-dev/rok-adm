import { useEffect, useRef, useState } from "preact/hooks";

interface Props {
  /** Visible text of the first button, e.g. "Excluir". */
  label: string;
  /** Accessible name of the first button when the visible label needs context. */
  ariaLabel?: string;
  /** Question shown in the confirm step, e.g. "Excluir Farm 1?". */
  question: string;
  yesLabel?: string;
  onConfirm: () => void;
}

/** Inline two-step confirm ("Delete" → "Delete X? Yes / No"), instead of window.confirm. */
export default function ConfirmAction({ label, ariaLabel, question, yesLabel = "Sim, excluir", onConfirm }: Props) {
  const [open, setOpen] = useState(false);
  const yesRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  useEffect(() => {
    if (open) yesRef.current?.focus();
    else if (returnFocus.current) {
      returnFocus.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return (
      <button type="button" class="btn btn-secondary" ref={triggerRef} aria-label={ariaLabel} onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }
  return (
    <div class="fh-confirm" role="group" aria-label={question}>
      <p>{question}</p>
      <div class="fm-actions">
        <button type="button" class="btn btn-primary" ref={yesRef} onClick={onConfirm}>{yesLabel}</button>
        <button type="button" class="btn btn-secondary" onClick={() => { returnFocus.current = true; setOpen(false); }}>Não, manter</button>
      </div>
    </div>
  );
}
