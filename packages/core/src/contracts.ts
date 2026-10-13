// Contracts shared by the local API (apps/api) and its typed client.
// Hand-written validators (no schema library): each returns the cleaned value or a list of
// errors with a JSON-pointer-like path. Validators reject; they never guess or repair input,
// so a client bug shows up as a 400 instead of silently changed data.

// ---------------------------------------------------------------------------
// Limits

export const API_VERSION = "v1";
export const SPACE_NAME_MAX = 60;
export const DISPLAY_NAME_MAX = 32;
export const KINGDOM_MIN = 1;
export const KINGDOM_MAX = 99999;
export const DOC_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
export const ENTITY_ID_PATTERN = /^[a-z]{2}_[A-Za-z0-9_-]{16,32}$/;
/** Serialized size limit of one document's `data` (bytes of UTF-8 JSON). */
export const DOC_DATA_MAX_BYTES = 512 * 1024;
/** Request body limit; a little above the document limit for the envelope. */
export const BODY_MAX_BYTES = DOC_DATA_MAX_BYTES + 16 * 1024;
export const GENERIC_DOC_MAX_DEPTH = 8;
export const GENERIC_STRING_MAX = 4000;
export const DOCS_PER_SPACE_MAX = 500;
export const MEMBERS_PER_SPACE_MAX = 300;
export const INVITE_TTL_HOURS_DEFAULT = 72;
export const INVITE_TTL_HOURS_MAX = 24 * 14;
export const INVITE_USES_DEFAULT = 50;
export const INVITE_USES_MAX = 300;
export const AUDIT_PAGE_MAX = 200;

/** Invite codes: 12 symbols from INVITE_CODE_ALPHABET (30 symbols, ~58.9 bits), shown as XXXX-XXXX-XXXX. */
export const INVITE_CODE_LENGTH = 12;

// Farm-document limits mirror apps/web/src/lib/farms-store.ts (ko:farms:v1).
export const MAX_FARMS = 10;
export const MAX_SHIPMENTS = 2000;
export const FARM_NAME_MAX = 40;
export const FARM_NOTE_MAX = 200;

// ---------------------------------------------------------------------------
// Domain types

export type SpaceRole = "admin" | "member";
export const SPACE_ROLES: readonly SpaceRole[] = ["admin", "member"];

/**
 * Document kinds the server accepts. `farms` has a strict shape; the others are generic JSON
 * objects (size and depth limited) until their web stores settle. Add a kind here to sync it.
 */
export const DOC_KINDS = ["farms", "mge-plan", "council-requirements", "kingdom"] as const;
export type DocKind = (typeof DOC_KINDS)[number];
/** Kinds only an admin may write; members read them. `farms` is written by its owner. */
export const ADMIN_WRITE_KINDS: readonly DocKind[] = ["mge-plan", "council-requirements", "kingdom"];

export type SyncResource = "food" | "wood" | "stone" | "gold";
export const SYNC_RESOURCES: readonly SyncResource[] = ["food", "wood", "stone", "gold"];
export type SyncFarmFocus = "general" | SyncResource;
export const SYNC_FARM_FOCUS: readonly SyncFarmFocus[] = ["general", ...SYNC_RESOURCES];

export type FarmLevelField = "cityHall" | "tradingPost" | "goldmine" | "academy" | "commanderLevel";
export const FARM_LEVEL_RANGES: Readonly<Record<FarmLevelField, readonly [number, number]>> = {
  cityHall: [1, 25],
  tradingPost: [1, 25],
  goldmine: [1, 25],
  academy: [1, 25],
  commanderLevel: [1, 60],
};

export interface SyncFarm {
  id: string;
  name: string;
  role: SyncFarmFocus;
  note: string;
  levels: Record<FarmLevelField, number | null>;
  gatheringUntil: string | null;
  daily: { date: string; done: string[] } | null;
  goal: { resource: SyncResource; amount: number } | null;
  createdAt: string;
}

export interface SyncShipment {
  id: string;
  farmId: string;
  date: string;
  resource: SyncResource;
  gross: number;
  taxRate: number;
  net: number;
  note?: string;
}

/** `data` of a `farms` document: the farms and shipments of one ko:farms:v1 store. */
export interface FarmsDocData {
  farms: SyncFarm[];
  shipments: SyncShipment[];
}

