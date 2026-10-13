import { useEffect, useRef, useState } from "preact/hooks";

interface Props {
  /** Visible text of the first button, e.g. "Delete". */
  label: string;
  /** Accessible name of the first button when the visible label needs context. */
  ariaLabel?: string;
  /** Question shown in the confirm step, e.g. "Delete this rules page?". */
  question: string;
  yesLabel?: string;
  noLabel?: string;
  onConfirm: () => void;
}

/** Inline two-step confirm ("Delete" → "Delete X? Yes / No"), instead of window.confirm. */
export default function ConfirmAction({ label, ariaLabel, question, yesLabel = "Yes, delete", noLabel = "No, keep it", onConfirm }: Props) {
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
    <div class="kg-card" role="group" aria-label={question}>
      <p>{question}</p>
      <div class="kg-actions">
        <button type="button" class="btn btn-primary" ref={yesRef} onClick={() => { setOpen(false); onConfirm(); }}>{yesLabel}</button>
        <button type="button" class="btn btn-secondary" onClick={() => { returnFocus.current = true; setOpen(false); }}>{noLabel}</button>
      </div>
    </div>
  );
}
