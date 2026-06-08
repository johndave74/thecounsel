import { Router } from 'express'
import { getDb } from '../db/index.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { id } from '../utils/ids.js'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/auth.js'
import { caseRowOr404, userRowOr404 } from '../repo.js'
import { taskPublic } from '../utils/serialize.js'
import { createTaskSchema, updateTaskSchema } from '../schemas.js'

const router = Router()
router.use(authenticate)

const taskOr404 = (taskId) => {
  const row = getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(taskId)
  if (!row) throw ApiError.notFound('Task not found')
  return row
}

// GET /api/tasks  — ?caseId=&assigneeId=&done=true|false&overdue=true
router.get('/', asyncHandler(async (req, res) => {
  const { caseId, assigneeId, done, overdue } = req.query
  let sql = 'SELECT * FROM tasks'
  const where = []
  const args = []
  if (caseId) { where.push('case_id = ?'); args.push(caseId) }
  if (assigneeId) { where.push('assignee_id = ?'); args.push(assigneeId) }
  if (done !== undefined) { where.push('done = ?'); args.push(done === 'true' ? 1 : 0) }
  if (overdue === 'true') {
    where.push('done = 0 AND due IS NOT NULL AND due < ?')
    args.push(new Date().toISOString().slice(0, 10))
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ')
  sql += ' ORDER BY done, due'
  res.json({ data: getDb().prepare(sql).all(...args).map(taskPublic) })
}))

// GET /api/tasks/:id
router.get('/:id', asyncHandler(async (req, res) => {
  res.json({ data: taskPublic(taskOr404(req.params.id)) })
}))

// POST /api/tasks
router.post('/', validate(createTaskSchema), asyncHandler(async (req, res) => {
  const b = req.body
  if (b.caseId) caseRowOr404(b.caseId)
  if (b.assigneeId) userRowOr404(b.assigneeId)
  const taskId = id('t')
  getDb().prepare(`INSERT INTO tasks (id, title, case_id, assignee_id, due, priority, done)
    VALUES (?,?,?,?,?,?,0)`).run(
    taskId, b.title, b.caseId || null, b.assigneeId || null, b.due || null, b.priority,
  )
  res.status(201).json({ data: taskPublic(getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(taskId)) })
}))

// PATCH /api/tasks/:id
router.patch('/:id', validate(updateTaskSchema), asyncHandler(async (req, res) => {
  const task = taskOr404(req.params.id)
  const b = req.body
  if (b.caseId) caseRowOr404(b.caseId)
  if (b.assigneeId) userRowOr404(b.assigneeId)
  const map = {
    title: b.title, case_id: b.caseId, assignee_id: b.assigneeId,
    due: b.due, priority: b.priority,
    done: b.done === undefined ? undefined : (b.done ? 1 : 0),
  }
  const cols = Object.entries(map).filter(([, v]) => v !== undefined)
  const sql = `UPDATE tasks SET ${cols.map(([c]) => `${c} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`
  getDb().prepare(sql).run(...cols.map(([, v]) => v), task.id)
  res.json({ data: taskPublic(getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(task.id)) })
}))

// POST /api/tasks/:id/toggle  — flip done state (mirrors the frontend checkbox)
router.post('/:id/toggle', asyncHandler(async (req, res) => {
  const task = taskOr404(req.params.id)
  getDb().prepare("UPDATE tasks SET done = ?, updated_at = datetime('now') WHERE id = ?")
    .run(task.done ? 0 : 1, task.id)
  res.json({ data: taskPublic(getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(task.id)) })
}))

// DELETE /api/tasks/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const task = taskOr404(req.params.id)
  getDb().prepare('DELETE FROM tasks WHERE id = ?').run(task.id)
  res.json({ message: 'Task deleted' })
}))

export default router
