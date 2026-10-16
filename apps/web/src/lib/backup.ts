// "Backup everything" (wave G, /me/): one versioned JSON file with every ko:* key this app keeps in
// localStorage, each checked with that store's own tolerant parser on export and on import.
// The Discord webhook (a secret) and probe/session keys are never in the file.
import { CARD_KEY, parseCard } from "./card";
import { CREST_KEY, parseCrest } from "./crest";
import { FARMS_KEY, parseFarmsStore } from "./farms-store";
import { KINGDOM_KEY, parseKingdomStore } from "./kingdom-store";
import { STORE_KEY, parseStore } from "./store";
import { TOOLS_KEY, parseToolsStore } from "./tools-store";
import { STORAGE_KEYS } from "./storage-keys";

/** The manifest name of a key (lib/storage-keys.ts), so backup, delete and /trust/ use the same words. */
const nameOf = (key: string): string => STORAGE_KEYS.find((k) => k.key === key)?.name ?? key;

export const BACKUP_APP = "kingdomops-backup";
export const BACKUP_VERSION = 1;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

interface Section {
  key: string;
  label: string;
  /** The store's tolerant parser; null = nothing usable. */
  parse: (raw: string) => unknown | null;
  /** Short description of what is inside, e.g. "2 farms, 14 shipments". */
  describe: (v: unknown) => string;
}

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const n = (count: number, one: string, many = `${one}s`): string => `${count} ${count === 1 ? one : many}`;
const THEME_WORD: Record<string, string> = { dark: "tema escuro", light: "tema claro", system: "tema do sistema" };
/** Parsers fall back to defaults on garbage; a section only counts when the raw value is a v1 object. */
const v1 = (raw: string): boolean => {
  try {
    const d: unknown = JSON.parse(raw);
    return isRecord(d) && d.v === 1;
  } catch {
    return false;
  }
};
const guard = (p: (raw: string) => unknown) => (raw: string): unknown | null => (v1(raw) ? p(raw) : null);

export const BACKUP_SECTIONS: readonly Section[] = [
  {
    key: STORE_KEY, label: nameOf(STORE_KEY), parse: guard(parseStore),
    describe: (v) => {
      const s = v as ReturnType<typeof parseStore>;
      return [s.profileCode ? "perfil" : "sem perfil", n(s.savedProfiles.length, "conta salva", "contas salvas"), n(Object.keys(s.commanders).length, "lista de comandantes", "listas de comandantes"), THEME_WORD[s.theme] ?? s.theme].join(", ");
    },
  },
  {
    key: CARD_KEY, label: nameOf(CARD_KEY), parse: guard(parseCard),
    describe: (v) => {
      const c = v as ReturnType<typeof parseCard>;
      return c.name ? `${c.name}${c.tag ? ` [${c.tag}]` : ""}` : "sem nome ainda";
    },
  },
  {
    key: CREST_KEY, label: nameOf(CREST_KEY), parse: (raw) => parseCrest(raw),
    describe: (v) => {
      const c = v as NonNullable<ReturnType<typeof parseCrest>>;
      return `escudo ${c.shape}, ${c.emblem}${c.tag ? `, [${c.tag}]` : ""}`;
    },
  },
  {
    key: TOOLS_KEY, label: nameOf(TOOLS_KEY), parse: guard(parseToolsStore),
    describe: (v) => {
      const t = v as ReturnType<typeof parseToolsStore>;
      return [n(Object.keys(t.inputs).length, "calculadora", "calculadoras"), n(Object.keys(t.inventory).length, "valor de inventário", "valores de inventário"), n(Object.keys(t.checks).length, "checklist", "checklists")].join(", ");
    },
  },
  {
    key: FARMS_KEY, label: nameOf(FARMS_KEY), parse: guard(parseFarmsStore),
    describe: (v) => {
      const f = v as ReturnType<typeof parseFarmsStore>;
      return `${n(f.farms.length, "farm", "farms")}, ${n(f.shipments.length, "envio", "envios")}`;
    },
  },
  {
    key: KINGDOM_KEY, label: nameOf(KINGDOM_KEY), parse: guard(parseKingdomStore),
    describe: (v) => n((v as ReturnType<typeof parseKingdomStore>).docs.length, "documento", "documentos"),
  },
];

