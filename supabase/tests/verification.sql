-- Verification checks (20261013200007_verification.sql): levels only via moderators, the code is
-- bound to one request, single use, 1-hour window. Runs in one transaction and rolls back.
\set ON_ERROR_STOP 1
\set QUIET 1
\o /dev/null
begin;

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ann@example.test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ben@example.test'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'mod@example.test');
insert into public.moderators (user_id) values ('cccccccc-cccc-cccc-cccc-cccccccccccc');
insert into public.accounts (id, user_id, kind, name) values
  ('a0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'main', 'Ann main'),
  ('a0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'farm', 'Ann farm'),
  ('b0000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'main', 'Ben main');

create temp table ids (name text primary key, id uuid, code text);
grant all on ids to authenticated;

set local role authenticated;

-- Players cannot set levels themselves.
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
do $$ begin
  begin
    update public.accounts set verification_level = 3 where id = 'a0000000-0000-0000-0000-000000000001';
    raise exception 'player raised own level';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set verified_level = 3 where id = auth.uid();
    raise exception 'player raised own badge';
  exception when insufficient_privilege then null;
  end;
  insert into public.accounts (kind, name, verification_level, governor_id) values ('alt', 'Sneaky', 3, '12345678');
  assert (select verification_level from public.accounts where name = 'Sneaky') = 1, 'insert kept a level';
  assert (select governor_id from public.accounts where name = 'Sneaky') is null, 'insert kept a governor id';
  -- No direct writes to requests.
  begin
    insert into public.verification_requests (account_id, requested_level, code, code_expires_at)
    values ('a0000000-0000-0000-0000-000000000001', 3, '123456', now() + interval '1 hour');
    raise exception 'direct insert into verification_requests';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Start: a new request with its own code, 1 hour.
insert into ids select 'ann1', id, code from public.start_verification('a0000000-0000-0000-0000-000000000001', 3::smallint);
insert into ids select 'ann2', id, code from public.start_verification('a0000000-0000-0000-0000-000000000002', 3::smallint);
do $$ begin
  assert (select code_expires_at - created_at from public.verification_requests where id = (select id from ids where name = 'ann1')) = interval '1 hour', 'window is not 1 hour';
  assert (select code from ids where name = 'ann1') <> (select code from ids where name = 'ann2'), 'two requests share a code';
  begin
    perform public.start_verification('a0000000-0000-0000-0000-000000000001', 3::smallint);
    raise exception 'second open request for the same city';
  exception when unique_violation then null;
  end;
  begin
    perform public.start_verification('b0000000-0000-0000-0000-000000000001', 3::smallint);
    raise exception 'started a verification for another player''s city';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Case: code from another request (Ann's farm code on Ann's main request).
do $$ begin
  begin
    perform public.submit_verification((select id from ids where name = 'ann1'), '{}'::jsonb,
      array['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/' || (select id from ids where name = 'ann1') || '/album.jpg'],
      (select code from ids where name = 'ann2'));
    raise exception 'submit accepted a code from another request';
  exception when invalid_parameter_value then null;
  end;
end $$;

-- Ben starts his own request.
select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true);
insert into ids select 'ben1', id, code from public.start_verification('b0000000-0000-0000-0000-000000000001', 3::smallint);
do $$ begin
  -- Case: code from another user (Ann's code on Ben's request).
  begin
    perform public.submit_verification((select id from ids where name = 'ben1'), '{}'::jsonb,
      array['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/' || (select id from ids where name = 'ben1') || '/album.jpg'],
      (select code from ids where name = 'ann1'));
    raise exception 'submit accepted another user''s code';
  exception when invalid_parameter_value then null;
  end;
  -- Ben cannot submit (or see) Ann's request at all.
  begin
    perform public.submit_verification((select id from ids where name = 'ann1'), '{}'::jsonb,
      array['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/x/album.jpg'], (select code from ids where name = 'ann1'));
    raise exception 'submitted another user''s request';
  exception when insufficient_privilege then null;
  end;
  assert (select count(*) from public.verification_requests) = 1, 'Ben sees other players'' requests';
  -- Screenshot folder of a request that is not his.
  begin
    insert into storage.objects (bucket_id, name)
    values ('verification', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/' || (select id from ids where name = 'ann1') || '/album.jpg');
    raise exception 'uploaded into another request''s folder';
  exception when insufficient_privilege then null;
  end;
end $$;
insert into storage.objects (bucket_id, name)
  values ('verification', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/' || (select id from ids where name = 'ben1') || '/album.jpg');

-- Ben submits correctly; then the code is used.
select public.submit_verification((select id from ids where name = 'ben1'), '{"governorId": "87654321", "name": "Ben"}'::jsonb,
  array['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/' || (select id from ids where name = 'ben1') || '/album.jpg'],
  (select code from ids where name = 'ben1'));
do $$ begin
  -- Case: reused code (second submit of the same request).
  begin
    perform public.submit_verification((select id from ids where name = 'ben1'), '{}'::jsonb,
      array['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/' || (select id from ids where name = 'ben1') || '/album.jpg'],
      (select code from ids where name = 'ben1'));
    raise exception 'code reused';
  exception when invalid_parameter_value then null;
  end;
  -- Players cannot review.
  begin
    perform public.review_verification((select id from ids where name = 'ben1'), true, 3::smallint, '{"governorId": "87654321"}'::jsonb);
    raise exception 'player reviewed';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Moderator review: the album code typed must be this request's code.
select set_config('request.jwt.claim.sub', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true);
do $$ begin
  assert (select count(*) from public.verification_requests) = 3, 'moderator does not see the queue';
  begin
    perform public.review_verification((select id from ids where name = 'ben1'), true, 3::smallint,
      jsonb_build_object('governorId', '87654321', 'albumCode', (select code from ids where name = 'ann1')));
    raise exception 'review accepted a code from another request';
  exception when invalid_parameter_value then null;
  end;
  perform public.review_verification((select id from ids where name = 'ben1'), true, 3::smallint,
    jsonb_build_object('governorId', '87654321', 'name', 'Ben', 'albumCode', (select code from ids where name = 'ben1'), 'cityHall', '22'));
end $$;
reset role;
do $$ begin
  assert (select verification_level from public.accounts where id = 'b0000000-0000-0000-0000-000000000001') = 3, 'level not granted';
  assert (select city_hall from public.accounts where id = 'b0000000-0000-0000-0000-000000000001') = 22, 'city hall not updated';
  assert (select verified_level from public.profiles where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') = 3, 'badge not set';
  assert (select purge_screenshots_after from public.verification_requests where id = (select id from ids where name = 'ben1')) > now() + interval '89 days', 'retention not set';
end $$;

-- Case: reused after approval: starting again gives a new request with a NEW code; the old one stays burned.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true);
insert into ids select 'ben2', id, code from public.start_verification('b0000000-0000-0000-0000-000000000001', 3::smallint);
do $$ begin
  assert (select id from ids where name = 'ben2') <> (select id from ids where name = 'ben1'), 'request reused';
  assert (select code from ids where name = 'ben2') <> (select code from ids where name = 'ben1'), 'burned code issued again';
  begin
    perform public.submit_verification((select id from ids where name = 'ben2'), '{}'::jsonb,
      array['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/' || (select id from ids where name = 'ben2') || '/album.jpg'],
      (select code from ids where name = 'ben1'));
    raise exception 'old (approved) code accepted on a new request';
  exception when invalid_parameter_value then null;
  end;
end $$;

-- Dashboard review (SQL editor, no signed-in user) through review_verification_as.
select public.submit_verification((select id from ids where name = 'ben2'), '{}'::jsonb,
  array['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/' || (select id from ids where name = 'ben2') || '/album.jpg'],
  (select code from ids where name = 'ben2'));
do $$ begin
  begin
    perform public.review_verification_as('cccccccc-cccc-cccc-cccc-cccccccccccc', (select id from ids where name = 'ben2'), false, 3::smallint, '{}'::jsonb, 'x');
    raise exception 'player called review_verification_as';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
do $$ begin
  begin
    perform public.review_verification_as('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (select id from ids where name = 'ben2'), false, 3::smallint, '{}'::jsonb, 'x');
    raise exception 'non-moderator id accepted';
  exception when insufficient_privilege then null;
  end;
  perform public.review_verification_as('cccccccc-cccc-cccc-cccc-cccccccccccc', (select id from ids where name = 'ben2'), false, 3::smallint, '{}'::jsonb, 'Album screenshot is blurry');
  assert (select status from public.verification_requests where id = (select id from ids where name = 'ben2')) = 'rejected', 'dashboard review failed';
  assert (select reviewer_id from public.verification_requests where id = (select id from ids where name = 'ben2')) = 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'reviewer not recorded';
end $$;

-- Case: expired. Move Ann's main request 2 hours into the past (as the table owner).
reset role;
update public.verification_requests
  set created_at = now() - interval '2 hours', code_expires_at = now() - interval '1 hour'
  where id = (select id from ids where name = 'ann1');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
do $$ begin
  begin
    perform public.submit_verification((select id from ids where name = 'ann1'), '{}'::jsonb,
      array['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/' || (select id from ids where name = 'ann1') || '/album.jpg'],
      (select code from ids where name = 'ann1'));
    raise exception 'expired code accepted';
  exception when invalid_parameter_value then null;
  end;
end $$;
-- Starting again marks the old one expired and gives a new code.
insert into ids select 'ann3', id, code from public.start_verification('a0000000-0000-0000-0000-000000000001', 3::smallint);
do $$ begin
  assert (select status from public.verification_requests where id = (select id from ids where name = 'ann1')) = 'expired', 'stale request not expired';
  assert (select code from ids where name = 'ann3') <> (select code from ids where name = 'ann1'), 'expired code reissued';
end $$;
-- The database itself refuses a submit time outside the window, whoever writes it.
reset role;
do $$ begin
  begin
    update public.verification_requests set submitted_at = now()
      where id = (select id from ids where name = 'ann1');
    raise exception 'submitted_at outside the window stored';
  exception when check_violation then null;
  end;
  begin
    update public.verification_requests set code_expires_at = created_at + interval '2 hours'
      where id = (select id from ids where name = 'ann3');
    raise exception 'window longer than 1 hour stored';
  exception when check_violation then null;
  end;
end $$;

-- Cancel burns the code too.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
select public.cancel_verification((select id from ids where name = 'ann3'));
do $$ begin
  begin
    perform public.submit_verification((select id from ids where name = 'ann3'), '{}'::jsonb,
      array['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/' || (select id from ids where name = 'ann3') || '/album.jpg'],
      (select code from ids where name = 'ann3'));
    raise exception 'cancelled code accepted';
  exception when invalid_parameter_value then null;
  end;
end $$;

-- Screenshots: owner and moderator read; other players do not.
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
do $$ begin
  assert not exists (select 1 from storage.objects where bucket_id = 'verification'), 'another player read verification screenshots';
end $$;
select set_config('request.jwt.claim.sub', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true);
do $$ begin
  assert (select count(*) from storage.objects where bucket_id = 'verification') = 1, 'moderator cannot read screenshots';
end $$;

rollback;
\o
\echo 'verification.sql: all checks passed'
