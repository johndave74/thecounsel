import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// server/ root (two levels up from src/config)
const ROOT = path.resolve(__dirname, '..', '..')

const resolvePath = (p, fallback) => {
  const value = p || fallback
  return path.isAbsolute(value) ? value : path.resolve(ROOT, value)
}

const num = (value, fallback) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const NODE_ENV = process.env.NODE_ENV || 'development'
const isProd = NODE_ENV === 'production'
const isTest = NODE_ENV === 'test'

// In tests we use an isolated in-memory-ish DB and ephemeral secrets so the
// suite never touches real data or requires a configured .env.
const env = {
  NODE_ENV,
  isProd,
  isTest,
  PORT: num(process.env.PORT, 4000),

  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || (isProd ? '' : 'dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || (isProd ? '' : 'dev-refresh-secret-change-me'),
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || '15m',
  REFRESH_TOKEN_TTL_DAYS: num(process.env.REFRESH_TOKEN_TTL_DAYS, 30),
  BCRYPT_ROUNDS: num(process.env.BCRYPT_ROUNDS, isTest ? 4 : 12),

  DATABASE_PATH: isTest
    ? ':memory:'
    : resolvePath(process.env.DATABASE_PATH, './data/counsel.db'),
  UPLOAD_DIR: resolvePath(process.env.UPLOAD_DIR, './data/uploads'),
  MAX_UPLOAD_BYTES: num(process.env.MAX_UPLOAD_BYTES, 25 * 1024 * 1024),

  ROOT,
}

// Fail fast in production if critical secrets are missing or left at defaults.
if (isProd) {
  const weak = ['', 'dev-access-secret-change-me', 'dev-refresh-secret-change-me']
  const problems = []
  if (weak.includes(env.JWT_ACCESS_SECRET) || env.JWT_ACCESS_SECRET.length < 32)
    problems.push('JWT_ACCESS_SECRET must be set to a strong value (>= 32 chars)')
  if (weak.includes(env.JWT_REFRESH_SECRET) || env.JWT_REFRESH_SECRET.length < 32)
    problems.push('JWT_REFRESH_SECRET must be set to a strong value (>= 32 chars)')
  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET)
    problems.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ')
  if (problems.length) {
    // eslint-disable-next-line no-console
    console.error('\n[config] Refusing to start in production:\n  - ' + problems.join('\n  - ') + '\n')
    process.exit(1)
  }
}

export default env
