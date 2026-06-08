import { useState, useEffect } from 'react'
import Modal from './Modal'
import Icon from './Icons'
import { useStore } from '../store'

const PRACTICES = ['Civil Litigation', 'Corporate Law', 'Criminal Defense', 'Family Law', 'Intellectual Property', 'Real Estate', 'Personal Injury', 'Employment Law', 'Insurance Law', 'General Practice']
const STATUSES = ['Open', 'Pending', 'In Court', 'Closed', 'Won', 'Lost']
const PRIORITIES = ['High', 'Medium', 'Low']
const DOC_CATEGORIES = ['Pleadings', 'Motions', 'Evidence', 'Contracts', 'Reports', 'Financials', 'Statements', 'Settlement', 'Correspondence', 'General']

// Multi-select chips for assigning lawyers.
function TeamPicker({ value, onChange }) {
  const { lawyers } = useStore()
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
  return (
    <div className="flex wrap gap-sm">
      {lawyers.map((l) => {
        const on = value.includes(l.id)
        return (
          <button type="button" key={l.id} onClick={() => toggle(l.id)}
            className={`chip ${on ? 'chip--on' : ''}`}>
            {on && <Icon.check size={13} />} {l.name.split(' ')[0]} {l.name.split(' ')[1]?.[0]}.
          </button>
        )
      })}
    </div>
  )
}

// --- New / referenced case ------------------------------------------------
export function CaseModal({ open, onClose }) {
  const { clients, addCase } = useStore()
  const [f, setF] = useState({ title: '', clientId: '', practice: 'Civil Litigation', status: 'Open', priority: 'Medium', court: '', value: '', desc: '', lawyerIds: [] })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  useEffect(() => { if (open && clients[0]) setF((s) => ({ ...s, clientId: s.clientId || clients[0].id })) }, [open, clients])

  const submit = (e) => {
    e.preventDefault()
    addCase(f); onClose()
    setF({ title: '', clientId: clients[0]?.id || '', practice: 'Civil Litigation', status: 'Open', priority: 'Medium', court: '', value: '', desc: '', lawyerIds: [] })
  }

  return (
    <Modal open={open} onClose={onClose} title="New Case" subtitle="Open a new matter and assign your team." width={620}
      footer={<><button className="btn btn--ghost" onClick={onClose}>Cancel</button><button className="btn btn--brass" form="case-form" type="submit"><Icon.plus size={16} /> Create Case</button></>}>
      <form id="case-form" onSubmit={submit}>
        <div className="field"><label>Case title</label><input className="input" required placeholder="e.g. Whitmore v. Stratton Holdings" value={f.title} onChange={set('title')} /></div>
        <div className="field-row">
          <div className="field"><label>Client</label>
            <select className="input" value={f.clientId} onChange={set('clientId')} required>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Practice area</label>
            <select className="input" value={f.practice} onChange={set('practice')}>{PRACTICES.map((p) => <option key={p}>{p}</option>)}</select>
          </div>
        </div>
        <div className="field-row">
          <div className="field"><label>Status</label><select className="input" value={f.status} onChange={set('status')}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="field"><label>Priority</label><select className="input" value={f.priority} onChange={set('priority')}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Court / forum</label><input className="input" placeholder="e.g. Superior Court, Dept. 14" value={f.court} onChange={set('court')} /></div>
          <div className="field"><label>Matter value</label><input className="input" placeholder="e.g. $250,000" value={f.value} onChange={set('value')} /></div>
        </div>
        <div className="field"><label>Assign team</label><TeamPicker value={f.lawyerIds} onChange={(v) => setF((s) => ({ ...s, lawyerIds: v }))} /></div>
        <div className="field"><label>Summary</label><textarea className="input" placeholder="Brief description of the matter…" value={f.desc} onChange={set('desc')} /></div>
      </form>
    </Modal>
  )
}

