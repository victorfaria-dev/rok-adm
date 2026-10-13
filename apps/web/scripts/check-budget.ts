// JS budget (ADR 0002): gzip size of the JS each page loads on first visit.
// Fails the build when a route goes over budget or when the full fact dataset leaks into the client.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
const ROUTE_LIMIT = 200 * 1024;
const HOME_LIMIT = 30 * 1024;
/** Key that only exists in the full generated facts dataset (packages/data/generated/facts.json): source
 * citations. The planner's slim index (packages/planner/data/facts-meta.json) is allowed in the client. */
const DATASET_MARKER = "accessedAt";

const gz = (s: string | Buffer): number => gzipSync(s).length;

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith(".html") ? [p] : [];
  });
}

/** Module graph from an entry: static imports only (dynamic imports load later, not on first visit). */
function moduleGraph(entry: string, seen = new Set<string>()): Set<string> {
  if (seen.has(entry)) return seen;
  seen.add(entry);
  const code = readFileSync(entry, "utf8");
  for (const m of code.matchAll(/(?:import|export)\s*(?:[\w*{}\s,$]+from\s*)?["']([^"']+\.js)["']/g)) {
    const spec = m[1]!;
    const next = spec.startsWith("/") ? join(DIST, spec) : resolve(dirname(entry), spec);
    moduleGraph(next, seen);
  }
  return seen;
}

let failed = false;
const rows: string[] = [];
for (const html of htmlFiles(DIST).sort()) {
  const page = readFileSync(html, "utf8");
  const route = "/" + relative(DIST, html).replace(/index\.html$/, "").replace(/\.html$/, "");
  let bytes = 0;
  const modules = new Set<string>();
  for (const m of page.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const src = /src="([^"]+)"/.exec(m[1]!)?.[1];
    if (src) moduleGraph(join(DIST, src), modules);
    else bytes += gz(m[2]!);
  }
  // Preact islands load their component and renderer from <astro-island> attributes, not <script src>.
  // client:load/idle/visible all run on the first visit, so they count.
  for (const m of page.matchAll(/<astro-island\b[^>]*>/g)) {
    for (const attr of ["component-url", "renderer-url"]) {
      const src = new RegExp(`${attr}="([^"]+)"`).exec(m[0])?.[1];
      if (src) moduleGraph(join(DIST, src), modules);
    }
  }
  for (const f of modules) {
    const code = readFileSync(f, "utf8");
    bytes += gz(code);
    if (code.includes(DATASET_MARKER)) {
      console.error(`FAIL ${route}: ${relative(DIST, f)} contains the fact dataset ("${DATASET_MARKER}")`);
      failed = true;
    }
  }
  const limit = route === "/" ? HOME_LIMIT : ROUTE_LIMIT;
  const ok = bytes <= limit;
  failed ||= !ok;
  rows.push(`${ok ? "ok  " : "FAIL"} ${route.padEnd(24)} ${(bytes / 1024).toFixed(1).padStart(6)} KB gz (limit ${limit / 1024} KB)`);
}
// Data payloads fetched by islands (/data/*.json): lean, one per guide set, never the fact dataset.
const DATA_LIMIT = 40 * 1024;
const DATA_MARKERS = [DATASET_MARKER, "invalidatedBy"];
const dataDir = join(DIST, "data");
for (const f of statSync(dataDir, { throwIfNoEntry: false })?.isDirectory() ? readdirSync(dataDir).sort() : []) {
  const text = readFileSync(join(dataDir, f), "utf8");
  const bytes = gz(text);
  const leaked = DATA_MARKERS.filter((m) => text.includes(m));
  const ok = bytes <= DATA_LIMIT && leaked.length === 0;
  failed ||= !ok;
  if (leaked.length > 0) console.error(`FAIL /data/${f}: contains dataset markers (${leaked.join(", ")})`);
  rows.push(`${ok ? "ok  " : "FAIL"} ${`/data/${f}`.padEnd(24)} ${(bytes / 1024).toFixed(1).padStart(6)} KB gz (limit ${DATA_LIMIT / 1024} KB, data)`);
}

console.log(rows.join("\n"));
if (failed) {
  console.error("JS budget check failed.");
  process.exit(1);
}
