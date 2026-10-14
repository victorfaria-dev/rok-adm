// Per-city banners on the account (schema: 20261013200008_account_banners.sql). Not the profile
// banner. Default = static file by account type; a custom upload replaces it.
//
// Local custom banners (before sign-in) are owned by the City Hall track behind getBanner/setBanner.
// At first sign-in they are uploaded with the rest of the device data: that track plugs its store
// into `loadLocalBanners` below, keyed by the same ids the upload uses for cities
// (localIdForSavedProfile / localIdForFarm).
import type { KoSupabase } from "./client";
import type { CityKind } from "./database.types";
import { encodeToFit, extensionOf } from "./image";
import { dbError } from "./profile-api";

export const ACCOUNT_BANNER = { bucket: "account_banners", maxBytes: 1024 * 1024, maxSide: 1280 } as const;

/** Static default: main and alt use the main banner, farms the farm banner. */
export function defaultBannerSrc(kind: CityKind, width: 640 | 1280 = 1280): string {
  return `/banners/${kind === "farm" ? "farm" : "main"}-${width}.webp`;
}

/** accounts.local_id of a saved account from /me (lib/store.ts SavedProfile.id). */
export const localIdForSavedProfile = (savedProfileId: string): string => `profile:${savedProfileId}`;
/** accounts.local_id of a farm from /farms (lib/farms-store.ts Farm.id). */
export const localIdForFarm = (farmId: string): string => `farm:${farmId}`;
/** accounts.local_id when the device has only the active profile and no saved accounts. */
export const LOCAL_ID_ACTIVE = "profile:active";

export interface LocalBanner {
  /** Same as accounts.local_id: localIdForSavedProfile(...), localIdForFarm(...) or LOCAL_ID_ACTIVE. */
  localId: string;
  blob: Blob;
}

/**
 * Wire point for the City Hall track: return the device's custom city banners (not the defaults).
 * Until it is wired, there is nothing to migrate.
 */
export const loadLocalBanners = async (): Promise<LocalBanner[]> => [];

/** Browser only: scale down to 1280 px on the long side, re-encode (drops metadata), ≤ 1 MB. */
export async function prepareAccountBanner(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const s = Math.min(1, ACCOUNT_BANNER.maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * s));
    canvas.height = Math.max(1, Math.round(bitmap.height * s));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser cannot resize images.");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await encodeToFit((type, q) => new Promise((res) => canvas.toBlob(res, type, q)), ACCOUNT_BANNER.maxBytes);
    if (!blob) throw new Error("This banner is too big even after resizing.");
    return blob;
  } finally {
    bitmap.close();
  }
}

/** Upload a prepared banner for one city, point the city at it, remove the previous file. */
export async function setAccountBanner(
  client: KoSupabase, userId: string, accountId: string, blob: Blob, previousPath: string | null, now: number = Date.now(),
): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  if (blob.size > ACCOUNT_BANNER.maxBytes) return { ok: false, message: "Banner is over the 1 MB limit." };
  const path = `${userId}/${accountId}-${now}.${extensionOf(blob.type)}`;
  const bucket = client.storage.from(ACCOUNT_BANNER.bucket);
  const up = await bucket.upload(path, blob, { contentType: blob.type, upsert: false, cacheControl: "31536000" });
  if (up.error) return { ok: false, message: dbError(up.error) };
  const { error } = await client.from("accounts").update({ banner_path: path }).eq("id", accountId);
  if (error) {
    await bucket.remove([path]);
    return { ok: false, message: dbError(error) };
  }
  if (previousPath && previousPath !== path) await bucket.remove([previousPath]);
  return { ok: true, path };
}

/** Back to the default banner. */
export async function removeAccountBanner(client: KoSupabase, accountId: string, path: string | null): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await client.from("accounts").update({ banner_path: null }).eq("id", accountId);
  if (error) return { ok: false, message: dbError(error) };
  if (path) await client.storage.from(ACCOUNT_BANNER.bucket).remove([path]);
  return { ok: true };
}

/** A short-lived URL for a custom banner (the bucket is private), or the static default. */
export async function accountBannerSrc(client: KoSupabase | null, kind: CityKind, path: string | null, width: 640 | 1280 = 1280): Promise<string> {
  if (!client || !path) return defaultBannerSrc(kind, width);
  const { data, error } = await client.storage.from(ACCOUNT_BANNER.bucket).createSignedUrl(path, 3600);
  return error || !data?.signedUrl ? defaultBannerSrc(kind, width) : data.signedUrl;
}

/**
 * First sign-in: upload the device's custom banners onto the cities that were just uploaded
 * (matched by local_id). A banner whose city is not in the account is skipped and counted.
 */
export async function uploadLocalBanners(
  client: KoSupabase, userId: string, banners: readonly LocalBanner[], prepare: (b: Blob) => Promise<Blob> = prepareAccountBanner,
): Promise<{ uploaded: number; skipped: number; failed: string[] }> {
  const result = { uploaded: 0, skipped: 0, failed: [] as string[] };
  if (banners.length === 0) return result;
  const { data, error } = await client.from("accounts").select("id, local_id, banner_path");
  if (error) return { ...result, failed: [dbError(error)] };
  const byLocal = new Map(((data ?? []) as { id: string; local_id: string | null; banner_path: string | null }[]).filter((r) => r.local_id).map((r) => [r.local_id!, r]));
  for (const b of banners) {
    const city = byLocal.get(b.localId);
    if (!city) {
      result.skipped++;
      continue;
    }
    try {
      const r = await setAccountBanner(client, userId, city.id, await prepare(b.blob), city.banner_path);
      if (r.ok) result.uploaded++;
      else result.failed.push(r.message);
    } catch (e) {
      result.failed.push(e instanceof Error ? e.message : String(e));
    }
  }
  return result;
}
