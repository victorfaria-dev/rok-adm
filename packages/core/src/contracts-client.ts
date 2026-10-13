// Typed client for the local API (apps/api). Zero dependencies: uses the global `fetch`
// (browser or Node 22), or an injected one for tests. It never logs and never puts tokens in
// URLs; the token travels only in the Authorization header.

import {
  ROUTES,
  routePath,
  type AuditResponse,
  type CreateInviteRequest,
  type CreateInviteResponse,
  type CreateSpaceRequest,
  type CreateSpaceResponse,
  type DocKind,
  type DocResponse,
  type DocsResponse,
  type ErrorCode,
  type ExportResponse,
  type InvitesResponse,
  type Issue,
  type JoinRequest,
  type JoinResponse,
  type MeResponse,
  type MembersResponse,
  type PutDocRequest,
  type RouteName,
  type SyncDoc,
} from "./contracts";

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export interface ApiClientOptions {
  /** Origin (and optional path prefix) of the API, e.g. http://127.0.0.1:8787. */
  baseUrl: string;
  token?: string;
  fetch?: FetchLike;
}

const ERROR_CODES: readonly ErrorCode[] = [
  "bad_request", "validation_failed", "unauthorized", "forbidden", "not_found", "version_conflict",
  "payload_too_large", "unsupported_media_type", "rate_limited", "invite_invalid", "limit_reached", "internal",
];
const STATUS_CODES: Record<number, ErrorCode> = {
  400: "bad_request", 401: "unauthorized", 403: "forbidden", 404: "not_found", 409: "version_conflict",
  413: "payload_too_large", 415: "unsupported_media_type", 429: "rate_limited",
};

/** A non-2xx answer. `current` is set on a 409 version conflict (null if the doc is gone). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly issues?: Issue[];
  readonly current?: SyncDoc | null;
  constructor(status: number, code: ErrorCode, message: string, extra: { issues?: Issue[]; current?: SyncDoc | null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    if (extra.issues) this.issues = extra.issues;
    if (extra.current !== undefined) this.current = extra.current;
  }
}

function normalizeBaseUrl(raw: string): string {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new TypeError("baseUrl must be an absolute http(s) URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new TypeError("baseUrl must use http or https");
  if (u.username || u.password || u.search || u.hash) throw new TypeError("baseUrl must not carry credentials, query or fragment");
  return u.origin + u.pathname.replace(/\/+$/, "");
}

async function toError(res: Response): Promise<ApiError> {
  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(await res.text());
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed as Record<string, unknown>;
  } catch {
    // Not JSON: fall back to the status code.
  }
  const code = ERROR_CODES.includes(body.error as ErrorCode) ? (body.error as ErrorCode) : (STATUS_CODES[res.status] ?? "internal");
  const message = typeof body.message === "string" ? body.message : `HTTP ${res.status}`;
  const extra: { issues?: Issue[]; current?: SyncDoc | null } = {};
  if (Array.isArray(body.issues)) extra.issues = body.issues as Issue[];
  if (res.status === 409 && "current" in body) extra.current = (body.current ?? null) as SyncDoc | null;
  return new ApiError(res.status, code, message, extra);
}

export function createApiClient(opts: ApiClientOptions) {
  const base = normalizeBaseUrl(opts.baseUrl);
  const token = opts.token;
  if (token !== undefined && (token === "" || /[\s\u0000-\u001f\u007f]/.test(token))) throw new TypeError("invalid token");
  // Wrap so a browser's window.fetch is never called with a foreign `this`.
  const doFetch: FetchLike = opts.fetch ?? ((input, init) => globalThis.fetch(input, init));

  async function call<T>(route: RouteName, params: Record<string, string> = {}, body?: unknown, query?: Record<string, string | number | undefined>): Promise<T> {
    const def = ROUTES[route];
    let url = base + routePath(def.path, params);
    if (query) {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) if (v !== undefined) q.set(k, String(v));
      const s = q.toString();
      if (s) url += `?${s}`;
    }
    const headers: Record<string, string> = { accept: "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const init: RequestInit = { method: def.method, headers, credentials: "omit", redirect: "error" };
    if (body !== undefined) {
      headers["content-type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    const res = await doFetch(url, init);
    if (!res.ok) throw await toError(res);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  return {
    baseUrl: base,
    withToken: (t: string) => createApiClient({ ...opts, token: t }),
    health: () => call<{ status: "ok"; version: "v1" }>("health"),
    createSpace: (req: CreateSpaceRequest) => call<CreateSpaceResponse>("createSpace", {}, req),
    join: (req: JoinRequest) => call<JoinResponse>("join", {}, req),
    me: (spaceId: string) => call<MeResponse>("me", { spaceId }),
    deleteSpace: (spaceId: string) => call<void>("deleteSpace", { spaceId }),
    members: (spaceId: string) => call<MembersResponse>("members", { spaceId }),
    removeMember: (spaceId: string, memberId: string | "me") => call<void>("removeMember", { spaceId, memberId }),
    invites: (spaceId: string) => call<InvitesResponse>("invites", { spaceId }),
    createInvite: (spaceId: string, req: CreateInviteRequest = {}) => call<CreateInviteResponse>("createInvite", { spaceId }, req),
    revokeInvite: (spaceId: string, inviteId: string) => call<void>("revokeInvite", { spaceId, inviteId }),
    docs: (spaceId: string, kind?: DocKind) => call<DocsResponse>("docs", { spaceId }, undefined, { kind }),
    getDoc: <K extends DocKind>(spaceId: string, kind: K, docId: string) => call<DocResponse<K>>("getDoc", { spaceId, kind, docId }),
    putDoc: <K extends DocKind>(spaceId: string, kind: K, docId: string, req: PutDocRequest<K>) =>
      call<DocResponse<K>>("putDoc", { spaceId, kind, docId }, req),
    deleteDoc: (spaceId: string, kind: DocKind, docId: string, version: number) =>
      call<void>("deleteDoc", { spaceId, kind, docId }, undefined, { version }),
    audit: (spaceId: string, q: { limit?: number; before?: number } = {}) =>
      call<AuditResponse>("audit", { spaceId }, undefined, { limit: q.limit, before: q.before }),
    exportSpace: (spaceId: string) => call<ExportResponse>("exportSpace", { spaceId }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
