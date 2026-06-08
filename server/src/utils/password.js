import bcrypt from 'bcryptjs'
import { createHash } from 'node:crypto'
import env from '../config/env.js'

export const hashPassword = (plain) => bcrypt.hash(plain, env.BCRYPT_ROUNDS)
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash)

/** SHA-256 hex digest — used to store opaque tokens without keeping the secret. */
export const sha256 = (value) => createHash('sha256').update(value).digest('hex')
