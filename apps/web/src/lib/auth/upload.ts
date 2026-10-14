// First-login upload: offer to copy this device's data (the ko:* store) to the new account.
// No silent data loss, in both directions:
//  - nothing is uploaded without a yes, and the device data is never deleted by the upload;
//  - the whole "Back up everything" file goes up as-is (local_imports), so even data without a
//    table yet (routine ticks, tools, council documents) is kept on the account;
//  - cities become rows in `accounts` (saved accounts from /me and farms from /farms).
// The choice is remembered per user and per data fingerprint: if the device data changes later,
// the offer comes back.
import { decodeProfile } from "@rokadm/core";
import { BACKUP_SECTIONS, buildBackup, type BackupFile } from "../backup";
import { FARMS_KEY, parseFarmsStore } from "../farms-store";
import { STORE_KEY, parseStore } from "../store";
import type { KoSupabase } from "./client";
import type { CityKind, Database, Json } from "./database.types";
import { dbError, currentUserId } from "./profile-api";
import { LOCAL_ID_ACTIVE, localIdForFarm, localIdForSavedProfile } from "./account-banners";

export const UPLOAD_CHOICES_KEY = "ko:auth:upload:v1";

type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];
type StorageLike = Pick<Storage, "getItem" | "setItem">;

export interface UploadPlan {
  backup: BackupFile;
  /** One line per local store that has something, e.g. "Farms & shipment log: 2 farms, 14 shipments". */
  summary: { label: string; detail: string }[];
  accounts: AccountInsert[];
  fingerprint: string;
}

