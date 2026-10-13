// Structured JSON-lines logging. The field set is closed on purpose: there is no slot for IPs,
// tokens, invite codes, bodies, display names or query strings, so they cannot be logged by accident.

export type LogSink = (line: string) => void;
export type LogLevel = "info" | "warn" | "error";

export interface LogFields {
  msg: string;
  reqId?: string;
  method?: string;
  /** Route template (e.g. /v1/spaces/{spaceId}), never the raw URL. */
  route?: string;
  status?: number;
  ms?: number;
  /** Listening address, host:port only. */
  addr?: string;
  /** Error class name and message of an unexpected error. */
  err?: string;
}

export interface Logger {
  log(level: LogLevel, fields: LogFields): void;
}

export function createLogger(sink: LogSink | "silent" = (line) => process.stdout.write(`${line}\n`)): Logger {
  if (sink === "silent") return { log() {} };
  return {
    log(level, fields) {
      sink(JSON.stringify({ t: new Date().toISOString(), level, ...fields }));
    },
  };
}

const KNOWN_METHODS = new Set(["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"]);

/** The request method if it is a standard one; arbitrary client tokens are not logged verbatim. */
export function safeMethod(method: string | undefined): string {
  return method && KNOWN_METHODS.has(method) ? method : "OTHER";
}
