import React from 'react';

/**
 * LoginPage Component
 * User Login Page
 *
 * @param {Object} props
 * @param {Function} props.navigateTo - View navigation callback
 * @param {Object} props.currentUser - Authenticated user session object
 * @param {Function} [props.showToast] - Flash notification toast
 */
export default function LoginPage({ navigateTo, currentUser, showToast }) {
  return (
    <>
    <section id="view-login" className="hidden">
      <div className="auth-header">
        <div className="auth-logo-big" onclick="navigateTo('home')">
          <svg width="130" height="44" viewBox="0 0 120 42">
            <circle cx="38" cy="21" r="13" fill="#fff" stroke="#228be6" stroke-width="2.5"/>
            <path d="M33 19 Q35 17 37 19 M41 19 Q43 17 45 19 M34 25 Q38 29 43 25" fill="none" stroke="#228be6" stroke-width="2"/>
            <circle cx="60" cy="21" r="13" fill="#fff" stroke="#82c91e" stroke-width="2.5"/>
            <path d="M55 19 Q57 17 59 19 M63 19 Q65 17 67 19 M56 25 Q60 29 65 25" fill="none" stroke="#82c91e" stroke-width="2"/>
            <circle cx="82" cy="21" r="13" fill="#fff" stroke="#fab005" stroke-width="2.5"/>
            <path d="M77 19 Q79 17 81 19 M85 19 Q87 17 89 19 M78 25 Q82 29 87 25" fill="none" stroke="#fab005" stroke-width="2"/>
          </svg>
          <div className="brand-wordmark">
            <span className="m-blue">M</span><span className="e-green">E</span><span className="e-green">E</span><span className="t-yellow">T</span><span className="i-orange">I</span><span className="o-red">O</span><span className="r-teal">R</span>
          </div>
        </div>
        <div className="auth-tagline">Find what's happening near you!!</div>
      </div>

      <h1 className="hero-title" style={{"fontSize":"2.35rem","marginBottom":"6px"}}>
        <span style={{"color":"#f5b700"}}>☀️</span>
        <span>Let's Explore Together!</span>
        <span style={{"color":"#f5b700"}}>☀️</span>
      </h1>
      <p className="auth-subtext">Log in to find events near you and connect with your community.</p>

      <form className="sketch-box auth-card" onsubmit="handleLoginSubmit(event)" autocomplete="off">
        <div>
          <label className="field-label">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#78b833" stroke-width="2.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
            Email or Mobile Phone <span className="req-star">*</span>
          </label>
          <input id="loginEmail" type="text" className="sketch-input" placeholder="Enter email or 10-digit mobile (e.g. 9123456780)" autocomplete="username" required/>
        </div>

        <div className="form-group">
          <label className="field-label">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5a623" stroke-width="2.5"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
            Password <span className="req-star">*</span>
          </label>
          <div className="input-icon-wrap">
            <input id="loginPassword" type="password" className="sketch-input" style={{"paddingLeft":"14px","paddingRight":"40px"}} placeholder="Enter your password" autocomplete="current-password" required/>
            <button type="button" className="eye-toggle-btn" onclick="togglePasswordField('loginPassword', 'eyeIconLoginPass')" title="Show / Hide Password">
              <svg id="eyeIconLoginPass" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>

        <div style={{"textAlign":"right","marginTop":"6px"}}>
          <a style={{"color":"#333","fontSize":"0.96rem","textDecoration":"underline","cursor":"pointer"}} onclick="showToast('Password reset link sent to your email!')">Forgot password?</a>
        </div>

        <button type="submit" className="btn-crayon-yellow" style={{"width":"100%","marginTop":"12px","padding":"10px","fontSize":"1.25rem"}}>
          Log In →
        </button>

        <div style={{"display":"flex","justifyContent":"center","gap":"8px","marginTop":"10px","flexWrap":"wrap"}}>
          <button type="button" className="demo-pill" onclick="quickLogin('Organizer', 'Organizer')">Demo Organizer (+91 9876543210)</button>
          <button type="button" className="demo-pill" onclick="quickLogin('Nevil', 'Attendee')">Demo Attendee: Nevil Sagpariya (+91 9123456780)</button>
        </div>
        <div style={{"fontFamily":"var(--font-hand)","fontSize":"0.96rem","color":"#666","textAlign":"center","marginTop":"6px"}}>
          💡 <em>Demo Phone Login:</em> Use mobile <strong>9876543210</strong> (Organizer) or <strong>9123456780</strong> (Nevil Sagpariya) (Password: <code>Meetior2026</code>)
        </div>

        <div className="auth-divider-footer">
          Don't have an account? <a onclick="navigateTo('register')">Sign up</a>
        </div>
      </form>
    </section>

    {/* =========================================================
         VIEW 6b: ADMINISTRATOR SECURE ACCESS CONTROL & MFA
         ========================================================= */}
    </>
  );
}
