import React, { useState } from 'react';

/**
 * DemoShortcutBar Component
 * Rapid 1-click preview pills for testing views and demo accounts.
 */
export default function DemoShortcutBar({ currentView, navigateTo, currentUser }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>

  <main className="main-stage">
    {/* QUICK SCREEN PREVIEW BAR */}
    <div id="quickScreenBar" className="demo-switcher">
      <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","width":"100%","marginBottom":"4px"}} className="demo-bar-header">
        <span style={{"fontWeight":"700"}}>🧪 Quick Screen Preview:</span>
        <button type="button" className="btn-demo-collapse" onclick="toggleDemoBarVisibility()" title="Collapse Screen Preview Bar" style={{"background":"none","border":"none","fontFamily":"var(--font-hand)","fontSize":"0.95rem","color":"#777","cursor":"pointer","textDecoration":"underline","padding":"0 4px"}}>✕ Minimize</button>
      </div>
      <div id="demoPillsWrap" style={{"display":"flex","flexWrap":"wrap","gap":"6px","alignItems":"center","justifyContent":"center"}}>
        <button className="demo-pill active" id="pill-home" onclick="navigateTo('home')">Home</button>
        <button className="demo-pill" id="pill-browse" onclick="navigateTo('browse')">Browse All</button>
        <button className="demo-pill" id="pill-details" onclick="handleQuickPreviewEventDetails()">Event Details</button>
        <button className="demo-pill organizer-only" id="pill-my-events" onclick="navigateTo('my-events')" style={{"display":"none","borderColor":"#d35400","color":"#d35400"}}>My Events 📋</button>
        <button className="demo-pill organizer-only" id="pill-create" onclick="switchToOrganizerCreate()" style={{"display":"none"}}>Create Event</button>
        <button className="demo-pill" id="pill-bookings" onclick="navigateTo('bookings')">My Bookings</button>
        <button className="demo-pill" id="pill-saved" onclick="navigateTo('saved')">My Saved Events</button>
        <button className="demo-pill" id="pill-demands" onclick="navigateTo('demands')">Demand Engine</button>
        <button className="demo-pill organizer-only" id="pill-scanner" onclick="navigateTo('scanner')" style={{"display":"none"}}>QR Entry Scanner</button>
        <button className="demo-pill" id="pill-notifications" onclick="navigateTo('notifications')">Notifications</button>
        <button className="demo-pill" id="pill-profile" onclick="navigateTo('profile')">Profile</button>
        <button className="demo-pill" id="pill-admin" onclick="navigateTo('admin')" style={{"display":"none","borderColor":"#1e90ff","color":"#0960bd","fontWeight":"700"}}>Admin Panel 🛡️</button>
        <button className="demo-pill organizer-only" id="pill-revenue" onclick="navigateTo('revenue')" style={{"display":"none"}}>Revenue & Sales 💰</button>
        <button className="demo-pill guest-only" id="pill-register" onclick="navigateTo('register')">Register</button>
        <button className="demo-pill guest-only" id="pill-login" onclick="navigateTo('login')">Log In</button>
      </div>
    </div>
    <div id="demoBarCollapsedBadge" className="hidden" style={{"textAlign":"center","margin":"0 auto 10px"}}>
      <button type="button" className="demo-pill" onclick="toggleDemoBarVisibility()" style={{"borderStyle":"dashed","color":"#777","fontSize":"0.88rem","padding":"3px 14px"}}>
        🧪 Show Screen Shortcuts ▼
      </button>
    </div>

    <!-- =========================================================
         VIEW 1: HOME SCREEN
    </>
  );
}
