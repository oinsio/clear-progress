-- implements FR1, D3 of add-supabase-integration-tests
-- Configures Supabase service roles after the image's own migrate.sh has run.
-- Mounted at /docker-entrypoint-initdb.d/zz-roles.sql (sorts after migrate.sh).

\set pgpass `echo "$POSTGRES_PASSWORD"`

-- Set passwords for roles created by the image
ALTER USER supabase_admin LOGIN PASSWORD :'pgpass';
ALTER USER authenticator PASSWORD :'pgpass';

-- Create roles NOT created by the image (GoTrue, Storage need LOGIN to connect)
DO $$ BEGIN CREATE ROLE supabase_auth_admin SUPERUSER LOGIN NOINHERIT NOREPLICATION; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE supabase_storage_admin SUPERUSER LOGIN NOINHERIT NOREPLICATION; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER ROLE supabase_auth_admin PASSWORD :'pgpass';
ALTER ROLE supabase_storage_admin PASSWORD :'pgpass';

-- Ensure grant membership (idempotent — no error if already granted)
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
GRANT anon TO supabase_admin;
GRANT authenticated TO supabase_admin;
GRANT service_role TO supabase_admin;
