import { Router } from 'express'
import { getDb } from '../db/index.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { authenticate } from '../middleware/auth.js'
import { notificationPublic } from '../utils/serialize.js'

const router = Router()
router.use(authenticate)

// GET /api/notifications  — current user's notifications (?unread=true)
router.get('/', asyncHandler(async (req, res) => {
  const db = getDb()
  let sql = 'SELECT * FROM notifications WHERE user_id = ?'
  const args = [req.user.id]
  if (req.query.unread === 'true') sql += ' AND unread = 1'
  sql += ' ORDER BY created_at DESC'
  const rows = db.prepare(sql).all(...args)
  const unreadCount = db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND unread = 1')
    .get(req.user.id).n
  res.json({ data: rows.map(notificationPublic), unreadCount })
}))

// POST /api/notifications/:id/read
router.post('/:id/read', asyncHandler(async (req, res) => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id)
  if (!row) throw ApiError.notFound('Notification not found')
  db.prepare('UPDATE notifications SET unread = 0 WHERE id = ?').run(row.id)
  res.json({ data: notificationPublic(db.prepare('SELECT * FROM notifications WHERE id = ?').get(row.id)) })
}))

// POST /api/notifications/read-all
router.post('/read-all', asyncHandler(async (req, res) => {
  getDb().prepare('UPDATE notifications SET unread = 0 WHERE user_id = ? AND unread = 1').run(req.user.id)
  res.json({ message: 'All notifications marked read' })
}))

export default router
