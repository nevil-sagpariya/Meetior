import React from 'react';

/**
 * NotificationsPage Component
 * Notifications & Alerts Hub
 *
 * @param {Object} props
 * @param {Function} props.navigateTo - View navigation callback
 * @param {Object} props.currentUser - Authenticated user session object
 * @param {Function} [props.showToast] - Flash notification toast
 */
export default function NotificationsPage({ navigateTo, currentUser, showToast }) {
  return (
    <>
    <section id="view-notifications" className="hidden">
      <div className="page-title-row">
        <a className="back-link" onclick="navigateTo('home')">← Back to Home</a>
        <h1 className="page-title">Notification Center 🔔</h1>
        <button className="btn-sketch-white" onclick="markAllNotificationsRead()" style={{"padding":"4px 14px","fontSize":"0.95rem"}}>Mark all as read</button>
      </div>
      <p style={{"textAlign":"center","fontSize":"1.1rem","marginBottom":"16px"}}>
        Automatic 2-day, 1-day, and 2-hour reminders, registration updates, and community responses.
      </p>
      <div className="sketch-box" style={{"maxWidth":"680px","margin":"0 auto","overflow":"hidden","padding":"0"}}>
        <div id="notificationsList">
          <div className="notif-empty-state" style={{"padding":"24px","textAlign":"center","color":"#666","fontFamily":"var(--font-hand)","fontSize":"1.15rem"}}>Loading notifications...</div>
        </div>
      </div>
    </section>

  
    {/* =========================================================
         VIEW 12: USER PROFILE SCREEN
         ========================================================= */}
    </>
  );
}
