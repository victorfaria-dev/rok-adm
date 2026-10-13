// Sign-in CONFIGURED with a mocked Supabase (see mock-supabase.ts and playwright.auth.config.ts).
import { expect, test } from "@playwright/test";
import { BOB, ME, mockSupabase, signIn } from "./mock-supabase";

const bob = { id: BOB, handle: "bob", display_name: "Bob", bio: "Farmer in 1234", kingdom_number: 1234, avatar_path: null, banner_path: null, visibility: "public", verified_level: 3, created_at: "2026-10-01", updated_at: "2026-10-01" };
const me = { id: ME, handle: "me_player", display_name: "Me", bio: null, kingdom_number: null, avatar_path: null, banner_path: null, visibility: "private", verified_level: 1, created_at: "2026-10-01", updated_at: "2026-10-01" };

test("signed out: app areas redirect to /login/ with next; landing page and guides stay public", async ({ page }) => {
  await mockSupabase(page);
  await page.goto("/tools/vip/?from=test");
  await expect(page).toHaveURL(/\/login\/\?next=%2Ftools%2Fvip%2F%3Ffrom%3Dtest$/);
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  for (const path of ["/", "/guide/", "/guides/"]) {
    await page.goto(path);
    expect(new URL(page.url()).pathname, path).toBe(path);
  }
  await page.goto("/me/");
  await expect(page).toHaveURL(/\/login\/\?next=%2Fme%2F$/);
});

test("e-mail sign-in asks for the code after sending the link", async ({ page }) => {
  const s = await mockSupabase(page);
  await page.goto("/login/?next=%2Fme%2F");
  await page.getByLabel("E-mail").fill("me@example.test");
  await page.getByRole("button", { name: "E-mail me a sign-in link" }).click();
  await expect(page.getByLabel("Code from the e-mail")).toBeVisible();
  const otp = s.requests.find((r) => r.path.startsWith("/auth/v1/otp"));
  expect(otp?.body).toMatchObject({ email: "me@example.test" });
  // PKCE (no tokens in the link) and the redirect back to the callback with "next".
  expect(otp?.body).toMatchObject({ code_challenge_method: "s256" });
  expect(new URL(otp!.path, "http://x").searchParams.get("redirect_to")).toMatch(/\/auth\/callback\/\?next=%2Fme%2F$/);
});

test("signed in: app areas open, the account panel shows, sign out clears the session", async ({ page }) => {
  await mockSupabase(page, { tables: { profiles: [me] } });
  await signIn(page);
  await page.goto("/me/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You");
  await expect(page.locator("[data-account-panel]")).toContainText("me@example.test");
  await page.locator("[data-account-panel]").getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => localStorage.getItem("ko:auth:v1"))).toBeNull();
  await page.goto("/me/");
  await expect(page).toHaveURL(/\/login\//);
});

test("public profile: card, verification badge, report and block", async ({ page }) => {
  const s = await mockSupabase(page, { tables: { profiles: [bob, me], achievements: [], blocks: [] } });
  await signIn(page);
  await page.goto("/u/?h=bob");
  await expect(page.getByRole("heading", { level: 1, name: "Bob" })).toBeVisible();
  await expect(page.getByText("Ownership proven")).toBeVisible();
  await page.getByRole("button", { name: "Report" }).click();
  await page.getByLabel("Spam or advertising").check();
  await page.getByRole("button", { name: "Send report" }).click();
  await expect(page.getByText(/The report was sent/)).toBeVisible();
  expect(s.requests.find((r) => r.method === "POST" && r.path.startsWith("/rest/v1/reports"))?.body).toMatchObject({ target_id: BOB, reason: "spam" });
  await page.getByRole("button", { name: "Block" }).click();
  await page.getByRole("group", { name: "Block @bob" }).getByRole("button", { name: "Block" }).click();
  await expect(page.getByText("You blocked this player.")).toBeVisible();
});

test("verify: the code image is drawn for this request and downloads as a PNG", async ({ page }) => {
  const request = {
    id: "req-1", user_id: ME, account_id: "city-1", requested_level: 3, code: "042719",
    code_expires_at: new Date(Date.now() + 3600_000).toISOString(), status: "awaiting_screenshots", screenshot_paths: [],
  };
  await mockSupabase(page, {
    tables: { profiles: [me], accounts: [{ id: "city-1", user_id: ME, kind: "main", name: "Main", city_hall: 22, verification_level: 1, sort_order: 0 }], verification_requests: [] },
    rpc: {
      start_verification: (_b, st) => {
        st.tables.verification_requests = [request];
        return request;
      },
    },
  });
  await signIn(page);
  await page.goto("/me/verify/");
  await page.getByRole("button", { name: "Verify this account" }).click();
  const img = page.locator("img[data-code-image]");
  await expect(img).toBeVisible();
  // A real 4:3 image was rendered on a canvas.
  expect(await img.evaluate((el: HTMLImageElement) => el.decode().then(() => [el.naturalWidth, el.naturalHeight]))).toEqual([1200, 900]);
  await expect(page.locator("[data-countdown]")).toContainText(/Time left for this code: (59|60):\d\d/);
  await expect(page.getByText(/Governor Profile → Album → add a photo/)).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download"), page.locator("[data-download-code]").click()]);
  expect(download.suggestedFilename()).toBe("kingdomops-code-042719.png");
  const path = await download.path();
  expect(path).toBeTruthy();
  const { readFile } = await import("node:fs/promises");
  const bytes = await readFile(path!);
  // PNG signature.
  expect([...bytes.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
});
