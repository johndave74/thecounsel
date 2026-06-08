import { Router } from 'express'
import { getDb } from '../db/index.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { id } from '../utils/ids.js'
import { hashPassword } from '../utils/password.js'
import { validate } from '../middleware/validate.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { serializeUser, userRowOr404 } from '../repo.js'
import { initialsOf } from '../db/seedData.js'
import { createUserSchema, updateUserSchema } from '../schemas.js'

const router = Router()
router.use(authenticate)

// GET /api/users  — roster of lawyers & staff (optionally ?role=Lawyer)
router.get('/', asyncHandler(async (req, res) => {
  const { role } = req.query
  const db = getDb()
  const rows = role
    ? db.prepare('SELECT * FROM users WHERE role = ? ORDER BY name').all(role)
    : db.prepare('SELECT * FROM users ORDER BY name').all()
  res.json({ data: rows.map(serializeUser) })
}))

// GET /api/users/:id
router.get('/:id', asyncHandler(async (req, res) => {
  res.json({ data: serializeUser(userRowOr404(req.params.id)) })
}))

// POST /api/users  — invite a team member (Admin only)
router.post('/', authorize('Admin'), validate(createUserSchema), asyncHandler(async (req, res) => {
  const { name, email, password, role, title, specialty, phone, barNo } = req.body
  const db = getDb()
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    throw ApiError.conflict('An account with that email already exists')
  }
  const userId = id('l')
  const hash = await hashPassword(password)
  db.prepare(`INSERT INTO users
    (id, name, initials, email, password_hash, role, title, specialty, phone, bar_no, win_rate)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
    userId, name, initialsOf(name), email, hash, role,
    title || (role === 'Staff' ? 'Legal Assistant' : 'Associate'),
    specialty || 'General Practice', phone || '—',
    role === 'Staff' ? '—' : (barNo || 'Pending'),
    role === 'Staff' ? null : 0,
  )
  res.status(201).json({ data: serializeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(userId)) })
}))

// PATCH /api/users/:id  — Admin only
router.patch('/:id', authorize('Admin'), validate(updateUserSchema), asyncHandler(async (req, res) => {
  const user = userRowOr404(req.params.id)
  const b = req.body
  const map = {
    name: b.name, role: b.role, title: b.title, specialty: b.specialty,
    phone: b.phone, bar_no: b.barNo,
    win_rate: b.winRate === undefined ? undefined : b.winRate,
    is_active: b.isActive === undefined ? undefined : (b.isActive ? 1 : 0),
  }
  if (b.name) map.initials = initialsOf(b.name)

  const cols = Object.entries(map).filter(([, v]) => v !== undefined)
  const sql = `UPDATE users SET ${cols.map(([c]) => `${c} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`
  getDb().prepare(sql).run(...cols.map(([, v]) => v), user.id)
  res.json({ data: serializeUser(getDb().prepare('SELECT * FROM users WHERE id = ?').get(user.id)) })
}))

// DELETE /api/users/:id  — soft-delete (deactivate). Admin only.
router.delete('/:id', authorize('Admin'), asyncHandler(async (req, res) => {
  const user = userRowOr404(req.params.id)
  if (user.id === req.user.id) throw ApiError.badRequest('You cannot deactivate your own account')
  getDb().prepare("UPDATE users SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(user.id)
  res.json({ message: 'User deactivated' })
}))

export default router
