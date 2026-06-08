import { useState, useMemo } from 'react'
import Icon from '../components/Icons'
import { Avatar, Empty } from '../components/ui'
import { ClientModal } from '../components/modals'
import { useStore } from '../store'
import { fmtDate } from '../data/sampleData'
import { exportCsv } from '../utils'

const TYPES = ['All', 'Individual', 'Corporate']

export default function Clients() {
  const { clients, cases, toast } = useStore()
  const [q, setQ] = useState('')
  const [type, setType] = useState('All')
  const [modal, setModal] = useState(false)

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    return clients.filter((c) => {
      if (type !== 'All' && c.type !== type) return false
      if (!t) return true
      return c.name.toLowerCase().includes(t) || c.email.toLowerCase().includes(t) || (c.company || '').toLowerCase().includes(t)
    })
  }, [q, type, clients])

  const doExport = () => {
    exportCsv('clients.csv', filtered.map((c) => ({
      Name: c.name, Type: c.type, Company: c.company || '', Email: c.email, Phone: c.phone, Location: c.address, Since: c.since,
    })))
    toast(`Exported ${filtered.length} clients to CSV`, 'info')
  }

  return (
    <div className="page">
      <ClientModal open={modal} onClose={() => setModal(false)} />

      <div className="page-head">
        <div><h2>Clients</h2><p>{clients.length} active client accounts</p></div>
        <div className="page-head__actions">
          <button className="btn btn--ghost" onClick={doExport}><Icon.download size={17} /> Export</button>
          <button className="btn btn--brass" onClick={() => setModal(true)}><Icon.plus size={17} /> Add Client</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar__search">
          <Icon.search size={17} />
          <input placeholder="Search clients by name, company or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="seg">
          {TYPES.map((t) => (
            <button key={t} className={type === t ? 'is-active' : ''} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><Empty icon="users" title="No clients found" sub="Adjust your search or add a new client." /></div>
      ) : (
        <div className="grid cols-3">
          {filtered.map((c) => {
            const clientCases = cases.filter((cs) => cs.clientId === c.id)
            return (
              <div className="card card--pad" key={c.id}>
                <div className="flex items-center justify-between">
                  <Avatar name={c.name} tone={c.tone} size="lg" />
                  <span className="tag">{c.type === 'Corporate' ? <span className="flex items-center gap-sm"><Icon.building size={13} /> Corporate</span> : <span className="flex items-center gap-sm"><Icon.user size={13} /> Individual</span>}</span>
                </div>
                <b style={{ fontSize: 17, display: 'block', marginTop: 14 }}>{c.name}</b>
                {c.company && <div className="fs-sm muted">{c.company}</div>}
                <div className="mt" style={{ display: 'grid', gap: 8, fontSize: 13.5 }}>
                  <span className="flex items-center gap-sm muted"><Icon.mail size={15} /> {c.email}</span>
                  <span className="flex items-center gap-sm muted"><Icon.phone size={15} /> {c.phone}</span>
                  <span className="flex items-center gap-sm muted"><Icon.mapPin size={15} /> {c.address}</span>
                </div>
                <div className="divider" style={{ margin: '16px 0' }} />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="display" style={{ fontSize: 22, color: 'var(--brass-deep)' }}>{clientCases.length}</div>
                    <div className="fs-xs faint">Active matters</div>
                  </div>
                  <div className="text-r">
                    <div className="fs-sm fw-600">Client since</div>
                    <div className="fs-xs faint">{fmtDate(c.since)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
