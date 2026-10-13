// Local entry point: `pnpm api:dev` from the repo root.
import { startServer } from "./app";
import { loadConfig } from "./config";

const config = loadConfig(process.env);
const app = await startServer(config);
const host = config.host.includes(":") ? `[${config.host}]` : config.host;
app.log.log("info", { msg: "listening", addr: `${host}:${app.port}` });

let stopping = false;
const stop = (): void => {
  if (stopping) return;
  stopping = true;
  app.log.log("info", { msg: "shutting down" });
  void app.close().then(() => process.exit(0));
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
