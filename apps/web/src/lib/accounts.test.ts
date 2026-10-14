import { describe, expect, it } from "vitest";
import { accountsOf, activeAccount, migrationPatch, switchAccountPatch, withActiveCode } from "./accounts";
import { cityAlerts } from "./city-hall";
import { defaultStore, parseStore, type StoreV1 } from "./store";

const A = "1.0.0.0.12.30.....0";
const B = "1.0.1.0.8.15.....0";
const make = (p: Partial<StoreV1>): StoreV1 => ({ ...defaultStore(), ...p });

describe("accounts (UX stage 1)", () => {
  it("migrates an older single profile to account #1 'Principal', and the code still decodes", () => {
    const s = parseStore(JSON.stringify({ v: 1, profileCode: A }));
    expect(s.activeAccountId).toBeNull();
    const v = accountsOf(s);
    expect(v).toEqual({ accounts: [{ id: "main", name: "Principal", code: A, override: null, kind: "main" }], activeId: "main", migrated: true });
    expect(migrationPatch(s)).toEqual({ savedProfiles: v.accounts, activeAccountId: "main" });
    expect(migrationPatch(make({ ...s, ...migrationPatch(s)! }))).toBeNull();
  });

  it("older saves with named accounts: the one matching profileCode is active, no duplicate", () => {
    const s = make({ profileCode: B, savedProfiles: [{ id: "m", name: "Main", code: A, override: null }, { id: "f", name: "Farm", code: B, override: null }] });
    expect(accountsOf(s).activeId).toBe("f");
    expect(accountsOf(s).accounts).toHaveLength(2);
  });

  it("no profile: no accounts, nothing to migrate", () => {
    expect(accountsOf(defaultStore())).toEqual({ accounts: [], activeId: null, migrated: false });
    expect(migrationPatch(defaultStore())).toBeNull();
  });

  it("switching keeps each account's own commander answers and routine ticks", () => {
    const s = make({
      profileCode: A, activeAccountId: "m",
      commanders: { "sun-tzu": { purpose: "field_main" } },
      routine: { date: "2026-10-13", done: ["daily-objectives"] },
      savedProfiles: [
        { id: "m", name: "Main", code: A, override: null },
        { id: "f", name: "Farm", code: B, override: null, commanders: { cao: { purpose: "gathering" } }, routine: null },
      ],
    });
    const toFarm = switchAccountPatch(s, "f")!;
    expect(toFarm.profileCode).toBe(B);
    expect(toFarm.commanders).toEqual({ cao: { purpose: "gathering" } });
    expect(toFarm.routine).toBeNull();
    const farm = make({ ...s, ...toFarm });
    expect(activeAccount(farm)?.name).toBe("Farm");
    const back = make({ ...farm, ...switchAccountPatch(farm, "m")! });
    expect(back.profileCode).toBe(A);
    expect(back.commanders).toEqual({ "sun-tzu": { purpose: "field_main" } });
    expect(back.routine).toEqual({ date: "2026-10-13", done: ["daily-objectives"] });
    expect(switchAccountPatch(s, "nope")).toBeNull();
  });

  it("per-account data survives a save and reload", () => {
    const s = make({ savedProfiles: [{ id: "f", name: "Farm", code: B, override: null, commanders: { cao: { a: "b" } }, routine: { date: "2026-10-13", done: ["x"] } }], activeAccountId: "f" });
    const back = parseStore(JSON.stringify(s));
    expect(back.savedProfiles[0]).toEqual(s.savedProfiles[0]);
    expect(back.activeAccountId).toBe("f");
  });

  it("a new code for the account in use updates that account", () => {
    const s = make({ profileCode: A, activeAccountId: "m", savedProfiles: [{ id: "m", name: "Main", code: A, override: null }] });
    expect(withActiveCode(s, B)).toEqual({ profileCode: B, activeAccountId: "m", savedProfiles: [{ id: "m", name: "Main", code: B, override: null }] });
    expect(withActiveCode(defaultStore(), B).profileCode).toBe(B);
  });
});

describe("City Hall alerts", () => {
  const base = { hasProfile: true, mustDoMissing: 0, budgetMinutes: 30, warnings: [] as string[], kingdomDay: null, kvk1Day: 100, unreadableNext: false };
  it("are built only from planner and core signals", () => {
    expect(cityAlerts(base)).toEqual([]);
    expect(cityAlerts({ ...base, hasProfile: false })[0]?.kind).toBe("setup");
    expect(cityAlerts({ ...base, mustDoMissing: 2 })[0]?.text).toBe("2 tarefas essenciais não cabem em 30 min hoje.");
    expect(cityAlerts({ ...base, warnings: ["w"] })[0]).toEqual({ kind: "warning", text: "w" });
    expect(cityAlerts({ ...base, kingdomDay: 200 })[0]?.kind).toBe("late");
  });
});
