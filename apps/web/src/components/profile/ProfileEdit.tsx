// /me/profile/: edit the community profile (photo, banner, name, handle, kingdom, bio, visibility),
// achievements, blocked players, and the account's data rights (export, delete).
import { useEffect, useState } from "preact/hooks";
import type { KoSupabase } from "../../lib/auth/client";
import type { AchievementRow, ProfileRow } from "../../lib/auth/database.types";
import { accountExportFileName, deleteAccount, exportAccountData } from "../../lib/auth/account-data";
import { prepareImage } from "../../lib/auth/image";
import { loginHref, profileHref } from "../../lib/auth/paths";
import {
  addSelfAchievement, claimSiteAchievements, getMyProfile, myBlocks, publicImageUrl, removeAchievement,
  removeProfileImage, replaceProfileImage, saveMyProfile, unblockUser,
} from "../../lib/auth/profile-api";
import {
  ACCEPTED_IMAGE_TYPES, ACHIEVEMENT_DETAIL_MAX, ACHIEVEMENT_TITLE_MAX, BIO_MAX, IMAGE_KINDS, NAME_MAX, SITE_ACHIEVEMENTS,
  VISIBILITY_CHOICES, checkInputImage, validateProfile, type DraftErrors, type ImageKind, type ProfileDraft,
} from "../../lib/auth/profile-rules";
import { localStore } from "../../lib/auth/session";
import { pendingOffer, type UploadPlan } from "../../lib/auth/upload";
import { clearAllKeys } from "../../lib/storage-keys";
import { UploadOffer } from "../auth/UploadOffer";
import { navigateTo, useAuth } from "../auth/useAuth";
import { ProfileHeader } from "./ProfileHeader";
import "../auth/auth.css";
import "./profile.css";

export const VERIFY_PATH = "/me/verify/";

interface Props {
  navigate?: (url: string) => void;
  download?: (fileName: string, text: string) => void;
  /** Tests: skip the canvas step. */
  prepare?: (file: Blob, kind: ImageKind) => Promise<Blob>;
}