/** FNV-1a 32-bit, hex: enough to notice that the device data changed. */
export function fingerprint(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

const clip = (s: string, n: number): string => (s.length > n ? s.slice(0, n) : s);

/** Cities from the device: saved accounts (/me) and farms (/farms). One main at most. */
export function accountsFromDevice(st: StorageLike | null): AccountInsert[] {
  const read = (k: string): string | null => {
    try {
      return st?.getItem(k) ?? null;
    } catch {
      return null;
    }
  };
  const store = parseStore(read(STORE_KEY));
  const farms = parseFarmsStore(read(FARMS_KEY));
  const out: AccountInsert[] = [];
  const saved = store.savedProfiles.length > 0
    ? store.savedProfiles.map((p) => ({ localId: localIdForSavedProfile(p.id), name: p.name, code: p.code }))
    : store.profileCode
      ? [{ localId: LOCAL_ID_ACTIVE, name: "Principal", code: store.profileCode }]
      : [];
  // The active profile is the main city when it is not a farm; otherwise the first non-farm one.
  const decoded = saved.map((s) => {
    const r = decodeProfile(s.code);
    return { ...s, profile: "profile" in r ? r.profile : null };
  });
  const mainIdx = (() => {
    const active = decoded.findIndex((d) => d.code === store.profileCode && d.profile?.role !== "farm");
    return active >= 0 ? active : decoded.findIndex((d) => d.profile?.role !== "farm");
  })();
  decoded.forEach((d, i) => {
    const kind: CityKind = i === mainIdx ? "main" : d.profile?.role === "farm" ? "farm" : "alt";
    out.push({
      kind, name: clip(d.name.trim() || "Cidade", 40), local_id: d.localId, profile_code: d.code,
      city_hall: d.profile?.cityHall ?? null, kingdom_stage: d.profile?.kingdomStage ?? null, spending: d.profile?.spending ?? null,
      // Commander checklists are per device today; they belong to the main city until per-city lists exist.
      commanders: (i === mainIdx ? store.commanders : {}) as Json,
      sort_order: i,
    });
  });
  farms.farms.forEach((f, i) => {
    out.push({
      kind: "farm", name: clip(f.name, 40), local_id: localIdForFarm(f.id), city_hall: f.levels.cityHall ?? null,
      commanders: {} as Json, sort_order: decoded.length + i,
    });
  });
  return out;
}

/** What this device would upload, or null when it holds nothing worth offering. */
export function planUpload(st: StorageLike | null, now: Date = new Date()): UploadPlan | null {
  const backup = buildBackup(st, now);
  const summary = BACKUP_SECTIONS.filter((s) => Object.hasOwn(backup.keys, s.key)).map((s) => ({ label: s.label, detail: s.describe(backup.keys[s.key]) }));
  const accounts = accountsFromDevice(st);
  // A store that only holds the default theme is not "data" worth an offer.
  const store = backup.keys[STORE_KEY] as ReturnType<typeof parseStore> | undefined;
  const onlyTheme = Object.keys(backup.keys).length === 1 && store !== undefined && !store.profileCode && !store.draft && !store.routine
    && store.savedProfiles.length === 0 && Object.keys(store.commanders).length === 0;
  if (summary.length === 0 || onlyTheme) return null;
  return { backup, summary, accounts, fingerprint: fingerprint(JSON.stringify(backup.keys)) };
}

export type UploadStatus = "uploaded" | "kept_local";
interface Choice {
  status: UploadStatus;
  fingerprint: string;
  at: string;
}

function readChoices(st: StorageLike | null): Record<string, Choice> {
  try {
    const raw = st?.getItem(UPLOAD_CHOICES_KEY);
    const data: unknown = raw ? JSON.parse(raw) : {};
    return typeof data === "object" && data !== null && !Array.isArray(data) ? (data as Record<string, Choice>) : {};
  } catch {
    return {};
  }
}

export function rememberChoice(st: StorageLike | null, userId: string, status: UploadStatus, fp: string, now: Date = new Date()): void {
  const all = readChoices(st);
  all[userId] = { status, fingerprint: fp, at: now.toISOString() };
  try {
    st?.setItem(UPLOAD_CHOICES_KEY, JSON.stringify(all));
  } catch {
    // blocked: the offer simply comes back next time
  }
}

/** The plan to offer this user now, or null (nothing on the device, or already decided for this data). */
export function pendingOffer(st: StorageLike | null, userId: string): UploadPlan | null {
  const plan = planUpload(st);
  if (!plan) return null;
  const c = readChoices(st)[userId];
  return c && c.fingerprint === plan.fingerprint ? null : plan;
}

/** "Chrome on Android" style label, from the user agent; nothing identifying. */
export function deviceLabel(ua: string): string {
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Navegador";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "um aparelho";
  return `${browser} no ${os}`;
}

/**
 * Upload: the whole backup first (so nothing is lost even if a city row fails), then the cities
 * (upsert by device id, so a second upload updates instead of duplicating). Device data stays.
 */
export async function performUpload(client: KoSupabase, plan: UploadPlan, label: string): Promise<{ ok: true; cities: number } | { ok: false; message: string }> {
  const userId = await currentUserId(client);
  if (!userId) return { ok: false, message: "Você saiu da conta. Entre de novo para enviar." };
  const imp = await client.from("local_imports").insert({ user_id: userId, device_label: label.slice(0, 80), payload: plan.backup as unknown as Json });
  if (imp.error) return { ok: false, message: dbError(imp.error) };
  if (plan.accounts.length === 0) return { ok: true, cities: 0 };
  // The database allows one main city: if the account already has one from another device, upload this one as an alt.
  const existing = await client.from("accounts").select("id, kind, local_id");
  if (existing.error) return { ok: false, message: `Seus dados foram salvos, mas as cidades não: ${dbError(existing.error)}` };
  const rows = (existing.data ?? []) as { kind: CityKind; local_id: string | null }[];
  const otherMain = rows.some((r) => r.kind === "main" && !plan.accounts.some((a) => a.local_id === r.local_id));
  const accounts = plan.accounts.map((a) => ({ ...a, user_id: userId, kind: a.kind === "main" && otherMain ? ("alt" as const) : a.kind }));
  const up = await client.from("accounts").upsert(accounts, { onConflict: "user_id,local_id" });
  if (up.error) return { ok: false, message: `Seus dados foram salvos, mas as cidades não: ${dbError(up.error)}` };
  return { ok: true, cities: accounts.length };
}