// --- New client -----------------------------------------------------------
export function ClientModal({ open, onClose }) {
  const { addClient } = useStore()
  const [f, setF] = useState({ name: '', type: 'Individual', company: '', email: '', phone: '', address: '' })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const submit = (e) => { e.preventDefault(); addClient(f); onClose(); setF({ name: '', type: 'Individual', company: '', email: '', phone: '', address: '' }) }

  return (
    <Modal open={open} onClose={onClose} title="Add Client" subtitle="Create a new client account."
      footer={<><button className="btn btn--ghost" onClick={onClose}>Cancel</button><button className="btn btn--brass" form="client-form" type="submit"><Icon.plus size={16} /> Add Client</button></>}>
      <form id="client-form" onSubmit={submit}>
        <div className="field"><label>Client type</label>
          <select className="input" value={f.type} onChange={set('type')}><option>Individual</option><option>Corporate</option></select>
        </div>
        <div className="field"><label>{f.type === 'Corporate' ? 'Contact / account name' : 'Full name'}</label><input className="input" required placeholder="e.g. Helena Whitmore" value={f.name} onChange={set('name')} /></div>
        {f.type === 'Corporate' && <div className="field"><label>Company</label><input className="input" placeholder="e.g. Northwind Logistics LLC" value={f.company} onChange={set('company')} /></div>}
        <div className="field-row">
          <div className="field"><label>Email</label><input className="input" type="email" required placeholder="name@email.com" value={f.email} onChange={set('email')} /></div>
          <div className="field"><label>Phone</label><input className="input" placeholder="+1 (555) 000-0000" value={f.phone} onChange={set('phone')} /></div>
        </div>
        <div className="field"><label>Location</label><input className="input" placeholder="City, State" value={f.address} onChange={set('address')} /></div>
      </form>
    </Modal>
  )
}

// --- Schedule hearing / event --------------------------------------------
export function HearingModal({ open, onClose, presetCaseId }) {
  const { cases, addHearing } = useStore()
  const [f, setF] = useState({ caseId: '', title: '', date: '2026-06-15', time: '09:30', court: '', judge: '', type: 'court', status: 'Confirmed' })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  useEffect(() => { if (open) setF((s) => ({ ...s, caseId: presetCaseId || s.caseId || cases[0]?.id || '' })) }, [open, presetCaseId, cases])
  const submit = (e) => { e.preventDefault(); addHearing(f); onClose(); setF((s) => ({ ...s, title: '', court: '', judge: '' })) }

  return (
    <Modal open={open} onClose={onClose} title="Schedule Event" subtitle="Add a court date, hearing, deadline or meeting." width={580}
      footer={<><button className="btn btn--ghost" onClick={onClose}>Cancel</button><button className="btn btn--brass" form="hearing-form" type="submit"><Icon.calendar size={16} /> Schedule</button></>}>
      <form id="hearing-form" onSubmit={submit}>
        <div className="field"><label>Title</label><input className="input" required placeholder="e.g. Motion Hearing" value={f.title} onChange={set('title')} /></div>
        <div className="field-row">
          <div className="field"><label>Case</label><select className="input" value={f.caseId} onChange={set('caseId')} required>{cases.map((c) => <option key={c.id} value={c.id}>{c.number} — {c.title}</option>)}</select></div>
          <div className="field"><label>Type</label><select className="input" value={f.type} onChange={set('type')}><option value="court">Court date</option><option value="hearing">Hearing</option><option value="deadline">Deadline</option><option value="meeting">Meeting</option></select></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Date</label><input className="input" type="date" value={f.date} onChange={set('date')} required /></div>
          <div className="field"><label>Time</label><input className="input" type="time" value={f.time} onChange={set('time')} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Location / court</label><input className="input" placeholder="e.g. Superior Court, Dept. 14" value={f.court} onChange={set('court')} /></div>
          <div className="field"><label>Judge / officer</label><input className="input" placeholder="e.g. Hon. R. Delgado" value={f.judge} onChange={set('judge')} /></div>
        </div>
      </form>
    </Modal>
  )
}

