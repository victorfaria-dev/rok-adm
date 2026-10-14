// /me/verify/: "Verify this account". Pick a city, get a one-time code image (1 hour), put it in the
// in-game Album, upload up to 3 screenshots, check the pre-filled values, send for review. A
// moderator approves; nothing here sets a level by itself.
import { useEffect, useState } from "preact/hooks";
import type { KoSupabase } from "../../lib/auth/client";
import type { CityKind, VerificationRequestRow } from "../../lib/auth/database.types";
import { loginHref } from "../../lib/auth/paths";
import { ACCEPTED_IMAGE_TYPES, MAX_INPUT_BYTES } from "../../lib/auth/profile-rules";
import {
  LEVEL_LABEL, SLOTS, STATUS_LABEL, addCity, cancelVerification, claimJson, codeCardFileName, codeCardPng, countdown, crossCheck,
  emptyClaim, listCities, listRequests, loadVerificationOcr, mergeOcr, prepareScreenshot, startVerification, submitVerification,
  uploadScreenshot, type CityRow, type ClaimedValues, type ScreenshotSlot, type VerificationOcr,
} from "../../lib/auth/verification";
import { useAuth } from "../auth/useAuth";
import "../auth/auth.css";
import "./profile.css";

interface Props {
  /** Tests: skip the canvas resize. */
  prepare?: (file: Blob) => Promise<Blob>;
  /** Tests / the OCR track: screenshot readers (null = the player types the values). */
  loadOcr?: () => Promise<VerificationOcr | null>;
  /** Tests: clock. */
  now?: () => number;
}

export default function VerifyAccount(props: Props) {
  const auth = useAuth();
  if (auth.status === "loading") return <div class="pf pf-skeleton" aria-busy="true"><span /><span /></div>;
  if (auth.status === "off") {
    return (
      <div class="pf">
        <h1 class="pf-title">Verify this account</h1>
        <p class="pf-empty" data-auth-off>Accounts are not switched on yet, so there is nothing to verify.</p>
      </div>
    );
  }
  if (auth.status === "error") return <div class="pf"><p class="au-error" role="alert">{auth.message}</p></div>;
  if (auth.status === "signed_out") {
    return (
      <div class="pf">
        <h1 class="pf-title">Verify this account</h1>
        <p><a class="btn btn-primary" href={loginHref("/me/verify/")}>Sign in to verify</a></p>
      </div>
    );
  }
  return <Verify client={auth.client} userId={auth.userId} {...props} />;
}

