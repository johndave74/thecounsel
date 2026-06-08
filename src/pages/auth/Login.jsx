import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from './AuthShell'
import Icon from '../../components/Icons'
import { useStore } from '../../store'

export default function Login() {
  const nav = useNavigate()
  const { signIn, toast } = useStore()
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('a.okonkwo@counsel.law')
  const [password, setPassword] = useState('demo1234')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      await signIn(email.trim(), password)
      nav('/app')
    } catch (err) {
      toast(err.message || 'Invalid email or password', 'warn')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <form className="auth__form" onSubmit={submit}>
        <div className="auth__form-head">
          <span className="eyebrow">Welcome back</span>
          <h2>Sign in to your practice</h2>
          <p>Enter your credentials to access the case workspace.</p>
        </div>

        <div className="field">
          <label>Email address</label>
          <div className="field__wrap">
            <Icon.mail size={17} />
            <input className="input" type="email" placeholder="you@firm.law" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        <div className="field">
          <label>Password</label>
          <div className="field__wrap">
            <Icon.lock size={17} />
            <input className="input" type={show ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="field__reveal" onClick={() => setShow((s) => !s)} aria-label="Toggle password">
              {show ? <Icon.eyeOff size={17} /> : <Icon.eye size={17} />}
            </button>
          </div>
        </div>

        <div className="form-aux">
          <label className="check"><input type="checkbox" defaultChecked /> Remember me</label>
          <Link to="/forgot-password" className="link-brass">Forgot password?</Link>
        </div>

        <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : <>Sign in <Icon.arrowRight size={17} /></>}
        </button>

        <div className="auth__note">
          <Icon.shield size={16} />
          <span>Demo credentials are prefilled (a.okonkwo@counsel.law / demo1234). Authentication runs against the live API.</span>
        </div>

        <p className="auth__alt">New to the firm? <Link to="/register">Create an account</Link></p>
      </form>
    </AuthShell>
  )
}
