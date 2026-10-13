import { QUESTIONS, decodeProfile, type AccountProfile } from "@rokadm/core";
import { EFFECTIVE_PROFILE_RULE } from "@rokadm/planner";
import { describe, expect, it } from "vitest";
import {
  OVERRIDE_CHOICES,
  RULE_BODY,
  THEME_CHOICES,
  effectiveView,
  exportFileName,
  isThemePref,
  overrideValue,
  parseOverride,
  profileRows,
} from "./me";

function profile(code: string): AccountProfile {
  const r = decodeProfile(code);
  if (!("profile" in r)) throw new Error(JSON.stringify(r.errors));
  return r.profile;
}

const valueOf = (rows: ReturnType<typeof profileRows>, id: string): string => rows.find((r) => r.id === id)!.value;

describe("profileRows", () => {
  it("lists every question in order with the core label", () => {
    const rows = profileRows(profile("1.0.1.0.12.30.....0"));
    expect(rows.map((r) => r.id)).toEqual(QUESTIONS.map((q) => q.id));
    expect(rows.map((r) => r.label)).toEqual(QUESTIONS.map((q) => q.label));
  });

  it("says each answer in words: options, numbers with units, yes/no and not answered", () => {
    const rows = profileRows(profile("1.0.1.0.12.30.....0"));
    expect(valueOf(rows, "spending")).toBe("F2P — $0 per month");
    expect(valueOf(rows, "role")).toBe("Farm account");
    expect(valueOf(rows, "kingdomStage")).toBe("Before the first KvK");
    expect(valueOf(rows, "cityHall")).toBe("12");
    expect(valueOf(rows, "minutesPerDay")).toBe("30 min");
    expect(valueOf(rows, "sessionsPerDay")).toBe("Not answered");
    expect(valueOf(rows, "kingdomDay")).toBe("Not answered");
    expect(valueOf(rows, "lifetimeSpendUsd")).toBe("Not answered");
    expect(valueOf(rows, "civilization")).toBe("Not chosen yet / not sure");
    expect(valueOf(rows, "returningPlayer")).toBe("No");
  });

  it("formats large numbers and filled optional answers", () => {
    const rows = profileRows(profile("1.5.4.4.25.1440.24.5000.10000000.china.1"));
    expect(valueOf(rows, "spending")).toBe("Kraken — $5,000+ per month");
    expect(valueOf(rows, "lifetimeSpendUsd")).toBe("10,000,000 USD");
    expect(valueOf(rows, "kingdomDay")).toBe("5,000 days");
    expect(valueOf(rows, "sessionsPerDay")).toBe("24");
    expect(valueOf(rows, "civilization")).toBe("China");
    expect(valueOf(rows, "returningPlayer")).toBe("Yes");
    expect(rows.find((r) => r.id === "lifetimeSpendUsd")!.numeric).toBe(true);
    expect(rows.find((r) => r.id === "role")!.numeric).toBe(false);
  });
});

describe("effectiveView (F-72)", () => {
  it("without total spend uses the monthly answer", () => {
    const v = effectiveView(profile("1.0.1.0.12.30.....0"), null);
    expect(v).toMatchObject({ declared: "F2P", lifetime: "Not answered", effective: "F2P" });
    expect(v.result.source).toBe("declared");
  });

  it("total spend can raise the profile", () => {
    const v = effectiveView(profile("1.0.0.0.12.30...10000..0"), null);
    expect(v.lifetime).toBe("High (about $10,000 in total)");
    expect(v.effective).toBe("High (raised by total spend)");
  });

  it("a manual pick wins and says so", () => {
    const v = effectiveView(profile("1.0.0.0.12.30...10000..0"), "low");
    expect(v.effective).toBe("Low (set by hand)");
    expect(v.result.explanation).toContain("by hand");
  });

  it("rule body drops the label the page shows separately", () => {
    expect(EFFECTIVE_PROFILE_RULE.startsWith("Product rule, not a game fact")).toBe(true);
    expect(RULE_BODY.startsWith("Past spending counts as one year")).toBe(true);
    expect(RULE_BODY).not.toContain("not a game fact");
  });
});

describe("override choices", () => {
  it("Automatic first, then the six profiles with their monthly bands", () => {
    expect(OVERRIDE_CHOICES.map((c) => c.value)).toEqual(["auto", "f2p", "low", "medium", "high", "whale", "kraken"]);
    expect(OVERRIDE_CHOICES[0]!.label).toBe("Automatic (recommended)");
    expect(OVERRIDE_CHOICES[2]!.label).toBe("Low spender — $5–$100 per month");
  });

  it("round-trips radio values and stored overrides", () => {
    expect(parseOverride("auto")).toBeNull();
    expect(parseOverride("whale")).toBe("whale");
    expect(parseOverride("nonsense")).toBeNull();
    expect(overrideValue(null)).toBe("auto");
    expect(overrideValue("kraken")).toBe("kraken");
  });
});

describe("theme and export", () => {
  it("offers Dark, Light and System", () => {
    expect(THEME_CHOICES.map((t) => t.label)).toEqual(["Dark", "Light", "System"]);
    expect(isThemePref("light")).toBe(true);
    expect(isThemePref("neon")).toBe(false);
  });

  it("names the export file with the local date", () => {
    expect(exportFileName(new Date(2026, 0, 5, 23, 59))).toBe("kingdomops-2026-01-05.json");
    expect(exportFileName(new Date(2026, 9, 13, 0, 1))).toBe("kingdomops-2026-10-13.json");
  });
});
