import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthShell from './AuthShell'
import Icon from '../../components/Icons'
import api from '../../api/client'
import { useStore } from '../../store'

// Simple visual password-strength meter (no validation logic enforced).
function strength(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}
const LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
const COLORS = ['var(--st-lost)', 'var(--st-lost)', 'var(--st-pending)', 'var(--st-open)', 'var(--st-won)']

export default function ResetPassword() {
  const nav = useNavigate()
  const { toast } = useStore()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const s = strength(pw)

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    if (!token) { toast('Reset link is missing or invalid', 'warn'); return }
    if (pw !== confirm) { toast('Passwords do not match', 'warn'); return }
    if (pw.length < 8) { toast('Password must be at least 8 characters', 'warn'); return }
    setBusy(true)
    try {
      await api.auth.resetPassword(token, pw)
      toast('Password reset — please sign in', 'ok')
      nav('/login')
    } catch (err) {
      toast(err.message || 'Reset link is invalid or expired', 'warn')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <form className="auth__form" onSubmit={submit}>
        <div className="auth__form-head">
          <span className="eyebrow">Almost there</span>
          <h2>Set a new password</h2>
          <p>Choose a strong password you haven’t used before.</p>
        </div>

        <div className="field">
          <label>New password</label>
          <div className="field__wrap">
            <Icon.lock size={17} />
            <input
              className="input" type={show ? 'text' : 'password'} placeholder="Enter new password"
              value={pw} onChange={(e) => setPw(e.target.value)} required
            />
            <button type="button" className="field__reveal" onClick={() => setShow((x) => !x)} aria-label="Toggle password">
              {show ? <Icon.eyeOff size={17} /> : <Icon.eye size={17} />}
            </button>
          </div>
          {pw && (
            <div className="flex items-center gap-sm" style={{ marginTop: 10 }}>
              <div className="progress" style={{ flex: 1 }}>
                <span style={{ width: `${(s / 4) * 100}%`, background: COLORS[s] }} />
              </div>
              <small className="fs-xs fw-600" style={{ color: COLORS[s] }}>{LABELS[s]}</small>
            </div>
          )}
        </div>

        <div className="field">
          <label>Confirm password</label>
          <div className="field__wrap">
            <Icon.lock size={17} />
            <input className="input" type={show ? 'text' : 'password'} placeholder="Re-enter new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
        </div>

        <ul className="fs-xs muted" style={{ margin: '4px 0 22px', display: 'grid', gap: 6 }}>
          <li className="flex items-center gap-sm"><Icon.check size={14} /> At least 8 characters</li>
          <li className="flex items-center gap-sm"><Icon.check size={14} /> One uppercase letter & number</li>
          <li className="flex items-center gap-sm"><Icon.check size={14} /> One special character</li>
        </ul>

        <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={busy}>
          {busy ? 'Resetting…' : <>Reset password <Icon.check size={17} /></>}
        </button>

        <p className="auth__alt">Remembered it? <Link to="/login">Back to sign in</Link></p>
      </form>
    </AuthShell>
  )
}