const defaultDownload = (fileName: string, text: string): void => {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

const toDraft = (p: ProfileRow | null): ProfileDraft => ({
  handle: p?.handle ?? "", displayName: p?.display_name ?? "", bio: p?.bio ?? "",
  kingdom: p?.kingdom_number != null ? String(p.kingdom_number) : "", visibility: p?.visibility ?? "private",
});

export default function ProfileEdit({ navigate = navigateTo, download = defaultDownload, prepare = prepareImage }: Props) {
  const auth = useAuth();
  if (auth.status === "loading") return <div class="pf pf-skeleton" aria-busy="true"><span /><span /></div>;
  if (auth.status === "off") {
    return (
      <div class="pf">
        <h1 class="pf-title">Perfil público</h1>
        <p class="pf-empty" data-auth-off>As contas ainda não estão ativadas, então não há perfil público para editar. Seus dados ficam neste aparelho.</p>
      </div>
    );
  }
  if (auth.status === "error") return <div class="pf"><p class="au-error" role="alert">{auth.message}</p></div>;
  if (auth.status === "signed_out") {
    return (
      <div class="pf">
        <h1 class="pf-title">Perfil público</h1>
        <p><a class="btn btn-primary" href={loginHref("/me/profile/")}>Entrar para editar seu perfil</a></p>
      </div>
    );
  }
  return <Editor client={auth.client} userId={auth.userId} navigate={navigate} download={download} prepare={prepare} />;
}

function Editor({ client, userId, navigate, download, prepare }: { client: KoSupabase; userId: string } & Required<Props>) {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);
  const [draft, setDraft] = useState<ProfileDraft>(toDraft(null));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [loaded, setLoaded] = useState<"no" | "yes" | string>("no");
  const [offer, setOffer] = useState<UploadPlan | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    try {
      const b = await getMyProfile(client, userId);
      setProfile(b?.profile ?? null);
      setAchievements(b?.achievements ?? []);
      setDraft(toDraft(b?.profile ?? null));
      setLoaded("yes");
    } catch (e) {
      setLoaded(e instanceof Error ? e.message : String(e));
    }
  };
  useEffect(() => {
    setOffer(pendingOffer(localStore(), userId));
    void reload();
  }, [userId]);

  if (loaded === "no") return <div class="pf pf-skeleton" aria-busy="true"><span /><span /></div>;
  if (loaded !== "yes") return <div class="pf"><h1 class="pf-title">Perfil público</h1><p class="au-error" role="alert">{loaded}</p></div>;

  const set = <K extends keyof ProfileDraft>(k: K, v: ProfileDraft[K]) => setDraft({ ...draft, [k]: v });
  const save = async (e: Event) => {
    e.preventDefault();
    setStatus(null);
    const v = validateProfile(draft);
    if (!v.ok) {
      setErrors(v.errors);
      setStatus({ ok: false, text: "Confira os campos destacados." });
      return;
    }
    setErrors({});
    setBusy(true);
    const r = await saveMyProfile(client, userId, v.value);
    setBusy(false);
    if (!r.ok) {
      setStatus({ ok: false, text: r.message });
      return;
    }
    setStatus({ ok: true, text: "Perfil salvo." });
    void claimSiteAchievements(client).then(reload);
    await reload();
  };

  const preview = { verified_level: profile?.verified_level ?? 1, handle: draft.handle.trim().toLowerCase() || null, display_name: draft.displayName.trim() || null, bio: draft.bio.trim() || null, kingdom_number: /^\d+$/.test(draft.kingdom.trim()) ? Number(draft.kingdom.trim()) : null };
  const err = (k: keyof ProfileDraft) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `pf-err-${k}` } : {});

  return (
    <div class="pf" data-profile-edit>
      <header class="pf-head">
        <h1 class="pf-title">Perfil público</h1>
        <p class="pf-muted">O seu cartão de comunidade: foto, banner, nome, reino, bio e conquistas. Suas cidades e planos nunca aparecem aqui.</p>
      </header>

      {offer && (
        <UploadOffer client={client} userId={userId} plan={offer} onDone={(r) => { if (r !== "uploaded") setOffer(null); void reload(); }} />
      )}

      <ProfileHeader as="h2" profile={preview} achievements={achievements}
        avatarUrl={publicImageUrl(client, "avatar", profile?.avatar_path ?? null)} bannerUrl={publicImageUrl(client, "banner", profile?.banner_path ?? null)}>
        {profile?.handle && profile.visibility !== "private" && <a class="btn btn-secondary" href={profileHref(profile.handle)}>Abrir a minha página de perfil</a>}
        <a class="btn btn-secondary" href={VERIFY_PATH}>Verificar esta conta</a>
      </ProfileHeader>

      <section class="pf-section pf-pad" aria-labelledby="pf-images">
        <h2 id="pf-images" class="pf-h">Foto e banner</h2>
        <p class="pf-muted pf-fine">JPEG, PNG ou WebP. O site recorta e reduz a imagem no seu aparelho antes de enviar (foto {IMAGE_KINDS.avatar.width}×{IMAGE_KINDS.avatar.height}, banner {IMAGE_KINDS.banner.width}×{IMAGE_KINDS.banner.height}) e remove dados ocultos da foto, como a localização. Não use uma foto do seu rosto nem nada que mostre onde você mora ou estuda.</p>
        {(["avatar", "banner"] as const).map((kind) => (
          <ImageSlot key={kind} kind={kind} client={client} userId={userId} path={kind === "avatar" ? profile?.avatar_path ?? null : profile?.banner_path ?? null}
            prepare={prepare} onChanged={reload} />
        ))}
      </section>

      <form class="pf-section pf-pad pf-form" onSubmit={save} noValidate aria-labelledby="pf-details">
        <h2 id="pf-details" class="pf-h">Detalhes</h2>
        <label class="pf-field">
          <span>Identificador (seu link: /u/<em>identificador</em>/)</span>
          <input name="handle" autocomplete="off" autocapitalize="none" spellcheck={false} maxLength={21} value={draft.handle}
            onInput={(e) => set("handle", (e.target as HTMLInputElement).value)} {...err("handle")} />
          {errors.handle && <small id="pf-err-handle" class="au-error">{errors.handle}</small>}
        </label>
        <label class="pf-field">
          <span>Nome de exibição</span>
          <input name="display_name" maxLength={NAME_MAX} value={draft.displayName} onInput={(e) => set("displayName", (e.target as HTMLInputElement).value)} {...err("displayName")} />
          {errors.displayName && <small id="pf-err-displayName" class="au-error">{errors.displayName}</small>}
        </label>
        <label class="pf-field">
          <span>Número do reino</span>
          <input name="kingdom" inputMode="numeric" maxLength={5} value={draft.kingdom} onInput={(e) => set("kingdom", (e.target as HTMLInputElement).value)} {...err("kingdom")} />
          {errors.kingdom && <small id="pf-err-kingdom" class="au-error">{errors.kingdom}</small>}
        </label>
        <label class="pf-field">
          <span>Bio <span class="pf-muted mono">{draft.bio.trim().length}/{BIO_MAX}</span></span>
          <textarea name="bio" rows={4} maxLength={BIO_MAX + 20} value={draft.bio} onInput={(e) => set("bio", (e.target as HTMLTextAreaElement).value)} {...err("bio")} />
          {errors.bio && <small id="pf-err-bio" class="au-error">{errors.bio}</small>}
        </label>
        <p class="pf-muted pf-fine">Sem links, sem nome real, idade, escola, telefone ou endereço. Nunca compartilhe o seu login do jogo com ninguém.</p>
        <fieldset class="pf-choices">
          <legend>Quem pode ver o seu perfil</legend>
          {VISIBILITY_CHOICES.map((c) => (
            <label class="pf-choice" key={c.value}>
              <input type="radio" name="visibility" value={c.value} checked={draft.visibility === c.value} onChange={() => set("visibility", c.value)} />
              <span><strong>{c.label}</strong><br /><span class="pf-muted">{c.help}</span></span>
            </label>
          ))}
        </fieldset>
        <div class="au-actions">
          <button type="submit" class="btn btn-primary" disabled={busy}>{busy ? "Salvando…" : "Salvar perfil"}</button>
        </div>
        {status && <p class={status.ok ? "au-ok" : "au-error"} role={status.ok ? "status" : "alert"}>{status.text}</p>}
      </form>

      <Achievements client={client} userId={userId} list={achievements} onChanged={reload} />
      <Blocked client={client} />
      <AccountData client={client} download={download} navigate={navigate} />
    </div>
  );
}

