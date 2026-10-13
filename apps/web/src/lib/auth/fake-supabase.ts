// In-memory stand-in for the Supabase client, for unit tests only (no network). Covers the calls
// lib/auth uses: auth.*, from(table) query chains, rpc, storage. Every call is recorded in `calls`.
// It does not enforce RLS: the SQL tests in supabase/tests do that against Postgres.
import type { KoSupabase } from "./client";

type Row = Record<string, unknown>;
type Err = { message: string; code?: string; status?: number } | null;

export interface FakeOptions {
  session?: { user: { id: string; email?: string | null; created_at?: string; app_metadata?: Record<string, unknown> } } | null;
  tables?: Record<string, Row[]>;
  rpc?: Record<string, (args: Record<string, unknown>) => { data?: unknown; error?: Err }>;
  /** Error returned by the next write/read on a table ("profiles:update", "reports:insert", "accounts:select"...). */
  fail?: Record<string, Err>;
  auth?: Partial<Record<"signInWithOtp" | "verifyOtp" | "signInWithOAuth" | "exchangeCodeForSession" | "signOut", Err>>;
}

export interface FakeSupabase {
  client: KoSupabase;
  calls: { op: string; args: unknown[] }[];
  tables: Record<string, Row[]>;
  files: Map<string, { bucket: string; path: string; type: string; size: number }>;
  setSession(s: FakeOptions["session"]): void;
}

