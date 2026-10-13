// Share links for council documents (F-33 rules page, F-34 requirements card, F-35 MGE ledger).
// A document travels inside the URL fragment (#d=...), so it never reaches a server: the static
// site decodes it in the browser. Format: "<version><mode>" + base64url(payload), where
//   mode "z" = deflate-raw compressed UTF-8 JSON (CompressionStream, every current browser and Node 18+),
//   mode "j" = plain UTF-8 JSON (fallback when CompressionStream is missing).
// The JSON is an envelope { k: kind, d: data } so a rules link is never read as a requirements card.
// Decoding never throws and never evaluates anything: it returns a typed error the page can show.

export const SHARE_VERSION = "1";
/** Longest fragment we accept (characters). Keeps decoding cheap and links pasteable. */
export const MAX_SHARE_CHARS = 24_000;
/** Largest decompressed JSON we accept (bytes): a guard against "zip bomb" fragments. */
export const MAX_SHARE_BYTES = 256 * 1024;

export type ShareError = "empty" | "too_long" | "bad_version" | "bad_encoding" | "bad_json" | "wrong_kind" | "too_big";

export type DecodeResult<T> = { ok: true; data: T } | { ok: false; error: ShareError };

/** Plain-language text for each decode error (UI copy). */
export const SHARE_ERROR_TEXT: Readonly<Record<ShareError, string>> = {
  empty: "This link has no document in it. Ask your council for the full link.",
  too_long: "This link is too long to read. Ask your council to shorten the document.",
  bad_version: "This link was made by a newer or older version of KingdomOps that this page cannot read.",
  bad_encoding: "This link is damaged (some characters are missing or changed). Copy the whole link again.",
  bad_json: "This link is damaged (the document inside cannot be read). Copy the whole link again.",
  wrong_kind: "This link is for a different KingdomOps tool.",
  too_big: "The document in this link is too large to open.",
};

// ---------------------------------------------------------------------------
// base64url (no padding), independent of btoa/Buffer so it behaves the same everywhere.

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const LOOKUP: Record<string, number> = Object.fromEntries([...ALPHABET].map((c, i) => [c, i]));

export function toBase64Url(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!, b = bytes[i + 1], c = bytes[i + 2];
    out += ALPHABET[a >> 2];
    out += ALPHABET[((a & 3) << 4) | ((b ?? 0) >> 4)];
    if (b !== undefined) out += ALPHABET[((b & 15) << 2) | ((c ?? 0) >> 6)];
    if (c !== undefined) out += ALPHABET[c & 63];
  }
  return out;
}

/** null when the text has characters outside base64url or an impossible length. */
export function fromBase64Url(text: string): Uint8Array | null {
  if (text.length % 4 === 1) return null;
  const out = new Uint8Array(Math.floor((text.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < text.length; i += 4) {
    const n = [0, 1, 2, 3].map((j) => (i + j < text.length ? LOOKUP[text[i + j]!] : 0));
    if (n.some((v) => v === undefined)) return null;
    const [w, x, y, z] = n as number[];
    out[o++] = (w! << 2) | (x! >> 4);
    if (i + 2 < text.length) out[o++] = ((x! & 15) << 4) | (y! >> 2);
    if (i + 3 < text.length) out[o++] = ((y! & 3) << 6) | z!;
  }
  return out.slice(0, o);
}

// ---------------------------------------------------------------------------
// Compression (async streams API)

const hasStreams = (): boolean => typeof CompressionStream === "function" && typeof DecompressionStream === "function";

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream, limit = Infinity): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  void writer.write(bytes as unknown as BufferSource).then(() => writer.close()).catch(() => undefined);
  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > limit) {
      await reader.cancel().catch(() => undefined);
      throw new RangeError("too_big");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Public API

/** Thrown by encodeShare when the result would be refused by decodeShare (link or document too large). */
export class ShareTooLargeError extends Error {
  constructor(readonly chars: number) {
    super(`This document is too large for a link (${chars.toLocaleString("en-US")} characters; the limit is ${MAX_SHARE_CHARS.toLocaleString("en-US")}). Shorten it, or export it as a file instead.`);
    this.name = "ShareTooLargeError";
  }
}

export interface EncodeOptions {
  /** Skip compression (tests, or to compare sizes). */
  compress?: boolean;
}

/**
 * Encode a document of a given kind into the text that goes after "#d=".
 * Throws ShareTooLargeError when decodeShare would refuse the result, so no dead link is ever handed out.
 */
export async function encodeShare(kind: string, data: unknown, opts: EncodeOptions = {}): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify({ k: kind, d: data }));
  if (json.length > MAX_SHARE_BYTES) throw new ShareTooLargeError(Math.ceil((json.length * 4) / 3));
  let out = `${SHARE_VERSION}j${toBase64Url(json)}`;
  if (opts.compress !== false && hasStreams()) {
    try {
      const z = await pipe(json, new CompressionStream("deflate-raw"));
      out = `${SHARE_VERSION}z${toBase64Url(z)}`;
    } catch {
      // keep plain JSON
    }
  }
  if (out.length > MAX_SHARE_CHARS) throw new ShareTooLargeError(out.length);
  return out;
}

/**
 * Decode a share string for the expected kind. `parse` turns the untrusted `d` value into a
 * well-formed document (tolerant: fix or drop bad fields) or returns null to reject it.
 */
export async function decodeShare<T>(text: string | null | undefined, kind: string, parse: (d: unknown) => T | null): Promise<DecodeResult<T>> {
  const s = (text ?? "").trim();
  if (!s) return { ok: false, error: "empty" };
  if (s.length > MAX_SHARE_CHARS) return { ok: false, error: "too_long" };
  if (s[0] !== SHARE_VERSION) return { ok: false, error: "bad_version" };
  const mode = s[1];
  const bytes = fromBase64Url(s.slice(2));
  if (!bytes || (mode !== "z" && mode !== "j")) return { ok: false, error: "bad_encoding" };
  let raw: Uint8Array;
  if (mode === "z") {
    if (!hasStreams()) return { ok: false, error: "bad_encoding" };
    try {
      raw = await pipe(bytes, new DecompressionStream("deflate-raw"), MAX_SHARE_BYTES);
    } catch (e) {
      return { ok: false, error: e instanceof RangeError && e.message === "too_big" ? "too_big" : "bad_encoding" };
    }
  } else {
    if (bytes.length > MAX_SHARE_BYTES) return { ok: false, error: "too_big" };
    raw = bytes;
  }
  let env: unknown;
  try {
    env = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw));
  } catch {
    return { ok: false, error: "bad_json" };
  }
  if (typeof env !== "object" || env === null || Array.isArray(env)) return { ok: false, error: "bad_json" };
  const e = env as { k?: unknown; d?: unknown };
  if (e.k !== kind) return { ok: false, error: "wrong_kind" };
  const data = parse(e.d);
  return data === null ? { ok: false, error: "bad_json" } : { ok: true, data };
}

/** The share string from a location hash such as "#d=1z...". Other hash params are ignored. */
export function shareFromHash(hash: string): string | null {
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  for (const part of h.split("&")) {
    if (part.startsWith("d=")) return part.slice(2);
  }
  return null;
}
