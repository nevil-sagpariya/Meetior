import React from 'react';

/**
 * DemandsPage Component
 * Community Demand Engine & Crowdsourcing
 *
 * @param {Object} props
 * @param {Function} props.navigateTo - View navigation callback
 * @param {Object} props.currentUser - Authenticated user session object
 * @param {Function} [props.showToast] - Flash notification toast
 */
export default function DemandsPage({ navigateTo, currentUser, showToast }) {
  return (
    <>
    <section id="view-demands" className="hidden">
      <div className="page-title-row">
        <a className="back-link" onclick="navigateTo('home')">← Back to Home</a>
        <h1 className="page-title">Community Demand Engine 💡</h1>
        <div></div>
      </div>
      <p style={{"textAlign":"center","fontSize":"1.15rem","marginBottom":"20px"}}>
        Request events you want to see! Organizers review popular demands and bring them to life.
      </p>

      <div style={{"display":"grid","gridTemplateColumns":"340px 1fr","gap":"24px","alignItems":"start"}} className="demands-grid-layout">
        {/* Demand Form (Sticky and natural height so it never stretches into an empty white box) */}
        <form className="sketch-box" style={{"padding":"20px","position":"sticky","top":"90px","height":"fit-content"}} onsubmit="handleDemandSubmit(event)">
          <h3 style={{"marginBottom":"12px","fontSize":"1.35rem"}}>✨ Request an Event</h3>
          <div style={{"marginBottom":"10px"}}>
            <label className="field-label">Event Concept <span className="req-star">*</span></label>
            <input id="demandTitle" type="text" className="sketch-input" placeholder="e.g. Weekend Watercolor Camp" required/>
          </div>
          <div style={{"marginBottom":"10px"}}>
            <label className="field-label">Category</label>
            <select id="demandCategory" className="sketch-input">
              <option value="1">Music & Nightlife</option>
              <option value="2">Food & Festivals</option>
              <option value="3" selected>Art & Workshops</option>
              <option value="4">Heritage & History</option>
              <option value="5">Sports & Outdoors</option>
              <option value="8">Technology & Education</option>
            </select>
          </div>
          <div style={{"marginBottom":"10px"}}>
            <label className="field-label">City <span className="req-star">*</span></label>
            <select id="demandCity" className="sketch-input" required onchange="handleDemandFormCityChange(this.value)">
              <optgroup label="🌟 Popular Hubs">
                <option value="Ahmedabad" selected>Ahmedabad</option>
                <option value="Gandhinagar">Gandhinagar</option>
                <option value="Surat">Surat</option>
                <option value="Vadodara">Vadodara</option>
                <option value="Rajkot">Rajkot</option>
                <option value="Delhi">Delhi</option>
                <option value="Noida">Noida</option>
                <option value="Gurugram">Gurugram</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Pune">Pune</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Jaipur">Jaipur</option>
                <option value="Lucknow">Lucknow</option>
                <option value="Chandigarh">Chandigarh</option>
                <option value="Goa">Goa</option>
              </optgroup>
              <optgroup label="🏛️ All Other Major Cities">
                <option value="Agra">Agra</option>
                <option value="Amritsar">Amritsar</option>
                <option value="Bhopal">Bhopal</option>
                <option value="Bhubaneswar">Bhubaneswar</option>
                <option value="Coimbatore">Coimbatore</option>
                <option value="Dehradun">Dehradun</option>
                <option value="Guwahati">Guwahati</option>
                <option value="Gwalior">Gwalior</option>
                <option value="Indore">Indore</option>
                <option value="Jamnagar">Jamnagar</option>
                <option value="Jammu">Jammu</option>
                <option value="Jodhpur">Jodhpur</option>
                <option value="Kanpur">Kanpur</option>
                <option value="Kochi">Kochi</option>
                <option value="Mysuru">Mysuru</option>
                <option value="Nagpur">Nagpur</option>
                <option value="Nashik">Nashik</option>
                <option value="Navi Mumbai">Navi Mumbai</option>
                <option value="Patna">Patna</option>
                <option value="Raipur">Raipur</option>
                <option value="Ranchi">Ranchi</option>
                <option value="Shimla">Shimla</option>
                <option value="Srinagar">Srinagar</option>
                <option value="Thane">Thane</option>
                <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                <option value="Udaipur">Udaipur</option>
                <option value="Varanasi">Varanasi</option>
                <option value="Vijayawada">Vijayawada</option>
                <option value="Visakhapatnam">Visakhapatnam</option>
              </optgroup>
            </select>
          </div>
          <div style={{"marginBottom":"10px"}}>
            <label className="field-label">Preferred Venue / Area</label>
            <input id="demandLocation" type="text" className="sketch-input" placeholder="e.g. Riverfront or SG Highway"/>
          </div>
          <div style={{"marginBottom":"12px"}}>
            <label className="field-label">Why do you want this?</label>
            <textarea id="demandDesc" className="sketch-input" style={{"height":"75px","resize":"none"}} placeholder="Tell organizers what you hope to experience..."></textarea>
          </div>
          <button type="submit" className="btn-crayon-yellow" style={{"width":"100%","padding":"8px"}}>
            Submit Demand →
          </button>
        </form>

        {/* Demands List */}
        <div>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"12px","flexWrap":"wrap","gap":"8px"}}>
            <h3 style={{"fontSize":"1.4rem","margin":"0"}}>🔥 Trending Community Demands</h3>
            <div style={{"display":"flex","gap":"8px","alignItems":"center"}}>
              <select id="demandsCityFilter" className="sketch-input" style={{"padding":"4px 10px","fontSize":"0.92rem","width":"auto","fontWeight":"700"}} onchange="handleDemandsCityChange(this.value)">
                <option value="all">🌐 All Cities</option>
                <optgroup label="🌟 Popular Hubs">
                  <option value="Ahmedabad">Ahmedabad</option>
                  <option value="Gandhinagar">Gandhinagar</option>
                  <option value="Surat">Surat</option>
                  <option value="Vadodara">Vadodara</option>
                  <option value="Rajkot">Rajkot</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Noida">Noida</option>
                  <option value="Gurugram">Gurugram</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Pune">Pune</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Jaipur">Jaipur</option>
                  <option value="Lucknow">Lucknow</option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Goa">Goa</option>
                </optgroup>
                <optgroup label="🏛️ All Other Major Cities">
                  <option value="Agra">Agra</option>
                  <option value="Amritsar">Amritsar</option>
                  <option value="Bhopal">Bhopal</option>
                  <option value="Bhubaneswar">Bhubaneswar</option>
                  <option value="Coimbatore">Coimbatore</option>
                  <option value="Dehradun">Dehradun</option>
                  <option value="Guwahati">Guwahati</option>
                  <option value="Gwalior">Gwalior</option>
                  <option value="Indore">Indore</option>
                  <option value="Jamnagar">Jamnagar</option>
                  <option value="Jammu">Jammu</option>
                  <option value="Jodhpur">Jodhpur</option>
                  <option value="Kanpur">Kanpur</option>
                  <option value="Kochi">Kochi</option>
                  <option value="Mysuru">Mysuru</option>
                  <option value="Nagpur">Nagpur</option>
                  <option value="Nashik">Nashik</option>
                  <option value="Navi Mumbai">Navi Mumbai</option>
                  <option value="Patna">Patna</option>
                  <option value="Raipur">Raipur</option>
                  <option value="Ranchi">Ranchi</option>
                  <option value="Shimla">Shimla</option>
                  <option value="Srinagar">Srinagar</option>
                  <option value="Thane">Thane</option>
                  <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                  <option value="Udaipur">Udaipur</option>
                  <option value="Varanasi">Varanasi</option>
                  <option value="Vijayawada">Vijayawada</option>
                  <option value="Visakhapatnam">Visakhapatnam</option>
                </optgroup>
              </select>
              <button type="button" className="btn-sketch-white" onclick="loadDemands()" style={{"padding":"4px 12px","fontSize":"0.95rem"}}>🔄 Refresh</button>
            </div>
          </div>
          <div id="demandsListContainer"></div>
          <div id="demandsPaginationBar" className="pagination-bar" style={{"marginTop":"18px","justifyContent":"center"}}></div>
        </div>
      </div>
    </section>

    {/* =========================================================
         VIEW 10: ORGANIZER QR ENTRY SCANNER
         ========================================================= */}
    </>
  );
}
