import { describe, expect, it } from "vitest";
import { ageGapDays, checkMigration, isRoute, passportPages, type MigrationInput, type MigrationRules } from "../src/tools";
import m from "../tools-data/migration.json";

const src = (x: { facts: string[]; patch: string }) => ({ facts: x.facts, patch: x.patch });
const RULES: MigrationRules = {
  chMin: { value: m.chMin.value, ...src(m.chMin) },
  cooldownDays: { value: m.cooldownDays.value, ...src(m.cooldownDays) },
  ageLimit: {
    "same-soc": { value: m.ageLimit["same-soc"].value, ...src(m.ageLimit["same-soc"]) },
    "cross-s2": { value: m.ageLimit["cross-s2"].value, ...src(m.ageLimit["cross-s2"]) },
    "cross-s3": { value: m.ageLimit["cross-s3"].value, ...src(m.ageLimit["cross-s3"]) },
  },
  passport: { bands: m.passport.bands.map((b) => ({ fromM: b.fromM, toM: b.toM, pages: b.value })), ...src(m.passport) },
  crossPower: { minM: m.crossPower.minM, maxM: m.crossPower.maxM, ...src(m.crossPower) },
  personal: src(m.personal),
  kingdom: src(m.kingdom),
};
const BANDS = RULES.passport.bands;

const OK: MigrationInput = {
  cityHall: 20, powerM: 30, inAlliance: false, troopsHome: true, resourcesProtected: true, cooldownActive: false,
  characterAgeDays: 100, kingdomAgeDays: 100, route: "same-soc",
};
const check = (patch: Partial<MigrationInput>) => checkMigration({ ...OK, ...patch }, RULES);
const failing = (patch: Partial<MigrationInput>) => check(patch).blockers.map((b) => b.id);

describe("passport pages (B06-0001): exact only at the card's data points", () => {
  it("0–10M → 1 page, including exactly 10M", () => {
    expect(passportPages(0, BANDS)).toMatchObject({ kind: "exact", pages: 1 });
    expect(passportPages(10, BANDS)).toMatchObject({ kind: "exact", pages: 1 });
  });
  it("between 10M and 50M → range 1–25", () => {
    expect(passportPages(10.01, BANDS)).toEqual({ kind: "between", low: 1, high: 25 });
    expect(passportPages(49.9, BANDS)).toEqual({ kind: "between", low: 1, high: 25 });
  });
  it("50–55M → 25 pages, including exactly 50M and 55M", () => {
    expect(passportPages(50, BANDS)).toMatchObject({ kind: "exact", pages: 25 });
    expect(passportPages(55, BANDS)).toMatchObject({ kind: "exact", pages: 25 });
  });
  it("above 55M up to exactly 100M → range 25–75 (100M is not 'above 100M')", () => {
    expect(passportPages(55.5, BANDS)).toEqual({ kind: "between", low: 25, high: 75 });
    expect(passportPages(100, BANDS)).toEqual({ kind: "between", low: 25, high: 75 });
  });
  it("above 100M → 75 pages", () => {
    expect(passportPages(100.01, BANDS)).toMatchObject({ kind: "exact", pages: 75 });
    expect(passportPages(900, BANDS)).toMatchObject({ kind: "exact", pages: 75 });
  });
  it("needs at least one band", () => {
    expect(() => passportPages(1, [])).toThrow(RangeError);
  });
});

