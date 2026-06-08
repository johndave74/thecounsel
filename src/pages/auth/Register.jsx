import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from './AuthShell'
import Icon from '../../components/Icons'
import { useStore } from '../../store'

export default function Register() {
  const nav = useNavigate()
  const { signUp, toast } = useStore()
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [f, setF] = useState({ first: '', last: '', email: '', role: 'Lawyer', password: '' })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      await signUp({
        name: `${f.first} ${f.last}`.trim(),
        email: f.email.trim(),
        role: f.role,
        password: f.password,
      })
      nav('/app')
    } catch (err) {
      toast(err.message || 'Could not create account', 'warn')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <form className="auth__form" onSubmit={submit}>
        <div className="auth__form-head">
          <span className="eyebrow">Join the firm</span>
          <h2>Create your account</h2>
          <p>Set up your workspace profile in a moment.</p>
        </div>

        <div className="field-row">
          <div className="field">
            <label>First name</label>
            <input className="input" placeholder="Adaeze" value={f.first} onChange={set('first')} required />
          </div>
          <div className="field">
            <label>Last name</label>
            <input className="input" placeholder="Okonkwo" value={f.last} onChange={set('last')} required />
          </div>
        </div>

        <div className="field">
          <label>Work email</label>
          <div className="field__wrap">
            <Icon.mail size={17} />
            <input className="input" type="email" placeholder="you@firm.law" value={f.email} onChange={set('email')} required />
          </div>
        </div>

        <div className="field">
          <label>Role</label>
          <select className="input" value={f.role} onChange={set('role')}>
            <option>Lawyer</option>
            <option>Staff</option>
          </select>
        </div>

        <div className="field">
          <label>Password</label>
          <div className="field__wrap">
            <Icon.lock size={17} />
            <input className="input" type={show ? 'text' : 'password'} placeholder="At least 8 characters" value={f.password} onChange={set('password')} minLength={8} required />
            <button type="button" className="field__reveal" onClick={() => setShow((s) => !s)} aria-label="Toggle password">
              {show ? <Icon.eyeOff size={17} /> : <Icon.eye size={17} />}
            </button>
          </div>
        </div>

        <label className="check" style={{ marginBottom: 20, fontSize: 13 }}>
          <input type="checkbox" required /> I agree to the Terms of Service & Privacy Policy
        </label>

        <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : <>Create account <Icon.arrowRight size={17} /></>}
        </button>

        <p className="auth__alt">Already have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </AuthShell>
  )
}