function Verify({ client, userId, prepare = prepareScreenshot, loadOcr = loadVerificationOcr, now = Date.now }: { client: KoSupabase; userId: string } & Props) {
  const [cities, setCities] = useState<CityRow[] | null>(null);
  const [requests, setRequests] = useState<VerificationRequestRow[]>([]);
  const [active, setActive] = useState<VerificationRequestRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<2 | 3>(3);

  const reload = async () => {
    try {
      const [c, r] = await Promise.all([listCities(client), listRequests(client)]);
      setCities(c);
      setRequests(r);
      setActive((cur) => {
        const open = r.find((x) => x.status === "awaiting_screenshots" && Date.parse(x.code_expires_at) > now());
        return cur && r.some((x) => x.id === cur.id && x.status === "awaiting_screenshots") ? cur : open ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  useEffect(() => { void reload(); }, []);

  const start = async (accountId: string) => {
    setError(null);
    const r = await startVerification(client, accountId, level);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    setActive(r.request);
    await reload();
    setActive(r.request);
  };

  return (
    <div class="pf" data-verify>
      <header class="pf-head">
        <h1 class="pf-title">Verify this account</h1>
        <p class="pf-muted">Show other players that a governor is really yours. KingdomOps cannot read game data, so you send screenshots and a moderator checks them. Your screenshots are private: only you and the moderators can see them.</p>
      </header>

      <section class="pf-section pf-pad" aria-labelledby="vf-levels">
        <h2 id="vf-levels" class="pf-h">Levels</h2>
        <ol class="pf-list">
          <li><strong>{LEVEL_LABEL[1]}</strong>: what you typed. Everyone starts here.</li>
          <li><strong>{LEVEL_LABEL[2]}</strong>: a moderator compared your values with your Governor Profile and City Hall screenshots.</li>
          <li><strong>{LEVEL_LABEL[3]}</strong>: your in-game Album showed this site's one-time code under the same governor name and ID.</li>
        </ol>
      </section>

      {error && <p class="au-error" role="alert">{error}</p>}

      {active ? (
        <ActiveRequest key={active.id} client={client} userId={userId} request={active} prepare={prepare} loadOcr={loadOcr} now={now}
          onChanged={async () => { setActive(null); await reload(); }} />
      ) : (
        <section class="pf-section pf-pad" aria-labelledby="vf-cities">
          <h2 id="vf-cities" class="pf-h">Your cities</h2>
          {cities === null ? <p class="pf-muted">Loading…</p> : cities.length === 0 ? (
            <p class="pf-muted">No cities in your account yet. Add one below, or upload this device's data from your profile page.</p>
          ) : (
            <>
              <fieldset class="pf-choices">
                <legend>What to prove</legend>
                <label class="pf-choice"><input type="radio" name="vf-level" checked={level === 3} onChange={() => setLevel(3)} /><span><strong>{LEVEL_LABEL[3]}</strong> (3 screenshots, uses the Album)</span></label>
                <label class="pf-choice"><input type="radio" name="vf-level" checked={level === 2} onChange={() => setLevel(2)} /><span><strong>{LEVEL_LABEL[2]}</strong> (2 screenshots)</span></label>
              </fieldset>
              <ul class="vf-cities">
                {cities.map((c) => {
                  const open = requests.find((r) => r.account_id === c.id && (r.status === "pending_review" || r.status === "awaiting_screenshots"));
                  const last = requests.find((r) => r.account_id === c.id);
                  return (
                    <li key={c.id} class="vf-city">
                      <div>
                        <strong>{c.name}</strong> <span class="pf-muted">({c.kind}{c.city_hall ? `, CH ${c.city_hall}` : ""})</span>
                        <br /><span class="pf-badge" data-kind={c.verification_level > 1 ? "site" : "unverified"}>{LEVEL_LABEL[c.verification_level]}</span>
                        {last && <span class="pf-muted"> · Last request: {STATUS_LABEL[last.status]}{last.review_note ? ` — ${last.review_note}` : ""}</span>}
                      </div>
                      {open?.status === "pending_review" ? (
                        <button type="button" class="btn btn-secondary" onClick={async () => { await cancelVerification(client, open.id); await reload(); }}>Cancel request</button>
                      ) : (
                        <button type="button" class="btn btn-primary" data-start-verify onClick={() => start(c.id)}>Verify this account</button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <AddCity client={client} onAdded={reload} />
        </section>
      )}
    </div>
  );
}

function AddCity({ client, onAdded }: { client: KoSupabase; onAdded: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CityKind>("main");
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <form class="pf-form" onSubmit={async (e) => {
      e.preventDefault();
      const r = await addCity(client, name, kind);
      if (!r.ok) { setMsg(r.message); return; }
      setName("");
      setMsg(null);
      await onAdded();
    }}>
      <h3 class="pf-h3">Add a city</h3>
      <label class="pf-field"><span>Name</span><input name="city_name" maxLength={40} value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} /></label>
      <label class="pf-field"><span>Kind</span>
        <select class="pf-select" value={kind} onChange={(e) => setKind((e.target as HTMLSelectElement).value as CityKind)}>
          <option value="main">Main</option><option value="farm">Farm</option><option value="alt">Alt</option>
        </select>
      </label>
      <div class="au-actions"><button type="submit" class="btn btn-secondary">Add city</button></div>
      {msg && <p class="au-error" role="alert">{msg}</p>}
    </form>
  );
}

function ActiveRequest({ client, userId, request, prepare, loadOcr, now, onChanged }: {
  client: KoSupabase; userId: string; request: VerificationRequestRow; prepare: (f: Blob) => Promise<Blob>;
  loadOcr: () => Promise<VerificationOcr | null>; now: () => number; onChanged: () => Promise<void>;
}) {
  const level = request.requested_level;
  const [tick, setTick] = useState(now());
  const [form, setForm] = useState<ClaimedValues>(emptyClaim());
  const [paths, setPaths] = useState<Partial<Record<ScreenshotSlot, string>>>({});
  const [slotMsg, setSlotMsg] = useState<Partial<Record<ScreenshotSlot, { ok: boolean; text: string }>>>({});
  const [ocrUsed, setOcrUsed] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setTick(now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = countdown(request.code_expires_at, tick);
  const slots = SLOTS.filter((s) => s.level <= level);
  const checks = crossCheck(form, level, request.code);

  const pick = async (slot: ScreenshotSlot, e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type) || file.size > MAX_INPUT_BYTES) {
      setSlotMsg((m) => ({ ...m, [slot]: { ok: false, text: "Use the PNG or JPEG screenshot your phone saved (up to 15 MB)." } }));
      return;
    }
    setSlotMsg((m) => ({ ...m, [slot]: { ok: true, text: "Uploading…" } }));
    try {
      const blob = await prepare(file);
      const up = await uploadScreenshot(client, userId, request.id, slot, blob);
      if (!up.ok) throw new Error(up.message);
      setPaths((p) => ({ ...p, [slot]: up.path }));
      let note = "Uploaded.";
      const ocr = await loadOcr().catch(() => null);
      if (ocr) {
        const want = SLOTS.find((s) => s.slot === slot)!.screen;
        const seen = await ocr.detectScreen(blob).catch(() => "unknown" as const);
        if (seen !== want && seen !== "unknown") note = "Uploaded, but this does not look like the right screen. Check it.";
        const values = slot === "profile" ? await ocr.readGovernorProfile(blob) : slot === "city_hall" ? await ocr.readCityHall(blob) : await ocr.readAlbum(blob);
        setForm((f) => mergeOcr(f, slot, values));
        setOcrUsed(true);
        if (note === "Uploaded.") note = "Uploaded. Values read from the screenshot: check them below.";
      }
      setSlotMsg((m) => ({ ...m, [slot]: { ok: true, text: note } }));
    } catch (err) {
      setSlotMsg((m) => ({ ...m, [slot]: { ok: false, text: err instanceof Error ? err.message : String(err) } }));
    }
  };

  const submit = async (e: Event) => {
    e.preventDefault();
    setMsg(null);
    const list = slots.map((s) => paths[s.slot]).filter((p): p is string => !!p);
    if (list.length < slots.length) {
      setMsg({ ok: false, text: `Upload all ${slots.length} screenshots first.` });
      return;
    }
    const failed = checks.filter((c) => !c.ok);
    if (failed.length > 0) {
      setMsg({ ok: false, text: `Fix before sending: ${failed.map((c) => c.label).join("; ")}.` });
      return;
    }
    setBusy(true);
    const r = await submitVerification(client, request.id, claimJson(form, checks, ocrUsed), list, level === 3 ? form.albumCode.replace(/\s/g, "") : null);
    setBusy(false);
    if (!r.ok) {
      setMsg({ ok: false, text: r.message });
      return;
    }
    setMsg({ ok: true, text: "Sent. A moderator will check your screenshots. After approval you can delete the code photo from your Album." });
    await onChanged();
  };

  const field = (k: keyof ClaimedValues, label: string, inputMode?: "numeric") => (
    <label class="pf-field" key={k}>
      <span>{label}</span>
      <input name={`vf_${k}`} inputMode={inputMode} value={form[k]} onInput={(e) => setForm({ ...form, [k]: (e.target as HTMLInputElement).value })} />
    </label>
  );

  return (
    <section class="pf-section pf-pad" aria-labelledby="vf-active" data-verify-request={request.id}>
      <h2 id="vf-active" class="pf-h">Verification in progress</h2>
      <p role="timer" aria-live="off" class={left.over ? "au-error" : undefined} data-countdown>
        {left.over ? "This code has expired. Cancel and start again for a new code." : <>Time left for this code: <strong class="mono">{left.text}</strong></>}
      </p>

      {level === 3 && <CodeCard code={request.code} />}

      <h3 class="pf-h3">Screenshots</h3>
      {slots.map((s) => (
        <div class="pf-slot" key={s.slot}>
          <label class="btn btn-secondary pf-file">
            {paths[s.slot] ? `Replace: ${s.label}` : `Upload: ${s.label}`}
            <input type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} onChange={(e) => pick(s.slot, e)} disabled={left.over} data-shot={s.slot} />
          </label>
          <p class="pf-muted pf-fine">{s.help}</p>
          {slotMsg[s.slot] && <p class={slotMsg[s.slot]!.ok ? "pf-muted" : "au-error"} role={slotMsg[s.slot]!.ok ? "status" : "alert"}>{slotMsg[s.slot]!.text}</p>}
        </div>
      ))}

      <form class="pf-form" onSubmit={submit} noValidate>
        <h3 class="pf-h3">Values (check them against your screenshots)</h3>
        {field("governorId", "Governor ID", "numeric")}
        {field("name", "Governor name")}
        {field("power", "Power", "numeric")}
        {field("killPoints", "Kill points", "numeric")}
        {field("civilization", "Civilization")}
        {field("cityHall", "City Hall level", "numeric")}
        {field("vip", "VIP level", "numeric")}
        {level === 3 && field("albumName", "Governor name shown in the Album")}
        {level === 3 && field("albumCode", "Code shown in the Album", "numeric")}
        <ul class="vf-checks">
          {checks.map((c) => <li key={c.id} data-ok={c.ok ? "" : undefined}>{c.ok ? "✓" : "✗"} {c.label}</li>)}
        </ul>
        <div class="au-actions">
          <button type="submit" class="btn btn-primary" disabled={busy || left.over}>{busy ? "Sending…" : "Send for review"}</button>
          <button type="button" class="btn btn-secondary" onClick={async () => { await cancelVerification(client, request.id); await onChanged(); }}>Cancel</button>
        </div>
        {msg && <p class={msg.ok ? "au-ok" : "au-error"} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}
      </form>
    </section>
  );
}

/** The one-time code image: preview, Download (PNG), Share (phones), long-press fallback, steps. */
export function CodeCard({ code }: { code: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let u: string | null = null;
    codeCardPng(code)
      .then((b) => {
        u = URL.createObjectURL(b);
        setBlob(b);
        setUrl(u);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [code]);
  const file = blob ? new File([blob], codeCardFileName(code), { type: "image/png" }) : null;
  const canShare = !!file && typeof navigator !== "undefined" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });

  return (
    <div class="vf-card" data-code-card={code}>
      <div class="vf-card-img">
        {url ? <img src={url} alt={`Verification code ${code.split("").join(" ")}`} width={1200} height={900} data-code-image /> : err ? <p class="au-error" role="alert">{err}</p> : <p class="pf-muted">Drawing the code image…</p>}
      </div>
      <div class="vf-steps">
        <p class="vf-code">Your code: <strong class="mono">{code}</strong></p>
        <div class="au-actions">
          {url && <a class="btn btn-primary" href={url} download={codeCardFileName(code)} data-download-code>Download image</a>}
          {canShare && (
            <button type="button" class="btn btn-secondary" onClick={() => { void navigator.share({ files: [file!], title: "KingdomOps code" }).catch(() => undefined); }}>Save to Photos / Share</button>
          )}
        </div>
        <p class="pf-muted pf-fine">Download does not work on your phone? Press and hold the image, then "Save image".</p>
        <ol class="pf-list">
          <li>Save the image to your phone's photos.</li>
          <li>In the game, open your Governor Profile → Album → add a photo, and pick this image.</li>
          <li>Take a screenshot of the Album showing the code and your governor name.</li>
          <li>Upload that screenshot below, with your Governor Profile and City Hall screenshots.</li>
        </ol>
        <p class="pf-muted pf-fine">This code works only for this request and only for 1 hour. After approval you can delete the photo from your Album.</p>
      </div>
    </div>
  );
}
