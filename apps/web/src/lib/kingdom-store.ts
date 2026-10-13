// Council kit device-local state (wave E): its own versioned localStorage key, separate from ko:v1.
// The store is a list of plain JSON documents { id, kind, title, updatedAt, data } so a later
// backend (wave F) can sync each one as-is. This module only checks the envelope; each tool parses
// its own `data` tolerantly (lib/kingdom-<tool>.ts). Every read is tolerant: missing, corrupted or
// blocked storage falls back to defaults, and one malformed document is dropped on its own.

export const KINGDOM_KEY = "ko:kingdom:v1";
export const KINGDOM_EXPORT_APP = "kingdomops-kingdom";
/** Kinds of document the council kit stores. Unknown kinds in storage or imports are dropped. */
export const KINGDOM_KINDS = ["rules", "requirements", "my-requirements", "mge", "recruit", "seed"] as const;
export type KingdomDocKind = (typeof KINGDOM_KINDS)[number];
export const MAX_DOCS_PER_KIND = 20;
export const DOC_TITLE_MAX = 80;
/** Largest serialized `data` kept per document (characters). */
export const MAX_DOC_CHARS = 120_000;

export interface StoredDoc {
  id: string;
  kind: KingdomDocKind;
  title: string;
  /** ISO time of the last edit. */
  updatedAt: string;
  data: unknown;
}

export interface KingdomStoreV1 {
  v: 1;
  docs: StoredDoc[];
}

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function defaultKingdomStore(): KingdomStoreV1 {
  return { v: 1, docs: [] };
}

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const isKind = (x: unknown): x is KingdomDocKind => KINGDOM_KINDS.includes(x as KingdomDocKind);
const isIsoTime = (x: unknown): x is string => typeof x === "string" && x.length > 0 && Number.isFinite(Date.parse(x));

function sizeOk(data: unknown): boolean {
  try {
    const s = JSON.stringify(data);
    return s !== undefined && s.length <= MAX_DOC_CHARS;
  } catch {
    return false;
  }
}

/** A document envelope, or null when it cannot be kept. `data` is not inspected beyond its size. */
export function parseStoredDoc(x: unknown): StoredDoc | null {
  if (!isRecord(x) || typeof x.id !== "string" || !x.id || x.id.length > 64 || !isKind(x.kind)) return null;
  if (!("data" in x) || !sizeOk(x.data)) return null;
  const title = typeof x.title === "string" ? x.title.replace(/\s+/g, " ").trim().slice(0, DOC_TITLE_MAX) : "";
  return { id: x.id, kind: x.kind, title, updatedAt: isIsoTime(x.updatedAt) ? x.updatedAt : new Date(0).toISOString(), data: x.data };
}

function normalise(data: Record<string, unknown>): KingdomStoreV1 {
  const s = defaultKingdomStore();
  if (!Array.isArray(data.docs)) return s;
  const seen = new Set<string>();
  const perKind = new Map<KingdomDocKind, number>();
  for (const raw of data.docs) {
    const d = parseStoredDoc(raw);
    if (!d || seen.has(d.id)) continue;
    const n = perKind.get(d.kind) ?? 0;
    if (n >= MAX_DOCS_PER_KIND) continue;
    seen.add(d.id);
    perKind.set(d.kind, n + 1);
    s.docs.push(d);
  }
  return s;
}

/** Parse stored JSON; anything missing or malformed gets its default. */
export function parseKingdomStore(raw: string | null | undefined): KingdomStoreV1 {
  if (!raw) return defaultKingdomStore();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return defaultKingdomStore();
  }
  if (!isRecord(data) || data.v !== 1) return defaultKingdomStore();
  return normalise(data);
}

// ---------------------------------------------------------------------------
// Storage

