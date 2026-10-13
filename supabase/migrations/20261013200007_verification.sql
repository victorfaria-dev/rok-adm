-- Governor verification (owner approval 2026-10-13). Each city (accounts row) has a level:
--   1 declared            the player typed it; shown as "unverified"
--   2 screenshot-checked  values read from the Governor Profile and City Hall screenshots
--   3 ownership-proven    the in-game Album shows the site's one-time code, under the same
--                         governor name/ID as the profile screenshot
-- Client-side OCR can be spoofed (edited screenshots, edited requests), so the browser only
-- PRE-FILLS values; a moderator looks at the screenshots and approves levels 2 and 3 through
-- review_verification(). Players can never set a level themselves. An optional Edge Function can
-- re-run OCR server-side later and attach its result in auto_check (see supabase/README.md).

-- Moderators: added by the site owner with the service role (dashboard SQL), never by the app.
create table public.moderators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now(),
  note text check (char_length(note) <= 200)
);

alter table public.moderators enable row level security;
-- Nobody reads or writes this through the API; is_moderator() below answers for the current user.

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.moderators where user_id = (select auth.uid()))
$$;

revoke all on function public.is_moderator() from public;
grant execute on function public.is_moderator() to anon, authenticated;

-- Verification fields on each city. Written only by review_verification().
alter table public.accounts
  add column verification_level smallint not null default 1 check (verification_level between 1 and 3),
  add column governor_id text check (governor_id ~ '^[0-9]{5,12}$'),
  add column governor_name text check (char_length(governor_name) <= 40),
  add column verified_values jsonb check (verified_values is null or jsonb_typeof(verified_values) = 'object'),
  add column verified_at timestamptz;

-- A governor ID can be ownership-proven by one player only.
create unique index accounts_governor_proven on public.accounts (governor_id) where verification_level = 3;

-- Highest level among the player's cities, shown as a badge on the public profile.
alter table public.profiles
  add column verified_level smallint not null default 1 check (verified_level between 1 and 3);

-- Players cannot raise (or fake) levels: only the review function (table owner) may change them.
create or replace function public.accounts_protect_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.verification_level := 1;
      new.governor_id := null;
      new.governor_name := null;
      new.verified_values := null;
      new.verified_at := null;
    elsif (new.verification_level, new.governor_id, new.governor_name, new.verified_values, new.verified_at)
          is distinct from (old.verification_level, old.governor_id, old.governor_name, old.verified_values, old.verified_at) then
      raise exception 'Verification is set by a moderator.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger accounts_protect_verification
  before insert or update on public.accounts
  for each row execute function public.accounts_protect_verification();

create or replace function public.profiles_protect_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.verified_level := 1;
    elsif new.verified_level is distinct from old.verified_level then
      raise exception 'Verification is set by a moderator.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_verification
  before insert or update on public.profiles
  for each row execute function public.profiles_protect_verification();

create type public.verification_status as enum (
  'awaiting_screenshots', -- code issued, player is taking screenshots
  'pending_review',       -- submitted, waiting for a moderator
  'approved',
  'rejected',
  'expired',              -- code ran out before submit
  'cancelled'
);

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  requested_level smallint not null check (requested_level in (2, 3)),
  -- One-time 6-digit code for the Album screenshot (AUTH-13). Created with the request and bound to
  -- it: never reissued, never moved to another request, valid for 1 hour, burned by any outcome.
  code text not null check (code ~ '^[0-9]{6}$'),
  code_expires_at timestamptz not null,
  code_used_at timestamptz,
  status public.verification_status not null default 'awaiting_screenshots',
  -- What the browser read (OCR) or the player typed; never trusted on its own.
  claimed_values jsonb check (claimed_values is null or (jsonb_typeof(claimed_values) = 'object' and pg_column_size(claimed_values) <= 8192)),
  -- Optional server-side re-check (Edge Function), same shape plus a "checker" field.
  auto_check jsonb check (auto_check is null or jsonb_typeof(auto_check) = 'object'),
  -- Storage paths in the private "verification" bucket: "<user>/<request>/<slot>.<ext>".
  screenshot_paths text[] not null default '{}' check (cardinality(screenshot_paths) <= 3),
  -- What the moderator confirmed, and the level granted.
  approved_values jsonb check (approved_values is null or jsonb_typeof(approved_values) = 'object'),
  granted_level smallint check (granted_level between 1 and 3),
  reviewer_id uuid references auth.users (id) on delete set null,
  review_note text check (char_length(review_note) <= 500),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  -- Screenshots are deleted after this (see verification_files_due()).
  purge_screenshots_after timestamptz,
  check (code_expires_at <= created_at + interval '1 hour'),
  -- Submitted (code used) only inside the window.
  check (submitted_at is null or submitted_at <= code_expires_at),
  check (code_used_at is null or code_used_at <= code_expires_at)
);

