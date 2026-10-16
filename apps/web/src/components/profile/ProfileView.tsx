// /u/<handle>/ (or /u/?h=<handle>): a public profile, read from Supabase in the browser. The page
// itself is a static shell; RLS decides whether this viewer may see the profile.
import { useEffect, useState } from "preact/hooks";
import type { KoSupabase } from "../../lib/auth/client";
import type { ProfileBundle } from "../../lib/auth/profile-api";
import { blockUser, getProfileByHandle, myBlocks, publicImageUrl, reportUser, unblockUser } from "../../lib/auth/profile-api";
import { handleFromLocation, loginHref } from "../../lib/auth/paths";
import { REPORT_DETAILS_MAX, REPORT_REASONS } from "../../lib/auth/profile-rules";
import type { ReportReason } from "../../lib/auth/database.types";
import { useAuth } from "../auth/useAuth";
import { ProfileHeader } from "./ProfileHeader";
import "../auth/auth.css";
import "./profile.css";

interface Props {
  /** Tests pass the handle; the page reads it from the address. */
  handle?: string | null;
}

type Load = { k: "loading" } | { k: "missing" } | { k: "error"; message: string } | { k: "ok"; bundle: ProfileBundle; blockedByMe: boolean };

export default function ProfileView({ handle: given }: Props) {
  const auth = useAuth();
  const handle = given !== undefined ? given : typeof window === "undefined" ? null : handleFromLocation(window.location.pathname, window.location.search);
  const [load, setLoad] = useState<Load>({ k: "loading" });
  const client = auth.status === "signed_in" || auth.status === "signed_out" ? auth.client : null;
  const viewerId = auth.status === "signed_in" ? auth.userId : null;

  const refresh = async (c: KoSupabase) => {
    if (!handle) return;
    try {
      const bundle = await getProfileByHandle(c, handle);
      if (!bundle) {
        setLoad({ k: "missing" });
        return;
      }
      const blocked = viewerId && viewerId !== bundle.profile.id ? (await myBlocks(c)).includes(bundle.profile.id) : false;
      setLoad({ k: "ok", bundle, blockedByMe: blocked });
      document.title = `${bundle.profile.display_name || `@${bundle.profile.handle}`} · KingdomOps`;
    } catch (e) {
      setLoad({ k: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  useEffect(() => {
    if (client) void refresh(client);
  }, [client, viewerId, handle]);

  if (auth.status === "off") {
    return <div class="pf"><h1 class="pf-title">Perfil do jogador</h1><p class="pf-empty" data-auth-off>Os perfis de jogadores ainda não estão ativados.</p></div>;
  }
  if (auth.status === "error") return <div class="pf"><p class="au-error" role="alert">{auth.message}</p></div>;
  if (!handle) return <div class="pf"><h1 class="pf-title">Perfil do jogador</h1><p class="pf-empty">Este link não tem o identificador de um jogador.</p></div>;
  if (auth.status === "loading" || load.k === "loading") return <div class="pf pf-skeleton" aria-busy="true"><span /><span /></div>;
  if (load.k === "error") return <div class="pf"><h1 class="pf-title">@{handle}</h1><p class="au-error" role="alert">{load.message}</p></div>;
  if (load.k === "missing") {
    return (
      <div class="pf" data-profile-missing>
        <h1 class="pf-title">@{handle}</h1>
        <p class="pf-empty">Nenhum perfil para mostrar. Ele pode não existir, ou o dono o mantém privado.</p>
        {auth.status === "signed_out" && <p><a class="btn btn-secondary" href={loginHref(`/u/${handle}/`)}>Entrar para ver perfis compartilhados com jogadores</a></p>}
      </div>
    );
  }

  const { profile, achievements } = load.bundle;
  const own = viewerId === profile.id;
  const c = client!;
  return (
    <div class="pf" data-profile-view>
      {load.blockedByMe ? (
        <div class="pf-blocked">
          <h1 class="pf-title">@{profile.handle}</h1>
          <p>Você bloqueou este jogador. Ele não pode ver o seu perfil.</p>
          <button type="button" class="btn btn-secondary" onClick={async () => { await unblockUser(c, profile.id); await refresh(c); }}>Desbloquear</button>
        </div>
      ) : (
        <ProfileHeader profile={profile} achievements={achievements}
          avatarUrl={publicImageUrl(c, "avatar", profile.avatar_path)} bannerUrl={publicImageUrl(c, "banner", profile.banner_path)}>
          {own && <a class="btn btn-secondary" href="/me/profile/">Editar perfil</a>}
          {!own && viewerId && <SafetyActions client={c} targetId={profile.id} handle={profile.handle ?? handle} onBlocked={() => refresh(c)} />}
          {!own && !viewerId && <a class="btn btn-secondary" href={loginHref(`/u/${handle}/`)}>Entrar para denunciar ou bloquear</a>}
        </ProfileHeader>
      )}
    </div>
  );
}

function SafetyActions({ client, targetId, handle, onBlocked }: { client: KoSupabase; targetId: string; handle: string; onBlocked: () => void }) {
  const [mode, setMode] = useState<"idle" | "report" | "block">("idle");
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const sendReport = async (e: Event) => {
    e.preventDefault();
    if (!reason) {
      setMsg({ ok: false, text: "Escolha o que há de errado." });
      return;
    }
    setBusy(true);
    const r = await reportUser(client, targetId, reason, details);
    setBusy(false);
    if (r.ok) {
      setMode("idle");
      setMsg({ ok: true, text: "Obrigado. A denúncia foi enviada; denúncias sobre a segurança de crianças são analisadas primeiro. Você também pode bloquear este jogador." });
    } else setMsg({ ok: false, text: r.message });
  };
  const confirmBlock = async () => {
    setBusy(true);
    const r = await blockUser(client, targetId);
    setBusy(false);
    if (r.ok) onBlocked();
    else setMsg({ ok: false, text: r.message });
  };

  return (
    <>
      {mode === "idle" && (
        <>
          <button type="button" class="btn btn-secondary" data-report onClick={() => { setMode("report"); setMsg(null); }}>Denunciar</button>
          <button type="button" class="btn btn-secondary" data-block onClick={() => { setMode("block"); setMsg(null); }}>Bloquear</button>
        </>
      )}
      {mode === "block" && (
        <div class="pf-confirm" role="group" aria-label={`Bloquear @${handle}`}>
          <p>Bloquear @{handle}? Ele deixará de ver o seu perfil e as suas conquistas. Ele não é avisado.</p>
          <div class="au-actions">
            <button type="button" class="btn btn-primary" onClick={confirmBlock} disabled={busy}>Bloquear</button>
            <button type="button" class="btn btn-secondary" onClick={() => setMode("idle")}>Cancelar</button>
          </div>
        </div>
      )}
      {mode === "report" && (
        <form class="pf-report" onSubmit={sendReport} aria-label={`Denunciar @${handle}`}>
          <fieldset class="pf-choices">
            <legend>O que há de errado com este perfil?</legend>
            {REPORT_REASONS.map((r) => (
              <label class="pf-choice" key={r.value}>
                <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
                <span>{r.label}</span>
              </label>
            ))}
          </fieldset>
          <label class="pf-field">
            <span>Detalhes (opcional)</span>
            <textarea rows={3} maxLength={REPORT_DETAILS_MAX} value={details} onInput={(e) => setDetails((e.target as HTMLTextAreaElement).value)} />
          </label>
          <p class="pf-muted pf-fine">Se alguém está em perigo agora, ligue para os serviços de emergência locais. Uma cópia deste perfil como ele está agora é guardada junto com a denúncia.</p>
          <div class="au-actions">
            <button type="submit" class="btn btn-primary" disabled={busy}>{busy ? "Enviando…" : "Enviar denúncia"}</button>
            <button type="button" class="btn btn-secondary" onClick={() => setMode("idle")}>Cancelar</button>
          </div>
        </form>
      )}
      {msg && <p class={msg.ok ? "au-ok" : "au-error"} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}
    </>
  );
}