function storage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** true when localStorage can be written (false in some private modes or with blocked site data). */
export function storageWorks(): boolean {
  try {
    const k = "ko:kingdom:probe";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

/** In-memory stand-in for localStorage when the browser blocks it (data lasts for this page only). */
export function memoryStorage(): StorageLike {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
  };
}

let fallback: StorageLike | null = null;
/** localStorage when it works, else one shared in-memory store for this page and blocked = true. */
export function kingdomStorage(): { st: StorageLike | null; blocked: boolean } {
  if (storageWorks()) return { st: storage(), blocked: false };
  fallback ??= memoryStorage();
  return { st: fallback, blocked: true };
}

export function readKingdom(st: StorageLike | null = storage()): KingdomStoreV1 {
  try {
    return parseKingdomStore(st?.getItem(KINGDOM_KEY));
  } catch {
    return defaultKingdomStore();
  }
}

function write(s: KingdomStoreV1, st: StorageLike | null): KingdomStoreV1 {
  const next = normalise(s as unknown as Record<string, unknown>);
  try {
    st?.setItem(KINGDOM_KEY, JSON.stringify(next));
  } catch {
    // Private mode or quota: keep working in memory for this page.
  }
  return next;
}

// ---------------------------------------------------------------------------
// Documents

/** Documents of one kind, most recently edited first. */
export function listDocs(kind: KingdomDocKind, st: StorageLike | null = storage()): StoredDoc[] {
  return readKingdom(st).docs.filter((d) => d.kind === kind).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDoc(id: string, st: StorageLike | null = storage()): StoredDoc | null {
  return readKingdom(st).docs.find((d) => d.id === id) ?? null;
}

export interface SaveDocInput {
  id: string;
  kind: KingdomDocKind;
  title: string;
  data: unknown;
}

/**
 * Insert or replace a document and stamp updatedAt. Throws with a message the user can act on
 * when the per-kind limit is reached or the document is too large.
 */
export function saveDoc(input: SaveDocInput, st: StorageLike | null = storage(), now: Date = new Date()): { store: KingdomStoreV1; doc: StoredDoc } {
  const doc = parseStoredDoc({ ...input, updatedAt: now.toISOString() });
  if (!doc) {
    if (!sizeOk(input.data)) throw new Error("This document is too large to save. Shorten it first.");
    throw new Error("This document could not be saved.");
  }
  const s = readKingdom(st);
  const i = s.docs.findIndex((d) => d.id === doc.id);
  const docs = [...s.docs];
  if (i >= 0) docs[i] = doc;
  else {
    if (docs.filter((d) => d.kind === doc.kind).length >= MAX_DOCS_PER_KIND) {
      throw new Error(`You can keep up to ${MAX_DOCS_PER_KIND} of these. Delete an old one first.`);
    }
    docs.push(doc);
  }
  return { store: write({ v: 1, docs }, st), doc };
}

export function removeDoc(id: string, st: StorageLike | null = storage()): KingdomStoreV1 {
  const s = readKingdom(st);
  return write({ v: 1, docs: s.docs.filter((d) => d.id !== id) }, st);
}

/** Delete every council-kit document on this device. */
export function clearKingdom(st: StorageLike | null = storage()): void {
  try {
    st?.removeItem(KINGDOM_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Export / import

const NOT_EXPORT = "This file is not a KingdomOps council export. Pick the .json file you exported from the Kingdom council page.";

export function exportKingdom(s: KingdomStoreV1): string {
  return JSON.stringify({ app: KINGDOM_EXPORT_APP, ...s }, null, 2);
}

/** Read a previously exported file (not yet saved). Throws with a message the user can act on. */
export function parseKingdomExport(text: string): KingdomStoreV1 {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(NOT_EXPORT);
  }
  if (!isRecord(data) || data.app !== KINGDOM_EXPORT_APP) throw new Error(NOT_EXPORT);
  if (data.v !== 1) throw new Error("This council export has a version this app cannot read.");
  return normalise(data);
}

/**
 * Merge an import into the stored state: a document with the same id is replaced only when the
 * imported copy is newer (updatedAt), others are added while the per-kind limit allows.
 */
export function importKingdom(text: string, st: StorageLike | null = storage()): { store: KingdomStoreV1; added: number; updated: number; skipped: number } {
  const incoming = parseKingdomExport(text);
  const s = readKingdom(st);
  const docs = [...s.docs];
  let added = 0, updated = 0, skipped = 0;
  for (const d of incoming.docs) {
    const i = docs.findIndex((x) => x.id === d.id);
    if (i >= 0) {
      if (d.updatedAt > docs[i]!.updatedAt) {
        docs[i] = d;
        updated++;
      } else skipped++;
    } else if (docs.filter((x) => x.kind === d.kind).length < MAX_DOCS_PER_KIND) {
      docs.push(d);
      added++;
    } else skipped++;
  }
  return { store: write({ v: 1, docs }, st), added, updated, skipped };
}

/** Save text as a file (Blob + a[download]). No network. */
export function downloadText(filename: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
