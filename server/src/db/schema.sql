-- =========================================================================
-- The Counsel — schema (SQLite / node:sqlite)
-- All ids are application-generated text (prefix-random) to match the
-- frontend's id style (e.g. "CASE-2041", "c1", "l1").
-- =========================================================================

PRAGMA foreign_keys = ON;

-- Users (lawyers + staff + admins). Authentication lives here too.
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  initials      TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('Admin','Lawyer','Staff')),
  title         TEXT NOT NULL DEFAULT 'Associate',
  specialty     TEXT NOT NULL DEFAULT 'General Practice',
  phone         TEXT NOT NULL DEFAULT '—',
  bar_no        TEXT NOT NULL DEFAULT '—',
  tone          INTEGER NOT NULL DEFAULT 0,
  win_rate      INTEGER,                       -- null for staff
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('Individual','Corporate')),
  company    TEXT,
  email      TEXT,
  phone      TEXT,
  since      TEXT,                             -- ISO date (YYYY-MM-DD)
  tone       INTEGER NOT NULL DEFAULT 0,
  address    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cases (matters)
CREATE TABLE IF NOT EXISTS cases (
  id           TEXT PRIMARY KEY,
  number       TEXT NOT NULL,
  title        TEXT NOT NULL,
  client_id    TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  status       TEXT NOT NULL CHECK (status IN ('Open','Pending','In Court','Closed','Won','Lost')),
  practice     TEXT NOT NULL DEFAULT 'General',
  priority     TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High')),
  opened       TEXT NOT NULL,
  court        TEXT NOT NULL DEFAULT 'Pre-litigation',
  judge        TEXT NOT NULL DEFAULT '—',
  progress     INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  value        TEXT NOT NULL DEFAULT '—',
  next_hearing TEXT,
  description  TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cases_client ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);

-- Case ↔ User assignment (the legal team on a matter)
CREATE TABLE IF NOT EXISTS case_lawyers (
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (case_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_case_lawyers_user ON case_lawyers(user_id);

-- Hearings / calendar events (court, hearing, deadline, meeting)
CREATE TABLE IF NOT EXISTS hearings (
  id         TEXT PRIMARY KEY,
  case_id    TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  date       TEXT NOT NULL,
  time       TEXT NOT NULL DEFAULT '09:00',
  court      TEXT NOT NULL DEFAULT '—',
  judge      TEXT NOT NULL DEFAULT '—',
  type       TEXT NOT NULL DEFAULT 'court' CHECK (type IN ('court','hearing','deadline','meeting')),
  status     TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed','Tentative','Due')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_hearings_case ON hearings(case_id);
CREATE INDEX IF NOT EXISTS idx_hearings_date ON hearings(date);

-- Documents (metadata; bytes live on disk under UPLOAD_DIR)
CREATE TABLE IF NOT EXISTS documents (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  ext          TEXT NOT NULL DEFAULT 'default',
  case_id      TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  category     TEXT NOT NULL DEFAULT 'General',
  size         TEXT NOT NULL DEFAULT '—',      -- human-readable, mirrors frontend
  bytes        INTEGER NOT NULL DEFAULT 0,
  mime         TEXT,
  storage_key  TEXT,                           -- filename on disk (null for seed rows)
  uploaded_by  TEXT NOT NULL,                  -- display name
  uploader_id  TEXT REFERENCES users(id) ON DELETE SET NULL,
  date         TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_documents_case ON documents(case_id);

-- Tasks / deadlines
CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  case_id     TEXT REFERENCES cases(id) ON DELETE CASCADE,
  assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  due         TEXT,
  priority    TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High')),
  done        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_case ON tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);

-- Case notes
CREATE TABLE IF NOT EXISTS notes (
  id         TEXT PRIMARY KEY,
  case_id    TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id  TEXT REFERENCES users(id) ON DELETE SET NULL,
  author     TEXT NOT NULL,                    -- display name snapshot
  initials   TEXT NOT NULL,
  tone       INTEGER NOT NULL DEFAULT 0,
  date       TEXT NOT NULL,
  text       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notes_case ON notes(case_id);

-- Case timeline events
CREATE TABLE IF NOT EXISTS timeline (
  id          TEXT PRIMARY KEY,
  case_id     TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_timeline_case ON timeline(case_id);

-- Notifications (per-user)
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL DEFAULT 'info' CHECK (kind IN ('warn','cal','info','ok')),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  unread     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Refresh tokens (rotating; only the hash is stored)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);

-- Password reset tokens (only the hash is stored)
CREATE TABLE IF NOT EXISTS password_resets (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
