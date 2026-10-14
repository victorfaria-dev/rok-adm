-- Reports about a profile (photo, banner, name, bio, achievements). Reviewed by the site owner in
-- the Supabase dashboard (service role); players only see the reports they filed themselves.

create type public.report_reason as enum (
  'minor_safety',       -- a child may be at risk: reviewed first
  'harassment',
  'hate',
  'sexual',
  'impersonation',
  'spam',
  'selling_or_cheating', -- account selling, bots, game-rule violations
  'other'
);

create table public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid default auth.uid() references auth.users (id) on delete set null,
  target_id uuid not null references auth.users (id) on delete cascade,
  reason public.report_reason not null,
  details text check (char_length(details) <= 1000),
  -- Copy of the reported profile at report time, made by the database (edits cannot erase evidence).
  target_snapshot jsonb,
  status text not null default 'open' check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  check (reporter_id is distinct from target_id)
);

create index reports_open_idx on public.reports (status, reason, created_at) where status in ('open', 'reviewing');
-- One open report per reporter and target.
create unique index reports_one_open on public.reports (reporter_id, target_id) where status = 'open';

create or replace function public.reports_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Requests from players carry a user id; the service role (moderation tools) does not.
  if (select auth.uid()) is not null then
    new.reporter_id := (select auth.uid());
    new.status := 'open';
    if (select count(*) from public.reports
        where reporter_id = new.reporter_id and created_at > now() - interval '1 day') >= 20 then
      raise exception 'Too many reports today. Try again tomorrow.' using errcode = '23514';
    end if;
  end if;
  select jsonb_build_object(
           'handle', p.handle, 'display_name', p.display_name, 'bio', p.bio,
           'kingdom_number', p.kingdom_number, 'avatar_path', p.avatar_path, 'banner_path', p.banner_path,
           'achievements', coalesce((
             select jsonb_agg(jsonb_build_object('source', a.source, 'title', a.title, 'detail', a.detail))
             from public.achievements a where a.user_id = p.id), '[]'::jsonb))
    into new.target_snapshot
    from public.profiles p where p.id = new.target_id;
  return new;
end;
$$;

create trigger reports_before_insert before insert on public.reports
  for each row execute function public.reports_before_insert();

alter table public.reports enable row level security;

create policy "reports: reporter files" on public.reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open');
create policy "reports: reporter reads own" on public.reports
  for select to authenticated using (reporter_id = (select auth.uid()));
-- No update/delete for players: moderation happens with the service role.
