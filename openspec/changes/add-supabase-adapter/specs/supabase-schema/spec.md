## ADDED Requirements

### Requirement: Entity tables with user_id
The database SHALL have tables for `tasks`, `goals`, `ideas`, `contexts`, `categories`, `checklist_items`. Each table SHALL have a `user_id UUID NOT NULL REFERENCES auth.users(id)` column. The `id` column SHALL be `UUID PRIMARY KEY`. Each table SHALL have a composite index on `(user_id, revision)` for efficient pull queries.

#### Scenario: Task table schema
- **WHEN** migration is applied
- **THEN** `tasks` table exists with columns: `id` (UUID PK), `user_id` (UUID FK to auth.users), `name` (TEXT NOT NULL), `description` (TEXT DEFAULT ''), `box` (TEXT NOT NULL CHECK in inbox/today/week/later), `goal_id` (TEXT DEFAULT ''), `context_id` (TEXT DEFAULT ''), `category_id` (TEXT DEFAULT ''), `is_completed` (BOOLEAN DEFAULT false), `completed_at` (TIMESTAMPTZ), `repeat_rule` (JSONB, nullable), `is_hidden` (BOOLEAN DEFAULT false), `next_date` (DATE), `appear_date` (DATE), `original_task_id` (TEXT DEFAULT ''), `sort_order` (INTEGER DEFAULT 0), `is_deleted` (BOOLEAN DEFAULT false), `created_at` (TIMESTAMPTZ NOT NULL), `updated_at` (TIMESTAMPTZ NOT NULL), `revision` (BIGINT DEFAULT 0)

#### Scenario: Goals table schema
- **WHEN** migration is applied
- **THEN** `goals` table exists with columns: `id` (UUID PK), `user_id` (UUID FK), `name` (TEXT NOT NULL), `description` (TEXT DEFAULT ''), `cover_file_id` (TEXT DEFAULT ''), `status` (TEXT NOT NULL CHECK in planning/in_progress/paused/completed/cancelled), `sort_order` (INTEGER DEFAULT 0), `is_deleted` (BOOLEAN DEFAULT false), `created_at` (TIMESTAMPTZ NOT NULL), `updated_at` (TIMESTAMPTZ NOT NULL), `revision` (BIGINT DEFAULT 0)

#### Scenario: Index on user_id + revision
- **WHEN** migration is applied
- **THEN** each entity table has index `idx_{table}_user_revision ON {table} (user_id, revision)`

### Requirement: Settings table
The `settings` table SHALL have composite primary key `(user_id, key)`. It SHALL NOT use revision-based tracking; `updated_at` is used for filtering instead.

#### Scenario: Settings table schema
- **WHEN** migration is applied
- **THEN** `settings` table exists with columns: `user_id` (UUID FK to auth.users), `key` (TEXT NOT NULL), `value` (TEXT NOT NULL), `updated_at` (TIMESTAMPTZ NOT NULL), PRIMARY KEY `(user_id, key)`

### Requirement: sync_meta table
The `sync_meta` table SHALL store per-user revision counters with composite primary key `(user_id, key)`.

#### Scenario: sync_meta table schema
- **WHEN** migration is applied
- **THEN** `sync_meta` table exists with columns: `user_id` (UUID FK to auth.users), `key` (TEXT NOT NULL), `value` (BIGINT NOT NULL DEFAULT 0), PRIMARY KEY `(user_id, key)`

### Requirement: Covers metadata table
The `covers` table SHALL store metadata for uploaded cover images. The actual file data is stored in Supabase Storage.

#### Scenario: Covers table schema
- **WHEN** migration is applied
- **THEN** `covers` table exists with columns: `file_id` (UUID PK DEFAULT gen_random_uuid()), `user_id` (UUID FK to auth.users), `filename` (TEXT NOT NULL), `mime_type` (TEXT NOT NULL), `data_hash` (TEXT NOT NULL), `storage_path` (TEXT NOT NULL), `ref_count` (INTEGER DEFAULT 1)
- **AND** index `idx_covers_user_hash ON covers (user_id, data_hash)` exists