export interface BackupFile {
  app: typeof BACKUP_APP;
  v: typeof BACKUP_VERSION;
  exportedAt: string;
  /** Storage key → that store's parsed value. */
  keys: Record<string, unknown>;
}

function readRaw(st: StorageLike | null, key: string): string | null {
  try {
    return st?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Every known key that holds something usable, cleaned by its own parser. */
export function buildBackup(st: StorageLike | null, now: Date = new Date()): BackupFile {
  const keys: Record<string, unknown> = {};
  for (const s of BACKUP_SECTIONS) {
    const raw = readRaw(st, s.key);
    const v = raw ? s.parse(raw) : null;
    if (v !== null) keys[s.key] = v;
  }
  return { app: BACKUP_APP, v: BACKUP_VERSION, exportedAt: now.toISOString(), keys };
}

export function backupText(b: BackupFile): string {
  return JSON.stringify(b, null, 2);
}

export function backupFileName(d: Date): string {
  const p = (x: number) => String(x).padStart(2, "0");
  return `kingdomops-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

export type Change = "add" | "replace" | "same" | "invalid";

export interface PlanRow {
  key: string;
  label: string;
  change: Change;
  /** What the device has now, or null. */
  now: string | null;
  /** What the file has, or null when invalid. */
  incoming: string | null;
}

export interface RestorePlan {
  exportedAt: string | null;
  rows: PlanRow[];
  /** Keys in the file this app does not know (ignored). */
  unknown: string[];
  /** Cleaned values to write, by key (only add/replace rows). */
  writes: Record<string, string>;
}

const NOT_BACKUP = "Este arquivo não é um backup do KingdomOps. Escolha o arquivo kingdomops-backup-….json feito com \"Fazer backup de tudo\".";

/**
 * Read a backup file and compare it with this device. Nothing is written. Sections missing from the
 * file are left alone; a section that fails its parser is reported and skipped. Throws with a message
 * the user can act on when the file itself is not a readable backup.
 */
export function planRestore(text: string, st: StorageLike | null): RestorePlan {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(NOT_BACKUP);
  }
  if (!isRecord(data) || data.app !== BACKUP_APP || !isRecord(data.keys)) throw new Error(NOT_BACKUP);
  if (data.v !== BACKUP_VERSION) throw new Error("Este backup foi feito por uma versão mais nova do KingdomOps. Atualize a página (recarregue) e tente de novo.");
  const rows: PlanRow[] = [];
  const writes: Record<string, string> = {};
  for (const s of BACKUP_SECTIONS) {
    if (!Object.hasOwn(data.keys, s.key)) continue;
    const incomingRaw = JSON.stringify(data.keys[s.key]);
    const incoming = incomingRaw === undefined ? null : s.parse(incomingRaw);
    const currentRaw = readRaw(st, s.key);
    const current = currentRaw ? s.parse(currentRaw) : null;
    const nowText = current !== null ? s.describe(current) : null;
    if (incoming === null) {
      rows.push({ key: s.key, label: s.label, change: "invalid", now: nowText, incoming: null });
      continue;
    }
    const clean = JSON.stringify(incoming);
    const change: Change = current === null ? "add" : JSON.stringify(current) === clean ? "same" : "replace";
    rows.push({ key: s.key, label: s.label, change, now: nowText, incoming: s.describe(incoming) });
    if (change === "add" || change === "replace") writes[s.key] = clean;
  }
  const known = new Set(BACKUP_SECTIONS.map((s) => s.key));
  const unknown = Object.keys(data.keys).filter((k) => !known.has(k));
  const exportedAt = typeof data.exportedAt === "string" && Number.isFinite(Date.parse(data.exportedAt)) ? data.exportedAt : null;
  return { exportedAt, rows, unknown, writes };
}

/** Write the planned sections. Returns how many were written (0 when storage is blocked). */
export function applyRestore(plan: RestorePlan, st: StorageLike | null): number {
  let done = 0;
  for (const [k, v] of Object.entries(plan.writes)) {
    try {
      st?.setItem(k, v);
      if (st) done++;
    } catch {
      // quota or blocked: report fewer
    }
  }
  return done;
}
