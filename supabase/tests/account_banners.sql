-- City banners (20261013200008_account_banners.sql). Runs in one transaction and rolls back.
\set ON_ERROR_STOP 1
\o /dev/null
begin;

insert into auth.users (id, email) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'dee@example.test'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eve@example.test');
update public.profiles set handle = 'dee', visibility = 'private' where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
insert into public.accounts (id, user_id, kind, name) values
  ('d0000000-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'farm', 'Dee farm');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddddddd-dddd-dddd-dddd-dddddddddddd', true);
insert into storage.objects (bucket_id, name) values ('account_banners', 'dddddddd-dddd-dddd-dddd-dddddddddddd/d0000000-1.webp');
update public.accounts set banner_path = 'dddddddd-dddd-dddd-dddd-dddddddddddd/d0000000-1.webp' where id = 'd0000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select account_type from public.accounts where id = 'd0000000-0000-0000-0000-000000000001') = 'farm', 'account_type does not follow kind';
  begin
    update public.accounts set banner_path = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee/x.webp' where id = 'd0000000-0000-0000-0000-000000000001';
    raise exception 'banner path outside own folder accepted';
  exception when check_violation then null;
  end;
  begin
    update public.accounts set account_type = 'main' where id = 'd0000000-0000-0000-0000-000000000001';
    raise exception 'account_type written directly';
  exception when generated_always then null;
  end;
end $$;
update public.accounts set kind = 'main' where id = 'd0000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select account_type from public.accounts where id = 'd0000000-0000-0000-0000-000000000001') = 'main', 'account_type not updated';
end $$;

-- Eve: cannot upload into Dee's folder; cannot read Dee's banner while Dee's profile is private.
select set_config('request.jwt.claim.sub', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', true);
do $$ begin
  begin
    insert into storage.objects (bucket_id, name) values ('account_banners', 'dddddddd-dddd-dddd-dddd-dddddddddddd/evil.webp');
    raise exception 'upload into another folder accepted';
  exception when insufficient_privilege then null;
  end;
  assert not exists (select 1 from storage.objects where bucket_id = 'account_banners'), 'private profile banner readable';
end $$;

-- Dee makes the profile public: anyone can read the banner; blocking hides it again.
select set_config('request.jwt.claim.sub', 'dddddddd-dddd-dddd-dddd-dddddddddddd', true);
update public.profiles set visibility = 'public' where id = auth.uid();
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  assert (select count(*) from storage.objects where bucket_id = 'account_banners') = 1, 'public profile banner not readable';
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddddddd-dddd-dddd-dddd-dddddddddddd', true);
insert into public.blocks (blocked_id) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');
select set_config('request.jwt.claim.sub', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', true);
do $$ begin
  assert not exists (select 1 from storage.objects where bucket_id = 'account_banners'), 'blocked user reads the banner';
end $$;

rollback;
\o
\echo 'account_banners.sql: all checks passed'
