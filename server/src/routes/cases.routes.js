import { Router } from 'express'
import { getDb, transaction } from '../db/index.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { id } from '../utils/ids.js'
import { validate } from '../middleware/validate.js'
import { authenticate, authorize } from '../middleware/auth.js'
import {
  serializeCase, caseRowOr404, clientRowOr404, lawyerIdsForCase,
} from '../repo.js'
import {
  hearingPublic, documentPublic, taskPublic, notePublic, timelinePublic,
} from '../utils/serialize.js'
import {
  createCaseSchema, updateCaseSchema, assignLawyerSchema, createNoteSchema,
} from '../schemas.js'

const router = Router()
router.use(authenticate)

const todayIso = () => new Date().toISOString().slice(0, 10)
const TERMINAL = new Set(['Won', 'Lost', 'Closed'])

const assertLawyersExist = (db, ids) => {
  for (const lid of ids) {
    if (!db.prepare('SELECT id FROM users WHERE id = ? AND is_active = 1').get(lid)) {
      throw ApiError.badRequest(`Unknown or inactive user: ${lid}`)
    }
  }
}

// GET /api/cases  — ?search=&status=&practice=
router.get('/', asyncHandler(async (req, res) => {
  const { search, status, practice } = req.query
  let sql = 'SELECT * FROM cases'
  const where = []
  const args = []
  if (status) { where.push('status = ?'); args.push(status) }
  if (practice) { where.push('practice = ?'); args.push(practice) }
  if (search) {
    where.push('(LOWER(title) LIKE ? OR LOWER(number) LIKE ?)')
    const q = `%${String(search).toLowerCase()}%`
    args.push(q, q)
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ')
  sql += ' ORDER BY opened DESC'
  res.json({ data: getDb().prepare(sql).all(...args).map(serializeCase) })
}))

// GET /api/cases/:id
router.get('/:id', asyncHandler(async (req, res) => {
  res.json({ data: serializeCase(caseRowOr404(req.params.id)) })
}))

// POST /api/cases
router.post('/', validate(createCaseSchema), asyncHandler(async (req, res) => {
  const b = req.body
  const db = getDb()
  clientRowOr404(b.clientId)
  const lawyerIds = [...new Set(b.lawyerIds)]
  assertLawyersExist(db, lawyerIds)

  const caseId = id('CASE')
  const seq = Math.floor(2060 + Math.random() * 900)
  const number = `2026-${(b.practice || 'XX').replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase() || 'XX'}-${seq}`
  const progress = TERMINAL.has(b.status) ? 100 : 5

  transaction((tx) => {
    tx.prepare(`INSERT INTO cases
      (id, number, title, client_id, status, practice, priority, opened, court, judge, progress, value, next_hearing, description)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      caseId, number, b.title, b.clientId, b.status, b.practice || 'General', b.priority,
      todayIso(), b.court || 'Pre-litigation', b.judge || '—', progress,
      b.value || '—', b.nextHearing || null, b.desc || 'No summary provided yet.',
    )
    const insLawyer = tx.prepare('INSERT INTO case_lawyers (case_id, user_id) VALUES (?,?)')
    for (const lid of lawyerIds) insLawyer.run(caseId, lid)
    tx.prepare('INSERT INTO timeline (id, case_id, date, title, description) VALUES (?,?,?,?,?)')
      .run(id('tl'), caseId, todayIso(), 'Case opened', `Matter opened — ${b.title}.`)
  })

  res.status(201).json({ data: serializeCase(db.prepare('SELECT * FROM cases WHERE id = ?').get(caseId)) })
}))

// PATCH /api/cases/:id
router.patch('/:id', validate(updateCaseSchema), asyncHandler(async (req, res) => {
  const c = caseRowOr404(req.params.id)
  const b = req.body
  const db = getDb()
  if (b.clientId) clientRowOr404(b.clientId)

  const map = {
    title: b.title, client_id: b.clientId, status: b.status, practice: b.practice,
    priority: b.priority, court: b.court, judge: b.judge, progress: b.progress,
    value: b.value, next_hearing: b.nextHearing, description: b.desc,
  }
  // Auto-complete progress when a case moves to a terminal status (unless explicitly set).
  if (b.status && TERMINAL.has(b.status) && b.progress === undefined) map.progress = 100

  const cols = Object.entries(map).filter(([, v]) => v !== undefined)
  const sql = `UPDATE cases SET ${cols.map(([col]) => `${col} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`
  db.prepare(sql).run(...cols.map(([, v]) => v), c.id)
  res.json({ data: serializeCase(db.prepare('SELECT * FROM cases WHERE id = ?').get(c.id)) })
}))

// DELETE /api/cases/:id  — Admin only (cascades hearings/docs/tasks/notes/timeline)
router.delete('/:id', authorize('Admin'), asyncHandler(async (req, res) => {
  const c = caseRowOr404(req.params.id)
  getDb().prepare('DELETE FROM cases WHERE id = ?').run(c.id)
  res.json({ message: 'Case deleted' })
}))

// ── Team assignment ───────────────────────────────────────────────────────
// POST /api/cases/:id/lawyers  { lawyerId }
router.post('/:id/lawyers', validate(assignLawyerSchema), asyncHandler(async (req, res) => {
  const c = caseRowOr404(req.params.id)
  const db = getDb()
  assertLawyersExist(db, [req.body.lawyerId])
  const already = db.prepare('SELECT 1 FROM case_lawyers WHERE case_id = ? AND user_id = ?')
    .get(c.id, req.body.lawyerId)
  if (!already) {
    db.prepare('INSERT INTO case_lawyers (case_id, user_id) VALUES (?,?)').run(c.id, req.body.lawyerId)
  }
  res.json({ data: serializeCase(db.prepare('SELECT * FROM cases WHERE id = ?').get(c.id)) })
}))

// DELETE /api/cases/:id/lawyers/:lawyerId
router.delete('/:id/lawyers/:lawyerId', asyncHandler(async (req, res) => {
  const c = caseRowOr404(req.params.id)
  getDb().prepare('DELETE FROM case_lawyers WHERE case_id = ? AND user_id = ?')
    .run(c.id, req.params.lawyerId)
  res.json({ data: serializeCase(getDb().prepare('SELECT * FROM cases WHERE id = ?').get(c.id)) })
}))

// ── Sub-resources ─────────────────────────────────────────────────────────
// GET /api/cases/:id/hearings
router.get('/:id/hearings', asyncHandler(async (req, res) => {
  caseRowOr404(req.params.id)
  const rows = getDb().prepare('SELECT * FROM hearings WHERE case_id = ? ORDER BY date, time').all(req.params.id)
  res.json({ data: rows.map(hearingPublic) })
}))

// GET /api/cases/:id/documents
router.get('/:id/documents', asyncHandler(async (req, res) => {
  caseRowOr404(req.params.id)
  const rows = getDb().prepare('SELECT * FROM documents WHERE case_id = ? ORDER BY date DESC').all(req.params.id)
  res.json({ data: rows.map(documentPublic) })
}))

// GET /api/cases/:id/tasks
router.get('/:id/tasks', asyncHandler(async (req, res) => {
  caseRowOr404(req.params.id)
  const rows = getDb().prepare('SELECT * FROM tasks WHERE case_id = ? ORDER BY done, due').all(req.params.id)
  res.json({ data: rows.map(taskPublic) })
}))

// GET /api/cases/:id/timeline
router.get('/:id/timeline', asyncHandler(async (req, res) => {
  caseRowOr404(req.params.id)
  const rows = getDb().prepare('SELECT * FROM timeline WHERE case_id = ? ORDER BY date').all(req.params.id)
  res.json({ data: rows.map(timelinePublic) })
}))

// ── Notes ─────────────────────────────────────────────────────────────────
// GET /api/cases/:id/notes
router.get('/:id/notes', asyncHandler(async (req, res) => {
  caseRowOr404(req.params.id)
  const rows = getDb().prepare('SELECT * FROM notes WHERE case_id = ? ORDER BY date DESC, created_at DESC').all(req.params.id)
  res.json({ data: rows.map(notePublic) })
}))

// POST /api/cases/:id/notes
router.post('/:id/notes', validate(createNoteSchema), asyncHandler(async (req, res) => {
  const c = caseRowOr404(req.params.id)
  const u = req.user
  const noteId = id('no')
  getDb().prepare(`INSERT INTO notes (id, case_id, author_id, author, initials, tone, date, text)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    noteId, c.id, u.id, u.name, u.initials, u.tone, todayIso(), req.body.text,
  )
  res.status(201).json({ data: notePublic(getDb().prepare('SELECT * FROM notes WHERE id = ?').get(noteId)) })
}))

export default router
