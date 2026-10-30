'use strict';

const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, '../../../Project Demo Front End.html');
const destPath = path.resolve(__dirname, '../../frontend/index.html');

console.log('srcPath:', srcPath);
console.log('destPath:', destPath);

let html = fs.readFileSync(srcPath, 'utf8');

// 1. Additional CSS to append before </style>
const additionalCSS = `
    /* =========================================================================
       NEW FULL-STACK MEETIOR STYLES (MATCHING CRAYON & SKETCHBOOK THEME)
       ========================================================================= */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(34, 37, 42, 0.65);
      backdrop-filter: blur(2px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .modal-backdrop.hidden { display: none !important; }

    .pass-card-container {
      background: #ffffff;
      border: 3px solid #22252a;
      border-radius: 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18), 4px 6px 0 #fab005;
      max-width: 500px;
      width: 100%;
      position: relative;
      overflow: hidden;
      padding: 24px;
    }

    .pass-ticket-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2.5px dashed #b5b2aa;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }

    .pass-tear-divider {
      position: relative;
      border-top: 3px dashed #8e8b82;
      margin: 18px 0;
    }

    .pass-tear-divider::before, .pass-tear-divider::after {
      content: '';
      position: absolute;
      top: -12px;
      width: 22px;
      height: 22px;
      background: var(--bg-paper);
      border: 2.5px solid #22252a;
      border-radius: 50%;
    }
    .pass-tear-divider::before { left: -36px; }
    .pass-tear-divider::after { right: -36px; }

    .qr-frame {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #fafafa;
      border: 2px solid #333;
      border-radius: 16px;
      padding: 14px;
      margin: 14px auto;
      max-width: 220px;
    }

    .qr-frame img {
      width: 170px;
      height: 170px;
      display: block;
    }

    .status-badge {
      display: inline-block;
      padding: 3px 12px;
      border-radius: 999px;
      font-size: 0.95rem;
      font-weight: 700;
      border: 1.5px solid currentColor;
    }
    .status-confirmed, .status-valid { color: #2b82bf; background: #e8f4fd; }
    .status-completed, .status-used { color: #5b9e2d; background: #f0f9eb; }
    .status-cancelled { color: #b71540; background: #fdf0f2; }
    .status-pending { color: #f5a623; background: #fff8e8; }

    .table-sketch {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-top: 12px;
      font-size: 1.05rem;
    }
    .table-sketch th {
      background: #f4f1e6;
      border-bottom: 2px solid #222;
      padding: 10px;
      text-align: left;
    }
    .table-sketch td {
      border-bottom: 1.5px solid #d5d2c8;
      padding: 10px;
    }

    .scanner-viewport {
      width: 100%;
      max-width: 440px;
      height: 260px;
      background: #111;
      border: 3px solid #f9ca24;
      border-radius: 18px;
      margin: 12px auto;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .scanner-target-reticle {
      position: absolute;
      width: 160px;
      height: 160px;
      border: 3px dashed #f9ca24;
      border-radius: 12px;
      animation: pulseReticle 2s infinite ease-in-out;
      pointer-events: none;
    }
    @keyframes pulseReticle {
      0% { transform: scale(0.96); opacity: 0.8; }
      50% { transform: scale(1.04); opacity: 1; }
      100% { transform: scale(0.96); opacity: 0.8; }
    }

    .scan-result-card {
      padding: 16px;
      border-radius: 14px;
      margin-top: 12px;
      font-size: 1.25rem;
      font-weight: 700;
      text-align: center;
      border: 2px solid;
    }
    .scan-result-success { background: #eafaf1; color: #27ae60; border-color: #2ecc71; }
    .scan-result-duplicate { background: #fef9e7; color: #f39c12; border-color: #f1c40f; }
    .scan-result-error { background: #fdedec; color: #c0392b; border-color: #e74c3c; }

    .demand-item-box {
      border: 2px solid #b5b2aa;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 14px;
      background: #fff;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .demand-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .notif-item {
      padding: 12px 16px;
      border-bottom: 1.5px solid #e0ddd3;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .notif-item:hover { background: #fdfaf3; }
    .notif-item.unread { background: #fffbe6; }
`;

