import React from 'react';

/**
 * TicketPassModal Component
 * Cryptographic QR event pass viewer (MTR-YYYYMMDD-XXXXXX).
 */
export default function TicketPassModal({ isOpen, onClose, ticketData }) {
  if (!isOpen) return null;

  return (
    <>
  <div id="passModal" className="modal-backdrop hidden" onclick="if(event.target===this) closePassModal()">
    <div className="pass-card-container">
      <div className="pass-ticket-header">
        <div className="brand-wordmark" style={{"fontSize":"1.35rem"}}>
          <span className="m-blue">M</span><span className="e-green">E</span><span className="e-green">E</span><span className="t-yellow">T</span><span className="i-orange">I</span><span className="o-red">O</span><span className="r-teal">R</span>
          <span style={{"fontSize":"0.95rem","color":"#555","fontFamily":"var(--font-hand)","marginLeft":"6px"}}>DIGITAL EVENT PASS</span>
        </div>
        <button onclick="closePassModal()" style={{"background":"none","border":"none","fontSize":"1.6rem","cursor":"pointer","lineHeight":"1"}}>✕</button>
      </div>

      <div style={{"textAlign":"center"}}>
        <h2 id="passEventTitle" style={{"fontSize":"1.55rem","color":"#222","marginBottom":"4px"}}>Sabarmati Riverfront Walk</h2>
        <div className="status-badge status-valid" id="passStatusBadge">🟢 Valid Entry Pass</div>
      </div>

      <div className="qr-frame">
        <img id="passQrImg" src="" alt="Digital Ticket QR"/>
        <div style={{"fontSize":"0.88rem","color":"#555","marginTop":"6px"}}>Show at entrance for scan</div>
      </div>

      <div style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"8px","fontSize":"1.05rem","marginTop":"10px"}}>
        <div>
          <div style={{"color":"#777","fontSize":"0.9rem"}}>Ticket Number</div>
          <strong id="passTicketNo">MTR-20261025-ABC123</strong>
        </div>
        <div>
          <div style={{"color":"#777","fontSize":"0.9rem"}}>Attendee</div>
          <strong id="passAttendeeName">Nevil Sagpariya</strong>
        </div>
        <div>
          <div style={{"color":"#777","fontSize":"0.9rem"}}>Date & Time</div>
          <span id="passDateTime">Saturday, 7:00 AM</span>
        </div>
        <div>
          <div style={{"color":"#777","fontSize":"0.9rem"}}>Venue / Location</div>
          <span id="passVenue">Sabarmati Riverfront</span>
          <div style={{"marginTop":"4px"}}>
            <a id="passMapLink" href="https://maps.google.com" target="_blank" rel="noopener noreferrer" style={{"display":"inline-flex","alignItems":"center","gap":"4px","color":"#2563eb","fontWeight":"700","fontSize":"0.92rem","textDecoration":"underline"}}>
              🗺️ Open in Google Maps ↗
            </a>
          </div>
        </div>
      </div>

      <div id="passDispatchNotice" style={{"marginTop":"10px","padding":"8px 10px","background":"#e8f5e9","border":"1.5px dashed #4caf50","borderRadius":"8px","fontSize":"0.92rem","textAlign":"center","color":"#2e7d32"}}>
        📲 <strong>Pass Delivered!</strong> A copy with QR pass has been sent to <u><span id="passDeliveryEmail">user@meetior.in</span></u> and WhatsApp/SMS to <u><span id="passDeliveryPhone">+91 9876543210</span></u>.
      </div>

      <div className="pass-tear-divider"></div>

      <div style={{"display":"flex","gap":"10px","justifyContent":"center"}}>
        <button className="btn-crayon-yellow" onclick="window.print()" style={{"padding":"6px 20px"}}>🖨️ Print / Save Pass</button>
        <button className="btn-sketch-white" onclick="closePassModal()" style={{"padding":"6px 18px"}}>Done</button>
      </div>
    </div>
  </div>

  {/* RAZORPAY TEST PAYMENT MODAL */}
    </>
  );
}
