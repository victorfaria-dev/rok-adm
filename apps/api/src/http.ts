// Small request/response helpers over node:http.
import type { IncomingMessage, ServerResponse } from "node:http";
import { BODY_MAX_BYTES, type ErrorCode, type ErrorResponse, type Issue } from "@rokadm/core";

/** An error that maps to one HTTP response. `body` replaces the ErrorResponse (used for 409 conflicts). */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly extra: { issues?: Issue[]; headers?: Record<string, string>; body?: object; closeConnection?: boolean } = {},
  ) {
    super(message);
    this.name = "HttpError";
  }

  toBody(): object {
    if (this.extra.body) return this.extra.body;
    const body: ErrorResponse = { error: this.code, message: this.message };
    if (this.extra.issues) body.issues = this.extra.issues;
    return body;
  }
}

export const badRequest = (message: string): HttpError => new HttpError(400, "bad_request", message);
export const validationFailed = (issues: Issue[]): HttpError =>
  new HttpError(400, "validation_failed", "Request failed validation.", { issues });
export const forbidden = (message = "Not allowed."): HttpError => new HttpError(403, "forbidden", message);
export const notFound = (message = "Not found."): HttpError => new HttpError(404, "not_found", message);

const SECURITY_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
};

/** Sets the headers every response carries (JSON, 204 and errors alike). */
export function setSecurityHeaders(res: ServerResponse): void {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
}

export function sendJson(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  const payload = Buffer.from(JSON.stringify(body), "utf8");
  setSecurityHeaders(res);
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", String(payload.length));
  res.writeHead(status);
  res.end(payload);
}

export function sendEmpty(res: ServerResponse, status: number, headers: Record<string, string> = {}): void {
  setSecurityHeaders(res);
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.writeHead(status);
  res.end();
}

export function sendError(res: ServerResponse, err: HttpError): void {
  sendJson(res, err.status, err.toBody(), err.extra.headers);
}

const JSON_TYPE = /^application\/json\s*(?:;.*)?$/i;

function tooLarge(): HttpError {
  return new HttpError(413, "payload_too_large", `Request body exceeds ${BODY_MAX_BYTES} bytes.`, { closeConnection: true });
}

/**
 * Reads and parses a JSON body of at most BODY_MAX_BYTES.
 * - Declared Content-Length over the limit: 413 before reading anything.
 * - Streamed (chunked) bytes over the limit: 413, reading stops and the connection is closed.
 * - A body with a Content-Type other than application/json: 415.
 * - No body at all: `undefined` if `allowEmpty`, otherwise 400.
 */
export async function readJsonBody(req: IncomingMessage, opts: { allowEmpty?: boolean } = {}): Promise<unknown> {
  const declared = req.headers["content-length"];
  const chunked = req.headers["transfer-encoding"] !== undefined;
  const length = declared === undefined ? undefined : Number(declared);
  if (length !== undefined && length > BODY_MAX_BYTES) throw tooLarge();
  const hasBody = chunked || (length !== undefined && length > 0);
  if (!hasBody) {
    if (opts.allowEmpty) return undefined;
    throw badRequest("A JSON request body is required.");
  }
  if (!JSON_TYPE.test(req.headers["content-type"] ?? "")) {
    throw new HttpError(415, "unsupported_media_type", "Content-Type must be application/json.", { closeConnection: true });
  }
  const raw = await collect(req);
  if (raw.length === 0) {
    if (opts.allowEmpty) return undefined;
    throw badRequest("A JSON request body is required.");
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(raw);
  } catch {
    throw badRequest("Request body is not valid UTF-8.");
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw badRequest("Request body is not valid JSON.");
  }
}

function collect(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const onData = (chunk: Buffer): void => {
      size += chunk.length;
      if (size > BODY_MAX_BYTES) {
        cleanup();
        req.pause();
        reject(tooLarge());
        return;
      }
      chunks.push(chunk);
    };
    const onEnd = (): void => {
      cleanup();
      resolve(Buffer.concat(chunks));
    };
    const onError = (err: Error): void => {
      cleanup();
      reject(err);
    };
    const cleanup = (): void => {
      req.off("data", onData);
      req.off("end", onEnd);
      req.off("error", onError);
    };
    req.on("data", onData);
    req.on("end", onEnd);
    req.on("error", onError);
  });
}
