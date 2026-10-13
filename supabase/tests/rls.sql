-- RLS and trigger checks for the migrations. Runs inside one transaction and rolls back.
-- Local run (plain Postgres + shim.sql): see supabase/README.md, "Checking the migrations locally".
\set ON_ERROR_STOP 1
begin;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.test'),
  ('33333333-3333-3333-3333-333333333333', 'carol@example.test');

do $$ begin
  assert (select count(*) from public.profiles) = 3, 'a profile is created per sign-up';
  assert (select bool_and(visibility = 'private') from public.profiles), 'profiles start private';
end $$;

-- Alice: public; Bob: members only; Carol: private.
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
update public.profiles set handle = 'Alice', display_name = ' Alice ', bio = 'Farmer', kingdom_number = 1234, visibility = 'public'
  where id = auth.uid();
do $$ begin
  assert (select handle from public.profiles where id = auth.uid()) = 'alice', 'handle is lower-cased';
  assert (select display_name from public.profiles where id = auth.uid()) = 'Alice', 'name is trimmed';
  -- Reserved handle.
  begin
    update public.profiles set handle = 'kingdomops_admin' where id = auth.uid();
    raise exception 'reserved handle accepted';
  exception when check_violation then null;
  end;
  -- Links in the bio.
  begin
    update public.profiles set bio = 'join https://discord.gg/x' where id = auth.uid();
    raise exception 'link in bio accepted';
  exception when check_violation then null;
  end;
  -- Image path outside the own folder.
  begin
    update public.profiles set avatar_path = '22222222-2222-2222-2222-222222222222/a.webp' where id = auth.uid();
    raise exception 'foreign avatar path accepted';
  exception when check_violation then null;
  end;
end $$;
-- Cannot edit someone else.
update public.profiles set bio = 'hacked' where id = '22222222-2222-2222-2222-222222222222';
do $$ begin
  assert not exists (select 1 from public.profiles where bio = 'hacked'), 'edited another profile';
end $$;

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
update public.profiles set handle = 'bob', display_name = 'Bob', visibility = 'members' where id = auth.uid();
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
update public.profiles set handle = 'carol', display_name = 'Carol', visibility = 'private' where id = auth.uid();
do $$ begin
  assert (select count(*) from public.profiles) = 3, 'carol sees alice, bob (members) and herself';
end $$;

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  assert (select array_agg(handle order by handle) from public.profiles) = array['alice'], 'anon sees only public profiles';
end $$;

-- Alice blocks Bob: Bob no longer sees Alice; anon still does.
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
insert into public.blocks (blocked_id) values ('22222222-2222-2222-2222-222222222222');
do $$ begin
  begin
    insert into public.blocks (blocked_id) values ('11111111-1111-1111-1111-111111111111');
    raise exception 'self-block accepted';
  exception when check_violation then null;
  end;
end $$;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
do $$ begin
  assert not exists (select 1 from public.profiles where handle = 'alice'), 'blocked user still sees the blocker';
  assert not exists (select 1 from public.blocks), 'blocks are private to the blocker';
end $$;

-- Accounts: owner only, one main.
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
insert into public.accounts (kind, name, city_hall, kingdom_stage, spending, commanders, local_id)
  values ('main', 'Main', 22, 'kvk1', 'f2p', '{"sun_tzu": {"q1": "a"}}', 'p1');
insert into public.accounts (kind, name, city_hall, local_id) values ('farm', 'Farm 1', 15, 'p2');
do $$ begin
  begin
    insert into public.accounts (kind, name) values ('main', 'Second main');
    raise exception 'second main accepted';
  exception when unique_violation then null;
  end;
  begin
    insert into public.accounts (kind, name, city_hall) values ('alt', 'Bad', 26);
    raise exception 'CH 26 accepted';
  exception when check_violation then null;
  end;
end $$;
-- Upsert by local_id updates instead of duplicating.
insert into public.accounts (kind, name, city_hall, local_id) values ('farm', 'Farm 1', 16, 'p2')
  on conflict (user_id, local_id) do update set city_hall = excluded.city_hall;
do $$ begin
  assert (select count(*) from public.accounts) = 2, 'upsert duplicated';
  assert (select city_hall from public.accounts where local_id = 'p2') = 16, 'upsert did not update';
end $$;

