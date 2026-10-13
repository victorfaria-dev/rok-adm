// LGPD rights for the account: a copy of everything the account holds (export) and deleting it.
// Both run with the player's own session; RLS returns only their rows.
import type { KoSupabase } from "./client";
import { dbError, currentUserId } from "./profile-api";

/** Buckets holding the player's files: public profile images and private verification screenshots. */
export const USER_BUCKETS = ["avatars", "banners", "verification"] as const;
type Bucket = (typeof USER_BUCKETS)[number];
const PUBLIC_BUCKETS: readonly Bucket[] = ["avatars", "banners"];

/** Every file under "<folder>/" in a bucket, one level of sub-folders deep (verification: <user>/<request>/<file>). */
export async function filesUnder(client: KoSupabase, bucket: Bucket, folder: string, depth = 1): Promise<string[]> {
  const { data, error } = await client.storage.from(bucket).list(folder);
  if (error) throw new Error(dbError(error));
  const out: string[] = [];
  for (const f of data ?? []) {
    const path = `${folder}/${f.name}`;
    if (f.id === null) {
      if (depth > 0) out.push(...(await filesUnder(client, bucket, path, depth - 1)));
    } else out.push(path);
  }
  return out;
}

export const ACCOUNT_EXPORT_APP = "kingdomops-account-export";

export interface AccountExport {
  app: typeof ACCOUNT_EXPORT_APP;
  v: 1;
  exportedAt: string;
  user: { id: string; email: string | null; createdAt: string | null; providers: string[] };
  profile: unknown;
  accounts: unknown[];
  achievements: unknown[];
  blocks: unknown[];
  reportsFiled: unknown[];
  localImports: unknown[];
  verificationRequests: unknown[];
  /** Public images get a URL; private verification screenshots are listed by path only. */
  images: { bucket: string; path: string; url: string | null }[];
}

type OwnTable = "profiles" | "accounts" | "achievements" | "blocks" | "reports" | "local_imports" | "verification_requests";

export async function exportAccountData(client: KoSupabase, now: Date = new Date()): Promise<AccountExport> {
  const { data: s } = await client.auth.getSession();
  const user = s.session?.user;
  if (!user) throw new Error("You are signed out. Sign in again to export.");
  const q = async (table: OwnTable, col: string) => {
    const { data, error } = await client.from(table).select("*").eq(col, user.id);
    if (error) throw new Error(dbError(error));
    return (data ?? []) as unknown[];
  };
  const [profiles, accounts, achievements, blocks, reportsFiled, localImports, verificationRequests] = await Promise.all([
    q("profiles", "id"), q("accounts", "user_id"), q("achievements", "user_id"), q("blocks", "blocker_id"), q("reports", "reporter_id"),
    q("local_imports", "user_id"), q("verification_requests", "user_id"),
  ]);
  const images: AccountExport["images"] = [];
  for (const bucket of USER_BUCKETS) {
    for (const path of await filesUnder(client, bucket, user.id)) {
      images.push({ bucket, path, url: PUBLIC_BUCKETS.includes(bucket) ? client.storage.from(bucket).getPublicUrl(path).data.publicUrl : null });
    }
  }
  const providers = Array.isArray(user.app_metadata?.providers) ? (user.app_metadata.providers as string[]) : user.app_metadata?.provider ? [String(user.app_metadata.provider)] : [];
  return {
    app: ACCOUNT_EXPORT_APP, v: 1, exportedAt: now.toISOString(),
    user: { id: user.id, email: user.email ?? null, createdAt: user.created_at ?? null, providers },
    profile: profiles[0] ?? null, accounts, achievements, blocks, reportsFiled, localImports, verificationRequests, images,
  };
}

export function accountExportFileName(d: Date): string {
  const p = (x: number) => String(x).padStart(2, "0");
  return `kingdomops-account-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

/**
 * Delete the account: images and verification screenshots first (Storage files do not cascade),
 * then every row (delete_my_account), then the session on this device. This device's local data is
 * not touched here; the page offers "Delete all data" for that separately.
 */
export async function deleteAccount(client: KoSupabase): Promise<{ ok: true } | { ok: false; message: string }> {
  const userId = await currentUserId(client);
  if (!userId) return { ok: false, message: "You are signed out. Sign in again to delete your account." };
  for (const bucket of USER_BUCKETS) {
    let paths: string[];
    try {
      paths = await filesUnder(client, bucket, userId);
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) };
    }
    if (paths.length > 0) {
      const rm = await client.storage.from(bucket).remove(paths);
      if (rm.error) return { ok: false, message: dbError(rm.error) };
    }
  }
  const { error } = await client.rpc("delete_my_account");
  if (error) return { ok: false, message: dbError(error) };
  await client.auth.signOut({ scope: "local" }).catch(() => undefined);
  return { ok: true };
}
