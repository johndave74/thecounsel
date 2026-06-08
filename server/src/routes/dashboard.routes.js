import { Router } from 'express'
import { getDb } from '../db/index.js'
import asyncHandler from '../utils/asyncHandler.js'
import { authenticate } from '../middleware/auth.js'
import { CASE_STATUSES } from '../schemas.js'
import { hearingPublic, taskPublic } from '../utils/serialize.js'

const router = Router()
router.use(authenticate)

// GET /api/dashboard/stats  — everything the Dashboard page renders
router.get('/stats', asyncHandler(async (req, res) => {
  const db = getDb()
  const today = new Date().toISOString().slice(0, 10)

  const totalCases = db.prepare('SELECT COUNT(*) AS n FROM cases').get().n
  const totalClients = db.prepare('SELECT COUNT(*) AS n FROM clients').get().n
  const totalStaff = db.prepare('SELECT COUNT(*) AS n FROM users WHERE is_active = 1').get().n

  // Caseload by status (always include every status, even at 0).
  const statusRows = db.prepare('SELECT status, COUNT(*) AS n FROM cases GROUP BY status').all()
  const byStatus = Object.fromEntries(CASE_STATUSES.map((s) => [s, 0]))
  for (const r of statusRows) byStatus[r.status] = r.n

  const ACTIVE = ['Open', 'Pending', 'In Court']
  const activeCases = ACTIVE.reduce((sum, s) => sum + byStatus[s], 0)

  // Win rate across decided cases.
  const won = byStatus.Won
  const decided = byStatus.Won + byStatus.Lost
  const winRate = decided ? Math.round((won / decided) * 100) : null

  const upcomingHearings = db.prepare(
    "SELECT * FROM hearings WHERE date >= ? AND type != 'deadline' ORDER BY date, time LIMIT 6",
  ).all(today).map(hearingPublic)

  const openTasks = db.prepare('SELECT COUNT(*) AS n FROM tasks WHERE done = 0').get().n
  const overdueTasks = db.prepare(
    'SELECT COUNT(*) AS n FROM tasks WHERE done = 0 AND due IS NOT NULL AND due < ?',
  ).get(today).n
  const upcomingTasks = db.prepare(
    'SELECT * FROM tasks WHERE done = 0 ORDER BY (due IS NULL), due LIMIT 6',
  ).all().map(taskPublic)

  const upcomingDeadlines = db.prepare(
    "SELECT * FROM hearings WHERE type = 'deadline' AND date >= ? ORDER BY date, time LIMIT 6",
  ).all(today).map(hearingPublic)

  const unreadNotifications = db.prepare(
    'SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND unread = 1',
  ).get(req.user.id).n

  res.json({
    totals: { cases: totalCases, activeCases, clients: totalClients, staff: totalStaff },
    caseloadByStatus: byStatus,
    winRate,
    tasks: { open: openTasks, overdue: overdueTasks },
    upcomingHearings,
    upcomingTasks,
    upcomingDeadlines,
    unreadNotifications,
  })
}))

export default router
