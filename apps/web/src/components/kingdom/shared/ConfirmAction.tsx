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

/**
 * After a confirmed delete the confirm buttons (often the whole item) are gone and focus would fall
 * to <body>. Move it to the heading of the nearest surviving section instead (WCAG 2.4.3).
 */
function keepFocus(from: HTMLElement | null): void {
  if (!from) return;
  const chain: HTMLElement[] = [];
  for (let el = from.parentElement; el; el = el.parentElement) chain.push(el);
  setTimeout(() => {
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    const host = chain.find((el) => el.isConnected && (el.matches("section, [data-focus-return], main")));
    if (!host) return;
    const target = host.querySelector<HTMLElement>("h2, h3") ?? host;
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus();
  }, 0);
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
    <div class="kg-confirm" role="group" aria-label={question}>
      <p>{question}</p>
      <div class="kg-actions">
        <button type="button" class="btn btn-primary" ref={yesRef} onClick={() => { const from = yesRef.current; setOpen(false); onConfirm(); keepFocus(from); }}>{yesLabel}</button>
        <button type="button" class="btn btn-secondary" onClick={() => { returnFocus.current = true; setOpen(false); }}>{noLabel}</button>
      </div>
    </div>
  );
}
