'use strict';

const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, '../../../Project Demo Front End.html');
const destPath = path.resolve(__dirname, '../../frontend/index.html');

let html = fs.readFileSync(destPath, 'utf8');

// 1. Fix .carousel-side-btn CSS so buttons never move with description height
const oldBtnCSS = `.carousel-side-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);`;

const newBtnCSS = `.carousel-side-btn {
      position: absolute;
      top: 180px;
      transform: none;`;

if (html.includes(oldBtnCSS)) {
  html = html.replace(oldBtnCSS, newBtnCSS);
}

// 2. Add Profile Card CSS before </style>
const profileCSS = `
    /* PROFILE VIEW STYLING */
    .profile-card {
      max-width: 580px;
      margin: 0 auto;
      padding: 28px;
      background: #ffffff;
      border: 3px solid #22252a;
      border-radius: 24px;
      box-shadow: 4px 6px 0 rgba(0,0,0,0.15);
    }
    .profile-header-box {
      display: flex;
      align-items: center;
      gap: 18px;
      border-bottom: 2px dashed #b5b2aa;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .profile-avatar-large {
      width: 72px;
      height: 72px;
      background: #fbf9f1;
      border: 2.5px solid #222;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.2rem;
    }
    .profile-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 20px;
      font-size: 1.1rem;
    }
`;

if (!html.includes('/* PROFILE VIEW STYLING */')) {
  html = html.replace('</style>', profileCSS + '\n  </style>');
}

// 3. Add "Every City (All India)" option in homeCitySelect
const oldHomeSelect = `<select id="homeCitySelect" class="sketch-input" onchange="updateCityHeadings()">
                <option value="Ahmedabad">Ahmedabad, India</option>`;

const newHomeSelect = `<select id="homeCitySelect" class="sketch-input" onchange="updateCityHeadings()">
                <option value="all">Every City (All India) 🇮🇳</option>
                <option value="Ahmedabad" selected>Ahmedabad, India</option>
                <option value="Gandhinagar">Gandhinagar, India</option>`;

if (html.includes(oldHomeSelect)) {
  html = html.replace(oldHomeSelect, newHomeSelect);
}

// 4. Update top-navbar links so user badge navigates to profile, and Demand/Scanner links have IDs
const oldNavActions = `<div id="navUserActions" class="organizer-profile hidden">
      <a class="org-dash-link" onclick="navigateTo('bookings')">My Bookings</a>
      <a class="org-dash-link" onclick="navigateTo('saved')">Saved</a>
      <a class="org-dash-link" onclick="navigateTo('demands')">Demands</a>
      <a class="org-dash-link" id="navCreateLink" onclick="navigateTo('create')">+ Create</a>
      <a class="org-dash-link" id="navScannerLink" onclick="navigateTo('scanner')" style="color:#b71540;">Scan Passes 📷</a>
      <button class="filter-pill" onclick="navigateTo('notifications')" style="padding: 4px 10px; cursor: pointer; border: 2px solid #8e8b82;" title="Notifications">
        🔔 <span id="notifBadge" style="background:#b71540; color:#fff; border-radius:999px; padding:1px 6px; font-size:0.8rem; display:none;">0</span>
      </button>
      <div class="user-badge" onclick="toggleRoleOrLogout()" title="Click to switch role or log out">`;