function ImageSlot({ kind, client, userId, path, prepare, onChanged }: {
  kind: ImageKind; client: KoSupabase; userId: string; path: string | null; prepare: (f: Blob, k: ImageKind) => Promise<Blob>; onChanged: () => Promise<void>;
}) {
  const spec = IMAGE_KINDS[kind];
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const bad = checkInputImage(file);
    if (bad) {
      setMsg({ ok: false, text: bad });
      return;
    }
    setBusy(true);
    setMsg({ ok: true, text: "Redimensionando…" });
    try {
      const blob = await prepare(file, kind);
      const r = await replaceProfileImage(client, userId, kind, blob, path);
      setMsg(r.ok ? { ok: true, text: `Atualização concluída: ${spec.label.toLowerCase()}.` } : { ok: false, text: r.message });
      if (r.ok) await onChanged();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : String(err) });
    }
    setBusy(false);
  };
  const remove = async () => {
    setBusy(true);
    const r = await removeProfileImage(client, userId, kind, path);
    setBusy(false);
    setMsg(r.ok ? { ok: true, text: `Removido: ${spec.label.toLowerCase()}.` } : { ok: false, text: r.message });
    if (r.ok) await onChanged();
  };
  return (
    <div class="pf-slot">
      <label class="btn btn-secondary pf-file">
        {path ? `Trocar ${spec.label.toLowerCase()}` : `Adicionar ${spec.label.toLowerCase()}`}
        <input type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} onChange={pick} disabled={busy} data-image-input={kind} />
      </label>
      {path && <button type="button" class="btn btn-secondary" onClick={remove} disabled={busy}>Remover {spec.label.toLowerCase()}</button>}
      {msg && <p class={msg.ok ? "pf-muted" : "au-error"} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}
    </div>
  );
}

