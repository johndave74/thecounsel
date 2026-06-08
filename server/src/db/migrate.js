// Idempotent "migration": applies schema.sql. Safe to run repeatedly.
import { getDb, closeDb } from './index.js'

export function migrate() {
  getDb() // opening the db applies schema.sql
}

// Run directly: `npm run migrate`
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('migrate.js')) {
  migrate()
  // eslint-disable-next-line no-console
  console.log('[migrate] schema applied')
  closeDb()
}
