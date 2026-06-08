import { useState } from 'react'
import Icon from '../components/Icons'
import { Avatar } from '../components/ui'
import { StaffModal } from '../components/modals'
import { useStore } from '../store'

const ROLE_FILTERS = ['All', 'Admin', 'Lawyer', 'Staff']
const roleBadge = (r) => ({ Admin: 'badge--court', Lawyer: 'badge--open', Staff: 'badge--pending' }[r] || 'badge--closed')

export default function Staff() {
  const { lawyers } = useStore()
  const [role, setRole] = useState('All')
  const [modal, setModal] = useState(false)
  const view = lawyers.filter((l) => role === 'All' || l.role === role)

  return (
    <div className="page">
      <StaffModal open={modal} onClose={() => setModal(false)} />

      <div className="page-head">
        <div><h2>Lawyers & Staff</h2><p>{lawyers.length} team members across the firm</p></div>
        <div className="page-head__actions">
          <button className="btn btn--brass" onClick={() => setModal(true)}><Icon.plus size={17} /> Invite member</button>
        </div>
      </div>

      <div className="seg" style={{ marginBottom: 22 }}>
        {ROLE_FILTERS.map((r) => (
          <button key={r} className={role === r ? 'is-active' : ''} onClick={() => setRole(r)}>
            {r === 'All' ? 'Everyone' : r}
            <span className="faint" style={{ marginLeft: 6 }}>{r === 'All' ? lawyers.length : lawyers.filter((l) => l.role === r).length}</span>
          </button>
        ))}
      </div>

      <div className="grid cols-3">
        {view.map((l) => (
          <div className="card card--pad" key={l.id}>
            <div className="flex items-center justify-between">
              <Avatar name={l.name} initials={l.initials} tone={l.tone} size="lg" />
              <span className={`badge ${roleBadge(l.role)}`}>{l.role}</span>
            </div>
            <b style={{ fontSize: 17, display: 'block', marginTop: 14 }}>{l.name}</b>
            <div className="fs-sm muted">{l.title}</div>
            <div className="mt-sm"><span className="tag">{l.specialty}</span></div>

            <div className="mt" style={{ display: 'grid', gap: 8, fontSize: 13 }}>
              <span className="flex items-center gap-sm muted"><Icon.mail size={15} /> {l.email}</span>
              <span className="flex items-center gap-sm muted"><Icon.phone size={15} /> {l.phone}</span>
              {l.barNo !== '—' && <span className="flex items-center gap-sm muted"><Icon.shield size={15} /> Bar No. {l.barNo}</span>}
            </div>

            <div className="divider" style={{ margin: '16px 0' }} />
            <div className="flex items-center justify-between">
              <div>
                <div className="display" style={{ fontSize: 22, color: 'var(--brass-deep)' }}>{l.cases}</div>
                <div className="fs-xs faint">{l.role === 'Staff' ? 'Supporting' : 'Active'} matters</div>
              </div>
              {l.winRate != null && (
                <div className="text-r">
                  <div className="display" style={{ fontSize: 22, color: 'var(--st-won)' }}>{l.winRate}%</div>
                  <div className="fs-xs faint">Win rate</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
