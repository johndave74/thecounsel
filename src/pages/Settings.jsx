import { useState } from 'react'
import Icon from '../components/Icons'
import { Avatar } from '../components/ui'
import { useStore } from '../store'
import { roles } from '../data/sampleData'

const SECTIONS = [
  { key: 'profile', label: 'Profile', icon: 'user' },
  { key: 'roles', label: 'Roles & Access', icon: 'shield' },
  { key: 'notifications', label: 'Notifications', icon: 'bell' },
  { key: 'security', label: 'Security', icon: 'lock' },
]

function Toggle({ on, onClick }) {
  return <button className={`toggle ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on} />
}

export default function Settings() {
  const { toast, currentUser } = useStore()
  const user = currentUser || { name: '', initials: '', tone: 0, title: '', role: 'Lawyer', email: '', phone: '' }
  const [section, setSection] = useState('profile')
  const [activeRole, setActiveRole] = useState(user.role)
  const [toggles, setToggles] = useState({
    hearings: true, deadlines: true, docs: false, tasks: true, weekly: true,
    twofa: true, sessions: false,
  })
  const flip = (k) => setToggles((t) => ({ ...t, [k]: !t[k] }))

  return (
    <div className="page">
      <div className="page-head">
        <div><h2>Settings</h2><p>Manage your profile, access and preferences</p></div>
      </div>

      <div className="settings-grid">
        <nav className="settings-nav">
          {SECTIONS.map((s) => {
            const Ico = Icon[s.icon]
            return (
              <button key={s.key} className={section === s.key ? 'is-active' : ''} onClick={() => setSection(s.key)}>
                <Ico size={18} /> {s.label}
              </button>
            )
          })}
        </nav>

        <div>
          {section === 'profile' && (
            <div className="card card--pad">
              <span className="eyebrow">Your profile</span>
              <div className="flex items-center gap mt" style={{ marginBottom: 8 }}>
                <Avatar name={user.name} initials={user.initials} tone={user.tone} size="lg" />
                <div>
                  <b style={{ fontSize: 17 }}>{user.name}</b>
                  <div className="fs-sm muted">{user.title} · {user.role}</div>
                </div>
                <button className="btn btn--ghost btn--sm" style={{ marginLeft: 'auto' }} onClick={() => toast('Photo updated', 'info')}><Icon.upload size={15} /> Change photo</button>
              </div>
              <div className="divider" />
              <div className="field-row">
                <div className="field"><label>Full name</label><input className="input" defaultValue={user.name} /></div>
                <div className="field"><label>Job title</label><input className="input" defaultValue={user.title} /></div>
              </div>
              <div className="field-row">
                <div className="field"><label>Email</label><input className="input" defaultValue={user.email} /></div>
                <div className="field"><label>Phone</label><input className="input" defaultValue={user.phone} /></div>
              </div>
              <div className="field"><label>Bio</label><textarea className="input" defaultValue="Managing Partner specializing in corporate law and complex commercial litigation." /></div>
              <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn--ghost" onClick={() => toast('Changes discarded', 'info')}>Cancel</button>
                <button className="btn btn--primary" onClick={() => toast('Profile saved')}>Save changes</button>
              </div>
            </div>
          )}

          {section === 'roles' && (
            <div className="card card--pad">
              <span className="eyebrow">Role-based access</span>
              <p className="fs-sm muted" style={{ marginTop: 6, marginBottom: 18 }}>
                Select a role to preview its permissions. Access control is illustrative in this demo.
              </p>
              <div className="grid" style={{ gap: 14 }}>
                {roles.map((r) => {
                  const Ico = Icon[r.icon]
                  const active = activeRole === r.key
                  return (
                    <div className={`role-card ${active ? 'is-active' : ''}`} key={r.key} onClick={() => setActiveRole(r.key)} style={{ cursor: 'pointer' }}>
                      <div className="flex items-center gap">
                        <span className="stat__ico" style={{ background: active ? 'var(--brass)' : 'var(--brass-wash)', color: active ? '#fff' : 'var(--brass-deep)' }}><Ico size={20} /></span>
                        <div className="grow">
                          <h4>{r.label}</h4>
                          <div className="fs-sm muted">{r.desc}</div>
                        </div>
                        {active && <span className="badge badge--won">Current</span>}
                      </div>
                      <div className="flex wrap gap-sm" style={{ marginTop: 14 }}>
                        {r.perms.map((p) => (
                          <span className="tag flex items-center gap-sm" key={p}><Icon.check size={12} /> {p}</span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {section === 'notifications' && (
            <div className="card card--pad">
              <span className="eyebrow">Notification preferences</span>
              <div className="mt">
                {[
                  ['hearings', 'Upcoming hearings', 'Get reminded before scheduled court dates.'],
                  ['deadlines', 'Deadline alerts', 'Alerts for filing and discovery deadlines.'],
                  ['docs', 'Document uploads', 'When a team member adds a file to your cases.'],
                  ['tasks', 'Task assignments', 'When a task is assigned to or completed by you.'],
                  ['weekly', 'Weekly digest', 'A Monday summary of the week’s priorities.'],
                ].map(([k, t, d]) => (
                  <div className="setting-row" key={k}>
                    <div><b>{t}</b><p>{d}</p></div>
                    <Toggle on={toggles[k]} onClick={() => flip(k)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'security' && (
            <div className="card card--pad">
              <span className="eyebrow">Security</span>
              <div className="mt">
                <div className="setting-row">
                  <div><b>Two-factor authentication</b><p>Require a verification code at sign-in.</p></div>
                  <Toggle on={toggles.twofa} onClick={() => flip('twofa')} />
                </div>
                <div className="setting-row">
                  <div><b>Active session alerts</b><p>Notify me of new sign-ins from unknown devices.</p></div>
                  <Toggle on={toggles.sessions} onClick={() => flip('sessions')} />
                </div>
              </div>
              <div className="divider" />
              <span className="eyebrow">Change password</span>
              <div className="field mt-sm"><label>Current password</label><input className="input" type="password" placeholder="••••••••" /></div>
              <div className="field-row">
                <div className="field"><label>New password</label><input className="input" type="password" placeholder="New password" /></div>
                <div className="field"><label>Confirm</label><input className="input" type="password" placeholder="Confirm password" /></div>
              </div>
              <div className="flex" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn--primary" onClick={() => toast('Password updated')}>Update password</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
