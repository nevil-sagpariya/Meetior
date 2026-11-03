import React from 'react';

/**
 * EventDetailsPage Component
 * Event Details & Booking Page
 *
 * @param {Object} props
 * @param {Function} props.navigateTo - View navigation callback
 * @param {Object} props.currentUser - Authenticated user session object
 * @param {Function} [props.showToast] - Flash notification toast
 */
export default function EventDetailsPage({ navigateTo, currentUser, showToast }) {
  return (
    <>
    <section id="view-details" className="hidden">
      <div className="page-title-row">
        <a className="back-link" onclick="navigateTo('browse')">← Back to Browse</a>
        <h1 className="page-title">Event Details</h1>
        <div></div>
      </div>

      <div className="details-wrapper">
        <button className="carousel-side-btn prev" onclick="cycleDetailEvent(-1)">
          <svg width="36" height="44" viewBox="0 0 36 44">
            <polygon points="30,4 6,22 30,40" fill="none" stroke="#222" stroke-width="3" stroke-linejoin="round"/>
          </svg>
          <span>Previous<br />Event</span>
        </button>

        <button className="carousel-side-btn next" onclick="cycleDetailEvent(1)">
          <svg width="36" height="44" viewBox="0 0 36 44">
            <polygon points="6,4 30,22 6,40" fill="none" stroke="#222" stroke-width="3" stroke-linejoin="round"/>
          </svg>
          <span>Next<br />Event</span>
        </button>

        <div className="sketch-box details-card">
          <div id="detailCityContextBanner" style={{"display":"none","marginBottom":"14px","padding":"10px 16px","background":"#fffdf0","border":"2px dashed #f5a623","borderRadius":"12px","fontSize":"0.98rem","color":"#444"}}></div>
          {/* Organizer Quick Event Management Controls */}
          <div id="organizerEventControls" className="sketch-box" style={{"display":"none","marginBottom":"16px","background":"#fdfaf2","border":"2.5px solid #2e7d32","borderRadius":"12px","padding":"14px"}}>
            <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","flexWrap":"wrap","gap":"10px"}}>
              <div>
                <span className="status-badge" style={{"background":"#e8f5e9","color":"#2e7d32","fontWeight":"700"}}>👤 You are the Organizer of this Event</span>
                <p id="organizerControlsNotice" style={{"fontSize":"0.9rem","color":"#555","margin":"4px 0 0"}}>
                  You can edit or cancel this event before the event date. Cancelling automatically issues 100% full refunds to all paid attendees.
                </p>
              </div>
              <div id="organizerActionBtnGroup" style={{"display":"flex","gap":"8px"}}>
                <button type="button" className="btn-crayon-yellow" id="btnEditEventDetails" onclick="openEditEventModal(state.currentEventId)" style={{"padding":"6px 14px","fontSize":"0.95rem"}}>
                  ✏️ Edit Event
                </button>
                <button type="button" className="btn-sketch-white" id="btnCancelEventDetails" onclick="promptCancelEvent(state.currentEventId)" style={{"color":"#b71540","borderColor":"#b71540","padding":"6px 14px","fontSize":"0.95rem"}}>
                  ❌ Cancel Event
                </button>
              </div>
            </div>
          </div>

          <h2 id="detailRainbowTitle" className="details-rainbow-title"></h2>

          <div className="details-content-grid">
            <div>
              <div id="detailArtworkBox" className="details-photo-frame"></div>
              <div id="detailPriceBanner" className="paid-rainbow-banner"></div>

              {/* Interactive Venue Location Map Box */}
              <div id="detailMapBox" className="detail-map-box" style={{"marginTop":"14px"}}>
                <div className="detail-map-header">
                  <div style={{"display":"flex","alignItems":"center","gap":"6px"}}>
                    <span style={{"fontSize":"1.05rem"}}>🗺️</span>
                    <strong style={{"color":"#222","fontSize":"0.95rem"}}>Venue Location Map</strong>
                  </div>
                  <a id="detailMapExternalLink" href="https://maps.google.com" target="_blank" rel="noopener noreferrer" style={{"color":"#1e90ff","fontWeight":"700","textDecoration":"underline","fontSize":"0.88rem"}}>
                    Open in Google Maps ↗
                  </a>
                </div>
                <div className="detail-map-frame-wrap">
                  <div id="detailLeafletMap" style={{"height":"190px","width":"100%","position":"relative","zIndex":"1"}}></div>
                  <iframe id="detailMapIframe" title="Venue Location Map" width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" style={{"border":"0","display":"none"}} loading="lazy"></iframe>
                </div>
                <div className="detail-map-footer">
                  <span id="detailMapCoords">📍 Coordinates: 23.0365° N, 72.5695° E</span>
                  <button type="button" className="btn-sketch-white" onclick="copyEventCoordinates()" style={{"fontSize":"0.78rem","padding":"2px 8px","fontWeight":"700","cursor":"pointer"}}>📋 Copy Coords</button>
                </div>
              </div>
            </div>

            <div>
              <div className="info-item">
                <strong>📅 Date & Time</strong>
                <p id="detailDateTime"></p>
              </div>
              <div className="info-item">
                <strong>📍 Location</strong>
                <p id="detailLocation"></p>
              </div>
              <div className="info-item">
                <strong>👤 Organizer</strong>
                <p id="detailOrganizer"></p>
              </div>
              <div className="info-item">
                <strong>📄 Description</strong>
                <p id="detailDescription"></p>
              </div>

              <div className="rsvp-buttons-row" style={{"flexWrap":"wrap","gap":"8px"}}>
                <button className="btn-crayon-yellow" id="detailBookBtn" onclick="handleEventRegistration()" style={{"padding":"9px 24px","fontSize":"1.25rem"}}>
                  🎟️ Register & Get Pass
                </button>
                <button id="btnRsvpGoing" className="btn-rsvp going" onclick="handleRsvp('Going')">Going ✓</button>
                <button id="btnRsvpInterested" className="btn-rsvp interested" onclick="handleRsvp('Interested')">Interested ⭐</button>
                <button id="btnRsvpSave" className="btn-rsvp save" onclick="handleRsvp('Saved')">Save 🔖</button>
              </div>
              <div id="detailSecondChanceBox" style={{"marginTop":"12px","display":"none","background":"#fffde7","border":"2px dashed #f9ca24","borderRadius":"10px","padding":"12px"}}>
                <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"6px"}}>
                  <strong style={{"fontSize":"1.05rem","color":"#b58900"}}>🔄 Motion Second Chance</strong>
                  <span id="detailSecondChanceCount" className="status-badge" style={{"background":"#fff","borderColor":"#f9ca24","fontSize":"0.85rem"}}>0 Requests</span>
                </div>
                <p style={{"fontSize":"0.88rem","color":"#555","marginBottom":"8px"}}>Missed this event or want another session? Request a rerun to notify the organizer!</p>
                <button className="btn-sketch-white" onclick="promptSecondChance()" style={{"width":"100%","fontSize":"0.95rem","fontWeight":"700","color":"#b58900","borderColor":"#f9ca24"}}>
                  ✨ Request Another Session
                </button>
              </div>

              <div id="detailReviewsBox" style={{"marginTop":"18px","borderTop":"2px dashed #ccc","paddingTop":"14px"}}>
                <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"8px"}}>
                  <h4 style={{"fontSize":"1.2rem","margin":"0"}}>⭐ Verified Attendee Reviews</h4>
                  <span id="detailAvgRatingBadge" className="status-badge" style={{"background":"#fff3bf","color":"#b58900","borderColor":"#fab005","fontSize":"0.88rem"}}>★ 0.0</span>
                </div>
                <div id="reviewsList" style={{"fontSize":"0.95rem","color":"#444","maxHeight":"180px","overflowY":"auto","marginBottom":"10px"}}>No reviews yet. Be the first checked-in attendee to leave one!</div>

                {/* Verified Review Form */}
                <div id="detailReviewFormBox" style={{"background":"#fff","border":"1.5px dashed #aaa","borderRadius":"10px","padding":"10px","marginTop":"8px"}}>
                  <strong style={{"fontSize":"0.92rem","display":"block","marginBottom":"4px","color":"#222"}}>Leave a Verified Review (Checked-in Attendees Only):</strong>
                  <div style={{"display":"flex","gap":"8px","alignItems":"center","marginBottom":"6px"}}>
                    <label style={{"fontSize":"0.88rem","fontFamily":"var(--font-hand)","fontWeight":"700"}}>Rating:</label>
                    <select id="reviewRatingSelect" className="sketch-input" style={{"width":"auto","padding":"3px 8px","fontSize":"0.9rem"}}>
                      <option value="5">⭐⭐⭐⭐⭐ (5 - Amazing)</option>
                      <option value="4">⭐⭐⭐⭐ (4 - Great)</option>
                      <option value="3">⭐⭐⭐ (3 - Good)</option>
                      <option value="2">⭐⭐ (2 - Fair)</option>
                      <option value="1">⭐ (1 - Disappointing)</option>
                    </select>
                  </div>
                  <textarea id="reviewCommentInput" className="sketch-input" rows="2" placeholder="Tell other attendees about your experience at this event..." style={{"width":"100%","fontSize":"0.9rem","padding":"6px","resize":"vertical"}}></textarea>
                  <button type="button" className="btn-crayon-yellow" onclick="handleReviewSubmit()" style={{"marginTop":"6px","padding":"4px 14px","fontSize":"0.95rem"}}>
                    Post Verified Review ✍️
                  </button>
                </div>
              </div>

              {/* Safety & Moderation Link */}
              <div style={{"marginTop":"14px","display":"flex","justifyContent":"space-between","alignItems":"center","flexWrap":"wrap","gap":"8px"}}>
                <p style={{"fontSize":"0.88rem","margin":"0","color":"#666"}}>
                  Note: You must be logged in as an Attendee to RSVP or Save.
                </p>
                <button type="button" className="btn-sketch-white" onclick="openReportModalForCurrentEvent()" style={{"color":"#b71540","borderColor":"#b71540","fontSize":"0.82rem","padding":"3px 8px"}} title="Flag this event for moderation">
                  🚩 Report Event
                </button>
              </div>
            </div>
          </div>

          <div id="detailDots" className="carousel-dots"></div>
        </div>

        {/* SIMILAR PUBLIC GATHERINGS SECTION (Triggered when user clicks 'Interested') */}
        <div id="similarEventsSection" className="sketch-box" style={{"marginTop":"22px","padding":"20px","display":"none","background":"#fffdf5","border":"2.5px dashed #f6b93b","borderRadius":"16px","textAlign":"left"}}>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"8px","flexWrap":"wrap","gap":"8px"}}>
            <h3 style={{"fontSize":"1.4rem","margin":"0","fontFamily":"'Fredoka', cursive","color":"#222"}}>
              ✨ Similar Public Gatherings You Might Like
            </h3>
            <span className="status-badge" style={{"background":"#fff9db","color":"#b58900","borderColor":"#fab005","fontSize":"0.85rem"}}>Recommended for you</span>
          </div>
          <p id="similarEventsSubtext" style={{"fontSize":"1.1rem","color":"#555","fontFamily":"'Patrick Hand', cursive","marginBottom":"14px"}}>
            Because you're interested in this public gathering, here are related activities happening nearby:
          </p>
          <div id="similarEventsGrid" className="cards-grid-3" style={{"gap":"14px"}}></div>
        </div>

        <a className="browse-more-pill" onclick="navigateTo('browse')">
          Browse More Events in Ahmedabad →
        </a>
      </div>
    </section>

    {/* =========================================================
         VIEW 4: CREATE NEW EVENT
         ========================================================= */}
    </>
  );
}
