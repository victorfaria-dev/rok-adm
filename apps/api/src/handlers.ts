// One handler per route name in ROUTES. Authentication, space and role checks from the route
// table already ran (app.ts); handlers add the per-document and per-member rules.
import type { IncomingMessage } from "node:http";
import {
  ADMIN_WRITE_KINDS,
  API_VERSION,
  AUDIT_PAGE_MAX,
  DOC_DATA_MAX_BYTES,
  DOCS_PER_SPACE_MAX,
  INVITE_TTL_HOURS_DEFAULT,
  INVITE_USES_DEFAULT,
  MEMBERS_PER_SPACE_MAX,
  formatInviteCode,
  isDocId,
  isDocKind,
  isEntityId,
  validateCreateInvite,
  validateCreateSpace,
  validateJoin,
  validatePutDoc,
  type AuditResponse,
  type ConflictResponse,
  type CreateInviteResponse,
  type CreateSpaceResponse,
  type DocKind,
  type DocResponse,
  type DocsResponse,
  type ExportResponse,
  type InvitesResponse,
  type JoinResponse,
  type MeResponse,
  type MembersResponse,
  type RouteName,
  type SpaceRole,
} from "@rokadm/core";
import { hashInviteCode, hashToken, newId, newInviteCode, newToken } from "./crypto";
import { transaction, type Db } from "./db";
import { HttpError, badRequest, forbidden, notFound, readJsonBody, validationFailed } from "./http";
import {
  toAudit,
  toDoc,
  toDocMeta,
  toInvite,
  toMember,
  toSpace,
  type AuditRow,
  type DocRow,
  type InviteRow,
  type MemberRow,
  type SpaceRow,
  type Store,
} from "./store";

export interface Ctx {
  req: IncomingMessage;
  params: Record<string, string>;
  query: URLSearchParams;
  /** The authenticated member; null only on routes with auth "none". */
  member: MemberRow | null;
  now: Date;
  db: Db;
  store: Store;
  secret: Buffer;
}

export interface Reply {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

type Handler = (ctx: Ctx) => Reply | Promise<Reply>;

/** One response for unknown, expired, revoked and used-up invites, so the reason is not an oracle. */
const inviteInvalid = (): HttpError => new HttpError(404, "invite_invalid", "Invite code is invalid, expired or used up.");

function caller(ctx: Ctx): MemberRow {
  if (!ctx.member) throw new Error("handler needs an authenticated member");
  return ctx.member;
}

function space(ctx: Ctx): SpaceRow {
  const row = ctx.store.getSpace.get<SpaceRow>(caller(ctx).space_id);
  if (!row) throw new Error("member without space");
  return row;
}

function docPath(ctx: Ctx): { kind: DocKind; docId: string } {
  const { kind, docId } = ctx.params;
  if (!isDocKind(kind)) throw badRequest("Unknown document kind.");
  if (!isDocId(docId)) throw badRequest("Document id must match [A-Za-z0-9_-]{1,64}.");
  return { kind, docId };
}

function conflict(current: DocRow | undefined): HttpError {
  const body: ConflictResponse = {
    error: "version_conflict",
    message: current ? "Document changed since baseVersion." : "Document does not exist; use baseVersion 0 to create it.",
    current: current ? toDoc(current) : null,
  };
  return new HttpError(409, "version_conflict", body.message, { body });
}

const limitReached = (message: string): HttpError => new HttpError(409, "limit_reached", message);

/** Creates an invite row; returns it with the formatted plaintext code (shown once). */
function createInvite(ctx: Ctx, spaceId: string, createdBy: string, ttlHours: number, maxUses: number) {
  const code = newInviteCode();
  const id = newId("iv");
  const createdAt = ctx.now.toISOString();
  const expiresAt = new Date(ctx.now.getTime() + ttlHours * 3_600_000).toISOString();
  ctx.store.insertInvite.run(id, spaceId, hashInviteCode(ctx.secret, code), expiresAt, maxUses, createdBy, createdAt);
  const row = ctx.store.getInvite.get<InviteRow>(id)!;
  return { ...toInvite(row), code: formatInviteCode(code) };
}

function insertMember(ctx: Ctx, spaceId: string, displayName: string, role: SpaceRole): { row: MemberRow; token: string } {
  const token = newToken();
  const id = newId("mb");
  ctx.store.insertMember.run(id, spaceId, displayName, role, hashToken(ctx.secret, token), ctx.now.toISOString());
  const row = ctx.store.memberInSpace.get<MemberRow>(id, spaceId)!;
  return { row, token };
}

/** Deletes a member and the documents they own. */
function removeMemberRow(ctx: Ctx, spaceId: string, memberId: string): void {
  ctx.store.deleteDocsOfOwner.run(spaceId, memberId);
  ctx.store.deleteMember.run(memberId, spaceId);
}

function intParam(raw: string | null, name: string, min: number, max: number): number | undefined {
  if (raw === null) return undefined;
  const n = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(n) || n < min || n > max) throw badRequest(`${name} must be an integer ${min}..${max}.`);
  return n;
}

