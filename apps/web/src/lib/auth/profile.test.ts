import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { deleteAccount, exportAccountData } from "./account-data";
import { fakeSupabase } from "./fake-supabase";
import { QUALITY_STEPS, encodeToFit, planCrop } from "./image";
import {
  addSelfAchievement, blockUser, claimSiteAchievements, getProfileByHandle, publicImageUrl, replaceProfileImage, reportUser, saveMyProfile, sortAchievements,
} from "./profile-api";
import { IMAGE_KINDS, SITE_ACHIEVEMENTS, achievementCode, checkInputImage, isReservedHandle, validateProfile, validateSelfAchievement, type ProfileDraft } from "./profile-rules";

const sql = (f: string) => readFileSync(new URL(`../../../../../supabase/migrations/${f}`, import.meta.url), "utf8");
const U = "11111111-1111-1111-1111-111111111111";
const draft = (d: Partial<ProfileDraft> = {}): ProfileDraft => ({ handle: "alice", displayName: "Alice", bio: "", kingdom: "", visibility: "private", ...d });

describe("profile rules", () => {
  it("validates and cleans a draft", () => {
    expect(validateProfile(draft({ handle: " @Alice ", kingdom: "1234", bio: " hi " }))).toEqual({
      ok: true, value: { handle: "alice", display_name: "Alice", bio: "hi", kingdom_number: 1234, visibility: "private" },
    });
    const bad = validateProfile(draft({ handle: "a", kingdom: "0", bio: "join https://x.test", displayName: "x".repeat(41) }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.errors).sort()).toEqual(["bio", "displayName", "handle", "kingdom"]);
    // Showing a profile needs a handle; private does not.
    expect(validateProfile(draft({ handle: "", visibility: "public" })).ok).toBe(false);
    expect(validateProfile(draft({ handle: "", visibility: "private" })).ok).toBe(true);
  });
  it("reserved handles match the database rule", () => {
    for (const h of ["admin", "lilith_games", "kingdomops", "x_official", "me", "api"]) expect(isReservedHandle(h), h).toBe(true);
    expect(isReservedHandle("alice")).toBe(false);
    const db = sql("20261013200001_community_core.sql");
    for (const w of ["lilith", "kingdomops", "official", "admin", "moderator", "support", "staff", "system", "riseofkingdoms"]) expect(db).toContain(w);
  });
  it("image limits match the storage buckets", () => {
    const db = sql("20261013200006_storage.sql");
    expect(db).toContain(`('avatars', 'avatars', true, ${IMAGE_KINDS.avatar.maxBytes}`);
    expect(db).toContain(`('banners', 'banners', true, ${IMAGE_KINDS.banner.maxBytes}`);
    expect(checkInputImage({ type: "image/gif", size: 10 })).toMatch(/JPEG, PNG or WebP/);
    expect(checkInputImage({ type: "image/png", size: 16 * 1024 * 1024 })).toMatch(/15 MB/);
    expect(checkInputImage({ type: "image/jpeg", size: 1000 })).toBeNull();
  });
  it("self-declared achievements: no links, unique codes", () => {
    expect(validateSelfAchievement("", "")).toMatch(/Type/);
    expect(validateSelfAchievement("CH25", "see www.x.test")).toMatch(/Links/);
    expect(achievementCode("Won KvK!", ["won-kvk"])).toBe("won-kvk-2");
  });
  it("site achievements match the database function", () => {
    const db = sql("20261013200004_achievements.sql");
    for (const a of SITE_ACHIEVEMENTS) expect(db).toContain(`when '${a.code}' then`);
  });
});

