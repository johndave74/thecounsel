import { getDb } from '../db/index.js'
import { id, opaqueToken } from '../utils/ids.js'
import { sha256 } from '../utils/password.js'
import { signAccessToken } from '../utils/jwt.js'
import env from '../config/env.js'
import ApiError from '../utils/ApiError.js'

const refreshExpiry = () =>
  new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86400000).toISOString()

/** Issue a new refresh token (opaque), storing only its hash. */
export function issueRefreshToken(userId) {
  const raw = opaqueToken()
  getDb().prepare(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?,?,?,?)',
  ).run(id('rt'), userId, sha256(raw), refreshExpiry())
  return raw
}

/** Issue both tokens for a freshly authenticated user. */
export function issueAuthTokens(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: issueRefreshToken(user.id),
  }
}

/**
 * Validate + rotate a refresh token. Returns the new token pair and user.
 * Rotation: the presented token is revoked and a new one issued, so a stolen
 * token is only usable once before detection.
 */
export function rotateRefreshToken(rawToken) {
  const db = getDb()
  const hash = sha256(rawToken)
  const row = db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?').get(hash)

  if (!row || row.revoked_at) throw ApiError.unauthorized('Invalid refresh token')
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw ApiError.unauthorized('Refresh token expired')
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id)
  if (!user || !user.is_active) throw ApiError.unauthorized('Account no longer active')

  db.prepare('UPDATE refresh_tokens SET revoked_at = datetime(\'now\') WHERE id = ?').run(row.id)
  return { user, ...issueAuthTokens(user) }
}

/** Revoke a single refresh token (logout). No error if it doesn't exist. */
export function revokeRefreshToken(rawToken) {
  getDb().prepare(
    "UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE token_hash = ? AND revoked_at IS NULL",
  ).run(sha256(rawToken))
}

/** Revoke every active refresh token for a user (logout-all / password change). */
export function revokeAllForUser(userId) {
  getDb().prepare(
    "UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE user_id = ? AND revoked_at IS NULL",
  ).run(userId)
}
