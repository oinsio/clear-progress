-- implements FR1 of add-supabase-integration-tests
-- Configures app.jwt_secret used by PostgREST for JWT verification.

\set jwt_secret `echo "$JWT_SECRET"`

ALTER DATABASE postgres SET "app.jwt_secret" TO :'jwt_secret';
ALTER DATABASE postgres SET "app.jwt_exp" TO '3600';
