import React from 'react';

/**
 * RevenuePage Component
 * Organizer Revenue & Sales Analytics Hub
 *
 * @param {Object} props
 * @param {Function} props.navigateTo - View navigation callback
 * @param {Object} props.currentUser - Authenticated user session object
 * @param {Function} [props.showToast] - Flash notification toast
 */
export default function RevenuePage({ navigateTo, currentUser, showToast }) {
  return (
    <>
    <section id="view-revenue" className="hidden">
      <div className="page-title-row">
        <a className="back-link" onclick="navigateTo('profile')">← Back to Dashboard</a>
        <h1 className="page-title">Organizer Revenue & Ticket Sales 💰</h1>
        <div style={{"display":"flex","gap":"8px"}}>
          <button type="button" className="btn-sketch-white" onclick="loadOrganizerRevenuePage()" style={{"padding":"4px 12px","fontSize":"0.95rem"}}>
            🔄 Refresh
          </button>
          <button type="button" className="btn-crayon-green" onclick="exportOrganizerRevenueCSV()" style={{"padding":"4px 12px","fontSize":"0.95rem","cursor":"pointer"}}>
            📥 Export CSV
          </button>
        </div>
      </div>
      <p style={{"textAlign":"center","fontSize":"1.15rem","marginBottom":"20px"}}>
        Track ticket purchases, net receipts, refund reconciliations, and attendee transaction audit logs.
      </p>

      {/* Revenue Hub Container (Full Width & Spacious) */}
      <div className="sketch-box revenue-hub-card" style={{"maxWidth":"1050px","margin":"0 auto","padding":"24px"}}>
        
        {/* Summary Stats Cards */}
        <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit, minmax(210px, 1fr))","gap":"14px","marginBottom":"22px"}}>
          <div style={{"background":"#e8f5e9","border":"2.5px solid #2e7d32","borderRadius":"12px","padding":"14px","textAlign":"center"}}>
            <span style={{"fontSize":"0.88rem","color":"#2e7d32","fontWeight":"700","textTransform":"uppercase"}}>Net Revenue Received</span>
            <div id="revTotalRevenue" style={{"fontSize":"2rem","fontWeight":"800","color":"#1b5e20","marginTop":"4px"}}>₹0.00</div>
          </div>
          <div style={{"background":"#e3f2fd","border":"2.5px solid #1565c0","borderRadius":"12px","padding":"14px","textAlign":"center"}}>
            <span style={{"fontSize":"0.88rem","color":"#1565c0","fontWeight":"700","textTransform":"uppercase"}}>Total Attendees / Passes</span>
            <div id="revTotalTickets" style={{"fontSize":"2rem","fontWeight":"800","color":"#0d47a1","marginTop":"4px"}}>0</div>
            <div id="revAttendeesBreakdown" style={{"fontSize":"0.84rem","color":"#1565c0","fontWeight":"700","marginTop":"2px"}}>0 Paid • 0 Free Passes</div>
          </div>
          <div style={{"background":"#fef2f2","border":"2.5px solid #dc2626","borderRadius":"12px","padding":"14px","textAlign":"center"}}>
            <span style={{"fontSize":"0.88rem","color":"#dc2626","fontWeight":"700","textTransform":"uppercase"}}>Total Refunded</span>
            <div id="revTotalRefunded" style={{"fontSize":"2rem","fontWeight":"800","color":"#991b1b","marginTop":"4px"}}>₹0.00</div>
          </div>
          <div style={{"background":"#fff3e0","border":"2.5px solid #e65100","borderRadius":"12px","padding":"14px","textAlign":"center"}}>
            <span style={{"fontSize":"0.88rem","color":"#e65100","fontWeight":"700","textTransform":"uppercase"}}>Payment Gateway</span>
            <div style={{"fontSize":"1.35rem","fontWeight":"800","color":"#bf360c","marginTop":"6px"}}>Razorpay (Live / Test)</div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","flexWrap":"wrap","gap":"10px","marginBottom":"16px","background":"#faf8ef","padding":"10px 14px","borderRadius":"10px","border":"1.5px solid #ddd"}}>
          <div style={{"display":"flex","gap":"8px","flexWrap":"wrap","alignItems":"center","flex":"1"}}>
            <input type="text" id="revenueSearchInput" className="sketch-input" placeholder="🔍 Search attendee name, email, ticket #, or event..." style={{"maxWidth":"380px","padding":"6px 12px","fontSize":"0.95rem"}} oninput="handleRevenueFilterChange()"/>
            <select id="revenueStatusFilter" className="sketch-input" style={{"width":"auto","padding":"6px 10px","fontSize":"0.92rem"}} onchange="handleRevenueFilterChange()">
              <option value="all">🏷️ All Passes & Transactions</option>
              <option value="Completed">Completed / Active Passes ✅</option>
              <option value="Refunded">Refunded / Cancelled 💸</option>
              <option value="free">Free Passes Only 🎟️</option>
              <option value="paid">Paid Bookings Only 💳</option>
            </select>
          </div>
          <div id="revenueItemsCounter" style={{"fontSize":"0.95rem","fontWeight":"700","color":"#555"}}>
            Showing 0 transactions
          </div>
        </div>

        {/* Payments Table */}
        <div style={{"overflowX":"auto","border":"2px solid #222","borderRadius":"10px"}}>
          <table style={{"width":"100%","borderCollapse":"collapse","fontSize":"0.95rem","textAlign":"left","background":"#ffffff"}}>
            <thead>
              <tr style={{"borderBottom":"2px solid #222","background":"#fdf6d8"}}>
                <th style={{"padding":"10px 14px","fontWeight":"700"}}>Date & Time 📅</th>
                <th style={{"padding":"10px 14px","fontWeight":"700"}}>Event Title 🎭</th>
                <th style={{"padding":"10px 14px","fontWeight":"700"}}>Attendee Details 👤</th>
                <th style={{"padding":"10px 14px","fontWeight":"700","textAlign":"center"}}>Ticket / Pass # 🎟️</th>
                <th style={{"padding":"10px 14px","fontWeight":"700","textAlign":"right"}}>Amount 💵</th>
                <th style={{"padding":"10px 14px","fontWeight":"700","textAlign":"center"}}>Status 🏷️</th>
              </tr>
            </thead>
            <tbody id="revenuePaymentsTableBody">
              <tr><td colspan="6" style={{"padding":"24px","textAlign":"center","color":"#777"}}>Loading transactions...</td></tr>
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div id="revenuePaginationBar" className="pagination-bar" style={{"marginTop":"18px","justifyContent":"center","display":"flex","gap":"6px"}}></div>
      </div>
    </section>
    </>
  );
}
