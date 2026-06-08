import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import { Empty } from '../components/ui'
import { HearingModal } from '../components/modals'
import { useStore } from '../store'
import { fmtDate } from '../data/sampleData'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TYPE_LABEL = { court: 'Court date', hearing: 'Hearing', deadline: 'Deadline', meeting: 'Meeting' }
const TODAY = '2026-06-03'

function buildMonth(year, month) {
  const first = new Date(year, month, 1)
  const startDay = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function Hearings() {
  const nav = useNavigate()
  const { hearings, getCase } = useStore()
  const [view, setView] = useState('Calendar')
  const [filter, setFilter] = useState('All')
  const [modal, setModal] = useState(false)
  const year = 2026, month = 5 // June 2026
  const cells = buildMonth(year, month)

  const visible = hearings.filter((h) => filter === 'All' || h.type === filter)
  const iso = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const eventsOn = (d) => visible.filter((h) => h.date === iso(d))
  const agenda = [...visible].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  return (
    <div className="page">
      <HearingModal open={modal} onClose={() => setModal(false)} />

      <div className="page-head">
        <div><h2>Hearings & Calendar</h2><p>June 2026 · {hearings.length} scheduled events</p></div>
        <div className="page-head__actions">
          <div className="seg">
            <button className={view === 'Calendar' ? 'is-active' : ''} onClick={() => setView('Calendar')}>Calendar</button>
            <button className={view === 'Agenda' ? 'is-active' : ''} onClick={() => setView('Agenda')}>Agenda</button>
          </div>
          <button className="btn btn--brass" onClick={() => setModal(true)}><Icon.plus size={17} /> Schedule</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="seg">
          {['All', 'court', 'hearing', 'deadline', 'meeting'].map((f) => (
            <button key={f} className={filter === f ? 'is-active' : ''} onClick={() => setFilter(f)}>
              {f === 'All' ? 'All events' : TYPE_LABEL[f]}
            </button>
          ))}
        </div>
        <div className="grow" />
        <div className="flex items-center gap" style={{ fontSize: 12 }}>
          <span className="flex items-center gap-sm muted"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--st-court)' }} /> Court</span>
          <span className="flex items-center gap-sm muted"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--st-open)' }} /> Hearing</span>
          <span className="flex items-center gap-sm muted"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--st-lost)' }} /> Deadline</span>
          <span className="flex items-center gap-sm muted"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--st-pending)' }} /> Meeting</span>
        </div>
      </div>

      {view === 'Calendar' ? (
        <>
          <div className="cal" style={{ marginBottom: 1 }}>
            {DOW.map((d) => <div className="cal__dow" key={d}>{d}</div>)}
          </div>
          <div className="cal">
            {cells.map((d, i) => (
              <div key={i} className={`cal__cell ${d == null ? 'is-out' : ''} ${d != null && iso(d) === TODAY ? 'is-today' : ''}`}>
                {d != null && <div className="cal__date">{d}</div>}
                {d != null && eventsOn(d).map((h) => (
                  <div key={h.id} className={`cal__ev t-${h.type}`} title={`${h.title} · ${h.time}`} onClick={() => nav(`/app/cases/${h.caseId}`)}>
                    {h.time} {h.title.split('—').pop().trim()}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="card">
          {agenda.length === 0 ? <Empty icon="calendar" title="No events match this filter" /> : (
            <div className="card--pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
              {agenda.map((h) => {
                const cse = getCase(h.caseId)
                return (
                  <div className="row" key={h.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/app/cases/${h.caseId}`)}>
                    <div style={{ textAlign: 'center', width: 52, flexShrink: 0 }}>
                      <div className="display" style={{ fontSize: 24, color: 'var(--brass-deep)' }}>{new Date(h.date + 'T00:00:00').getDate()}</div>
                      <div className="fs-xs faint" style={{ textTransform: 'uppercase' }}>{new Date(h.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    </div>
                    <div className="row__body">
                      <div className="flex items-center gap-sm">
                        <b>{h.title}</b>
                        <span className={`cal__ev t-${h.type}`} style={{ marginTop: 0 }}>{TYPE_LABEL[h.type]}</span>
                      </div>
                      <p className="flex items-center gap" style={{ marginTop: 3 }}>
                        <span className="flex items-center gap-sm"><Icon.clock size={13} /> {h.time}</span>
                        {h.court !== '—' && <span className="flex items-center gap-sm"><Icon.mapPin size={13} /> {h.court}</span>}
                        {h.judge !== '—' && <span className="flex items-center gap-sm"><Icon.gavel size={13} /> {h.judge}</span>}
                      </p>
                    </div>
                    <div className="text-r nowrap">
                      <span className="tag">{h.status}</span>
                      <div className="fs-xs faint" style={{ marginTop: 6 }}>{cse?.number}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
