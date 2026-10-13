import { useRef, useState } from "preact/hooks";
import { buildTicket, TICKET_TEMPLATES, ticketToText, type TicketFieldId, type TicketKind, type TicketValues } from "@rokadm/planner/tools";

/**
 * F-82: builds a support ticket as text to paste into the game's own support. State lives only in
 * this component: nothing is written to storage (not even ko:tools:v1) and nothing is sent.
 */
export default function TicketBuilder() {
  const [kind, setKind] = useState<TicketKind>("recovery");
  const [values, setValues] = useState<TicketValues>({});
  const [msg, setMsg] = useState("");
  const out = useRef<HTMLTextAreaElement>(null);
  const tpl = TICKET_TEMPLATES.find((t) => t.kind === kind)!;
  const ticket = buildTicket(kind, values);
  const text = ticketToText(ticket);

  const setField = (id: TicketFieldId, v: string): void => {
    setValues((prev) => ({ ...prev, [id]: v }));
    setMsg("");
  };

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setMsg("Copied. Paste it into the game's support chat.");
    } catch {
      out.current?.focus();
      out.current?.select();
      setMsg("Copy didn't work here. The text is selected: copy it with your device's copy command.");
    }
  };

  return (
    <div class="s-ticket" data-tool="ticket">
      <fieldset class="s-kinds">
        <legend>What do you need?</legend>
        {TICKET_TEMPLATES.map((t) => (
          <label key={t.kind} class="s-kind">
            <input type="radio" name="s-kind" value={t.kind} checked={kind === t.kind} onChange={() => { setKind(t.kind); setMsg(""); }} />
            <span><strong>{t.title}</strong><span class="t-note">{t.blurb}</span></span>
          </label>
        ))}
      </fieldset>

      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label={`${tpl.title}: details`}>
        {tpl.fields.map((f) => {
          const id = `s-${f.id}`;
          const help = f.help ? `${id}-help` : undefined;
          const common = {
            id, value: values[f.id] ?? "", autoComplete: "off", "aria-describedby": help, required: f.required,
            onInput: (e: Event) => setField(f.id, (e.currentTarget as HTMLInputElement | HTMLTextAreaElement).value),
          };
          return (
            <div key={f.id} class={`t-field${f.multiline ? " s-wide" : ""}`}>
              <label for={id}>{f.label}{f.required ? null : <span class="t-note"> (optional)</span>}</label>
              {f.help ? <p id={help} class="t-help">{f.help}</p> : null}
              {f.multiline ? <textarea class="t-textarea" rows={4} {...common} /> : <input type="text" {...common} />}
            </div>
          );
        })}
      </form>

      <section class="s-out" aria-labelledby="s-out-h">
        <h3 id="s-out-h">Your ticket text</h3>
        {ticket.missing.length ? (
          <p class="t-note" data-testid="s-missing">Still missing: {ticket.missing.join(", ")}.</p>
        ) : (
          <p class="t-note">All the details support asks for are in.</p>
        )}
        <label for="s-text" class="visually-hidden">Ticket text to copy</label>
        <textarea id="s-text" ref={out} class="t-textarea s-text" readOnly rows={14} value={text} />
        <button type="button" class="btn btn-primary" onClick={() => void copy()}>Copy ticket text</button>
        <p role="status" class="t-status">{msg}</p>
      </section>
    </div>
  );
}
