// Every SQL statement of the API, prepared once with `?` parameters, plus row -> contract mappers.
// No statement is ever built from request input.
import type {
  AuditAction,
  AuditEntry,
  DocKind,
  DocMeta,
  InviteInfo,
  MemberInfo,
  SpaceInfo,
  SpaceRole,
  SyncDoc,
} from "@rokadm/core";
import type { Db, SqlValue } from "./db";

export interface SpaceRow {
  id: string;
  name: string;
  kingdom: number | null;
  created_at: string;
}
export interface MemberRow {
  id: string;
  space_id: string;
  display_name: string;
  role: SpaceRole;
  token_hash: string;
  joined_at: string;
}
export interface InviteRow {
  id: string;
  space_id: string;
  code_hash: string;
  expires_at: string;
  max_uses: number;
  uses: number;
  revoked: number;
  created_by: string | null;
  created_at: string;
}
export interface DocRow {
  space_id: string;
  kind: DocKind;
  id: string;
  owner_id: string;
  version: number;
  data: string;
  updated_at: string;
  updated_by: string;
}
export interface AuditRow {
  id: number;
  space_id: string;
  at: string;
  actor_id: string | null;
  action: AuditAction;
  target: string | null;
}

const DOC_META_COLUMNS = "space_id, kind, id, owner_id, version, updated_at, updated_by";

export function createStore(db: Db) {
  const q = (sql: string) => {
    const stmt = db.prepare(sql);
    return {
      get: <T>(...args: SqlValue[]) => stmt.get(...args) as T | undefined,
      all: <T>(...args: SqlValue[]) => stmt.all(...args) as T[],
      run: (...args: SqlValue[]) => stmt.run(...args),
    };
  };

  const s = {
    insertSpace: q("INSERT INTO spaces (id, name, kingdom, created_at) VALUES (?, ?, ?, ?)"),
    getSpace: q("SELECT * FROM spaces WHERE id = ?"),
    deleteSpace: q("DELETE FROM spaces WHERE id = ?"),

    insertMember: q("INSERT INTO members (id, space_id, display_name, role, token_hash, joined_at) VALUES (?, ?, ?, ?, ?, ?)"),
    memberByTokenHash: q("SELECT * FROM members WHERE token_hash = ?"),
    memberInSpace: q("SELECT * FROM members WHERE id = ? AND space_id = ?"),
    membersOfSpace: q("SELECT * FROM members WHERE space_id = ? ORDER BY joined_at, id"),
    countMembers: q("SELECT COUNT(*) AS n FROM members WHERE space_id = ?"),
    countAdminsExcept: q("SELECT COUNT(*) AS n FROM members WHERE space_id = ? AND role = 'admin' AND id <> ?"),
    deleteMember: q("DELETE FROM members WHERE id = ? AND space_id = ?"),

    insertInvite: q(
      "INSERT INTO invites (id, space_id, code_hash, expires_at, max_uses, uses, revoked, created_by, created_at) VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)",
    ),
    usableInvite: q("SELECT * FROM invites WHERE code_hash = ? AND revoked = 0 AND uses < max_uses AND expires_at > ?"),
    consumeInvite: q("UPDATE invites SET uses = uses + 1 WHERE id = ? AND revoked = 0 AND uses < max_uses AND expires_at > ?"),
    invitesOfSpace: q("SELECT * FROM invites WHERE space_id = ? ORDER BY created_at DESC, id"),
    getInvite: q("SELECT * FROM invites WHERE id = ?"),
    revokeInvite: q("UPDATE invites SET revoked = 1 WHERE id = ? AND space_id = ?"),

    getDoc: q("SELECT * FROM docs WHERE space_id = ? AND kind = ? AND id = ?"),
    docMetas: q(`SELECT ${DOC_META_COLUMNS} FROM docs WHERE space_id = ? ORDER BY kind, id`),
    docMetasOfKind: q(`SELECT ${DOC_META_COLUMNS} FROM docs WHERE space_id = ? AND kind = ? ORDER BY id`),
    docsOfSpace: q("SELECT * FROM docs WHERE space_id = ? ORDER BY kind, id"),
    countDocs: q("SELECT COUNT(*) AS n FROM docs WHERE space_id = ?"),
    insertDoc: q(
      "INSERT INTO docs (space_id, kind, id, owner_id, version, data, updated_at, updated_by) VALUES (?, ?, ?, ?, 1, ?, ?, ?)",
    ),
    updateDoc: q("UPDATE docs SET version = ?, data = ?, updated_at = ?, updated_by = ? WHERE space_id = ? AND kind = ? AND id = ?"),
    deleteDoc: q("DELETE FROM docs WHERE space_id = ? AND kind = ? AND id = ?"),
    deleteFarmsOfOwner: q("DELETE FROM docs WHERE space_id = ? AND owner_id = ? AND kind = 'farms'"),

    insertAudit: q("INSERT INTO audit (space_id, at, actor_id, action, target) VALUES (?, ?, ?, ?, ?)"),
    auditPage: q("SELECT * FROM audit WHERE space_id = ? AND id < ? ORDER BY id DESC LIMIT ?"),
    auditAll: q("SELECT * FROM audit WHERE space_id = ? ORDER BY id"),
  };

  return {
    ...s,
    count(stmt: ReturnType<typeof q>, ...args: SqlValue[]): number {
      return stmt.get<{ n: number }>(...args)?.n ?? 0;
    },
    audit(spaceId: string, at: string, actorId: string | null, action: AuditAction, target: string | null): void {
      s.insertAudit.run(spaceId, at, actorId, action, target);
    },
  };
}

export type Store = ReturnType<typeof createStore>;

export const toSpace = (r: SpaceRow): SpaceInfo => ({ id: r.id, name: r.name, kingdom: r.kingdom, createdAt: r.created_at });

export const toMember = (r: MemberRow): MemberInfo => ({
  id: r.id,
  displayName: r.display_name,
  role: r.role,
  joinedAt: r.joined_at,
});

export const toInvite = (r: InviteRow): InviteInfo => ({
  id: r.id,
  expiresAt: r.expires_at,
  maxUses: r.max_uses,
  uses: r.uses,
  revoked: r.revoked !== 0,
  createdAt: r.created_at,
});

export const toDocMeta = (r: Omit<DocRow, "data">): DocMeta => ({
  id: r.id,
  kind: r.kind,
  ownerId: r.owner_id,
  version: r.version,
  updatedAt: r.updated_at,
  updatedBy: r.updated_by,
});

export const toDoc = (r: DocRow): SyncDoc => ({ ...toDocMeta(r), data: JSON.parse(r.data) as SyncDoc["data"] });

export const toAudit = (r: AuditRow): AuditEntry => ({
  id: r.id,
  at: r.at,
  actorId: r.actor_id,
  action: r.action,
  target: r.target,
});
