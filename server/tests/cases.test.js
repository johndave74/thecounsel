import { describe, it, expect, beforeAll } from 'vitest'
import { setup, login, auth } from './helpers.js'

let app, admin, lawyer
beforeAll(async () => {
  app = await setup()
  admin = await login('a.okonkwo@counsel.law')
  lawyer = await login('j.mercer@counsel.law')
})

describe('cases', () => {
  it('lists all seeded cases', async () => {
    const res = await auth(admin.token).get('/api/cases')
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBe(9)
    expect(res.body.data[0]).toHaveProperty('lawyerIds')
  })

  it('filters by status', async () => {
    const res = await auth(admin.token).get('/api/cases?status=Won')
    expect(res.body.data.every((c) => c.status === 'Won')).toBe(true)
  })

  it('searches by title', async () => {
    const res = await auth(admin.token).get('/api/cases?search=whitmore')
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(res.body.data[0].title.toLowerCase()).toContain('whitmore')
  })

  it('gets a single case with team + client', async () => {
    const res = await auth(admin.token).get('/api/cases/CASE-2041')
    expect(res.status).toBe(200)
    expect(res.body.data.lawyerIds).toEqual(['l2', 'l5'])
    expect(res.body.data.clientId).toBe('c1')
  })

  it('returns 404 for an unknown case', async () => {
    const res = await auth(admin.token).get('/api/cases/CASE-NOPE')
    expect(res.status).toBe(404)
  })

  it('creates a case with an auto timeline entry', async () => {
    const res = await auth(lawyer.token).post('/api/cases')
      .send({ title: 'Foo v. Bar', clientId: 'c1', lawyerIds: ['l2'], practice: 'Civil Litigation' })
    expect(res.status).toBe(201)
    const id = res.body.data.id
    expect(res.body.data.progress).toBe(5)
    const tl = await auth(lawyer.token).get(`/api/cases/${id}/timeline`)
    expect(tl.body.data[0].title).toBe('Case opened')
  })

  it('rejects a case for an unknown client (404)', async () => {
    const res = await auth(lawyer.token).post('/api/cases')
      .send({ title: 'X', clientId: 'c-nope' })
    expect(res.status).toBe(404)
  })

  it('rejects a case with an unknown lawyer (400)', async () => {
    const res = await auth(lawyer.token).post('/api/cases')
      .send({ title: 'X', clientId: 'c1', lawyerIds: ['l-nope'] })
    expect(res.status).toBe(400)
  })

  it('sets progress to 100 when moved to a terminal status', async () => {
    const res = await auth(lawyer.token).patch('/api/cases/CASE-1990').send({ status: 'Won' })
    expect(res.status).toBe(200)
    expect(res.body.data.progress).toBe(100)
  })

  it('assigns and unassigns a lawyer', async () => {
    const add = await auth(lawyer.token).post('/api/cases/CASE-2038/lawyers').send({ lawyerId: 'l3' })
    expect(add.body.data.lawyerIds).toContain('l3')
    const rm = await auth(lawyer.token).delete('/api/cases/CASE-2038/lawyers/l3')
    expect(rm.body.data.lawyerIds).not.toContain('l3')
  })

  it('is idempotent when assigning the same lawyer twice', async () => {
    await auth(lawyer.token).post('/api/cases/CASE-2055/lawyers').send({ lawyerId: 'l1' })
    const second = await auth(lawyer.token).post('/api/cases/CASE-2055/lawyers').send({ lawyerId: 'l1' })
    const count = second.body.data.lawyerIds.filter((x) => x === 'l1').length
    expect(count).toBe(1)
  })

  it('forbids a non-admin from deleting a case (403)', async () => {
    const res = await auth(lawyer.token).delete('/api/cases/CASE-1602')
    expect(res.status).toBe(403)
  })

  it('lets an admin delete a case and cascade sub-resources', async () => {
    const res = await auth(admin.token).delete('/api/cases/CASE-1755')
    expect(res.status).toBe(200)
    const gone = await auth(admin.token).get('/api/cases/CASE-1755')
    expect(gone.status).toBe(404)
  })

  it('adds and lists notes', async () => {
    const post = await auth(lawyer.token).post('/api/cases/CASE-2041/notes').send({ text: 'Test note' })
    expect(post.status).toBe(201)
    expect(post.body.data.author).toBe('Julian Mercer')
    const list = await auth(lawyer.token).get('/api/cases/CASE-2041/notes')
    expect(list.body.data[0].text).toBe('Test note') // newest first
  })
})
