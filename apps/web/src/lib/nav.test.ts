import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DESTINATIONS, isActive, SECONDARY } from "./nav";
import { profileFromCode, profileSummary } from "./profile";
import { defaultProfile, encodeProfile } from "@rokadm/core";

describe("nav", () => {
  it("has the 4 MVP destinations", () => {
    expect(DESTINATIONS.map((d) => d.label)).toEqual(["Guide", "Routine", "Commanders", "You"]);
  });

  it("marks a destination active on its path and sub-paths only", () => {
    expect(isActive("/guide/", "/guide")).toBe(true);
    expect(isActive("/guide/", "/guide/budget/")).toBe(true);
    expect(isActive("/guide/", "/guides/new-kingdom/")).toBe(false);
    expect(isActive("/me/", "/")).toBe(false);
  });

  it("secondary pages (More menu on phones, rail on desktop) start with All guides", () => {
    expect(SECONDARY.map((s) => s.label)).toEqual(["All guides", "Farms", "Governor card", "Trust & privacy", "Brand"]);
    expect(SECONDARY[0]!.href).toBe("/guides/");
    expect(isActive("/guides/", "/guides/recovery/")).toBe(true);
    expect(isActive("/guides/", "/guide/")).toBe(false);
  });

  it("the phone top bar has the More menu: a button with aria-expanded controlling the list", () => {
    const shell = readFileSync(join(__dirname, "../layouts/Shell.astro"), "utf8");
    const header = /<header class="top">[\s\S]*?<\/header>/.exec(shell)?.[0] ?? "";
    expect(header).toContain("<MoreMenu />");
    const menu = readFileSync(join(__dirname, "../components/MoreMenu.astro"), "utf8");
    expect(menu).toMatch(/<button type="button"[^>]*aria-expanded="false"[^>]*aria-controls="more-panel"/);
    expect(menu).toContain('id="more-panel"');
    expect(menu).toContain("SECONDARY.map");
    expect(menu).toMatch(/Escape[\s\S]*button\.focus\(\)/);
  });
});

describe("profile chip", () => {
  it("summarizes a saved profile", () => {
    const p = { ...defaultProfile(), spending: "f2p" as const, minutesPerDay: 30, cityHall: 12 };
    expect(profileSummary(profileFromCode(encodeProfile(p))!)).toBe("F2P · 30 min · CH 12");
  });

  it("returns null for missing or invalid codes", () => {
    expect(profileFromCode(null)).toBeNull();
    expect(profileFromCode("garbage")).toBeNull();
  });
});