describe("image resize plan", () => {
  it("center-crops to the target shape and never upscales", () => {
    expect(planCrop(4000, 3000, 256, 256)).toEqual({ sx: 500, sy: 0, sw: 3000, sh: 3000, width: 256, height: 256 });
    expect(planCrop(1000, 1000, 1500, 500)).toEqual({ sx: 0, sy: 333, sw: 1000, sh: 333, width: 1000, height: 333 });
    expect(planCrop(100, 50, 256, 256)).toMatchObject({ width: 50, height: 50 });
    expect(() => planCrop(0, 10, 1, 1)).toThrow();
  });
  it("lowers quality until it fits, falls back to JPEG when WebP is not supported", async () => {
    const sizes: string[] = [];
    const fits = await encodeToFit(async (type, q) => { sizes.push(`${type}@${q}`); return new Blob([new Uint8Array(q > 0.7 ? 900 : 400)], { type }); }, 500);
    expect(fits?.type).toBe("image/webp");
    expect(sizes).toEqual(["image/webp@0.85", "image/webp@0.75", "image/webp@0.65"]);
    // Browser returns PNG for WebP: go to JPEG.
    const jpeg = await encodeToFit(async (type) => new Blob([new Uint8Array(10)], { type: type === "image/webp" ? "image/png" : type }), 500);
    expect(jpeg?.type).toBe("image/jpeg");
    expect(await encodeToFit(async (type) => new Blob([new Uint8Array(1000)], { type }), 10)).toBeNull();
    expect(QUALITY_STEPS[0]).toBeLessThan(1);
  });
});

describe("profile api (fake client)", () => {
  const profile = { id: U, handle: "alice", display_name: "Alice", bio: null, kingdom_number: 12, avatar_path: `${U}/avatar-1.webp`, banner_path: null, visibility: "public", verified_level: 1, created_at: "", updated_at: "" };
  it("loads a profile by handle with achievements, site first", async () => {
    const f = fakeSupabase({
      tables: {
        profiles: [profile],
        achievements: [
          { id: "a1", user_id: U, source: "self", code: "x", title: "Self", detail: null, verified: false, earned_at: "2026-01-01" },
          { id: "a2", user_id: U, source: "site", code: "onboarded", title: "Site", detail: null, verified: true, earned_at: "2026-02-01" },
        ],
      },
    });
    const b = await getProfileByHandle(f.client, "ALICE");
    expect(b?.profile.kingdom_number).toBe(12);
    expect(b?.achievements.map((a) => a.source)).toEqual(["site", "self"]);
    expect(await getProfileByHandle(f.client, "nobody")).toBeNull();
    expect(publicImageUrl(f.client, "avatar", profile.avatar_path)).toBe(`https://fake.supabase.test/storage/v1/object/public/avatars/${U}/avatar-1.webp`);
    expect(publicImageUrl(f.client, "banner", null)).toBeNull();
    expect(sortAchievements([])).toEqual([]);
  });
  it("maps database errors to words", async () => {
    const f = fakeSupabase({ fail: { "profiles:upsert": { code: "23505", message: 'duplicate key value violates unique constraint "profiles_handle_key"' } } });
    expect(await saveMyProfile(f.client, U, { handle: "bob", display_name: null, bio: null, kingdom_number: null, visibility: "private" })).toEqual({ ok: false, message: "That handle is taken. Pick another." });
    expect(await saveMyProfile(f.client, U, { handle: "bob", display_name: null, bio: null, kingdom_number: null, visibility: "private" })).toEqual({ ok: true });
    expect(f.tables.profiles![0]).toMatchObject({ id: U, handle: "bob" });
  });
  it("replaces an image: new file in the owner's folder, profile updated, old file removed", async () => {
    const f = fakeSupabase({ tables: { profiles: [{ ...profile }] } });
    f.files.set(`avatars/${U}/avatar-1.webp`, { bucket: "avatars", path: `${U}/avatar-1.webp`, type: "image/webp", size: 1 });
    const blob = new Blob([new Uint8Array(1000)], { type: "image/webp" });
    const r = await replaceProfileImage(f.client, U, "avatar", blob, `${U}/avatar-1.webp`, 42);
    expect(r).toEqual({ ok: true, path: `${U}/avatar-42.webp` });
    expect(f.tables.profiles![0]!.avatar_path).toBe(`${U}/avatar-42.webp`);
    expect([...f.files.keys()]).toEqual([`avatars/${U}/avatar-42.webp`]);
    const big = new Blob([new Uint8Array(IMAGE_KINDS.avatar.maxBytes + 1)], { type: "image/webp" });
    expect((await replaceProfileImage(f.client, U, "avatar", big, null)).ok).toBe(false);
  });
  it("self achievements are sent unverified", async () => {
    const f = fakeSupabase();
    expect(await addSelfAchievement(f.client, U, "Won KvK", "S3", [])).toEqual({ ok: true });
    expect(f.tables.achievements![0]).toMatchObject({ source: "self", verified: false, code: "won-kvk", title: "Won KvK", detail: "S3" });
  });
  it("claims every site achievement the database confirms", async () => {
    const f = fakeSupabase({ rpc: { claim_site_achievement: (a) => ({ data: a.p_code === "onboarded" }) } });
    expect(await claimSiteAchievements(f.client)).toEqual(["onboarded"]);
  });
  it("report and block", async () => {
    const f = fakeSupabase({ fail: { "reports:insert": { code: "23505", message: "duplicate" } } });
    expect(await reportUser(f.client, "t", "spam", "x")).toEqual({ ok: false, message: "You already reported this profile. We will review it." });
    expect(await reportUser(f.client, "t", "minor_safety", "  details  ")).toEqual({ ok: true });
    expect(f.tables.reports![0]).toMatchObject({ target_id: "t", reason: "minor_safety", details: "details" });
    expect(await blockUser(f.client, "t")).toEqual({ ok: true });
    expect(f.tables.blocks![0]).toMatchObject({ blocked_id: "t" });
  });
});

