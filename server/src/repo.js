import { getDb } from './db/index.js'
import ApiError from './utils/ApiError.js'
import {
  userPublic, clientPublic, casePublic,
} from './utils/serialize.js'

// ── Derived counts / relations ───────────────────────────────────────────
export const lawyerIdsForCase = (caseId) =>
  getDb().prepare('SELECT user_id FROM case_lawyers WHERE case_id = ? ORDER BY user_id').all(caseId)
    .map((r) => r.user_id)

export const caseCountForUser = (userId) =>
  getDb().prepare('SELECT COUNT(*) AS n FROM case_lawyers WHERE user_id = ?').get(userId).n

export const caseCountForClient = (clientId) =>
  getDb().prepare('SELECT COUNT(*) AS n FROM cases WHERE client_id = ?').get(clientId).n

// ── Fetch-or-404 helpers ──────────────────────────────────────────────────
export function caseRowOr404(id) {
  const row = getDb().prepare('SELECT * FROM cases WHERE id = ?').get(id)
  if (!row) throw ApiError.notFound('Case not found')
  return row
}
export function clientRowOr404(id) {
  const row = getDb().prepare('SELECT * FROM clients WHERE id = ?').get(id)
  if (!row) throw ApiError.notFound('Client not found')
  return row
}
export function userRowOr404(id) {
  const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!row) throw ApiError.notFound('User not found')
  return row
}

// ── Composed serializers (attach derived data) ────────────────────────────
export const serializeUser = (row) => userPublic(row, caseCountForUser(row.id))
export const serializeClient = (row) => clientPublic(row, caseCountForClient(row.id))
export const serializeCase = (row) => casePublic(row, lawyerIdsForCase(row.id))
