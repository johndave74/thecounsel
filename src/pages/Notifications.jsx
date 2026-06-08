import { useState } from 'react'
import Icon from '../components/Icons'
import { Empty } from '../components/ui'
import { useStore } from '../store'

const KIND_ICON = { warn: 'alert', cal: 'calendar', info: 'doc', ok: 'checkCircle' }

export default function Notifications() {
  const { notifications, markRead, markAllRead } = useStore()
  const [filter, setFilter] = useState('All')

  const view = notifications.filter((n) => (filter === 'Unread' ? n.unread : true))
  const unread = notifications.filter((n) => n.unread).length

  return (
    <div className="page">
      <div className="page-head">
        <div><h2>Notifications</h2><p>{unread} unread reminders & updates</p></div>
        <div className="page-head__actions">
          <button className="btn btn--ghost" onClick={markAllRead} disabled={unread === 0}><Icon.check size={17} /> Mark all read</button>
        </div>
      </div>

      <div className="seg" style={{ marginBottom: 20 }}>
        {['All', 'Unread'].map((f) => (
          <button key={f} className={filter === f ? 'is-active' : ''} onClick={() => setFilter(f)}>
            {f}{f === 'Unread' ? ` (${unread})` : ''}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 760 }}>
        {view.length === 0 ? (
          <div className="card"><Empty icon="bell" title="You’re all caught up" sub="No notifications to show." /></div>
        ) : view.map((n) => {
          const Ico = Icon[KIND_ICON[n.kind]] || Icon.bell
          return (
            <div className={`notif ${n.unread ? 'is-unread' : ''}`} key={n.id} onClick={() => markRead(n.id)} style={{ cursor: 'pointer' }}>
              <span className={`notif__ico ${n.kind}`}><Ico size={19} /></span>
              <div className="notif__body grow">
                <div className="flex items-center gap-sm">
                  <b>{n.title}</b>
                  {n.unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brass)' }} />}
                </div>
                <p>{n.body}</p>
                <time>{n.time}</time>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