html = html.replace('</style>', additionalCSS + '\n</style>');

// 2. Add extra top-navbar buttons in navUserActions
const oldNavUserActions = `<div id="navUserActions" class="organizer-profile hidden">
      <a class="org-dash-link" onclick="navigateTo('create')">Organize Dashboard</a>`;

const newNavUserActions = `<div id="navUserActions" class="organizer-profile hidden">
      <a class="org-dash-link" onclick="navigateTo('bookings')">My Bookings</a>
      <a class="org-dash-link" onclick="navigateTo('saved')">Saved</a>
      <a class="org-dash-link" onclick="navigateTo('demands')">Demands</a>
      <a class="org-dash-link" id="navCreateLink" onclick="navigateTo('create')">+ Create</a>
      <a class="org-dash-link" id="navScannerLink" onclick="navigateTo('scanner')" style="color:#b71540;">Scan Passes 📷</a>
      <button class="filter-pill" onclick="navigateTo('notifications')" style="padding: 4px 10px; cursor: pointer; border: 2px solid #8e8b82;" title="Notifications">
        🔔 <span id="notifBadge" style="background:#b71540; color:#fff; border-radius:999px; padding:1px 6px; font-size:0.8rem; display:none;">0</span>
      </button>`;

html = html.replace(oldNavUserActions, newNavUserActions);

// 3. Add pills 7 to 11 in Quick Screen Preview
const oldDemoSwitcherEnd = `<button class="demo-pill" id="pill-login" onclick="navigateTo('login')">6. Log In</button>
    </div>`;

const newDemoSwitcherEnd = `<button class="demo-pill" id="pill-login" onclick="navigateTo('login')">6. Log In</button>
      <button class="demo-pill" id="pill-bookings" onclick="navigateTo('bookings')">7. My Bookings</button>
      <button class="demo-pill" id="pill-saved" onclick="navigateTo('saved')">8. My Saved Events</button>
      <button class="demo-pill" id="pill-demands" onclick="navigateTo('demands')">9. Demand Engine</button>
      <button class="demo-pill" id="pill-scanner" onclick="navigateTo('scanner')">10. QR Entry Scanner</button>
      <button class="demo-pill" id="pill-notifications" onclick="navigateTo('notifications')">11. Notifications</button>
    </div>`;

html = html.replace(oldDemoSwitcherEnd, newDemoSwitcherEnd);

// 4. In Event Details, add "Register / Book Pass" button and Reviews / Second Chance trigger
const oldRsvpRow = `<div class="rsvp-buttons-row">
                <button class="btn-rsvp going" onclick="handleRsvp('Going')">Going ✓</button>
                <button class="btn-rsvp interested" onclick="handleRsvp('Interested')">Interested ⭐</button>
                <button class="btn-rsvp save" onclick="handleRsvp('Saved')">Save Event 🔖</button>
              </div>`;

const newRsvpRow = `<div class="rsvp-buttons-row" style="flex-wrap: wrap;">
                <button class="btn-crayon-yellow" id="detailBookBtn" onclick="handleEventRegistration()" style="padding: 9px 24px; font-size: 1.25rem;">
                  🎟️ Register & Get Pass
                </button>
                <button class="btn-rsvp going" onclick="handleRsvp('Going')">Going ✓</button>
                <button class="btn-rsvp interested" onclick="handleRsvp('Interested')">Interested ⭐</button>
                <button class="btn-rsvp save" onclick="handleRsvp('Saved')">Save 🔖</button>
              </div>
              <div id="detailSecondChanceBox" style="margin-top: 10px; display: none;">
                <button class="btn-sketch-white" onclick="promptSecondChance()" style="width: 100%;">
                  🔄 Request Another Session (Motion Second Chance)
                </button>
              </div>
              <div id="detailReviewsBox" style="margin-top: 18px; border-top: 2px dashed #ccc; padding-top: 12px;">
                <h4 style="font-size: 1.2rem; margin-bottom: 6px;">⭐ Verified Attendee Reviews</h4>
                <div id="reviewsList" style="font-size: 1rem; color: #444;">No reviews yet. Be the first checked-in attendee to leave one!</div>
              </div>`;

