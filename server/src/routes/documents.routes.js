import { Router } from 'express'
import fs from 'node:fs'
import { getDb } from '../db/index.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { id } from '../utils/ids.js'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/auth.js'
import { caseRowOr404 } from '../repo.js'
import { documentPublic } from '../utils/serialize.js'
import { upload, extKind, humanSize, uploadPath } from '../services/storage.js'
import { createDocumentMetaSchema } from '../schemas.js'

const router = Router()
router.use(authenticate)

const docOr404 = (docId) => {
  const row = getDb().prepare('SELECT * FROM documents WHERE id = ?').get(docId)
  if (!row) throw ApiError.notFound('Document not found')
  return row
}

// GET /api/documents  — ?caseId=&search=&category=
router.get('/', asyncHandler(async (req, res) => {
  const { caseId, search, category } = req.query
  let sql = 'SELECT * FROM documents'
  const where = []
  const args = []
  if (caseId) { where.push('case_id = ?'); args.push(caseId) }
  if (category) { where.push('category = ?'); args.push(category) }
  if (search) { where.push('LOWER(name) LIKE ?'); args.push(`%${String(search).toLowerCase()}%`) }
  if (where.length) sql += ' WHERE ' + where.join(' AND ')
  sql += ' ORDER BY date DESC, created_at DESC'
  res.json({ data: getDb().prepare(sql).all(...args).map(documentPublic) })
}))

// GET /api/documents/:id  — metadata
router.get('/:id', asyncHandler(async (req, res) => {
  res.json({ data: documentPublic(docOr404(req.params.id)) })
}))

// POST /api/documents  — multipart upload (field "file" + caseId, category)
router.post('/', upload.single('file'), validate(createDocumentMetaSchema), asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('A file is required (multipart field "file")')
  const { caseId, category } = req.body
  try {
    caseRowOr404(caseId)
  } catch (err) {
    // Clean up the orphaned upload if the case doesn't exist.
    fs.rm(uploadPath(req.file.filename), () => {})
    throw err
  }

  const docId = id('d')
  const name = req.file.originalname
  getDb().prepare(`INSERT INTO documents
    (id, name, ext, case_id, category, size, bytes, mime, storage_key, uploaded_by, uploader_id, date)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    docId, name, extKind(name), caseId, category || 'General',
    humanSize(req.file.size), req.file.size, req.file.mimetype || null,
    req.file.filename, req.user.name, req.user.id, new Date().toISOString().slice(0, 10),
  )
  res.status(201).json({ data: documentPublic(getDb().prepare('SELECT * FROM documents WHERE id = ?').get(docId)) })
}))

// GET /api/documents/:id/download  — stream the stored file
router.get('/:id/download', asyncHandler(async (req, res) => {
  const doc = docOr404(req.params.id)
  if (!doc.storage_key) throw ApiError.notFound('No file is attached to this document (seed/demo record)')
  const filePath = uploadPath(doc.storage_key)
  if (!fs.existsSync(filePath)) throw ApiError.notFound('Stored file is missing')
  if (doc.mime) res.type(doc.mime)
  res.download(filePath, doc.name)
}))

// DELETE /api/documents/:id  — Admin or the uploader
router.delete('/:id', asyncHandler(async (req, res) => {
  const doc = docOr404(req.params.id)
  if (req.user.role !== 'Admin' && doc.uploader_id !== req.user.id) {
    throw ApiError.forbidden('Only an admin or the uploader can delete this document')
  }
  getDb().prepare('DELETE FROM documents WHERE id = ?').run(doc.id)
  if (doc.storage_key) fs.rm(uploadPath(doc.storage_key), () => {})
  res.json({ message: 'Document deleted' })
}))

export default router
