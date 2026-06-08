import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import { Priority, Avatar, Empty } from '../components/ui'
import { TaskModal } from '../components/modals'
import { useStore } from '../store'
import { fmtDate } from '../data/sampleData'

const TODAY = '2026-06-03'

export default function Tasks() {
  const nav = useNavigate()
  const { tasks, getLawyer, getCase, toggleTask } = useStore()
  const [filter, setFilter] = useState('Open')
  const [modal, setModal] = useState(false)

  const view = tasks.filter((t) =>
    filter === 'All' ? true : filter === 'Open' ? !t.done : filter === 'Completed' ? t.done : true
  )
  const isOverdue = (t) => !t.done && t.due < TODAY
  const sorted = [...view].sort((a, b) => a.due.localeCompare(b.due))

  const openCount = tasks.filter((t) => !t.done).length
  const overdueCount = tasks.filter(isOverdue).length
  const doneCount = tasks.filter((t) => t.done).length

  return (
    <div className="page">
      <TaskModal open={modal} onClose={() => setModal(false)} />

      <div className="page-head">
        <div><h2>Tasks & Deadlines</h2><p>{openCount} open · {overdueCount} overdue · {doneCount} completed</p></div>
        <div className="page-head__actions">
          <button className="btn btn--brass" onClick={() => setModal(true)}><Icon.plus size={17} /> New Task</button>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 22 }}>
        <div className="card card--pad flex items-center gap">
          <span className="stat__ico" style={{ background: 'var(--st-pending-bg)', color: 'var(--st-pending)' }}><Icon.tasks size={20} /></span>
          <div><div className="display" style={{ fontSize: 26 }}>{openCount}</div><div className="fs-sm muted">Open tasks</div></div>
        </div>
        <div className="card card--pad flex items-center gap">
          <span className="stat__ico" style={{ background: 'var(--st-lost-bg)', color: 'var(--st-lost)' }}><Icon.alert size={20} /></span>
          <div><div className="display" style={{ fontSize: 26 }}>{overdueCount}</div><div className="fs-sm muted">Overdue</div></div>
        </div>
        <div className="card card--pad flex items-center gap">
          <span className="stat__ico" style={{ background: 'var(--st-won-bg)', color: 'var(--st-won)' }}><Icon.checkCircle size={20} /></span>
          <div><div className="display" style={{ fontSize: 26 }}>{doneCount}</div><div className="fs-sm muted">Completed</div></div>
        </div>
      </div>

      <div className="seg" style={{ marginBottom: 20 }}>
        {['Open', 'Completed', 'All'].map((f) => (
          <button key={f} className={filter === f ? 'is-active' : ''} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="card">
        {sorted.length === 0 ? <Empty icon="tasks" title="Nothing here" sub="No tasks match this filter." /> : (
          <div className="card--pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {sorted.map((t) => {
              const a = getLawyer(t.assigneeId)
              const cse = getCase(t.caseId)
              const overdue = isOverdue(t)
              return (
                <div className="row" key={t.id}>
                  <button
                    onClick={() => toggleTask(t.id)}
                    style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: 'grid', placeItems: 'center',
                      border: t.done ? 'none' : '1.5px solid var(--line-strong)', background: t.done ? 'var(--st-won)' : 'transparent', color: '#fff' }}
                  >
                    {t.done && <Icon.check size={14} />}
                  </button>
                  <div className="row__body">
                    <b style={{ textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.55 : 1 }}>{t.title}</b>
                    <p>
                      <span onClick={() => cse && nav(`/app/cases/${t.caseId}`)} style={{ cursor: cse ? 'pointer' : 'default' }}>
                        {cse ? `${cse.number} · ${cse.title}` : 'Unassigned case'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap">
                    {a && <Avatar name={a.name} tone={a.tone} size="sm" />}
                    <div className="text-r nowrap" style={{ minWidth: 90 }}>
                      <div className="fs-sm fw-600" style={{ color: overdue ? 'var(--st-lost)' : 'var(--ink)' }}>{fmtDate(t.due)}</div>
                      <div className="fs-xs faint">{t.done ? 'Done' : overdue ? 'Overdue' : 'Due'}</div>
                    </div>
                    <Priority level={t.priority} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