html = html.replace(oldRsvpRow, newRsvpRow);

// 5. Append Views 7, 8, 9, 10, 11 before </main>
const newSections = `
    <!-- =========================================================
         VIEW 7: MY BOOKINGS & DIGITAL EVENT PASSES
         ========================================================= -->
    <section id="view-bookings" class="hidden">
      <div class="page-title-row">
        <a class="back-link" onclick="navigateTo('browse')">← Back to Browse</a>
        <h1 class="page-title">My Bookings & Passes</h1>
        <div></div>
      </div>
      <p style="text-align:center; font-size:1.15rem; margin-bottom: 18px;">
        Here are all your confirmed event registrations and digital entry passes.
      </p>
      <div id="bookingsContainer" class="cards-grid-3"></div>
    </section>

    <!-- =========================================================
         VIEW 8: MY SAVED EVENTS
         ========================================================= -->
    <section id="view-saved" class="hidden">
      <div class="page-title-row">
        <a class="back-link" onclick="navigateTo('browse')">← Back to Browse</a>
        <h1 class="page-title">My Saved Events 🔖</h1>
        <div></div>
      </div>
      <p style="text-align:center; font-size:1.15rem; margin-bottom: 18px;">
        Events you have bookmarked for later. Don't forget to register before seats fill up!
      </p>
      <div id="savedEventsContainer" class="cards-grid-3"></div>
    </section>

    <!-- =========================================================
         VIEW 9: COMMUNITY DEMAND ENGINE
         ========================================================= -->
    <section id="view-demands" class="hidden">
      <div class="page-title-row">
        <a class="back-link" onclick="navigateTo('home')">← Back to Home</a>
        <h1 class="page-title">Community Demand Engine 💡</h1>
        <div></div>
      </div>
      <p style="text-align:center; font-size:1.15rem; margin-bottom: 20px;">
        Request events you want to see! Organizers review popular demands and bring them to life.
      </p>

      <div style="display: grid; grid-template-columns: 340px 1fr; gap: 20px;" class="form-row-2">
        <!-- Demand Form -->
        <form class="sketch-box" style="padding: 20px;" onsubmit="handleDemandSubmit(event)">
          <h3 style="margin-bottom: 12px; font-size: 1.35rem;">✨ Request an Event</h3>
          <div style="margin-bottom: 10px;">
            <label class="field-label">Event Concept <span class="req-star">*</span></label>
            <input id="demandTitle" type="text" class="sketch-input" placeholder="e.g. Weekend Watercolor Camp" required/>
          </div>
          <div style="margin-bottom: 10px;">
            <label class="field-label">Category</label>
            <select id="demandCategory" class="sketch-input">
              <option value="1">Music & Nightlife</option>
              <option value="2">Food & Festivals</option>
              <option value="3" selected>Art & Workshops</option>
              <option value="4">Heritage & History</option>
              <option value="5">Sports & Outdoors</option>
              <option value="8">Technology & Education</option>
            </select>
          </div>
          <div style="margin-bottom: 10px;">
            <label class="field-label">City <span class="req-star">*</span></label>
            <select id="demandCity" class="sketch-input" required>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Gandhinagar">Gandhinagar</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bengaluru">Bengaluru</option>
            </select>
          </div>
          <div style="margin-bottom: 10px;">
            <label class="field-label">Preferred Venue / Area</label>
            <input id="demandLocation" type="text" class="sketch-input" placeholder="e.g. Riverfront or SG Highway"/>
          </div>
          <div style="margin-bottom: 12px;">
            <label class="field-label">Why do you want this?</label>
            <textarea id="demandDesc" class="sketch-input" style="height: 75px; resize: none;" placeholder="Tell organizers what you hope to experience..."></textarea>
          </div>
          <button type="submit" class="btn-crayon-yellow" style="width: 100%; padding: 8px;">
            Submit Demand →
          </button>
        </form>

        <!-- Demands List -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="font-size: 1.4rem;">🔥 Trending Community Demands</h3>
            <button class="btn-sketch-white" onclick="loadDemands()" style="padding: 4px 12px; font-size: 0.95rem;">🔄 Refresh</button>
          </div>
          <div id="demandsListContainer"></div>
        </div>
      </div>
    </section>

    <!-- =========================================================
         VIEW 10: ORGANIZER QR ENTRY SCANNER
         ========================================================= -->
    <section id="view-scanner" class="hidden">
      <div class="page-title-row">
        <a class="back-link" onclick="navigateTo('create')">← Back to Dashboard</a>
        <h1 class="page-title">Organizer QR Ticket Scanner 📷</h1>
        <div></div>
      </div>
      <p style="text-align:center; font-size:1.15rem; margin-bottom: 16px;">
        Scan attendee QR codes to verify tickets and mark atomic attendance.
      </p>

      <div class="sketch-box" style="max-width: 650px; margin: 0 auto; padding: 22px;">
        <div style="margin-bottom: 14px;">
          <label class="field-label">Select Your Event <span class="req-star">*</span></label>
          <select id="scannerEventSelect" class="sketch-input" onchange="loadScannerAttendance()">
            <option value="">Loading your organized events...</option>
          </select>
        </div>

        <div class="scanner-viewport">
          <video id="scannerVideo" autoplay playsinline style="width:100%; height:100%; object-fit:cover;"></video>
          <div class="scanner-target-reticle"></div>
          <div id="scannerPlaceholderMsg" style="position:absolute; text-align:center; padding:12px; font-size:1.05rem;">
            📷 Camera Scanner Ready<br><small style="color:#f9ca24;">Point camera at attendee QR code</small>
          </div>
        </div>

        <div style="display: flex; gap: 8px; justify-content: center; margin-top: 10px;">
          <button class="btn-crayon-yellow" id="btnToggleCam" onclick="toggleCameraScanner()">Start Camera</button>
          <button class="btn-sketch-white" onclick="simulateScan()">🧪 Test Sample Pass</button>
        </div>

        <!-- Manual Token Verification Fallback -->
        <div style="margin-top: 16px; border-top: 1.5px dashed #ccc; padding-top: 12px;">
          <label class="field-label" style="font-size:0.95rem;">Or Enter / Paste QR Verification Token:</label>
          <div style="display:flex; gap: 8px;">
            <input id="manualTokenInput" type="text" class="sketch-input" placeholder="Paste ticket token hash here..."/>
            <button class="btn-crayon-yellow" onclick="verifyScannedToken(document.getElementById('manualTokenInput').value)">Verify</button>
          </div>
        </div>

        <div id="scanResultBox" class="scan-result-card hidden"></div>

        <!-- Attendance log -->
        <div style="margin-top: 24px;">
          <h4 style="font-size: 1.25rem; margin-bottom: 8px;">📋 Event Attendance List (<span id="attendanceCount">0</span> checked in)</h4>
          <table class="table-sketch">
            <thead>
              <tr>
                <th>Attendee</th>
                <th>Ticket No</th>
                <th>Check-in Time</th>
              </tr>
            </thead>
            <tbody id="attendanceTableBody">
              <tr><td colspan="3" style="text-align:center; color:#777;">No check-ins yet for this session.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- =========================================================
         VIEW 11: IN-APP NOTIFICATIONS & REMINDERS
         ========================================================= -->
    <section id="view-notifications" class="hidden">
      <div class="page-title-row">
        <a class="back-link" onclick="navigateTo('home')">← Back to Home</a>
        <h1 class="page-title">Notification Center 🔔</h1>
        <button class="btn-sketch-white" onclick="markAllNotificationsRead()" style="padding: 4px 14px; font-size: 0.95rem;">Mark all as read</button>
      </div>
      <p style="text-align:center; font-size:1.1rem; margin-bottom: 16px;">
        Automatic 2-day, 1-day, and 2-hour reminders, registration updates, and community responses.
      </p>
      <div class="sketch-box" style="max-width: 680px; margin: 0 auto; overflow: hidden; padding: 0;">
        <div id="notificationsList">
          <div style="padding: 24px; text-align: center; color: #666;">Loading notifications...</div>
        </div>
      </div>
    </section>
`;

