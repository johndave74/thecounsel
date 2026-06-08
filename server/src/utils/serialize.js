// Map database rows -> the exact JSON shapes the React frontend consumes.
// Keeping this in one place means the API contract is explicit and testable.

export function userPublic(row, caseCount = 0) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    role: row.role,
    title: row.title,
    specialty: row.specialty,
    email: row.email,
    phone: row.phone,
    cases: caseCount,
    winRate: row.win_rate ?? null,
    tone: row.tone,
    barNo: row.bar_no,
  }
}

export function clientPublic(row, caseCount = 0) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    company: row.company ?? null,
    email: row.email,
    phone: row.phone,
    since: row.since,
    cases: caseCount,
    tone: row.tone,
    address: row.address ?? '—',
  }
}

export function casePublic(row, lawyerIds = []) {
  if (!row) return null
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    clientId: row.client_id,
    lawyerIds,
    status: row.status,
    practice: row.practice,
    priority: row.priority,
    opened: row.opened,
    court: row.court,
    judge: row.judge,
    progress: row.progress,
    value: row.value,
    nextHearing: row.next_hearing ?? null,
    desc: row.description,
  }
}

export function hearingPublic(row) {
  if (!row) return null
  return {
    id: row.id,
    caseId: row.case_id,
    title: row.title,
    date: row.date,
    time: row.time,
    court: row.court,
    judge: row.judge,
    type: row.type,
    status: row.status,
  }
}

export function documentPublic(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    ext: row.ext,
    caseId: row.case_id,
    category: row.category,
    size: row.size,
    uploadedBy: row.uploaded_by,
    date: row.date,
  }
}

export function taskPublic(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    caseId: row.case_id,
    assigneeId: row.assignee_id,
    due: row.due,
    priority: row.priority,
    done: !!row.done,
  }
}

export function notePublic(row) {
  if (!row) return null
  return {
    id: row.id,
    author: row.author,
    initials: row.initials,
    tone: row.tone,
    date: row.date,
    text: row.text,
  }
}

export function timelinePublic(row) {
  if (!row) return null
  return { date: row.date, title: row.title, desc: row.description }
}

export function notificationPublic(row) {
  if (!row) return null
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    time: relativeTime(row.created_at),
    unread: !!row.unread,
  }
}

/** Render an ISO/SQLite timestamp as a short relative string ("3 days", "5 hours ago"). */
export function relativeTime(ts) {
  if (!ts) return ''
  const then = new Date(ts.includes('T') ? ts : ts.replace(' ', 'T') + 'Z').getTime()
  if (Number.isNaN(then)) return ''
  const diff = then - Date.now()
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60000)
  const hours = Math.round(abs / 3600000)
  const days = Math.round(abs / 86400000)
  const future = diff > 0
  if (mins < 1) return 'just now'
  if (mins < 60) return future ? `in ${mins} min` : `${mins} min ago`
  if (hours < 24) return future ? `in ${hours} hours` : `${hours} hours ago`
  if (days === 1) return future ? 'tomorrow' : 'Yesterday'
  return future ? `${days} days` : `${days} days ago`
}