-- Achievements: self-declared are always unverified; site ones only through the claim function.
do $$ begin
  -- A self-declared achievement sent as verified is stored as unverified.
  insert into public.achievements (source, code, title, verified) values ('self', 'ch25', 'CH 25', true);
  assert not (select verified from public.achievements where code = 'ch25'), 'self achievement stored as verified';
  delete from public.achievements where code = 'ch25';
  begin
    insert into public.achievements (source, code, title) values ('site', 'onboarded', 'Fake');
    raise exception 'site achievement inserted directly';
  exception when insufficient_privilege then null;
  end;
end $$;
insert into public.achievements (source, code, title, detail) values ('self', 'kvk-win', 'Won KvK', 'Season 3');
do $$ begin
  assert public.claim_site_achievement('onboarded'), 'onboarded should be earned (main with CH)';
  assert public.claim_site_achievement('farm_keeper'), 'farm_keeper should be earned';
  assert not public.claim_site_achievement('profile_complete'), 'profile_complete needs an avatar';
  assert (select count(*) from public.achievements where source = 'site' and verified) = 2, 'site achievements are verified';
  begin
    update public.achievements set title = 'Edited' where code = 'onboarded';
    -- RLS hides site rows from update: nothing changes.
    assert (select title from public.achievements where code = 'onboarded') <> 'Edited', 'site achievement edited';
  end;
end $$;

-- Others see achievements with the profile (anon: Alice is public; Bob is blocked).
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  assert (select count(*) from public.achievements) = 3, 'anon sees public achievements';
  assert not exists (select 1 from public.accounts), 'anon sees accounts';
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
do $$ begin
  assert not exists (select 1 from public.achievements), 'blocked user sees achievements';
  assert not exists (select 1 from public.accounts), 'accounts leaked to another user';
end $$;

-- Reports: Bob reports Carol; a snapshot is stored; one open report per pair; no self-report.
insert into public.reports (target_id, reason, details, status, reporter_id)
  values ('33333333-3333-3333-3333-333333333333', 'spam', 'ads in bio', 'open', '22222222-2222-2222-2222-222222222222');
do $$ begin
  assert (select target_snapshot->>'handle' from public.reports limit 1) = 'carol', 'snapshot missing';
  begin
    insert into public.reports (target_id, reason) values ('33333333-3333-3333-3333-333333333333', 'hate');
    raise exception 'second open report accepted';
  exception when unique_violation then null;
  end;
  begin
    insert into public.reports (target_id, reason) values ('22222222-2222-2222-2222-222222222222', 'spam');
    raise exception 'self report accepted';
  exception when check_violation then null;
  end;
end $$;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
do $$ begin
  assert not exists (select 1 from public.reports), 'reported user can read reports';
end $$;

-- Storage: own folder only.
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
insert into storage.objects (bucket_id, name) values ('avatars', '11111111-1111-1111-1111-111111111111/avatar-1.webp');
do $$ begin
  begin
    insert into storage.objects (bucket_id, name) values ('avatars', '22222222-2222-2222-2222-222222222222/avatar-1.webp');
    raise exception 'upload into another folder accepted';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Local imports: private, capped at 10.
insert into public.local_imports (payload) select '{"app": "kingdomops-backup"}' from generate_series(1, 12);
do $$ begin
  assert (select count(*) from public.local_imports) = 10, 'local imports not capped at 10';
  assert public.claim_site_achievement('data_saved'), 'data_saved should be earned';
end $$;

-- Account deletion: anon cannot; Alice can, and everything she owns goes.
reset role;
set local role anon;
do $$ begin
  begin
    perform public.delete_my_account();
    raise exception 'anon deleted an account';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select public.delete_my_account();
reset role;
do $$ begin
  assert not exists (select 1 from auth.users where id = '11111111-1111-1111-1111-111111111111'), 'user kept';
  assert not exists (select 1 from public.profiles where id = '11111111-1111-1111-1111-111111111111'), 'profile kept';
  assert not exists (select 1 from public.accounts), 'accounts kept';
  assert not exists (select 1 from public.achievements where user_id = '11111111-1111-1111-1111-111111111111'), 'achievements kept';
  assert not exists (select 1 from public.local_imports), 'local imports kept';
  assert not exists (select 1 from public.blocks), 'blocks kept';
end $$;

rollback;
\echo 'rls.sql: all checks passed'
