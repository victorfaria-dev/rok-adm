-- Per-city banner (owner decision 2026-10-13). Separate from the profile banner (bucket "banners").
-- Default banner = static file chosen by account type (apps/web/public/banners/{main,farm}-{640,1280}.webp;
-- alts use the main one); a custom upload replaces it.

-- account_type: the name the City Hall track uses. It is the same value as `kind`, kept in sync by
-- the database (generated column), so there is one source of truth.
alter table public.accounts
  add column account_type public.city_kind generated always as (kind) stored,
  add column banner_path text
    check (banner_path is null or (banner_path like user_id::text || '/%' and char_length(banner_path) <= 200));

-- Bucket NOT public: a city banner is readable by its owner, and by others only when the owner's
-- profile is visible to them (can_view_user: public/members visibility, not blocked). The site
-- shows it with a short-lived signed URL.
-- City banners are 3:4 portrait on every screen size: ONE stored variant per city, 960×1280,
-- cropped and re-encoded on the device (WebP ~150–450 KB). Limit 768 KB, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('account_banners', 'account_banners', false, 786432, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Folder name is the owner's user id; anything else (malformed) is never readable by others.
create or replace function public.storage_owner(name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' then ((storage.foldername(name))[1])::uuid end
$$;

create policy "account banners: owner or visible profile reads" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'account_banners'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.can_view_user(public.storage_owner(name))
    )
  );

create policy "account banners: owner uploads to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'account_banners' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "account banners: owner replaces own" on storage.objects
  for update to authenticated
  using (bucket_id = 'account_banners' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'account_banners' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "account banners: owner deletes own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'account_banners' and (storage.foldername(name))[1] = (select auth.uid())::text);
