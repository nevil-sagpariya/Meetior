import React from 'react';

/**
 * ScannerPage Component
 * Organizer In-App QR Pass Scanner
 *
 * @param {Object} props
 * @param {Function} props.navigateTo - View navigation callback
 * @param {Object} props.currentUser - Authenticated user session object
 * @param {Function} [props.showToast] - Flash notification toast
 */
export default function ScannerPage({ navigateTo, currentUser, showToast }) {
  return (
    <>
    <section id="view-scanner" className="hidden">
      <div className="page-title-row">
        <a className="back-link" onclick="navigateTo('create')">← Back to Dashboard</a>
        <h1 className="page-title">Organizer QR Ticket Scanner 📷</h1>
        <div></div>
      </div>
      <p style={{"textAlign":"center","fontSize":"1.15rem","marginBottom":"16px"}}>
        Scan attendee QR codes to verify tickets and mark atomic attendance.
      </p>

      <div className="sketch-box" style={{"maxWidth":"650px","margin":"0 auto","padding":"22px"}}>
        <div style={{"marginBottom":"14px"}}>
          <label className="field-label">Select Your Event <span className="req-star">*</span></label>
          <select id="scannerEventSelect" className="sketch-input" onchange="loadScannerAttendance()">
            <option value="">Loading your organized events...</option>
          </select>
        </div>

        <div className="scanner-viewport">
          <video id="scannerVideo" autoplay playsinline style={{"width":"100%","height":"100%","objectFit":"cover"}}></video>
          <div className="scanner-target-reticle"></div>
          <div id="scannerPlaceholderMsg" style={{"position":"absolute","textAlign":"center","padding":"12px","fontSize":"1.05rem"}}>
            📷 Camera Scanner Ready<br /><small style={{"color":"#f9ca24"}}>Point camera at attendee QR code</small>
          </div>
        </div>

        <div style={{"display":"flex","gap":"8px","justifyContent":"center","marginTop":"10px"}}>
          <button className="btn-crayon-yellow" id="btnToggleCam" onclick="toggleCameraScanner()">Start Camera</button>
          <button className="btn-sketch-white" onclick="simulateScan()">🧪 Test Sample Pass</button>
        </div>

        {/* Manual Token Verification Fallback */}
        <div style={{"marginTop":"16px","borderTop":"1.5px dashed #ccc","paddingTop":"12px"}}>
          <label className="field-label" style={{"fontSize":"0.95rem"}}>Or Enter / Paste Ticket Number or QR Token:</label>
          <div style={{"display":"flex","gap":"8px"}}>
            <input id="manualTokenInput" type="text" className="sketch-input" placeholder="e.g. MTR-20261027-9C43C8 or scan token..." onkeydown="if(event.key==='Enter') verifyScannedToken(this.value)"/>
            <button className="btn-crayon-yellow" onclick="verifyScannedToken(document.getElementById('manualTokenInput').value)">Verify Pass</button>
          </div>
        </div>

        <div id="scanResultBox" className="scan-result-card hidden"></div>

        {/* Attendance log */}
        <div style={{"marginTop":"24px"}}>
          <h4 style={{"fontSize":"1.25rem","marginBottom":"8px"}}>📋 Event Attendance List (<span id="attendanceCount">0</span> checked in)</h4>
          <table className="table-sketch">
            <thead>
              <tr>
                <th>Attendee</th>
                <th>Ticket No</th>
                <th>Check-in Time</th>
              </tr>
            </thead>
            <tbody id="attendanceTableBody">
              <tr><td colspan="3" style={{"textAlign":"center","color":"#777"}}>No check-ins yet for this session.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    {/* =========================================================
         VIEW 11: IN-APP NOTIFICATIONS & REMINDERS
         ========================================================= */}
    </>
  );
}
