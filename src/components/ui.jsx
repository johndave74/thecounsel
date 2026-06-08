import { statusClass } from '../data/sampleData'
import Icon from './Icons'

export function StatusBadge({ status }) {
  return <span className={`badge badge--${statusClass(status)}`}>{status}</span>
}

export function Avatar({ name, initials, tone = 0, size = 'md' }) {
  const txt = initials || (name ? name.split(' ').map((w) => w[0]).slice(0, 2).join('') : '?')
  return <span className={`avatar avatar--${size} avatar-tone-${tone}`}>{txt}</span>
}

export function AvatarStack({ people, size = 'sm' }) {
  return (
    <div className="avatar-stack">
      {people.map((p) => (
        <Avatar key={p.id} name={p.name} initials={p.initials} tone={p.tone} size={size} />
      ))}
    </div>
  )
}

export function Priority({ level }) {
  return <span className={`prio prio--${(level || '').toLowerCase()}`}>{level}</span>
}

export function FileIcon({ ext }) {
  const cls = { pdf: 'fi-pdf', doc: 'fi-doc', img: 'fi-img', xls: 'fi-xls', zip: 'fi-zip' }[ext] || 'fi-default'
  const label = { pdf: 'PDF', doc: 'DOC', img: 'IMG', xls: 'XLS', zip: 'ZIP' }[ext] || 'FILE'
  return <span className={`file-ico ${cls}`}>{label}</span>
}

export function Empty({ icon = 'search', title, sub }) {
  const Ico = Icon[icon] || Icon.search
  return (
    <div className="empty">
      <Ico size={42} />
      <h3>{title}</h3>
      {sub && <p style={{ marginTop: 6, fontSize: 13.5 }}>{sub}</p>}
    </div>
  )
}

export function Stat({ icon, label, value, delta, dir }) {
  const Ico = Icon[icon] || Icon.briefcase
  return (
    <div className="stat">
      <div className="stat__top">
        <span className="stat__ico"><Ico size={20} /></span>
        {delta && (
          <span className={`stat__delta ${dir}`}>
            {dir === 'up' ? <Icon.trendUp size={13} /> : <Icon.trendDown size={13} />}
            {delta}
          </span>
        )}
      </div>
      <div className="stat__num">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  )
}