create index verification_requests_user_idx on public.verification_requests (user_id, created_at desc);
create index verification_requests_queue_idx on public.verification_requests (status, submitted_at) where status = 'pending_review';
-- One open request per city; codes unique while they can still be used.
create unique index verification_requests_one_open on public.verification_requests (account_id)
  where status in ('awaiting_screenshots', 'pending_review');
-- A code value is used once, ever: a burned code (approved, rejected, expired, cancelled) is never
-- issued again, so an old Album screenshot cannot prove a new request.
create unique index verification_requests_code_once on public.verification_requests (code);

alter table public.verification_requests enable row level security;

-- Read: the owner and moderators. Writes only through the functions below (no insert/update/delete policies).
create policy "verification: owner or moderator reads" on public.verification_requests
  for select to authenticated using (user_id = (select auth.uid()) or public.is_moderator());

-- Retention (AUTH-12): screenshots are kept for audit 90 days after the review, 7 days after an
-- expired / cancelled request. The request row (values, reviewer, dates) stays while the account exists.
create or replace function public.verification_retention(s public.verification_status)
returns interval
language sql
immutable
set search_path = ''
as $$
  select case when s in ('approved', 'rejected') then interval '90 days' else interval '7 days' end
$$;

-- Random 6-digit code from gen_random_uuid() (a cryptographic v4 UUID, no extension needed).
create or replace function public.new_verification_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select lpad(((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint) % 1000000)::text, 6, '0')
$$;

-- Start: a new request with its own new code for one of the caller's cities. Expires stale requests first.
create or replace function public.start_verification(p_account_id uuid, p_level smallint default 3)
returns public.verification_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  r public.verification_requests;
  tries int := 0;
begin
  if me is null then raise exception 'Not signed in.' using errcode = '42501'; end if;
  if p_level not in (2, 3) then raise exception 'Level must be 2 or 3.' using errcode = '22023'; end if;
  if not exists (select 1 from public.accounts where id = p_account_id and user_id = me) then
    raise exception 'City not found.' using errcode = '42501';
  end if;
  update public.verification_requests
    set status = 'expired', purge_screenshots_after = now() + public.verification_retention('expired')
    where user_id = me and status = 'awaiting_screenshots' and code_expires_at < now();
  if (select count(*) from public.verification_requests where user_id = me and created_at > now() - interval '1 day') >= 5 then
    raise exception 'Too many verification codes today. Try again tomorrow.' using errcode = '23514';
  end if;
  loop
    begin
      insert into public.verification_requests (user_id, account_id, requested_level, code, code_expires_at)
      values (me, p_account_id, p_level, public.new_verification_code(), now() + interval '1 hour')
      returning * into r;
      return r;
    exception when unique_violation then
      -- Either the city already has an open request (report it) or the code collided (retry).
      if exists (select 1 from public.verification_requests where account_id = p_account_id and status in ('awaiting_screenshots', 'pending_review')) then
        raise exception 'This city already has a verification in progress.' using errcode = '23505';
      end if;
      tries := tries + 1;
      if tries > 20 then raise; end if;
    end;
  end loop;
end;
$$;

-- Submit: screenshots uploaded, values pre-filled. Uses the code (single use).
-- p_album_code is the code the browser read in the Album screenshot (or the player typed). It must be
-- this request's code; the moderator checks the screenshot itself again in review_verification().
create or replace function public.submit_verification(p_request_id uuid, p_claimed jsonb, p_paths text[], p_album_code text default null)
returns public.verification_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  r public.verification_requests;
  p text;
begin
  select * into r from public.verification_requests where id = p_request_id and user_id = me for update;
  if not found then raise exception 'Verification not found.' using errcode = '42501'; end if;
  if r.status <> 'awaiting_screenshots' or r.code_used_at is not null then
    raise exception 'This code was already used. Start again.' using errcode = '22023';
  end if;
  if r.code_expires_at < now() then
    update public.verification_requests
      set status = 'expired', purge_screenshots_after = now() + public.verification_retention('expired')
      where id = r.id;
    raise exception 'This code has expired. Start again.' using errcode = '22023';
  end if;
  if r.requested_level = 3 and coalesce(p_album_code, '') <> r.code then
    raise exception 'The code in the Album screenshot does not match this verification''s code.' using errcode = '22023';
  end if;
  if coalesce(cardinality(p_paths), 0) = 0 or cardinality(p_paths) > 3 then
    raise exception 'Upload 1 to 3 screenshots.' using errcode = '22023';
  end if;
  foreach p in array p_paths loop
    if p not like me::text || '/' || r.id::text || '/%' then
      raise exception 'Screenshot is not in this verification''s folder.' using errcode = '42501';
    end if;
  end loop;
  update public.verification_requests
    set status = 'pending_review', code_used_at = now(), submitted_at = now(),
        claimed_values = coalesce(p_claimed, '{}'::jsonb) || jsonb_build_object('albumCode', p_album_code),
        screenshot_paths = p_paths
    where id = r.id
    returning * into r;
  return r;
end;
$$;

