import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FOOTER_LINKS, HOME_FOR, LEADER_NAV, PLAYER_NAV, activeTab, isActive } from "./nav";
import { LANDING_REDIRECT_SCRIPT, ROLE_BOOT_SCRIPT } from "./role";
import { profileFromCode, profileSummary } from "./profile";
import { defaultProfile, encodeProfile } from "@rokadm/core";

describe("nav (UX stage 1)", () => {
  it("player tabs: City Hall · Guides · Tools · Me", () => {
    expect(PLAYER_NAV.map((d) => d.label)).toEqual(["City Hall", "Guides", "Tools", "Me"]);
  });

  it("leader tabs: Kingdom · Members · Events · Guides · Me (at most 5, each with an icon)", () => {
    expect(LEADER_NAV.map((d) => d.label)).toEqual(["Kingdom", "Members", "Events", "Guides", "Me"]);
    for (const nav of [PLAYER_NAV, LEADER_NAV]) {
      expect(nav.length).toBeLessThanOrEqual(5);
      for (const d of nav) expect(d.icon).toBeTruthy();
    }
  });

  it("marks a prefix active on its path and sub-paths only", () => {
    expect(isActive("/guide/", "/guide")).toBe(true);
    expect(isActive("/guide/", "/guide/budget/")).toBe(true);
    expect(isActive("/guide/", "/guides/new-kingdom/")).toBe(false);
    expect(isActive("/me/", "/")).toBe(false);
  });

  it("files every guide page under Guides, whatever its URL", () => {
    for (const nav of [PLAYER_NAV, LEADER_NAV]) {
      for (const p of ["/guides/", "/guide/", "/guides/farms/food/", "/glossary/", "/changes/", "/tools/safety/", "/tools/zeroed/"]) {
        expect(activeTab(nav, p), p).toBe("/guides/");
      }
    }
  });

  it("player: City Hall owns /routine/ and its full list; Tools owns farms and commanders; Me owns the share card", () => {
    expect(activeTab(PLAYER_NAV, "/city-hall/today/")).toBe("/city-hall/");
    expect(activeTab(PLAYER_NAV, "/routine/")).toBe("/city-hall/");
    expect(activeTab(PLAYER_NAV, "/tools/pack-value/")).toBe("/tools/");
    expect(activeTab(PLAYER_NAV, "/farms/log/")).toBe("/tools/");
    expect(activeTab(PLAYER_NAV, "/commanders/")).toBe("/tools/");
    expect(activeTab(PLAYER_NAV, "/card/")).toBe("/me/");
    expect(activeTab(PLAYER_NAV, "/crest/")).toBe("/me/");
    expect(activeTab(PLAYER_NAV, "/")).toBeNull();
  });

  it("leader: Members = requirements + recruiting, Events = MGE + KvK planner, crest under Kingdom", () => {
    expect(activeTab(LEADER_NAV, "/kingdom/")).toBe("/kingdom/");
    expect(activeTab(LEADER_NAV, "/kingdom/rules/")).toBe("/kingdom/");
    expect(activeTab(LEADER_NAV, "/crest/")).toBe("/kingdom/");
    expect(activeTab(LEADER_NAV, "/kingdom/requirements/")).toBe("/kingdom/requirements/");
    expect(activeTab(LEADER_NAV, "/kingdom/recruit/")).toBe("/kingdom/requirements/");
    expect(activeTab(LEADER_NAV, "/kingdom/mge/")).toBe("/kingdom/mge/");
    expect(activeTab(LEADER_NAV, "/tools/kvk/")).toBe("/kingdom/mge/");
    expect(activeTab(LEADER_NAV, "/card/")).toBe("/me/");
  });

  it("home tabs and footer: Brand and Trust are off-nav, in the footer only", () => {
    expect(HOME_FOR).toEqual({ player: "/city-hall/", leader: "/kingdom/" });
    const tabs = [...PLAYER_NAV, ...LEADER_NAV].map((d) => d.href);
    for (const off of ["/brand/", "/trust/", "/more/"]) expect(tabs).not.toContain(off);
    expect(FOOTER_LINKS.map((l) => l.href)).toEqual(expect.arrayContaining(["/trust/", "/brand/"]));
  });

  it("the shell renders both tab sets and no More menu", () => {
    const shell = readFileSync(join(__dirname, "../layouts/Shell.astro"), "utf8");
    expect(shell).not.toContain("MoreMenu");
    expect(shell).toContain("PLAYER_NAV");
    expect(shell).toContain("LEADER_NAV");
    expect(shell).toContain("ROLE_BOOT_SCRIPT");
  });
});

describe("role boot scripts", () => {
  const run = (script: string, stored: unknown, search = "") => {
    const attrs: Record<string, string> = {};
    let replaced: string | null = null;
    const fn = new Function("localStorage", "document", "location", script);
    fn(
      { getItem: () => (stored === undefined ? null : JSON.stringify(stored)) },
      { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } },
      { search, replace: (u: string) => (replaced = u) },
    );
    return { attrs, replaced };
  };

  it("sets data-role from the store, player by default", () => {
    expect(run(ROLE_BOOT_SCRIPT, undefined).attrs["data-role"]).toBe("player");
    expect(run(ROLE_BOOT_SCRIPT, { v: 1, playingAs: "leader" }).attrs["data-role"]).toBe("leader");
    expect(run(ROLE_BOOT_SCRIPT, { v: 1, playingAs: "king" }).attrs["data-role"]).toBe("player");
  });

  it("sends a returning visitor to their home tab, unless ?about", () => {
    expect(run(LANDING_REDIRECT_SCRIPT, undefined).replaced).toBeNull();
    expect(run(LANDING_REDIRECT_SCRIPT, { v: 1, profileCode: "x" }).replaced).toBe("/city-hall/");
    expect(run(LANDING_REDIRECT_SCRIPT, { v: 1, profileCode: "x", playingAs: "leader" }).replaced).toBe("/kingdom/");
    expect(run(LANDING_REDIRECT_SCRIPT, { v: 1, profileCode: "x" }, "?about").replaced).toBeNull();
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
