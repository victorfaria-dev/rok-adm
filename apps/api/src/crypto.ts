// Secrets handed to clients (member tokens, invite codes) are random and stored only as an HMAC.
// HMAC is deterministic, so lookups go through the UNIQUE hash index.
import { createHmac, randomBytes, randomInt } from "node:crypto";
import { INVITE_CODE_ALPHABET, INVITE_CODE_LENGTH } from "@rokadm/core";

const TOKEN_PREFIX = "kot_";
/** "kot_" + base64url of 32 bytes (43 characters, no padding). */
export const TOKEN_PATTERN = /^kot_[A-Za-z0-9_-]{43}$/;

export function newToken(): string {
  return TOKEN_PREFIX + randomBytes(32).toString("base64url");
}

export function hashToken(secret: Buffer, token: string): string {
  return hmac(secret, `token:${token}`);
}

/** 12 symbols drawn with randomInt (rejection sampling, so no modulo bias). Returned unformatted. */
export function newInviteCode(): string {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) code += INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)];
  return code;
}

/** Hash of a code already passed through normalizeInviteCode. */
export function hashInviteCode(secret: Buffer, normalizedCode: string): string {
  return hmac(secret, `invite:${normalizedCode}`);
}

export type EntityPrefix = "sp" | "mb" | "iv";

/** e.g. "sp_" + 22 base64url characters; matches ENTITY_ID_PATTERN. */
export function newId(prefix: EntityPrefix): string {
  return `${prefix}_${randomBytes(16).toString("base64url")}`;
}

function hmac(secret: Buffer, value: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}
