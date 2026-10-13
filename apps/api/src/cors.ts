// CORS: only configured origins are echoed back. Requests without an Origin header (curl, tests,
// same-machine tools) are not browser cross-origin requests and pass through untouched.
import type { IncomingMessage, ServerResponse } from "node:http";

const ALLOW_METHODS = "GET, POST, PUT, DELETE";
const ALLOW_HEADERS = "authorization, content-type";
const EXPOSE_HEADERS = "retry-after, content-disposition";

/** Adds CORS headers for an allowed Origin. Returns whether the Origin (if any) is allowed. */
export function applyCors(req: IncomingMessage, res: ServerResponse, origins: readonly string[]): boolean {
  const origin = req.headers.origin;
  if (origin === undefined) return true;
  res.setHeader("Vary", "Origin");
  if (!origins.includes(origin)) return false;
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Expose-Headers", EXPOSE_HEADERS);
  return true;
}

/** Headers of a successful preflight (204). Call after applyCors returned true. */
export function preflightHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Methods": ALLOW_METHODS,
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Max-Age": "600",
  };
}

const LOOPBACK_NAMES = ["127.0.0.1", "localhost", "[::1]"];

/**
 * Host header guard against DNS rebinding: only loopback names (and the configured bind host)
 * are served. A missing Host (HTTP/1.0 tools) is refused as well.
 */
export function hostAllowed(host: string | undefined, configHost: string): boolean {
  if (!host) return false;
  const m = /^(\[[0-9a-fA-F:.]+\]|[^:]+)(?::\d{1,5})?$/.exec(host.trim());
  if (!m) return false;
  const name = m[1]!.toLowerCase();
  const bind = configHost.includes(":") && !configHost.startsWith("[") ? `[${configHost}]` : configHost.toLowerCase();
  return LOOPBACK_NAMES.includes(name) || name === bind;
}
