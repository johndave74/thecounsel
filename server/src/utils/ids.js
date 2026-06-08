import { randomBytes, randomUUID } from 'node:crypto'

/**
 * Generate a short, frontend-style id with a prefix, e.g. `id('c') -> 'c-3f9a2b'`.
 * Collision-resistant enough for this domain (random + time component).
 */
export function id(prefix) {
  const rand = randomBytes(5).toString('hex')
  const time = Date.now().toString(36).slice(-3)
  return `${prefix}-${rand}${time}`
}

/** Cryptographically strong opaque token (for refresh / reset tokens). */
export function opaqueToken() {
  return randomBytes(48).toString('base64url')
}

export { randomUUID }
