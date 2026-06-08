// =========================================================================
// API client for The Counsel backend.
//
// Drop-in layer the React app can use to talk to the real API. Handles token
// storage, automatic access-token refresh on 401, and typed helpers for every
// resource. Set VITE_API_URL (defaults to http://localhost:4000/api).
// =========================================================================

const BASE = import.meta.env?.VITE_API_URL || 'http://localhost:4000/api'

const store = {
  get access() { return localStorage.getItem('counsel.access') },
  get refresh() { return localStorage.getItem('counsel.refresh') },
  set({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem('counsel.access', accessToken)
    if (refreshToken) localStorage.setItem('counsel.refresh', refreshToken)
  },
  clear() {
    localStorage.removeItem('counsel.access')
    localStorage.removeItem('counsel.refresh')
  },
}

class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

let refreshing = null

async function refreshTokens() {
  // De-dupe concurrent refreshes.
  if (refreshing) return refreshing
  const refreshToken = store.refresh
  if (!refreshToken) throw new ApiError(401, 'Session expired')
  refreshing = fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (r) => {
      if (!r.ok) { store.clear(); throw new ApiError(401, 'Session expired') }
      const data = await r.json()
      store.set(data)
      return data.accessToken
    })
    .finally(() => { refreshing = null })
  return refreshing
}

async function request(method, path, { body, auth = true, isForm = false, retry = true } = {}) {
  const headers = {}
  if (auth && store.access) headers.Authorization = `Bearer ${store.access}`
  let payload = body
  if (body && !isForm) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload })

  if (res.status === 401 && auth && retry && store.refresh) {
    try {
      await refreshTokens()
      return request(method, path, { body, auth, isForm, retry: false })
    } catch {
      store.clear()
    }
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(res.status, data?.error?.message || res.statusText, data?.error?.details)
  }
  return data
}

const get = (p) => request('GET', p)
const post = (p, body) => request('POST', p, { body })
const patch = (p, body) => request('PATCH', p, { body })
const del = (p) => request('DELETE', p)
const qs = (params) => {
  const s = new URLSearchParams(
    Object.entries(params || {}).filter(([, v]) => v != null && v !== ''),
  ).toString()
  return s ? `?${s}` : ''
}

export const api = {
  isAuthenticated: () => !!store.access,
  tokens: store,
  ApiError,

  auth: {
    async login(email, password) {
      const data = await request('POST', '/auth/login', { body: { email, password }, auth: false })
      store.set(data)
      return data.user
    },
    async register(payload) {
      const data = await request('POST', '/auth/register', { body: payload, auth: false })
      store.set(data)
      return data.user
    },
    async logout() {
      try { if (store.refresh) await request('POST', '/auth/logout', { body: { refreshToken: store.refresh }, auth: false }) }
      finally { store.clear() }
    },
    me: () => get('/auth/me').then((d) => d.user),
    changePassword: (currentPassword, newPassword) => post('/auth/change-password', { currentPassword, newPassword }),
    forgotPassword: (email) => request('POST', '/auth/forgot-password', { body: { email }, auth: false }),
    resetPassword: (token, password) => request('POST', '/auth/reset-password', { body: { token, password }, auth: false }),
  },

  users: {
    list: (params) => get(`/users${qs(params)}`).then((d) => d.data),
    get: (id) => get(`/users/${id}`).then((d) => d.data),
    create: (payload) => post('/users', payload).then((d) => d.data),
    update: (id, payload) => patch(`/users/${id}`, payload).then((d) => d.data),
    deactivate: (id) => del(`/users/${id}`),
  },

  clients: {
    list: (params) => get(`/clients${qs(params)}`).then((d) => d.data),
    get: (id) => get(`/clients/${id}`).then((d) => d.data),
    create: (payload) => post('/clients', payload).then((d) => d.data),
    update: (id, payload) => patch(`/clients/${id}`, payload).then((d) => d.data),
    remove: (id) => del(`/clients/${id}`),
  },

  cases: {
    list: (params) => get(`/cases${qs(params)}`).then((d) => d.data),
    get: (id) => get(`/cases/${id}`).then((d) => d.data),
    create: (payload) => post('/cases', payload).then((d) => d.data),
    update: (id, payload) => patch(`/cases/${id}`, payload).then((d) => d.data),
    remove: (id) => del(`/cases/${id}`),
    assignLawyer: (id, lawyerId) => post(`/cases/${id}/lawyers`, { lawyerId }).then((d) => d.data),
    unassignLawyer: (id, lawyerId) => del(`/cases/${id}/lawyers/${lawyerId}`).then((d) => d.data),
    hearings: (id) => get(`/cases/${id}/hearings`).then((d) => d.data),
    documents: (id) => get(`/cases/${id}/documents`).then((d) => d.data),
    tasks: (id) => get(`/cases/${id}/tasks`).then((d) => d.data),
    timeline: (id) => get(`/cases/${id}/timeline`).then((d) => d.data),
    notes: (id) => get(`/cases/${id}/notes`).then((d) => d.data),
    addNote: (id, text) => post(`/cases/${id}/notes`, { text }).then((d) => d.data),
  },

  hearings: {
    list: (params) => get(`/hearings${qs(params)}`).then((d) => d.data),
    create: (payload) => post('/hearings', payload).then((d) => d.data),
    update: (id, payload) => patch(`/hearings/${id}`, payload).then((d) => d.data),
    remove: (id) => del(`/hearings/${id}`),
  },

  documents: {
    list: (params) => get(`/documents${qs(params)}`).then((d) => d.data),
    async upload(file, caseId, category = 'General') {
      const form = new FormData()
      form.append('file', file)
      form.append('caseId', caseId)
      form.append('category', category)
      const data = await request('POST', '/documents', { body: form, isForm: true })
      return data.data
    },
    downloadUrl: (id) => `${BASE}/documents/${id}/download`,
    // Authenticated download: fetch with the bearer token, then save the blob.
    async download(id, filename = 'document') {
      const headers = {}
      if (store.access) headers.Authorization = `Bearer ${store.access}`
      const res = await fetch(`${BASE}/documents/${id}/download`, { headers })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new ApiError(res.status, data?.error?.message || 'Download failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    },
    remove: (id) => del(`/documents/${id}`),
  },

  tasks: {
    list: (params) => get(`/tasks${qs(params)}`).then((d) => d.data),
    create: (payload) => post('/tasks', payload).then((d) => d.data),
    update: (id, payload) => patch(`/tasks/${id}`, payload).then((d) => d.data),
    toggle: (id) => post(`/tasks/${id}/toggle`).then((d) => d.data),
    remove: (id) => del(`/tasks/${id}`),
  },

  notifications: {
    list: (params) => get(`/notifications${qs(params)}`),
    read: (id) => post(`/notifications/${id}/read`).then((d) => d.data),
    readAll: () => post('/notifications/read-all'),
  },

  dashboard: {
    stats: () => get('/dashboard/stats'),
  },
}

export default api
