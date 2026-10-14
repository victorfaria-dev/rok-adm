# Supabase: accounts, community profile and verification

Sign-in (e-mail + Google), the community profile, governor verification and city banners run on
Supabase. **Until the steps below are done, nothing changes on the site**: without the two
environment variables the build has no sign-in, no route guard and no Supabase code on any page.

There is no Lilith / Rise of Kingdoms login (it does not exist) and the site never asks for game
credentials.

## What is here

| File | What it creates |
|---|---|
| `migrations/20261013200001_community_core.sql` | `profiles` (public fields, `visibility` = public / members / private, **private by default**), `blocks`, reserved handles, a profile per new sign-up |
| `migrations/20261013200002_accounts.sql` | `accounts`: the player's cities (main / farm / alt), each with City Hall, stage, spending, owned commanders (JSON) |
| `migrations/20261013200003_account_lifecycle.sql` | `local_imports` (copy of the device data, only when the player says yes), `delete_my_account()` |
| `migrations/20261013200004_achievements.sql` | `achievements`: `site` (checked by `claim_site_achievement`) and `self` (always unverified) |
| `migrations/20261013200005_reports.sql` | `reports` with a copy of the reported profile; players only see their own reports |
| `migrations/20261013200006_storage.sql` | Buckets `avatars` (512 KB) and `banners` (1.5 MB): public read, owner-only write in `<user id>/` |
| `migrations/20261013200007_verification.sql` | Verification levels, `moderators`, `verification_requests`, one-time 1-hour codes, private bucket `verification` (3 MB) |
| `migrations/20261013200008_account_banners.sql` | `accounts.banner_path`, `accounts.account_type`, private bucket `account_banners` (1 MB) |
| `migrations/20261013200009_review_from_dashboard.sql` | `review_verification_as()` so a moderator can review from the SQL editor |
| `tests/` | RLS and trigger checks that run on a plain local Postgres (see the end of this file) |

Every table has row-level security on. The anon key in the browser can only do what the policies allow.

## Owner setup checklist

### 1. Create the project

1. Sign in at <https://supabase.com/dashboard> and create an organization (free plan is enough to start).
2. **New project**. Name: `kingdomops`. Region: **South America (São Paulo)** (closest to the owner; also simplest for LGPD). Save the database password in your password manager.
3. When it is ready, open **Project Settings → API** (or **API Keys**) and note:
   - **Project URL** (`https://<ref>.supabase.co`) → `PUBLIC_SUPABASE_URL`
   - **anon / publishable key** → `PUBLIC_SUPABASE_ANON_KEY`
   - Do **not** copy the `service_role` / secret key anywhere outside the dashboard. It must never go to Netlify or the repository.

### 2. Run the migrations

Either way works; run them **in file-name order**.

- **Dashboard (no tools):** **SQL Editor → New query**, paste the whole content of each file in `supabase/migrations/`, one at a time, in order, and press **Run**. Each must finish with "Success".
- **Supabase CLI:** from the repository root:
  ```sh
  npx supabase@latest login
  npx supabase@latest link --project-ref <ref>
  npx supabase@latest db push
  ```

Then check **Storage**: buckets `avatars`, `banners` (public), `verification`, `account_banners` (private) exist.

### 3. E-mail sign-in

1. **Authentication → Sign In / Providers → Email**: enabled, **Confirm email** on.
2. **Authentication → Emails → Templates → Magic Link**: make sure the template contains both the link and the code, so the player can type the code on another device. For example:
   ```html
   <h2>Sign in to KingdomOps</h2>
   <p><a href="{{ .ConfirmationURL }}">Sign in</a></p>
   <p>Or type this code: <strong>{{ .Token }}</strong></p>
   <p>KingdomOps never asks for your game password.</p>
   ```
   Do the same for **Confirm signup** (first sign-in of a new address).
3. The built-in mailer has a low hourly limit. Before launch, set **Authentication → Emails → SMTP Settings** with a real sender (e.g. Resend, Postmark, Amazon SES).

### 4. Google sign-in

1. <https://console.cloud.google.com/> → create a project → **APIs & Services → OAuth consent screen**: External, app name "KingdomOps", support e-mail, scopes `email`, `profile`, `openid` only. Publish the app when ready.
2. **Credentials → Create credentials → OAuth client ID → Web application**.
   - **Authorized JavaScript origins:** your production URL (e.g. `https://kingdomops.example`) and `http://localhost:4321`.
   - **Authorized redirect URIs:** `https://<ref>.supabase.co/auth/v1/callback` (exactly this; Google sends the player back to Supabase, which sends them to the site).
3. Copy the client ID and secret into Supabase **Authentication → Sign In / Providers → Google**, enable it, save.

### 5. Redirect URLs (where Supabase may send people back)

**Authentication → URL Configuration**:

