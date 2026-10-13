// @ts-check
import { cpSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import { cacheVersion } from "./src/lib/sw-version.ts";

const here = dirname(fileURLToPath(import.meta.url));
const brand = join(here, "../../design/brand/export");

/** Copy favicons/app icons from the brand kit and write the web manifest (public/ is generated). */
function brandAssets() {
  return {
    name: "ko-brand-assets",
    hooks: {
      "astro:config:setup": () => {
        const out = join(here, "public/icons");
        mkdirSync(out, { recursive: true });
        cpSync(brand, out, { recursive: true });
        const manifest = {
          name: "KingdomOps", short_name: "KingdomOps", start_url: "/", scope: "/", display: "standalone",
          background_color: "#101214", theme_color: "#101214",
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "/icons/favicon.svg", sizes: "any", type: "image/svg+xml" },
          ],
        };
        writeFileSync(join(here, "public/manifest.webmanifest"), JSON.stringify(manifest, null, 2));
      },
    },
  };
}

/**
 * Experimental screenshot reader (F-54): copy the Tesseract worker, the LSTM-only WebAssembly cores and
 * the English model from node_modules into public/ocr/, so OCR runs from our own origin (no CDN at runtime).
 * public/ocr/ is generated (gitignored) and left out of the service worker precache (~4 MB, on demand only).
 */
function ocrAssets() {
  return {
    name: "ko-ocr-assets",
    hooks: {
      "astro:config:setup": () => {
        const require = createRequire(import.meta.url);
        const tjs = dirname(require.resolve("tesseract.js/package.json"));
        const core = dirname(require.resolve("tesseract.js-core/package.json", { paths: [tjs] }));
        const eng = dirname(require.resolve("@tesseract.js-data/eng/package.json"));
        const out = join(here, "public/ocr");
        mkdirSync(out, { recursive: true });
        cpSync(join(tjs, "dist/worker.min.js"), join(out, "worker.min.js"));
        for (const v of ["lstm", "simd-lstm", "relaxedsimd-lstm"]) cpSync(join(core, `tesseract-core-${v}.wasm.js`), join(out, `tesseract-core-${v}.wasm.js`));
        cpSync(join(eng, "4.0.0_best_int/eng.traineddata.gz"), join(out, "eng.traineddata.gz"));
      },
    },
  };
}

/** Write dist/sw.js that precaches every built file, so MVP routes open offline after the first visit. */
function serviceWorker() {
  return {
    name: "ko-service-worker",
    hooks: {
      "astro:build:done": ({ dir }) => {
        const root = fileURLToPath(dir);
        const files = [];
        const walk = (d) => {
          for (const f of readdirSync(d)) {
            const p = join(d, f);
            if (statSync(p).isDirectory()) walk(p);
            else files.push("/" + relative(root, p).split("\\").join("/"));
          }
        };
        walk(root);
        // Mascot clips (120–280 KB each, Range requests) stay out of the precache: network on demand,
        // the poster (small) is precached so the avatar still shows offline.
        const precache = files.filter((f) => f !== "/sw.js" && !f.startsWith("/ocr/") && !/^\/mascot\/.*\.mp4$/.test(f));
        const urls = precache.map((f) => f.replace(/index\.html$/, ""));
        // Hash contents too: a file whose bytes change under the same URL (e.g. /data/guide.json) must bust the cache.
        const version = cacheVersion(precache.map((f, i) => ({ url: urls[i], bytes: readFileSync(join(root, f.slice(1))) })));
        const sw = `// Generated at build. Cache version ${version}.
const CACHE = "ko-${version}";
const PRECACHE = ${JSON.stringify(urls)};
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    // Network first for pages (fresh content), cache when offline.
    e.respondWith(fetch(req).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("/404.html"))));
    return;
  }
  e.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
`;
        writeFileSync(join(root, "sw.js"), sw);
      },
    },
  };
}

export default defineConfig({
  site: "https://kingdomops.example",
  trailingSlash: "always",
  build: { format: "directory" },
  // UX stage 1: old URLs keep working as static redirect pages (meta refresh, precached for offline).
  redirects: {
    "/more/": "/",
    "/routine/": "/city-hall/today/",
  },
  integrations: [preact(), brandAssets(), ocrAssets(), serviceWorker()],
  // The lazy Three.js chunk for the 3D crest is ~550 KB raw (~140 KB gz); scripts/check-budget.ts caps it.
  vite: { server: { fs: { allow: [join(here, "../..")] } }, build: { chunkSizeWarningLimit: 600 } },
});
