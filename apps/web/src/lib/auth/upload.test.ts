import { defaultProfile, encodeProfile } from "@rokadm/core";
import { describe, expect, it } from "vitest";
import { FARMS_KEY } from "../farms-store";
import { STORE_KEY } from "../store";
import { WEBHOOK_KEY } from "../kingdom-store";
import { fakeSupabase } from "./fake-supabase";
import { UPLOAD_CHOICES_KEY, accountsFromDevice, deviceLabel, fingerprint, pendingOffer, performUpload, planUpload, rememberChoice } from "./upload";

class Mem {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

const U = "user-1";
const main = encodeProfile({ ...defaultProfile(), cityHall: 22, role: "lutador", kingdomStage: "kvk1" });
const farm = encodeProfile({ ...defaultProfile(), cityHall: 15, role: "farm" });

function device(): Mem {
  const st = new Mem();
  st.setItem(STORE_KEY, JSON.stringify({
    v: 1, theme: "dark", profileCode: main, commanders: { sun_tzu: { q1: "a" } },
    savedProfiles: [{ id: "p-farm", name: "Farm 1", code: farm, override: null }, { id: "p-main", name: "Main city", code: main, override: null }],
  }));
  st.setItem(FARMS_KEY, JSON.stringify({ v: 1, farms: [{ id: "f1", name: "Wood farm", role: "wood", note: "", levels: { cityHall: 17 }, gatheringUntil: null, daily: null, goal: null }], shipments: [], showHypotheses: false }));
  st.setItem(WEBHOOK_KEY, "https://discord.com/api/webhooks/secret");
  return st;
}

describe("first-login upload plan", () => {
  it("nothing to offer on an empty device (or only the default theme)", () => {
    const st = new Mem();
    expect(planUpload(st)).toBeNull();
    st.setItem(STORE_KEY, JSON.stringify({ v: 1, theme: "light" }));
    expect(planUpload(st)).toBeNull();
    expect(planUpload(null)).toBeNull();
  });
  it("cities: the active non-farm profile is main, farm profiles and /farms entries are farms", () => {
    const acc = accountsFromDevice(device());
    expect(acc.map((a) => [a.local_id, a.kind, a.city_hall])).toEqual([
      ["profile:p-farm", "farm", 15], ["profile:p-main", "main", 22], ["farm:f1", "farm", 17],
    ]);
    expect(acc[1]!.commanders).toEqual({ sun_tzu: { q1: "a" } });
    expect(acc[1]).toMatchObject({ kingdom_stage: "kvk1", spending: "f2p", profile_code: main });
    expect(acc.filter((a) => a.kind === "main")).toHaveLength(1);
  });
  it("only the active code (no saved accounts) becomes one main city", () => {
    const st = new Mem();
    st.setItem(STORE_KEY, JSON.stringify({ v: 1, theme: "dark", profileCode: main }));
    expect(accountsFromDevice(st).map((a) => [a.local_id, a.kind])).toEqual([["profile:active", "main"]]);
  });
  it("the backup never carries the Discord webhook", () => {
    const plan = planUpload(device())!;
    expect(JSON.stringify(plan.backup)).not.toContain("webhooks/secret");
    expect(plan.summary.map((s) => s.label)).toContain("Farms & shipment log");
  });
  it("asks again only when the device data changed", () => {
    const st = device();
    const plan = pendingOffer(st, U)!;
    expect(plan).not.toBeNull();
    rememberChoice(st, U, "kept_local", plan.fingerprint);
    expect(pendingOffer(st, U)).toBeNull();
    expect(pendingOffer(st, "other-user")).not.toBeNull();
    st.setItem(STORE_KEY, JSON.stringify({ v: 1, theme: "dark", profileCode: farm }));
    expect(pendingOffer(st, U)).not.toBeNull();
    expect(st.getItem(UPLOAD_CHOICES_KEY)).toContain(U);
    expect(fingerprint("a")).not.toBe(fingerprint("b"));
  });
  it("labels the device without identifying it", () => {
    expect(deviceLabel("Mozilla/5.0 (Linux; Android 14) AppleWebKit Chrome/120 Mobile Safari/537")).toBe("Chrome on Android");
    expect(deviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit Version/17 Mobile Safari/604")).toBe("Safari on iOS");
  });
});

describe("performUpload (fake client)", () => {
  it("uploads the whole backup first, then upserts cities by device id; device data untouched", async () => {
    const st = device();
    const before = JSON.stringify([...st.m]);
    const f = fakeSupabase({ session: { user: { id: U } } });
    const plan = planUpload(st)!;
    expect(await performUpload(f.client, plan, "Chrome on Android")).toEqual({ ok: true, cities: 3 });
    const ops = f.calls.map((c) => c.op);
    expect(ops.indexOf("local_imports.insert")).toBeLessThan(ops.indexOf("accounts.upsert"));
    expect(f.tables.local_imports![0]).toMatchObject({ user_id: U, device_label: "Chrome on Android" });
    expect(f.calls.find((c) => c.op === "accounts.upsert")!.args[1]).toEqual({ onConflict: "user_id,local_id" });
    // Second upload updates, does not duplicate.
    await performUpload(f.client, plan, "Chrome on Android");
    expect(f.tables.accounts).toHaveLength(3);
    expect(JSON.stringify([...st.m])).toBe(before);
  });
  it("uploads as an alt when the account already has a main from another device", async () => {
    const f = fakeSupabase({ session: { user: { id: U } }, tables: { accounts: [{ id: "x", user_id: U, kind: "main", local_id: "profile:elsewhere", name: "Other" }] } });
    await performUpload(f.client, planUpload(device())!, "x");
    expect(f.tables.accounts!.filter((a) => a.kind === "main")).toHaveLength(1);
    expect(f.tables.accounts!.find((a) => a.local_id === "profile:p-main")!.kind).toBe("alt");
  });
  it("signed out or a failed backup upload: nothing else is sent", async () => {
    expect((await performUpload(fakeSupabase().client, planUpload(device())!, "x")).ok).toBe(false);
    const f = fakeSupabase({ session: { user: { id: U } }, fail: { "local_imports:insert": { message: "boom" } } });
    expect((await performUpload(f.client, planUpload(device())!, "x")).ok).toBe(false);
    expect(f.calls.some((c) => c.op === "accounts.upsert")).toBe(false);
  });
});