export function fakeSupabase(opts: FakeOptions = {}): FakeSupabase {
  const calls: FakeSupabase["calls"] = [];
  const tables: Record<string, Row[]> = Object.fromEntries(Object.entries(opts.tables ?? {}).map(([k, v]) => [k, v.map((r) => ({ ...r }))]));
  const files: FakeSupabase["files"] = new Map();
  let session = opts.session ?? null;
  const listeners: ((e: string, s: unknown) => void)[] = [];
  const rec = (op: string, ...args: unknown[]) => calls.push({ op, args });
  const failOf = (key: string): Err => {
    const e = opts.fail?.[key] ?? null;
    if (e && opts.fail) delete opts.fail[key];
    return e;
  };
  const authErr = (k: keyof NonNullable<FakeOptions["auth"]>): Err => opts.auth?.[k] ?? null;

  function query(table: string) {
    const rows = (tables[table] ??= []);
    let op: "select" | "insert" | "upsert" | "update" | "delete" = "select";
    let payload: Row | Row[] | null = null;
    let upsertConflict: string[] = [];
    const filters: ((r: Row) => boolean)[] = [];
    let single = false;
    const b = {
      select(cols?: string) { if (op === "select") rec(`${table}.select`, cols); return b; },
      eq(col: string, v: unknown) { filters.push((r) => r[col] === v); rec(`${table}.eq`, col, v); return b; },
      in(col: string, vs: unknown[]) { filters.push((r) => vs.includes(r[col])); return b; },
      order() { return b; },
      maybeSingle() { single = true; return b; },
      insert(p: Row | Row[]) { op = "insert"; payload = p; rec(`${table}.insert`, p); return b; },
      upsert(p: Row | Row[], o?: { onConflict?: string }) { op = "upsert"; payload = p; upsertConflict = (o?.onConflict ?? "id").split(","); rec(`${table}.upsert`, p, o); return b; },
      update(p: Row) { op = "update"; payload = p; rec(`${table}.update`, p); return b; },
      delete() { op = "delete"; rec(`${table}.delete`); return b; },
      then(resolve: (v: { data: unknown; error: Err }) => unknown, reject?: (e: unknown) => unknown) {
        try {
          return Promise.resolve(run()).then(resolve, reject);
        } catch (e) {
          return reject ? reject(e) : Promise.reject(e);
        }
      },
    };
    const match = (r: Row) => filters.every((f) => f(r));
    function run(): { data: unknown; error: Err } {
      const err = failOf(`${table}:${op}`);
      if (err) return { data: null, error: err };
      if (op === "select") {
        const out = rows.filter(match);
        return { data: single ? out[0] ?? null : out, error: null };
      }
      if (op === "insert") {
        for (const p of Array.isArray(payload) ? payload : [payload!]) rows.push({ id: `id-${rows.length + 1}`, ...p });
        return { data: null, error: null };
      }
      if (op === "upsert") {
        for (const p of Array.isArray(payload) ? payload : [payload!]) {
          const i = rows.findIndex((r) => upsertConflict.every((c) => r[c] === p[c]));
          if (i >= 0) rows[i] = { ...rows[i], ...p };
          else rows.push({ id: `id-${rows.length + 1}`, ...p });
        }
        return { data: null, error: null };
      }
      if (op === "update") {
        for (const r of rows) if (match(r)) Object.assign(r, payload);
        return { data: null, error: null };
      }
      for (let i = rows.length - 1; i >= 0; i--) if (match(rows[i]!)) rows.splice(i, 1);
      return { data: null, error: null };
    }
    return b;
  }

  const storage = {
    from(bucket: string) {
      return {
        async upload(path: string, blob: Blob, o?: unknown) {
          rec(`storage.${bucket}.upload`, path, o);
          const err = failOf(`storage:${bucket}:upload`);
          if (err) return { data: null, error: err };
          files.set(`${bucket}/${path}`, { bucket, path, type: blob.type, size: blob.size });
          return { data: { path }, error: null };
        },
        async remove(paths: string[]) {
          rec(`storage.${bucket}.remove`, paths);
          for (const p of paths) files.delete(`${bucket}/${p}`);
          return { data: [], error: null };
        },
        async list(folder: string) {
          rec(`storage.${bucket}.list`, folder);
          // Like Storage: direct children only; sub-folders come back as { name, id: null }.
          const seen = new Map<string, { name: string; id: string | null }>();
          for (const f of files.values()) {
            if (f.bucket !== bucket || !f.path.startsWith(`${folder}/`)) continue;
            const rest = f.path.slice(folder.length + 1);
            const slash = rest.indexOf("/");
            if (slash < 0) seen.set(rest, { name: rest, id: `file:${rest}` });
            else seen.set(rest.slice(0, slash), { name: rest.slice(0, slash), id: null });
          }
          return { data: [...seen.values()], error: null };
        },
        getPublicUrl(path: string) {
          return { data: { publicUrl: `https://fake.supabase.test/storage/v1/object/public/${bucket}/${path}` } };
        },
      };
    },
  };

  const auth = {
    async getSession() { return { data: { session }, error: null }; },
    onAuthStateChange(cb: (e: string, s: unknown) => void) {
      listeners.push(cb);
      return { data: { subscription: { unsubscribe() { listeners.splice(listeners.indexOf(cb), 1); } } } };
    },
    async signInWithOtp(a: unknown) { rec("auth.signInWithOtp", a); return { data: {}, error: authErr("signInWithOtp") }; },
    async verifyOtp(a: unknown) { rec("auth.verifyOtp", a); return { data: {}, error: authErr("verifyOtp") }; },
    async signInWithOAuth(a: unknown) { rec("auth.signInWithOAuth", a); return { data: {}, error: authErr("signInWithOAuth") }; },
    async exchangeCodeForSession(code: string) { rec("auth.exchangeCodeForSession", code); return { data: {}, error: authErr("exchangeCodeForSession") }; },
    async signOut(a: unknown) {
      rec("auth.signOut", a);
      session = null;
      for (const l of [...listeners]) l("SIGNED_OUT", null);
      return { error: authErr("signOut") };
    },
  };

  async function rpc(name: string, args: Record<string, unknown> = {}) {
    rec(`rpc.${name}`, args);
    const fn = opts.rpc?.[name];
    if (!fn) return { data: null, error: { message: `no fake for ${name}` } };
    const r = fn(args);
    return { data: r.data ?? null, error: r.error ?? null };
  }

  const client = { auth, from: query, rpc, storage } as unknown as KoSupabase;
  return {
    client, calls, tables, files,
    setSession(s) {
      session = s ?? null;
      for (const l of [...listeners]) l(s ? "SIGNED_IN" : "SIGNED_OUT", session);
    },
  };
}
