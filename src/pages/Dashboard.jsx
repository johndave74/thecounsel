import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import { Stat, StatusBadge, AvatarStack, Priority } from '../components/ui'
import { CaseModal } from '../components/modals'
import { useStore } from '../store'
import { fmtDate, fmtDateShort } from '../data/sampleData'

const STATUS_ORDER = ['Open', 'Pending', 'In Court', 'Closed', 'Won', 'Lost']

export default function Dashboard() {
  const nav = useNavigate()
  const { cases, hearings, tasks, notifications, clients, getClient, getLawyer, currentUser } = useStore()
  const firstName = (currentUser?.name || 'there').split(' ')[0]
  const [caseOpen, setCaseOpen] = useState(false)

  const active = cases.filter((c) => ['Open', 'Pending', 'In Court'].includes(c.status))
  const won = cases.filter((c) => c.status === 'Won').length
  const counts = STATUS_ORDER.map((s) => ({ s, n: cases.filter((c) => c.status === s).length }))
  const maxCount = Math.max(...counts.map((c) => c.n), 1)

  const upcoming = [...hearings]
    .filter((h) => h.type !== 'deadline')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)
  const openTasks = tasks.filter((t) => !t.done).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5)
  const recentCases = [...cases].sort((a, b) => b.opened.localeCompare(a.opened)).slice(0, 5)

  return (
    <div className="page">
      <CaseModal open={caseOpen} onClose={() => setCaseOpen(false)} />

      <div className="page-head">
        <div>
          <span className="eyebrow">{fmtDate('2026-06-03')} · Tuesday</span>
          <h2>Good morning, {firstName}.</h2>
          <p>You have {upcoming.length} upcoming hearings and {openTasks.length} open tasks this week.</p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn--ghost" onClick={() => nav('/app/hearings')}><Icon.calendar size={17} /> Calendar</button>
          <button className="btn btn--brass" onClick={() => setCaseOpen(true)}><Icon.plus size={17} /> New Case</button>
        </div>
      </div>

      <div className="grid cols-4 stagger" style={{ marginBottom: 20 }}>
        <Stat icon="briefcase" label="Active cases" value={active.length} delta="+3 this month" dir="up" />
        <Stat icon="calendar" label="Hearings this month" value={hearings.filter((h) => h.type !== 'deadline').length} delta="2 this week" dir="up" />
        <Stat icon="users" label="Active clients" value={clients.length} delta="+1" dir="up" />
        <Stat icon="star" label="Cases won" value={won} delta="91% win rate" dir="up" />
      </div>

      <div className="grid cols-3" style={{ alignItems: 'start' }}>
        {/* Caseload distribution */}
        <div className="card span-2">
          <div className="card-head">
            <h3>Caseload by status</h3>
            <Link to="/app/cases" className="link-brass fs-sm">View all cases →</Link>
          </div>
          <div className="card--pad">
            <div style={{ display: 'grid', gap: 16 }}>
              {counts.map(({ s, n }) => (
                <div key={s} className="flex items-center gap" >
                  <div style={{ width: 92, flexShrink: 0 }}><StatusBadge status={s} /></div>
                  <div className="progress grow">
                    <span style={{ width: `${(n / maxCount) * 100}%` }} />
                  </div>
                  <b style={{ width: 24, textAlign: 'right' }}>{n}</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming hearings */}
        <div className="card">
          <div className="card-head"><h3>Upcoming</h3><Icon.calendar size={18} className="faint" /></div>
          <div className="card--pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
            {upcoming.map((h) => (
              <div className="row" key={h.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/app/cases/${h.caseId}`)}>
                <div style={{ textAlign: 'center', width: 46, flexShrink: 0 }}>
                  <div className="display" style={{ fontSize: 22, color: 'var(--brass-deep)' }}>{new Date(h.date + 'T00:00:00').getDate()}</div>
                  <div className="fs-xs faint" style={{ textTransform: 'uppercase' }}>{new Date(h.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</div>
                </div>
                <div className="row__body">
                  <b>{h.title}</b>
                  <p className="flex items-center gap-sm" style={{ marginTop: 2 }}><Icon.clock size={13} /> {h.time} · {h.court}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent cases table */}
        <div className="card span-2">
          <div className="card-head"><h3>Recently opened matters</h3><Link to="/app/cases" className="link-brass fs-sm">All →</Link></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Case</th><th>Client</th><th>Team</th><th>Status</th><th>Progress</th></tr>
              </thead>
              <tbody>
                {recentCases.map((c) => {
                  const client = getClient(c.clientId)
                  const team = c.lawyerIds.map(getLawyer).filter(Boolean)
                  return (
                    <tr key={c.id} onClick={() => nav(`/app/cases/${c.id}`)}>
                      <td>
                        <div className="cell-strong">{c.title}</div>
                        <div className="cell-sub mono">{c.number}</div>
                      </td>
                      <td>{client?.name}</td>
                      <td>{team.length ? <AvatarStack people={team} /> : <span className="faint">—</span>}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td style={{ minWidth: 110 }}>
                        <div className="flex items-center gap-sm">
                          <div className="progress grow"><span style={{ width: `${c.progress}%` }} /></div>
                          <small className="fs-xs muted">{c.progress}%</small>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tasks + reminders */}
        <div style={{ display: 'grid', gap: 20 }}>
          <div className="card">
            <div className="card-head"><h3>My tasks</h3><Link to="/app/tasks" className="link-brass fs-sm">All →</Link></div>
            <div className="card--pad" style={{ paddingTop: 8, paddingBottom: 8 }}>
              {openTasks.map((t) => (
                <div className="row" key={t.id}>
                  <span style={{ width: 18, height: 18, borderRadius: 5, border: '1.5px solid var(--line-strong)', flexShrink: 0 }} />
                  <div className="row__body">
                    <b style={{ fontWeight: 500, fontSize: 13.5 }}>{t.title}</b>
                    <p>Due {fmtDateShort(t.due)}</p>
                  </div>
                  <Priority level={t.priority} />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Reminders</h3><Link to="/app/notifications" className="link-brass fs-sm">All →</Link></div>
            <div className="card--pad" style={{ paddingTop: 8, paddingBottom: 8 }}>
              {notifications.filter((n) => n.unread).slice(0, 3).map((n) => (
                <div className="row" key={n.id}>
                  <span className={`notif__ico ${n.kind}`} style={{ width: 34, height: 34 }}>
                    {n.kind === 'warn' ? <Icon.alert size={16} /> : <Icon.calendar size={16} />}
                  </span>
                  <div className="row__body">
                    <b style={{ fontSize: 13.5 }}>{n.title}</b>
                    <p>{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
