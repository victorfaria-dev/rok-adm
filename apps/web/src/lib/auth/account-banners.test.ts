import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACCOUNT_BANNER, LOCAL_ID_ACTIVE, accountBannerSrc, defaultBannerSrc, localIdForFarm, localIdForSavedProfile, removeAccountBanner, setAccountBanner, uploadLocalBanners } from "./account-banners";
import { fakeSupabase } from "./fake-supabase";
import { planCrop } from "./image";

const U = "user-1";
const sql = readFileSync(new URL("../../../../../supabase/migrations/20261013200008_account_banners.sql", import.meta.url), "utf8");
const webp = (n = 100) => new Blob([new Uint8Array(n)], { type: "image/webp" });

describe("city banners", () => {
  it("default follows the account type (alts use main)", () => {
    expect(defaultBannerSrc("main", 640)).toBe("/banners/main-640.webp");
    expect(defaultBannerSrc("farm")).toBe("/banners/farm-1280.webp");
    expect(defaultBannerSrc("alt", 1280)).toBe("/banners/main-1280.webp");
  });
  it("limits match the private bucket", () => {
    expect(sql).toContain(`('account_banners', 'account_banners', false, ${ACCOUNT_BANNER.maxBytes}`);
    expect(sql).toContain("account_type public.city_kind generated always as (kind) stored");
    // One 3:4 portrait variant per city.
    expect(ACCOUNT_BANNER.width / ACCOUNT_BANNER.height).toBe(3 / 4);
    expect(planCrop(4000, 3000, ACCOUNT_BANNER.width, ACCOUNT_BANNER.height)).toMatchObject({ sw: 2250, sh: 3000, width: 960, height: 1280 });
  });
  it("local ids are the ones the first-login upload gives cities", () => {
    expect(localIdForSavedProfile("p1")).toBe("profile:p1");
    expect(localIdForFarm("f1")).toBe("farm:f1");
    expect(LOCAL_ID_ACTIVE).toBe("profile:active");
  });
  it("set, show (signed URL) and remove a custom banner", async () => {
    const f = fakeSupabase({ tables: { accounts: [{ id: "c1", user_id: U, kind: "farm", banner_path: null }] } });
    const r = await setAccountBanner(f.client, U, "c1", webp(), null, 7);
    expect(r).toEqual({ ok: true, path: `${U}/c1-7.webp` });
    expect(f.tables.accounts![0]!.banner_path).toBe(`${U}/c1-7.webp`);
    expect(await accountBannerSrc(f.client, "farm", `${U}/c1-7.webp`)).toMatch(/\/object\/sign\/account_banners\/user-1\/c1-7\.webp/);
    expect(await accountBannerSrc(f.client, "farm", null)).toBe("/banners/farm-1280.webp");
    expect(await accountBannerSrc(null, "main", "x")).toBe("/banners/main-1280.webp");
    expect(await removeAccountBanner(f.client, "c1", `${U}/c1-7.webp`)).toEqual({ ok: true });
    expect(f.tables.accounts![0]!.banner_path).toBeNull();
    expect(f.files.size).toBe(0);
    expect((await setAccountBanner(f.client, U, "c1", webp(ACCOUNT_BANNER.maxBytes + 1), null)).ok).toBe(false);
  });
  it("first login: local banners go to the matching uploaded cities; unknown ones are skipped", async () => {
    const f = fakeSupabase({ tables: { accounts: [
      { id: "c1", user_id: U, kind: "main", local_id: "profile:p1", banner_path: null },
      { id: "c2", user_id: U, kind: "farm", local_id: "farm:f1", banner_path: null },
    ] } });
    const r = await uploadLocalBanners(f.client, U, [
      { localId: "profile:p1", blob: webp() }, { localId: "farm:f1", blob: webp() }, { localId: "farm:gone", blob: webp() },
    ], async (b) => b);
    expect(r).toEqual({ uploaded: 2, skipped: 1, failed: [] });
    expect(f.tables.accounts!.map((a) => String(a.banner_path).replace(/-\d+\.webp$/, ""))).toEqual([`${U}/c1`, `${U}/c2`]);
    expect(await uploadLocalBanners(f.client, U, [])).toEqual({ uploaded: 0, skipped: 0, failed: [] });
  });
});
