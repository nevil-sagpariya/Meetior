import React from 'react';

/**
 * CreateEventPage Component
 * Create Event Page - Organizer Studio
 *
 * @param {Object} props
 * @param {Function} props.navigateTo - View navigation callback
 * @param {Object} props.currentUser - Authenticated user session object
 * @param {Function} [props.showToast] - Flash notification toast
 */
export default function CreateEventPage({ navigateTo, currentUser, showToast }) {
  return (
    <>
    <section id="view-create" className="hidden">
      <div className="page-title-row">
        <a className="back-link" onclick="navigateTo('browse')">← Back to Dashboard</a>
        <h1 className="page-title">Create New Event</h1>
        <div></div>
      </div>

      <form className="sketch-box create-card" onsubmit="handlePublishEvent(event)" novalidate>
        <div>
          <label className="field-label">Event Title <span className="req-star">*</span></label>
          <input id="ceTitle" type="text" className="sketch-input" placeholder="Enter event title (3 to 150 characters)" required minlength="3" maxlength="150"/>
        </div>

        <div className="form-row-2">
          <div>
            <label className="field-label">Category <span className="req-star">*</span></label>
            <select id="ceCategory" className="sketch-input" required>
              <option value="">Select a category</option>
              <option value="Heritage">Heritage & History</option>
              <option value="Outdoors">Outdoors & Walk</option>
              <option value="Carnival">Carnival & Fun</option>
              <option value="Music">Music & Cultural</option>
              <option value="Art">Art & Workshop</option>
              <option value="Food">Food & Dining</option>
            </select>
          </div>
          <div>
            <label className="field-label">Date <span className="req-star">*</span></label>
            <div className="input-icon-wrap">
              <span className="left-icon">📅</span>
              <input id="ceDate" type="text" className="sketch-input" placeholder="DD/MM/YYYY (Today or future date)" onfocus="this.type='date'" onblur="if(!this.value)this.type='text'"/>
            </div>
          </div>
        </div>

        <div className="form-row-2">
          <div>
            <label className="field-label">Time <span className="req-star">*</span></label>
            <div className="input-icon-wrap">
              <span className="left-icon">🕒</span>
              <input id="ceTime" type="text" className="sketch-input" placeholder="Select event time" onfocus="this.type='time'" onblur="if(!this.value)this.type='text'"/>
            </div>
          </div>
          <div>
            <label className="field-label">Cost <span className="req-star">*</span></label>
            <input id="ceCost" type="text" className="sketch-input" placeholder="Enter 0 for free, or specify ₹ per attendee"/>
            <div className="helper-note">Must mention 'free' or specify the charge</div>
          </div>
        </div>

        {/* Step: Event Venue & Interactive Map Location Picker */}
        <div style={{"margin":"20px 0 10px","borderTop":"2px dashed #dcd3be","paddingTop":"16px"}}>
          <h3 style={{"fontSize":"1.35rem","margin":"0 0 4px","fontFamily":"var(--font-display)","color":"#222"}}>
            📍 Event Venue & Interactive Map Location
          </h3>
          <p style={{"fontSize":"0.95rem","color":"#666","marginBottom":"12px","fontFamily":"var(--font-hand)"}}>
            👉 <strong>Select from map:</strong> Click directly on the map below or drag the pin marker. Venue details & coordinates update automatically without typing numbers!
          </p>

          {/* Interactive Map Picker Container */}
          <div id="ceMapPickerBox" className="ce-map-box" style={{"marginBottom":"16px"}}>
            <div className="ce-map-header">
              <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
                <span style={{"fontSize":"1.15rem"}}>🗺️</span>
                <strong style={{"color":"#222","fontSize":"1.02rem"}}>Click Map to Set Event Location Pin</strong>
              </div>
              <button type="button" className="btn-sketch-white" onclick="detectOrganizerGpsLocation()" style={{"fontSize":"0.85rem","padding":"4px 10px","fontWeight":"700","borderColor":"#2e86de","color":"#2e86de","cursor":"pointer"}} title="Find my current GPS position">
                🎯 Use My GPS Location
              </button>
            </div>

            {/* Quick Search Bar inside Map Box */}
            <div style={{"padding":"8px 12px","background":"#faf6ee","borderBottom":"1.5px dashed #dcd3be","display":"flex","gap":"8px","alignItems":"center","flexWrap":"wrap"}}>
              <div className="input-icon-wrap" style={{"flex":"1","minWidth":"220px"}}>
                <span className="left-icon">🔍</span>
                <input id="ceMapSearchInput" type="text" className="sketch-input" placeholder="Search area, road or landmark (e.g. Kankaria, Vastrapur)..." style={{"padding":"6px 10px 6px 36px","fontSize":"0.92rem"}} onkeydown="if(event.key==='Enter'){event.preventDefault(); searchLocationOnMap(this.value);}"/>
              </div>
              <button type="button" className="btn-crayon-yellow" onclick="searchLocationOnMap(document.getElementById('ceMapSearchInput').value)" style={{"padding":"6px 14px","fontSize":"0.92rem","fontWeight":"700","cursor":"pointer"}}>
                Find on Map 📍
              </button>
            </div>

            {/* Quick Landmark Chips */}
            <div style={{"padding":"6px 12px","background":"#fffdf5","borderBottom":"1px solid #e8e3d5","display":"flex","gap":"6px","overflowX":"auto","fontSize":"0.85rem","alignItems":"center"}}>
              <span style={{"fontWeight":"700","color":"#555","whiteSpace":"nowrap","fontFamily":"var(--font-hand)"}}>Quick Landmarks:</span>
              <button type="button" className="filter-pill" onclick="jumpMapToPreset('sabarmati_promenade')" style={{"fontSize":"0.82rem","padding":"2px 10px"}}>Riverfront</button>
              <button type="button" className="filter-pill" onclick="jumpMapToPreset('kankaria_gate1')" style={{"fontSize":"0.82rem","padding":"2px 10px"}}>Kankaria Lake</button>
              <button type="button" className="filter-pill" onclick="jumpMapToPreset('natarani')" style={{"fontSize":"0.82rem","padding":"2px 10px"}}>Natarani</button>
              <button type="button" className="filter-pill" onclick="jumpMapToPreset('swaminarayan_gate')" style={{"fontSize":"0.82rem","padding":"2px 10px"}}>Old City Pols</button>
              <button type="button" className="filter-pill" onclick="jumpMapToPreset('vastrapur_lake')" style={{"fontSize":"0.82rem","padding":"2px 10px"}}>Vastrapur</button>
              <button type="button" className="filter-pill" onclick="jumpMapToPreset('sindhubhavan')" style={{"fontSize":"0.82rem","padding":"2px 10px"}}>Sindhu Bhavan</button>
              <button type="button" className="filter-pill" onclick="jumpMapToPreset('adalaj_stepwell')" style={{"fontSize":"0.82rem","padding":"2px 10px"}}>Adalaj</button>
              <button type="button" className="filter-pill" onclick="jumpMapToPreset('tapi_riverfront')" style={{"fontSize":"0.82rem","padding":"2px 10px"}}>Surat Tapi</button>
              <button type="button" className="filter-pill" onclick="jumpMapToPreset('delhi_cp')" style={{"fontSize":"0.82rem","padding":"2px 10px"}}>Delhi CP</button>
              <button type="button" className="filter-pill" onclick="jumpMapToPreset('delhi_chandni_chowk')" style={{"fontSize":"0.82rem","padding":"2px 10px"}}>Chandni Chowk</button>
              <button type="button" className="filter-pill" onclick="jumpMapToPreset('mumbai_marinedrive')" style={{"fontSize":"0.82rem","padding":"2px 10px"}}>Marine Drive</button>
              <button type="button" className="filter-pill" onclick="jumpMapToPreset('bengaluru_cubbon')" style={{"fontSize":"0.82rem","padding":"2px 10px"}}>Cubbon Park</button>
            </div>

            {/* Leaflet Interactive Map Container */}
            <div id="ceLeafletMap" style={{"height":"270px","width":"100%","position":"relative","background":"#e8ecf1","zIndex":"1"}}></div>

            {/* Status Hint & Directions Link */}
            <div className="ce-map-footer">
              <span id="ceMapPinHint">📍 <strong>Pinned at:</strong> Sabarmati Riverfront Promenade, West Bank (23.0365, 72.5695)</span>
              <a id="ceMapExternalPreviewLink" href="https://www.google.com/maps/search/?api=1&query=23.0365,72.5695" target="_blank" rel="noopener noreferrer" style={{"color":"#1e90ff","fontWeight":"700","textDecoration":"underline","fontSize":"0.85rem"}}>
                Open in Google Maps ↗
              </a>
            </div>
          </div>

          {/* Hidden Coordinate Inputs (Auto-filled by clicking map) */}
          <input type="hidden" id="ceLatitude" value="23.036500" />
          <input type="hidden" id="ceLongitude" value="72.569500" />

          {/* Venue Address Fields (Auto-filled from map click / presets, but editable) */}
          <div className="form-group">
            <label className="field-label">Venue Name & Specific Area / Landmark <span className="req-star">*</span></label>
            <div className="input-icon-wrap">
              <span className="left-icon">📍</span>
              <input id="ceLocation" type="text" className="sketch-input" placeholder="e.g. Sabarmati Riverfront Promenade, West Bank" maxlength="255" required oninput="handleCeLocationInput(this.value)"/>
            </div>
            <div className="helper-note">Automatically filled when you click on the map, or you can edit with specific gate/hall details.</div>
          </div>

          <div className="form-row-2">
            <div>
              <label className="field-label">Venue City / Town <span className="req-star">*</span></label>
              <input id="ceCityInput" type="text" className="sketch-input" placeholder="e.g. Ahmedabad, Gandhinagar, Surat, Delhi" value="Ahmedabad" required oninput="handleCeCityInput(this.value)" onchange="handleCeCityInput(this.value)"/>
            </div>
            <div>
              <label className="field-label">Venue District <span className="req-star">*</span></label>
              <input id="ceDistrictInput" type="text" className="sketch-input" placeholder="e.g. Ahmedabad, Gandhinagar, Surat" value="Ahmedabad"/>
            </div>
          </div>

          <div className="form-row-2">
            <div>
              <label className="field-label">Venue PIN Code</label>
              <input id="cePincode" type="text" className="sketch-input" maxlength="6" placeholder="e.g. 380009" oninput="handleCePincode(this.value)" onchange="handleCePincode(this.value)"/>
              <div className="helper-note">💡 Enter 6-digit PIN to auto-fly map & pin venue</div>
            </div>
            <div>
              <label className="field-label">Venue State <span className="req-star">*</span></label>
              <select id="ceStateSelect" className="sketch-input" onchange="handleCeStateChange(this.value)">
                <option value="Gujarat" selected>Gujarat</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi (NCT)</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Telangana">Telangana</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Haryana">Haryana</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Kerala">Kerala</option>
                <option value="Punjab">Punjab</option>
                <option value="Goa">Goa</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Bihar">Bihar</option>
                <option value="Odisha">Odisha</option>
                <option value="Assam">Assam</option>
                <option value="Chandigarh">Chandigarh</option>
                <option value="Uttarakhand">Uttarakhand</option>
                <option value="Himachal Pradesh">Himachal Pradesh</option>
                <option value="Jharkhand">Jharkhand</option>
                <option value="Chhattisgarh">Chhattisgarh</option>
                <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                <option value="Manipur">Manipur</option>
                <option value="Meghalaya">Meghalaya</option>
                <option value="Mizoram">Mizoram</option>
                <option value="Nagaland">Nagaland</option>
                <option value="Sikkim">Sikkim</option>
                <option value="Tripura">Tripura</option>
                <option value="Ladakh">Ladakh</option>
                <option value="Puducherry">Puducherry</option>
                <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                <option value="Lakshadweep">Lakshadweep</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-row-2" style={{"gridTemplateColumns":"210px 1fr"}}>
          <div>
            <label className="field-label">Photo Upload <span className="req-star">*</span></label>
            <label className="upload-dropzone" htmlFor="cePhotoInput">
              <input id="cePhotoInput" type="file" accept="image/png, image/jpeg" className="hidden" onchange="previewCoverImage(event)"/>
              <img id="cePreviewImg" className="hidden" alt="Uploaded preview"/>
              <div id="ceUploadPrompt">
                <div style={{"fontSize":"1.35rem"}}>⬆️</div>
                <strong style={{"fontSize":"0.98rem"}}>Upload Cover Image</strong>
                <div style={{"fontSize":"0.82rem","color":"#444"}}>(JPG or PNG, up to 2 MB)</div>
              </div>
            </label>
          </div>

          <div>
            <label className="field-label">Description</label>
            <textarea id="ceDesc" className="sketch-input" style={{"height":"104px","resize":"none"}} placeholder="Event description..." oninput="updateCharCount()"></textarea>
            <div id="ceCharNote" className="helper-note" style={{"textAlign":"right"}}>Note characters (in any limit if any.</div>
          </div>
        </div>

        <div style={{"textAlign":"center","marginTop":"14px"}}>
          <button type="submit" className="btn-crayon-yellow" style={{"borderRadius":"999px","padding":"8px 34px","fontSize":"1.35rem"}}>
            Publish Event →
          </button>
        </div>
      </form>
    </section>

    {/* =========================================================
         VIEW 5: REGISTER SCREEN (WITH LIVE REAL-TIME VALIDATION)
         ========================================================= */}
    </>
  );
}
