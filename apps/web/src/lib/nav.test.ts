import { describe, expect, it } from "vitest";
import { DESTINATIONS, isActive } from "./nav";
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
