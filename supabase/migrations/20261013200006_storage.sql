-- Avatar and banner images. Public read (the image URL works for anyone who has it, like any
-- profile picture), owner-only write inside their own folder "<user id>/...". Size and type are
-- limited by the bucket itself; the site also resizes and re-encodes before upload (which strips
-- photo metadata such as location).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 524288, array['image/webp', 'image/jpeg', 'image/png']),   -- 512 KB
  ('banners', 'banners', true, 1572864, array['image/webp', 'image/jpeg', 'image/png'])   -- 1.5 MB
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "profile images: owner lists own" on storage.objects
  for select to authenticated
  using (bucket_id in ('avatars', 'banners') and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "profile images: owner uploads to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('avatars', 'banners') and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "profile images: owner replaces own" on storage.objects
  for update to authenticated
  using (bucket_id in ('avatars', 'banners') and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id in ('avatars', 'banners') and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "profile images: owner deletes own" on storage.objects
  for delete to authenticated
  using (bucket_id in ('avatars', 'banners') and (storage.foldername(name))[1] = (select auth.uid())::text);
