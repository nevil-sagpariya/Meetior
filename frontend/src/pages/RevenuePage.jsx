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
        <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit, minmax(185px, 1fr))","gap":"12px","marginBottom":"16px"}}>
          {/* 1. Gross Ticket Sales */}
          <div style={{"background":"#eff6ff","border":"2.5px solid #2563eb","borderRadius":"12px","padding":"14px","textAlign":"center"}}>
            <span style={{"fontSize":"0.82rem","color":"#1d4ed8","fontWeight":"700","textTransform":"uppercase","letterSpacing":"0.5px"}}>Gross Ticket Sales</span>
            <div id="revGrossSales" style={{"fontSize":"1.85rem","fontWeight":"800","color":"#1e40af","marginTop":"4px"}}>₹0.00</div>
            <div id="revPaidPassesBreakdown" style={{"fontSize":"0.80rem","color":"#2563eb","fontWeight":"700","marginTop":"2px"}}>0 Paid Bookings</div>
          </div>
          {/* 2. Platform Commission Fee */}
          <div style={{"background":"#fff7ed","border":"2.5px solid #ea580c","borderRadius":"12px","padding":"14px","textAlign":"center"}}>
            <span id="revFeeLabel" style={{"fontSize":"0.82rem","color":"#c2410c","fontWeight":"700","textTransform":"uppercase","letterSpacing":"0.5px"}}>Platform Fee (5.0%)</span>
            <div id="revPlatformFee" style={{"fontSize":"1.85rem","fontWeight":"800","color":"#ea580c","marginTop":"4px"}}>-₹0.00</div>
            <div style={{"fontSize":"0.80rem","color":"#9a3412","fontWeight":"700","marginTop":"2px"}}>Auto-deducted fee</div>
          </div>
          {/* 3. Net Take-Home Earnings */}
          <div style={{"background":"#e8f5e9","border":"2.5px solid #2e7d32","borderRadius":"12px","padding":"14px","textAlign":"center"}}>
            <span style={{"fontSize":"0.82rem","color":"#2e7d32","fontWeight":"700","textTransform":"uppercase","letterSpacing":"0.5px"}}>Net Take-Home Payout</span>
            <div id="revNetEarnings" style={{"fontSize":"1.85rem","fontWeight":"800","color":"#1b5e20","marginTop":"4px"}}>₹0.00</div>
            <div id="revTotalRevenue" style={{"display":"none"}}>₹0.00</div>
            <div style={{"fontSize":"0.80rem","color":"#166534","fontWeight":"700","marginTop":"2px"}}>Your actual payout</div>
          </div>
          {/* 4. Total Attendees / Passes */}
          <div style={{"background":"#f5f3ff","border":"2.5px solid #7c3aed","borderRadius":"12px","padding":"14px","textAlign":"center"}}>
            <span style={{"fontSize":"0.82rem","color":"#6d28d9","fontWeight":"700","textTransform":"uppercase","letterSpacing":"0.5px"}}>Total Attendees</span>
            <div id="revTotalTickets" style={{"fontSize":"1.85rem","fontWeight":"800","color":"#5b21b6","marginTop":"4px"}}>0</div>
            <div id="revAttendeesBreakdown" style={{"fontSize":"0.80rem","color":"#6d28d9","fontWeight":"700","marginTop":"2px"}}>0 Paid • 0 Free Passes</div>
          </div>
          {/* 5. Total Refunded */}
          <div style={{"background":"#fef2f2","border":"2.5px solid #dc2626","borderRadius":"12px","padding":"14px","textAlign":"center"}}>
            <span style={{"fontSize":"0.82rem","color":"#dc2626","fontWeight":"700","textTransform":"uppercase","letterSpacing":"0.5px"}}>Total Refunded</span>
            <div id="revTotalRefunded" style={{"fontSize":"1.85rem","fontWeight":"800","color":"#991b1b","marginTop":"4px"}}>₹0.00</div>
            <div id="revRefundsBreakdown" style={{"fontSize":"0.80rem","color":"#dc2626","fontWeight":"700","marginTop":"2px"}}>0 Refunded Bookings</div>
          </div>
        </div>

        {/* Platform Commission Policy Notice Banner */}
        <div className="rev-fee-notice-banner" style={{"display":"flex","alignItems":"flex-start","gap":"12px","background":"#fffbe6","border":"2px solid #fab005","borderRadius":"10px","padding":"12px 16px","marginBottom":"18px","boxShadow":"2px 2px 0 #fab005"}}>
          <span style={{"fontSize":"1.5rem","lineHeight":"1.1"}}>💡</span>
          <div style={{"fontSize":"0.92rem","color":"#5c3e04","lineHeight":"1.45"}}>
            <strong>Meetior Platform Fee Policy:</strong> A standard <span id="revNoticeRate" style={{"fontWeight":"800","color":"#b45309"}}>5.0% platform service fee</span> is automatically deducted from paid ticket sales at settlement. Free events (₹0) are 100% free with <strong>0% fee</strong>. You never pay out of pocket; payouts are settled as: <em>Net Payout = Gross Ticket Sales - 5.0% Platform Fee - Refunds</em>.
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
                <th style={{"padding":"10px 14px","fontWeight":"700","textAlign":"right"}}>Payout Breakdown 💵 (Net / Gross / Fee)</th>
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