export const handlers: Record<RouteName, Handler> = {
  health: () => ({ status: 200, body: { status: "ok", version: API_VERSION } }),

  async createSpace(ctx) {
    const v = validateCreateSpace(await readJsonBody(ctx.req));
    if (!v.ok) throw validationFailed(v.issues);
    const { name, displayName } = v.value;
    const kingdom = v.value.kingdom ?? null;
    const body = transaction(ctx.db, (): CreateSpaceResponse => {
      const spaceId = newId("sp");
      const at = ctx.now.toISOString();
      ctx.store.insertSpace.run(spaceId, name, kingdom, at);
      const { row, token } = insertMember(ctx, spaceId, displayName, "admin");
      const invite = createInvite(ctx, spaceId, row.id, INVITE_TTL_HOURS_DEFAULT, INVITE_USES_DEFAULT);
      ctx.store.audit(spaceId, at, row.id, "space.create", spaceId);
      const spaceRow = ctx.store.getSpace.get<SpaceRow>(spaceId)!;
      return { space: toSpace(spaceRow), member: toMember(row), token, invite };
    });
    return { status: 201, body };
  },

  async join(ctx) {
    const v = validateJoin(await readJsonBody(ctx.req));
    if (!v.ok) throw validationFailed(v.issues);
    const { inviteCode, displayName } = v.value;
    const nowIso = ctx.now.toISOString();
    const body = transaction(ctx.db, (): JoinResponse => {
      const invite = ctx.store.usableInvite.get<InviteRow>(hashInviteCode(ctx.secret, inviteCode), nowIso);
      if (!invite) throw inviteInvalid();
      if (ctx.store.count(ctx.store.countMembers, invite.space_id) >= MEMBERS_PER_SPACE_MAX) {
        throw limitReached(`A space holds at most ${MEMBERS_PER_SPACE_MAX} members.`);
      }
      if (ctx.store.consumeInvite.run(invite.id, nowIso).changes !== 1) throw inviteInvalid();
      const { row, token } = insertMember(ctx, invite.space_id, displayName, "member");
      ctx.store.audit(invite.space_id, nowIso, row.id, "member.join", row.id);
      const spaceRow = ctx.store.getSpace.get<SpaceRow>(invite.space_id)!;
      return { space: toSpace(spaceRow), member: toMember(row), token };
    });
    return { status: 201, body };
  },

  me(ctx) {
    const body: MeResponse = { space: toSpace(space(ctx)), member: toMember(caller(ctx)) };
    return { status: 200, body };
  },

  deleteSpace(ctx) {
    ctx.store.deleteSpace.run(caller(ctx).space_id);
    return { status: 204 };
  },

  members(ctx) {
    const rows = ctx.store.membersOfSpace.all<MemberRow>(caller(ctx).space_id);
    const body: MembersResponse = { members: rows.map(toMember) };
    return { status: 200, body };
  },

  removeMember(ctx) {
    const me = caller(ctx);
    const spaceId = me.space_id;
    const target = ctx.params.memberId!;
    const at = ctx.now.toISOString();
    if (target === "me" || target === me.id) {
      transaction(ctx.db, () => {
        if (me.role === "admin" && ctx.store.count(ctx.store.countAdminsExcept, spaceId, me.id) === 0) {
          if (ctx.store.count(ctx.store.countMembers, spaceId) > 1) {
            throw limitReached("The last admin cannot leave while other members remain; promoting a member is not supported, delete the space instead.");
          }
          ctx.store.deleteSpace.run(spaceId);
          return;
        }
        removeMemberRow(ctx, spaceId, me.id);
        ctx.store.audit(spaceId, at, me.id, "member.leave", me.id);
      });
      return { status: 204 };
    }
    if (me.role !== "admin") throw forbidden("Only an admin may remove another member.");
    if (!isEntityId(target)) throw badRequest("Malformed member id.");
    transaction(ctx.db, () => {
      if (!ctx.store.memberInSpace.get<MemberRow>(target, spaceId)) throw notFound("No such member in this space.");
      removeMemberRow(ctx, spaceId, target);
      ctx.store.audit(spaceId, at, me.id, "member.remove", target);
    });
    return { status: 204 };
  },

  invites(ctx) {
    const rows = ctx.store.invitesOfSpace.all<InviteRow>(caller(ctx).space_id);
    const body: InvitesResponse = { invites: rows.map(toInvite) };
    return { status: 200, body };
  },

  async createInvite(ctx) {
    const v = validateCreateInvite(await readJsonBody(ctx.req, { allowEmpty: true }));
    if (!v.ok) throw validationFailed(v.issues);
    const me = caller(ctx);
    const body = transaction(ctx.db, (): CreateInviteResponse => {
      const invite = createInvite(ctx, me.space_id, me.id, v.value.ttlHours, v.value.maxUses);
      ctx.store.audit(me.space_id, ctx.now.toISOString(), me.id, "invite.create", invite.id);
      return { invite };
    });
    return { status: 201, body };
  },

  revokeInvite(ctx) {
    const me = caller(ctx);
    const inviteId = ctx.params.inviteId!;
    if (!isEntityId(inviteId)) throw badRequest("Malformed invite id.");
    transaction(ctx.db, () => {
      if (ctx.store.revokeInvite.run(inviteId, me.space_id).changes === 0) throw notFound("No such invite in this space.");
      ctx.store.audit(me.space_id, ctx.now.toISOString(), me.id, "invite.revoke", inviteId);
    });
    return { status: 204 };
  },

  docs(ctx) {
    const spaceId = caller(ctx).space_id;
    const kind = ctx.query.get("kind");
    if (kind !== null && !isDocKind(kind)) throw badRequest("Unknown document kind.");
    const rows = kind === null ? ctx.store.docMetas.all<DocRow>(spaceId) : ctx.store.docMetasOfKind.all<DocRow>(spaceId, kind);
    const body: DocsResponse = { docs: rows.map(toDocMeta) };
    return { status: 200, body };
  },

  getDoc(ctx) {
    const { kind, docId } = docPath(ctx);
    const row = ctx.store.getDoc.get<DocRow>(caller(ctx).space_id, kind, docId);
    if (!row) throw notFound("No such document.");
    const body: DocResponse = { doc: toDoc(row) };
    return { status: 200, body };
  },

  async putDoc(ctx) {
    const me = caller(ctx);
    const { kind, docId } = docPath(ctx);
    if (ADMIN_WRITE_KINDS.includes(kind) && me.role !== "admin") throw forbidden(`Only an admin may write ${kind} documents.`);
    const v = validatePutDoc(kind, await readJsonBody(ctx.req));
    if (!v.ok) throw validationFailed(v.issues);
    const data = JSON.stringify(v.value.data);
    if (Buffer.byteLength(data, "utf8") > DOC_DATA_MAX_BYTES) {
      throw new HttpError(413, "payload_too_large", `Document data exceeds ${DOC_DATA_MAX_BYTES} bytes.`);
    }
    const at = ctx.now.toISOString();
    const { baseVersion } = v.value;
    const status = transaction(ctx.db, () => {
      const current = ctx.store.getDoc.get<DocRow>(me.space_id, kind, docId);
      if (current) {
        if (kind === "farms" && current.owner_id !== me.id) throw forbidden("Only the owner may write this farms document.");
        if (baseVersion !== current.version) throw conflict(current);
        ctx.store.updateDoc.run(current.version + 1, data, at, me.id, me.space_id, kind, docId);
      } else {
        if (baseVersion !== 0) throw conflict(undefined);
        if (ctx.store.count(ctx.store.countDocs, me.space_id) >= DOCS_PER_SPACE_MAX) {
          throw limitReached(`A space holds at most ${DOCS_PER_SPACE_MAX} documents.`);
        }
        ctx.store.insertDoc.run(me.space_id, kind, docId, me.id, data, at, me.id);
      }
      ctx.store.audit(me.space_id, at, me.id, "doc.put", `${kind}/${docId}`);
      return current ? 200 : 201;
    });
    const body: DocResponse = { doc: toDoc(ctx.store.getDoc.get<DocRow>(me.space_id, kind, docId)!) };
    return { status, body };
  },

  deleteDoc(ctx) {
    const me = caller(ctx);
    const { kind, docId } = docPath(ctx);
    const raw = ctx.query.get("version");
    if (raw === null) throw badRequest("Query parameter version is required.");
    const version = intParam(raw, "version", 1, Number.MAX_SAFE_INTEGER)!;
    transaction(ctx.db, () => {
      const current = ctx.store.getDoc.get<DocRow>(me.space_id, kind, docId);
      if (!current) throw notFound("No such document.");
      if (current.owner_id !== me.id && me.role !== "admin") throw forbidden("Only the owner or an admin may delete this document.");
      if (current.version !== version) throw conflict(current);
      ctx.store.deleteDoc.run(me.space_id, kind, docId);
      ctx.store.audit(me.space_id, ctx.now.toISOString(), me.id, "doc.delete", `${kind}/${docId}`);
    });
    return { status: 204 };
  },

  audit(ctx) {
    const limit = intParam(ctx.query.get("limit"), "limit", 1, AUDIT_PAGE_MAX) ?? 50;
    const before = intParam(ctx.query.get("before"), "before", 1, Number.MAX_SAFE_INTEGER) ?? Number.MAX_SAFE_INTEGER;
    const rows = ctx.store.auditPage.all<AuditRow>(caller(ctx).space_id, before, limit);
    const body: AuditResponse = { entries: rows.map(toAudit) };
    return { status: 200, body };
  },

  exportSpace(ctx) {
    const me = caller(ctx);
    const spaceId = me.space_id;
    const body = transaction(ctx.db, (): ExportResponse => {
      ctx.store.audit(spaceId, ctx.now.toISOString(), me.id, "space.export", spaceId);
      return {
        format: "kingdomops-space-export",
        formatVersion: 1,
        exportedAt: ctx.now.toISOString(),
        space: toSpace(space(ctx)),
        members: ctx.store.membersOfSpace.all<MemberRow>(spaceId).map(toMember),
        invites: ctx.store.invitesOfSpace.all<InviteRow>(spaceId).map(toInvite),
        docs: ctx.store.docsOfSpace.all<DocRow>(spaceId).map(toDoc),
        audit: ctx.store.auditAll.all<AuditRow>(spaceId).map(toAudit),
      };
    });
    return {
      status: 200,
      body,
      headers: { "Content-Disposition": `attachment; filename="kingdomops-space-${spaceId}.json"` },
    };
  },
};
