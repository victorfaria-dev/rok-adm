#!/bin/sh
# Apply every migration to a throwaway database on a plain local Postgres (15+) and run the checks.
# Usage: PGHOST=localhost PGPORT=5432 PGUSER=postgres sh supabase/tests/run-local.sh
# Never point this at the real Supabase project: it drops and recreates the database "ko_rls".
set -eu
here=$(cd "$(dirname "$0")" && pwd)
db=${KO_RLS_DB:-ko_rls}
psql -q -v ON_ERROR_STOP=1 -c "drop database if exists $db" -c "create database $db"
set -- -q -v ON_ERROR_STOP=1 -d "$db" -f "$here/shim.sql"
for m in "$here"/../migrations/*.sql; do set -- "$@" -f "$m"; done
psql "$@"
psql -q -d "$db" -f "$here/rls.sql"
psql -q -d "$db" -f "$here/verification.sql"
psql -q -d "$db" -f "$here/account_banners.sql"