function Achievements({ client, userId, list, onChanged }: { client: KoSupabase; userId: string; list: AchievementRow[]; onChanged: () => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const site = new Set(list.filter((a) => a.source === "site").map((a) => a.code));
  const self = list.filter((a) => a.source === "self");
  const add = async (e: Event) => {
    e.preventDefault();
    const r = await addSelfAchievement(client, userId, title, detail, self.map((a) => a.code));
    if (!r.ok) {
      setMsg({ ok: false, text: r.message });
      return;
    }
    setTitle("");
    setDetail("");
    setMsg({ ok: true, text: "Adicionada. Ela aparece como \"Não verificada (autodeclarada)\"." });
    await onChanged();
  };
  return (
    <section class="pf-section pf-pad" aria-labelledby="pf-ach">
      <h2 id="pf-ach" class="pf-h">Conquistas</h2>
      <h3 class="pf-h3">Conquistadas no KingdomOps</h3>
      <ul class="pf-list">
        {SITE_ACHIEVEMENTS.map((a) => (
          <li key={a.code}>
            <span>{site.has(a.code) ? "✓ " : ""}{a.title}</span>
            <span class="pf-muted"> {site.has(a.code) ? "Conquistada" : a.how}</span>
          </li>
        ))}
      </ul>
      <div class="au-actions">
        <button type="button" class="btn btn-secondary" onClick={async () => { await claimSiteAchievements(client); await onChanged(); }}>Conferir de novo</button>
      </div>
      <h3 class="pf-h3">As suas (não verificadas)</h3>
      <p class="pf-muted pf-fine">O KingdomOps não consegue ler dados do jogo, então tudo o que você adicionar aqui aparece como "Não verificada (autodeclarada)".</p>
      {self.length > 0 && (
        <ul class="pf-list">
          {self.map((a) => (
            <li key={a.id}>
              <span>{a.title}{a.detail ? ` — ${a.detail}` : ""}</span>{" "}
              <button type="button" class="btn btn-secondary pf-small" onClick={async () => { await removeAchievement(client, a.id); await onChanged(); }} aria-label={`Remover ${a.title}`}>Remover</button>
            </li>
          ))}
        </ul>
      )}
      <form class="pf-form" onSubmit={add} noValidate>
        <label class="pf-field">
          <span>Conquista</span>
          <input name="ach_title" maxLength={ACHIEVEMENT_TITLE_MAX} placeholder="Cheguei à Prefeitura 25" value={title} onInput={(e) => setTitle((e.target as HTMLInputElement).value)} />
        </label>
        <label class="pf-field">
          <span>Detalhe (opcional)</span>
          <input name="ach_detail" maxLength={ACHIEVEMENT_DETAIL_MAX} value={detail} onInput={(e) => setDetail((e.target as HTMLInputElement).value)} />
        </label>
        <div class="au-actions"><button type="submit" class="btn btn-secondary">Adicionar conquista</button></div>
      </form>
      {msg && <p class={msg.ok ? "au-ok" : "au-error"} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}
    </section>
  );
}

function Blocked({ client }: { client: KoSupabase }) {
  const [ids, setIds] = useState<string[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const load = async () => {
    try {
      const list = await myBlocks(client);
      setIds(list);
      if (list.length > 0) {
        const { data } = await client.from("profiles").select("id, handle").in("id", list);
        setNames(Object.fromEntries(((data ?? []) as { id: string; handle: string | null }[]).filter((r) => r.handle).map((r) => [r.id, `@${r.handle}`])));
      }
    } catch {
      setIds([]);
    }
  };
  useEffect(() => { void load(); }, []);
  return (
    <section class="pf-section pf-pad" aria-labelledby="pf-blocked">
      <h2 id="pf-blocked" class="pf-h">Jogadores bloqueados</h2>
      {ids === null ? <p class="pf-muted">Carregando…</p> : ids.length === 0 ? <p class="pf-muted">Você não bloqueou ninguém. Bloqueie pela página de perfil de um jogador.</p> : (
        <ul class="pf-list">
          {ids.map((id) => (
            <li key={id}>
              <span>{names[id] ?? "Um jogador com o perfil oculto"}</span>{" "}
              <button type="button" class="btn btn-secondary pf-small" onClick={async () => { await unblockUser(client, id); await load(); }}>Desbloquear</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AccountData({ client, download, navigate }: { client: KoSupabase; download: (f: string, t: string) => void; navigate: (u: string) => void }) {
  const [confirm, setConfirm] = useState("");
  const [wipeDevice, setWipeDevice] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const doExport = async () => {
    setBusy(true);
    try {
      const data = await exportAccountData(client);
      download(accountExportFileName(new Date()), JSON.stringify(data, null, 2));
      setMsg({ ok: true, text: "Os dados da sua conta foram baixados." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    }
    setBusy(false);
  };
  const doDelete = async (e: Event) => {
    e.preventDefault();
    if (confirm.trim().toUpperCase() !== "APAGAR") {
      setMsg({ ok: false, text: "Digite APAGAR para confirmar." });
      return;
    }
    setBusy(true);
    const r = await deleteAccount(client);
    setBusy(false);
    if (!r.ok) {
      setMsg({ ok: false, text: r.message });
      return;
    }
    if (wipeDevice) {
      let local: Storage | null = null, session: Storage | null = null;
      try { local = window.localStorage; session = window.sessionStorage; } catch { /* blocked */ }
      clearAllKeys(local, session);
    }
    navigate("/?account=deleted");
  };
  return (
    <section class="pf-section pf-pad" aria-labelledby="pf-data">
      <h2 id="pf-data" class="pf-h">Os dados da sua conta</h2>
      <p>Baixe uma cópia de tudo o que a sua conta guarda (perfil, cidades, conquistas, bloqueios, denúncias que você fez, dados do aparelho enviados) ou apague a conta.</p>
      <div class="au-actions">
        <button type="button" class="btn btn-secondary" onClick={doExport} disabled={busy} data-export-account>Baixar os dados da minha conta</button>
      </div>
      <form class="pf-form pf-danger" onSubmit={doDelete} noValidate>
        <h3 class="pf-h3">Apagar conta</h3>
        <p>Apaga de vez do KingdomOps o seu perfil, foto, banner, cidades, conquistas, bloqueios e dados enviados. As denúncias que você fez ficam, sem o seu nome.</p>
        <label class="pf-field">
          <span>Digite APAGAR para confirmar</span>
          <input name="confirm_delete" autocomplete="off" value={confirm} onInput={(e) => setConfirm((e.target as HTMLInputElement).value)} />
        </label>
        <label class="pf-choice">
          <input type="checkbox" checked={wipeDevice} onChange={(e) => setWipeDevice((e.target as HTMLInputElement).checked)} />
          <span>Apagar também todos os dados do KingdomOps neste aparelho</span>
        </label>
        <div class="au-actions"><button type="submit" class="btn btn-primary" disabled={busy}>Apagar minha conta</button></div>
      </form>
      {msg && <p class={msg.ok ? "au-ok" : "au-error"} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}
    </section>
  );
}
