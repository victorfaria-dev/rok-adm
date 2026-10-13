// SQLite access through the built-in node:sqlite. Vite (and so vitest) cannot resolve the
// `node:sqlite` import (it strips the prefix), so the module is loaded with require here, once.
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";

const sqlite = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");

export type Db = import("node:sqlite").DatabaseSync;
export type SqlValue = null | number | bigint | string | Uint8Array;

/** Schema migrations; entry i moves PRAGMA user_version from i to i + 1. Append only. */
const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE spaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    kingdom INTEGER,
    created_at TEXT NOT NULL
  ) STRICT;

  CREATE TABLE members (
    id TEXT PRIMARY KEY,
    space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    token_hash TEXT NOT NULL UNIQUE,
    joined_at TEXT NOT NULL
  ) STRICT;
  CREATE INDEX members_by_space ON members(space_id, joined_at);

  CREATE TABLE invites (
    id TEXT PRIMARY KEY,
    space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    max_uses INTEGER NOT NULL,
    uses INTEGER NOT NULL DEFAULT 0,
    revoked INTEGER NOT NULL DEFAULT 0,
    created_by TEXT,
    created_at TEXT NOT NULL
  ) STRICT;
  CREATE INDEX invites_by_space ON invites(space_id, created_at);

  CREATE TABLE docs (
    space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    PRIMARY KEY (space_id, kind, id)
  ) STRICT;
  CREATE INDEX docs_by_owner ON docs(space_id, owner_id);

  CREATE TABLE audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    at TEXT NOT NULL,
    actor_id TEXT,
    action TEXT NOT NULL,
    target TEXT
  ) STRICT;
  CREATE INDEX audit_by_space ON audit(space_id, id);
  `,
];

export function openDb(path: string): Db {
  const memory = path === ":memory:";
  if (!memory) mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new sqlite.DatabaseSync(path);
  if (!memory) db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 5000");
  migrate(db);
  return db;
}

function migrate(db: Db): void {
  const row = db.prepare("PRAGMA user_version").get() as { user_version: number };
  for (let v = row.user_version; v < MIGRATIONS.length; v++) {
    transaction(db, () => {
      db.exec(MIGRATIONS[v]!);
      // PRAGMA takes no bound parameters; the value is a loop counter, never input.
      db.exec(`PRAGMA user_version = ${v + 1}`);
    });
  }
}

/** Runs fn inside BEGIN IMMEDIATE ... COMMIT; rolls back and rethrows on any error. */
export function transaction<T>(db: Db, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
