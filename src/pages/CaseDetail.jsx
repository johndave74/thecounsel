import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Icon from '../components/Icons'
import { StatusBadge, Avatar, Priority, FileIcon, Empty } from '../components/ui'
import Modal from '../components/Modal'
import { UploadModal, HearingModal, TaskModal } from '../components/modals'
import { useStore } from '../store'
import { fmtDate } from '../data/sampleData'
import api from '../api/client'

const TABS = ['Overview', 'Hearings', 'Documents', 'Tasks', 'Notes', 'Timeline']

export default function CaseDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const {
    cases, hearings, documents, tasks, notes, timeline, lawyers,
    getClient, getLawyer, addNote, assignLawyer, toggleTask, toast, loadCaseDetail,
  } = useStore()

  // Load this matter's notes + timeline when the route changes.
  useEffect(() => { loadCaseDetail(id) }, [id, loadCaseDetail])

  const [tab, setTab] = useState('Overview')
  const [noteText, setNoteText] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [hearingOpen, setHearingOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  const c = cases.find((x) => x.id === id)
  if (!c) {
    return (
      <div className="page">
        <Empty icon="briefcase" title="Case not found" sub="This matter may have been moved or closed." />
        <div className="text-c"><Link to="/app/cases" className="btn btn--ghost">Back to cases</Link></div>
      </div>
    )
  }

  const client = getClient(c.clientId)
  const team = c.lawyerIds.map(getLawyer).filter(Boolean)
  const caseHearings = hearings.filter((h) => h.caseId === c.id)
  const caseDocs = documents.filter((d) => d.caseId === c.id)
  const caseTasks = tasks.filter((t) => t.caseId === c.id)
  const caseNotes = notes[c.id] || []
  const caseTimeline = timeline[c.id] || []
  const available = lawyers.filter((l) => !c.lawyerIds.includes(l.id))

  const postNote = () => {
    if (!noteText.trim()) return
    addNote(c.id, noteText.trim())
    setNoteText('')
  }

  return (
    <div className="page">
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} presetCaseId={c.id} />
      <HearingModal open={hearingOpen} onClose={() => setHearingOpen(false)} presetCaseId={c.id} />
      <TaskModal open={taskOpen} onClose={() => setTaskOpen(false)} presetCaseId={c.id} />
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign team member" subtitle="Add a lawyer or staff member to this matter.">
        {available.length === 0 ? <p className="muted fs-sm">Everyone is already assigned to this case.</p> : (
          <div style={{ display: 'grid', gap: 8 }}>
            {available.map((l) => (
              <button key={l.id} className="row" style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none' }}
                onClick={() => { assignLawyer(c.id, l.id); setAssignOpen(false) }}>
                <Avatar name={l.name} tone={l.tone} size="md" />
                <div className="row__body"><b>{l.name}</b><p>{l.title} · {l.specialty}</p></div>
                <Icon.plus size={18} className="faint" />
              </button>
            ))}
          </div>
        )}
      </Modal>

      <button className="btn btn--quiet btn--sm" style={{ marginLeft: -12, marginBottom: 12 }} onClick={() => nav('/app/cases')}>
        <Icon.arrowLeft size={16} /> All cases
      </button>

      {/* Hero */}
      <div className="detail-hero">
        <div className="detail-hero__top">
          <StatusBadge status={c.status} />
          <Priority level={c.priority} />
          <span className="mono fs-sm" style={{ color: 'var(--brass-soft)' }}>{c.number}</span>
        </div>
        <h2>{c.title}</h2>
        <div className="detail-hero__meta">
          <div><small>Practice</small><span>{c.practice}</span></div>
          <div><small>Court</small><span>{c.court}</span></div>
          <div><small>Presiding</small><span>{c.judge}</span></div>
          <div><small>Opened</small><span>{fmtDate(c.opened)}</span></div>
          <div><small>Matter value</small><span>{c.value}</span></div>
          <div><small>Next hearing</small><span>{c.nextHearing ? fmtDate(c.nextHearing) : '—'}</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>
            {t}
            {t === 'Documents' && caseDocs.length ? ` (${caseDocs.length})` : ''}
            {t === 'Hearings' && caseHearings.length ? ` (${caseHearings.length})` : ''}
            {t === 'Tasks' && caseTasks.length ? ` (${caseTasks.length})` : ''}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid cols-3 detail-cols" style={{ alignItems: 'start' }}>
          <div className="card card--pad span-2">
            <span className="eyebrow">Summary</span>
            <p style={{ marginTop: 10, fontSize: 15, lineHeight: 1.7, color: 'var(--ink-soft)' }}>{c.desc}</p>
            <div className="divider" />
            <span className="eyebrow">Case progress</span>
            <div className="flex items-center gap mt-sm">
              <div className="progress grow" style={{ height: 9 }}><span style={{ width: `${c.progress}%` }} /></div>
              <b className="display" style={{ fontSize: 22 }}>{c.progress}%</b>
            </div>
            <div className="grid cols-2" style={{ marginTop: 22 }}>
              <div className="card--pad" style={{ background: 'var(--surface)', borderRadius: 'var(--r-sm)' }}>
                <span className="eyebrow">Upcoming hearings</span>
                <div className="display" style={{ fontSize: 30, marginTop: 8 }}>{caseHearings.filter((h) => h.type !== 'deadline').length}</div>
              </div>
              <div className="card--pad" style={{ background: 'var(--surface)', borderRadius: 'var(--r-sm)' }}>
                <span className="eyebrow">Open tasks</span>
                <div className="display" style={{ fontSize: 30, marginTop: 8 }}>{caseTasks.filter((t) => !t.done).length}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <div className="card card--pad">
              <span className="eyebrow">Client</span>
              <div className="flex items-center gap mt-sm">
                <Avatar name={client?.name} tone={client?.tone} size="lg" />
                <div>
                  <b style={{ fontSize: 16 }}>{client?.name}</b>
                  <div className="fs-sm muted">{client?.type}{client?.company ? ` · ${client.company}` : ''}</div>
                </div>
              </div>
              <div className="mt" style={{ display: 'grid', gap: 9, fontSize: 13.5 }}>
                <span className="flex items-center gap-sm muted"><Icon.mail size={15} /> {client?.email}</span>
                <span className="flex items-center gap-sm muted"><Icon.phone size={15} /> {client?.phone}</span>
                <span className="flex items-center gap-sm muted"><Icon.mapPin size={15} /> {client?.address}</span>
              </div>
            </div>

            <div className="card card--pad">
              <span className="eyebrow">Assigned team</span>
              <div className="mt-sm" style={{ display: 'grid', gap: 12 }}>
                {team.length === 0 && <p className="fs-sm muted">No one assigned yet.</p>}
                {team.map((l) => (
                  <div className="flex items-center gap" key={l.id}>
                    <Avatar name={l.name} tone={l.tone} size="md" />
                    <div>
                      <b style={{ fontSize: 14 }}>{l.name}</b>
                      <div className="fs-xs muted">{l.title} · {l.specialty}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn--ghost btn--block btn--sm mt" onClick={() => setAssignOpen(true)}><Icon.plus size={15} /> Assign member</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'Hearings' && (
        <>
          <div className="flex justify-between items-center mb">
            <p className="muted fs-sm">{caseHearings.length} scheduled event(s) for this matter</p>
            <button className="btn btn--brass btn--sm" onClick={() => setHearingOpen(true)}><Icon.plus size={15} /> Schedule</button>
          </div>
          <div className="card">
            {caseHearings.length === 0 ? <Empty icon="calendar" title="No hearings scheduled" /> : (
              <div className="card--pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
                {caseHearings.map((h) => (
                  <div className="row" key={h.id}>
                    <span className={`notif__ico ${h.type === 'deadline' ? 'warn' : 'cal'}`}>
                      {h.type === 'deadline' ? <Icon.alert size={18} /> : <Icon.gavel size={18} />}
                    </span>
                    <div className="row__body">
                      <b>{h.title}</b>
                      <p className="flex items-center gap" style={{ marginTop: 3 }}>
                        <span className="flex items-center gap-sm"><Icon.calendar size={13} /> {fmtDate(h.date)} · {h.time}</span>
                        {h.court !== '—' && <span className="flex items-center gap-sm"><Icon.mapPin size={13} /> {h.court}</span>}
                      </p>
                    </div>
                    <span className="tag">{h.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'Documents' && (
        <>
          <div className="dropzone mb" onClick={() => setUploadOpen(true)} style={{ cursor: 'pointer' }}>
            <Icon.upload size={32} />
            <h4>Upload case documents</h4>
            <p>Drag & drop files here, or click to browse. PDF, DOCX, XLSX, images up to 50 MB.</p>
            <button className="btn btn--brass btn--sm" style={{ marginTop: 14 }} onClick={(e) => { e.stopPropagation(); setUploadOpen(true) }}><Icon.upload size={15} /> Choose files</button>
          </div>
          <div className="card">
            {caseDocs.length === 0 ? <Empty icon="folder" title="No documents yet" /> : (
              <div className="card--pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
                {caseDocs.map((d) => (
                  <div className="row" key={d.id}>
                    <FileIcon ext={d.ext} />
                    <div className="row__body">
                      <b>{d.name}</b>
                      <p>{d.category} · {d.size} · Uploaded by {d.uploadedBy} · {fmtDate(d.date)}</p>
                    </div>
                    <button className="icon-btn" onClick={async () => {
                      try { await api.documents.download(d.id, d.name); toast(`Downloading “${d.name}”`, 'info') }
                      catch (e) { toast(e.message || 'Download unavailable', 'warn') }
                    }}><Icon.download size={18} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'Tasks' && (
        <>
          <div className="flex justify-between items-center mb">
            <p className="muted fs-sm">{caseTasks.filter((t) => !t.done).length} open task(s)</p>
            <button className="btn btn--brass btn--sm" onClick={() => setTaskOpen(true)}><Icon.plus size={15} /> New Task</button>
          </div>
          <div className="card">
            {caseTasks.length === 0 ? <Empty icon="tasks" title="No tasks for this matter" /> : (
              <div className="card--pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
                {caseTasks.map((t) => {
                  const a = getLawyer(t.assigneeId)
                  return (
                    <div className="row" key={t.id}>
                      <button onClick={() => toggleTask(t.id)} style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'grid', placeItems: 'center',
                        border: t.done ? 'none' : '1.5px solid var(--line-strong)', background: t.done ? 'var(--st-won)' : 'transparent', color: '#fff' }}>
                        {t.done && <Icon.check size={13} />}
                      </button>
                      <div className="row__body">
                        <b style={{ textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.55 : 1 }}>{t.title}</b>
                        <p>Assigned to {a?.name || '—'} · Due {fmtDate(t.due)}</p>
                      </div>
                      <Priority level={t.priority} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'Notes' && (
        <div className="grid cols-3 detail-cols" style={{ alignItems: 'start' }}>
          <div className="span-2">
            {caseNotes.length === 0 ? (
              <div className="card"><Empty icon="edit" title="No notes yet" sub="Add the first note for this matter." /></div>
            ) : caseNotes.map((n) => (
              <div className="note" key={n.id}>
                <div className="note__head">
                  <Avatar name={n.author} initials={n.initials} tone={n.tone} size="sm" />
                  <b>{n.author}</b>
                  <span>{fmtDate(n.date)}</span>
                </div>
                <p>{n.text}</p>
              </div>
            ))}
          </div>
          <div className="card card--pad">
            <span className="eyebrow">Add a note</span>
            <textarea className="input mt-sm" placeholder="Write an internal note about this matter…" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <button className="btn btn--primary btn--block mt-sm" onClick={postNote} disabled={!noteText.trim()}><Icon.send size={15} /> Post note</button>
          </div>
        </div>
      )}

      {tab === 'Timeline' && (
        <div className="card card--pad">
          {caseTimeline.length === 0 ? <Empty icon="clock" title="No timeline events recorded" /> : (
            <div className="timeline">
              {caseTimeline.map((e, i) => (
                <div className="tl-item" key={i}>
                  <time>{fmtDate(e.date)}</time>
                  <b>{e.title}</b>
                  <p>{e.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
