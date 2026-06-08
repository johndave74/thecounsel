import { describe, it, expect, beforeAll } from 'vitest'
import { setup, login, auth, request } from './helpers.js'

let app, admin, staff
beforeAll(async () => {
  app = await setup()
  admin = await login('a.okonkwo@counsel.law')
  staff = await login('h.bloom@counsel.law') // role: Staff
})

describe('clients', () => {
  it('lists and searches clients', async () => {
    const all = await auth(admin.token).get('/api/clients')
    expect(all.body.data.length).toBe(8)
    const search = await auth(admin.token).get('/api/clients?search=northwind')
    expect(search.body.data[0].name).toContain('Northwind')
  })

  it('creates a client with derived company for corporate', async () => {
    const res = await auth(admin.token).post('/api/clients').send({ name: 'Acme', type: 'Corporate' })
    expect(res.status).toBe(201)
    expect(res.body.data.company).toBe('Acme')
  })

  it('blocks deleting a client that has cases (409)', async () => {
    const res = await auth(admin.token).delete('/api/clients/c1')
    expect(res.status).toBe(409)
  })
})

describe('tasks', () => {
  it('toggles done state', async () => {
    const before = await auth(admin.token).get('/api/tasks/t1')
    const toggled = await auth(admin.token).post('/api/tasks/t1/toggle')
    expect(toggled.body.data.done).toBe(!before.body.data.done)
  })

  it('filters overdue tasks', async () => {
    const res = await auth(admin.token).get('/api/tasks?overdue=true')
    expect(res.status).toBe(200)
    expect(res.body.data.every((t) => !t.done)).toBe(true)
  })

  it('rejects a task for an unknown assignee (404)', async () => {
    const res = await auth(admin.token).post('/api/tasks')
      .send({ title: 'x', assigneeId: 'l-nope' })
    expect(res.status).toBe(404)
  })
})

describe('hearings', () => {
  it('recomputes case.nextHearing when scheduling an earlier hearing', async () => {
    const res = await auth(admin.token).post('/api/hearings').send({
      caseId: 'CASE-2038', title: 'Early Conference', date: '2026-06-10', type: 'court',
    })
    expect(res.status).toBe(201)
    const c = await auth(admin.token).get('/api/cases/CASE-2038')
    expect(c.body.data.nextHearing).toBe('2026-06-10')
  })

  it('does not let a deadline change nextHearing', async () => {
    const before = await auth(admin.token).get('/api/cases/CASE-2012')
    await auth(admin.token).post('/api/hearings').send({
      caseId: 'CASE-2012', title: 'Filing due', date: '2026-06-09', type: 'deadline',
    })
    const after = await auth(admin.token).get('/api/cases/CASE-2012')
    expect(after.body.data.nextHearing).toBe(before.body.data.nextHearing)
  })
})

describe('documents', () => {
  it('uploads, lists, downloads and deletes a document', async () => {
    const up = await auth(staff.token).post('/api/documents')
      .field('caseId', 'CASE-2041').field('category', 'Evidence')
      .attach('file', Buffer.from('hello'), 'memo.pdf')
    expect(up.status).toBe(201)
    expect(up.body.data.ext).toBe('pdf')
    const id = up.body.data.id

    const dl = await auth(staff.token).get(`/api/documents/${id}/download`)
      .buffer(true).parse((res, cb) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => cb(null, Buffer.concat(chunks)))
      })
    expect(dl.status).toBe(200)
    expect(dl.body.toString()).toBe('hello')

    // a different non-admin user cannot delete someone else's upload
    const other = await login('p.nair@counsel.law')
    const denied = await auth(other.token).delete(`/api/documents/${id}`)
    expect(denied.status).toBe(403)

    // uploader can delete
    const del = await auth(staff.token).delete(`/api/documents/${id}`)
    expect(del.status).toBe(200)
  })

  it('rejects an upload with no file (400)', async () => {
    const res = await auth(staff.token).post('/api/documents').field('caseId', 'CASE-2041')
    expect(res.status).toBe(400)
  })
})

describe('users / RBAC', () => {
  it('lets an admin create a user', async () => {
    const res = await auth(admin.token).post('/api/users')
      .send({ name: 'Sam Stone', email: 'sam.stone@counsel.law', password: 'password123', role: 'Lawyer' })
    expect(res.status).toBe(201)
    expect(res.body.data.initials).toBe('SS')
  })

  it('forbids a staff member from creating a user (403)', async () => {
    const res = await auth(staff.token).post('/api/users')
      .send({ name: 'X', email: 'x@y.co', password: 'password123' })
    expect(res.status).toBe(403)
  })

  it('prevents an admin from deactivating themselves (400)', async () => {
    const res = await auth(admin.token).delete(`/api/users/${admin.user.id}`)
    expect(res.status).toBe(400)
  })

  it('deactivates a user and blocks their login', async () => {
    const created = await auth(admin.token).post('/api/users')
      .send({ name: 'Temp User', email: 'temp@counsel.law', password: 'password123' })
    const del = await auth(admin.token).delete(`/api/users/${created.body.data.id}`)
    expect(del.status).toBe(200)
    const login = await request(app).post('/api/auth/login')
      .send({ email: 'temp@counsel.law', password: 'password123' })
    expect(login.status).toBe(403)
  })
})

describe('dashboard & notifications', () => {
  it('returns dashboard stats', async () => {
    const res = await auth(admin.token).get('/api/dashboard/stats')
    expect(res.status).toBe(200)
    expect(res.body.totals.clients).toBeGreaterThanOrEqual(8)
    expect(Object.keys(res.body.caseloadByStatus)).toHaveLength(6)
  })

  it('lists notifications and marks all read', async () => {
    const list = await auth(admin.token).get('/api/notifications')
    expect(list.body.unreadCount).toBeGreaterThan(0)
    await auth(admin.token).post('/api/notifications/read-all')
    const after = await auth(admin.token).get('/api/notifications')
    expect(after.body.unreadCount).toBe(0)
  })
})

describe('misc', () => {
  it('404s unknown routes as JSON', async () => {
    const res = await request(app).get('/api/nope')
    expect(res.status).toBe(404)
    expect(res.body.error.message).toBeTruthy()
  })

  it('rejects malformed JSON with 400', async () => {
    const res = await request(app).post('/api/auth/login')
      .set('Content-Type', 'application/json').send('{bad json')
    expect(res.status).toBe(400)
  })
})
