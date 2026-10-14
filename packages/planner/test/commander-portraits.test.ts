import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  COMMANDER_PORTRAITS, PORTRAIT_ATTRIBUTION, commanderPortrait, hasCommanderPortrait,
} from "../src/commander-portraits";
import { getCommanderRelease } from "../src/commander-periods";
import { checkCommanderPortraits } from "../scripts/build-data";
import { PLANNER_DATA_DIR, REPO_ROOT } from "../scripts/research";

const manifest = readFileSync(join(PLANNER_DATA_DIR, "commander-portraits.json"), "utf8");
const periods = readFileSync(join(PLANNER_DATA_DIR, "commander-periods.json"), "utf8");

describe("commander portraits", () => {
  it("every portrait belongs to a dated commander and carries source, date and attribution", () => {
    expect(PORTRAIT_ATTRIBUTION).toBe("Rise of Kingdoms © Lilith Games");
    for (const p of COMMANDER_PORTRAITS) {
      expect(getCommanderRelease(p.id), p.id).toBeDefined();
      expect(p.sourceUrl).toMatch(/^https:\/\//);
      expect(p.retrievedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.attribution).toBe(PORTRAIT_ATTRIBUTION);
    }
  });

  it("the files in apps/web/public/commanders match the manifest", () => {
    expect(checkCommanderPortraits(manifest, periods, join(REPO_ROOT, "apps", "web", "public", "commanders"))).toEqual([]);
  });

  it("the check reports missing and orphan files", () => {
    const dir = mkdtempSync(join(tmpdir(), "portraits-"));
    writeFileSync(join(dir, "sun-tzu-96.webp"), "");
    writeFileSync(join(dir, "stray.webp"), "");
    const errors = checkCommanderPortraits(manifest, periods, dir);
    expect(errors.some((e) => e.includes("sun-tzu-192.webp"))).toBe(true);
    expect(errors.some((e) => e.includes("stray.webp is not in the manifest"))).toBe(true);
    expect(errors.some((e) => e.includes("sun-tzu-96.webp"))).toBe(false);
  });

  it("commanderPortrait gives a 1x/2x srcset, or null without a portrait", () => {
    expect(hasCommanderPortrait("sun-tzu")).toBe(true);
    expect(commanderPortrait("sun-tzu")).toEqual({
      src: "/commanders/sun-tzu-96.webp",
      srcset: "/commanders/sun-tzu-96.webp 1x, /commanders/sun-tzu-192.webp 2x",
      width: 96, height: 96, attribution: PORTRAIT_ATTRIBUTION,
    });
    expect(commanderPortrait("sun-tzu", 192)?.src).toBe("/commanders/sun-tzu-192.webp");
    expect(commanderPortrait("eulji-mundeok")).toBeNull();
  });
});