describe("account data rights (fake client)", () => {
  it("exports every table for the signed-in user", async () => {
    const f = fakeSupabase({
      session: { user: { id: U, email: "a@example.test", created_at: "2026-10-01", app_metadata: { providers: ["email", "google"] } } },
      tables: { profiles: [{ id: U, handle: "alice" }, { id: "other", handle: "x" }], accounts: [{ user_id: U, name: "Main" }], blocks: [{ blocker_id: U, blocked_id: "z" }] },
    });
    f.files.set(`avatars/${U}/avatar-1.webp`, { bucket: "avatars", path: `${U}/avatar-1.webp`, type: "image/webp", size: 1 });
    const x = await exportAccountData(f.client, new Date("2026-10-13T00:00:00Z"));
    expect(x).toMatchObject({ app: "kingdomops-account-export", v: 1, user: { id: U, email: "a@example.test", providers: ["email", "google"] }, profile: { handle: "alice" } });
    expect(x.accounts).toHaveLength(1);
    expect(x.blocks).toHaveLength(1);
    expect(x.images.map((i) => i.path)).toEqual([`${U}/avatar-1.webp`]);
    await expect(exportAccountData(fakeSupabase().client)).rejects.toThrow(/signed out/);
  });
  it("deletes images first, then the account, then signs out", async () => {
    const f = fakeSupabase({ session: { user: { id: U } }, rpc: { delete_my_account: () => ({ data: null }) } });
    f.files.set(`banners/${U}/banner-1.webp`, { bucket: "banners", path: `${U}/banner-1.webp`, type: "image/webp", size: 1 });
    f.files.set(`verification/${U}/req-1/album.jpg`, { bucket: "verification", path: `${U}/req-1/album.jpg`, type: "image/jpeg", size: 1 });
    expect(await deleteAccount(f.client)).toEqual({ ok: true });
    const ops = f.calls.map((c) => c.op);
    expect(ops.indexOf("storage.banners.remove")).toBeLessThan(ops.indexOf("rpc.delete_my_account"));
    expect(f.calls.find((c) => c.op === "storage.verification.remove")?.args[0]).toEqual([`${U}/req-1/album.jpg`]);
    expect(ops.at(-1)).toBe("auth.signOut");
    expect(f.files.size).toBe(0);
  });
});
