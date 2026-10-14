import { describe, expect, it } from "vitest";
import { effectiveProfile, lifetimeTier, withEffectiveSpending } from "../src/effective-profile";
import { profile } from "./helpers";

describe("lifetimeTier (F-72 product rule)", () => {
  it("maps totals to tiers at the 12-month band floors", () => {
    expect(lifetimeTier(null)).toBeNull();
    expect(lifetimeTier(-1)).toBeNull();
    expect(lifetimeTier(0)).toBe("f2p");
    expect(lifetimeTier(59)).toBe("f2p");
    expect(lifetimeTier(60)).toBe("low");
    expect(lifetimeTier(1_199)).toBe("low");
    expect(lifetimeTier(1_200)).toBe("medium");
    expect(lifetimeTier(6_000)).toBe("high");
    expect(lifetimeTier(12_000)).toBe("whale");
    expect(lifetimeTier(60_000)).toBe("kraken");
  });
});

describe("effectiveProfile", () => {
  it("uses the declared profile when lifetime is unknown", () => {
    const e = effectiveProfile(profile({ spending: "low", lifetimeSpendUsd: null }));
    expect(e).toMatchObject({ effective: "low", source: "declared", lifetimeTier: null });
    expect(e.explanation).toMatch(/Informe o gasto total/);
  });

  it("raises a former spender who is F2P now", () => {
    const e = effectiveProfile(profile({ spending: "f2p", lifetimeSpendUsd: 10_000 }));
    expect(e).toMatchObject({ effective: "high", declared: "f2p", source: "lifetime" });
    expect(e.explanation).toContain("$10.000");
  });

  it("never lowers the declared profile", () => {
    expect(effectiveProfile(profile({ spending: "whale", lifetimeSpendUsd: 100 })).effective).toBe("whale");
  });

  it("lets the player override by hand", () => {
    const e = effectiveProfile(profile({ spending: "f2p", lifetimeSpendUsd: 10_000 }), "f2p");
    expect(e).toMatchObject({ effective: "f2p", source: "override", lifetimeTier: "high" });
  });

  it("withEffectiveSpending only changes spending", () => {
    const p = profile({ spending: "f2p", lifetimeSpendUsd: 1_500 });
    expect(withEffectiveSpending(p)).toEqual({ ...p, spending: "medium" });
  });
});
