'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePaths = [
  path.resolve(__dirname, '../../frontend/index.html'),
  path.resolve(__dirname, '../../../Project Demo Front End.html')
];

filePaths.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Add btn-city-select CSS
  if (!html.includes('.btn-city-select')) {
    const cssToAdd = `
    .btn-city-select {
      background: #fff;
      border: 2px solid var(--sketch-ink);
      border-radius: 999px;
      padding: 5px 14px;
      font-family: var(--font-hand);
      font-size: 1.15rem;
      color: var(--sketch-ink);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 2px 2px 0 rgba(0,0,0,0.15);
      transition: transform 0.15s ease;
    }
    .btn-city-select:hover {
      transform: translateY(-2px);
      background: #fffcf2;
      border-color: #f9ca24;
    }
    .city-chip-pill {
      background: #fff;
      border: 1.5px solid #222;
      border-radius: 20px;
      padding: 4px 12px;
      font-family: var(--font-hand);
      font-size: 1.02rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .city-chip-pill:hover, .city-chip-pill.active {
      background: #f9ca24;
      font-weight: 700;
      transform: scale(1.04);
    }
    .city-grid-item {
      padding: 5px 8px;
      background: #f8f6ee;
      border: 1px dashed #b5b2aa;
      border-radius: 6px;
      font-family: var(--font-hand);
      font-size: 0.98rem;
      cursor: pointer;
      text-align: center;
      transition: background 0.15s;
    }
    .city-grid-item:hover {
      background: #78b833;
      color: #fff;
      font-weight: 700;
    }
`;
    html = html.replace('/* AUTH VIEWS (REGISTER & LOGIN) */', cssToAdd + '\n    /* AUTH VIEWS (REGISTER & LOGIN) */');
  }

  // 2. Add BookMyShow-style City Button to top navbar
  if (!html.includes('id="navCityBtn"')) {
    const navCityBtnHtml = `
    <!-- BookMyShow-style Browsing City Selector -->
    <div style="display:flex; align-items:center;">
      <button id="navCityBtn" class="btn-city-select" onclick="openCityPickerModal()" title="Change Browsing City">
        <span>📍</span>
        <strong id="navCurrentCityLabel">Ahmedabad</strong>
        <span style="font-size:0.75rem;">▼</span>
      </button>
    </div>
`;
    html = html.replace('<div id="navCenterTagline" class="nav-tagline">Find what\'s happening near you!!</div>',
      navCityBtnHtml + '    <div id="navCenterTagline" class="nav-tagline">Find what\'s happening near you!!</div>');
  }

  // 3. Add City Picker Modal
  if (!html.includes('id="cityPickerModal"')) {
    const cityModalHtml = `
  <!-- BOOKMYSHOW-STYLE CITY SELECTOR MODAL -->
  <div id="cityPickerModal" class="modal-backdrop hidden" onclick="if(event.target===this) closeCityPickerModal()">
    <div class="pass-card-container" style="max-width: 620px;">
      <div class="pass-ticket-header">
        <div class="brand-wordmark" style="font-size: 1.35rem;">
          <span class="m-blue">M</span><span class="e-green">E</span><span class="e-green">E</span><span class="t-yellow">T</span><span class="i-orange">I</span><span class="o-red">O</span><span class="r-teal">R</span>
          <span style="font-size: 0.95rem; color: #555; font-family: var(--font-hand); margin-left: 6px;">SELECT BROWSING CITY</span>
        </div>
        <button onclick="closeCityPickerModal()" style="background:none; border:none; font-size:1.6rem; cursor:pointer; line-height:1;">✕</button>
      </div>

      <div style="margin: 12px 0 14px;">
        <input id="citySearchInput" type="text" class="sketch-input" placeholder="🔍 Search city, district or state..." oninput="filterCityModalList(this.value)"/>
      </div>

      <div style="margin-bottom: 12px;">
        <span style="font-family: var(--font-hand); font-weight:700; font-size:1.05rem; color:#444;">Popular Cities:</span>
        <div id="popularCitiesList" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;"></div>
      </div>

      <div style="border-top: 1.5px dashed #ccc; padding-top: 10px;">
        <span style="font-family: var(--font-hand); font-weight:700; font-size:1.05rem; color:#444;">All Indian Cities & Towns:</span>
        <div id="allCitiesGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap:6px; max-height:200px; overflow-y:auto; margin-top:8px; padding-right:4px;"></div>
      </div>

      <div style="text-align: right; margin-top: 14px;">
        <button class="btn-sketch-white" onclick="closeCityPickerModal()" style="padding: 5px 16px;">Close</button>
      </div>
    </div>
  </div>\n`;
    html = html.replace('<div id="passModal"', cityModalHtml + '  <div id="passModal"');
  }

  // 4. Update Signup Form to include PIN Code, State, District, City
  const oldRegCityBlockRegex = /<div>\s*<label class="field-label">[\s\S]*?City[\s\S]*?<\/div>\s*<\/div>\s*<div style="display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap;">/;
  const newRegLocationFields = `<!-- Location Hierarchy (PIN Code Lookup + Cascading State -> District -> City) -->
        <div class="form-row-2">
          <!-- PIN Code with Instant Auto-Suggest -->
          <div>
            <label class="field-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e67e22" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              PIN Code <span class="req-star">*</span>
              <span id="pincodeStatus" style="font-size:0.85rem; font-weight:normal; color:#78b833; margin-left:6px;"></span>
            </label>
            <div class="input-icon-wrap">
              <input id="regPincode" type="text" class="sketch-input" maxlength="6" placeholder="Enter 6-digit PIN (e.g. 382007, 395007, 400058)" oninput="handlePincodeInput(this.value)"/>
            </div>
            <div id="pincodeSuggestionsBox" style="display:none; margin-top:4px; font-size:0.92rem; background:#fffcf2; border:1.5px dashed #f9ca24; padding:6px 10px; border-radius:8px;"></div>
          </div>

          <!-- State (Cascading Dropdown) -->
          <div>
            <label class="field-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2980b9" stroke-width="2.5"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
              State / UT <span class="req-star">*</span>
            </label>
            <select id="regState" class="sketch-input" onchange="handleRegStateChange(this.value)">
              <option value="">Select State</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <!-- District (Cascading Dropdown) -->
          <div>
            <label class="field-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8e44ad" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              District <span class="req-star">*</span>
            </label>
            <select id="regDistrict" class="sketch-input" onchange="handleRegDistrictChange(this.value)">
              <option value="">Select District</option>
            </select>
          </div>

          <!-- City / Town / Locality -->
          <div>
            <label class="field-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2.5"><path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>
              City / Town <span class="req-star">*</span>
            </label>
            <input id="regCityInput" list="regCityDatalist" type="text" class="sketch-input" placeholder="Select or type city" oninput="validateCityLive()"/>
            <datalist id="regCityDatalist"></datalist>
            <div id="errCity" class="error-msg visible">
              <span>❗</span>
              <span>Please specify your home city.</span>
            </div>
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap;">`;

  if (oldRegCityBlockRegex.test(html)) {
    html = html.replace(oldRegCityBlockRegex, newRegLocationFields);
  }

  // 5. Update Profile View with PIN code, State, District, Member Since
  if (!html.includes('id="profilePincodeVal"')) {
    const oldProfileInfoGrid = `<div class="profile-info-grid">
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
        </div>`;

    const newProfileInfoGrid = `<div class="profile-info-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
          <div>
            <span style="color:#666; font-size:0.95rem;">Email Address</span>
            <div id="profileEmailVal" style="font-weight:700;">user@meetior.in</div>
          </div>
          <div>
            <span style="color:#666; font-size:0.95rem;">Home City</span>
            <div id="profileCityVal" style="font-weight:700;">Ahmedabad</div>
          </div>
          <div>
            <span style="color:#666; font-size:0.95rem;">District</span>
            <div id="profileDistrictVal" style="font-weight:700;">Ahmedabad</div>
          </div>
          <div>
            <span style="color:#666; font-size:0.95rem;">State</span>
            <div id="profileStateVal" style="font-weight:700;">Gujarat</div>
          </div>
          <div>
            <span style="color:#666; font-size:0.95rem;">PIN Code</span>
            <div id="profilePincodeVal" style="font-weight:700;">380009</div>
          </div>
          <div>
            <span style="color:#666; font-size:0.95rem;">Member Since</span>
            <div id="profileMemberSinceVal" style="font-weight:700;">October 2026</div>
          </div>
        </div>

        <!-- Quick Profile Navigation Links -->
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin: 16px 0; border-top:1.5px dashed #ccc; padding-top:14px;">
          <button type="button" class="btn-sketch-white" onclick="navigateTo('bookings')">🎟️ My Bookings & Passes</button>
          <button type="button" class="btn-sketch-white" onclick="navigateTo('saved')">📌 My Saved Events</button>
          <button type="button" class="btn-sketch-white" onclick="navigateTo('notifications')">🔔 Notifications</button>
        </div>`;

    if (html.includes(oldProfileInfoGrid)) {
      html = html.replace(oldProfileInfoGrid, newProfileInfoGrid);
    }
  }

  // 6. Update Create Event form to support Venue City, District, State, PIN code, and End Time
  if (!html.includes('id="ceCityInput"')) {
    const oldCeFormLoc = `<div class="form-group">
          <label class="field-label">Location <span class="req-star">*</span></label>
          <div class="input-icon-wrap">
            <span class="left-icon">📍</span>
            <input id="ceLocation" type="text" class="sketch-input" placeholder="Enter venue location (up to 255 characters)" maxlength="255"/>
          </div>
        </div>`;

    const newCeFormLoc = `<div class="form-group">
          <label class="field-label">Venue Name & Address <span class="req-star">*</span></label>
          <div class="input-icon-wrap">
            <span class="left-icon">📍</span>
            <input id="ceLocation" type="text" class="sketch-input" placeholder="e.g. Surat International Exhibition Centre, Sarsana" maxlength="255" required/>
          </div>
        </div>

        <div class="form-row-2">
          <div>
            <label class="field-label">Venue PIN Code</label>
            <input id="cePincode" type="text" class="sketch-input" maxlength="6" placeholder="e.g. 395007" oninput="handleCePincode(this.value)"/>
          </div>
          <div>
            <label class="field-label">Venue State <span class="req-star">*</span></label>
            <select id="ceStateSelect" class="sketch-input" onchange="handleCeStateChange(this.value)">
              <option value="Gujarat" selected>Gujarat</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Delhi">Delhi</option>
              <option value="Telangana">Telangana</option>
              <option value="Rajasthan">Rajasthan</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div>
            <label class="field-label">Venue District <span class="req-star">*</span></label>
            <input id="ceDistrictInput" type="text" class="sketch-input" placeholder="e.g. Surat, Gandhinagar, Mumbai" value="Surat"/>
          </div>
          <div>
            <label class="field-label">Venue City / Town <span class="req-star">*</span></label>
            <input id="ceCityInput" type="text" class="sketch-input" placeholder="e.g. Surat, Koba, Mumbai" value="Surat" required/>
          </div>
        </div>`;

    if (html.includes(oldCeFormLoc)) {
      html = html.replace(oldCeFormLoc, newCeFormLoc);
    }
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ Updated Markup in: ${filePath}`);
});
