BEGIN;
CREATE TABLE IF NOT EXISTS focus_accounts (
 id BIGSERIAL PRIMARY KEY, name VARCHAR(80) NOT NULL, email VARCHAR(254) NOT NULL UNIQUE,
 password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS focus_sessions (
 token_hash CHAR(64) PRIMARY KEY, account_id BIGINT REFERENCES focus_accounts(id), csrf CHAR(64) NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS focus_sessions_expiry ON focus_sessions(expires_at);
CREATE TABLE IF NOT EXISTS focus_rate_limits (
 key_hash CHAR(64) PRIMARY KEY, window_start TIMESTAMPTZ NOT NULL, hits INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS focus_resets (
 token_hash CHAR(64) PRIMARY KEY, account_id BIGINT NOT NULL REFERENCES focus_accounts(id), expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS focus_groups (
 id BIGSERIAL PRIMARY KEY, owner_id BIGINT NOT NULL REFERENCES focus_accounts(id), name VARCHAR(100) NOT NULL,
 timezone VARCHAR(100) NOT NULL, leaderboard_enabled BOOLEAN NOT NULL DEFAULT false, archived BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS focus_memberships (
 group_id BIGINT REFERENCES focus_groups(id), account_id BIGINT REFERENCES focus_accounts(id),
 share_progress BOOLEAN NOT NULL DEFAULT false, show_ranking BOOLEAN NOT NULL DEFAULT false,
 PRIMARY KEY(group_id,account_id)
);
CREATE TABLE IF NOT EXISTS focus_invites (
 group_id BIGINT PRIMARY KEY REFERENCES focus_groups(id), token_hash CHAR(64) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS focus_schedules (
 id BIGSERIAL PRIMARY KEY, group_id BIGINT NOT NULL REFERENCES focus_groups(id), task VARCHAR(500) NOT NULL,
 starts_at TIMESTAMPTZ NOT NULL, focus_minutes INTEGER NOT NULL CHECK(focus_minutes BETWEEN 1 AND 180),
 break_minutes INTEGER NOT NULL CHECK(break_minutes BETWEEN 1 AND 60), rounds INTEGER NOT NULL CHECK(rounds BETWEEN 1 AND 8)
);
CREATE TABLE IF NOT EXISTS focus_templates (
 group_id BIGINT PRIMARY KEY REFERENCES focus_groups(id), task VARCHAR(500) NOT NULL,
 focus_minutes INTEGER NOT NULL, break_minutes INTEGER NOT NULL, rounds INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS focus_participation (
 id BIGSERIAL PRIMARY KEY, account_id BIGINT NOT NULL REFERENCES focus_accounts(id),
 schedule_id BIGINT REFERENCES focus_schedules(id), client_id VARCHAR(100), starts_at TIMESTAMPTZ NOT NULL,
 duration_seconds INTEGER NOT NULL, active BOOLEAN NOT NULL DEFAULT true, paused BOOLEAN NOT NULL DEFAULT false,
 last_confirmed TIMESTAMPTZ NOT NULL,
 CHECK ((schedule_id IS NULL) <> (client_id IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS focus_one_active_source ON focus_participation(account_id) WHERE active;
CREATE UNIQUE INDEX IF NOT EXISTS focus_group_participation ON focus_participation(account_id,schedule_id) WHERE schedule_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS focus_solo_client ON focus_participation(account_id,client_id) WHERE client_id IS NOT NULL;
ALTER TABLE focus_participation ADD COLUMN IF NOT EXISTS solo_ends_at TIMESTAMPTZ;
ALTER TABLE focus_participation ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS focus_intervals (
 id BIGSERIAL PRIMARY KEY, account_id BIGINT NOT NULL REFERENCES focus_accounts(id),
 participation_id BIGINT NOT NULL REFERENCES focus_participation(id), starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
 CHECK(ends_at>starts_at)
);
CREATE INDEX IF NOT EXISTS focus_intervals_account_time ON focus_intervals(account_id,starts_at,ends_at);
CREATE TABLE IF NOT EXISTS focus_credits (
 participation_id BIGINT REFERENCES focus_participation(id), round INTEGER NOT NULL, completed_at TIMESTAMPTZ NOT NULL,
 PRIMARY KEY(participation_id,round)
);
CREATE TABLE IF NOT EXISTS focus_forfeits (
 participation_id BIGINT REFERENCES focus_participation(id), round INTEGER NOT NULL,
 PRIMARY KEY(participation_id,round)
);
COMMIT;