html = html.replace('</main>', newSections + '\n  </main>');

// 6. Append Digital Event Pass Modal right before #toastBox
const passModalHTML = `
  <!-- DIGITAL EVENT PASS MODAL -->
  <div id="passModal" class="modal-backdrop hidden" onclick="if(event.target===this) closePassModal()">
    <div class="pass-card-container">
      <div class="pass-ticket-header">
        <div class="brand-wordmark" style="font-size: 1.35rem;">
          <span class="m-blue">M</span><span class="e-green">E</span><span class="e-green">E</span><span class="t-yellow">T</span><span class="i-orange">I</span><span class="o-red">O</span><span class="r-teal">R</span>
          <span style="font-size: 0.95rem; color: #555; font-family: var(--font-hand); margin-left: 6px;">DIGITAL EVENT PASS</span>
        </div>
        <button onclick="closePassModal()" style="background:none; border:none; font-size:1.6rem; cursor:pointer; line-height:1;">✕</button>
      </div>

      <div style="text-align: center;">
        <h2 id="passEventTitle" style="font-size: 1.55rem; color: #222; margin-bottom: 4px;">Sabarmati Riverfront Walk</h2>
        <div class="status-badge status-valid" id="passStatusBadge">🟢 Valid Entry Pass</div>
      </div>

      <div class="qr-frame">
        <img id="passQrImg" src="" alt="Digital Ticket QR"/>
        <div style="font-size: 0.88rem; color: #555; margin-top: 6px;">Show at entrance for scan</div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 1.05rem; margin-top: 10px;">
        <div>
          <div style="color:#777; font-size:0.9rem;">Ticket Number</div>
          <strong id="passTicketNo">MTR-20261025-ABC123</strong>
        </div>
        <div>
          <div style="color:#777; font-size:0.9rem;">Attendee</div>
          <strong id="passAttendeeName">Priya Sharma</strong>
        </div>
        <div>
          <div style="color:#777; font-size:0.9rem;">Date & Time</div>
          <span id="passDateTime">Saturday, 7:00 AM</span>
        </div>
        <div>
          <div style="color:#777; font-size:0.9rem;">Venue</div>
          <span id="passVenue">Sabarmati Riverfront</span>
        </div>
      </div>

      <div class="pass-tear-divider"></div>

      <div style="display: flex; gap: 10px; justify-content: center;">
        <button class="btn-crayon-yellow" onclick="window.print()" style="padding: 6px 20px;">🖨️ Print / Save Pass</button>
        <button class="btn-sketch-white" onclick="closePassModal()" style="padding: 6px 18px;">Done</button>
      </div>
    </div>
  </div>
`;

html = html.replace('<div id="toastBox" class="toast-box"></div>', passModalHTML + '\n  <div id="toastBox" class="toast-box"></div>');

// Write back to meetior/frontend/index.html and Project Demo Front End.html
fs.writeFileSync(destPath, html, 'utf8');
fs.writeFileSync(srcPath, html, 'utf8');
console.log('✅ HTML markup, modals, and views upgraded successfully in both files.');
