import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import { StatusBadge, AvatarStack, Priority, Empty } from '../components/ui'
import { CaseModal } from '../components/modals'
import { useStore } from '../store'
import { fmtDate } from '../data/sampleData'
import { exportCsv } from '../utils'

const FILTERS = ['All', 'Open', 'Pending', 'In Court', 'Closed', 'Won', 'Lost']

export default function Cases() {
  const nav = useNavigate()
  const { cases, getClient, getLawyer, toast } = useStore()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const [practice, setPractice] = useState('All')
  const [modal, setModal] = useState(false)

  const practices = ['All', ...Array.from(new Set(cases.map((c) => c.practice)))]

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    return cases.filter((c) => {
      if (status !== 'All' && c.status !== status) return false
      if (practice !== 'All' && c.practice !== practice) return false
      if (!t) return true
      const client = getClient(c.clientId)
      return (
        c.title.toLowerCase().includes(t) ||
        c.number.toLowerCase().includes(t) ||
        (client?.name.toLowerCase().includes(t))
      )
    })
  }, [q, status, practice, cases, getClient])

  const doExport = () => {
    exportCsv('cases.csv', filtered.map((c) => ({
      Number: c.number, Title: c.title, Client: getClient(c.clientId)?.name || '',
      Practice: c.practice, Status: c.status, Priority: c.priority,
      Opened: c.opened, NextHearing: c.nextHearing || '', Value: c.value, Progress: `${c.progress}%`,
    })))
    toast(`Exported ${filtered.length} cases to CSV`, 'info')
  }

  return (
    <div className="page">
      <CaseModal open={modal} onClose={() => setModal(false)} />

      <div className="page-head">
        <div>
          <h2>Cases</h2>
          <p>{filtered.length} of {cases.length} matters shown</p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn--ghost" onClick={doExport}><Icon.download size={17} /> Export</button>
          <button className="btn btn--brass" onClick={() => setModal(true)}><Icon.plus size={17} /> New Case</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar__search">
          <Icon.search size={17} />
          <input placeholder="Search by case title, number or client…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input" style={{ maxWidth: 200 }} value={practice} onChange={(e) => setPractice(e.target.value)}>
          {practices.map((p) => <option key={p}>{p === 'All' ? 'All practice areas' : p}</option>)}
        </select>
      </div>

      <div className="seg" style={{ marginBottom: 20 }}>
        {FILTERS.map((f) => (
          <button key={f} className={status === f ? 'is-active' : ''} onClick={() => setStatus(f)}>
            {f}
            <span className="faint" style={{ marginLeft: 6 }}>
              {f === 'All' ? cases.length : cases.filter((c) => c.status === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <Empty icon="briefcase" title="No matching cases" sub="Try adjusting your search or filters." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Case</th><th>Client</th><th>Practice</th><th>Team</th>
                  <th>Status</th><th>Priority</th><th>Next Hearing</th><th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const client = getClient(c.clientId)
                  const team = c.lawyerIds.map(getLawyer).filter(Boolean)
                  return (
                    <tr key={c.id} onClick={() => nav(`/app/cases/${c.id}`)}>
                      <td>
                        <div className="cell-strong">{c.title}</div>
                        <div className="cell-sub mono">{c.number}</div>
                      </td>
                      <td>{client?.name}<div className="cell-sub">{client?.type}</div></td>
                      <td><span className="tag">{c.practice}</span></td>
                      <td>{team.length ? <AvatarStack people={team} /> : <span className="faint">—</span>}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td><Priority level={c.priority} /></td>
                      <td className="nowrap">{c.nextHearing ? fmtDate(c.nextHearing) : <span className="faint">—</span>}</td>
                      <td style={{ minWidth: 120 }}>
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
        )}
      </div>
    </div>
  )
}
