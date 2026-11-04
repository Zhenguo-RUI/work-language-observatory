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
] as const;

export async function initializeSchema(database:import("./database-core").Database){
  await database.batch([
    database.prepare("SELECT pg_advisory_xact_lock(74912641)"),
    ...SCHEMA_STATEMENTS.map(sql=>database.prepare(sql)),
  ]);
}
