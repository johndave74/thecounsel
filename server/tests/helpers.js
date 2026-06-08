import request from 'supertest'
import { createApp } from '../src/app.js'
import { getDb } from '../src/db/index.js'
import { seedDatabase } from '../src/db/seed.js'

let app

/** Build the app once and (re)seed the in-memory test database. */
export async function setup() {
  if (!app) app = createApp()
  getDb()
  await seedDatabase({ force: true, silent: true })
  return app
}

/** Log in and return { token, refreshToken, user }. */
export async function login(email = 'a.okonkwo@counsel.law', password = 'demo1234') {
  const res = await request(app).post('/api/auth/login').send({ email, password })
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${res.text}`)
  return { token: res.body.accessToken, refreshToken: res.body.refreshToken, user: res.body.user }
}

/** Authenticated supertest agent factory. */
export const auth = (token) => ({
  get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
  post: (url) => request(app).post(url).set('Authorization', `Bearer ${token}`),
  patch: (url) => request(app).patch(url).set('Authorization', `Bearer ${token}`),
  delete: (url) => request(app).delete(url).set('Authorization', `Bearer ${token}`),
})

export { request }
