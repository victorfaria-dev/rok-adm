// @ts-check
import { cpSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
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
        const precache = files.filter((f) => f !== "/sw.js");
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
  integrations: [preact(), brandAssets(), serviceWorker()],
  // The lazy Three.js chunk for the 3D crest is ~550 KB raw (~140 KB gz); scripts/check-budget.ts caps it.
  vite: { server: { fs: { allow: [join(here, "../..")] } }, build: { chunkSizeWarningLimit: 600 } },
});
