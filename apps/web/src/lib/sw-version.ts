// BUILD-TIME ONLY (astro.config.mjs). Service worker cache version: a hash of every
// precached URL *and* its file contents, so a changed /data/guide.json or page HTML
// (same URL, new bytes) ships a new cache and the old one is dropped on activate.
import { createHash } from "node:crypto";

export interface PrecacheFile {
  /** URL the service worker caches. */
  url: string;
  /** File contents. */
  bytes: Uint8Array | string;
}

export function cacheVersion(files: readonly PrecacheFile[]): string {
  const h = createHash("sha256");
  for (const f of [...files].sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0))) {
    h.update(f.url);
    h.update("\0");
    h.update(createHash("sha256").update(f.bytes).digest());
  }
  return h.digest("hex").slice(0, 12);
}
