import React from 'react';

/**
 * HomePage Component
 * Home Page - Event Discovery & City Exploration
 *
 * @param {Object} props
 * @param {Function} props.navigateTo - View navigation callback
 * @param {Object} props.currentUser - Authenticated user session object
 * @param {Function} [props.showToast] - Flash notification toast
 */
export default function HomePage({ navigateTo, currentUser, showToast }) {
  return (
    <>
    <section id="view-home">
      <h1 className="hero-title">
        <span style={{"color":"#f5b700"}}>☀️</span>
        <span>Find what's <span className="rainbow-word"><span>h</span><span>a</span><span>p</span><span>p</span><span>e</span><span>n</span><span>i</span><span>n</span><span>g</span></span> near you!!</span>
        <span style={{"color":"#f5b700"}}>☀️</span>
      </h1>

      <div className="sketch-box home-search-card" style={{"padding":"16px 22px","maxWidth":"880px","width":"100%","boxSizing":"border-box","margin":"0 auto 20px auto"}}>
        <div style={{"display":"flex","gap":"12px","alignItems":"center","flexWrap":"wrap"}}>
          <div style={{"flex":"1","minWidth":"260px"}}>
            <div className="input-icon-wrap">
              <span className="left-icon">🔍</span>
              <input id="homeSearchInput" type="text" className="sketch-input" placeholder="Search for events, workshops, activities, festivals..." onkeydown="if(event.key==='Enter') runHomeSearch()"/>
            </div>
          </div>
          <div>
            <button className="btn-crayon-yellow" style={{"padding":"10px 24px","fontSize":"1.15rem","borderRadius":"999px"}} onclick="runHomeSearch()">Search Events →</button>
          </div>
          <div>
            <button type="button" className="btn-city-select" onclick="openCityPickerModal()" title="Change Browsing City" style={{"height":"44px","padding":"0 16px","border":"2.5px solid #222","background":"#fff","cursor":"pointer","borderRadius":"999px","fontFamily":"'Fredoka', cursive","fontSize":"1rem","boxShadow":"2px 2px 0 #222"}}>
              <span>📍 Browsing:</span>
              <strong id="homeSearchCityPill">Ahmedabad</strong>
              <span style={{"fontSize":"0.75rem"}}>▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Category Quick-Filter Bubbles */}
      <div className="home-category-row" style={{"display":"flex","gap":"8px","justifyContent":"center","flexWrap":"wrap","maxWidth":"880px","margin":"0 auto 26px"}}>
        <button type="button" className="btn-cat-bubble" onclick="exploreCategoryFromHome('Music')" title="Explore Music & Nightlife">
          <span>🎵</span> <strong>Music</strong>
        </button>
        <button type="button" className="btn-cat-bubble" onclick="exploreCategoryFromHome('Food')" title="Explore Food & Festivals">
          <span>🍲</span> <strong>Food & Dining</strong>
        </button>
        <button type="button" className="btn-cat-bubble" onclick="exploreCategoryFromHome('Art')" title="Explore Art & Workshops">
          <span>🎨</span> <strong>Art & Workshop</strong>
        </button>
        <button type="button" className="btn-cat-bubble" onclick="exploreCategoryFromHome('Heritage')" title="Explore Heritage & Tours">
          <span>🏛️</span> <strong>Heritage</strong>
        </button>
        <button type="button" className="btn-cat-bubble" onclick="exploreCategoryFromHome('Outdoors')" title="Explore Sports & Outdoors">
          <span>🏃</span> <strong>Outdoors</strong>
        </button>
        <button type="button" className="btn-cat-bubble" onclick="exploreCategoryFromHome('Carnival')" title="Explore Carnival & Fun">
          <span>🎪</span> <strong>Carnival</strong>
        </button>
        <button type="button" className="btn-cat-bubble" onclick="exploreCategoryFromHome('Technology')" title="Explore Tech & Education">
          <span>💻</span> <strong>Tech</strong>
        </button>
      </div>

      {/* 1. Featured Spotlight Event of the Week */}
      <div id="homeSpotlightContainer" style={{"maxWidth":"880px","width":"100%","boxSizing":"border-box","margin":"0 auto 28px"}}></div>

      {/* 2. Weekend Highlights (3 Cards Only) */}
      <h2 id="homeWeekendTitle" className="section-subtitle">🎈 Weekend Highlights in Ahmedabad</h2>
      <div id="homeCardsContainer" className="cards-grid-3"></div>

      {/* 3. Community Demand Engine Callout Box */}
      <div className="sketch-box home-demand-callout" style={{"maxWidth":"880px","width":"100%","boxSizing":"border-box","margin":"28px auto 20px","padding":"18px 22px","background":"#fffcf0","border":"2.5px dashed #fab005","borderRadius":"18px","display":"flex","alignItems":"center","justifyContent":"space-between","flexWrap":"wrap","gap":"14px"}}>
        <div style={{"flex":"1","minWidth":"260px"}}>
          <h3 style={{"fontFamily":"'Fredoka', cursive","fontSize":"1.3rem","color":"#222","margin":"0 0 4px"}}>💡 Can't find an event you want in your city?</h3>
          <p style={{"fontFamily":"'Patrick Hand', cursive","fontSize":"1.1rem","color":"#555","margin":"0"}}>Suggest a meetup concept or vote on ideas requested by locals on our Community Demand Engine!</p>
        </div>
        <button className="btn-crayon-yellow" onclick="navigateTo('demands')" style={{"padding":"9px 20px","fontSize":"1rem","borderRadius":"999px"}}>
          Suggest an Event →
        </button>
      </div>

      {/* 4. CTA to Full Catalog */}
      <a id="homeBrowseLink" className="bottom-cta-link" onclick="navigateTo('browse')" style={{"marginTop":"10px"}}>
        Explore All Events in Ahmedabad →
      </a>
    </section>

    {/* =========================================================
         VIEW 2: BROWSE ALL EVENTS
         ========================================================= */}
    </>
  );
}
