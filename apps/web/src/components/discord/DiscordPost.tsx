import { useEffect, useRef, useState } from "preact/hooks";
import { DISCORD_MAX, checkWebhookUrl, maskWebhook, sendToDiscord, type MessageResult } from "../../lib/discord";
import { forgetWebhook, kingdomStorage, readWebhook, saveWebhook } from "../../lib/kingdom-store";
import "./discord.css";

interface Props {
  /** Unique per page (ids of the fields). */
  id: string;
  /** The exact message, or why there is none yet. Built by a pure function in lib/discord.ts. */
  message: MessageResult;
  /** Summary text, e.g. "Post the results to Discord". */
  summary?: string;
  /** Tests pass a stub; the page uses the browser's fetch. */
  fetchImpl?: typeof fetch;
}

/** Webhook settings only (the /kingdom/ hub): paste, check, save or forget the URL. */
export function WebhookSettings({ id }: { id: string }) {
  return <Webhook id={id} onChange={() => {}} />;
}

function Webhook({ id, onChange }: { id: string; onChange: (url: string | null) => void }) {
  const [saved, setSaved] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const url = readWebhook(kingdomStorage().st);
    const ok = url && checkWebhookUrl(url).ok ? url : null;
    setSaved(ok);
    onChange(ok);
  }, []);

  function save(e: Event) {
    e.preventDefault();
    const c = checkWebhookUrl(text);
    if (!c.ok) {
      setError(c.error);
      setStatus("");
      return;
    }
    const { st, blocked } = kingdomStorage();
    saveWebhook(c.url, st);
    setSaved(c.url);
    onChange(c.url);
    setText("");
    setError("");
    setEditing(false);
    setStatus(blocked ? "Webhook kept for this page only (this browser blocks saving)." : "Webhook saved in this browser.");
  }

  function forget() {
    forgetWebhook(kingdomStorage().st);
    setSaved(null);
    onChange(null);
    setEditing(false);
    setStatus("Webhook removed from this browser.");
  }

  const hintId = `${id}-wh-hint`;
  const errId = `${id}-wh-error`;
  return (
    <div class="dc-webhook" data-webhook>
      {saved && !editing ? (
        <div class="dc-row">
          <p class="dc-saved" data-webhook-saved>Webhook: <span class="dc-mono">{maskWebhook(saved)}</span></p>
          <div class="dc-actions">
            <button type="button" class="btn btn-secondary" onClick={() => { setEditing(true); setStatus(""); }}>Change webhook</button>
            <button type="button" class="btn btn-secondary" onClick={forget}>Forget webhook</button>
          </div>
        </div>
      ) : (
        <form class="dc-form" onSubmit={save} noValidate>
          <div class="dc-field">
            <label for={`${id}-wh`}>Discord webhook URL</label>
            <p id={hintId} class="dc-hint">In Discord: channel settings → Integrations → Webhooks → New Webhook → Copy Webhook URL. Ask whoever runs your server.</p>
            <input
              id={`${id}-wh`}
              type="text"
              inputMode="url"
              autoComplete="off"
              spellcheck={false}
              value={text}
              placeholder="https://discord.com/api/webhooks/…"
              aria-invalid={error ? "true" : undefined}
              aria-describedby={[hintId, error ? errId : ""].filter(Boolean).join(" ")}
              onInput={(e) => setText((e.currentTarget as HTMLInputElement).value)}
            />
            {error && <p id={errId} class="dc-error">{error}</p>}
          </div>
          <div class="dc-actions">
            <button type="submit" class="btn btn-secondary">Save webhook</button>
            {editing && <button type="button" class="btn btn-secondary" onClick={() => { setEditing(false); setError(""); }}>Cancel</button>}
          </div>
        </form>
      )}
      <p class="dc-warn" data-webhook-warning><strong>Anyone with this URL can post in that channel.</strong> It stays in this browser only: it is not in your exports or backups and is sent to nobody but Discord, and only when you press Send.</p>
      <p class="dc-status" role="status" aria-live="polite">{status}</p>
    </div>
  );
}

/** "Post to Discord": exact preview, then one POST to the council's own webhook on an explicit click. */
export default function DiscordPost({ id, message, summary = "Post to Discord", fetchImpl }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [waitUntil, setWaitUntil] = useState(0);
  const [, tick] = useState(0);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A new message clears the last result so nobody thinks this text was already posted.
  const content = message.ok ? message.content : "";
  useEffect(() => setResult(null), [content]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const waiting = waitUntil > Date.now();

  async function send() {
    if (!url || !message.ok || busy || waiting) return;
    setBusy(true);
    setResult(null);
    const r = await sendToDiscord(url, message.content, fetchImpl ?? ((...a) => fetch(...a)));
    setBusy(false);
    if (r.ok) {
      setResult({ ok: true, text: "Posted to Discord." });
      return;
    }
    setResult({ ok: false, text: r.message });
    if (r.kind === "rate") {
      setWaitUntil(Date.now() + r.retryAfter * 1000);
      timer.current = setTimeout(() => { setWaitUntil(0); tick((n) => n + 1); }, r.retryAfter * 1000);
    }
  }

  const prevId = `${id}-preview`;
  return (
    <details class="dc" data-discord={id}>
      <summary class="dc-summary">{summary}</summary>
      <div class="dc-body">
        <Webhook id={id} onChange={setUrl} />
        <div class="dc-field">
          <p class="dc-label" id={`${prevId}-label`}>Message preview (exactly what will be posted)</p>
          {message.ok ? (
            <>
              <pre class="dc-preview" id={prevId} tabIndex={0} aria-labelledby={`${prevId}-label`} data-discord-preview>{message.content}</pre>
              <p class="dc-hint">{message.content.length.toLocaleString("en-US")} / {DISCORD_MAX.toLocaleString("en-US")} characters. Mentions such as @everyone will not ping anyone.</p>
            </>
          ) : (
            <p class="dc-hint" data-discord-reason>{message.reason}</p>
          )}
        </div>
        <div class="dc-actions">
          <button type="button" class="btn btn-primary" onClick={() => void send()} disabled={!url || !message.ok || busy || waiting} data-discord-send>
            {busy ? "Sending…" : "Send to Discord"}
          </button>
          {!url && <p class="dc-hint">Save a webhook first.</p>}
        </div>
        {result && (result.ok
          ? <p class="dc-ok" role="status" data-discord-result="ok">{result.text}</p>
          : <p class="dc-error" role="alert" data-discord-result="error">{result.text}</p>)}
      </div>
    </details>
  );
}
