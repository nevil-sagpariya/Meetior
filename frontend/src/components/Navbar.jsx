import React from 'react';

/**
 * Navbar Component
 * Navigation header with branding, city picker badge, wallet balance, and user profile menus.
 */
export default function Navbar({ currentUser, currentView, navigateTo, onOpenWallet, onOpenCityPicker }) {
  const isOrg = Boolean(currentUser && currentUser.role === 'Organizer');
  const isAdmin = Boolean(currentUser && currentUser.role === 'Admin');

  return (
    <>
  <header id="topNavbar" className="top-navbar">
    <div className="nav-left">
      <a className="brand-logo" onclick="navigateTo('home')">
        <svg width="88" height="30" viewBox="0 0 120 42">
          <circle cx="38" cy="21" r="13" fill="#fff" stroke="#228be6" stroke-width="2.5"/>
          <path d="M33 19 Q35 17 37 19 M41 19 Q43 17 45 19 M34 25 Q38 29 43 25" fill="none" stroke="#228be6" stroke-width="2"/>
          <circle cx="60" cy="21" r="13" fill="#fff" stroke="#82c91e" stroke-width="2.5"/>
          <path d="M55 19 Q57 17 59 19 M63 19 Q65 17 67 19 M56 25 Q60 29 65 25" fill="none" stroke="#82c91e" stroke-width="2"/>
          <circle cx="82" cy="21" r="13" fill="#fff" stroke="#fab005" stroke-width="2.5"/>
          <path d="M77 19 Q79 17 81 19 M85 19 Q87 17 89 19 M78 25 Q82 29 87 25" fill="none" stroke="#fab005" stroke-width="2"/>
        </svg>
        <div className="brand-wordmark">
          <span className="m-blue">M</span><span className="e-green">E</span><span className="e-green">E</span><span className="t-yellow">T</span><span className="i-orange">I</span><span className="o-red">O</span><span className="r-teal">R</span>
        </div>
      </a>

      {/* BookMyShow-style Browsing City Selector & Day/Night Theme Toggle */}
      <div className="nav-city-theme-group" style={{"display":"flex","alignItems":"center","gap":"8px","flexShrink":"0"}}>
        <button id="navCityBtn" className="btn-city-select" onclick="openCityPickerModal()" title="Change Browsing City">
          <span>📍</span>
          <strong id="navCurrentCityLabel">Ahmedabad</strong>
          <span style={{"fontSize":"0.75rem"}}>▼</span>
        </button>

        <button id="themeToggleBtn" className="btn-theme-toggle" onclick="toggleThemeManual()" title="Toggle Day / Night Sky">
          <span id="themeToggleIcon">🌙</span>
          <span id="themeToggleLabel">Night</span>
        </button>
      </div>
    </div>
    <div id="navCenterTagline" className="nav-tagline">Find what's happening near you!!</div>

    <div id="navGuestActions" className="nav-actions">
      <button className="btn-sketch-white" onclick="navigateTo('register')">Register</button>
      <button className="btn-crayon-yellow" onclick="navigateTo('login')">Log In</button>
    </div>

    <div id="navUserActions" className="organizer-profile hidden">
      <a className="org-dash-link" id="navBookingsLink" onclick="navigateTo('bookings')">My Bookings</a>
      <a className="org-dash-link" id="navSavedLink" onclick="navigateTo('saved')">Saved</a>
      <a className="org-dash-link" id="navDemandLink" onclick="navigateTo('demands')">Demand Engine</a>
      <a className="org-dash-link organizer-only" id="navMyEventsLink" onclick="navigateTo('my-events')" style={{"display":"none","color":"#d35400","fontWeight":"700"}}>My Events 📋</a>
      <a className="org-dash-link organizer-only" id="navCreateLink" onclick="navigateTo('create')" style={{"display":"none"}}>+ Create Event</a>
      <a className="org-dash-link organizer-only" id="navScannerLink" onclick="navigateTo('scanner')" style={{"display":"none","color":"#b71540"}}>Scan Passes 📷</a>
      <a className="org-dash-link organizer-only" id="navRevenueLink" onclick="navigateTo('revenue')" style={{"display":"none","color":"#2e7d32","fontWeight":"700"}}>Revenue 💰</a>
      <a className="org-dash-link admin-only" id="navAdminLink" onclick="navigateTo('admin')" style={{"display":"none","color":"#1e90ff","fontWeight":"700"}}>Admin 🛡️</a>
      <button type="button" id="navDemoWalletBadge" onclick="openWalletModal()" className="btn-sketch-white attendee-only" title="Open Meetior Demo Wallet" style={{"padding":"4px 10px","fontSize":"0.88rem","background":"#eef9f2","borderColor":"#27ae60","color":"#1b5e20","fontWeight":"700","cursor":"pointer","display":"none"}}>
        👛 Wallet: ₹5,000
      </button>
      <button className="filter-pill" onclick="navigateTo('notifications')" style={{"padding":"4px 10px","cursor":"pointer","border":"2px solid #8e8b82"}} title="Notifications">
        🔔 <span id="notifBadge" style={{"background":"#b71540","color":"#fff","borderRadius":"999px","padding":"1px 6px","fontSize":"0.8rem","display":"none"}}>0</span>
      </button>
      <div className="user-badge" onclick="navigateTo('profile')" title="View Your Profile" style={{"cursor":"pointer"}}>
        <div className="user-avatar">
          <svg viewBox="0 0 50 50" width="40" height="40">
            <circle cx="25" cy="22" r="11" fill="#f3d2b3" stroke="#444" stroke-width="1.8"/>
            <path d="M14 20 Q25 8 36 20" fill="#4a3b32"/>
            <circle cx="21" cy="21" r="1.5" fill="#222"/>
            <circle cx="29" cy="21" r="1.5" fill="#222"/>
            <path d="M21 26 Q25 29 29 26" fill="none" stroke="#444" stroke-width="1.6"/>
            <path d="M12 46 Q25 34 38 46" fill="#78b833" stroke="#444" stroke-width="1.8"/>
          </svg>
        </div>
        <div className="user-info">
          <strong id="navUserName">Organizer</strong>
          <span id="navUserRole">(Organizer)</span>
        </div>
      </div>
      <button type="button" className="btn-sketch-white" onclick="handleUserLogout()" title="Log Out" style={{"padding":"4px 10px","marginLeft":"6px","fontSize":"0.92rem","color":"#b71540","borderColor":"#b71540","cursor":"pointer"}}>
        Log Out 🚪
      </button>
    </div>
  </header>
    </>
  );
}
