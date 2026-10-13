// JS budget (ADR 0002): gzip size of the JS each page loads on first visit.
// Fails the build when a route goes over budget or when the full fact dataset leaks into the client.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
const ROUTE_LIMIT = 200 * 1024;
const HOME_LIMIT = 30 * 1024;
/** On-demand chunks (dynamic import after a click, e.g. the 3D crest): not first-visit JS, but still capped
 * (produto/ideias-3d.md: ~150 KB of extra JS on a screen that uses 3D). */
const LAZY_LIMIT = 160 * 1024;
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

/** Dynamic import targets (import("./x.js")) found in a set of modules. */
function dynamicImports(modules: Set<string>): string[] {
  const out = new Set<string>();
  for (const f of modules) {
    for (const m of readFileSync(f, "utf8").matchAll(/\bimport\(\s*["']([^"']+\.js)["']\s*\)/g)) {
      const spec = m[1]!;
      out.add(spec.startsWith("/") ? join(DIST, spec) : resolve(dirname(f), spec));
    }
  }
  return [...out];
}

let failed = false;
const rows: string[] = [];
const lazyRows = new Map<string, string>();
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
  // Lazy chunks: the extra JS each dynamic import pulls in beyond what the page already loaded.
  for (const entry of dynamicImports(modules)) {
    const key = relative(DIST, entry);
    if (lazyRows.has(key)) continue;
    let extra = 0;
    for (const f of moduleGraph(entry)) {
      if (modules.has(f)) continue;
      const code = readFileSync(f, "utf8");
      extra += gz(code);
      if (code.includes(DATASET_MARKER)) {
        console.error(`FAIL lazy ${key}: ${relative(DIST, f)} contains the fact dataset ("${DATASET_MARKER}")`);
        failed = true;
      }
    }
    const lazyOk = extra <= LAZY_LIMIT;
    failed ||= !lazyOk;
    lazyRows.set(key, `${lazyOk ? "ok  " : "FAIL"} ${`lazy ${key.replace(/^_astro\//, "")}`.padEnd(24)} ${(extra / 1024).toFixed(1).padStart(6)} KB gz (limit ${LAZY_LIMIT / 1024} KB, on demand from ${route})`);
  }
  const limit = route === "/" ? HOME_LIMIT : ROUTE_LIMIT;
  const ok = bytes <= limit;
  failed ||= !ok;
  rows.push(`${ok ? "ok  " : "FAIL"} ${route.padEnd(24)} ${(bytes / 1024).toFixed(1).padStart(6)} KB gz (limit ${limit / 1024} KB)`);
}
rows.push(...[...lazyRows.values()].sort());
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

// F-54 screenshot reader assets (/ocr/, copied by astro.config.mjs): downloaded only after "Read the
// screenshot", never precached. The worker script is JS, so it gets the lazy-chunk cap; the full download
// (worker + the largest WebAssembly core + the English model) is capped too, so it stays phone-sized.
const OCR_DIR = join(DIST, "ocr");
const OCR_DOWNLOAD_LIMIT = 4.5 * 1024 * 1024;
if (statSync(OCR_DIR, { throwIfNoEntry: false })?.isDirectory()) {
  const size = (f: string): number => {
    const b = readFileSync(join(OCR_DIR, f));
    return f.endsWith(".gz") ? b.length : gz(b);
  };
  const files = readdirSync(OCR_DIR).sort();
  const worker = files.includes("worker.min.js") ? size("worker.min.js") : Infinity;
  const cores = files.filter((f) => /^tesseract-core-.*\.wasm\.js$/.test(f));
  const core = Math.max(0, ...cores.map(size));
  const model = files.includes("eng.traineddata.gz") ? size("eng.traineddata.gz") : Infinity;
  const total = worker + core + model;
  const sw = readFileSync(join(DIST, "sw.js"), "utf8");
  const workerOk = worker <= LAZY_LIMIT, totalOk = total <= OCR_DOWNLOAD_LIMIT && cores.length > 0, notPrecached = !sw.includes("/ocr/");
  failed ||= !(workerOk && totalOk && notPrecached);
  if (!notPrecached) console.error("FAIL /ocr/: OCR assets must not be in the service worker precache");
  rows.push(`${workerOk ? "ok  " : "FAIL"} ${"ocr worker.min.js".padEnd(24)} ${(worker / 1024).toFixed(1).padStart(6)} KB gz (limit ${LAZY_LIMIT / 1024} KB, on demand from /tools/screenshot/)`);
  rows.push(`${totalOk ? "ok  " : "FAIL"} ${"ocr download".padEnd(24)} ${(total / 1024).toFixed(1).padStart(6)} KB gz (limit ${OCR_DOWNLOAD_LIMIT / 1024} KB: worker + core + English model, after a click)`);
}

console.log(rows.join("\n"));
if (failed) {
  console.error("JS budget check failed.");
  process.exit(1);
}
