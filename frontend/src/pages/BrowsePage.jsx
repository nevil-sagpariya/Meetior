import React from 'react';

/**
 * BrowsePage Component
 * Browse Events Page - Filters & Search
 *
 * @param {Object} props
 * @param {Function} props.navigateTo - View navigation callback
 * @param {Object} props.currentUser - Authenticated user session object
 * @param {Function} [props.showToast] - Flash notification toast
 */
export default function BrowsePage({ navigateTo, currentUser, showToast }) {
  return (
    <>
    <section id="view-browse" className="hidden">
      <h1 id="browseMainHeading" className="page-title" style={{"marginBottom":"14px"}}>Browse All Events in Ahmedabad</h1>

      {/* Organizer Category Breakdown & Area Guide */}
      <div id="organizerBrowseStats" className="sketch-box organizer-only" style={{"display":"none","margin":"0 auto 16px","maxWidth":"880px","width":"100%","boxSizing":"border-box","background":"#f0fdf4","border":"2px dashed #2e7d32","borderRadius":"12px","padding":"12px 18px","fontSize":"0.93rem"}}>
        <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","flexWrap":"wrap","gap":"10px"}}>
          <div>
            <strong style={{"color":"#1b5e20"}}>📊 Event Landscape in <span className="organizerCurrentCityName">Ahmedabad</span>:</strong>
            <span id="organizerCategoryStatsSummary" style={{"color":"#333","marginLeft":"6px"}}>Loading category breakdown...</span>
          </div>
          <button type="button" className="btn-sketch-white" onclick="navigateTo('demands')" style={{"fontSize":"0.85rem","padding":"3px 10px","color":"#2e7d32","borderColor":"#2e7d32"}}>
            View What People Request →
          </button>
        </div>
      </div>

      <div className="sketch-box browse-search-bar">
        <span>🔍</span>
        <input id="browseSearchInput" type="text" placeholder="Search for any event, activity, or place..." oninput="renderBrowseCards()"/>
        <button className="btn-crayon-yellow" style={{"padding":"5px 18px"}} onclick="renderBrowseCards()">Search</button>
      </div>

      <div className="filter-pills-row">
        <select id="browseDateFilter" className="filter-pill" onchange="renderBrowseCards()">
          <option value="all" selected>Date 🗓️ ⌄ (All Dates / Anytime)</option>
          <optgroup label="⏰ Quick Timeline">
            <option value="today">⚡ Today</option>
            <option value="tomorrow">🌅 Tomorrow</option>
            <option value="weekend">🎈 This Weekend (Fri-Sun)</option>
            <option value="this_week">📅 This Week (Next 7 Days)</option>
          </optgroup>
          <optgroup label="📆 Every Day of the Week">
            <option value="Mon">Monday Events</option>
            <option value="Tue">Tuesday Events</option>
            <option value="Wed">Wednesday Events</option>
            <option value="Thu">Thursday Events</option>
            <option value="Fri">Friday Events</option>
            <option value="Sat">Saturday Events</option>
            <option value="Sun">Sunday Events</option>
          </optgroup>
        </select>

        <select id="browseCategoryFilter" className="filter-pill category-pill" onchange="renderBrowseCards()">
          <option value="all">Category 🎨 ⌄</option>
          <option value="Outdoors">Outdoors & Walk</option>
          <option value="Carnival">Carnival & Fun</option>
          <option value="Music">Music & Nightlife</option>
          <option value="Heritage">Heritage & History</option>
          <option value="Art">Art & Workshop</option>
          <option value="Food">Food & Dining</option>
        </select>

        <button id="nearMeBtn" className="filter-pill near-pill" onclick="toggleNearMe()">
          Near me 📍
        </button>
      </div>

      <div id="browseCardsContainer" className="cards-grid-3"></div>

      <div id="browsePaginationBar" className="pagination-bar"></div>
    </section>

    {/* =========================================================
         VIEW 3: EVENT DETAILS
         ========================================================= */}
    </>
  );
}
