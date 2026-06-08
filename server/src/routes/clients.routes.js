import { Router } from 'express'
import { getDb } from '../db/index.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { id } from '../utils/ids.js'
import { validate } from '../middleware/validate.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { serializeClient, clientRowOr404, caseCountForClient } from '../repo.js'
import { createClientSchema, updateClientSchema } from '../schemas.js'

const router = Router()
router.use(authenticate)

const todayIso = () => new Date().toISOString().slice(0, 10)

// GET /api/clients  — ?search=&type=
router.get('/', asyncHandler(async (req, res) => {
  const { search, type } = req.query
  let sql = 'SELECT * FROM clients'
  const where = []
  const args = []
  if (type) { where.push('type = ?'); args.push(type) }
  if (search) {
    where.push('(LOWER(name) LIKE ? OR LOWER(company) LIKE ? OR LOWER(email) LIKE ?)')
    const q = `%${String(search).toLowerCase()}%`
    args.push(q, q, q)
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ')
  sql += ' ORDER BY name'
  res.json({ data: getDb().prepare(sql).all(...args).map(serializeClient) })
}))

// GET /api/clients/:id
router.get('/:id', asyncHandler(async (req, res) => {
  res.json({ data: serializeClient(clientRowOr404(req.params.id)) })
}))

// POST /api/clients
router.post('/', validate(createClientSchema), asyncHandler(async (req, res) => {
  const b = req.body
  const clientId = id('c')
  getDb().prepare(`INSERT INTO clients (id, name, type, company, email, phone, since, tone, address)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(
    clientId, b.name, b.type,
    b.type === 'Corporate' ? (b.company || b.name) : null,
    b.email || null, b.phone || null, todayIso(),
    Math.floor(Math.random() * 6), b.address || '—',
  )
  res.status(201).json({ data: serializeClient(getDb().prepare('SELECT * FROM clients WHERE id = ?').get(clientId)) })
}))

// PATCH /api/clients/:id
router.patch('/:id', validate(updateClientSchema), asyncHandler(async (req, res) => {
  const client = clientRowOr404(req.params.id)
  const b = req.body
  const map = {
    name: b.name, type: b.type, company: b.company,
    email: b.email, phone: b.phone, address: b.address,
  }
  const cols = Object.entries(map).filter(([, v]) => v !== undefined)
  const sql = `UPDATE clients SET ${cols.map(([c]) => `${c} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`
  getDb().prepare(sql).run(...cols.map(([, v]) => v), client.id)
  res.json({ data: serializeClient(getDb().prepare('SELECT * FROM clients WHERE id = ?').get(client.id)) })
}))

// DELETE /api/clients/:id  — Admin only; blocked if the client has cases.
router.delete('/:id', authorize('Admin'), asyncHandler(async (req, res) => {
  const client = clientRowOr404(req.params.id)
  if (caseCountForClient(client.id) > 0) {
    throw ApiError.conflict('Cannot delete a client with existing cases')
  }
  getDb().prepare('DELETE FROM clients WHERE id = ?').run(client.id)
  res.json({ message: 'Client deleted' })
}))

export default router