- **Site URL:** the production URL, e.g. `https://kingdomops.example`
- **Redirect URLs** (add each line):
  - `https://kingdomops.example/auth/callback/**` (production; use your real domain)
  - `https://<netlify-site-name>.netlify.app/auth/callback/**` (the Netlify default domain)
  - `https://deploy-preview-*--<netlify-site-name>.netlify.app/auth/callback/**` (pull request previews)
  - `https://*--<netlify-site-name>.netlify.app/auth/callback/**` (branch deploys)
  - `http://localhost:4321/auth/callback/**` (local dev)

The site always sends people to `/auth/callback/?next=<page>`; a URL missing from this list makes sign-in fail with "redirect URL not allowed".

### 6. Netlify environment variables

Netlify → your site → **Site configuration → Environment variables → Add a variable** (scope: **Builds**):

| Key | Value | Deploy contexts |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | Production, Deploy previews, Branch deploys |
| `PUBLIC_SUPABASE_ANON_KEY` | the anon / publishable key | same |

They are read **at build time**, so trigger a new deploy afterwards (**Deploys → Trigger deploy → Clear cache and deploy site**). To keep previews without sign-in, set the variables only for the Production context.

Local work: copy `apps/web/.env.example` to `apps/web/.env` and fill both values (the file is gitignored).

### 7. Make yourself a moderator

After signing in once on the site, in **SQL Editor**:

```sql
insert into public.moderators (user_id, note)
select id, 'owner' from auth.users where email = 'you@example.com';
```

Moderators review verifications and reports. Add others the same way; remove with `delete from public.moderators where user_id = '…';`.

### 8. Check it works

1. Open the deploy, go to `/me/`: you are sent to `/login/?next=%2Fme%2F`.
2. Sign in with e-mail (link or code) and with Google. You land back on `/me/` and see "Signed in as …".
3. If the browser had local data, you are asked to upload it. "Keep it only on this device" never deletes anything.
4. `/me/profile/`: pick a handle, set visibility to "Anyone with the link", save, open `/u/<handle>/` in a private window.

## Moderation runbook

All in **SQL Editor** (runs as the owner; RLS does not hide rows there).

**Reports** (child-safety first):

```sql
select id, reason, details, target_snapshot, created_at
from public.reports where status in ('open', 'reviewing')
order by (reason = 'minor_safety') desc, created_at;

update public.reports set status = 'actioned' where id = 123;   -- or 'dismissed'
```

To act on a profile: clear the offending field (`update public.profiles set bio = null where id = '…'`), set `visibility = 'private'`, delete an image in **Storage**, or ban the user in **Authentication → Users**. If a report describes a child at immediate risk, contact the authorities (in Brazil: Disque 100 / SaferNet).

**Verifications** (level 2: screenshots; level 3: the Album shows the request's code):

```sql
select v.id, v.requested_level, v.code, v.code_expires_at, v.submitted_at, v.claimed_values, v.screenshot_paths, a.name
from public.verification_requests v join public.accounts a on a.id = v.account_id
where v.status = 'pending_review' order by v.submitted_at;
```

Open the screenshots in **Storage → verification → <user id>/<request id>/**. Check: the Album screenshot shows **this request's code** (`v.code`), the Album name equals the Governor Profile name, the governor ID is on the profile screenshot, and the values match. The database refuses an approval whose `albumCode` is not the request's code or that was submitted after its 1-hour window.

```sql
-- approve level 3 (type the values you SEE in the screenshots)
select public.review_verification_as(
  (select user_id from public.moderators limit 1),     -- your moderator user id
  '<request id>', true, 3::smallint,
  '{"governorId": "12345678", "name": "Bob", "albumCode": "042719", "cityHall": "22", "power": "45000000"}', null);

-- reject (the player can start again with a new code)
select public.review_verification_as('<your user id>', '<request id>', false, 3::smallint, '{}', 'Album code not visible');
```

**Screenshot retention** (AUTH-12): screenshots are kept for audit **90 days after review** (7 days when a request expired or was cancelled), then deleted. Weekly:

```sql
select * from public.verification_files_due();
```

Delete the listed files in **Storage → verification**, then for each request id:

```sql
select public.verification_files_purged('<request id>');
```

(An Edge Function with `pg_cron` can do this automatically later; see "Optional" below.)

## Optional, later

- **Server-side re-check (Edge Function):** a function triggered when a request becomes `pending_review` can download the screenshots with the service role, run OCR, and write its result into `verification_requests.auto_check`. Moderators still decide; the check only flags mismatches. Not needed to launch.
- **Moderator page in the site** instead of the SQL editor (reads the queue with `is_moderator()`, signed URLs for screenshots).
- **Regenerate types** after schema changes: `npx supabase@latest gen types typescript --project-id <ref> > apps/web/src/lib/auth/database.types.ts` (then re-add the comments and keep the exported names).

## Checking the migrations locally

`tests/run-local.sh` applies every migration to a throwaway database on a plain Postgres 15+ (with
`tests/shim.sql` standing in for Supabase's `auth` and `storage` schemas) and runs `rls.sql`,
`verification.sql` and `account_banners.sql`:

```sh
PGHOST=localhost PGPORT=5432 PGUSER=postgres sh supabase/tests/run-local.sh
```

It drops and recreates the database `ko_rls`. Never point it at the real project.
