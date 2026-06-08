import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import env from '../config/env.js'

fs.mkdirSync(env.UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Random storage key; original name is preserved in the DB only.
    const ext = path.extname(file.originalname).slice(0, 12)
    cb(null, `${randomUUID()}${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
})

/** Map a filename to the frontend's icon category. */
export function extKind(filename) {
  const e = (filename.split('.').pop() || '').toLowerCase()
  if (e === 'pdf') return 'pdf'
  if (['doc', 'docx', 'rtf', 'txt'].includes(e)) return 'doc'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(e)) return 'img'
  if (['xls', 'xlsx', 'csv'].includes(e)) return 'xls'
  if (['zip', 'rar', '7z'].includes(e)) return 'zip'
  return 'default'
}

/** Human-readable byte size, matching the frontend's style ("2.4 MB"). */
export function humanSize(bytes) {
  if (!bytes) return '0 KB'
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`
  const mb = kb / 1024
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
}

export const uploadPath = (key) => path.join(env.UPLOAD_DIR, key)
