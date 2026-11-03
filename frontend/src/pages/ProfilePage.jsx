import React from 'react';

/**
 * ProfilePage Component
 * User Profile & Settings Page
 *
 * @param {Object} props
 * @param {Function} props.navigateTo - View navigation callback
 * @param {Object} props.currentUser - Authenticated user session object
 * @param {Function} [props.showToast] - Flash notification toast
 */
export default function ProfilePage({ navigateTo, currentUser, showToast }) {
  return (
    <>
    <section id="view-profile" className="hidden">
      <div className="page-title-row">
        <a className="back-link" onclick="navigateTo('home')">← Back to Home</a>
        <h1 className="page-title">My Profile 👤</h1>
        <div></div>
      </div>

      <div className="profile-card">
        <div className="profile-header-box">
          <div className="profile-avatar-large" id="profileAvatarIcon">👤</div>
          <div>
            <h2 id="profileNameHeading" style={{"fontSize":"1.6rem","color":"#222","marginBottom":"4px"}}>User Profile</h2>
            <span className="status-badge status-confirmed" id="profileRoleBadge">Attendee</span>
          </div>
        </div>

        <div className="profile-info-grid" style={{"gridTemplateColumns":"repeat(auto-fit, minmax(180px, 1fr))"}}>
          <div>
            <span style={{"color":"#666","fontSize":"0.95rem"}}>Email Address</span>
            <div id="profileEmailVal" style={{"fontWeight":"700"}}>user@meetior.in</div>
          </div>
          <div>
            <span style={{"color":"#666","fontSize":"0.95rem"}}>Mobile Phone (WhatsApp / SMS)</span>
            <div id="profilePhoneVal" style={{"fontWeight":"700"}}>+91 9876543210</div>
          </div>
          <div>
            <span style={{"color":"#666","fontSize":"0.95rem"}}>Home City</span>
            <div id="profileCityVal" style={{"fontWeight":"700"}}>Ahmedabad</div>
          </div>
          <div>
            <span style={{"color":"#666","fontSize":"0.95rem"}}>District</span>
            <div id="profileDistrictVal" style={{"fontWeight":"700"}}>Ahmedabad</div>
          </div>
          <div>
            <span style={{"color":"#666","fontSize":"0.95rem"}}>State</span>
            <div id="profileStateVal" style={{"fontWeight":"700"}}>Gujarat</div>
          </div>
          <div>
            <span style={{"color":"#666","fontSize":"0.95rem"}}>PIN Code</span>
            <div id="profilePincodeVal" style={{"fontWeight":"700"}}>380009</div>
          </div>
          <div>
            <span style={{"color":"#666","fontSize":"0.95rem"}}>Account Role</span>
            <div id="profileRoleVal" style={{"fontWeight":"700"}}>Attendee</div>
          </div>
          <div>
            <span style={{"color":"#666","fontSize":"0.95rem"}}>Member Since</span>
            <div id="profileMemberSinceVal" style={{"fontWeight":"700"}}>October 2026</div>
          </div>
        </div>

        {/* Quick Profile Navigation Links */}
        <div style={{"display":"flex","flexWrap":"wrap","gap":"8px","margin":"16px 0","borderTop":"1.5px dashed #ccc","paddingTop":"14px","alignItems":"center"}}>
          <button type="button" className="btn-sketch-white" onclick="navigateTo('bookings')">🎟️ My Bookings & Passes</button>
          <button type="button" className="btn-sketch-white" onclick="navigateTo('saved')">📌 My Saved Events</button>
          <button type="button" className="btn-sketch-white" onclick="navigateTo('notifications')">🔔 Notifications</button>
          <button type="button" className="btn-sketch-white" onclick="handleUserLogout()" style={{"color":"#b71540","borderColor":"#b71540","marginLeft":"auto"}}>
            Log Out 🚪
          </button>
        </div>

        {/* Organizer Revenue Quick Access Banner */}
        <div id="organizerProfileRevenueBox" className="organizer-only" style={{"display":"none","margin":"20px 0","border":"2.5px solid #2e7d32","borderRadius":"14px","background":"#f0fdf4","padding":"18px","boxShadow":"3px 3px 0 #2e7d32"}}>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","flexWrap":"wrap","gap":"12px"}}>
            <div>
              <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
                <span style={{"fontSize":"1.4rem"}}>💰</span>
                <strong style={{"fontSize":"1.2rem","color":"#166534"}}>Organizer Revenue & Ticket Sales</strong>
              </div>
              <div style={{"fontSize":"0.95rem","color":"#15803d","marginTop":"3px"}}>
                Total Net Sales: <strong id="profileRevenueDisplay" style={{"color":"#1b5e20","fontSize":"1.15rem"}}>₹0.00</strong> · Paid Tickets Sold: <strong id="profileTicketsDisplay" style={{"color":"#1b5e20"}}>0</strong>
              </div>
            </div>
            <button type="button" className="btn-crayon-yellow" onclick="navigateTo('revenue')" style={{"padding":"8px 18px","fontSize":"1.02rem","fontWeight":"700","cursor":"pointer"}}>
              💰 Open Dedicated Revenue Hub →
            </button>
          </div>
        </div>

        <form onsubmit="handleUpdateProfile(event)" style={{"borderTop":"2px dashed #b5b2aa","paddingTop":"18px"}}>
          <h4 style={{"fontSize":"1.25rem","marginBottom":"12px"}}>Edit Profile</h4>
          <div style={{"marginBottom":"10px"}}>
            <label className="field-label">Full Name</label>
            <input id="profileEditName" type="text" className="sketch-input" placeholder="Your name"/>
          </div>
          <div style={{"marginBottom":"10px"}}>
            <label className="field-label">Email Address (for Pass & Ticket Delivery)</label>
            <input id="profileEditEmail" type="email" className="sketch-input" placeholder="Your email"/>
          </div>
          <div style={{"marginBottom":"10px"}}>
            <label className="field-label">Mobile Number (for SMS & WhatsApp Pass)</label>
            <div style={{"display":"flex","gap":"8px","alignItems":"center"}}>
              <span style={{"fontFamily":"var(--font-hand)","fontSize":"1.1rem","fontWeight":"700","background":"#eee","padding":"5px 10px","borderRadius":"6px","border":"1px solid #ccc"}}>🇮🇳 +91</span>
              <input id="profileEditPhone" type="tel" className="sketch-input" placeholder="10-digit mobile number" maxlength="10" style={{"flex":"1"}}/>
            </div>
          </div>
          <div style={{"marginBottom":"14px"}}>
            <label className="field-label">Enter City (e.g. Surat, Mumbai, Delhi, Ahmedabad, Pune)</label>
            <div style={{"position":"relative"}}>
              <input id="profileEditCity" type="text" className="sketch-input" placeholder="Type your city (e.g. Surat, Mumbai, Delhi, Ahmedabad)..." list="profileCitiesDatalist" autocomplete="off" style={{"width":"100%","boxSizing":"border-box"}} required />
              <datalist id="profileCitiesDatalist">
                <option value="Ahmedabad">
                <option value="Gandhinagar">
                <option value="Surat">
                <option value="Vadodara">
                <option value="Rajkot">
                <option value="Mumbai">
                <option value="Pune">
                <option value="Delhi">
                <option value="Bengaluru">
                <option value="Hyderabad">
                <option value="Chennai">
                <option value="Kolkata">
                <option value="Jaipur">
                <option value="Lucknow">
                <option value="Indore">
                <option value="Chandigarh">
              </datalist>
            </div>
            <span className="city-hint-text" style={{"fontSize":"0.82rem","color":"#666","marginTop":"4px","display":"block"}}>Type any city in India — saving updates your browsing city and discovery feeds everywhere!</span>
          </div>
          <div style={{"display":"flex","gap":"12px"}}>
            <button type="submit" className="btn-crayon-yellow" style={{"flex":"1"}}>Save Changes</button>
            <button type="button" className="btn-sketch-white" onclick="handleUserLogout()" style={{"color":"#b71540","borderColor":"#b71540"}}>
              Log Out 🚪
            </button>
          </div>
        </form>
      </div>
    </section>

    {/* =========================================================
         VIEW 13: SUPER ADMIN MANAGEMENT SYSTEM
         ========================================================= */}
    </>
  );
}
