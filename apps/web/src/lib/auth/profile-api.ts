// Profile, achievements, report and block calls. Each takes the client so tests use a fake.
// What a viewer may see is decided by RLS (supabase/migrations); these calls never widen it.
import type { KoSupabase } from "./client";
import type { AchievementRow, ProfileRow, ReportReason, SiteAchievementCode } from "./database.types";
import { friendlyError, type ActionResult } from "./actions";
import { IMAGE_KINDS, REPORT_DETAILS_MAX, SITE_ACHIEVEMENTS, achievementCode, validateSelfAchievement, type CleanProfile, type ImageKind } from "./profile-rules";
import { extensionOf } from "./image";

export const PROFILE_COLUMNS = "id, handle, display_name, bio, kingdom_number, avatar_path, banner_path, visibility, created_at, updated_at";
export const ACHIEVEMENT_COLUMNS = "id, user_id, source, code, title, detail, verified, earned_at";

export interface ProfileBundle {
  profile: ProfileRow;
  achievements: AchievementRow[];
}

/** Database errors in words a player can act on. */
export function dbError(e: unknown): string {
  const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "";
  const msg = typeof e === "object" && e !== null && "message" in e ? String((e as { message: unknown }).message) : "";
  if (code === "23505" && /handle/i.test(msg)) return "That handle is taken. Pick another.";
  if (code === "23505") return "You already did that.";
  if (/reserved/i.test(msg)) return "This handle is reserved. Pick another.";
  if (/Too many/i.test(msg)) return msg;
  if (code === "23514") return "Some of that is not allowed (length, links or characters). Check the fields.";
  if (code === "42501") return "You are not allowed to do that. Sign in again and retry.";
  return friendlyError(e);
}

/** The signed-in user's id from the local session (no network), or null. */
export async function currentUserId(client: KoSupabase): Promise<string | null> {
  try {
    const { data } = await client.auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}

/** A profile by handle, with achievements; null when it does not exist or the viewer may not see it. */
export async function getProfileByHandle(client: KoSupabase, handle: string): Promise<ProfileBundle | null> {
  const { data, error } = await client.from("profiles").select(PROFILE_COLUMNS).eq("handle", handle.toLowerCase()).maybeSingle();
  if (error) throw new Error(dbError(error));
  if (!data) return null;
  const profile = data as ProfileRow;
  const ach = await client.from("achievements").select(ACHIEVEMENT_COLUMNS).eq("user_id", profile.id).order("earned_at", { ascending: true });
  if (ach.error) throw new Error(dbError(ach.error));
  return { profile, achievements: sortAchievements((ach.data ?? []) as AchievementRow[]) };
}

export async function getMyProfile(client: KoSupabase, userId: string): Promise<ProfileBundle | null> {
  const { data, error } = await client.from("profiles").select(PROFILE_COLUMNS).eq("id", userId).maybeSingle();
  if (error) throw new Error(dbError(error));
  if (!data) return null;
  const ach = await client.from("achievements").select(ACHIEVEMENT_COLUMNS).eq("user_id", userId).order("earned_at", { ascending: true });
  if (ach.error) throw new Error(dbError(ach.error));
  return { profile: data as ProfileRow, achievements: sortAchievements((ach.data ?? []) as AchievementRow[]) };
}

/** Site-earned first, then self-declared; oldest first inside each group. */
export function sortAchievements(list: readonly AchievementRow[]): AchievementRow[] {
  return [...list].sort((a, b) => (a.source === b.source ? a.earned_at.localeCompare(b.earned_at) : a.source === "site" ? -1 : 1));
}

export async function saveMyProfile(client: KoSupabase, userId: string, value: CleanProfile): Promise<ActionResult> {
  // upsert: the sign-up trigger normally creates the row, but a project set up before the trigger has none.
  const { error } = await client.from("profiles").upsert({ id: userId, ...value }, { onConflict: "id" });
  return error ? { ok: false, message: dbError(error) } : { ok: true };
}

export function publicImageUrl(client: KoSupabase, kind: ImageKind, path: string | null): string | null {
  if (!path) return null;
  return client.storage.from(IMAGE_KINDS[kind].bucket).getPublicUrl(path).data.publicUrl;
}

/**
 * Upload a prepared image (lib/auth/image.ts) to the owner's folder, point the profile at it and
 * remove the previous file. New name per upload so caches never show the old picture.
 */
export async function replaceProfileImage(
  client: KoSupabase, userId: string, kind: ImageKind, blob: Blob, previousPath: string | null, now: number = Date.now(),
): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  const spec = IMAGE_KINDS[kind];
  if (blob.size > spec.maxBytes) return { ok: false, message: `${spec.label} is over the ${Math.round(spec.maxBytes / 1024)} KB limit.` };
  const path = `${userId}/${kind}-${now}.${extensionOf(blob.type)}`;
  const bucket = client.storage.from(spec.bucket);
  const up = await bucket.upload(path, blob, { contentType: blob.type, upsert: false, cacheControl: "31536000" });
  if (up.error) return { ok: false, message: dbError(up.error) };
  const { error } = await client.from("profiles").update(kind === "avatar" ? { avatar_path: path } : { banner_path: path }).eq("id", userId);
  if (error) {
    await bucket.remove([path]);
    return { ok: false, message: dbError(error) };
  }
  if (previousPath && previousPath !== path) await bucket.remove([previousPath]);
  return { ok: true, path };
}

