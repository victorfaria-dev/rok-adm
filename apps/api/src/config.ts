// Runtime configuration, read once from the environment. Nothing here is a default that would
// expose the server: it binds loopback only unless KO_API_HOST says otherwise.
import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface RateLimitConfig {
  /** Length of one fixed window, in milliseconds. */
  windowMs: number;
  /** Requests per window per client address, on every route. */
  general: number;
  /** Requests per window per client address, on routes marked `strictRate` (create space, join). */
  strict: number;
}

export interface Config {
  host: string;
  port: number;
  /** SQLite file path, or ":memory:". */
  dbPath: string;
  /** Exact origins allowed by CORS. */
  origins: string[];
  /** HMAC key for tokens and invite codes (at least 32 bytes). */
  secret: Buffer;
  rateLimit: RateLimitConfig;
}

/** The apps/api directory (this file lives in apps/api/src). */
export const PACKAGE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SECRET_MIN_BYTES = 32;

export interface LoadConfigOptions {
  /** Base directory for relative paths and the generated secret; defaults to PACKAGE_DIR. */
  baseDir?: string;
}

export function loadConfig(env: Record<string, string | undefined>, opts: LoadConfigOptions = {}): Config {
  const baseDir = opts.baseDir ?? PACKAGE_DIR;
  const dbEnv = env.KO_API_DB?.trim();
  const dbPath = !dbEnv ? join(baseDir, ".data", "kingdomops.sqlite") : dbEnv === ":memory:" || isAbsolute(dbEnv) ? dbEnv : resolve(baseDir, dbEnv);
  const originsEnv = env.KO_API_ORIGINS ?? "http://localhost:4321,http://127.0.0.1:4321";
  return {
    host: env.KO_API_HOST?.trim() || "127.0.0.1",
    port: intEnv(env, "KO_API_PORT", 8787, 0, 65535),
    dbPath,
    origins: originsEnv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    secret: env.KO_API_SECRET ? parseSecret(env.KO_API_SECRET) : readOrCreateSecret(join(baseDir, ".data", "secret")),
    rateLimit: {
      windowMs: intEnv(env, "KO_API_RATE_WINDOW_MS", 60_000, 1000, 3_600_000),
      general: intEnv(env, "KO_API_RATE_GENERAL", 300, 1, 1_000_000),
      strict: intEnv(env, "KO_API_RATE_STRICT", 20, 1, 1_000_000),
    },
  };
}

function intEnv(env: Record<string, string | undefined>, key: string, def: number, min: number, max: number): number {
  const raw = env[key]?.trim();
  if (!raw) return def;
  const n = Number(raw);
  if (!/^\d+$/.test(raw) || n < min || n > max) throw new Error(`${key} must be an integer ${min}..${max}`);
  return n;
}

function parseSecret(hex: string): Buffer {
  const s = hex.trim();
  if (!/^(?:[0-9a-fA-F]{2})+$/.test(s) || s.length < SECRET_MIN_BYTES * 2) {
    throw new Error(`KO_API_SECRET must be hex of at least ${SECRET_MIN_BYTES} bytes`);
  }
  return Buffer.from(s, "hex");
}

/** Reads the secret file, or creates it (dir 0700, file 0600) with 32 random bytes. */
function readOrCreateSecret(file: string): Buffer {
  if (existsSync(file)) return parseSecret(readFileSync(file, "utf8"));
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  const hex = randomBytes(SECRET_MIN_BYTES).toString("hex");
  writeFileSync(file, `${hex}\n`, { mode: 0o600, flag: "wx" });
  chmodSync(file, 0o600);
  return Buffer.from(hex, "hex");
}
