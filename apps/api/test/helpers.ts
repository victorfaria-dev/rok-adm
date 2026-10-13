import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CreateSpaceResponse, FarmsDocData, JoinResponse } from "@rokadm/core";
import { startServer, type App } from "../src/app";
import type { Config, RateLimitConfig } from "../src/config";

export interface TestServer {
  base: string;
  port: number;
  app: App;
  logs: string[];
  dbPath: string;
  /** Moves the fake clock forward. */
  advance(ms: number): void;
  call(method: string, path: string, opts?: CallOpts): Promise<Res>;
  createSpace(name?: string, displayName?: string): Promise<CreateSpaceResponse>;
  join(code: string, displayName?: string): Promise<JoinResponse>;
  stop(): Promise<void>;
}

export interface CallOpts {
  token?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface Res {
  status: number;
  headers: Headers;
  body: any;
}

export const ORIGIN = "http://localhost:4321";

export async function startTest(opts: { rateLimit?: Partial<RateLimitConfig>; file?: boolean } = {}): Promise<TestServer> {
  const dir = mkdtempSync(join(tmpdir(), "rokadm-api-"));
  const dbPath = opts.file === false ? ":memory:" : join(dir, "test.sqlite");
  const config: Config = {
    host: "127.0.0.1",
    port: 0,
    dbPath,
    origins: [ORIGIN],
    secret: randomBytes(32),
    rateLimit: { windowMs: 60_000, general: 10_000, strict: 10_000, ...opts.rateLimit },
  };
  let t = Date.parse("2026-03-01T12:00:00.000Z");
  const logs: string[] = [];
  const app = await startServer(config, { now: () => new Date(t), logger: (line) => logs.push(line) });
  const base = `http://127.0.0.1:${app.port}`;

  const call = async (method: string, path: string, o: CallOpts = {}): Promise<Res> => {
    const headers: Record<string, string> = { ...o.headers };
    if (o.token) headers.authorization = `Bearer ${o.token}`;
    let body: string | undefined;
    if (o.body !== undefined) {
      body = typeof o.body === "string" ? o.body : JSON.stringify(o.body);
      headers["content-type"] ??= "application/json";
    }
    const r = await fetch(base + path, { method, headers, body });
    const text = await r.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    return { status: r.status, headers: r.headers, body: parsed };
  };

  const server: TestServer = {
    base,
    port: app.port,
    app,
    logs,
    dbPath,
    advance(ms) {
      t += ms;
    },
    call,
    async createSpace(name = "Reino 1234", displayName = "Ana") {
      const r = await call("POST", "/v1/spaces", { body: { name, displayName, kingdom: 1234 } });
      if (r.status !== 201) throw new Error(`createSpace ${r.status} ${JSON.stringify(r.body)}`);
      return r.body as CreateSpaceResponse;
    },
    async join(code, displayName = "Bruno") {
      t += 1; // distinct joined_at, so member order is deterministic
      const r = await call("POST", "/v1/join", { body: { inviteCode: code, displayName } });
      if (r.status !== 201) throw new Error(`join ${r.status} ${JSON.stringify(r.body)}`);
      return r.body as JoinResponse;
    },
    async stop() {
      await app.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
  return server;
}

/** A valid farms document body. */
export function farmsData(name = "Farm 1"): FarmsDocData {
  return {
    farms: [
      {
        id: "f1",
        name,
        role: "food",
        note: "",
        levels: { cityHall: 17, tradingPost: 10, goldmine: null, academy: null, commanderLevel: null },
        gatheringUntil: null,
        daily: null,
        goal: null,
        createdAt: "2026-02-01T10:00:00.000Z",
      },
    ],
    shipments: [
      { id: "s1", farmId: "f1", date: "2026-02-02", resource: "food", gross: 1000, taxRate: 0.2, net: 800 },
    ],
  };
}

/**
 * Sends a request with node:http so the body can be streamed (chunked) or declared larger than
 * what is sent. Resolves with the status as soon as the response arrives.
 */
export function rawRequest(
  port: number,
  opts: { method: string; path: string; headers: Record<string, string | number>; chunks: Buffer[]; endAfter?: boolean },
): Promise<{ status: number; headers: Record<string, unknown>; body: string }> {
  return new Promise((resolve, reject) => {
    let answered = false;
    const req = request({ host: "127.0.0.1", port, method: opts.method, path: opts.path, headers: opts.headers }, (res) => {
      answered = true;
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c: string) => (body += c));
      res.on("end", () => {
        resolve({ status: res.statusCode ?? 0, headers: res.headers, body });
        req.destroy();
      });
      res.on("error", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
    });
    req.on("error", (err) => {
      if (!answered) reject(err);
    });
    let i = 0;
    const writeNext = (): void => {
      if (req.destroyed || answered) return;
      if (i < opts.chunks.length) {
        req.write(opts.chunks[i++]!, () => setImmediate(writeNext));
      } else if (opts.endAfter !== false) {
        req.end();
      }
    };
    writeNext();
  });
}
