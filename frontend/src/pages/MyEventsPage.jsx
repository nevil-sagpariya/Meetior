import React from 'react';

/**
 * MyEventsPage Component
 * Organizer Published Events Dashboard
 *
 * @param {Object} props
 * @param {Function} props.navigateTo - View navigation callback
 * @param {Object} props.currentUser - Authenticated user session object
 * @param {Function} [props.showToast] - Flash notification toast
 */
export default function MyEventsPage({ navigateTo, currentUser, showToast }) {
  return (
    <>
    <section id="view-my-events" className="hidden">
      <div className="page-title-row">
        <a className="back-link" onclick="navigateTo('home')">Back to Home</a>
        <h1 className="page-title">My Organized Events 📋</h1>
        <button className="btn-crayon-yellow" onclick="navigateTo('create')">+ Create New Event</button>
      </div>

      <p className="subtitle" style={{"textAlign":"center","marginBottom":"20px"}}>
        Manage, edit, or cancel your events before their scheduled date.
        <br /><small style={{"color":"#27ae60","fontWeight":"700"}}>🛡️ 100% Automatic Refund Guarantee: If you cancel an event, all paid attendees receive an automatic full refund instantly.</small>
      </p>

      <div className="sketch-box" style={{"maxWidth":"950px","margin":"0 auto","padding":"22px"}}>
        <div id="myEventsLoading" style={{"textAlign":"center","padding":"20px","color":"#666"}}>
          ⏳ Loading your organized events...
        </div>
        <div id="myEventsEmpty" style={{"display":"none","textAlign":"center","padding":"30px 10px"}}>
          <div style={{"fontSize":"2.5rem","marginBottom":"8px"}}>🎪</div>
          <h3 style={{"fontSize":"1.3rem"}}>No events created yet!</h3>
          <p style={{"color":"#666","marginBottom":"14px"}}>Host your first local meetup or workshop.</p>
          <button className="btn-crayon-yellow" onclick="navigateTo('create')">+ Create Your First Event</button>
        </div>
        <div id="myEventsList" style={{"display":"flex","flexDirection":"column","gap":"16px"}}></div>
      </div>
    </section>

    {/* =========================================================
         VIEW 14: ORGANIZER REVENUE & TICKET SALES HUB
         ========================================================= */}
    </>
  );
}