export type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue };
export type JsonObject = { [k: string]: JsonValue };

export type DocData<K extends DocKind> = K extends "farms" ? FarmsDocData : JsonObject;

export interface SpaceInfo {
  id: string;
  name: string;
  kingdom: number | null;
  createdAt: string;
}

export interface MemberInfo {
  id: string;
  displayName: string;
  role: SpaceRole;
  joinedAt: string;
}

export interface InviteInfo {
  id: string;
  expiresAt: string;
  maxUses: number;
  uses: number;
  revoked: boolean;
  createdAt: string;
}

export interface DocMeta {
  id: string;
  kind: DocKind;
  ownerId: string;
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface SyncDoc<K extends DocKind = DocKind> extends DocMeta {
  kind: K;
  data: DocData<K>;
}

export interface AuditEntry {
  id: number;
  at: string;
  actorId: string | null;
  action: AuditAction;
  target: string | null;
}

export type AuditAction =
  | "space.create"
  | "member.join"
  | "member.remove"
  | "member.leave"
  | "invite.create"
  | "invite.revoke"
  | "doc.put"
  | "doc.delete"
  | "space.export";

// ---------------------------------------------------------------------------
// Requests and responses

export interface CreateSpaceRequest {
  name: string;
  kingdom?: number | null;
  displayName: string;
}
export interface CreateSpaceResponse {
  space: SpaceInfo;
  member: MemberInfo;
  /** Shown once; the server keeps only an HMAC of it. */
  token: string;
  invite: InviteInfo & { code: string };
}

export interface JoinRequest {
  inviteCode: string;
  displayName: string;
}
export interface JoinResponse {
  space: SpaceInfo;
  member: MemberInfo;
  token: string;
}

export interface MeResponse {
  space: SpaceInfo;
  member: MemberInfo;
}

export interface MembersResponse {
  members: MemberInfo[];
}

export interface CreateInviteRequest {
  ttlHours?: number;
  maxUses?: number;
}
export interface CreateInviteResponse {
  invite: InviteInfo & { code: string };
}
export interface InvitesResponse {
  invites: InviteInfo[];
}

export interface DocsResponse {
  docs: DocMeta[];
}

export interface PutDocRequest<K extends DocKind = DocKind> {
  /** 0 to create; otherwise the version the client last saw. */
  baseVersion: number;
  data: DocData<K>;
}
export interface DocResponse<K extends DocKind = DocKind> {
  doc: SyncDoc<K>;
}
/** Body of a 409: the server's current document, so the client can merge or overwrite. */
export interface ConflictResponse {
  error: "version_conflict";
  message: string;
  current: SyncDoc | null;
}

export interface AuditResponse {
  entries: AuditEntry[];
}

export interface ExportResponse {
  format: "kingdomops-space-export";
  formatVersion: 1;
  exportedAt: string;
  space: SpaceInfo;
  members: MemberInfo[];
  invites: InviteInfo[];
  docs: SyncDoc[];
  audit: AuditEntry[];
}

export type ErrorCode =
  | "bad_request"
  | "validation_failed"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "version_conflict"
  | "payload_too_large"
  | "unsupported_media_type"
  | "rate_limited"
  | "invite_invalid"
  | "limit_reached"
  | "internal";

export interface ErrorResponse {
  error: ErrorCode;
  message: string;
  issues?: Issue[];
}

// ---------------------------------------------------------------------------
// Route table (single source for the server router, the OpenAPI test and the client)

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
export type RouteAuth = "none" | "member" | "admin";

export interface RouteDef {
  name: string;
  method: HttpMethod;
  /** Path template with `{param}` segments, as in OpenAPI. */
  path: string;
  auth: RouteAuth;
  /** Stricter rate-limit bucket for unauthenticated writes. */
  strictRate?: boolean;
}

export const ROUTES = {
  health: { name: "health", method: "GET", path: "/v1/health", auth: "none" },
  createSpace: { name: "createSpace", method: "POST", path: "/v1/spaces", auth: "none", strictRate: true },
  join: { name: "join", method: "POST", path: "/v1/join", auth: "none", strictRate: true },
  me: { name: "me", method: "GET", path: "/v1/spaces/{spaceId}", auth: "member" },
  deleteSpace: { name: "deleteSpace", method: "DELETE", path: "/v1/spaces/{spaceId}", auth: "admin" },
  members: { name: "members", method: "GET", path: "/v1/spaces/{spaceId}/members", auth: "member" },
  removeMember: { name: "removeMember", method: "DELETE", path: "/v1/spaces/{spaceId}/members/{memberId}", auth: "member" },
  invites: { name: "invites", method: "GET", path: "/v1/spaces/{spaceId}/invites", auth: "admin" },
  createInvite: { name: "createInvite", method: "POST", path: "/v1/spaces/{spaceId}/invites", auth: "admin" },
  revokeInvite: { name: "revokeInvite", method: "DELETE", path: "/v1/spaces/{spaceId}/invites/{inviteId}", auth: "admin" },
  docs: { name: "docs", method: "GET", path: "/v1/spaces/{spaceId}/docs", auth: "member" },
  getDoc: { name: "getDoc", method: "GET", path: "/v1/spaces/{spaceId}/docs/{kind}/{docId}", auth: "member" },
  putDoc: { name: "putDoc", method: "PUT", path: "/v1/spaces/{spaceId}/docs/{kind}/{docId}", auth: "member" },
  deleteDoc: { name: "deleteDoc", method: "DELETE", path: "/v1/spaces/{spaceId}/docs/{kind}/{docId}", auth: "member" },
  audit: { name: "audit", method: "GET", path: "/v1/spaces/{spaceId}/audit", auth: "admin" },
  exportSpace: { name: "exportSpace", method: "GET", path: "/v1/spaces/{spaceId}/export", auth: "admin" },
} as const satisfies Record<string, RouteDef>;

export type RouteName = keyof typeof ROUTES;

/** Fill a route template; every value is URI-encoded. */
export function routePath(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = params[k];
    if (v === undefined) throw new Error(`missing path param ${k}`);
    return encodeURIComponent(v);
  });
}

