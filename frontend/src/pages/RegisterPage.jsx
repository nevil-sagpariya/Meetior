import React from 'react';

/**
 * RegisterPage Component
 * User Registration Page
 *
 * @param {Object} props
 * @param {Function} props.navigateTo - View navigation callback
 * @param {Object} props.currentUser - Authenticated user session object
 * @param {Function} [props.showToast] - Flash notification toast
 */
export default function RegisterPage({ navigateTo, currentUser, showToast }) {
  return (
    <>
    <section id="view-register" className="hidden">
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
      <p className="auth-subtext">Join Meetior to find events near you and connect with your community.</p>

      <form className="sketch-box auth-card" onsubmit="submitRegisterForm(event)" novalidate autocomplete="off">
        <div className="form-row-2" style={{"marginTop":"0"}}>
          {/* Full Name (Live Validation) */}
          <div>
            <label className="field-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1b9aaa" stroke-width="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
              Full Name <span className="req-star">*</span>
            </label>
            <input id="regName" type="text" className="sketch-input" placeholder="Enter your full name" value="" autocomplete="off" oninput="validateNameLive()"/>
            <div id="errName" className="error-msg">
              <span>❗</span>
              <span>This field is required. Must be 2-100 characters (letters & spaces only).</span>
            </div>
          </div>

          {/* Email (Live Validation) */}
          <div>
            <label className="field-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#78b833" stroke-width="2.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
              Email <span className="req-star">*</span>
            </label>
            <input id="regEmail" type="email" className="sketch-input" placeholder="Enter your email" value="" autocomplete="off" oninput="validateEmailLive()"/>
            <div id="errEmail" className="error-msg">
              <span>❗</span>
              <span>Enter a valid, unregistered email address.</span>
            </div>
          </div>
        </div>

        {/* Mobile Phone Number (Live Validation for Pass Delivery) */}
        <div style={{"marginTop":"10px"}}>
          <label className="field-label">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e67e22" stroke-width="2.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            Mobile Number (for SMS & WhatsApp Ticket Pass Delivery) <span className="req-star">*</span>
          </label>
          <div style={{"display":"flex","gap":"8px","alignItems":"center"}}>
            <span style={{"fontFamily":"var(--font-hand)","fontSize":"1.15rem","fontWeight":"700","background":"#eee","padding":"6px 12px","borderRadius":"8px","border":"1.5px solid #bbb"}}>🇮🇳 +91</span>
            <input id="regPhone" type="tel" className="sketch-input" placeholder="10-digit mobile number (e.g. 9876543210)" maxlength="10" autocomplete="off" oninput="validatePhoneLive()" style={{"flex":"1"}}/>
          </div>
          <div id="errPhone" className="error-msg">
            <span>❗</span>
            <span>Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).</span>
          </div>
        </div>

        <div className="form-row-2">
          {/* Password (Live Validation + Working Eye Button) */}
          <div>
            <label className="field-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5a623" stroke-width="2.5"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
              Password <span className="req-star">*</span>
            </label>
            <div className="input-icon-wrap">
              <input id="regPass" type="password" className="sketch-input" style={{"paddingLeft":"12px","paddingRight":"40px"}} value="" placeholder="Enter strong password (e.g. Meetior2026)" autocomplete="new-password" oninput="validatePasswordLive()"/>
              <button type="button" className="eye-toggle-btn" onclick="togglePasswordField('regPass', 'eyeIconRegPass')" title="Show / Hide Password">
                <svg id="eyeIconRegPass" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <div id="errPass" className="error-msg">
              <span>❗</span>
              <span>Password must be at least 8 characters, with an uppercase letter, a lowercase letter, and a digit.</span>
            </div>
          </div>

          {/* Confirm Password (Live Validation + Working Eye Button) */}
          <div>
            <label className="field-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1b9aaa" stroke-width="2.5"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
              Confirm Password <span className="req-star">*</span>
            </label>
            <div className="input-icon-wrap">
              <input id="regConfirm" type="password" className="sketch-input" style={{"paddingLeft":"12px","paddingRight":"40px"}} value="" placeholder="Re-enter your password" autocomplete="new-password" oninput="validateConfirmLive()"/>
              <button type="button" className="eye-toggle-btn" onclick="togglePasswordField('regConfirm', 'eyeIconRegConfirm')" title="Show / Hide Confirm Password">
                <svg id="eyeIconRegConfirm" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
            <div id="errConfirm" className="error-msg">
              <span>❗</span>
              <span>Does not match Password.</span>
            </div>
          </div>
        </div>

        <div className="form-row-2">
          {/* Role (Live Validation on click) */}
          <div>
            <label className="field-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#78b833" stroke-width="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
              Role <span className="req-star">*</span>
            </label>
            <div className="role-cards-grid">
              <div id="roleCardAttendee" className="role-option-card selected-valid" onclick="selectRegRole('Attendee')">
                <div className="role-radio"></div>
                <div>👤</div>
                <strong>Attendee</strong>
                <span>Browse events and RSVP</span>
              </div>
              <div id="roleCardOrganizer" className="role-option-card" onclick="selectRegRole('Organizer')">
                <div className="role-radio"></div>
                <div>🗓️</div>
                <strong>Organizer</strong>
                <span>Create and manage events</span>
              </div>
            </div>
            <div id="errRole" className="error-msg" style={{"color":"#9c6500"}}>
              <span>⚠️</span>
              <span>A role must be selected.</span>
            </div>
          </div>

          {/* All-India Location Details: PIN Code + Auto Lookup + State + District + City */}
          <div style={{"gridColumn":"1 / -1","marginTop":"6px"}}>
            <div style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"14px"}}>
              <div>
                <label className="field-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5a623" stroke-width="2.5"><path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>
                  PIN Code (Auto-fills location)
                </label>
                <div className="input-icon-wrap">
                  <span className="left-icon">📮</span>
                  <input id="regPincode" type="text" className="sketch-input" maxlength="6" placeholder="e.g. 395007, 382007, 110001" oninput="handleRegPincodeLookup(this.value)"/>
                </div>
                <div id="regPincodeNote" className="helper-note" style={{"color":"#666","fontSize":"0.82rem"}}>Enter 6-digit PIN code to auto-detect State, District & City</div>
                <div id="pincodeSuggestionsBox" className="pincode-suggestions hidden" style={{"background":"#fff","border":"1.5px solid #222","borderRadius":"8px","padding":"6px 10px","marginTop":"4px","fontSize":"0.85rem"}}></div>
              </div>

              <div>
                <label className="field-label">State <span className="req-star">*</span></label>
                <select id="regState" className="sketch-input" onchange="handleRegStateChange(this.value)">
                  <option value="Gujarat" selected>Gujarat</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi (NCT)</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Goa">Goa</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Assam">Assam</option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Ladakh">Ladakh</option>
                  <option value="Puducherry">Puducherry</option>
                  <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                  <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                  <option value="Lakshadweep">Lakshadweep</option>
                </select>
              </div>
            </div>

            {/* Hidden District input to preserve backend model compatibility without cluttering registration UI */}
            <input type="hidden" id="regDistrict" value="Ahmedabad"/>

            <div style={{"marginTop":"10px"}}>
              <label className="field-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5a623" stroke-width="2.5"><path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>
                City / Town <span className="req-star">*</span>
              </label>
              <input id="regCityInput" type="text" className="sketch-input" placeholder="Type your city (e.g. Pune, Delhi, Mumbai, Surat, Jaipur)" value="Ahmedabad" oninput="handleRegCityLive(this.value)" required/>
              <div className="helper-note" style={{"color":"#666","fontSize":"0.82rem","marginTop":"4px"}}>
                💡 Freedom to write any city in India — Meetior will automatically suggest events in and near your location!
              </div>
              <div id="errCity" className="error-msg">
                <span>❗</span>
                <span>Please enter your city name (at least 2 characters).</span>
              </div>
            </div>

            <div style={{"marginTop":"10px","display":"flex","gap":"8px","flexWrap":"wrap"}}>
              <button type="button" className="demo-pill" onclick="fillValidRegistration()">✨ Auto-Fill Valid Data (Includes Phone +91 9876543210)</button>
              <button type="button" className="demo-pill" onclick="showMockupErrorState()">🔄 Reset to Image Error State</button>
            </div>
          </div>
        </div>

        <div style={{"margin":"14px 0 6px","padding":"10px 14px","background":"#f0fdf4","border":"1.5px dashed #4ade80","borderRadius":"10px","fontSize":"0.95rem","color":"#166534","textAlign":"center","fontFamily":"'Patrick Hand', cursive"}}>
          📲 <strong>Direct Pass Delivery:</strong> Your confirmed digital event passes & QR entry tickets will be sent directly to your registered Email and WhatsApp/SMS mobile number!
        </div>

        <button type="submit" className="btn-crayon-yellow" style={{"width":"100%","marginTop":"8px","padding":"10px","fontSize":"1.25rem"}}>
          Create Account →
        </button>

        <div className="auth-divider-footer">
          Already have an account? <a onclick="navigateTo('login')">Log in</a>
        </div>
      </form>
    </section>

    {/* =========================================================
         VIEW 6: LOG IN SCREEN
         ========================================================= */}
    </>
  );
}
