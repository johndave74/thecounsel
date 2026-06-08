import { Router } from 'express'
import { getDb, transaction } from '../db/index.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { id } from '../utils/ids.js'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/auth.js'
import { caseRowOr404 } from '../repo.js'
import { hearingPublic } from '../utils/serialize.js'
import { createHearingSchema, updateHearingSchema } from '../schemas.js'

const router = Router()
router.use(authenticate)

/** Recompute a case's next_hearing as the earliest upcoming non-deadline event. */
function recomputeNextHearing(db, caseId) {
  const today = new Date().toISOString().slice(0, 10)
  const row = db.prepare(
    `SELECT MIN(date) AS d FROM hearings
     WHERE case_id = ? AND type != 'deadline' AND date >= ?`,
  ).get(caseId, today)
  db.prepare("UPDATE cases SET next_hearing = ?, updated_at = datetime('now') WHERE id = ?")
    .run(row.d || null, caseId)
}

// GET /api/hearings  — ?caseId=&type=&from=&to=
router.get('/', asyncHandler(async (req, res) => {
  const { caseId, type, from, to } = req.query
  let sql = 'SELECT * FROM hearings'
  const where = []
  const args = []
  if (caseId) { where.push('case_id = ?'); args.push(caseId) }
  if (type) { where.push('type = ?'); args.push(type) }
  if (from) { where.push('date >= ?'); args.push(from) }
  if (to) { where.push('date <= ?'); args.push(to) }
  if (where.length) sql += ' WHERE ' + where.join(' AND ')
  sql += ' ORDER BY date, time'
  res.json({ data: getDb().prepare(sql).all(...args).map(hearingPublic) })
}))

// GET /api/hearings/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const row = getDb().prepare('SELECT * FROM hearings WHERE id = ?').get(req.params.id)
  if (!row) throw ApiError.notFound('Hearing not found')
  res.json({ data: hearingPublic(row) })
}))

// POST /api/hearings
router.post('/', validate(createHearingSchema), asyncHandler(async (req, res) => {
  const b = req.body
  caseRowOr404(b.caseId)
  const hearingId = id('h')
  const type = b.type || 'court'

  transaction((tx) => {
    tx.prepare(`INSERT INTO hearings (id, case_id, title, date, time, court, judge, type, status)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(
      hearingId, b.caseId, b.title, b.date, b.time || '09:00',
      b.court || '—', b.judge || '—', type, b.status || (type === 'deadline' ? 'Due' : 'Confirmed'),
    )
    if (type !== 'deadline') recomputeNextHearing(tx, b.caseId)
  })

  res.status(201).json({ data: hearingPublic(getDb().prepare('SELECT * FROM hearings WHERE id = ?').get(hearingId)) })
}))

// PATCH /api/hearings/:id
router.patch('/:id', validate(updateHearingSchema), asyncHandler(async (req, res) => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM hearings WHERE id = ?').get(req.params.id)
  if (!existing) throw ApiError.notFound('Hearing not found')
  const b = req.body
  const map = {
    title: b.title, date: b.date, time: b.time, court: b.court,
    judge: b.judge, type: b.type, status: b.status,
  }
  const cols = Object.entries(map).filter(([, v]) => v !== undefined)

  transaction((tx) => {
    const sql = `UPDATE hearings SET ${cols.map(([c]) => `${c} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`
    tx.prepare(sql).run(...cols.map(([, v]) => v), existing.id)
    recomputeNextHearing(tx, existing.case_id)
  })
  res.json({ data: hearingPublic(db.prepare('SELECT * FROM hearings WHERE id = ?').get(existing.id)) })
}))

// DELETE /api/hearings/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM hearings WHERE id = ?').get(req.params.id)
  if (!existing) throw ApiError.notFound('Hearing not found')
  transaction((tx) => {
    tx.prepare('DELETE FROM hearings WHERE id = ?').run(existing.id)
    recomputeNextHearing(tx, existing.case_id)
  })
  res.json({ message: 'Hearing deleted' })
}))

export default router