// ---------------------------------------------------------------------------
// Validation

export interface Issue {
  path: string;
  message: string;
}
export type Result<T> = { ok: true; value: T } | { ok: false; issues: Issue[] };

const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const fail = <T>(issues: Issue[]): Result<T> => ({ ok: false, issues });

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const isIsoTime = (x: unknown): x is string =>
  typeof x === "string" && x.length <= 40 && /^\d{4}-\d{2}-\d{2}T/.test(x) && Number.isFinite(Date.parse(x));

/** true for a real calendar date written YYYY-MM-DD. */
export function isIsoDay(x: unknown): x is string {
  if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
  const d = new Date(`${x}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === x;
}

/** Control characters and line/paragraph separators are refused in every user string. */
const CONTROL = /[\u0000-\u001f\u007f\u2028\u2029]/;

function text(issues: Issue[], path: string, x: unknown, min: number, max: number): string | undefined {
  if (typeof x !== "string") {
    issues.push({ path, message: "must be a string" });
    return undefined;
  }
  const s = x.trim();
  if (s.length < min || s.length > max) {
    issues.push({ path, message: `must be ${min}..${max} characters` });
    return undefined;
  }
  if (CONTROL.test(s)) {
    issues.push({ path, message: "must not contain control characters" });
    return undefined;
  }
  return s;
}

function int(issues: Issue[], path: string, x: unknown, min: number, max: number): number | undefined {
  if (typeof x !== "number" || !Number.isInteger(x) || x < min || x > max) {
    issues.push({ path, message: `must be an integer ${min}..${max}` });
    return undefined;
  }
  return x;
}

function noExtraKeys(issues: Issue[], path: string, obj: Record<string, unknown>, allowed: readonly string[]): void {
  for (const k of Object.keys(obj)) if (!allowed.includes(k)) issues.push({ path: `${path}/${k}`, message: "unknown field" });
}

export function isDocKind(x: unknown): x is DocKind {
  return typeof x === "string" && (DOC_KINDS as readonly string[]).includes(x);
}
export function isDocId(x: unknown): x is string {
  return typeof x === "string" && DOC_ID_PATTERN.test(x);
}
export function isEntityId(x: unknown): x is string {
  return typeof x === "string" && ENTITY_ID_PATTERN.test(x);
}

/** Upper-case, drop spaces and dashes; null if it cannot be an invite code. */
export function normalizeInviteCode(x: unknown): string | null {
  if (typeof x !== "string" || x.length > 40) return null;
  const s = x.toUpperCase().replace(/[\s-]/g, "");
  if (s.length !== INVITE_CODE_LENGTH) return null;
  for (const c of s) if (!INVITE_CODE_ALPHABET.includes(c)) return null;
  return s;
}
/** Invite code alphabet: digits 2-9 and letters without I, L, O, U (no look-alikes). */
export const INVITE_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

export function formatInviteCode(code: string): string {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

export function validateCreateSpace(x: unknown): Result<CreateSpaceRequest> {
  const issues: Issue[] = [];
  if (!isRecord(x)) return fail([{ path: "", message: "must be an object" }]);
  noExtraKeys(issues, "", x, ["name", "kingdom", "displayName"]);
  const name = text(issues, "/name", x.name, 1, SPACE_NAME_MAX);
  const displayName = text(issues, "/displayName", x.displayName, 1, DISPLAY_NAME_MAX);
  let kingdom: number | null = null;
  if (x.kingdom !== undefined && x.kingdom !== null) kingdom = int(issues, "/kingdom", x.kingdom, KINGDOM_MIN, KINGDOM_MAX) ?? null;
  if (issues.length) return fail(issues);
  return ok({ name: name!, displayName: displayName!, kingdom });
}

export function validateJoin(x: unknown): Result<JoinRequest> {
  const issues: Issue[] = [];
  if (!isRecord(x)) return fail([{ path: "", message: "must be an object" }]);
  noExtraKeys(issues, "", x, ["inviteCode", "displayName"]);
  const code = normalizeInviteCode(x.inviteCode);
  if (!code) issues.push({ path: "/inviteCode", message: "must be a 12-character invite code" });
  const displayName = text(issues, "/displayName", x.displayName, 1, DISPLAY_NAME_MAX);
  if (issues.length) return fail(issues);
  return ok({ inviteCode: code!, displayName: displayName! });
}

export function validateCreateInvite(x: unknown): Result<Required<CreateInviteRequest>> {
  const issues: Issue[] = [];
  const obj = x === undefined || x === null ? {} : x;
  if (!isRecord(obj)) return fail([{ path: "", message: "must be an object" }]);
  noExtraKeys(issues, "", obj, ["ttlHours", "maxUses"]);
  const ttlHours = obj.ttlHours === undefined ? INVITE_TTL_HOURS_DEFAULT : int(issues, "/ttlHours", obj.ttlHours, 1, INVITE_TTL_HOURS_MAX);
  const maxUses = obj.maxUses === undefined ? INVITE_USES_DEFAULT : int(issues, "/maxUses", obj.maxUses, 1, INVITE_USES_MAX);
  if (issues.length) return fail(issues);
  return ok({ ttlHours: ttlHours!, maxUses: maxUses! });
}

// --- farms document

const isAmount = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1e15;

function validateFarm(issues: Issue[], p: string, x: unknown): SyncFarm | undefined {
  if (!isRecord(x)) {
    issues.push({ path: p, message: "must be an object" });
    return undefined;
  }
  const n = issues.length;
  noExtraKeys(issues, p, x, ["id", "name", "role", "note", "levels", "gatheringUntil", "daily", "goal", "createdAt"]);
  if (!isDocId(x.id)) issues.push({ path: `${p}/id`, message: "must match [A-Za-z0-9_-]{1,64}" });
  const name = text(issues, `${p}/name`, x.name, 1, FARM_NAME_MAX);
  if (!SYNC_FARM_FOCUS.includes(x.role as SyncFarmFocus)) issues.push({ path: `${p}/role`, message: "unknown role" });
  const note = typeof x.note === "string" && x.note.trim() === "" ? "" : text(issues, `${p}/note`, x.note, 0, FARM_NOTE_MAX);
  const levels = {} as SyncFarm["levels"];
  if (!isRecord(x.levels)) issues.push({ path: `${p}/levels`, message: "must be an object" });
  else {
    noExtraKeys(issues, `${p}/levels`, x.levels, Object.keys(FARM_LEVEL_RANGES));
    for (const [f, [min, max]] of Object.entries(FARM_LEVEL_RANGES) as [FarmLevelField, readonly [number, number]][]) {
      const v = x.levels[f];
      if (v === null || v === undefined) levels[f] = null;
      else levels[f] = int(issues, `${p}/levels/${f}`, v, min, max) ?? null;
    }
  }
  if (x.gatheringUntil !== null && !isIsoTime(x.gatheringUntil)) issues.push({ path: `${p}/gatheringUntil`, message: "must be an ISO time or null" });
  let daily: SyncFarm["daily"] = null;
  if (x.daily !== null) {
    const d = x.daily;
    if (!isRecord(d) || !isIsoDay(d.date) || !Array.isArray(d.done) || d.done.length > 100) {
      issues.push({ path: `${p}/daily`, message: "must be { date: YYYY-MM-DD, done: string[] } or null" });
    } else {
      noExtraKeys(issues, `${p}/daily`, d, ["date", "done"]);
      const done = d.done.map((v, i) => text(issues, `${p}/daily/done/${i}`, v, 1, 64)).filter((v): v is string => v !== undefined);
      daily = { date: d.date, done };
    }
  }
  let goal: SyncFarm["goal"] = null;
  if (x.goal !== null) {
    const g = x.goal;
    if (!isRecord(g) || !SYNC_RESOURCES.includes(g.resource as SyncResource) || !isAmount(g.amount)) {
      issues.push({ path: `${p}/goal`, message: "must be { resource, amount >= 0 } or null" });
    } else {
      noExtraKeys(issues, `${p}/goal`, g, ["resource", "amount"]);
      goal = { resource: g.resource as SyncResource, amount: g.amount };
    }
  }
  if (!isIsoTime(x.createdAt)) issues.push({ path: `${p}/createdAt`, message: "must be an ISO time" });
  if (issues.length > n) return undefined;
  return {
    id: x.id as string,
    name: name!,
    role: x.role as SyncFarmFocus,
    note: note ?? "",
    levels,
    gatheringUntil: (x.gatheringUntil as string | null) ?? null,
    daily,
    goal,
    createdAt: x.createdAt as string,
  };
}

function validateShipment(issues: Issue[], p: string, x: unknown): SyncShipment | undefined {
  if (!isRecord(x)) {
    issues.push({ path: p, message: "must be an object" });
    return undefined;
  }
  const n = issues.length;
  noExtraKeys(issues, p, x, ["id", "farmId", "date", "resource", "gross", "taxRate", "net", "note"]);
  if (!isDocId(x.id)) issues.push({ path: `${p}/id`, message: "must match [A-Za-z0-9_-]{1,64}" });
  if (!isDocId(x.farmId)) issues.push({ path: `${p}/farmId`, message: "must match [A-Za-z0-9_-]{1,64}" });
  if (!isIsoDay(x.date)) issues.push({ path: `${p}/date`, message: "must be YYYY-MM-DD" });
  if (!SYNC_RESOURCES.includes(x.resource as SyncResource)) issues.push({ path: `${p}/resource`, message: "unknown resource" });
  if (!isAmount(x.gross)) issues.push({ path: `${p}/gross`, message: "must be a number >= 0" });
  if (!isAmount(x.net)) issues.push({ path: `${p}/net`, message: "must be a number >= 0" });
  if (isAmount(x.gross) && isAmount(x.net) && x.net > x.gross) issues.push({ path: `${p}/net`, message: "must not exceed gross" });
  if (typeof x.taxRate !== "number" || !Number.isFinite(x.taxRate) || x.taxRate < 0 || x.taxRate >= 1)
    issues.push({ path: `${p}/taxRate`, message: "must be a number in [0, 1)" });
  let note: string | undefined;
  if (x.note !== undefined) note = text(issues, `${p}/note`, x.note, 0, FARM_NOTE_MAX);
  if (issues.length > n) return undefined;
  const e: SyncShipment = {
    id: x.id as string,
    farmId: x.farmId as string,
    date: x.date as string,
    resource: x.resource as SyncResource,
    gross: x.gross as number,
    taxRate: x.taxRate as number,
    net: x.net as number,
  };
  if (note) e.note = note;
  return e;
}

export function validateFarmsDoc(x: unknown): Result<FarmsDocData> {
  const issues: Issue[] = [];
  if (!isRecord(x)) return fail([{ path: "/data", message: "must be an object" }]);
  noExtraKeys(issues, "/data", x, ["farms", "shipments"]);
  if (!Array.isArray(x.farms) || x.farms.length > MAX_FARMS) issues.push({ path: "/data/farms", message: `must be an array of at most ${MAX_FARMS}` });
  if (!Array.isArray(x.shipments) || x.shipments.length > MAX_SHIPMENTS)
    issues.push({ path: "/data/shipments", message: `must be an array of at most ${MAX_SHIPMENTS}` });
  if (issues.length) return fail(issues);
  const farms = (x.farms as unknown[]).map((f, i) => validateFarm(issues, `/data/farms/${i}`, f));
  const shipments = (x.shipments as unknown[]).map((s, i) => validateShipment(issues, `/data/shipments/${i}`, s));
  const ids = new Set<string>();
  farms.forEach((f, i) => {
    if (!f) return;
    if (ids.has(f.id)) issues.push({ path: `/data/farms/${i}/id`, message: "duplicate id" });
    ids.add(f.id);
  });
  const shipIds = new Set<string>();
  shipments.forEach((s, i) => {
    if (!s) return;
    if (shipIds.has(s.id)) issues.push({ path: `/data/shipments/${i}/id`, message: "duplicate id" });
    shipIds.add(s.id);
    if (!ids.has(s.farmId)) issues.push({ path: `/data/shipments/${i}/farmId`, message: "unknown farm" });
  });
  if (issues.length) return fail(issues);
  return ok({ farms: farms as SyncFarm[], shipments: shipments as SyncShipment[] });
}

/** Generic document: a JSON object with bounded depth, string length and no `__proto__`-style keys. */
export function validateGenericDoc(x: unknown): Result<JsonObject> {
  const issues: Issue[] = [];
  if (!isRecord(x)) return fail([{ path: "/data", message: "must be an object" }]);
  const walk = (v: unknown, p: string, depth: number): void => {
    if (issues.length >= 20) return;
    if (depth > GENERIC_DOC_MAX_DEPTH) {
      issues.push({ path: p, message: `nesting deeper than ${GENERIC_DOC_MAX_DEPTH}` });
      return;
    }
    if (v === null || typeof v === "boolean") return;
    if (typeof v === "number") {
      if (!Number.isFinite(v)) issues.push({ path: p, message: "must be a finite number" });
      return;
    }
    if (typeof v === "string") {
      if (v.length > GENERIC_STRING_MAX) issues.push({ path: p, message: `string longer than ${GENERIC_STRING_MAX}` });
      return;
    }
    if (Array.isArray(v)) {
      v.forEach((e, i) => walk(e, `${p}/${i}`, depth + 1));
      return;
    }
    if (isRecord(v)) {
      for (const [k, e] of Object.entries(v)) {
        if (k === "__proto__" || k === "constructor" || k === "prototype" || k.length > 128) {
          issues.push({ path: `${p}/${k.slice(0, 32)}`, message: "key not allowed" });
          continue;
        }
        walk(e, `${p}/${k}`, depth + 1);
      }
      return;
    }
    issues.push({ path: p, message: "not a JSON value" });
  };
  walk(x, "/data", 1);
  if (issues.length) return fail(issues);
  return ok(x as JsonObject);
}

export function validateDocData<K extends DocKind>(kind: K, x: unknown): Result<DocData<K>> {
  return (kind === "farms" ? validateFarmsDoc(x) : validateGenericDoc(x)) as Result<DocData<K>>;
}

export function validatePutDoc<K extends DocKind>(kind: K, x: unknown): Result<PutDocRequest<K>> {
  if (!isRecord(x)) return fail([{ path: "", message: "must be an object" }]);
  const issues: Issue[] = [];
  noExtraKeys(issues, "", x, ["baseVersion", "data"]);
  const baseVersion = int(issues, "/baseVersion", x.baseVersion, 0, Number.MAX_SAFE_INTEGER);
  if (issues.length) return fail(issues);
  const data = validateDocData(kind, x.data);
  if (!data.ok) return data;
  return ok({ baseVersion: baseVersion!, data: data.value });
}