create or replace function public.cancel_verification(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.verification_requests
    set status = 'cancelled', purge_screenshots_after = now() + public.verification_retention('cancelled')
    where id = p_request_id and user_id = (select auth.uid()) and status in ('awaiting_screenshots', 'pending_review');
end;
$$;

-- Moderator decision. Approving sets the city's level and governor fields and the profile badge.
create or replace function public.review_verification(
  p_request_id uuid, p_approve boolean, p_level smallint, p_values jsonb, p_note text default null
)
returns public.verification_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  r public.verification_requests;
  gid text := nullif(p_values->>'governorId', '');
  gname text := nullif(p_values->>'name', '');
begin
  if not public.is_moderator() then raise exception 'Moderators only.' using errcode = '42501'; end if;
  select * into r from public.verification_requests where id = p_request_id for update;
  if not found then raise exception 'Verification not found.' using errcode = '22023'; end if;
  if r.user_id = me then raise exception 'You cannot review your own verification.' using errcode = '42501'; end if;
  if r.status <> 'pending_review' then raise exception 'Not waiting for review.' using errcode = '22023'; end if;
  if p_approve then
    if p_level not in (2, 3) or p_level > r.requested_level then
      raise exception 'Level must be 2 or 3 and not above what was requested.' using errcode = '22023';
    end if;
    if p_level = 3 and gid is null then
      raise exception 'Level 3 needs the governor ID.' using errcode = '22023';
    end if;
    -- The moderator types the code they SEE in the Album screenshot: it must be this request's code
    -- (not another request's, not another player's), used inside the 1-hour window.
    if p_level = 3 and coalesce(p_values->>'albumCode', '') <> r.code then
      raise exception 'The Album code does not match this verification''s code.' using errcode = '22023';
    end if;
    if r.submitted_at is null or r.submitted_at > r.code_expires_at then
      raise exception 'Submitted outside the code''s 1-hour window.' using errcode = '22023';
    end if;
    update public.accounts
      set verification_level = p_level, governor_id = gid, governor_name = gname,
          verified_values = p_values, verified_at = now(),
          city_hall = coalesce(nullif(p_values->>'cityHall', '')::smallint, city_hall)
      where id = r.account_id;
    update public.profiles
      set verified_level = (select max(verification_level) from public.accounts where user_id = r.user_id)
      where id = r.user_id;
  end if;
  update public.verification_requests
    set status = case when p_approve then 'approved'::public.verification_status else 'rejected'::public.verification_status end,
        approved_values = case when p_approve then p_values end,
        granted_level = case when p_approve then p_level end,
        reviewer_id = me, review_note = p_note, reviewed_at = now(),
        purge_screenshots_after = now() + public.verification_retention(case when p_approve then 'approved'::public.verification_status else 'rejected'::public.verification_status end)
    where id = r.id
    returning * into r;
  return r;
end;
$$;

-- Screenshots past retention, for the purge job (service role; see supabase/README.md).
create or replace function public.verification_files_due()
returns table (request_id uuid, path text)
language sql
stable
security definer
set search_path = ''
as $$
  select v.id, unnest(v.screenshot_paths)
  from public.verification_requests v
  where v.purge_screenshots_after is not null and v.purge_screenshots_after < now()
    and cardinality(v.screenshot_paths) > 0
$$;

-- After the purge job removed the files, it clears the paths.
create or replace function public.verification_files_purged(p_request_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.verification_requests set screenshot_paths = '{}' where id = p_request_id
$$;

revoke all on function public.start_verification(uuid, smallint) from public, anon;
revoke all on function public.submit_verification(uuid, jsonb, text[], text) from public, anon;
revoke all on function public.cancel_verification(uuid) from public, anon;
revoke all on function public.review_verification(uuid, boolean, smallint, jsonb, text) from public, anon;
revoke all on function public.verification_files_due() from public, anon, authenticated;
revoke all on function public.verification_files_purged(uuid) from public, anon, authenticated;
revoke all on function public.new_verification_code() from public, anon, authenticated;
grant execute on function public.start_verification(uuid, smallint) to authenticated;
grant execute on function public.submit_verification(uuid, jsonb, text[], text) to authenticated;
grant execute on function public.cancel_verification(uuid) to authenticated;
grant execute on function public.review_verification(uuid, boolean, smallint, jsonb, text) to authenticated;
grant execute on function public.verification_files_due() to service_role;
grant execute on function public.verification_files_purged(uuid) to service_role;

-- Private bucket: screenshots are personal (governor ID, power). 3 MB, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verification', 'verification', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "verification files: owner uploads to an open request" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'verification'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.verification_requests v
      where v.id::text = (storage.foldername(name))[2]
        and v.user_id = (select auth.uid())
        and v.status = 'awaiting_screenshots'
    )
  );

create policy "verification files: owner or moderator reads" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'verification'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_moderator())
  );

-- The owner may delete their files (account deletion, cancelled request). Reviewed values stay in the row.
create policy "verification files: owner deletes own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'verification' and (storage.foldername(name))[1] = (select auth.uid())::text);
