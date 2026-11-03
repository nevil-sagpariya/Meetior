import React from 'react';

/**
 * AdminDashboardPage Component
 * Super Admin Governance & Data Management Dashboard
 *
 * @param {Object} props
 * @param {Function} props.navigateTo - View navigation callback
 * @param {Object} props.currentUser - Authenticated user session object
 * @param {Function} [props.showToast] - Flash notification toast
 */
export default function AdminDashboardPage({ navigateTo, currentUser, showToast }) {
  return (
    <>
    <section id="view-admin" className="hidden">
      {/* Admin Header Bar */}
      <div className="page-title-row" style={{"alignItems":"center","justifyContent":"space-between","flexWrap":"wrap","gap":"12px","marginBottom":"16px"}}>
        <div style={{"display":"flex","alignItems":"center","gap":"12px","flexWrap":"wrap"}}>
          <a className="back-link" onclick="navigateTo('home')">← Back to Meetior</a>
          <h1 className="page-title" style={{"margin":"0","fontSize":"1.85rem"}}>Super Admin Management System 🛡️</h1>
        </div>
        <div style={{"display":"flex","alignItems":"center","gap":"10px","flexWrap":"wrap"}}>
          <span id="admCurrentAdminBadge" className="status-badge" style={{"background":"#1e90ff","color":"#fff","borderColor":"#0960bd","fontSize":"0.92rem","padding":"4px 10px"}}>
            Super Admin: Master Administrator
          </span>
          <button type="button" className="btn-sketch-white" onclick="openAdminMfaModal()" style={{"padding":"4px 12px","fontSize":"0.88rem"}}>
            🔐 2FA / MFA
          </button>
          <button type="button" className="btn-sketch-white" onclick="handleAdminLogout()" style={{"padding":"4px 12px","fontSize":"0.88rem","color":"#c62828","borderColor":"#c62828"}}>
            🚪 Admin Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs Pill Bar */}
      <div className="sketch-box" style={{"padding":"12px 16px","marginBottom":"20px","background":"#fffcf0"}}>
        <div style={{"display":"flex","gap":"6px","flexWrap":"wrap","alignItems":"center"}} id="adminTabButtons">
          <button className="filter-pill active" id="adminTabBtn-overview" onclick="switchAdminTab('overview')">📊 Overview</button>
          <button className="filter-pill" id="adminTabBtn-attendees" onclick="switchAdminTab('attendees')">👤 Attendees</button>
          <button className="filter-pill" id="adminTabBtn-organizers" onclick="switchAdminTab('organizers')">🏢 Organizers</button>
          <button className="filter-pill" id="adminTabBtn-earnings" onclick="switchAdminTab('earnings')">💰 Organizer Earnings</button>
          <button className="filter-pill" id="adminTabBtn-events" onclick="switchAdminTab('events')">🎭 Events Moderation</button>
          <button className="filter-pill" id="adminTabBtn-attendance" onclick="switchAdminTab('attendance')">🎟️ Attendance</button>
          <button className="filter-pill" id="adminTabBtn-reviews" onclick="switchAdminTab('reviews')">⭐ Reviews & Ratings</button>
          <button className="filter-pill" id="adminTabBtn-payments" onclick="switchAdminTab('payments')">💳 Payments & Txns</button>
          <button className="filter-pill" id="adminTabBtn-finance" onclick="switchAdminTab('finance')">📈 Platform Finance</button>
          <button className="filter-pill" id="adminTabBtn-reports" onclick="switchAdminTab('reports')">🚩 Content Reports</button>
          <button className="filter-pill" id="adminTabBtn-categories" onclick="switchAdminTab('categories')">🏷️ Categories & Cities</button>
          <button className="filter-pill" id="adminTabBtn-broadcast" onclick="switchAdminTab('broadcast')">📢 Broadcast & Alerts</button>
          <button className="filter-pill" id="adminTabBtn-audit" onclick="switchAdminTab('audit')">📜 Audit & RBAC</button>
          <button className="filter-pill" id="adminTabBtn-settings" onclick="switchAdminTab('settings')">⚙️ Settings</button>
        </div>
      </div>

      {/* TAB 1: SYSTEM OVERVIEW */}
      <div id="adminTab-overview">
        {/* Date Filtering Toolbar */}
        <div className="sketch-box" style={{"padding":"12px 16px","marginBottom":"18px","background":"#ffffff"}}>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","flexWrap":"wrap","gap":"10px"}}>
            <div style={{"display":"flex","alignItems":"center","gap":"8px","flexWrap":"wrap"}}>
              <span style={{"fontWeight":"700","fontFamily":"var(--font-hand)","fontSize":"1.05rem"}}>📅 Filter Metrics By:</span>
              <button className="demo-pill active" id="admTimeFilterBtn-all" onclick="handleAdminOverviewTimeFilter('all')">All Time</button>
              <button className="demo-pill" id="admTimeFilterBtn-today" onclick="handleAdminOverviewTimeFilter('today')">Today</button>
              <button className="demo-pill" id="admTimeFilterBtn-7d" onclick="handleAdminOverviewTimeFilter('7d')">Last 7 Days</button>
              <button className="demo-pill" id="admTimeFilterBtn-30d" onclick="handleAdminOverviewTimeFilter('30d')">Last 30 Days</button>
              <button className="demo-pill" id="admTimeFilterBtn-this_month" onclick="handleAdminOverviewTimeFilter('this_month')">This Month</button>
              <button className="demo-pill" id="admTimeFilterBtn-this_year" onclick="handleAdminOverviewTimeFilter('this_year')">This Year</button>
            </div>
            <div style={{"display":"flex","gap":"6px","alignItems":"center","flexWrap":"wrap"}}>
              <input type="date" id="admCustomStartDate" className="sketch-input" style={{"padding":"4px 8px","fontSize":"0.88rem"}}/>
              <span style={{"fontSize":"0.88rem","color":"#666"}}>to</span>
              <input type="date" id="admCustomEndDate" className="sketch-input" style={{"padding":"4px 8px","fontSize":"0.88rem"}}/>
              <button type="button" className="btn-crayon-yellow" onclick="handleAdminCustomDateFilter()" style={{"padding":"4px 12px","fontSize":"0.88rem"}}>Apply Custom 🔍</button>
              <button type="button" className="btn-sketch-white" onclick="loadAdminOverview()" style={{"padding":"4px 10px","fontSize":"0.88rem"}}>🔄</button>
            </div>
          </div>
        </div>

        {/* 15 Live Database Statistics Cards */}
        <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit, minmax(210px, 1fr))","gap":"14px","marginBottom":"22px"}}>
          {/* 1. Registered Attendees */}
          <div className="sketch-box" style={{"background":"#e3f2fd","borderColor":"#1e90ff","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#0d47a1","textTransform":"uppercase"}}>1. Registered Attendees</div>
            <div id="admStatTotalAttendees" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#1565c0","margin":"4px 0"}}>0</div>
            <div id="admStatActiveAttendees" style={{"fontSize":"0.82rem","color":"#555"}}>0 Active Attendees</div>
          </div>
          {/* 2. Registered Organizers */}
          <div className="sketch-box" style={{"background":"#ede7f6","borderColor":"#673ab7","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#4527a0","textTransform":"uppercase"}}>2. Registered Organizers</div>
            <div id="admStatTotalOrganizers" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#512da8","margin":"4px 0"}}>0</div>
            <div id="admStatActiveOrganizers" style={{"fontSize":"0.82rem","color":"#555"}}>0 Active Organizers</div>
          </div>
          {/* 3. Total Events */}
          <div className="sketch-box" style={{"background":"#e8f5e9","borderColor":"#2e7d32","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#1b5e20","textTransform":"uppercase"}}>3. Total Events</div>
            <div id="admStatTotalEvents" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#2e7d32","margin":"4px 0"}}>0</div>
            <div id="admStatPublishedEvents" style={{"fontSize":"0.82rem","color":"#555"}}>0 Published • 0 Completed</div>
          </div>
          {/* 4. Moderation Queue */}
          <div className="sketch-box" style={{"background":"#fff8e1","borderColor":"#ffa000","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#e65100","textTransform":"uppercase"}}>4. Pending Review Events</div>
            <div id="admStatPendingEvents" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#f57c00","margin":"4px 0"}}>0</div>
            <div id="admStatCancelledEvents" style={{"fontSize":"0.82rem","color":"#555"}}>0 Cancelled Events</div>
          </div>
          {/* 5. Confirmed Bookings */}
          <div className="sketch-box" style={{"background":"#f3e5f5","borderColor":"#7b1fa2","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#4a148c","textTransform":"uppercase"}}>5. Confirmed Bookings</div>
            <div id="admStatConfirmedBookings" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#6a1b9a","margin":"4px 0"}}>0</div>
            <div id="admStatInterestedUsers" style={{"fontSize":"0.82rem","color":"#555"}}>0 Interested RSVPs</div>
          </div>
          {/* 6. Verified QR Attendance */}
          <div className="sketch-box" style={{"background":"#e0f2f1","borderColor":"#00796b","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#004d40","textTransform":"uppercase"}}>6. Verified Attendance</div>
            <div id="admStatVerifiedAttendance" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#00796b","margin":"4px 0"}}>0</div>
            <div style={{"fontSize":"0.82rem","color":"#555"}}>QR Scans Verified</div>
          </div>
          {/* 7. Gross Booking Value */}
          <div className="sketch-box" style={{"background":"#e8eaf6","borderColor":"#3f51b5","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#283593","textTransform":"uppercase"}}>7. Total Booking Value</div>
            <div id="admStatBookingValue" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#303f9f","margin":"4px 0"}}>₹0.00</div>
            <div style={{"fontSize":"0.82rem","color":"#666"}}>Gross Sales (Simulated)</div>
          </div>
          {/* 8. Organizer Earnings */}
          <div className="sketch-box" style={{"background":"#f1f8e9","borderColor":"#558b2f","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#33691e","textTransform":"uppercase"}}>8. Organizer Earnings</div>
            <div id="admStatOrganizerEarnings" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#388e3c","margin":"4px 0"}}>₹0.00</div>
            <div style={{"fontSize":"0.82rem","color":"#555"}}>Est. Net Organizers Pool</div>
          </div>
          {/* 9. Platform Commission Revenue */}
          <div className="sketch-box" style={{"background":"#e0f7fa","borderColor":"#00838f","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#006064","textTransform":"uppercase"}}>9. Platform Commission</div>
            <div id="admStatPlatformRevenue" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#00838f","margin":"4px 0"}}>₹0.00</div>
            <div id="admStatCommissionRateNotice" style={{"fontSize":"0.82rem","color":"#555"}}>5.0% Configured Fee</div>
          </div>
          {/* 10. Total Refunds */}
          <div className="sketch-box" style={{"background":"#ffebee","borderColor":"#c62828","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#b71540","textTransform":"uppercase"}}>10. Total Refunds</div>
            <div id="admStatTotalRefunds" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#c62828","margin":"4px 0"}}>₹0.00</div>
            <div style={{"fontSize":"0.82rem","color":"#666"}}>Processed Deductions</div>
          </div>
        </div>

        {/* Monthly Trends & Visual Chart */}
        <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit, minmax(340px, 1fr))","gap":"18px","marginBottom":"22px"}}>
          {/* Monthly Trend Graph Container */}
          <div className="sketch-box" style={{"padding":"18px","background":"#ffffff"}}>
            <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"12px"}}>
              <h3 style={{"margin":"0","fontSize":"1.25rem"}}>📈 Monthly Booking & Revenue Trajectory</h3>
              <span style={{"fontSize":"0.85rem","color":"#666","fontFamily":"var(--font-hand)"}}>Last 6 Months (MySQL)</span>
            </div>
            <div id="admMonthlyChartBox" style={{"minHeight":"180px","display":"flex","alignItems":"flex-end","gap":"14px","padding":"12px 6px","borderBottom":"2px solid #222"}}>
              <div style={{"color":"#777","width":"100%","textAlign":"center"}}>Loading monthly trends...</div>
            </div>
          </div>

          {/* Attendance Conversion Overview */}
          <div className="sketch-box" style={{"padding":"18px","background":"#ffffff"}}>
            <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"12px"}}>
              <h3 style={{"margin":"0","fontSize":"1.25rem"}}>🎟️ Attendance Conversion Breakdown</h3>
              <span style={{"fontSize":"0.85rem","color":"#666","fontFamily":"var(--font-hand)"}}>Verified Check-ins vs Bookings</span>
            </div>
            <div id="admAttendanceConversionBox" style={{"padding":"6px 0"}}>
              <div style={{"display":"flex","justifyContent":"space-between","marginBottom":"6px","fontSize":"0.95rem"}}>
                <span>Verified Attendance Rate:</span>
                <strong id="admOverviewAttRate" style={{"color":"#2e7d32"}}>0.0%</strong>
              </div>
              <div style={{"height":"18px","background":"#eee","borderRadius":"9px","overflow":"hidden","border":"1.5px solid #333","marginBottom":"14px"}}>
                <div id="admOverviewAttBar" style={{"height":"100%","width":"0%","background":"linear-gradient(90deg, #2e7d32, #8bc34a)","transition":"width 0.6s ease"}}></div>
              </div>
              <div style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"8px","fontSize":"0.9rem"}}>
                <div style={{"background":"#f9f9f9","padding":"8px 10px","borderRadius":"6px","border":"1px solid #ddd"}}>
                  <span style={{"color":"#555"}}>Confirmed Bookings:</span>
                  <div id="admOverviewConfirmedCount" style={{"fontSize":"1.2rem","fontWeight":"700"}}>0</div>
                </div>
                <div style={{"background":"#f9f9f9","padding":"8px 10px","borderRadius":"6px","border":"1px solid #ddd"}}>
                  <span style={{"color":"#555"}}>Valid QR Scans:</span>
                  <div id="admOverviewCheckinCount" style={{"fontSize":"1.2rem","fontWeight":"700","color":"#2e7d32"}}>0</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation Action Cards */}
        <div className="sketch-box" style={{"padding":"18px","background":"#fffcf2","borderColor":"#f9ca24"}}>
          <h3 style={{"fontSize":"1.25rem","marginBottom":"8px"}}>🛡️ Super Administrator Direct Action Hub</h3>
          <p style={{"fontSize":"0.92rem","color":"#444","lineHeight":"1.5","marginBottom":"12px"}}>
            Immediate access to manage user accounts, inspect event moderation requests, audit financial ledgers, or review community reports.
          </p>
          <div style={{"display":"flex","gap":"10px","flexWrap":"wrap"}}>
            <button className="btn-crayon-yellow" onclick="switchAdminTab('attendees')" style={{"padding":"6px 16px","fontSize":"0.95rem"}}>Manage Attendees 👤</button>
            <button className="btn-crayon-yellow" onclick="switchAdminTab('organizers')" style={{"padding":"6px 16px","fontSize":"0.95rem"}}>Manage Organizers 🏢</button>
            <button className="btn-sketch-white" onclick="switchAdminTab('earnings')" style={{"padding":"6px 16px","fontSize":"0.95rem"}}>Organizer Earnings 💰</button>
            <button className="btn-sketch-white" onclick="switchAdminTab('events')" style={{"padding":"6px 16px","fontSize":"0.95rem"}}>Moderate Events 🎭</button>
            <button className="btn-sketch-white" onclick="switchAdminTab('payments')" style={{"padding":"6px 16px","fontSize":"0.95rem"}}>Payments & Refunds 💳</button>
          </div>
        </div>
      </div>

      {/* TAB 2: ATTENDEES */}
      <div id="adminTab-attendees" className="hidden">
        <div className="sketch-box" style={{"padding":"14px 16px","marginBottom":"16px","background":"#fff"}}>
          <div style={{"display":"flex","gap":"10px","flexWrap":"wrap","alignItems":"center","justifyContent":"space-between"}}>
            <div style={{"display":"flex","gap":"8px","flex":"1","minWidth":"260px"}}>
              <input id="adminAttendeeSearchInput" type="text" className="sketch-input" placeholder="🔍 Search by attendee name, email, or user ID..." oninput="handleAdminAttendeeSearch()"/>
            </div>
            <div style={{"display":"flex","gap":"8px","flexWrap":"wrap","alignItems":"center"}}>
              <select id="adminAttendeeStatusFilter" className="sketch-input" style={{"width":"auto","padding":"5px 10px"}} onchange="loadAdminAttendees()">
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
              <button className="btn-sketch-white" onclick="loadAdminAttendees()" style={{"padding":"5px 12px"}}>🔄 Refresh</button>
            </div>
          </div>
        </div>

        <div className="sketch-box" style={{"overflowX":"auto","padding":"0"}}>
          <table style={{"width":"100%","borderCollapse":"collapse","fontSize":"0.92rem","textAlign":"left"}}>
            <thead>
              <tr style={{"borderBottom":"2px solid #222","background":"#fdf6d8"}}>
                <th style={{"padding":"10px"}}>ID</th>
                <th style={{"padding":"10px"}}>Attendee</th>
                <th style={{"padding":"10px"}}>Email</th>
                <th style={{"padding":"10px"}}>Phone (Masked)</th>
                <th style={{"padding":"10px"}}>City & State</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Bookings</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Attended</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Reviews</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Status</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Actions</th>
              </tr>
            </thead>
            <tbody id="adminAttendeesTableBody">
              <tr><td colspan="10" style={{"padding":"24px","textAlign":"center","color":"#777"}}>Loading attendees...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TAB 3: ORGANIZERS */}
      <div id="adminTab-organizers" className="hidden">
        <div className="sketch-box" style={{"padding":"14px 16px","marginBottom":"16px","background":"#fff"}}>
          <div style={{"display":"flex","gap":"10px","flexWrap":"wrap","alignItems":"center","justifyContent":"space-between"}}>
            <div style={{"display":"flex","gap":"8px","flex":"1","minWidth":"260px"}}>
              <input id="adminOrganizerSearchInput" type="text" className="sketch-input" placeholder="🔍 Search organizer by name, business, or email..." oninput="handleAdminOrganizerSearch()"/>
            </div>
            <div style={{"display":"flex","gap":"8px","flexWrap":"wrap","alignItems":"center"}}>
              <select id="adminOrganizerStatusFilter" className="sketch-input" style={{"width":"auto","padding":"5px 10px"}} onchange="loadAdminOrganizers()">
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
              <button className="btn-sketch-white" onclick="loadAdminOrganizers()" style={{"padding":"5px 12px"}}>🔄 Refresh</button>
            </div>
          </div>
        </div>

        <div className="sketch-box" style={{"overflowX":"auto","padding":"0"}}>
          <table style={{"width":"100%","borderCollapse":"collapse","fontSize":"0.92rem","textAlign":"left"}}>
            <thead>
              <tr style={{"borderBottom":"2px solid #222","background":"#fdf6d8"}}>
                <th style={{"padding":"10px"}}>ID</th>
                <th style={{"padding":"10px"}}>Organizer</th>
                <th style={{"padding":"10px"}}>Business / Community</th>
                <th style={{"padding":"10px"}}>Email</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Events</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Bookings</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Attendance</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Rating</th>
                <th style={{"padding":"10px","textAlign":"right"}}>Gross Sales</th>
                <th style={{"padding":"10px","textAlign":"right"}}>Net Earnings</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Status</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Actions</th>
              </tr>
            </thead>
            <tbody id="adminOrganizersTableBody">
              <tr><td colspan="12" style={{"padding":"24px","textAlign":"center","color":"#777"}}>Loading organizers...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TAB 4: ORGANIZER EARNINGS */}
      <div id="adminTab-earnings" className="hidden">
        {/* Razorpay Test Mode Warning Banner */}
        <div className="sketch-box" style={{"padding":"14px 18px","marginBottom":"16px","background":"#fff3e0","borderColor":"#ff9800","borderWidth":"2.5px"}}>
          <div style={{"display":"flex","alignItems":"flex-start","gap":"10px"}}>
            <div style={{"fontSize":"1.8rem","lineHeight":"1"}}>⚠️</div>
            <div>
              <strong style={{"fontSize":"1.05rem","color":"#e65100"}}>TEST / SIMULATED TRANSACTION DISCLOSURE:</strong>
              <div style={{"fontSize":"0.92rem","color":"#5d4037","marginTop":"4px","lineHeight":"1.4"}}>
                Meetior is currently configured in <strong>Razorpay Test Mode</strong>. All transaction amounts, commissions, and organizer earnings shown here are simulated figures based on verified test orders. Actual bank payouts and automated settlement transfers are not configured.
              </div>
            </div>
          </div>
        </div>

        <div className="sketch-box" style={{"padding":"14px 16px","marginBottom":"16px","background":"#fff"}}>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","flexWrap":"wrap","gap":"10px"}}>
            <div style={{"display":"flex","gap":"8px","flex":"1","minWidth":"240px"}}>
              <input id="adminEarningsSearchInput" type="text" className="sketch-input" placeholder="🔍 Search organizer..." oninput="handleAdminEarningsSearch()"/>
            </div>
            <div style={{"display":"flex","gap":"8px","alignItems":"center","flexWrap":"wrap"}}>
              <select id="adminEarningsTimeFilter" className="sketch-input" style={{"width":"auto","padding":"5px 10px"}} onchange="loadAdminEarnings()">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="this_month">This Month</option>
                <option value="this_year">This Year</option>
              </select>
              <button className="btn-crayon-green" onclick="exportAdminEarningsCSV()" style={{"padding":"5px 14px","fontSize":"0.92rem","cursor":"pointer"}}>
                📥 Export Earnings CSV
              </button>
              <button className="btn-sketch-white" onclick="loadAdminEarnings()" style={{"padding":"5px 10px"}}>🔄</button>
            </div>
          </div>
        </div>

        <div className="sketch-box" style={{"overflowX":"auto","padding":"0"}}>
          <table style={{"width":"100%","borderCollapse":"collapse","fontSize":"0.92rem","textAlign":"left"}}>
            <thead>
              <tr style={{"borderBottom":"2px solid #222","background":"#fdf6d8"}}>
                <th style={{"padding":"10px"}}>Organizer ID</th>
                <th style={{"padding":"10px"}}>Organizer Name</th>
                <th style={{"padding":"10px"}}>Business / Community</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Paid Bookings</th>
                <th style={{"padding":"10px","textAlign":"right"}}>Gross Sales</th>
                <th style={{"padding":"10px","textAlign":"right"}}>Refunds Deducted</th>
                <th style={{"padding":"10px","textAlign":"right"}}>Platform Fee (5%)</th>
                <th style={{"padding":"10px","textAlign":"right"}}>Net Est. Earnings</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Actual Payouts</th>
              </tr>
            </thead>
            <tbody id="adminEarningsTableBody">
              <tr><td colspan="9" style={{"padding":"24px","textAlign":"center","color":"#777"}}>Loading earnings ledger...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TAB 5: EVENTS MODERATION */}
      <div id="adminTab-events" className="hidden">
        <div className="sketch-box" style={{"padding":"14px 16px","marginBottom":"16px","background":"#fff"}}>
          <div style={{"display":"flex","gap":"10px","flexWrap":"wrap","alignItems":"center","justifyContent":"space-between"}}>
            <div style={{"display":"flex","gap":"8px","flex":"1","minWidth":"240px"}}>
              <input id="adminEventSearchInput" type="text" className="sketch-input" placeholder="🔍 Search event title or description..." oninput="handleAdminEventSearch()"/>
            </div>
            <div style={{"display":"flex","gap":"8px","flexWrap":"wrap","alignItems":"center"}}>
              <select id="adminEventModStatusFilter" className="sketch-input" style={{"width":"auto","padding":"5px 8px"}} onchange="loadAdminEvents()">
                <option value="all">All Moderation</option>
                <option value="Approved">Approved Only</option>
                <option value="Hidden">Hidden Only</option>
                <option value="UnderReview">Under Review Only</option>
              </select>
              <select id="adminEventLifecycleFilter" className="sketch-input" style={{"width":"auto","padding":"5px 8px"}} onchange="loadAdminEvents()">
                <option value="all">All Lifecycle</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <button className="btn-sketch-white" onclick="loadAdminEvents()" style={{"padding":"5px 12px"}}>🔄 Refresh</button>
            </div>
          </div>
        </div>

        <div className="sketch-box" style={{"overflowX":"auto","padding":"0"}}>
          <table style={{"width":"100%","borderCollapse":"collapse","fontSize":"0.92rem","textAlign":"left"}}>
            <thead>
              <tr style={{"borderBottom":"2px solid #222","background":"#fdf6d8"}}>
                <th style={{"padding":"10px"}}>ID</th>
                <th style={{"padding":"10px"}}>Event Title</th>
                <th style={{"padding":"10px"}}>Organizer</th>
                <th style={{"padding":"10px"}}>City</th>
                <th style={{"padding":"10px"}}>Date & Time</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Type & Price</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Bookings / Cap</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Lifecycle</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Moderation</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Actions</th>
              </tr>
            </thead>
            <tbody id="adminEventsTableBody">
              <tr><td colspan="10" style={{"padding":"24px","textAlign":"center","color":"#777"}}>Loading events...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TAB 6: ACTUAL ATTENDANCE */}
      <div id="adminTab-attendance" className="hidden">
        <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit, minmax(210px, 1fr))","gap":"14px","marginBottom":"18px"}}>
          <div className="sketch-box" style={{"background":"#e8f5e9","borderColor":"#2e7d32","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#1b5e20","textTransform":"uppercase"}}>Total Verified Check-Ins</div>
            <div id="admAttSummaryCheckins" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#2e7d32","margin":"4px 0"}}>0</div>
            <div style={{"fontSize":"0.82rem","color":"#555"}}>Valid QR Pass Scans</div>
          </div>
          <div className="sketch-box" style={{"background":"#e3f2fd","borderColor":"#1565c0","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#0d47a1","textTransform":"uppercase"}}>Total Eligible Bookings</div>
            <div id="admAttSummaryBookings" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#1565c0","margin":"4px 0"}}>0</div>
            <div style={{"fontSize":"0.82rem","color":"#555"}}>Confirmed Ticket Holders</div>
          </div>
          <div className="sketch-box" style={{"background":"#fff3e0","borderColor":"#e65100","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#bf360c","textTransform":"uppercase"}}>Overall Attendance Rate</div>
            <div id="admAttSummaryRate" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#e65100","margin":"4px 0"}}>0.0%</div>
            <div style={{"fontSize":"0.82rem","color":"#555"}}>Turnout Percentage</div>
          </div>
          <div className="sketch-box" style={{"background":"#ffebee","borderColor":"#c62828","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#b71540","textTransform":"uppercase"}}>Calculated No-Shows</div>
            <div id="admAttSummaryNoShows" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#c62828","margin":"4px 0"}}>0</div>
            <div style={{"fontSize":"0.82rem","color":"#555"}}>Ended Events Only</div>
          </div>
        </div>

        <div className="sketch-box" style={{"padding":"14px 16px","marginBottom":"16px","background":"#fff"}}>
          <div style={{"display":"flex","gap":"10px","flexWrap":"wrap","alignItems":"center","justifyContent":"space-between"}}>
            <div style={{"display":"flex","gap":"8px","flex":"1","minWidth":"240px"}}>
              <input id="adminAttendanceSearchInput" type="text" className="sketch-input" placeholder="🔍 Search event or organizer..." oninput="handleAdminAttendanceSearch()"/>
            </div>
            <div style={{"display":"flex","gap":"8px","alignItems":"center","flexWrap":"wrap"}}>
              <button className="btn-crayon-green" onclick="exportAdminAttendanceCSV()" style={{"padding":"5px 14px","fontSize":"0.92rem","cursor":"pointer"}}>
                📥 Export Attendance CSV
              </button>
              <button className="btn-sketch-white" onclick="loadAdminAttendance()" style={{"padding":"5px 10px"}}>🔄</button>
            </div>
          </div>
        </div>

        <div className="sketch-box" style={{"overflowX":"auto","padding":"0"}}>
          <table style={{"width":"100%","borderCollapse":"collapse","fontSize":"0.92rem","textAlign":"left"}}>
            <thead>
              <tr style={{"borderBottom":"2px solid #222","background":"#fdf6d8"}}>
                <th style={{"padding":"10px"}}>ID</th>
                <th style={{"padding":"10px"}}>Event Title</th>
                <th style={{"padding":"10px"}}>Organizer</th>
                <th style={{"padding":"10px"}}>Event Date</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Capacity</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Confirmed Bookings</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Valid Check-Ins</th>
                <th style={{"padding":"10px","textAlign":"center"}}>No-Shows</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Attendance Rate</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Status</th>
              </tr>
            </thead>
            <tbody id="adminAttendanceTableBody">
              <tr><td colspan="10" style={{"padding":"24px","textAlign":"center","color":"#777"}}>Loading attendance data...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TAB 7: REVIEWS & RATINGS */}
      <div id="adminTab-reviews" className="hidden">
        <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit, minmax(280px, 1fr))","gap":"16px","marginBottom":"18px"}}>
          <div className="sketch-box" style={{"padding":"16px","background":"#fff","textAlign":"center"}}>
            <div style={{"fontSize":"0.85rem","fontWeight":"700","color":"#555","textTransform":"uppercase"}}>Average Platform Rating</div>
            <div id="admRevSummaryAvg" style={{"fontSize":"3rem","fontWeight":"800","color":"#f59f00","margin":"4px 0"}}>0.0</div>
            <div id="admRevSummaryTotal" style={{"fontSize":"0.9rem","color":"#666"}}>Based on 0 submitted reviews</div>
          </div>
          <div className="sketch-box" style={{"padding":"16px","background":"#fff"}}>
            <h4 style={{"margin":"0 0 10px","fontSize":"1.05rem"}}>Rating Distribution (5★ to 1★)</h4>
            <div id="admRevDistContainer" style={{"display":"flex","flexDirection":"column","gap":"6px","fontSize":"0.88rem"}}>
              <div>Loading rating breakdown...</div>
            </div>
          </div>
        </div>

        <div className="sketch-box" style={{"padding":"14px 16px","marginBottom":"16px","background":"#fff"}}>
          <div style={{"display":"flex","gap":"10px","flexWrap":"wrap","alignItems":"center","justifyContent":"space-between"}}>
            <div style={{"display":"flex","gap":"8px","flex":"1","minWidth":"240px"}}>
              <input id="adminReviewSearchInput" type="text" className="sketch-input" placeholder="🔍 Search review text, attendee, or event..." oninput="handleAdminReviewSearch()"/>
            </div>
            <div style={{"display":"flex","gap":"8px","alignItems":"center","flexWrap":"wrap"}}>
              <select id="adminReviewRatingFilter" className="sketch-input" style={{"width":"auto","padding":"5px 8px"}} onchange="loadAdminReviews()">
                <option value="all">All Star Ratings</option>
                <option value="5">5 Stars Only</option>
                <option value="4">4 Stars Only</option>
                <option value="3">3 Stars Only</option>
                <option value="2">2 Stars Only</option>
                <option value="1">1 Star Only</option>
              </select>
              <select id="adminReviewStatusFilter" className="sketch-input" style={{"width":"auto","padding":"5px 8px"}} onchange="loadAdminReviews()">
                <option value="all">All Moderation</option>
                <option value="approved">Approved</option>
                <option value="flagged">Flagged</option>
                <option value="hidden">Hidden</option>
              </select>
              <button className="btn-sketch-white" onclick="loadAdminReviews()" style={{"padding":"5px 12px"}}>🔄 Refresh</button>
            </div>
          </div>
        </div>

        <div className="sketch-box" style={{"overflowX":"auto","padding":"0"}}>
          <table style={{"width":"100%","borderCollapse":"collapse","fontSize":"0.92rem","textAlign":"left"}}>
            <thead>
              <tr style={{"borderBottom":"2px solid #222","background":"#fdf6d8"}}>
                <th style={{"padding":"10px"}}>ID</th>
                <th style={{"padding":"10px"}}>Event Title</th>
                <th style={{"padding":"10px"}}>Organizer</th>
                <th style={{"padding":"10px"}}>Attendee</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Rating</th>
                <th style={{"padding":"10px"}}>Review Comment</th>
                <th style={{"padding":"10px"}}>Date</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Status</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Actions</th>
              </tr>
            </thead>
            <tbody id="adminReviewsTableBody">
              <tr><td colspan="9" style={{"padding":"24px","textAlign":"center","color":"#777"}}>Loading reviews...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TAB 8: PAYMENTS & TXNS */}
      <div id="adminTab-payments" className="hidden">
        <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit, minmax(210px, 1fr))","gap":"14px","marginBottom":"18px"}}>
          <div className="sketch-box" style={{"background":"#e8f5e9","borderColor":"#2e7d32","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#1b5e20","textTransform":"uppercase"}}>Gross Payments Processed</div>
            <div id="admPaySummaryProcessed" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#2e7d32","margin":"4px 0"}}>₹0.00</div>
            <div style={{"fontSize":"0.82rem","color":"#555"}}>Completed Transactions</div>
          </div>
          <div className="sketch-box" style={{"background":"#ffebee","borderColor":"#c62828","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#b71540","textTransform":"uppercase"}}>Total Amount Refunded</div>
            <div id="admPaySummaryRefunded" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#c62828","margin":"4px 0"}}>₹0.00</div>
            <div style={{"fontSize":"0.82rem","color":"#555"}}>Verified Reversals</div>
          </div>
          <div className="sketch-box" style={{"background":"#e3f2fd","borderColor":"#1565c0","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#0d47a1","textTransform":"uppercase"}}>Net Settled Balance</div>
            <div id="admPaySummaryNet" style={{"fontSize":"2.1rem","fontWeight":"800","color":"#1565c0","margin":"4px 0"}}>₹0.00</div>
            <div style={{"fontSize":"0.82rem","color":"#555"}}>Gross Processed − Refunds</div>
          </div>
          <div className="sketch-box" style={{"background":"#fff3e0","borderColor":"#e65100","padding":"14px","textAlign":"center"}}>
            <div style={{"fontSize":"0.82rem","fontWeight":"700","color":"#bf360c","textTransform":"uppercase"}}>Gateway Mode</div>
            <div style={{"fontSize":"1.5rem","fontWeight":"800","color":"#e65100","margin":"8px 0"}}>Razorpay Sandbox</div>
            <div style={{"fontSize":"0.82rem","color":"#777"}}>TEST / SIMULATED</div>
          </div>
        </div>

        <div className="sketch-box" style={{"padding":"14px 16px","marginBottom":"16px","background":"#fff"}}>
          <div style={{"display":"flex","gap":"10px","flexWrap":"wrap","alignItems":"center","justifyContent":"space-between"}}>
            <div style={{"display":"flex","gap":"8px","flex":"1","minWidth":"240px"}}>
              <input id="adminPaymentSearchInput" type="text" className="sketch-input" placeholder="🔍 Search txn ID, order ID, or attendee..." oninput="handleAdminPaymentSearch()"/>
            </div>
            <div style={{"display":"flex","gap":"8px","alignItems":"center","flexWrap":"wrap"}}>
              <select id="adminPaymentStatusFilter" className="sketch-input" style={{"width":"auto","padding":"5px 8px"}} onchange="loadAdminPayments()">
                <option value="all">All Payment Statuses</option>
                <option value="Completed">Completed Only</option>
                <option value="Refunded">Refunded Only</option>
                <option value="Pending">Pending Only</option>
                <option value="Failed">Failed Only</option>
              </select>
              <button className="btn-crayon-green" onclick="exportAdminPaymentsCSV()" style={{"padding":"5px 14px","fontSize":"0.92rem","cursor":"pointer"}}>
                📥 Export Txns CSV
              </button>
              <button className="btn-sketch-white" onclick="loadAdminPayments()" style={{"padding":"5px 10px"}}>🔄</button>
            </div>
          </div>
        </div>

        <div className="sketch-box" style={{"overflowX":"auto","padding":"0"}}>
          <table style={{"width":"100%","borderCollapse":"collapse","fontSize":"0.92rem","textAlign":"left"}}>
            <thead>
              <tr style={{"borderBottom":"2px solid #222","background":"#fdf6d8"}}>
                <th style={{"padding":"10px"}}>Txn ID</th>
                <th style={{"padding":"10px"}}>Booking Ref</th>
                <th style={{"padding":"10px"}}>Event Title</th>
                <th style={{"padding":"10px"}}>Attendee</th>
                <th style={{"padding":"10px","textAlign":"right"}}>Amount</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Status</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Gateway</th>
                <th style={{"padding":"10px","textAlign":"center"}}>Mode</th>
                <th style={{"padding":"10px"}}>Date & Time</th>
              </tr>
            </thead>
            <tbody id="adminPaymentsTableBody">
              <tr><td colspan="9" style={{"padding":"24px","textAlign":"center","color":"#777"}}>Loading payments...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TAB 9: PLATFORM FINANCE */}
      <div id="adminTab-finance" className="hidden">
        <div className="sketch-box" style={{"padding":"16px","marginBottom":"18px","background":"#fff"}}>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","flexWrap":"wrap","gap":"10px"}}>
            <div>
              <h3 style={{"margin":"0","fontSize":"1.35rem"}}>📈 Platform Financial Settlements & Revenue Breakdown</h3>
              <p style={{"margin":"4px 0 0","fontSize":"0.9rem","color":"#666"}}>Comprehensive platform accounting from real database transaction records.</p>
            </div>
            <button className="btn-sketch-white" onclick="loadAdminFinanceReports()" style={{"padding":"5px 12px"}}>🔄 Refresh Financials</button>
          </div>
        </div>

        <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit, minmax(240px, 1fr))","gap":"16px","marginBottom":"20px"}}>
          <div className="sketch-box" style={{"background":"#e8f5e9","borderColor":"#2e7d32","padding":"18px","textAlign":"center"}}>
            <div style={{"fontSize":"0.85rem","fontWeight":"700","color":"#1b5e20","textTransform":"uppercase"}}>Gross Ticket Sales</div>
            <div id="admFinGrossSales" style={{"fontSize":"2.3rem","fontWeight":"800","color":"#2e7d32","margin":"4px 0"}}>₹0.00</div>
            <div style={{"fontSize":"0.85rem","color":"#555"}}>All Completed Bookings</div>
          </div>
          <div className="sketch-box" style={{"background":"#ffebee","borderColor":"#c62828","padding":"18px","textAlign":"center"}}>
            <div style={{"fontSize":"0.85rem","fontWeight":"700","color":"#b71540","textTransform":"uppercase"}}>Total Refunds Deducted</div>
            <div id="admFinTotalRefunds" style={{"fontSize":"2.3rem","fontWeight":"800","color":"#c62828","margin":"4px 0"}}>₹0.00</div>
            <div style={{"fontSize":"0.85rem","color":"#555"}}>Attendee Cancellation Refunds</div>
          </div>
          <div className="sketch-box" style={{"background":"#e0f7fa","borderColor":"#00838f","padding":"18px","textAlign":"center"}}>
            <div style={{"fontSize":"0.85rem","fontWeight":"700","color":"#006064","textTransform":"uppercase"}}>Platform Commission Pool</div>
            <div id="admFinCommission" style={{"fontSize":"2.3rem","fontWeight":"800","color":"#00838f","margin":"4px 0"}}>₹0.00</div>
            <div style={{"fontSize":"0.85rem","color":"#555"}}>5.0% Meetior Platform Fee</div>
          </div>
          <div className="sketch-box" style={{"background":"#ede7f6","borderColor":"#673ab7","padding":"18px","textAlign":"center"}}>
            <div style={{"fontSize":"0.85rem","fontWeight":"700","color":"#4527a0","textTransform":"uppercase"}}>Organizer Payout Pool</div>
            <div id="admFinOrganizerPool" style={{"fontSize":"2.3rem","fontWeight":"800","color":"#512da8","margin":"4px 0"}}>₹0.00</div>
            <div style={{"fontSize":"0.85rem","color":"#555"}}>Gross − Refunds − Commission</div>
          </div>
        </div>

        <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit, minmax(320px, 1fr))","gap":"18px"}}>
          <div className="sketch-box" style={{"padding":"18px","background":"#ffffff"}}>
            <h4 style={{"margin":"0 0 12px","fontSize":"1.15rem"}}>🏆 Top 5 Grossing Events</h4>
            <div id="admFinTopEventsList" style={{"display":"flex","flexDirection":"column","gap":"8px"}}>
              <div style={{"color":"#777"}}>Loading top events...</div>
            </div>
          </div>
          <div className="sketch-box" style={{"padding":"18px","background":"#ffffff"}}>
            <h4 style={{"margin":"0 0 12px","fontSize":"1.15rem"}}>🎟️ Paid vs. Free Events Composition</h4>
            <div id="admFinRatioBox" style={{"padding":"8px 0"}}>
              <div style={{"color":"#777"}}>Loading event ratios...</div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 10: REPORTS */}
      <div id="adminTab-reports" className="hidden">
        <div className="sketch-box" style={{"padding":"14px 16px","marginBottom":"16px","background":"#fff"}}>
          <div style={{"display":"flex","gap":"10px","flexWrap":"wrap","alignItems":"center","justifyContent":"space-between"}}>
            <div style={{"display":"flex","gap":"8px","alignItems":"center"}}>
              <label style={{"fontFamily":"var(--font-hand)","fontWeight":"700"}}>Filter by Status:</label>
              <select id="adminReportStatusFilter" className="sketch-input" style={{"width":"auto","padding":"4px 8px"}} onchange="loadAdminReports()">
                <option value="all">All Reports</option>
                <option value="pending" selected>Pending Review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            <button className="btn-sketch-white" onclick="loadAdminReports()" style={{"padding":"5px 12px"}}>🔄 Refresh</button>
          </div>
        </div>

        <div id="adminReportsContainer" style={{"display":"flex","flexDirection":"column","gap":"12px"}}>
          <div className="sketch-box" style={{"padding":"20px","textAlign":"center","color":"#777"}}>Loading reports...</div>
        </div>
      </div>

      {/* TAB 11: CATEGORIES & LOCATION AUDIT */}
      <div id="adminTab-categories" className="hidden">
        <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit, minmax(280px, 1fr))","gap":"18px","marginBottom":"20px"}}>
          <div className="sketch-box" style={{"padding":"18px","background":"#fff"}}>
            <h3 style={{"fontSize":"1.25rem","marginBottom":"12px"}}>🏷️ Add New Category</h3>
            <form onsubmit="handleCreateCategory(event)">
              <div style={{"marginBottom":"10px"}}>
                <label className="field-label">Category Name <span className="req-star">*</span></label>
                <input id="newCategoryName" type="text" className="sketch-input" placeholder="e.g. Heritage & History" required/>
              </div>
              <div style={{"marginBottom":"14px"}}>
                <label className="field-label">Category Icon / Emoji</label>
                <input id="newCategoryIcon" type="text" className="sketch-input" placeholder="e.g. 🏛️" value="🎪"/>
              </div>
              <button type="submit" className="btn-crayon-yellow" style={{"padding":"8px 20px"}}>Create Category ➕</button>
            </form>
          </div>

          <div className="sketch-box" style={{"padding":"18px","background":"#fff"}}>
            <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"12px"}}>
              <h3 style={{"fontSize":"1.25rem","margin":"0"}}>Active Categories</h3>
              <button className="btn-sketch-white" onclick="loadAdminCategories()" style={{"padding":"3px 8px","fontSize":"0.85rem"}}>🔄</button>
            </div>
            <div id="adminCategoriesList" style={{"display":"flex","flexDirection":"column","gap":"8px","maxHeight":"280px","overflowY":"auto"}}>
              <div style={{"color":"#777"}}>Loading categories...</div>
            </div>
          </div>
        </div>

        <div className="sketch-box" style={{"padding":"18px","background":"#fff"}}>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"12px"}}>
            <div>
              <h3 style={{"margin":"0","fontSize":"1.25rem"}}>📍 Geographic & Location Audit</h3>
              <span style={{"fontSize":"0.85rem","color":"#666"}}>Verification of Indian States, Districts, and Cities in MySQL database.</span>
            </div>
            <button className="btn-sketch-white" onclick="loadAdminLocationAudit()" style={{"padding":"4px 10px","fontSize":"0.85rem"}}>🔄 Run Audit</button>
          </div>
          <div id="adminLocationAuditBox" style={{"fontSize":"0.92rem","color":"#444"}}>
            <div style={{"color":"#777"}}>Click "Run Audit" to inspect location database integrity...</div>
          </div>
        </div>
      </div>

      {/* TAB 12: BROADCAST & ALERTS */}
      <div id="adminTab-broadcast" className="hidden">
        <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit, minmax(320px, 1fr))","gap":"18px"}}>
          <div className="sketch-box" style={{"padding":"20px","background":"#fff"}}>
            <h3 style={{"fontSize":"1.3rem","marginBottom":"8px"}}>📢 Broadcast Platform Announcement</h3>
            <p style={{"fontSize":"0.88rem","color":"#666","marginBottom":"14px"}}>
              Send global alerts, emergency notices, or festival greetings. Notifications are saved directly into the MySQL database.
            </p>
            <form onsubmit="handleSendAdminBroadcast(event)">
              <div style={{"marginBottom":"12px"}}>
                <label className="field-label">Target Audience <span className="req-star">*</span></label>
                <select id="adminBroadcastTarget" className="sketch-input" style={{"width":"100%"}}>
                  <option value="all">🌐 All Users (Attendees + Organizers)</option>
                  <option value="attendees">👤 Attendees Only</option>
                  <option value="organizers">🏢 Organizers Only</option>
                </select>
              </div>
              <div style={{"marginBottom":"12px"}}>
                <label className="field-label">Announcement Title <span className="req-star">*</span></label>
                <input id="adminBroadcastTitle" type="text" className="sketch-input" placeholder="e.g. Meetior Festive Update 2026 🎉" required/>
              </div>
              <div style={{"marginBottom":"14px"}}>
                <label className="field-label">Notification Message <span className="req-star">*</span></label>
                <textarea id="adminBroadcastMessage" className="sketch-input" rows="4" placeholder="Enter broadcast message details..." style={{"width":"100%","resize":"vertical"}} required></textarea>
              </div>
              <button id="adminBroadcastSubmitBtn" type="submit" className="btn-crayon-yellow" style={{"padding":"9px 24px","fontSize":"1.05rem"}}>
                Send Announcement 🚀
              </button>
            </form>
          </div>

          <div className="sketch-box" style={{"padding":"20px","background":"#fff"}}>
            <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"10px"}}>
              <h3 style={{"fontSize":"1.3rem","margin":"0"}}>🚨 System Critical Alerts</h3>
              <button className="btn-sketch-white" onclick="loadAdminAlerts()" style={{"padding":"3px 8px","fontSize":"0.85rem"}}>🔄</button>
            </div>
            <p style={{"fontSize":"0.88rem","color":"#666","marginBottom":"12px"}}>
              Live indicators requiring immediate administrative review.
            </p>
            <div id="adminAlertsList" style={{"display":"flex","flexDirection":"column","gap":"8px"}}>
              <div style={{"color":"#777"}}>Loading system alerts...</div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 13: AUDIT TRAIL & RBAC */}
      <div id="adminTab-audit" className="hidden">
        <div className="sketch-box" style={{"padding":"16px","marginBottom":"18px","background":"#fff"}}>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","flexWrap":"wrap","gap":"10px","marginBottom":"12px"}}>
            <div>
              <h3 style={{"margin":"0","fontSize":"1.25rem"}}>🔐 Role-Based Access Control (RBAC)</h3>
              <span style={{"fontSize":"0.85rem","color":"#666"}}>Granular permissions matrix for administrative staff.</span>
            </div>
            <button className="btn-crayon-yellow" onclick="openNewAdminModal()" style={{"padding":"6px 16px","fontSize":"0.92rem"}}>
              ➕ Provision New Administrator
            </button>
          </div>
          <div id="adminRbacMatrixBox" style={{"fontSize":"0.9rem","overflowX":"auto"}}>
            <div style={{"color":"#777"}}>Loading RBAC permissions matrix...</div>
          </div>
        </div>

        <div className="sketch-box" style={{"padding":"14px 16px","marginBottom":"16px","background":"#fff","display":"flex","justifyContent":"space-between","alignItems":"center","flexWrap":"wrap","gap":"10px"}}>
          <div>
            <h3 style={{"margin":"0","fontSize":"1.2rem"}}>📜 Immutable Administrator Audit Trail</h3>
            <span style={{"fontSize":"0.85rem","color":"#666"}}>Cryptographically verified record of governance and moderation actions with IP tracking.</span>
          </div>
          <button className="btn-sketch-white" onclick="loadAdminAuditLogs()" style={{"padding":"5px 12px"}}>🔄 Refresh Logs</button>
        </div>

        <div className="sketch-box" style={{"overflowX":"auto","padding":"0"}}>
          <table style={{"width":"100%","borderCollapse":"collapse","fontSize":"0.9rem","textAlign":"left"}}>
            <thead>
              <tr style={{"borderBottom":"2px solid #222","background":"#fdf6d8"}}>
                <th style={{"padding":"10px"}}>Timestamp</th>
                <th style={{"padding":"10px"}}>Administrator</th>
                <th style={{"padding":"10px"}}>Action</th>
                <th style={{"padding":"10px"}}>Target Type</th>
                <th style={{"padding":"10px"}}>Target ID</th>
                <th style={{"padding":"10px"}}>Reason / Resolution Notes</th>
                <th style={{"padding":"10px"}}>IP Address</th>
              </tr>
            </thead>
            <tbody id="adminAuditTableBody">
              <tr><td colspan="7" style={{"padding":"24px","textAlign":"center","color":"#777"}}>Loading audit logs...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TAB 14: PLATFORM SETTINGS */}
      <div id="adminTab-settings" className="hidden">
        <div className="sketch-box" style={{"maxWidth":"720px","margin":"0 auto","padding":"22px","background":"#fff"}}>
          <h3 style={{"fontSize":"1.35rem","marginBottom":"6px"}}>⚙️ Platform Global Governance & Financial Settings</h3>
          <p style={{"fontSize":"0.9rem","color":"#666","marginBottom":"18px"}}>
            Configure platform policies, financial fee deduction models, and event moderation rules. Values are stored securely in MySQL.
          </p>

          <form onsubmit="handleSavePlatformSettings(event)">
            <div style={{"marginBottom":"14px"}}>
              <label className="field-label">Platform Fee Commission (%) <span className="req-star">*</span></label>
              <input id="settingCommissionPercent" type="number" step="0.1" min="0" max="50" className="sketch-input" style={{"width":"100%"}} value="5.0" required/>
              <span style={{"fontSize":"0.82rem","color":"#666"}}>Deducted from gross booking revenue before net organizer earnings calculation.</span>
            </div>

            <div style={{"marginBottom":"14px"}}>
              <label className="field-label">Event Auto-Approval Policy</label>
              <select id="settingAutoApproveEvents" className="sketch-input" style={{"width":"100%"}}>
                <option value="true">Enable Auto-Approval (Instantly Published)</option>
                <option value="false">Require Administrator Moderation Review</option>
              </select>
              <span style={{"fontSize":"0.82rem","color":"#666"}}>When disabled, newly created events remain UnderReview until approved.</span>
            </div>

            <div style={{"marginBottom":"14px"}}>
              <label className="field-label">Attendee Review Restriction Policy</label>
              <select id="settingReviewPolicy" className="sketch-input" style={{"width":"100%"}}>
                <option value="verified_attendees_only">Verified Attendees Only (Must have valid QR check-in)</option>
                <option value="all_confirmed_bookings">All Confirmed Booking Holders</option>
              </select>
              <span style={{"fontSize":"0.82rem","color":"#666"}}>Ensures authentic reviews from genuine physical attendees.</span>
            </div>

            <div style={{"marginBottom":"18px"}}>
              <label className="field-label">Booking Cancellation Cutoff Window (Hours)</label>
              <input id="settingCancellationHours" type="number" step="1" min="1" max="168" className="sketch-input" style={{"width":"100%"}} value="24" required/>
              <span style={{"fontSize":"0.82rem","color":"#666"}}>Attendees cannot cancel passes within this window before event start.</span>
            </div>

            <button id="saveSettingsBtn" type="submit" className="btn-crayon-yellow" style={{"padding":"10px 24px","fontSize":"1.1rem"}}>
              Save Platform Settings 💾
            </button>
          </form>
        </div>
      </div>
    </section>

    {/* =========================================================
         VIEW 13: ORGANIZER'S MY EVENTS MANAGEMENT
         ========================================================= */}
    </>
  );
}
