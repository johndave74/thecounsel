import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import api from './api/client'

const StoreCtx = createContext(null)

const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`
const randomPassword = () => `Tmp-${Math.random().toString(36).slice(2, 10)}A9`

// Build a tiny placeholder File when the user typed a filename but didn't pick
// a real file — keeps the "enter a file name" demo path working against the
// real upload endpoint.
const placeholderFile = (name) =>
  new File([`Placeholder content for ${name}\nUploaded via The Counsel.`], name, { type: 'text/plain' })

export function StoreProvider({ children }) {
  const [authReady, setAuthReady] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  const [cases, setCases] = useState([])
  const [clients, setClients] = useState([])
  const [lawyers, setLawyers] = useState([])
  const [hearings, setHearings] = useState([])
  const [documents, setDocuments] = useState([])
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState({})       // map: caseId -> [note]
  const [timeline, setTimeline] = useState({})  // map: caseId -> [event]
  const [notifications, setNotifications] = useState([])
  const [toasts, setToasts] = useState([])

  // --- toasts -------------------------------------------------------------
  const toast = useCallback((message, kind = 'ok') => {
    const id = uid('t')
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  // --- data loading -------------------------------------------------------
  const loadAll = useCallback(async () => {
    const [cs, cl, lw, hr, dc, tk, nf] = await Promise.all([
      api.cases.list(), api.clients.list(), api.users.list(),
      api.hearings.list(), api.documents.list(), api.tasks.list(),
      api.notifications.list(),
    ])
    setCases(cs); setClients(cl); setLawyers(lw); setHearings(hr)
    setDocuments(dc); setTasks(tk); setNotifications(nf.data || [])
  }, [])

  const resetState = useCallback(() => {
    setCases([]); setClients([]); setLawyers([]); setHearings([])
    setDocuments([]); setTasks([]); setNotes({}); setTimeline({}); setNotifications([])
  }, [])

  // Restore a session on first load if a token is present.
  const booted = useRef(false)
  useEffect(() => {
    if (booted.current) return
    booted.current = true
    ;(async () => {
      if (api.isAuthenticated()) {
        try {
          const me = await api.auth.me()
          setCurrentUser(me)
          await loadAll()
        } catch {
          await api.auth.logout().catch(() => {})
        }
      }
      setAuthReady(true)
    })()
  }, [loadAll])

  // --- auth ---------------------------------------------------------------
  const signIn = useCallback(async (email, password) => {
    const me = await api.auth.login(email, password)
    setCurrentUser(me)
    await loadAll()
    return me
  }, [loadAll])

  const signUp = useCallback(async (payload) => {
    const me = await api.auth.register(payload)
    setCurrentUser(me)
    await loadAll()
    return me
  }, [loadAll])

  const signOut = useCallback(async () => {
    await api.auth.logout().catch(() => {})
    setCurrentUser(null)
    resetState()
  }, [resetState])

  // --- lookups ------------------------------------------------------------
  const getClient = useCallback((id) => clients.find((c) => c.id === id), [clients])
  const getLawyer = useCallback((id) => lawyers.find((l) => l.id === id), [lawyers])
  const getCase = useCallback((id) => cases.find((c) => c.id === id), [cases])

  // --- per-case detail (notes + timeline) ---------------------------------
  const loadCaseDetail = useCallback(async (caseId) => {
    try {
      const [ns, tl] = await Promise.all([api.cases.notes(caseId), api.cases.timeline(caseId)])
      setNotes((n) => ({ ...n, [caseId]: ns }))
      setTimeline((t) => ({ ...t, [caseId]: tl }))
    } catch {
      /* case may not exist; CaseDetail handles the empty state */
    }
  }, [])

  // --- mutations ----------------------------------------------------------
  const addCase = useCallback(async (f) => {
    try {
      const item = await api.cases.create({
        title: f.title, clientId: f.clientId, lawyerIds: f.lawyerIds || [],
        status: f.status, practice: f.practice, priority: f.priority,
        court: f.court || undefined, value: f.value || undefined, desc: f.desc || undefined,
      })
      setCases((c) => [item, ...c])
      setClients((cl) => cl.map((x) => (x.id === f.clientId ? { ...x, cases: x.cases + 1 } : x)))
      toast(`Case “${item.title}” created`)
      return item
    } catch (e) { toast(e.message || 'Could not create case', 'warn') }
  }, [toast])

  const addClient = useCallback(async (f) => {
    try {
      const item = await api.clients.create({
        name: f.name, type: f.type,
        company: f.type === 'Corporate' ? (f.company || f.name) : undefined,
        email: f.email || undefined, phone: f.phone || undefined, address: f.address || undefined,
      })
      setClients((c) => [item, ...c])
      toast(`Client “${item.name}” added`)
      return item
    } catch (e) { toast(e.message || 'Could not add client', 'warn') }
  }, [toast])

  const addHearing = useCallback(async (f) => {
    try {
      const item = await api.hearings.create({
        caseId: f.caseId, title: f.title, date: f.date, time: f.time || undefined,
        court: f.court || undefined, judge: f.judge || undefined,
        type: f.type || undefined, status: f.status || undefined,
      })
      setHearings((h) => [...h, item])
      // case.nextHearing may have changed — refresh that case from the server
      const fresh = await api.cases.get(f.caseId).catch(() => null)
      if (fresh) setCases((c) => c.map((x) => (x.id === fresh.id ? fresh : x)))
      toast(`Event “${item.title}” scheduled`)
      return item
    } catch (e) { toast(e.message || 'Could not schedule event', 'warn') }
  }, [toast])

  const addTask = useCallback(async (f) => {
    try {
      const item = await api.tasks.create({
        title: f.title, caseId: f.caseId || undefined, assigneeId: f.assigneeId || undefined,
        due: f.due || undefined, priority: f.priority,
      })
      setTasks((t) => [item, ...t])
      toast('Task created')
      return item
    } catch (e) { toast(e.message || 'Could not create task', 'warn') }
  }, [toast])

  const toggleTask = useCallback(async (id) => {
    // optimistic flip, reconcile with server response
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)))
    try {
      const item = await api.tasks.toggle(id)
      setTasks((t) => t.map((x) => (x.id === id ? item : x)))
    } catch (e) {
      setTasks((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x))) // revert
      toast(e.message || 'Could not update task', 'warn')
    }
  }, [toast])

  const addStaff = useCallback(async (f) => {
    try {
      const item = await api.users.create({
        name: f.name, email: f.email, password: randomPassword(),
        role: f.role, title: f.title || undefined, specialty: f.specialty || undefined,
        phone: f.phone || undefined, barNo: f.barNo || undefined,
      })
      setLawyers((l) => [...l, item])
      toast(`${item.name} invited to the firm`)
      return item
    } catch (e) { toast(e.message || 'Could not invite member', 'warn') }
  }, [toast])

  const addDocument = useCallback(async (f) => {
    try {
      const file = f.file instanceof File ? f.file : placeholderFile(f.name || 'document.txt')
      const item = await api.documents.upload(file, f.caseId, f.category)
      setDocuments((d) => [item, ...d])
      toast(`“${item.name}” uploaded`)
      return item
    } catch (e) { toast(e.message || 'Could not upload document', 'warn') }
  }, [toast])

  const addNote = useCallback(async (caseId, text) => {
    try {
      const note = await api.cases.addNote(caseId, text)
      setNotes((n) => ({ ...n, [caseId]: [note, ...(n[caseId] || [])] }))
      toast('Note posted')
      return note
    } catch (e) { toast(e.message || 'Could not post note', 'warn') }
  }, [toast])

  const assignLawyer = useCallback(async (caseId, lawyerId) => {
    try {
      const updated = await api.cases.assignLawyer(caseId, lawyerId)
      setCases((c) => c.map((x) => (x.id === caseId ? updated : x)))
      const l = lawyers.find((x) => x.id === lawyerId)
      toast(`${l?.name || 'Member'} assigned to case`)
    } catch (e) { toast(e.message || 'Could not assign member', 'warn') }
  }, [lawyers, toast])

  const markRead = useCallback(async (id) => {
    setNotifications((n) => n.map((x) => (x.id === id ? { ...x, unread: false } : x)))
    try { await api.notifications.read(id) } catch { /* non-critical */ }
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((n) => n.map((x) => ({ ...x, unread: false })))
    try { await api.notifications.readAll() } catch { /* non-critical */ }
    toast('All notifications marked read')
  }, [toast])

  const value = {
    // auth
    authReady, currentUser, signIn, signUp, signOut,
    // collections
    cases, clients, lawyers, hearings, documents, tasks, notes, timeline, notifications,
    // lookups
    getClient, getLawyer, getCase, loadCaseDetail,
    // mutations
    addCase, addClient, addHearing, addTask, toggleTask, addStaff, addDocument, addNote, assignLawyer,
    markRead, markAllRead,
    // ui
    toast, toasts,
  }

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
