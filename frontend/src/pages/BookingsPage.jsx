import React from 'react';

/**
 * BookingsPage Component
 * My Bookings & Passes Page
 *
 * @param {Object} props
 * @param {Function} props.navigateTo - View navigation callback
 * @param {Object} props.currentUser - Authenticated user session object
 * @param {Function} [props.showToast] - Flash notification toast
 */
export default function BookingsPage({ navigateTo, currentUser, showToast }) {
  return (
    <>
    <section id="view-bookings" className="hidden">
      <div className="page-title-row">
        <a className="back-link" onclick="navigateTo('browse')">← Back to Browse</a>
        <h1 className="page-title">My Bookings & Passes</h1>
        <div></div>
      </div>
      <p style={{"textAlign":"center","fontSize":"1.15rem","marginBottom":"18px"}}>
        Here are all your confirmed event registrations and digital entry passes.
      </p>
      <div id="bookingsContainer" className="cards-grid-3"></div>
    </section>

    {/* =========================================================
         VIEW 8: MY SAVED EVENTS
         ========================================================= */}
    </>
  );
}
