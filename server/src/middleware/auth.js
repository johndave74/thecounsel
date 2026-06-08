import { verifyAccessToken } from '../utils/jwt.js'
import { getDb } from '../db/index.js'
import ApiError from '../utils/ApiError.js'

/**
 * Require a valid Bearer access token. Loads the live user record onto
 * `req.user` so revoked/deactivated accounts can't keep acting on a valid JWT.
 */
export function authenticate(req, _res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'))
  }

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token'
    return next(ApiError.unauthorized(msg))
  }

  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(payload.sub)
  if (!user || !user.is_active) {
    return next(ApiError.unauthorized('Account no longer active'))
  }

  req.user = user
  next()
}

/** Restrict a route to one or more roles (use after `authenticate`). */
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized())
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`Requires role: ${roles.join(' or ')}`))
  }
  next()
}
