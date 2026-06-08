import { describe, it, expect, beforeAll } from 'vitest'
import { setup, login, auth, request } from './helpers.js'

let app
beforeAll(async () => { app = await setup() })

describe('auth', () => {
  it('logs in with seeded credentials', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'a.okonkwo@counsel.law', password: 'demo1234' })
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.refreshToken).toBeTruthy()
    expect(res.body.user.role).toBe('Admin')
    expect(res.body.user.password_hash).toBeUndefined() // never leak hashes
  })

  it('rejects bad password with 401', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'a.okonkwo@counsel.law', password: 'nope' })
    expect(res.status).toBe(401)
  })

  it('rejects unknown email with 401 (no enumeration)', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'ghost@counsel.law', password: 'whatever' })
    expect(res.status).toBe(401)
  })

  it('validates login payload (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' })
    expect(res.status).toBe(400)
    expect(res.body.error.details).toBeInstanceOf(Array)
  })

  it('returns the current user from /me', async () => {
    const { token } = await login()
    const res = await auth(token).get('/api/auth/me')
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('a.okonkwo@counsel.law')
  })

  it('rejects /me without a token (401)', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('rejects a malformed token (401)', async () => {
    const res = await auth('garbage.token.here').get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('registers a new account and returns tokens', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'New Lawyer', email: 'new.lawyer@counsel.law', password: 'password123' })
    expect(res.status).toBe(201)
    expect(res.body.user.initials).toBe('NL')
    expect(res.body.accessToken).toBeTruthy()
  })

  it('does not let self-registration escalate to Admin', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Sneaky User', email: 'sneaky@counsel.law', password: 'password123', role: 'Admin' })
    // role 'Admin' is not an accepted value for public registration → 400
    expect(res.status).toBe(400)
  })

  it('rejects duplicate registration (409)', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Dup', email: 'a.okonkwo@counsel.law', password: 'password123' })
    expect(res.status).toBe(409)
  })

  it('rotates refresh tokens and revokes the old one', async () => {
    const { refreshToken } = await login()
    const r1 = await request(app).post('/api/auth/refresh').send({ refreshToken })
    expect(r1.status).toBe(200)
    expect(r1.body.refreshToken).not.toBe(refreshToken)
    // old token is now revoked
    const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken })
    expect(reuse.status).toBe(401)
  })

  it('runs the forgot → reset password flow', async () => {
    const forgot = await request(app).post('/api/auth/forgot-password')
      .send({ email: 'm.reyes@counsel.law' })
    expect(forgot.status).toBe(200)
    const token = forgot.body.resetToken
    expect(token).toBeTruthy()
    const reset = await request(app).post('/api/auth/reset-password')
      .send({ token, password: 'brandnew123' })
    expect(reset.status).toBe(200)
    const relogin = await request(app).post('/api/auth/login')
      .send({ email: 'm.reyes@counsel.law', password: 'brandnew123' })
    expect(relogin.status).toBe(200)
  })

  it('does not reveal whether an unknown email exists', async () => {
    const res = await request(app).post('/api/auth/forgot-password')
      .send({ email: 'nobody@nowhere.co' })
    expect(res.status).toBe(200)
    expect(res.body.resetToken).toBeUndefined()
  })

  it('changes password and revokes other sessions', async () => {
    const { token, refreshToken } = await login('p.nair@counsel.law')
    const res = await auth(token).post('/api/auth/change-password')
      .send({ currentPassword: 'demo1234', newPassword: 'changed123' })
    expect(res.status).toBe(200)
    // existing refresh token should now be revoked
    const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken })
    expect(reuse.status).toBe(401)
  })
})
