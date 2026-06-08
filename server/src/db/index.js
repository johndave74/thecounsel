import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import env from '../config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let db

/** Open (and cache) the database connection, applying pragmas + schema. */
export function getDb() {
  if (db) return db

  if (env.DATABASE_PATH !== ':memory:') {
    fs.mkdirSync(path.dirname(env.DATABASE_PATH), { recursive: true })
  }

  db = new DatabaseSync(env.DATABASE_PATH)
  // WAL gives us better read/write concurrency; foreign_keys enforces integrity.
  // (WAL is a no-op for :memory:, which is fine.)
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec('PRAGMA foreign_keys = ON;')
  db.exec('PRAGMA busy_timeout = 5000;')

  applySchema(db)
  return db
}

/** Idempotently create all tables/indexes from schema.sql. */
export function applySchema(database) {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  database.exec(schema)
}

/**
 * Run a function inside a transaction. Commits on success, rolls back on throw.
 * node:sqlite has no transaction helper, so we drive BEGIN/COMMIT/ROLLBACK.
 */
export function transaction(fn) {
  const database = getDb()
  database.exec('BEGIN')
  try {
    const result = fn(database)
    database.exec('COMMIT')
    return result
  } catch (err) {
    try {
      database.exec('ROLLBACK')
    } catch {
      /* ignore rollback failure — surface the original error */
    }
    throw err
  }
}

/** Close the connection (used by tests / graceful shutdown). */
export function closeDb() {
  if (db) {
    db.close()
    db = undefined
  }
}