### Requirement: Push RPC function
The database SHALL have a PostgreSQL function `push_records` callable via `supabase.rpc('push_records', ...)`. The function SHALL accept user_id and entity arrays (tasks, goals, contexts, categories, ideas, checklist_items, settings). It SHALL acquire a `FOR UPDATE` lock on the user's `next_revision` row in `sync_meta` (with 10-second timeout), assign the current revision to all accepted records, upsert records into entity tables, increment `next_revision`, and return per-record results with status (`accepted`, `conflict`, `rejected`).

#### Scenario: RPC function acquires lock and assigns revision
- **WHEN** `push_records` is called with 3 tasks
- **THEN** function acquires `FOR UPDATE` lock on `sync_meta` row `(user_id, 'next_revision')`
- **AND** all 3 tasks receive the current `next_revision` value
- **AND** `next_revision` is incremented by 1

#### Scenario: RPC function detects conflict
- **WHEN** client record has `updated_at < server record.updated_at`
- **THEN** result for that record has status `conflict` with `server_record`

#### Scenario: Lock timeout returns error
- **WHEN** `FOR UPDATE` lock cannot be acquired within 10 seconds
- **THEN** function raises an exception that Edge Function translates to `SYNC_LOCK_TIMEOUT`

### Requirement: Row Level Security on all tables
All tables SHALL have RLS enabled with a policy that restricts all operations to rows where `user_id = auth.uid()`.

#### Scenario: RLS policy on entity table
- **WHEN** User A queries `tasks`
- **THEN** only rows with `user_id = User A's id` are returned
- **AND** User A cannot INSERT rows with a different `user_id`

#### Scenario: RLS policy on sync_meta
- **WHEN** User A queries `sync_meta`
- **THEN** only rows with `user_id = User A's id` are returned

#### Scenario: RLS policy on covers
- **WHEN** User A queries `covers`
- **THEN** only rows with `user_id = User A's id` are returned

### Requirement: Storage bucket and RLS
A Storage bucket named `covers` SHALL be created. Storage RLS policy SHALL restrict access so that users can only read/write files in their own prefix path (`{user_id[0:2]}/{user_id}/...`).

#### Scenario: Storage bucket exists
- **WHEN** deployment is complete
- **THEN** Storage bucket `covers` exists

#### Scenario: User can only access own files
- **WHEN** User A attempts to read a file in User B's folder
- **THEN** access is denied by Storage RLS policy

### Requirement: TIMESTAMPTZ fields use UTC
All `TIMESTAMPTZ` columns SHALL store values in UTC. Edge Functions SHALL serialize them as ISO 8601 with `Z` suffix.

#### Scenario: Timestamp stored in UTC
- **WHEN** Edge Function inserts `created_at = '2025-01-15T10:30:00.000Z'`
- **THEN** PostgreSQL stores it as `2025-01-15 10:30:00+00`

### Requirement: DATE fields have no timezone
All `DATE` columns (`next_date`, `appear_date`) SHALL store date values without timezone information. Edge Functions SHALL serialize them as `YYYY-MM-DD`.

#### Scenario: Date stored without timezone
- **WHEN** Edge Function inserts `next_date = '2025-01-15'`
- **THEN** PostgreSQL stores it as `2025-01-15`
- **AND** reading it returns `2025-01-15` regardless of server timezone

### Requirement: Deployment scripts
The package SHALL include deployment scripts that automate: applying migrations (`supabase db push`), deploying Edge Functions (`supabase functions deploy`), and creating the Storage bucket.

#### Scenario: Fresh deployment
- **WHEN** operator runs `./scripts/deploy.sh` against a new Supabase project
- **THEN** all tables are created with RLS policies
- **AND** all Edge Functions are deployed
- **AND** Storage bucket `covers` is created

#### Scenario: Incremental deployment
- **WHEN** operator runs `./scripts/deploy.sh` against an existing Supabase project
- **THEN** new migrations are applied without data loss
- **AND** Edge Functions are updated

### Requirement: README with setup instructions
The package SHALL include a `README.md` with step-by-step instructions for: creating a Supabase project, configuring environment variables, running the deployment script, and connecting the client.

#### Scenario: Developer follows README
- **WHEN** developer follows README instructions from scratch
- **THEN** a working Supabase backend is deployed
- **AND** client can connect and sync data