// --- New task -------------------------------------------------------------
export function TaskModal({ open, onClose, presetCaseId }) {
  const { cases, lawyers, addTask } = useStore()
  const [f, setF] = useState({ title: '', caseId: '', assigneeId: '', due: '2026-06-10', priority: 'Medium' })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  useEffect(() => { if (open) setF((s) => ({ ...s, caseId: presetCaseId || s.caseId || cases[0]?.id || '', assigneeId: s.assigneeId || lawyers[0]?.id || '' })) }, [open, presetCaseId, cases, lawyers])
  const submit = (e) => { e.preventDefault(); addTask(f); onClose(); setF((s) => ({ ...s, title: '' })) }

  return (
    <Modal open={open} onClose={onClose} title="New Task" subtitle="Assign a task with a deadline."
      footer={<><button className="btn btn--ghost" onClick={onClose}>Cancel</button><button className="btn btn--brass" form="task-form" type="submit"><Icon.plus size={16} /> Create Task</button></>}>
      <form id="task-form" onSubmit={submit}>
        <div className="field"><label>Task</label><input className="input" required placeholder="e.g. File reply brief" value={f.title} onChange={set('title')} /></div>
        <div className="field"><label>Case</label><select className="input" value={f.caseId} onChange={set('caseId')} required>{cases.map((c) => <option key={c.id} value={c.id}>{c.number} — {c.title}</option>)}</select></div>
        <div className="field-row">
          <div className="field"><label>Assign to</label><select className="input" value={f.assigneeId} onChange={set('assigneeId')}>{lawyers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
          <div className="field"><label>Priority</label><select className="input" value={f.priority} onChange={set('priority')}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></div>
        </div>
        <div className="field"><label>Due date</label><input className="input" type="date" value={f.due} onChange={set('due')} required /></div>
      </form>
    </Modal>
  )
}

// --- Invite staff ---------------------------------------------------------
export function StaffModal({ open, onClose }) {
  const { addStaff } = useStore()
  const [f, setF] = useState({ name: '', role: 'Lawyer', title: '', specialty: '', email: '', phone: '', barNo: '' })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const submit = (e) => { e.preventDefault(); addStaff(f); onClose(); setF({ name: '', role: 'Lawyer', title: '', specialty: '', email: '', phone: '', barNo: '' }) }

  return (
    <Modal open={open} onClose={onClose} title="Invite Member" subtitle="Add a lawyer or staff member to the firm."
      footer={<><button className="btn btn--ghost" onClick={onClose}>Cancel</button><button className="btn btn--brass" form="staff-form" type="submit"><Icon.send size={15} /> Send Invite</button></>}>
      <form id="staff-form" onSubmit={submit}>
        <div className="field"><label>Full name</label><input className="input" required placeholder="e.g. Julian Mercer" value={f.name} onChange={set('name')} /></div>
        <div className="field-row">
          <div className="field"><label>Role</label><select className="input" value={f.role} onChange={set('role')}><option>Admin</option><option>Lawyer</option><option>Staff</option></select></div>
          <div className="field"><label>Job title</label><input className="input" placeholder="e.g. Senior Associate" value={f.title} onChange={set('title')} /></div>
        </div>
        <div className="field"><label>Specialty / focus</label><input className="input" placeholder="e.g. Litigation" value={f.specialty} onChange={set('specialty')} /></div>
        <div className="field-row">
          <div className="field"><label>Email</label><input className="input" type="email" required placeholder="name@counsel.law" value={f.email} onChange={set('email')} /></div>
          <div className="field"><label>Phone</label><input className="input" placeholder="+1 (555) 000-0000" value={f.phone} onChange={set('phone')} /></div>
        </div>
        {f.role !== 'Staff' && <div className="field"><label>Bar number</label><input className="input" placeholder="e.g. CA-184320" value={f.barNo} onChange={set('barNo')} /></div>}
      </form>
    </Modal>
  )
}

// --- Upload document ------------------------------------------------------
export function UploadModal({ open, onClose, presetCaseId }) {
  const { cases, addDocument } = useStore()
  const [f, setF] = useState({ name: '', caseId: '', category: 'General', size: '', file: null })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  useEffect(() => { if (open) setF((s) => ({ ...s, caseId: presetCaseId || s.caseId || cases[0]?.id || '' })) }, [open, presetCaseId, cases])

  // Capture the real File so it can be uploaded to the API (a typed-only name
  // falls back to a small placeholder file in the store).
  const onPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const kb = file.size / 1024
    const size = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`
    setF((s) => ({ ...s, name: file.name, size, file }))
  }
  const submit = (e) => { e.preventDefault(); addDocument(f); onClose(); setF((s) => ({ ...s, name: '', size: '', file: null })) }

  return (
    <Modal open={open} onClose={onClose} title="Upload Document" subtitle="Attach a file to a case (demo — no real storage)."
      footer={<><button className="btn btn--ghost" onClick={onClose}>Cancel</button><button className="btn btn--brass" form="upload-form" type="submit"><Icon.upload size={15} /> Upload</button></>}>
      <form id="upload-form" onSubmit={submit}>
        <label className="dropzone" style={{ display: 'block', cursor: 'pointer', marginBottom: 18 }}>
          <input type="file" hidden onChange={onPick} />
          <Icon.upload size={30} />
          <h4>{f.name || 'Click to choose a file'}</h4>
          <p>{f.name ? `Ready to upload · ${f.size}` : 'PDF, DOCX, XLSX, images up to 50 MB'}</p>
        </label>
        <div className="field"><label>Or enter a file name</label><input className="input" required placeholder="e.g. Complaint & Summons.pdf" value={f.name} onChange={set('name')} /></div>
        <div className="field-row">
          <div className="field"><label>Case</label><select className="input" value={f.caseId} onChange={set('caseId')} required>{cases.map((c) => <option key={c.id} value={c.id}>{c.number} — {c.title}</option>)}</select></div>
          <div className="field"><label>Category</label><select className="input" value={f.category} onChange={set('category')}>{DOC_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        </div>
      </form>
    </Modal>
  )
}
