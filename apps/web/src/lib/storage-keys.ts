// Manifest of every ko:* key KingdomOps keeps in this browser (Q2 P1-1). "Back up everything",
// "Export", "Delete all data" and the /trust/ data list all read this one list, and a unit test
// (storage-keys.test.ts) fails when a "ko:" key literal appears in src/ without an entry here.
// Literal-only on purpose: no store imports, so any island can use it without pulling store code.

export type KeyArea = "local" | "session";

export interface StorageKeyInfo {
  key: string;
  area: KeyArea;
  /** Plain-language name shown to the user (Delete confirmation, backup, /trust/). */
  name: string;
  /** In the "Back up everything" file. Secrets and throwaway keys are not. */
  backup: boolean;
  /** Why it is left out of the backup, when it is. */
  note?: string;
}

export const STORAGE_KEYS: readonly StorageKeyInfo[] = [
  { key: "ko:v1", area: "local", name: "Profile & answers, saved accounts, routine ticks, commander checks and theme", backup: true },
  { key: "ko:card:v1", area: "local", name: "Governor card", backup: true },
  { key: "ko:crest:v1", area: "local", name: "Alliance crest", backup: true },
  { key: "ko:tools:v1", area: "local", name: "Tool inputs (calculators, shared inventory, checklists)", backup: true },
  { key: "ko:farms:v1", area: "local", name: "Farms & shipment log", backup: true },
  { key: "ko:kingdom:v1", area: "local", name: "Kingdom council documents (rules, requirements, MGE ledger, recruiting post, seed plans)", backup: true },
  { key: "ko:kingdom:webhook:v1", area: "local", name: "Discord webhook URL", backup: false, note: "A secret: anyone with it can post in that channel." },
  { key: "ko:farms:probe", area: "local", name: "Storage check (written and removed at once)", backup: false, note: "Throwaway." },
  { key: "ko:kingdom:probe", area: "local", name: "Storage check (written and removed at once)", backup: false, note: "Throwaway." },
  { key: "ko:sting", area: "session", name: "Logo animation already played (this tab only)", backup: false, note: "Throwaway." },
];

/** "ko:" strings that are DOM event names, not storage keys. */
export const KO_EVENT_NAMES: readonly string[] = ["ko:card-png", "ko:crest-export", "ko:guide-need-block"];

/** The service worker's Cache Storage names start with this (astro.config.mjs: `ko-<version>`). */
export const OFFLINE_CACHE_PREFIX = "ko-";

export const BACKUP_KEYS: readonly string[] = STORAGE_KEYS.filter((k) => k.backup).map((k) => k.key);

/** The keys a person would recognise as their data (no throwaway probes or session flags). */
export const USER_DATA_KEYS: readonly StorageKeyInfo[] = STORAGE_KEYS.filter((k) => k.note !== "Throwaway.");

type Removable = Pick<Storage, "getItem" | "removeItem" | "key" | "length">;

/**
 * Remove every manifest key, plus any other "ko:" key found in the storage (so nothing is left by a
 * key added later). Returns the keys that held something. Never throws.
 */
export function clearAllKeys(local: Removable | null, session: Removable | null): string[] {
  const removed: string[] = [];
  for (const [st, area] of [[local, "local"], [session, "session"]] as const) {
    if (!st) continue;
    try {
      const present = new Set<string>();
      for (let i = 0; i < st.length; i++) {
        const k = st.key(i);
        if (k && k.startsWith("ko:")) present.add(k);
      }
      for (const info of STORAGE_KEYS) if (info.area === area) present.add(info.key);
      for (const k of present) {
        const had = st.getItem(k) !== null;
        st.removeItem(k);
        if (had) removed.push(k);
      }
    } catch {
      // blocked storage: nothing to remove
    }
  }
  return removed;
}

/** Delete the service worker's offline copy and unregister it. Returns how many caches were removed. */
export async function clearOfflineCache(): Promise<number> {
  let n = 0;
  try {
    if (typeof caches !== "undefined") {
      for (const k of await caches.keys()) if (k.startsWith(OFFLINE_CACHE_PREFIX) && (await caches.delete(k))) n++;
    }
    if (typeof navigator !== "undefined" && navigator.serviceWorker) {
      for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    }
  } catch {
    // not available (private mode, old browser)
  }
  return n;
}
