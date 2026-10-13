// First-login offer: copy this device's data to the account. Nothing is uploaded without a yes and
// nothing on the device is deleted. Used by /auth/callback/ and by the profile page.
import { useState } from "preact/hooks";
import type { KoSupabase } from "../../lib/auth/client";
import { claimSiteAchievements } from "../../lib/auth/profile-api";
import { deviceLabel, performUpload, rememberChoice, type UploadPlan } from "../../lib/auth/upload";
import { localStore } from "../../lib/auth/session";
import "./auth.css";

interface Props {
  client: KoSupabase;
  userId: string;
  plan: UploadPlan;
  /** Called after any choice ("uploaded", "later", "kept_local"). */
  onDone: (result: "uploaded" | "later" | "kept_local") => void;
  /** Heading level context: the callback page uses h1, the profile page h2. */
  headingLevel?: 1 | 2;
}

export function UploadOffer({ client, userId, plan, onDone, headingLevel = 2 }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const H = headingLevel === 1 ? "h1" : "h2";
  const cities = plan.accounts.length;

  const upload = async () => {
    setBusy(true);
    setError(null);
    const r = await performUpload(client, plan, deviceLabel(navigator.userAgent));
    if (!r.ok) {
      setBusy(false);
      setError(r.message);
      return;
    }
    rememberChoice(localStore(), userId, "uploaded", plan.fingerprint);
    await claimSiteAchievements(client);
    setBusy(false);
    setDone(`Uploaded. ${r.cities === 1 ? "1 city" : `${r.cities} cities`} added to your account. Your data on this device is unchanged.`);
    onDone("uploaded");
  };
  const keep = () => {
    rememberChoice(localStore(), userId, "kept_local", plan.fingerprint);
    onDone("kept_local");
  };

  if (done) return <p class="au-ok" role="status" data-upload-done>{done}</p>;

  return (
    <section class="au-offer" aria-labelledby="au-offer-title" data-upload-offer>
      <H id="au-offer-title">Bring this device's data to your account?</H>
      <p>This browser already has KingdomOps data. Upload a copy so it is saved with your account:</p>
      <ul class="au-summary">
        {plan.summary.map((s) => (
          <li key={s.label}><strong>{s.label}</strong>: {s.detail}</li>
        ))}
      </ul>
      {cities > 0 && <p class="au-note">{cities === 1 ? "1 city" : `${cities} cities`} (main, farms and alts) will show in your account.</p>}
      <p class="au-note">Nothing is deleted from this device either way. The Discord webhook is never uploaded.</p>
      <div class="au-actions">
        <button type="button" class="btn btn-primary" onClick={upload} disabled={busy}>{busy ? "Uploading…" : "Upload to my account"}</button>
        <button type="button" class="btn btn-secondary" onClick={() => onDone("later")} disabled={busy}>Not now</button>
        <button type="button" class="btn btn-secondary" onClick={keep} disabled={busy}>Keep it only on this device</button>
      </div>
      {error && <p class="au-error" role="alert">{error}</p>}
    </section>
  );
}