const newNavActions = `<div id="navUserActions" class="organizer-profile hidden">
      <a class="org-dash-link" id="navBookingsLink" onclick="navigateTo('bookings')">My Bookings</a>
      <a class="org-dash-link" id="navSavedLink" onclick="navigateTo('saved')">Saved</a>
      <a class="org-dash-link organizer-only" id="navDemandLink" onclick="navigateTo('demands')" style="display:none;">Demand Engine</a>
      <a class="org-dash-link organizer-only" id="navCreateLink" onclick="navigateTo('create')" style="display:none;">+ Create Event</a>
      <a class="org-dash-link organizer-only" id="navScannerLink" onclick="navigateTo('scanner')" style="display:none; color:#b71540;">Scan Passes 📷</a>
      <button class="filter-pill" onclick="navigateTo('notifications')" style="padding: 4px 10px; cursor: pointer; border: 2px solid #8e8b82;" title="Notifications">
        🔔 <span id="notifBadge" style="background:#b71540; color:#fff; border-radius:999px; padding:1px 6px; font-size:0.8rem; display:none;">0</span>
      </button>
      <div class="user-badge" onclick="navigateTo('profile')" title="View Your Profile" style="cursor:pointer;">`;

if (html.includes(oldNavActions)) {
  html = html.replace(oldNavActions, newNavActions);
} else {
  // Try fallback replacement for toggleRoleOrLogout
  html = html.replace(`onclick="toggleRoleOrLogout()"`, `onclick="navigateTo('profile')" title="View Your Profile"`);
}

// 5. Add Profile View Section before </main>
const profileSection = `
    <!-- =========================================================
         VIEW 12: USER PROFILE SCREEN
         ========================================================= -->
    <section id="view-profile" class="hidden">
      <div class="page-title-row">
        <a class="back-link" onclick="navigateTo('home')">← Back to Home</a>
        <h1 class="page-title">My Profile 👤</h1>
        <div></div>
      </div>

      <div class="profile-card">
        <div class="profile-header-box">
          <div class="profile-avatar-large" id="profileAvatarIcon">👤</div>
          <div>
            <h2 id="profileNameHeading" style="font-size: 1.6rem; color:#222; margin-bottom: 4px;">User Profile</h2>
            <span class="status-badge status-confirmed" id="profileRoleBadge">Attendee</span>
          </div>
        </div>

        <div class="profile-info-grid">
          <div>
            <span style="color:#666; font-size:0.95rem;">Email Address</span>
            <div id="profileEmailVal" style="font-weight:700;">user@meetior.in</div>
          </div>
          <div>
            <span style="color:#666; font-size:0.95rem;">Home City</span>
            <div id="profileCityVal" style="font-weight:700;">Ahmedabad</div>
          </div>
          <div>
            <span style="color:#666; font-size:0.95rem;">Account Role</span>
            <div id="profileRoleVal" style="font-weight:700;">Attendee</div>
          </div>
          <div>
            <span style="color:#666; font-size:0.95rem;">Member Status</span>
            <div style="font-weight:700; color:#27ae60;">Active Member ✓</div>
          </div>
        </div>

        <form onsubmit="handleUpdateProfile(event)" style="border-top: 2px dashed #b5b2aa; padding-top: 18px;">
          <h4 style="font-size: 1.25rem; margin-bottom: 12px;">Edit Profile</h4>
          <div style="margin-bottom: 10px;">
            <label class="field-label">Full Name</label>
            <input id="profileEditName" type="text" class="sketch-input" placeholder="Your name"/>
          </div>
          <div style="margin-bottom: 14px;">
            <label class="field-label">Preferred City</label>
            <select id="profileEditCity" class="sketch-input">
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Gandhinagar">Gandhinagar</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bengaluru">Bengaluru</option>
            </select>
          </div>
          <div style="display:flex; gap:12px;">
            <button type="submit" class="btn-crayon-yellow" style="flex:1;">Save Changes</button>
            <button type="button" class="btn-sketch-white" onclick="handleUserLogout()" style="color:#b71540; border-color:#b71540;">
              Log Out 🚪
            </button>
          </div>
        </form>
      </div>
    </section>
`;

if (!html.includes('id="view-profile"')) {
  html = html.replace('</main>', profileSection + '\n  </main>');
}

// Write the structural markup updates
fs.writeFileSync(destPath, html, 'utf8');
fs.writeFileSync(srcPath, html, 'utf8');
console.log('✅ HTML views, profile card, and every city option updated.');
