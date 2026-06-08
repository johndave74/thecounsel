import Icon from '../../components/Icons'

// Shared dramatic split-screen wrapper for all auth pages.
export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <div className="auth__brand">
        <div className="auth__logo">
          <span className="auth__logo-mark"><Icon.scale size={24} /></span>
          <div className="auth__logo-text">The Counsel<small>Est. 2009 · San Francisco</small></div>
        </div>

        <div className="auth__pitch">
          <h1>Where great cases<br />find their <em>order.</em></h1>
          <p>
            A single, refined workspace for the modern law firm — cases, clients,
            hearings, deadlines and documents, brought into one quiet command of practice.
          </p>
        </div>

        <div className="auth__stats">
          <div><span>1,240+</span><small>Matters managed</small></div>
          <div><span>94%</span><small>On-time filings</small></div>
          <div><span>38</span><small>Practice areas</small></div>
        </div>
      </div>

      <div className="auth__panel">{children}</div>
    </div>
  )
}
