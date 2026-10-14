import { encodeProfile, type AccountProfile } from "@rokadm/core";
import { describe, expect, it } from "vitest";
import {
  civName, farmIdFromSearch, formatAmount, formatPercent, listText, parseAmount, parseIntInRange, parsePercent, prefillFromProfile,
} from "./farms-tools";

const ok = (value: number) => ({ ok: true, value });

describe("parseAmount", () => {
  it.each([
    ["1500000", 1_500_000],
    ["1,500,000", 1_500_000],
    [" 1,500,000 ", 1_500_000],
    ["1.5m", 1_500_000],
    ["1.5M", 1_500_000],
    ["300k", 300_000],
    ["300 k", 300_000],
    ["2b", 2_000_000_000],
    [".5m", 500_000],
    ["1.1m", 1_100_000],
    ["0", 0],
    ["1,265,823", 1_265_823],
  ])("%s → %d", (text, value) => {
    expect(parseAmount(text)).toEqual(ok(value));
  });

  it("empty is null (the field is optional or not filled yet)", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("   ")).toBeNull();
  });

  it.each(["abc", "1,50,000", "1,5m", "1.", "k", "1.5x", "12,34", "1e6", "NaN", "Infinity"])("%s is an error, never NaN", (text) => {
    const r = parseAmount(text);
    expect(r).toMatchObject({ ok: false });
    expect(r && !r.ok ? r.error : "").toMatch(/1500000/);
  });

  it("negative, fractional and huge values explain how to fix them", () => {
    expect(parseAmount("-5")).toEqual({ ok: false, error: "Digite 0 ou mais." });
    expect(parseAmount("1.5")).toEqual({ ok: false, error: "Use um número inteiro de recursos." });
    expect(parseAmount("1.2345k")).toEqual({ ok: false, error: "Use um número inteiro de recursos." });
    expect(parseAmount("9999999b")).toEqual({ ok: false, error: "Esse número é grande demais." });
  });
});

describe("parseIntInRange / parsePercent", () => {
  it("levels", () => {
    expect(parseIntInRange("15", 1, 25)).toEqual(ok(15));
    expect(parseIntInRange("", 1, 25)).toBeNull();
    expect(parseIntInRange("30", 1, 25)).toEqual({ ok: false, error: "30 está fora do intervalo. Digite um número de 1 a 25." });
    expect(parseIntInRange("1.5", 1, 25)).toMatchObject({ ok: false });
  });

  it("percent → rate", () => {
    expect(parsePercent("21")).toEqual(ok(0.21));
    expect(parsePercent("21%")).toEqual(ok(0.21));
    expect(parsePercent("12.5")).toEqual(ok(0.125));
    expect(parsePercent("")).toBeNull();
    expect(parsePercent("100")).toEqual({ ok: false, error: "Digite uma porcentagem abaixo de 100." });
    expect(parsePercent("x")).toMatchObject({ ok: false });
  });
});

describe("formatting", () => {
  it("pt-BR numbers and percents", () => {
    expect(formatAmount(1_265_823)).toBe("1.265.823");
    expect(formatPercent(0.21)).toBe("21%");
    expect(formatPercent(0.125)).toBe("12,5%");
    expect(civName("byzantium")).toBe("Bizâncio");
    expect(listText(["food", "wood", "stone"])).toBe("food, wood e stone");
    expect(listText(["gold"])).toBe("gold");
  });
});

describe("prefill and query", () => {
  const profile: AccountProfile = {
    spending: "low", lifetimeSpendUsd: null, minutesPerDay: 120, sessionsPerDay: null, role: "farm",
    kingdomStage: "pre_kvk", kingdomDay: null, cityHall: 16, civilization: null, returningPlayer: false,
  };

  it("reads spending, minutes and City Hall from a profile code", () => {
    expect(prefillFromProfile(encodeProfile(profile))).toEqual({ spending: "low", minutesPerDay: 120, cityHall: 16 });
    expect(prefillFromProfile(null)).toBeNull();
    expect(prefillFromProfile("garbage")).toBeNull();
  });

  it("?farm=<id>", () => {
    expect(farmIdFromSearch("?farm=abc")).toBe("abc");
    expect(farmIdFromSearch("?farm=")).toBeNull();
    expect(farmIdFromSearch("")).toBeNull();
  });
});
