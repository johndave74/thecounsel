import { getDb, transaction, closeDb } from './index.js'
import { hashPassword } from '../utils/password.js'
import { id } from '../utils/ids.js'
import * as data from './seedData.js'

const TABLES = [
  'password_resets', 'refresh_tokens', 'notifications', 'timeline', 'notes',
  'tasks', 'documents', 'hearings', 'case_lawyers', 'cases', 'clients', 'users',
]

function isSeeded(db) {
  const row = db.prepare('SELECT COUNT(*) AS n FROM users').get()
  return row.n > 0
}

function clearAll(db) {
  for (const t of TABLES) db.exec(`DELETE FROM ${t};`)
}

/**
 * Populate the database with the demo dataset.
 * @param {object} opts
 * @param {boolean} opts.force  wipe + reseed even if data already exists
 * @param {boolean} opts.silent suppress console output (tests)
 */
export async function seedDatabase({ force = false, silent = false } = {}) {
  const db = getDb()

  if (isSeeded(db) && !force) {
    if (!silent) console.log('[seed] database already populated — skipping (use --force to reseed)')
    return { skipped: true }
  }

  const passwordHash = await hashPassword(data.DEMO_PASSWORD)
  const minutesToTs = (m) => new Date(Date.now() - m * 60000).toISOString().replace('T', ' ').slice(0, 19)

  transaction((tx) => {
    if (force) clearAll(tx)

    const insUser = tx.prepare(`INSERT INTO users
      (id, name, initials, email, password_hash, role, title, specialty, phone, bar_no, tone, win_rate)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    for (const u of data.users) {
      insUser.run(u.id, u.name, data.initialsOf(u.name), u.email.toLowerCase(), passwordHash,
        u.role, u.title, u.specialty, u.phone, u.barNo, u.tone, u.winRate)
    }

    const insClient = tx.prepare(`INSERT INTO clients
      (id, name, type, company, email, phone, since, tone, address) VALUES (?,?,?,?,?,?,?,?,?)`)
    for (const c of data.clients) {
      insClient.run(c.id, c.name, c.type, c.company, c.email, c.phone, c.since, c.tone, c.address)
    }

    const insCase = tx.prepare(`INSERT INTO cases
      (id, number, title, client_id, status, practice, priority, opened, court, judge, progress, value, next_hearing, description)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    const insCaseLawyer = tx.prepare('INSERT INTO case_lawyers (case_id, user_id) VALUES (?,?)')
    for (const k of data.cases) {
      insCase.run(k.id, k.number, k.title, k.clientId, k.status, k.practice, k.priority,
        k.opened, k.court, k.judge, k.progress, k.value, k.nextHearing, k.desc)
      for (const lid of k.lawyerIds) insCaseLawyer.run(k.id, lid)
    }

    const insHearing = tx.prepare(`INSERT INTO hearings
      (id, case_id, title, date, time, court, judge, type, status) VALUES (?,?,?,?,?,?,?,?,?)`)
    for (const h of data.hearings) {
      insHearing.run(h.id, h.caseId, h.title, h.date, h.time, h.court, h.judge, h.type, h.status)
    }

    const insDoc = tx.prepare(`INSERT INTO documents
      (id, name, ext, case_id, category, size, uploaded_by, date) VALUES (?,?,?,?,?,?,?,?)`)
    for (const d of data.documents) {
      insDoc.run(d.id, d.name, d.ext, d.caseId, d.category, d.size, d.uploadedBy, d.date)
    }

    const insTask = tx.prepare(`INSERT INTO tasks
      (id, title, case_id, assignee_id, due, priority, done) VALUES (?,?,?,?,?,?,?)`)
    for (const t of data.tasks) {
      insTask.run(t.id, t.title, t.caseId, t.assigneeId, t.due, t.priority, t.done ? 1 : 0)
    }

    const insNote = tx.prepare(`INSERT INTO notes
      (id, case_id, author_id, author, initials, tone, date, text) VALUES (?,?,?,?,?,?,?,?)`)
    for (const [caseId, list] of Object.entries(data.notes)) {
      for (const n of list) {
        insNote.run(n.id, caseId, n.authorId, n.author, n.initials, n.tone, n.date, n.text)
      }
    }

    const insTl = tx.prepare('INSERT INTO timeline (id, case_id, date, title, description) VALUES (?,?,?,?,?)')
    for (const [caseId, list] of Object.entries(data.timeline)) {
      for (const e of list) insTl.run(id('tl'), caseId, e.date, e.title, e.desc)
    }

    // Notifications belong to the admin (the seeded current user).
    const insNotif = tx.prepare(`INSERT INTO notifications
      (id, user_id, kind, title, body, unread, created_at) VALUES (?,?,?,?,?,?,?)`)
    const adminId = data.users[0].id
    for (const n of data.notifications) {
      insNotif.run(n.id, adminId, n.kind, n.title, n.body, n.unread ? 1 : 0, minutesToTs(n.minutesAgo))
    }
  })

  if (!silent) console.log('[seed] database populated with demo dataset')
  return { skipped: false }
}

// Run directly: `npm run seed` (add --force to wipe + reseed)
if (process.argv[1]?.endsWith('seed.js')) {
  const force = process.argv.includes('--force')
  seedDatabase({ force })
    .then(() => closeDb())
    .catch((err) => {
      console.error('[seed] failed:', err)
      process.exit(1)
    })
}
