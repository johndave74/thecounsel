import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import Icon from './Icons'
import { Avatar } from './ui'
import { useStore } from '../store'

const NAV = [
  {
    group: 'Practice',
    items: [
      { to: '/app', label: 'Dashboard', icon: 'dashboard', end: true },
      { to: '/app/cases', label: 'Cases', icon: 'briefcase' },
      { to: '/app/clients', label: 'Clients', icon: 'users' },
      { to: '/app/hearings', label: 'Hearings & Calendar', icon: 'calendar' },
    ],
  },
  {
    group: 'Workflow',
    items: [
      { to: '/app/documents', label: 'Documents', icon: 'folder' },
      { to: '/app/tasks', label: 'Tasks & Deadlines', icon: 'tasks' },
      { to: '/app/staff', label: 'Lawyers & Staff', icon: 'gavel' },
    ],
  },
  {
    group: 'Account',
    items: [
      { to: '/app/notifications', label: 'Notifications', icon: 'bell', notif: true },
      { to: '/app/settings', label: 'Settings', icon: 'settings' },
    ],
  },
]

const TITLES = {
  '/app': ['Dashboard', 'Firm overview & today’s priorities'],
  '/app/cases': ['Cases', 'Track every matter from intake to verdict'],
  '/app/clients': ['Clients', 'Individuals & corporate accounts'],
  '/app/hearings': ['Hearings & Calendar', 'Court dates, deadlines & meetings'],
  '/app/documents': ['Documents', 'Case files & legal records'],
  '/app/tasks': ['Tasks & Deadlines', 'Assignments across the firm'],
  '/app/staff': ['Lawyers & Staff', 'Team roster & assignments'],
  '/app/notifications': ['Notifications', 'Reminders & activity'],
  '/app/settings': ['Settings', 'Profile, roles & preferences'],
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const loc = useLocation()
  const { notifications, currentUser, signOut } = useStore()
  const unread = notifications.filter((n) => n.unread).length
  const user = currentUser || { name: '—', initials: '—', role: '', title: '', tone: 0 }

  const handleSignOut = async () => {
    await signOut()
    nav('/login')
  }

  const baseKey = Object.keys(TITLES)
    .filter((k) => (k === '/app' ? loc.pathname === '/app' : loc.pathname.startsWith(k)))
    .sort((a, b) => b.length - a.length)[0] || '/app'
  const [title, subtitle] = TITLES[baseKey] || ['Case Detail', 'Matter overview']

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar__head">
          <span className="sidebar__mark"><Icon.scale size={22} /></span>
          <div className="sidebar__brand">The Counsel<small>Case Management</small></div>
        </div>

        <nav className="sidebar__scroll">
          {NAV.map((g) => (
            <div className="nav-group" key={g.group}>
              <p>{g.group}</p>
              {g.items.map((it) => {
                const Ico = Icon[it.icon]
                return (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end={it.end}
                    className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    <Ico size={19} />
                    {it.label}
                    {it.notif && unread ? <span className="pill">{unread}</span> : null}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar__foot">
          <div className="user-chip">
            <Avatar name={user.name} initials={user.initials} tone={user.tone} size="md" />
            <div className="user-chip__info">
              <b>{user.name}</b>
              <span>{user.role} · {user.title}</span>
            </div>
            <button className="icon-btn" style={{ marginLeft: 'auto', color: 'rgba(243,239,230,0.7)' }} title="Sign out" onClick={handleSignOut}>
              <Icon.logout size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className={`scrim ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn topbar__menu" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon.menu size={20} />
          </button>
          <div className="topbar__title">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="topbar__search">
            <Icon.search size={17} />
            <input placeholder="Search cases, clients, documents…" />
          </div>
          <button className="icon-btn" title="Notifications" onClick={() => nav('/app/notifications')}>
            <Icon.bell size={19} />
            {unread > 0 && <span className="dot" />}
          </button>
          <button className="icon-btn" title="Settings" onClick={() => nav('/app/settings')}>
            <Icon.settings size={19} />
          </button>
        </header>

        <main>{children}</main>
      </div>
    </div>
  )
}
