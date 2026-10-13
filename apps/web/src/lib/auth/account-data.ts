// LGPD rights for the account: a copy of everything the account holds (export) and deleting it.
// Both run with the player's own session; RLS returns only their rows.
import type { KoSupabase } from "./client";
import { dbError, currentUserId } from "./profile-api";
import { IMAGE_KINDS } from "./profile-rules";

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
  images: { bucket: string; path: string; url: string }[];
}

export async function exportAccountData(client: KoSupabase, now: Date = new Date()): Promise<AccountExport> {
  const { data: s } = await client.auth.getSession();
  const user = s.session?.user;
  if (!user) throw new Error("You are signed out. Sign in again to export.");
  const q = async (table: "profiles" | "accounts" | "achievements" | "blocks" | "reports" | "local_imports", col: string) => {
    const { data, error } = await client.from(table).select("*").eq(col, user.id);
    if (error) throw new Error(dbError(error));
    return (data ?? []) as unknown[];
  };
  const [profiles, accounts, achievements, blocks, reportsFiled, localImports] = await Promise.all([
    q("profiles", "id"), q("accounts", "user_id"), q("achievements", "user_id"), q("blocks", "blocker_id"), q("reports", "reporter_id"), q("local_imports", "user_id"),
  ]);
  const images: AccountExport["images"] = [];
  for (const kind of ["avatar", "banner"] as const) {
    const bucket = IMAGE_KINDS[kind].bucket;
    const { data } = await client.storage.from(bucket).list(user.id);
    for (const f of data ?? []) {
      const path = `${user.id}/${f.name}`;
      images.push({ bucket, path, url: client.storage.from(bucket).getPublicUrl(path).data.publicUrl });
    }
  }
  const providers = Array.isArray(user.app_metadata?.providers) ? (user.app_metadata.providers as string[]) : user.app_metadata?.provider ? [String(user.app_metadata.provider)] : [];
  return {
    app: ACCOUNT_EXPORT_APP, v: 1, exportedAt: now.toISOString(),
    user: { id: user.id, email: user.email ?? null, createdAt: user.created_at ?? null, providers },
    profile: profiles[0] ?? null, accounts, achievements, blocks, reportsFiled, localImports, images,
  };
}

export function accountExportFileName(d: Date): string {
  const p = (x: number) => String(x).padStart(2, "0");
  return `kingdomops-account-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

/**
 * Delete the account: the images first (Storage files do not cascade), then every row
 * (delete_my_account), then the session on this device. This device's local data is not touched
 * here; the page offers "Delete all data" for that separately.
 */
export async function deleteAccount(client: KoSupabase): Promise<{ ok: true } | { ok: false; message: string }> {
  const userId = await currentUserId(client);
  if (!userId) return { ok: false, message: "You are signed out. Sign in again to delete your account." };
  for (const kind of ["avatar", "banner"] as const) {
    const bucket = client.storage.from(IMAGE_KINDS[kind].bucket);
    const { data, error } = await bucket.list(userId);
    if (error) return { ok: false, message: dbError(error) };
    const paths = (data ?? []).map((f) => `${userId}/${f.name}`);
    if (paths.length > 0) {
      const rm = await bucket.remove(paths);
      if (rm.error) return { ok: false, message: dbError(rm.error) };
    }
  }
  const { error } = await client.rpc("delete_my_account");
  if (error) return { ok: false, message: dbError(error) };
  await client.auth.signOut({ scope: "local" }).catch(() => undefined);
  return { ok: true };
}
