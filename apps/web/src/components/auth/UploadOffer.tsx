// First-login offer: copy this device's data to the account. Nothing is uploaded without a yes and
// nothing on the device is deleted. Used by /auth/callback/ and by the profile page.
import { useEffect, useState } from "preact/hooks";
import type { KoSupabase } from "../../lib/auth/client";
import { loadLocalBanners, uploadLocalBanners, type LocalBanner } from "../../lib/auth/account-banners";
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
  /** The device's custom city banners (City Hall track); tests pass a fake. */
  loadBanners?: () => Promise<LocalBanner[]>;
}

export function UploadOffer({ client, userId, plan, onDone, headingLevel = 2, loadBanners = loadLocalBanners }: Props) {
  const [banners, setBanners] = useState<LocalBanner[]>([]);
  useEffect(() => { loadBanners().then(setBanners).catch(() => setBanners([])); }, []);
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
    const b = await uploadLocalBanners(client, userId, banners);
    rememberChoice(localStore(), userId, "uploaded", plan.fingerprint);
    await claimSiteAchievements(client);
    setBusy(false);
    const bannerNote = b.uploaded > 0 ? ` ${b.uploaded === 1 ? "1 banner de cidade enviado" : `${b.uploaded} banners de cidade enviados`}.` : "";
    const bannerFail = b.failed.length > 0 ? ` ${b.failed.length === 1 ? "1 banner não pôde ser enviado e fica" : `${b.failed.length} banners não puderam ser enviados e ficam`} só neste aparelho: ${b.failed[0]}` : "";
    setDone(`Enviado. ${r.cities === 1 ? "1 cidade adicionada" : `${r.cities} cidades adicionadas`} à sua conta.${bannerNote} Seus dados neste aparelho não mudaram.${bannerFail}`);
    onDone("uploaded");
  };
  const keep = () => {
    rememberChoice(localStore(), userId, "kept_local", plan.fingerprint);
    onDone("kept_local");
  };

  if (done) return <p class="au-ok" role="status" data-upload-done>{done}</p>;

  return (
    <section class="au-offer" aria-labelledby="au-offer-title" data-upload-offer>
      <H id="au-offer-title">Levar os dados deste aparelho para a sua conta?</H>
      <p>Este navegador já tem dados do KingdomOps. Envie uma cópia para ela ficar salva na sua conta:</p>
      <ul class="au-summary">
        {plan.summary.map((s) => (
          <li key={s.label}><strong>{s.label}</strong>: {s.detail}</li>
        ))}
      </ul>
      {banners.length > 0 && <p class="au-note">{banners.length === 1 ? "1 banner de cidade personalizado será enviado" : `${banners.length} banners de cidade personalizados serão enviados`} também.</p>}
      {cities > 0 && <p class="au-note">{cities === 1 ? "1 cidade (principal, farms e alts) aparecerá" : `${cities} cidades (principal, farms e alts) aparecerão`} na sua conta.</p>}
      <p class="au-note">Nada é apagado deste aparelho, de qualquer forma. O webhook do Discord nunca é enviado.</p>
      <div class="au-actions">
        <button type="button" class="btn btn-primary" onClick={upload} disabled={busy}>{busy ? "Enviando…" : "Enviar para a minha conta"}</button>
        <button type="button" class="btn btn-secondary" onClick={() => onDone("later")} disabled={busy}>Agora não</button>
        <button type="button" class="btn btn-secondary" onClick={keep} disabled={busy}>Manter só neste aparelho</button>
      </div>
      {error && <p class="au-error" role="alert">{error}</p>}
    </section>
  );
}
