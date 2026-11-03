import React from 'react';

/**
 * AdminLoginPage Component
 * Administrator Secure Login & MFA Verification
 *
 * @param {Object} props
 * @param {Function} props.navigateTo - View navigation callback
 * @param {Object} props.currentUser - Authenticated user session object
 * @param {Function} [props.showToast] - Flash notification toast
 */
export default function AdminLoginPage({ navigateTo, currentUser, showToast }) {
  return (
    <>
    <section id="view-admin-login" className="hidden">
      <div className="auth-header">
        <div className="auth-logo-big" onclick="navigateTo('home')">
          <svg width="130" height="44" viewBox="0 0 120 42">
            <circle cx="38" cy="21" r="13" fill="#fff" stroke="#1e90ff" stroke-width="2.5"/>
            <path d="M33 19 Q35 17 37 19 M41 19 Q43 17 45 19 M34 25 Q38 29 43 25" fill="none" stroke="#1e90ff" stroke-width="2"/>
            <circle cx="60" cy="21" r="13" fill="#fff" stroke="#82c91e" stroke-width="2.5"/>
            <path d="M55 19 Q57 17 59 19 M63 19 Q65 17 67 19 M56 25 Q60 29 65 25" fill="none" stroke="#82c91e" stroke-width="2"/>
            <circle cx="82" cy="21" r="13" fill="#fff" stroke="#fab005" stroke-width="2.5"/>
            <path d="M77 19 Q79 17 81 19 M85 19 Q87 17 89 19 M78 25 Q82 29 87 25" fill="none" stroke="#fab005" stroke-width="2"/>
          </svg>
          <div className="brand-wordmark">
            <span className="m-blue">M</span><span className="e-green">E</span><span className="e-green">E</span><span className="t-yellow">T</span><span className="i-orange">I</span><span className="o-red">O</span><span className="r-teal">R</span>
          </div>
        </div>
        <div className="auth-tagline" style={{"color":"#b71540","fontWeight":"700"}}>System Administrator Secure Portal 🛡️</div>
      </div>

      <h1 className="hero-title" style={{"fontSize":"2.35rem","marginBottom":"6px"}}>
        <span style={{"color":"#1e90ff"}}>🔐</span>
        <span>Administrator Access Control</span>
        <span style={{"color":"#1e90ff"}}>🛡️</span>
      </h1>
      <p className="auth-subtext">Restricted gateway for platform governance, attendee protection, organizer settlements, and audit monitoring.</p>

      {/* Step 1: Admin Credentials Form */}
      <form id="adminLoginForm" className="sketch-box auth-card" onsubmit="handleAdminLogin(event)" autocomplete="off">
        <div id="adminLoginAlertBox" className="hidden" style={{"marginBottom":"14px","padding":"10px 14px","borderRadius":"8px","background":"#ffebee","border":"2px solid #c62828","color":"#b71540","fontSize":"0.95rem"}}>
          <strong id="adminLoginAlertTitle">⚠️ Security Notice:</strong>
          <div id="adminLoginAlertMsg">Invalid credentials.</div>
        </div>

        <div>
          <label className="field-label">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e90ff" stroke-width="2.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
            Administrator Email <span className="req-star">*</span>
          </label>
          <input id="adminLoginEmail" type="email" className="sketch-input" placeholder="admin@meetior.in" autocomplete="username" required/>
        </div>

        <div className="form-group" style={{"marginTop":"12px"}}>
          <label className="field-label">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5a623" stroke-width="2.5"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
            Administrator Password <span className="req-star">*</span>
          </label>
          <div className="input-icon-wrap">
            <input id="adminLoginPassword" type="password" className="sketch-input" style={{"paddingLeft":"14px","paddingRight":"40px"}} placeholder="Enter administrator password" autocomplete="current-password" required/>
            <button type="button" className="eye-toggle-btn" onclick="togglePasswordField('adminLoginPassword', 'eyeIconAdminLoginPass')" title="Show / Hide Password">
              <svg id="eyeIconAdminLoginPass" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>

        <button id="adminLoginSubmitBtn" type="submit" className="btn-crayon-yellow" style={{"width":"100%","marginTop":"16px","padding":"11px","fontSize":"1.25rem","background":"linear-gradient(135deg, #1e90ff, #0960bd)","color":"#fff","borderColor":"#07478c"}}>
          Authenticate Administrator 🛡️ →
        </button>

        <div style={{"display":"flex","justifyContent":"center","gap":"8px","marginTop":"14px","flexWrap":"wrap"}}>
          <button type="button" className="demo-pill" onclick="fillAdminDemoCredentials()" style={{"background":"#e3f2fd","borderColor":"#1e90ff","color":"#0d47a1"}}>
            ⚡ Quick-Fill Super Admin (admin@meetior.in)
          </button>
        </div>

        <div style={{"fontFamily":"var(--font-hand)","fontSize":"0.92rem","color":"#666","textAlign":"center","marginTop":"10px"}}>
          🔒 <strong>Protection:</strong> Sliding-window rate limiter active (5 attempts / 15-minute temporary lockout).
        </div>

        <div className="auth-divider-footer" style={{"marginTop":"16px"}}>
          <a onclick="navigateTo('home')">← Return to Public Meetior</a>
        </div>
      </form>

      {/* Step 2: MFA / TOTP Verification Form (Shown if 2FA enabled) */}
      <form id="adminMfaForm" className="sketch-box auth-card hidden" onsubmit="handleAdminMfa(event)" autocomplete="off">
        <div style={{"textAlign":"center","marginBottom":"16px"}}>
          <div style={{"fontSize":"2.8rem","marginBottom":"6px"}}>📱🔐</div>
          <h2 style={{"fontSize":"1.6rem","color":"#1e90ff","marginBottom":"6px"}}>Two-Factor Authentication</h2>
          <p style={{"fontSize":"0.95rem","color":"#555"}}>Enter the 6-digit one-time code from your authenticator app (Google Authenticator, Microsoft Authenticator, or Authy):</p>
        </div>

        <div id="adminMfaAlertBox" className="hidden" style={{"marginBottom":"14px","padding":"10px 14px","borderRadius":"8px","background":"#ffebee","border":"2px solid #c62828","color":"#b71540","fontSize":"0.95rem"}}>
          Invalid verification code. Please check your app and try again.
        </div>

        <div>
          <label className="field-label" style={{"textAlign":"center","display":"block"}}>
            6-Digit Authenticator Code
          </label>
          <input id="adminMfaCodeInput" type="text" maxlength="6" className="sketch-input" placeholder="123456" style={{"textAlign":"center","fontSize":"2rem","letterSpacing":"8px","fontFamily":"monospace","fontWeight":"700","maxWidth":"240px","margin":"0 auto","display":"block"}} autofocus required/>
        </div>

        <button id="adminMfaSubmitBtn" type="submit" className="btn-crayon-yellow" style={{"width":"100%","marginTop":"20px","padding":"11px","fontSize":"1.25rem","background":"linear-gradient(135deg, #2e7d32, #1b5e20)","color":"#fff","borderColor":"#0e3813"}}>
          Verify & Access Dashboard 🚀
        </button>

        <div style={{"textAlign":"center","marginTop":"14px"}}>
          <button type="button" className="btn-sketch-white" onclick="cancelAdminMfaStep()" style={{"padding":"6px 16px","fontSize":"0.92rem"}}>
            ← Back to Credentials
          </button>
        </div>
      </form>
    </section>

  
    {/* =========================================================
         VIEW 7: MY BOOKINGS & DIGITAL EVENT PASSES
         ========================================================= */}
    </>
  );
}
