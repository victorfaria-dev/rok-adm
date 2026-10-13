// /trust/ "What data we store" must list every local store by the manifest's plain-language name (Q2 P1-3).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { USER_DATA_KEYS } from "./storage-keys";

const md = readFileSync(new URL("../../../../content/legal/trust-and-privacy.md", import.meta.url), "utf8");
const section = md.slice(md.indexOf("## 1. What data we store"), md.indexOf("## 2."));

describe("trust page data list", () => {
  it("keeps the legal-review banner", () => {
    expect(md).toContain("**DRAFT — needs legal review before monetization.**");
  });

  it("names every store from lib/storage-keys.ts, each under its own heading", () => {
    for (const k of USER_DATA_KEYS) expect(section, k.key).toContain(`#### ${k.name}\n`);
  });

  it("covers Discord, on-device OCR, the offline copy, other players' data and how to delete", () => {
    expect(section).toMatch(/Discord/);
    expect(section).toMatch(/OCR\) runs \*\*on your device\*\*/);
    expect(section).toMatch(/image never leaves your browser/);
    expect(section).toMatch(/Offline copy/);
    expect(section).toMatch(/other players' governor names and scores/);
    expect(section).toContain("Delete all data");
    expect(section).toContain("Back up everything");
  });
});
