// HTTP server wiring: CORS -> rate limit -> routing -> auth -> handler, with one error funnel.
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import { authenticate, authorize } from "./auth";
import type { Config } from "./config";
import { applyCors, preflightHeaders } from "./cors";
import { openDb, type Db } from "./db";
import { handlers } from "./handlers";
import { HttpError, badRequest, forbidden, sendEmpty, sendError, sendJson } from "./http";
import { createLogger, safeMethod, type LogSink, type Logger } from "./log";
import { RateLimiter } from "./rate-limit";
import { matchRoute } from "./router";
import { createStore } from "./store";

export interface AppDeps {
  /** Clock for timestamps, invite expiry and rate-limit windows. */
  now?: () => Date;
  /** Log sink (one JSON line per call), or "silent". Defaults to stdout. */
  logger?: LogSink | "silent";
}

export interface App {
  server: Server;
  db: Db;
  log: Logger;
  close(): Promise<void>;
}

export function createApp(config: Config, deps: AppDeps = {}): App {
  const now = deps.now ?? (() => new Date());
  const log = createLogger(deps.logger);
  const db = openDb(config.dbPath);
  const store = createStore(db);
  const clock = () => now().getTime();
  const general = new RateLimiter(config.rateLimit.general, config.rateLimit.windowMs, clock);
  const strict = new RateLimiter(config.rateLimit.strict, config.rateLimit.windowMs, clock);

  const rateLimited = (retryAfterSec: number) =>
    new HttpError(429, "rate_limited", "Too many requests; retry later.", { headers: { "Retry-After": String(retryAfterSec) } });

  async function handle(req: IncomingMessage, res: ServerResponse, setRoute: (r: string) => void): Promise<void> {
    const originOk = applyCors(req, res, config.origins);
    const clientKey = req.socket.remoteAddress ?? "unknown";
    const g = general.hit(clientKey);
    if (!g.ok) throw rateLimited(g.retryAfterSec);

    if (req.method === "OPTIONS") {
      if (req.headers.origin === undefined || !originOk) throw forbidden("Origin not allowed.");
      sendEmpty(res, 204, preflightHeaders());
      return;
    }

    let url: URL;
    try {
      url = new URL(req.url ?? "/", "http://localhost");
    } catch {
      throw badRequest("Malformed request URL.");
    }
    const match = matchRoute(req.method ?? "", url.pathname);
    setRoute(match.route.path);

    if (match.route.strictRate) {
      const s = strict.hit(clientKey);
      if (!s.ok) throw rateLimited(s.retryAfterSec);
    }

    let member = null;
    if (match.route.auth !== "none") {
      member = authenticate(req, store, config.secret);
      authorize(member, match.params.spaceId, match.route.auth);
    }

    const reply = await handlers[match.name]({
      req,
      params: match.params,
      query: url.searchParams,
      member,
      now: now(),
      db,
      store,
      secret: config.secret,
    });
    if (reply.body === undefined) sendEmpty(res, reply.status, reply.headers);
    else sendJson(res, reply.status, reply.body, reply.headers);
  }

  const server = createServer((req, res) => {
    const start = performance.now();
    const reqId = randomUUID();
    let route = "-";
    res.on("finish", () => {
      log.log("info", {
        msg: "request",
        reqId,
        method: safeMethod(req.method),
        route,
        status: res.statusCode,
        ms: Math.round((performance.now() - start) * 10) / 10,
      });
    });
    handle(req, res, (r) => (route = r)).catch((err: unknown) => {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      if (err instanceof HttpError) {
        if (err.extra.closeConnection) {
          // The body was not (fully) read: answer, then drop the connection instead of draining it.
          res.setHeader("Connection", "close");
          res.on("finish", () => {
            if (!req.complete) req.socket.destroy();
          });
        }
        sendError(res, err);
        return;
      }
      const e = err instanceof Error ? err : new Error("non-error thrown");
      log.log("error", { msg: "unexpected error", reqId, route, err: `${e.name}: ${e.message}`.slice(0, 300) });
      sendError(res, new HttpError(500, "internal", "Internal server error."));
    });
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;

  let closed: Promise<void> | null = null;
  return {
    server,
    db,
    log,
    close() {
      closed ??= new Promise<void>((resolve) => {
        const done = () => {
          clearTimeout(force);
          try {
            db.close();
          } catch {
            // already closed
          }
          resolve();
        };
        const force = setTimeout(() => server.closeAllConnections(), 2_000);
        force.unref();
        if (!server.listening) return done();
        server.close(() => done());
        server.closeIdleConnections();
      });
      return closed;
    },
  };
}

/** Creates the app and listens on config.host:config.port (port 0 picks a free port). */
export async function startServer(config: Config, deps: AppDeps = {}): Promise<App & { port: number }> {
  const app = createApp(config, deps);
  await new Promise<void>((resolve, reject) => {
    app.server.once("error", reject);
    app.server.listen(config.port, config.host, () => {
      app.server.off("error", reject);
      resolve();
    });
  });
  return { ...app, port: (app.server.address() as AddressInfo).port };
}
