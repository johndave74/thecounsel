import fs from 'node:fs'
import ApiError from '../utils/ApiError.js'
import env from '../config/env.js'

/** 404 for unmatched routes. */
export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Cannot ${req.method} ${req.path}`))
}

/** Centralized error serializer — the single place errors become JSON. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // If a multipart upload was saved but the request is failing, remove the
  // orphaned file so disk doesn't accumulate dangling uploads.
  if (req.file?.path) fs.rm(req.file.path, () => {})
  if (Array.isArray(req.files)) for (const f of req.files) if (f?.path) fs.rm(f.path, () => {})

  // Body-parser / JSON syntax errors
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: { message: 'Malformed JSON body' } })
  }
  // Multer (upload) errors
  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the maximum allowed size' : err.message
    return res.status(400).json({ error: { message, code: err.code } })
  }
  // SQLite constraint violations → 409
  if (err.code === 'ERR_SQLITE_ERROR' && /UNIQUE constraint/i.test(err.message)) {
    return res.status(409).json({ error: { message: 'A record with that value already exists' } })
  }

  const status = err instanceof ApiError ? err.status : 500
  const expose = err instanceof ApiError && err.expose

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err)
  }

  const body = {
    error: {
      message: expose || status < 500 ? err.message : 'Internal server error',
      ...(err.details ? { details: err.details } : {}),
      ...(env.isProd ? {} : { stack: status >= 500 ? err.stack : undefined }),
    },
  }
  res.status(status).json(body)
}
