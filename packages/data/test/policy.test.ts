import { describe, expect, it } from "vitest";
import type { Fact } from "@rokadm/core";
import { DEFAULT_POLICY, factBadge, facts, getFact, isUsable, minConfidence } from "../src";
import { CONFIDENCES, STATUSES } from "../scripts/lib";

const base: Fact = {
  id: "A99-0001", domain: "A99", title: "t", kind: "mecanica", statement: "s", values: [], table: null,
  profiles: ["todos"], roles: ["todas"], stages: ["todos"], confidence: "media", status: "verificado",
  patch: "1.1.09", validUntil: "2026-08-02", invalidatedBy: null,
  sources: [{ id: "src:fandom", url: null, quote: null, accessedAt: null }, { id: "src:fandom", url: null, quote: null, accessedAt: null }, { id: "src:reddit", url: null, quote: null, accessedAt: null }],
};

describe("usability policy", () => {
  it("default: verificado AND confidence >= media", () => {
    expect(DEFAULT_POLICY).toEqual({ minConfidence: "media", allowedStatuses: ["verificado"] });
    for (const status of STATUSES) for (const confidence of CONFIDENCES) {
      expect(isUsable({ status, confidence }), `${status}/${confidence}`).toBe(status === "verificado" && confidence !== "baixa");
    }
  });

  it("accepts a custom policy", () => {
    const loose = { minConfidence: "baixa" as const, allowedStatuses: ["verificado", "organizado"] as Fact["status"][] };
    expect(isUsable({ status: "organizado", confidence: "baixa" }, loose)).toBe(true);
    expect(isUsable({ status: "bruto", confidence: "alta" }, loose)).toBe(false);
    expect(isUsable({ status: "verificado", confidence: "media" }, { ...loose, minConfidence: "alta" })).toBe(false);
  });

  it("minConfidence picks the weakest", () => {
    expect(minConfidence(["alta", "media", "alta"])).toBe("media");
    expect(minConfidence(["alta", "baixa"])).toBe("baixa");
    expect(() => minConfidence([])).toThrow();
  });

  it("matches the real dataset (C04 notes are bruto -> not usable; A03-0024 usable)", () => {
    expect(isUsable(getFact("A03-0024")!)).toBe(true);
    expect(isUsable(getFact("C04-0004")!)).toBe(false);
    expect(facts.filter((f) => isUsable(f)).every((f) => f.status === "verificado" && f.confidence !== "baixa")).toBe(true);
  });
});

describe("factBadge", () => {
  it("labels a usable fact with patch and date", () => {
    expect(factBadge(base)).toEqual({
      factId: "A99-0001", confidence: "media", status: "verificado", patch: "1.1.09", verifiedOn: "2026-08-02",
      sourceCount: 2, usable: true, label: "Verified on patch 1.1.09 · 2026-08-02",
    });
  });
  it("labels unknown patch, unverified, disputed and outdated facts", () => {
    expect(factBadge({ ...base, patch: null, validUntil: null }).label).toBe("Verified (patch unknown)");
    expect(factBadge({ ...base, confidence: "baixa" })).toMatchObject({ usable: false, label: "Unverified" });
    expect(factBadge({ ...base, status: "contestado" }).label).toBe("Disputed");
    expect(factBadge({ ...base, status: "obsoleto" }).label).toBe("Outdated");
  });
});
