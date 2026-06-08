import { Router } from 'express'
import rateLimit from 'express-rate-limit'

import { getDb } from '../db/index.js'
import env from '../config/env.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { id, opaqueToken } from '../utils/ids.js'
import { hashPassword, verifyPassword, sha256 } from '../utils/password.js'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/auth.js'
import { serializeUser } from '../repo.js'
import { initialsOf } from '../db/seedData.js'
import {
  issueAuthTokens, rotateRefreshToken, revokeRefreshToken, revokeAllForUser,
} from '../services/tokens.js'
import {
  registerSchema, loginSchema, refreshSchema, forgotSchema, resetSchema, changePasswordSchema,
} from '../schemas.js'

const router = Router()

// A valid-format bcrypt hash (of a random secret) used as a decoy so login
// timing for unknown emails matches the real path and can't enumerate accounts.
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

// Stricter limiter on credential-testing endpoints to blunt brute force.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isTest ? 100000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(ApiError.tooMany('Too many attempts — try again later')),
})

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), asyncHandler(async (req, res) => {
  const { name, email, password, role, title, specialty, phone } = req.body
  const db = getDb()

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (exists) throw ApiError.conflict('An account with that email already exists')

  const userId = id('l')
  const passwordHash = await hashPassword(password)
  db.prepare(`INSERT INTO users
    (id, name, initials, email, password_hash, role, title, specialty, phone, bar_no, win_rate)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
    userId, name, initialsOf(name), email, passwordHash, role,
    title || (role === 'Staff' ? 'Legal Assistant' : 'Associate'),
    specialty || 'General Practice',
    phone || '—',
    role === 'Staff' ? '—' : 'Pending',
    role === 'Staff' ? null : 0,
  )

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  const tokens = issueAuthTokens(user)
  res.status(201).json({ user: serializeUser(user), ...tokens })
}))

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const user = getDb().prepare('SELECT * FROM users WHERE email = ?').get(email)

  // Always run a compare to keep timing roughly constant for unknown emails.
  const ok = user
    ? await verifyPassword(password, user.password_hash)
    : await verifyPassword(password, DUMMY_HASH)

  if (!user || !ok) throw ApiError.unauthorized('Invalid email or password')
  if (!user.is_active) throw ApiError.forbidden('Account is deactivated')

  const tokens = issueAuthTokens(user)
  res.json({ user: serializeUser(user), ...tokens })
}))

// POST /api/auth/refresh
router.post('/refresh', validate(refreshSchema), asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = rotateRefreshToken(req.body.refreshToken)
  res.json({ user: serializeUser(user), accessToken, refreshToken })
}))

// POST /api/auth/logout
router.post('/logout', validate(refreshSchema), asyncHandler(async (req, res) => {
  revokeRefreshToken(req.body.refreshToken)
  res.json({ message: 'Logged out' })
}))

// GET /api/auth/me
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json({ user: serializeUser(req.user) })
}))

// POST /api/auth/change-password
router.post('/change-password', authenticate, validate(changePasswordSchema), asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const ok = await verifyPassword(currentPassword, req.user.password_hash)
  if (!ok) throw ApiError.badRequest('Current password is incorrect')

  const hash = await hashPassword(newPassword)
  getDb().prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
    .run(hash, req.user.id)
  revokeAllForUser(req.user.id) // force re-login everywhere else
  res.json({ message: 'Password changed' })
}))

// POST /api/auth/forgot-password
// Always responds 200 (no account enumeration). In dev/test we return the token
// so the flow is testable without a mail server.
router.post('/forgot-password', authLimiter, validate(forgotSchema), asyncHandler(async (req, res) => {
  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.body.email)
  let devToken

  if (user) {
    const raw = opaqueToken()
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1h
    db.prepare('INSERT INTO password_resets (id, user_id, token_hash, expires_at) VALUES (?,?,?,?)')
      .run(id('pr'), user.id, sha256(raw), expires)
    if (!env.isProd) devToken = raw
    // In production this is where an email with the reset link would be sent.
  }

  res.json({
    message: 'If an account with that email exists, a reset link has been sent.',
    ...(devToken ? { resetToken: devToken } : {}),
  })
}))

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, validate(resetSchema), asyncHandler(async (req, res) => {
  const { token, password } = req.body
  const db = getDb()
  const row = db.prepare('SELECT * FROM password_resets WHERE token_hash = ?').get(sha256(token))

  if (!row || row.used_at || new Date(row.expires_at).getTime() < Date.now()) {
    throw ApiError.badRequest('Reset link is invalid or has expired')
  }

  const hash = await hashPassword(password)
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
    .run(hash, row.user_id)
  db.prepare("UPDATE password_resets SET used_at = datetime('now') WHERE id = ?").run(row.id)
  revokeAllForUser(row.user_id)
  res.json({ message: 'Password has been reset. You can now sign in.' })
}))

export default router