describe("eligibility rules", () => {
  it("all good → eligible, every rule listed with its cards and patch", () => {
    const r = check({});
    expect(r.eligible).toBe(true);
    expect(r.checks.map((c) => c.id)).toEqual(["ch", "alliance", "troops", "resources", "cooldown", "age"]);
    expect(r.checks.find((c) => c.id === "age")).toMatchObject({ facts: ["B06-0003", "C04-0008"], patch: "1.1.06" });
    expect(r.checks.every((c) => c.facts.length > 0 && c.patch.length > 0)).toBe(true);
  });
  it("City Hall 15 fails, 16 passes (B06-0001)", () => {
    expect(failing({ cityHall: 15 })).toEqual(["ch"]);
    expect(check({ cityHall: 16 }).eligible).toBe(true);
  });
  it("alliance, troops, resources and cooldown each block on their own", () => {
    expect(failing({ inAlliance: true })).toEqual(["alliance"]);
    expect(failing({ troopsHome: false })).toEqual(["troops"]);
    expect(failing({ resourcesProtected: false })).toEqual(["resources"]);
    expect(failing({ cooldownActive: true })).toEqual(["cooldown"]);
  });
  it("lists every reason, not just the first", () => {
    expect(failing({ cityHall: 10, inAlliance: true, cooldownActive: true })).toEqual(["ch", "alliance", "cooldown"]);
  });
  it("same-season SoC: exactly 150 days older passes, 151 fails (1.1.06)", () => {
    expect(check({ characterAgeDays: 150, kingdomAgeDays: 0 }).eligible).toBe(true);
    expect(failing({ characterAgeDays: 151, kingdomAgeDays: 0 })).toEqual(["age"]);
  });
  it("cross-season Season 2: 80 passes, 81 fails; Season 3: 120 passes, 121 fails", () => {
    expect(check({ route: "cross-s2", characterAgeDays: 280, kingdomAgeDays: 200 }).eligible).toBe(true);
    expect(failing({ route: "cross-s2", characterAgeDays: 281, kingdomAgeDays: 200 })).toEqual(["age"]);
    expect(check({ route: "cross-s3", characterAgeDays: 420, kingdomAgeDays: 300 }).eligible).toBe(true);
    expect(failing({ route: "cross-s3", characterAgeDays: 421, kingdomAgeDays: 300 })).toEqual(["age"]);
  });
  it("a character younger than the kingdom always passes the age rule", () => {
    expect(ageGapDays(10, 400)).toBe(-390);
    expect(check({ characterAgeDays: 10, kingdomAgeDays: 400 }).eligible).toBe(true);
  });
  it("cross-season power window 10M–85M (C04-0025, 1.0.83), boundaries included", () => {
    expect(failing({ route: "cross-s2", powerM: 9.99 })).toEqual(["cross-power"]);
    expect(check({ route: "cross-s2", powerM: 10 }).eligible).toBe(true);
    expect(check({ route: "cross-s3", powerM: 85 }).eligible).toBe(true);
    expect(failing({ route: "cross-s3", powerM: 85.1 })).toEqual(["cross-power"]);
    expect(check({ route: "same-soc", powerM: 5 }).checks.some((c) => c.id === "cross-power")).toBe(false);
  });
  it("kingdom power cap and minimum only apply when given (B06-0002, B06-0004)", () => {
    expect(check({ targetPowerCapM: 0 }).checks.some((c) => c.id === "cap")).toBe(false);
    expect(check({ powerM: 35, targetPowerCapM: 35 }).eligible).toBe(true);
    expect(failing({ powerM: 36, targetPowerCapM: 35 })).toEqual(["cap"]);
    expect(failing({ powerM: 20, targetMinPowerM: 30 })).toEqual(["kingdom-min"]);
    expect(check({ powerM: 30, targetMinPowerM: 30 }).eligible).toBe(true);
  });
  it("passport pages follow displayed power, including 10M/50M/100M boundaries", () => {
    expect(check({ powerM: 10 }).passport).toMatchObject({ kind: "exact", pages: 1 });
    expect(check({ powerM: 50 }).passport).toMatchObject({ kind: "exact", pages: 25 });
    expect(check({ powerM: 100 }).passport).toEqual({ kind: "between", low: 25, high: 75 });
  });
  it("route guard", () => {
    expect(isRoute("cross-s2")).toBe(true);
    expect(isRoute("s4")).toBe(false);
  });
});
