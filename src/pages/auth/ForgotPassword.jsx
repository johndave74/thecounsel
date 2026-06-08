import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthShell from './AuthShell'
import Icon from '../../components/Icons'
import api from '../../api/client'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [resetToken, setResetToken] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const res = await api.auth.forgotPassword(email.trim())
      // In non-production the API returns the token directly so the flow is usable.
      setResetToken(res?.resetToken || null)
    } catch {
      /* never reveal whether the email exists */
    } finally {
      setSent(true)
      setBusy(false)
    }
  }

  const resetHref = resetToken ? `/reset-password?token=${encodeURIComponent(resetToken)}` : '/reset-password'

  return (
    <AuthShell>
      <form className="auth__form" onSubmit={submit}>
        <Link to="/login" className="btn btn--quiet btn--sm" style={{ marginLeft: -12, marginBottom: 16 }}>
          <Icon.arrowLeft size={16} /> Back to sign in
        </Link>

        {!sent ? (
          <>
            <div className="auth__form-head">
              <span className="eyebrow">Account recovery</span>
              <h2>Forgot your password?</h2>
              <p>Enter your email and we’ll send a link to reset it.</p>
            </div>

            <div className="field">
              <label>Email address</label>
              <div className="field__wrap">
                <Icon.mail size={17} />
                <input className="input" type="email" placeholder="you@firm.law" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={busy}>
              {busy ? 'Sending…' : <>Send reset link <Icon.send size={16} /></>}
            </button>
          </>
        ) : (
          <>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--st-won-bg)', color: 'var(--st-won)', display: 'grid', placeItems: 'center', marginBottom: 18 }}>
              <Icon.mail size={26} />
            </div>
            <div className="auth__form-head">
              <h2>Check your inbox</h2>
              <p>If an account exists for that address, a password reset link is on its way. The link expires in 30 minutes.</p>
            </div>
            <Link to={resetHref} className="btn btn--primary btn--block btn--lg">
              Open reset link (demo) <Icon.arrowRight size={16} />
            </Link>
            <button className="btn btn--ghost btn--block" style={{ marginTop: 10 }} onClick={() => setSent(false)}>
              Use a different email
            </button>
          </>
        )}

        <div className="auth__note">
          <Icon.shield size={16} />
          <span>Demo interface — no email is actually sent. Use the button above to preview the reset screen.</span>
        </div>
      </form>
    </AuthShell>
  )
}
