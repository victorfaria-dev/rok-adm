import { describe, expect, it } from "vitest";
import {
  addDays, formatDuration, levelsSummary, localDay, memoryStorage, parseLevel, parseTaxPercent, parseWhole,
  taxPercentText, timeInputValue, untilAtLocalTime, untilInHours, validateFarmForm,
} from "./farms-hub";
import { emptyLevels } from "./farms-store";

describe("farms-hub helpers", () => {
  it("localDay uses local time; addDays crosses months", () => {
    expect(localDay(new Date(2026, 9, 13, 23, 59))).toBe("2026-10-13");
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-02", -7)).toBe("2026-02-23");
  });

  it("formatDuration", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(80)).toBe("1 h 20 min");
  });

  it("untilInHours and untilAtLocalTime (today if later, else tomorrow)", () => {
    const now = new Date(2026, 9, 13, 10, 0);
    expect(Date.parse(untilInHours(now, 2)) - now.getTime()).toBe(2 * 3_600_000);
    const later = new Date(untilAtLocalTime(now, "14:30")!);
    expect([later.getDate(), later.getHours(), later.getMinutes()]).toEqual([13, 14, 30]);
    const tomorrow = new Date(untilAtLocalTime(now, "09:00")!);
    expect([tomorrow.getDate(), tomorrow.getHours()]).toEqual([14, 9]);
    expect(untilAtLocalTime(now, "25:00")).toBeNull();
    expect(untilAtLocalTime(now, "")).toBeNull();
    expect(timeInputValue(later.toISOString())).toBe("14:30");
    expect(timeInputValue(null)).toBe("");
  });

  it("parseWhole accepts thousands separators and rejects decimals", () => {
    expect(parseWhole("")).toBeNull();
    expect(parseWhole("1,200,000")).toBe(1_200_000);
    expect(parseWhole(" 500 000 ")).toBe(500_000);
    expect(parseWhole("1.5")).toBeNaN();
    expect(parseWhole("-3")).toBeNaN();
  });

  it("parseLevel uses FARM_LEVEL_RANGES", () => {
    expect(parseLevel("cityHall", "")).toEqual({ ok: true, value: null });
    expect(parseLevel("cityHall", "25")).toEqual({ ok: true, value: 25 });
    expect(parseLevel("cityHall", "26")).toMatchObject({ ok: false, error: expect.stringContaining("1 a 25") });
    expect(parseLevel("commanderLevel", "60")).toEqual({ ok: true, value: 60 });
    expect(parseLevel("commanderLevel", "61").ok).toBe(false);
  });

  it("validateFarmForm reports each bad field", () => {
    const levels = { cityHall: "30", tradingPost: "", goldmine: "", academy: "x", commanderLevel: "" };
    const r = validateFarmForm({ name: "  ", role: "food", note: "n".repeat(201), levels });
    expect(r.value).toBeNull();
    expect(Object.keys(r.errors).sort()).toEqual(["academy", "cityHall", "name", "note"]);
    const ok = validateFarmForm({ name: " Farm 1 ", role: "wood", note: "", levels: { ...levels, cityHall: "12", academy: "" } });
    expect(ok.value).toEqual({ name: "Farm 1", role: "wood", note: "", levels: { ...emptyLevels(), cityHall: 12 } });
    expect(validateFarmForm({ name: "x".repeat(41), role: "general", note: "", levels: { ...levels, cityHall: "", academy: "" } }).errors.name).toMatch(/40/);
  });

  it("parseTaxPercent / taxPercentText", () => {
    expect(parseTaxPercent("21")).toEqual({ ok: true, rate: 0.21 });
    expect(parseTaxPercent("12.5%")).toEqual({ ok: true, rate: 0.125 });
    expect(parseTaxPercent("0")).toEqual({ ok: true, rate: 0 });
    expect(parseTaxPercent("100").ok).toBe(false);
    expect(parseTaxPercent("").ok).toBe(false);
    expect(taxPercentText(0.35)).toBe("35");
    expect(taxPercentText(0.125)).toBe("12.5");
  });

  it("levelsSummary lists only saved levels", () => {
    expect(levelsSummary(emptyLevels())).toBe("");
    expect(levelsSummary({ ...emptyLevels(), cityHall: 12, tradingPost: 5 })).toBe("Prefeitura 12 · Entreposto Comercial 5");
  });

  it("memoryStorage behaves like a tiny localStorage", () => {
    const st = memoryStorage();
    expect(st.getItem("a")).toBeNull();
    st.setItem("a", "1");
    expect(st.getItem("a")).toBe("1");
    st.removeItem("a");
    expect(st.getItem("a")).toBeNull();
  });
});