export async function removeProfileImage(client: KoSupabase, userId: string, kind: ImageKind, path: string | null): Promise<ActionResult> {
  const { error } = await client.from("profiles").update(kind === "avatar" ? { avatar_path: null } : { banner_path: null }).eq("id", userId);
  if (error) return { ok: false, message: dbError(error) };
  if (path) await client.storage.from(IMAGE_KINDS[kind].bucket).remove([path]);
  return { ok: true };
}

export async function addSelfAchievement(client: KoSupabase, userId: string, title: string, detail: string, taken: readonly string[]): Promise<ActionResult> {
  const err = validateSelfAchievement(title, detail);
  if (err) return { ok: false, message: err };
  const { error } = await client.from("achievements").insert({
    user_id: userId, source: "self", code: achievementCode(title, taken), title: title.trim(), detail: detail.trim() || null, verified: false,
  });
  return error ? { ok: false, message: dbError(error) } : { ok: true };
}

export async function removeAchievement(client: KoSupabase, id: string): Promise<ActionResult> {
  const { error } = await client.from("achievements").delete().eq("id", id);
  return error ? { ok: false, message: dbError(error) } : { ok: true };
}

/** Ask the database for every site achievement it can check; returns the codes the player has. */
export async function claimSiteAchievements(client: KoSupabase): Promise<SiteAchievementCode[]> {
  const got: SiteAchievementCode[] = [];
  for (const a of SITE_ACHIEVEMENTS) {
    try {
      const { data, error } = await client.rpc("claim_site_achievement", { p_code: a.code });
      if (!error && data === true) got.push(a.code);
    } catch {
      // offline: try again next time
    }
  }
  return got;
}

export async function reportUser(client: KoSupabase, targetId: string, reason: ReportReason, details: string): Promise<ActionResult> {
  const text = details.trim().slice(0, REPORT_DETAILS_MAX);
  const { error } = await client.from("reports").insert({ target_id: targetId, reason, details: text || null });
  if (error && (error as { code?: string }).code === "23505") return { ok: false, message: "You already reported this profile. We will review it." };
  return error ? { ok: false, message: dbError(error) } : { ok: true };
}

export async function blockUser(client: KoSupabase, targetId: string): Promise<ActionResult> {
  const { error } = await client.from("blocks").insert({ blocked_id: targetId });
  if (error && (error as { code?: string }).code === "23505") return { ok: true };
  return error ? { ok: false, message: dbError(error) } : { ok: true };
}

export async function unblockUser(client: KoSupabase, targetId: string): Promise<ActionResult> {
  const { error } = await client.from("blocks").delete().eq("blocked_id", targetId);
  return error ? { ok: false, message: dbError(error) } : { ok: true };
}

/** Ids this user blocked (RLS: only the blocker reads them). */
export async function myBlocks(client: KoSupabase): Promise<string[]> {
  const { data, error } = await client.from("blocks").select("blocked_id");
  if (error) throw new Error(dbError(error));
  return ((data ?? []) as { blocked_id: string }[]).map((r) => r.blocked_id);
}
