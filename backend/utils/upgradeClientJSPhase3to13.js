'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePaths = [
  path.resolve(__dirname, '../../frontend/index.html'),
  path.resolve(__dirname, '../../../Project Demo Front End.html')
];

filePaths.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Update API object with Location endpoints
  if (!html.includes('lookupPincode:')) {
    const apiTarget = `      createPaymentOrder: (registration_id) => apiFetch('/api/payments/create-order', { method: 'POST', body: JSON.stringify({ registration_id }) }),`;
    const apiReplacement = `      getStates: () => apiFetch('/api/locations/states'),
      getDistricts: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return apiFetch(\`/api/locations/districts\${qs ? '?' + qs : ''}\`);
      },
      getCities: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return apiFetch(\`/api/locations/cities\${qs ? '?' + qs : ''}\`);
      },
      lookupPincode: (pin) => apiFetch(\`/api/locations/pincode/\${pin}\`),
      getDiscoveryCities: () => apiFetch('/api/locations/discovery-cities'),
      createPaymentOrder: (registration_id) => apiFetch('/api/payments/create-order', { method: 'POST', body: JSON.stringify({ registration_id }) }),`;

    html = html.replace(apiTarget, apiReplacement);
  }

  // 2. Add BookMyShow-style City Picker state & logic
  if (!html.includes('function openCityPickerModal()')) {
    const cityPickerLogic = `
    // ============================================================================
    // BOOKMYSHOW-STYLE BROWSING CITY SELECTOR & ALL-INDIA DISCOVERY
    // ============================================================================
    let activeBrowsingCity = localStorage.getItem('meetior_browsing_city') || 'Ahmedabad';
    let cachedDiscoveryCities = [];

    function updateBrowsingCityUI(city) {
      activeBrowsingCity = city || 'Ahmedabad';
      localStorage.setItem('meetior_browsing_city', activeBrowsingCity);

      const navLabel = document.getElementById('navCurrentCityLabel');
      if (navLabel) navLabel.textContent = (activeBrowsingCity === 'all') ? 'All India' : activeBrowsingCity;

      const homeSelect = document.getElementById('homeCitySelect');
      if (homeSelect) {
        if (![...homeSelect.options].some(o => o.value === activeBrowsingCity)) {
          const opt = document.createElement('option');
          opt.value = activeBrowsingCity;
          opt.textContent = activeBrowsingCity;
          homeSelect.appendChild(opt);
        }
        homeSelect.value = activeBrowsingCity;
      }

      updateCityHeadings();
    }

    async function openCityPickerModal() {
      const modal = document.getElementById('cityPickerModal');
      if (!modal) return;
      modal.classList.remove('hidden');

      if (cachedDiscoveryCities.length === 0) {
        try {
          const res = await API.getDiscoveryCities();
          if (res && res.cities) cachedDiscoveryCities = res.cities;
        } catch (_) {
          cachedDiscoveryCities = ['Ahmedabad', 'Gandhinagar', 'Surat', 'Vadodara', 'Rajkot', 'Mumbai', 'Pune', 'Bengaluru', 'Delhi', 'Hyderabad', 'Jaipur', 'Lucknow'];
        }
      }
      renderCityPickerModalList(cachedDiscoveryCities);
    }

    function closeCityPickerModal() {
      const modal = document.getElementById('cityPickerModal');
      if (modal) modal.classList.add('hidden');
    }

    function selectBrowsingCity(city) {
      updateBrowsingCityUI(city);
      closeCityPickerModal();
      showToast(\`Browsing events in: \${city === 'all' ? 'All India 🇮🇳' : city}\`);
      loadHomeEvents();
      renderBrowseCards();
    }

    function renderCityPickerModalList(cities) {
      const popContainer = document.getElementById('popularCitiesList');
      const allContainer = document.getElementById('allCitiesGrid');
      if (!popContainer || !allContainer) return;

      const popular = ['all', 'Ahmedabad', 'Gandhinagar', 'Surat', 'Mumbai', 'Pune', 'Bengaluru', 'Delhi', 'Hyderabad'];

      popContainer.innerHTML = popular.map(c => {
        const label = (c === 'all') ? 'All India 🇮🇳' : c;
        const isActive = (activeBrowsingCity === c) ? 'active' : '';
        return \`<button type="button" class="city-chip-pill \${isActive}" onclick="selectBrowsingCity('\${c}')">\${label}</button>\`;
      }).join('');

      allContainer.innerHTML = cities.map(c => {
        return \`<div class="city-grid-item" onclick="selectBrowsingCity('\${c}')">\${c}</div>\`;
      }).join('');
    }

    function filterCityModalList(query) {
      const q = (query || '').toLowerCase().trim();
      const filtered = cachedDiscoveryCities.filter(c => c.toLowerCase().includes(q));
      renderCityPickerModalList(filtered);
    }
`;

    html = html.replace('// HOME & BROWSE EVENTS (EVERY CITY + SPECIFIC CITIES)',
      cityPickerLogic + '\n    // ============================================================================\n    // HOME & BROWSE EVENTS (EVERY CITY + SPECIFIC CITIES)');
  }

  // 3. Update loadHomeEvents & renderBrowseCards to use activeBrowsingCity
  const oldLoadHomeFn = /async function loadHomeEvents\(\) \{[\s\S]*?renderHomeCardsWithData\(activeEventsList\.slice\(0, 3\)\);\s*\}/;
  const newLoadHomeFn = `async function loadHomeEvents() {
      const city = activeBrowsingCity || 'Ahmedabad';
      const params = { limit: 6 };
      if (city && city !== 'all') {
        params.city = city;
      }

      try {
        const res = await API.getEvents(params);
        if (res && res.events) {
          activeEventsList = res.events;
          renderHomeCardsWithData(res.events.slice(0, 3));
          return;
        }
      } catch (_) {}

      // Fallback
      const filtered = (city === 'all')
        ? EVENTS_DATA
        : EVENTS_DATA.filter(e => {
            const locStr = typeof e.location === 'string' ? e.location : (e.location?.city || e.location?.venue_name || '');
            return locStr.toLowerCase().includes((city || '').toLowerCase());
          });
      activeEventsList = filtered.length > 0 ? filtered : EVENTS_DATA;
      renderHomeCardsWithData(activeEventsList.slice(0, 3));
    }`;

  if (oldLoadHomeFn.test(html)) {
    html = html.replace(oldLoadHomeFn, newLoadHomeFn);
  }

  // 4. Update PIN code lookup & cascading location functions for signup
  if (!html.includes('function handlePincodeInput(')) {
    const pincodeLogic = `
    // ============================================================================
    // PIN CODE AUTO-LOOKUP & CASCADING LOCATION (STATE -> DISTRICT -> CITY)
    // ============================================================================
    let pincodeTimer = null;
    let cachedStates = [];

    async function preloadStates() {
      if (cachedStates.length > 0) return;
      try {
        const res = await API.getStates();
        if (res && res.states) {
          cachedStates = res.states;
          const regState = document.getElementById('regState');
          if (regState) {
            regState.innerHTML = '<option value="">Select State</option>' +
              cachedStates.map(s => \`<option value="\${s.state_name}">\${s.state_name}</option>\`).join('');
          }
        }
      } catch (_) {}
    }

    function handlePincodeInput(pin) {
      clearTimeout(pincodeTimer);
      const cleanPin = (pin || '').trim();
      const statusEl = document.getElementById('pincodeStatus');
      const box = document.getElementById('pincodeSuggestionsBox');

      if (cleanPin.length !== 6 || !/^\\d{6}$/.test(cleanPin)) {
        if (statusEl) statusEl.textContent = '';
        if (box) box.style.display = 'none';
        return;
      }

      if (statusEl) statusEl.textContent = 'Searching location... ⏳';

      pincodeTimer = setTimeout(async () => {
        try {
          const res = await API.lookupPincode(cleanPin);
          if (res && res.success) {
            if (statusEl) statusEl.textContent = '✓ Verified Location';

            // Auto-fill State
            const stateEl = document.getElementById('regState');
            if (stateEl && res.state) {
              stateEl.value = res.state;
              await handleRegStateChange(res.state, res.district);
            }

            // Auto-fill District
            const distEl = document.getElementById('regDistrict');
            if (distEl && res.district) {
              distEl.value = res.district;
              await handleRegDistrictChange(res.district, res.city);
            }

            // Auto-fill City
            const cityEl = document.getElementById('regCityInput');
            if (cityEl) {
              cityEl.value = res.city || res.district;
              validateCityLive();
            }

            // Show localities if multiple match
            if (box && res.localities && res.localities.length > 1) {
              box.innerHTML = '<strong>Localities:</strong> ' +
                res.localities.map(loc => \`<a style="cursor:pointer; text-decoration:underline; margin-right:8px;" onclick="selectRegLocality('\${loc}')">\${loc}</a>\`).join(' ');
              box.style.display = 'block';
            } else if (box) {
              box.style.display = 'none';
            }
          }
        } catch (_) {
          if (statusEl) statusEl.textContent = 'Manual selection available';
          if (box) box.style.display = 'none';
        }
      }, 300);
    }

    function selectRegLocality(loc) {
      const cityEl = document.getElementById('regCityInput');
      if (cityEl) {
        cityEl.value = loc;
        validateCityLive();
      }
      const box = document.getElementById('pincodeSuggestionsBox');
      if (box) box.style.display = 'none';
    }

    async function handleRegStateChange(stateName, preselectDistrict) {
      const distSelect = document.getElementById('regDistrict');
      if (!distSelect) return;
      distSelect.innerHTML = '<option value="">Loading districts...</option>';

      try {
        const res = await API.getDistricts({ state_name: stateName });
        if (res && res.districts) {
          distSelect.innerHTML = '<option value="">Select District</option>' +
            res.districts.map(d => \`<option value="\${d.district_name}">\${d.district_name}</option>\`).join('');
          if (preselectDistrict) distSelect.value = preselectDistrict;
        }
      } catch (_) {
        distSelect.innerHTML = '<option value="">Select District</option>';
      }
    }

    async function handleRegDistrictChange(districtName, preselectCity) {
      const dl = document.getElementById('regCityDatalist');
      if (!dl) return;

      try {
        const res = await API.getCities({ search: districtName });
        if (res && res.cities) {
          dl.innerHTML = res.cities.map(c => \`<option value="\${c.city_name}">\`).join('');
        }
      } catch (_) {}
    }
`;

    html = html.replace('// AUTH SUBMISSIONS & INSTANT REDIRECT TO HOME',
      pincodeLogic + '\n    // ============================================================================\n    // AUTH SUBMISSIONS & INSTANT REDIRECT TO HOME');
  }

  // 5. Update submitRegisterForm to send complete location and auto-login to home
  const oldSubmitRegFn = /async function submitRegisterForm\(e\) \{[\s\S]*?showToast\('Please complete the highlighted required fields\.'\);\s*\}\s*\}/;
  const newSubmitRegFn = `async function submitRegisterForm(e) {
      e.preventDefault();
      const vName = validateNameLive();
      const vEmail = validateEmailLive();
      const vPass = validatePasswordLive();
      const vConfirm = validateConfirmLive();
      const vRole = Boolean(selectedRegRole);

      const pincode = (document.getElementById('regPincode')?.value || '').trim();
      const state = (document.getElementById('regState')?.value || '').trim();
      const district = (document.getElementById('regDistrict')?.value || '').trim();
      const city = (document.getElementById('regCityInput')?.value || '').trim();

      if (!vRole) {
        document.getElementById('errRole')?.classList.add('visible');
      }

      if (!city) {
        document.getElementById('errCity')?.classList.add('visible');
      }

      if (vName && vEmail && vPass && vConfirm && vRole && city) {
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPass').value;
        const role = selectedRegRole;

        try {
          const res = await API.register({ name, email, password, city, district, state, pincode, role });
          setAuthToken(res.token);
          currentUser = res.user;
          updateBrowsingCityUI(res.user.city || 'Ahmedabad');
          showToast(\`Account created! Welcome, \${currentUser.name} 🎉\`);
          updateNavbarUserUI();
          navigateTo('home'); // ALWAYS redirect to Home page
          loadHomeEvents();
          loadNotifications();
        } catch (err) {
          showToast(err.message || 'Registration failed.');
        }
      } else {
        showToast('Please complete the highlighted required fields.');
      }
    }`;

  if (oldSubmitRegFn.test(html)) {
    html = html.replace(oldSubmitRegFn, newSubmitRegFn);
  }

  // 6. Update handleLoginSubmit to set browsing city to profile city on login
  const oldLoginFn = /async function handleLoginSubmit\(e\) \{[\s\S]*?showToast\(err\.message \|\| 'Incorrect email or password\.'\);\s*\}\s*\}/;
  const newLoginFn = `async function handleLoginSubmit(e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      try {
        const res = await API.login({ email, password });
        setAuthToken(res.token);
        currentUser = res.user;
        updateBrowsingCityUI(res.user.city || 'Ahmedabad');
        showToast(\`Welcome back, \${currentUser.name}! 🌟\`);
        updateNavbarUserUI();
        navigateTo('home'); // ALWAYS redirect to Home page
        loadHomeEvents();
        loadNotifications();
      } catch (err) {
        showToast(err.message || 'Incorrect email or password.');
      }
    }`;

  if (oldLoginFn.test(html)) {
    html = html.replace(oldLoginFn, newLoginFn);
  }

  // 7. Update quickLogin to set browsing city
  const oldQuickLoginFn = /async function quickLogin\(displayName, role\) \{[\s\S]*?loadNotifications\(\);\s*\}/;
  const newQuickLoginFn = `async function quickLogin(displayName, role) {
      const email = (role === 'Organizer') ? 'organizer@meetior.in' : 'attendee@meetior.in';
      try {
        const res = await API.login({ email, password: 'Meetior2026' });
        setAuthToken(res.token);
        currentUser = res.user;
        updateBrowsingCityUI(res.user.city || 'Ahmedabad');
        showToast(\`Logged in as \${currentUser.name} (\${currentUser.role})\`);
      } catch (_) {
        currentUser = { name: displayName, role, email, city: 'Ahmedabad' };
        updateBrowsingCityUI('Ahmedabad');
        showToast(\`Logged in as \${displayName} (\${role})\`);
      }
      updateNavbarUserUI();
      navigateTo('home'); // ALWAYS redirect to Home page
      loadHomeEvents();
      loadNotifications();
    }`;

  if (oldQuickLoginFn.test(html)) {
    html = html.replace(oldQuickLoginFn, newQuickLoginFn);
  }

  // 8. Update handlePublishEvent to support venue City, District, State, PIN code (Surat test)
  const oldPublishFn = /async function handlePublishEvent\(e\) \{[\s\S]*?showToast\(err\.message \|\| 'Could not publish event\. Please check inputs\.'\);\s*\}\s*\}/;
  const newPublishFn = `async function handlePublishEvent(e) {
      e.preventDefault();
      if (!currentUser || currentUser.role !== 'Organizer') {
        showToast('Organizer account required to publish events.');
        await quickLogin('Aarav Patel', 'Organizer');
      }

      const title = document.getElementById('ceTitle').value.trim();
      const category = document.getElementById('ceCategory').value;
      const dateVal = document.getElementById('ceDate').value.trim();
      const timeVal = document.getElementById('ceTime').value.trim();
      const costVal = document.getElementById('ceCost').value.trim();
      const locationVal = document.getElementById('ceLocation').value.trim();
      const descVal = document.getElementById('ceDesc').value.trim();
      const fileInput = document.getElementById('cePhotoInput');

      const ceCity = (document.getElementById('ceCityInput')?.value || '').trim() || 'Surat';
      const ceDistrict = (document.getElementById('ceDistrictInput')?.value || '').trim() || ceCity;
      const ceState = (document.getElementById('ceStateSelect')?.value || '').trim() || 'Gujarat';
      const cePincode = (document.getElementById('cePincode')?.value || '').trim();

      if (title.length < 3 || !category || !dateVal || !timeVal || !costVal || !locationVal) {
        showToast('Please fill in all required (*) fields before publishing.');
        return;
      }

      // Robust date parsing (supports DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD)
      let formattedDate = dateVal;
      if (dateVal.includes('/')) {
        const p = dateVal.split('/');
        if (p.length === 3) formattedDate = \`\${p[2]}-\${p[1]}-\${p[0]}\`;
      } else if (dateVal.includes('-')) {
        const p = dateVal.split('-');
        if (p[0].length === 2 && p[2].length === 4) {
          formattedDate = \`\${p[2]}-\${p[1]}-\${p[0]}\`;
        }
      }

      const isFree = costVal === '0' || costVal.toLowerCase().includes('free');
      const numCost = isFree ? 0 : parseFloat(costVal.replace(/[^0-9.]/g, '') || 0);

      const catMap = {
        'Music': 1, 'Food': 2, 'Art': 3, 'Heritage': 4,
        'Outdoors': 5, 'Carnival': 6, 'Community': 7, 'Technology': 8
      };
      const catId = catMap[category] || 1;

      const formData = new FormData();
      formData.append('title', title);
      formData.append('category_id', catId);
      formData.append('start_datetime', \`\${formattedDate}T\${timeVal}:00\`);
      formData.append('price', numCost);
      formData.append('currency', 'INR');
      formData.append('venue_name', locationVal);
      formData.append('city', ceCity);
      formData.append('district', ceDistrict);
      formData.append('state', ceState);
      formData.append('postal_code', cePincode);
      formData.append('discovery_city', ceCity);
      formData.append('description', descVal || 'Join us for this community event!');

      if (fileInput && fileInput.files && fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
      }

      try {
        const res = await API.createEvent(formData);

        const newLocalEvent = {
          event_id: res.event_id || (activeEventsList.length + 1),
          title,
          category,
          price: numCost,
          isFree,
          priceLabel: isFree ? 'Free' : \`₹\${numCost}\`,
          location: { venue_name: locationVal, city: ceCity, district: ceDistrict, state: ceState },
          start_datetime: \`\${formattedDate}T\${timeVal}:00\`,
          description: descVal,
          image_url: res.image_url || uploadedCoverDataUrl,
          art: uploadedCoverDataUrl
            ? \`<img src="\${uploadedCoverDataUrl}" alt="\${title}" style="width:100%; height:180px; object-fit:cover; border-radius:14px;"/>\`
            : ILLUSTRATIONS.riverfront
        };
        activeEventsList.unshift(newLocalEvent);

        showToast(\`🎉 Event "\${title}" published successfully in \${ceCity}!\`);
        updateBrowsingCityUI(ceCity); // Switch view to the event city
        loadHomeEvents();
        renderBrowseCards();
        navigateTo('home');
      } catch (err) {
        showToast(err.message || 'Could not publish event. Please check inputs.');
      }
    }`;

  if (oldPublishFn.test(html)) {
    html = html.replace(oldPublishFn, newPublishFn);
  }

  // 9. Update loadProfile to display State, District, PIN code, Member Since
  const oldLoadProfileFn = /async function loadProfile\(\) \{[\s\S]*?document\.getElementById\('profileEditCity'\)\.value = currentUser\.city \|\| 'Ahmedabad';\s*\}/;
  const newLoadProfileFn = `async function loadProfile() {
      if (!currentUser) {
        navigateTo('login');
        return;
      }

      document.getElementById('profileNameHeading').textContent = currentUser.name || 'User';
      document.getElementById('profileEmailVal').textContent = currentUser.email || 'user@meetior.in';
      document.getElementById('profileCityVal').textContent = currentUser.city || 'Ahmedabad';
      document.getElementById('profileDistrictVal').textContent = currentUser.district || currentUser.city || 'Ahmedabad';
      document.getElementById('profileStateVal').textContent = currentUser.state || 'Gujarat';
      document.getElementById('profilePincodeVal').textContent = currentUser.pincode || 'N/A';
      document.getElementById('profileRoleVal').textContent = currentUser.role || 'Attendee';

      const memberDate = currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString('en-IN', { month:'long', year:'numeric' }) : 'October 2026';
      const memberSinceEl = document.getElementById('profileMemberSinceVal');
      if (memberSinceEl) memberSinceEl.textContent = memberDate;

      const badge = document.getElementById('profileRoleBadge');
      badge.textContent = currentUser.role || 'Attendee';
      badge.className = (currentUser.role === 'Organizer') ? 'status-badge status-valid' : 'status-badge status-confirmed';

      document.getElementById('profileAvatarIcon').textContent = (currentUser.role === 'Organizer') ? '🗓️' : '👤';
      document.getElementById('profileEditName').value = currentUser.name || '';
      document.getElementById('profileEditCity').value = currentUser.city || 'Ahmedabad';
    }`;

  if (oldLoadProfileFn.test(html)) {
    html = html.replace(oldLoadProfileFn, newLoadProfileFn);
  }

  // 10. Update initMeetior to restore activeBrowsingCity and preload states
  const oldInitRegex = /\(async function initMeetior\(\) \{[\s\S]*?navigateTo\('home'\);\s*\}\)\(\);/;
  const newInitCode = `(async function initMeetior() {
      preloadStates();
      updateBrowsingCityUI(activeBrowsingCity);

      const token = getAuthToken();
      if (token) {
        try {
          const res = await API.getMe();
          if (res && res.user) {
            currentUser = res.user;
            updateNavbarUserUI();
            if (currentUser.city) {
              updateBrowsingCityUI(currentUser.city);
            }
          }
        } catch (_) {
          setAuthToken(null);
        }
      }

      loadHomeEvents();
      renderBrowseCards();
      loadNotifications();
      navigateTo('home'); // Opens directly on Home page ready to explore
    })();`;

  if (oldInitRegex.test(html)) {
    html = html.replace(oldInitRegex, newInitCode);
  }

  // Write updated file
  fs.writeFileSync(filePath, html, 'utf8');

  // Verify syntax with vm.Script
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    try {
      new vm.Script(scriptMatch[1]);
      console.log(`✅ Client JS verified & 100% clean for: ${filePath}`);
    } catch (err) {
      console.error(`❌ Syntax error in ${filePath}:`, err.message);
    }
  }
});
