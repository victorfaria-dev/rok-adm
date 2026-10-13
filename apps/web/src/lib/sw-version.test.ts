import { describe, expect, it } from "vitest";
import { cacheVersion } from "./sw-version";

const base = [
  { url: "/", bytes: "<html>home</html>" },
  { url: "/data/guide.json", bytes: '{"blocks":[1]}' },
];

describe("service worker cache version", () => {
  it("changes when a file's contents change under the same URL", () => {
    const next = [base[0]!, { url: "/data/guide.json", bytes: '{"blocks":[1,2]}' }];
    expect(cacheVersion(next)).not.toBe(cacheVersion(base));
  });

  it("changes when the URL list changes", () => {
    expect(cacheVersion([...base, { url: "/x/", bytes: "" }])).not.toBe(cacheVersion(base));
  });

  it("is stable for the same files in any order", () => {
    expect(cacheVersion([...base].reverse())).toBe(cacheVersion(base));
    expect(cacheVersion(base)).toMatch(/^[0-9a-f]{12}$/);
  });
});
