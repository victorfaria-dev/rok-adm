import { QUESTIONS, decodeProfile, type AccountProfile } from "@rokadm/core";
import { EFFECTIVE_PROFILE_RULE } from "@rokadm/planner";
import { describe, expect, it } from "vitest";
import { MAX_SAVED_PROFILES } from "./store";
import {
  NAME_MAX,
  activeAccountId,
  newAccountId,
  removeAccount,
  saveAccount,
  useAccountPatch,
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
    expect(valueOf(rows, "sessionsPerDay")).toBe("Não respondido");
    expect(valueOf(rows, "kingdomDay")).toBe("Não respondido");
    expect(valueOf(rows, "lifetimeSpendUsd")).toBe("Não respondido");
    expect(valueOf(rows, "civilization")).toBe("Not chosen yet / not sure");
    expect(valueOf(rows, "returningPlayer")).toBe("Não");
  });

  it("formats large numbers and filled optional answers", () => {
    const rows = profileRows(profile("1.5.4.4.25.1440.24.5000.10000000.china.1"));
    expect(valueOf(rows, "spending")).toBe("Kraken — $5,000+ per month");
    expect(valueOf(rows, "lifetimeSpendUsd")).toBe("10.000.000 USD");
    expect(valueOf(rows, "kingdomDay")).toBe("5.000 days");
    expect(valueOf(rows, "sessionsPerDay")).toBe("24");
    expect(valueOf(rows, "civilization")).toBe("China");
    expect(valueOf(rows, "returningPlayer")).toBe("Sim");
    expect(rows.find((r) => r.id === "lifetimeSpendUsd")!.numeric).toBe(true);
    expect(rows.find((r) => r.id === "role")!.numeric).toBe(false);
  });
});

describe("effectiveView (F-72)", () => {
  it("without total spend uses the monthly answer", () => {
    const v = effectiveView(profile("1.0.1.0.12.30.....0"), null);
    expect(v).toMatchObject({ declared: "F2P", lifetime: "Não respondido", effective: "F2P" });
    expect(v.result.source).toBe("declared");
  });

  it("total spend can raise the profile", () => {
    const v = effectiveView(profile("1.0.0.0.12.30...10000..0"), null);
    expect(v.lifetime).toBe("High (cerca de US$ 10.000 no total)");
    expect(v.effective).toBe("High (elevado pelo gasto total)");
  });

  it("a manual pick wins and says so", () => {
    const v = effectiveView(profile("1.0.0.0.12.30...10000..0"), "low");
    expect(v.effective).toBe("Low (definido à mão)");
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
    expect(OVERRIDE_CHOICES[0]!.label).toBe("Automático (recomendado)");
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
    expect(THEME_CHOICES.map((t) => t.label)).toEqual(["Escuro", "Claro", "Sistema"]);
    expect(isThemePref("light")).toBe(true);
    expect(isThemePref("neon")).toBe(false);
  });

  it("names the export file with the local date", () => {
    expect(exportFileName(new Date(2026, 0, 5, 23, 59))).toBe("kingdomops-2026-01-05.json");
    expect(exportFileName(new Date(2026, 9, 13, 0, 1))).toBe("kingdomops-2026-10-13.json");
  });
});

describe("saved accounts", () => {
  const A = "1.0.0.0.12.30.....0";
  const B = "1.0.1.0.8.15.....0";

  it("saves, replaces by name and validates", () => {
    let r = saveAccount([], "  Main  ", A, null, "id1");
    expect(r).toEqual({ ok: true, list: [{ id: "id1", name: "Main", code: A, override: null }] });
    if (!r.ok) throw new Error();
    r = saveAccount(r.list, "main", B, "low", "id2");
    expect(r.ok && r.list).toEqual([{ id: "id1", name: "main", code: B, override: "low" }]);
    expect(saveAccount([], " ", A, null, "x")).toMatchObject({ ok: false, error: expect.stringMatching(/nome/) });
    expect(saveAccount([], "x".repeat(NAME_MAX + 1), A, null, "x")).toMatchObject({ ok: false });
  });

  it("caps the list", () => {
    const full = Array.from({ length: MAX_SAVED_PROFILES }, (_, i) => ({ id: `i${i}`, name: `F${i}`, code: A, override: null }));
    expect(saveAccount(full, "New", A, null, "n")).toMatchObject({ ok: false, error: expect.stringMatching(/Remova uma/) });
  });

  it("finds the active account, removes and switches", () => {
    const list = [
      { id: "m", name: "Main", code: A, override: "whale" as const },
      { id: "f", name: "Farm", code: B, override: null },
    ];
    expect(activeAccountId(list, B, null)).toBe("f");
    expect(activeAccountId(list, A, null)).toBeNull();
    expect(removeAccount(list, "m").map((p) => p.id)).toEqual(["f"]);
    expect(useAccountPatch(list[0]!)).toEqual({ profileCode: A, profileOverride: "whale", draft: null });
    expect(newAccountId(new Date(0), () => 0.5)).toMatch(/^[0-9a-z]+$/);
  });
});
