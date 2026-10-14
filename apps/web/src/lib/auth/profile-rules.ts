// Rules for the community profile, mirrored from supabase/migrations so the form can say what is
// wrong before the database refuses it. No imports; used by islands and tests.
import type { ProfileVisibility, ReportReason, SiteAchievementCode } from "./database.types";

export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
/** Same rule as public.handle_is_reserved(): nothing that looks like the site, the game company or staff. */
const RESERVED_PART = /(lilith|kingdomops|official|admin|moderator|support|staff|system|riseofkingdoms)/;
const RESERVED_EXACT = new Set(["me", "u", "login", "logout", "auth", "null", "undefined", "root", "help", "guide", "guides", "api"]);
export const NAME_MAX = 40;
export const BIO_MAX = 280;
/** Links are not allowed in the bio or achievements (spam, and minors use the site). */
export const LINK_RE = /(https?:\/\/|www\.|discord\.gg|discord\.com\/invite)/i;
export const KINGDOM_MIN = 1;
export const KINGDOM_MAX = 99999;
export const ACHIEVEMENT_TITLE_MAX = 80;
export const ACHIEVEMENT_DETAIL_MAX = 200;
export const SELF_ACHIEVEMENTS_MAX = 30;
export const REPORT_DETAILS_MAX = 1000;

export function isReservedHandle(h: string): boolean {
  return RESERVED_PART.test(h) || RESERVED_EXACT.has(h);
}

export interface ProfileDraft {
  handle: string;
  displayName: string;
  bio: string;
  /** As typed; "" = none. */
  kingdom: string;
  visibility: ProfileVisibility;
}

export interface CleanProfile {
  handle: string | null;
  display_name: string | null;
  bio: string | null;
  kingdom_number: number | null;
  visibility: ProfileVisibility;
}

export type DraftErrors = Partial<Record<keyof ProfileDraft, string>>;

const CONTROL = /[\u0000-\u001f\u007f]/;

/** Check a draft; returns the row to save or the errors per field. */
export function validateProfile(d: ProfileDraft): { ok: true; value: CleanProfile } | { ok: false; errors: DraftErrors } {
  const errors: DraftErrors = {};
  const handle = d.handle.trim().toLowerCase().replace(/^@/, "");
  if (handle && !HANDLE_RE.test(handle)) errors.handle = "De 3 a 20 caracteres: só letras a–z, números e _.";
  else if (handle && isReservedHandle(handle)) errors.handle = "Este identificador é reservado. Escolha outro.";
  if (!handle && d.visibility !== "private") errors.handle = "Escolha um identificador antes de mostrar o seu perfil a outras pessoas.";
  const name = d.displayName.trim();
  if (name.length > NAME_MAX) errors.displayName = `No máximo ${NAME_MAX} caracteres.`;
  else if (CONTROL.test(name)) errors.displayName = "Remova os caracteres especiais.";
  const bio = d.bio.trim();
  if (bio.length > BIO_MAX) errors.bio = `No máximo ${BIO_MAX} caracteres.`;
  else if (LINK_RE.test(bio)) errors.bio = "Links não são permitidos na bio.";
  const k = d.kingdom.trim();
  let kingdom: number | null = null;
  if (k) {
    if (!/^\d{1,5}$/.test(k) || Number(k) < KINGDOM_MIN || Number(k) > KINGDOM_MAX) errors.kingdom = `Um número de reino de ${KINGDOM_MIN} a ${KINGDOM_MAX}.`;
    else kingdom = Number(k);
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { handle: handle || null, display_name: name || null, bio: bio || null, kingdom_number: kingdom, visibility: d.visibility },
  };
}

export function validateSelfAchievement(title: string, detail: string): string | null {
  const t = title.trim(), dd = detail.trim();
  if (!t) return "Digite o que você conquistou.";
  if (t.length > ACHIEVEMENT_TITLE_MAX) return `Título: no máximo ${ACHIEVEMENT_TITLE_MAX} caracteres.`;
  if (dd.length > ACHIEVEMENT_DETAIL_MAX) return `Detalhe: no máximo ${ACHIEVEMENT_DETAIL_MAX} caracteres.`;
  if (LINK_RE.test(t) || LINK_RE.test(dd)) return "Links não são permitidos.";
  if (CONTROL.test(t) || CONTROL.test(dd)) return "Remova os caracteres especiais.";
  return null;
}

/** Stable code for a self-declared achievement, from its title. */
export function achievementCode(title: string, taken: readonly string[]): string {
  const base = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "achievement";
  let code = base, i = 2;
  while (taken.includes(code)) code = `${base}-${i++}`.slice(0, 40);
  return code;
}

export const VISIBILITY_CHOICES: readonly { value: ProfileVisibility; label: string; help: string }[] = [
  { value: "private", label: "Só eu", help: "Ninguém mais pode abrir o seu perfil. Padrão." },
  { value: "members", label: "Jogadores conectados", help: "Jogadores conectados ao KingdomOps podem abri-lo com o seu link." },
  { value: "public", label: "Qualquer pessoa com o link", help: "Qualquer pessoa, conectada ou não, pode abri-lo com o seu link." },
];

export const REPORT_REASONS: readonly { value: ReportReason; label: string }[] = [
  { value: "minor_safety", label: "Uma criança pode estar em risco" },
  { value: "harassment", label: "Assédio ou bullying" },
  { value: "hate", label: "Ódio ou discriminação" },
  { value: "sexual", label: "Conteúdo sexual" },
  { value: "impersonation", label: "Finge ser outra pessoa (ou da equipe do KingdomOps / Lilith)" },
  { value: "spam", label: "Spam ou propaganda" },
  { value: "selling_or_cheating", label: "Venda de contas, bots ou trapaça" },
  { value: "other", label: "Outro motivo" },
];

/** Earned on the site and checked by the database (claim_site_achievement). */
export const SITE_ACHIEVEMENTS: readonly { code: SiteAchievementCode; title: string; how: string }[] = [
  { code: "onboarded", title: "Configurou uma cidade no KingdomOps", how: "Envie uma cidade com o nível da Prefeitura." },
  { code: "farm_keeper", title: "Planejou uma conta farm", how: "Tenha uma cidade farm na sua conta." },
  { code: "profile_complete", title: "Completou o perfil de comunidade", how: "Identificador, nome, bio e foto." },
  { code: "data_saved", title: "Salvou os dados do aparelho na conta", how: "Envie os dados deste aparelho uma vez." },
];

/** Image rules: the bucket limits in 20261013200006_storage.sql and the size the site resizes to. */
export const IMAGE_KINDS = {
  avatar: { bucket: "avatars", maxBytes: 512 * 1024, width: 256, height: 256, label: "Foto" },
  banner: { bucket: "banners", maxBytes: 1536 * 1024, width: 1500, height: 500, label: "Banner" },
} as const;
export type ImageKind = keyof typeof IMAGE_KINDS;
export const ACCEPTED_IMAGE_TYPES: readonly string[] = ["image/jpeg", "image/png", "image/webp"];
/** Biggest file the site will try to read before resizing (phone photos are 3–12 MB). */
export const MAX_INPUT_BYTES = 15 * 1024 * 1024;

/** Check the picked file before decoding it. */
export function checkInputImage(file: { type: string; size: number }): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "Use uma imagem JPEG, PNG ou WebP.";
  if (file.size > MAX_INPUT_BYTES) return "Essa imagem passa de 15 MB. Escolha uma menor.";
  if (file.size === 0) return "Esse arquivo está vazio.";
  return null;
}
