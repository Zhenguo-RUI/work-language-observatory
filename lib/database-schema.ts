export const SCHEMA_STATEMENTS = [
`CREATE TABLE IF NOT EXISTS analyses (
 id text PRIMARY KEY, owner_id text NOT NULL, title text NOT NULL,
 company text NOT NULL DEFAULT '', raw_text text NOT NULL,
 source_url text NOT NULL DEFAULT '', text_hash text NOT NULL,
 status text NOT NULL DEFAULT 'draft', engine text NOT NULL DEFAULT 'rules',
 result_json text NOT NULL, revision integer NOT NULL DEFAULT 1,
 change_id text NOT NULL, created_at text NOT NULL, updated_at text NOT NULL
)`,
`CREATE INDEX IF NOT EXISTS analyses_owner_status ON analyses(owner_id,status)`,
`CREATE INDEX IF NOT EXISTS analyses_hash ON analyses(text_hash)`,
`CREATE UNIQUE INDEX IF NOT EXISTS analyses_shared_reading ON analyses(change_id) WHERE owner_id='__feedback_shared__'`,
`CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY,value text NOT NULL,updated_at text NOT NULL)`,
`CREATE TABLE IF NOT EXISTS reviews (
 id text PRIMARY KEY,analysis_id text NOT NULL REFERENCES analyses(id),
 reviewer_id text NOT NULL,decision text NOT NULL,note text NOT NULL DEFAULT '',
 issues_json text NOT NULL DEFAULT '[]',revision integer NOT NULL,created_at text NOT NULL
)`,
`CREATE TABLE IF NOT EXISTS versions (
 id text PRIMARY KEY,analysis_id text NOT NULL REFERENCES analyses(id),revision integer NOT NULL,
 result_json text NOT NULL,status text NOT NULL,author_id text NOT NULL,created_at text NOT NULL,
 UNIQUE(analysis_id,revision)
)`,
`CREATE TABLE IF NOT EXISTS feedback (
 id text PRIMARY KEY,analysis_id text NOT NULL REFERENCES analyses(id),user_id text NOT NULL,
 kind text NOT NULL,note text NOT NULL DEFAULT '',created_at text NOT NULL
)`,
`CREATE TABLE IF NOT EXISTS activities (
 id text PRIMARY KEY,actor_id text NOT NULL,analysis_id text,action text NOT NULL,
 detail text NOT NULL DEFAULT '',created_at text NOT NULL
)`,
`CREATE TABLE IF NOT EXISTS corpus_reviews (
 id text PRIMARY KEY,status text NOT NULL,note text NOT NULL DEFAULT '',
 reviewer_id text NOT NULL,updated_at text NOT NULL
)`,
`CREATE TABLE IF NOT EXISTS usage_events (
 id text PRIMARY KEY,name text NOT NULL,view text NOT NULL DEFAULT '',
 format text NOT NULL DEFAULT '',reading_id text,created_at text NOT NULL
)`,
`CREATE INDEX IF NOT EXISTS usage_events_time ON usage_events(created_at)`,
`CREATE TABLE IF NOT EXISTS usage_feedback (
 id text PRIMARY KEY,reading_id text NOT NULL,vote text NOT NULL,
 category text NOT NULL DEFAULT 'other',note text NOT NULL DEFAULT '',
 created_at text NOT NULL,updated_at text NOT NULL
)`,
`CREATE TABLE IF NOT EXISTS usage_runs (
 id text PRIMARY KEY,reading_id text,status text NOT NULL,
 engine text NOT NULL DEFAULT '',requested_model boolean NOT NULL DEFAULT false,
 duration_ms integer NOT NULL DEFAULT 0,error_code text NOT NULL DEFAULT '',
 created_at text NOT NULL,updated_at text NOT NULL
)`,
`CREATE INDEX IF NOT EXISTS usage_runs_time ON usage_runs(created_at)`,
] as const;

export async function initializeSchema(database:import("./database-core").Database){
  await database.batch([
    database.prepare("SELECT pg_advisory_xact_lock(74912641)"),
    ...SCHEMA_STATEMENTS.map(sql=>database.prepare(sql)),
  ]);
}
