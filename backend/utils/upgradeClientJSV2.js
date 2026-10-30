'use strict';

const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, '../../../Project Demo Front End.html');
const destPath = path.resolve(__dirname, '../../frontend/index.html');

let html = fs.readFileSync(destPath, 'utf8');

// Find where API_BASE or navigateTo starts
const navStartIndex = html.indexOf('// FULL-STACK API SERVICE LAYER');
if (navStartIndex === -1) {
  console.error('Could not find API_BASE start');
  process.exit(1);
}

const beforeNav = html.substring(0, navStartIndex);

const upgradedEngineJS = `// FULL-STACK API SERVICE LAYER
    const API_BASE = (window.location.protocol === 'file:' || !window.location.origin.includes(':5000'))
      ? 'http://localhost:5000'
      : '';

    function getAuthToken() {
      return localStorage.getItem('meetior_token');
    }

    function setAuthToken(token) {
      if (token) localStorage.setItem('meetior_token', token);
      else localStorage.removeItem('meetior_token');
    }

    // Strict 2.5s timeout prevents any browser freezing or hanging
    async function apiFetch(endpoint, options = {}) {
      const url = \`\${API_BASE}\${endpoint}\`;
      const token = getAuthToken();
      const headers = { ...options.headers };

      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      if (token) {
        headers['Authorization'] = \`Bearer \${token}\`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      try {
        const res = await fetch(url, { ...options, headers, signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || \`Request failed (\${res.status})\`);
        }
        return data;
      } catch (err) {
        clearTimeout(timeoutId);
        console.warn('apiFetch fallback for', endpoint, ':', err.message);
        throw err;
      }
    }

    const API = {
      register: (payload) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
      login: (payload) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
      getMe: () => apiFetch('/api/auth/me'),
      updateProfile: (payload) => apiFetch('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
      logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),

      getEvents: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return apiFetch(\`/api/events\${qs ? '?' + qs : ''}\`);
      },
      getEventById: (id) => apiFetch(\`/api/events/\${id}\`),
      createEvent: (formData) => apiFetch('/api/events', { method: 'POST', body: formData }),
      interact: (id, type) => apiFetch(\`/api/events/\${id}/\${type.toLowerCase()}\`, { method: 'PUT' }),
      removeInteract: (id, type) => apiFetch(\`/api/events/\${id}/\${type.toLowerCase()}\`, { method: 'DELETE' }),

      registerEvent: (id) => apiFetch(\`/api/events/\${id}/register\`, { method: 'POST' }),
      cancelRegistration: (id) => apiFetch(\`/api/events/\${id}/registration\`, { method: 'DELETE' }),
      getMyBookings: () => apiFetch('/api/users/me/bookings'),
      getMySaved: () => apiFetch('/api/users/me/saved-events'),
      getTicket: (id) => apiFetch(\`/api/tickets/\${id}\`),

      getDemands: () => apiFetch('/api/demands'),
      createDemand: (payload) => apiFetch('/api/demands', { method: 'POST', body: JSON.stringify(payload) }),
      supportDemand: (id) => apiFetch(\`/api/demands/\${id}/support\`, { method: 'POST' }),

      requestSecondChance: (id, message) => apiFetch(\`/api/events/\${id}/second-chance\`, { method: 'POST', body: JSON.stringify({ message }) }),

      getMyOrganizedEvents: () => apiFetch('/api/organizer/events'),
      checkIn: (eventId, qr_token) => apiFetch(\`/api/organizer/events/\${eventId}/check-in\`, { method: 'POST', body: JSON.stringify({ qr_token }) }),
      getAttendance: (eventId) => apiFetch(\`/api/organizer/events/\${eventId}/attendance\`),

      getNotifications: () => apiFetch('/api/notifications'),
      markNotifRead: (id) => apiFetch(\`/api/notifications/\${id}/read\`, { method: 'PATCH' }),
      markAllNotifsRead: () => apiFetch('/api/notifications/read-all', { method: 'PATCH' }),

      submitReview: (eventId, rating, comment) => apiFetch(\`/api/events/\${eventId}/reviews\`, { method: 'POST', body: JSON.stringify({ rating, comment }) })
    };

    // ============================================================================
    // NAVIGATION & VIEW SWITCHER
    // ============================================================================
    const ALL_VIEWS = [
      'home', 'browse', 'details', 'create', 'register', 'login',
      'bookings', 'saved', 'demands', 'scanner', 'notifications', 'profile'
    ];

    function navigateTo(viewName) {
      // Role protection: Demand Engine and Scanner are strictly for Organizers
      if ((viewName === 'scanner' || viewName === 'demands' || viewName === 'create') && (!currentUser || currentUser.role !== 'Organizer')) {
        showToast('⚠️ Organizer login required to access this feature.');
        navigateTo('login');
        return;
      }

      ALL_VIEWS.forEach(v => {
        const el = document.getElementById(\`view-\${v}\`);
        if (el) el.classList.add('hidden');
        const pill = document.getElementById(\`pill-\${v}\`);
        if (pill) pill.classList.remove('active');
      });

      const targetEl = document.getElementById(\`view-\${viewName}\`);
      if (targetEl) targetEl.classList.remove('hidden');

      const activePill = document.getElementById(\`pill-\${viewName}\`);
      if (activePill) activePill.classList.add('active');

      const topNavbar = document.getElementById('topNavbar');
      if (viewName === 'login' || viewName === 'register') {
        topNavbar.classList.add('hidden');
      } else {
        topNavbar.classList.remove('hidden');
      }

      const navCenterTagline = document.getElementById('navCenterTagline');
      if (navCenterTagline) {
        navCenterTagline.style.visibility = (viewName === 'home') ? 'hidden' : 'visible';
      }

      updateNavbarUserUI();
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Trigger view-specific loaders
      if (viewName === 'home') loadHomeEvents();
      if (viewName === 'browse') renderBrowseCards();
      if (viewName === 'bookings') loadBookings();
      if (viewName === 'saved') loadSavedEvents();
      if (viewName === 'demands') loadDemands();
      if (viewName === 'scanner') loadScannerEvents();
      if (viewName === 'notifications') loadNotifications();
      if (viewName === 'profile') loadProfile();
    }

    function switchToOrganizerCreate() {
      if (!currentUser || currentUser.role !== 'Organizer') {
        quickLogin('Aarav Patel', 'Organizer');
      } else {
        navigateTo('create');
      }
    }

    function updateNavbarUserUI() {
      const guestBox = document.getElementById('navGuestActions');
      const userBox = document.getElementById('navUserActions');

      const demandLink = document.getElementById('navDemandLink');
      const createLink = document.getElementById('navCreateLink');
      const scannerLink = document.getElementById('navScannerLink');

      if (currentUser) {
        guestBox.classList.add('hidden');
        userBox.classList.remove('hidden');

        document.getElementById('navUserName').textContent = currentUser.name || 'User';
        document.getElementById('navUserRole').textContent = \`(\${currentUser.role || 'Attendee'})\`;

        // Strictly show Demand Engine, + Create Event, and Scan Passes ONLY to Organizers
        const isOrg = (currentUser.role === 'Organizer');
        if (demandLink) demandLink.style.display = isOrg ? 'inline-block' : 'none';
        if (createLink) createLink.style.display = isOrg ? 'inline-block' : 'none';
        if (scannerLink) scannerLink.style.display = isOrg ? 'inline-block' : 'none';
      } else {
        guestBox.classList.remove('hidden');
        userBox.classList.add('hidden');
        if (demandLink) demandLink.style.display = 'none';
        if (createLink) createLink.style.display = 'none';
        if (scannerLink) scannerLink.style.display = 'none';
      }
    }

    // ============================================================================
    // HOME & BROWSE EVENTS (EVERY CITY + SPECIFIC CITIES)
    // ============================================================================
    let activeEventsList = [...EVENTS_DATA];
    let currentDetailIndex = 0;

    async function loadHomeEvents() {
      const city = document.getElementById('homeCitySelect').value;
      const params = { limit: 6 };
      if (city && city !== 'all') {
        params.city = city;
      }

      try {
        const res = await API.getEvents(params);
        if (res && res.events && res.events.length > 0) {
          activeEventsList = res.events;
          renderHomeCardsWithData(res.events.slice(0, 3));
          return;
        }
      } catch (_) {
        // use offline fallback
      }
      const filtered = (city === 'all')
        ? EVENTS_DATA
        : EVENTS_DATA.filter(e => e.location?.toLowerCase().includes(city.toLowerCase()));
      activeEventsList = filtered.length > 0 ? filtered : EVENTS_DATA;
      renderHomeCardsWithData(activeEventsList.slice(0, 3));
    }

    function renderHomeCardsWithData(events) {
      const container = document.getElementById('homeCardsContainer');
      container.innerHTML = events.map((ev, idx) => {
        const art = ev.image_url
          ? \`<img src="\${API_BASE}\${ev.image_url}" alt="\${ev.title}" style="width:100%; height:180px; object-fit:cover; border-radius:14px;"/>\`
          : (ev.art || ILLUSTRATIONS.riverfront);
        const loc = ev.location ? (ev.location.venue_name || ev.location.city) : (ev.location || 'Ahmedabad');
        const dateStr = ev.start_datetime
          ? new Date(ev.start_datetime).toLocaleDateString('en-IN', { weekday: 'short', hour: '2-digit', minute:'2-digit' })
          : (ev.homeDate || 'This Weekend');

        return \`
          <article class="sketch-box event-card">
            <div class="card-illustration">\${art}</div>
            <h4>\${ev.title}</h4>
            <div class="card-meta">📅 \${dateStr}</div>
            <div class="card-meta">📍 \${loc}</div>
            <div class="card-btn-wrap">
              <button class="btn-crayon-yellow btn-card-view" onclick="openEventDetailsByIndex(\${idx})">
                View Details
              </button>
            </div>
          </article>
        \`;
      }).join('');
    }

    async function renderBrowseCards() {
      const container = document.getElementById('browseCardsContainer');
      const query = (document.getElementById('browseSearchInput').value || '').trim();
      const cat = document.getElementById('browseCategoryFilter').value;
      const city = document.getElementById('homeCitySelect').value;

      const params = {};
      if (query) params.search = query;
      if (cat !== 'all') params.category = cat;
      if (city && city !== 'all') params.city = city;

      try {
        const res = await API.getEvents(params);
        if (res && res.events) {
          activeEventsList = res.events;
        }
      } catch (_) {
        activeEventsList = EVENTS_DATA.filter(ev => {
          const matchQ = !query || ev.title.toLowerCase().includes(query.toLowerCase());
          const matchC = (cat === 'all') || (ev.category === cat);
          const matchCity = (city === 'all') || (ev.location?.toLowerCase().includes(city.toLowerCase()));
          const matchNear = !nearMeActive || ev.nearMe;
          return matchQ && matchC && matchCity && matchNear;
        });
      }

      if (activeEventsList.length === 0) {
        container.innerHTML = \`
          <div class="sketch-box" style="grid-column: 1 / -1; padding: 28px; text-align: center; font-size: 1.3rem;">
            No matching events found. Try clearing a filter or searching for another activity!
          </div>\`;
        return;
      }

      container.innerHTML = activeEventsList.map((ev, idx) => {
        const isFree = (ev.price === 0 || ev.price === '0' || ev.isFree);
        const priceLabel = isFree ? 'Free' : (ev.priceLabel || \`₹\${ev.price}\`);
        const badgeClass = isFree ? 'free' : 'paid';
        const badgeIcon = isFree ? '🟢' : '🎟️';
        const art = ev.image_url
          ? \`<img src="\${API_BASE}\${ev.image_url}" alt="\${ev.title}" style="width:100%; height:180px; object-fit:cover; border-radius:14px;"/>\`
          : (ev.art || ILLUSTRATIONS.riverfront);
        const loc = ev.location ? (ev.location.venue_name || ev.location.city) : (ev.location || 'Ahmedabad');
        const dateStr = ev.start_datetime
          ? new Date(ev.start_datetime).toLocaleDateString('en-IN', { weekday: 'short', month:'short', day:'numeric', hour: '2-digit', minute:'2-digit' })
          : (ev.browseDate || 'Upcoming');

        return \`
          <article class="sketch-box event-card">
            <div class="card-illustration">
              \${art}
              <span class="price-pill \${badgeClass}">\${badgeIcon} \${priceLabel}</span>
            </div>
            <h4>\${ev.title}</h4>
            <div class="card-meta">📅 \${dateStr}</div>
            <div class="card-meta">📍 \${loc}</div>
            <div class="card-btn-wrap">
              <button class="btn-crayon-yellow btn-card-view" onclick="openEventDetailsByIndex(\${idx})">
                View →
              </button>
            </div>
          </article>
        \`;
      }).join('');
    }

    function updateCityHeadings() {
      const city = document.getElementById('homeCitySelect').value;
      const isAll = (city === 'all');
      const label = isAll ? 'India' : city;

      document.getElementById('homeWeekendTitle').textContent = isAll
        ? 'Happening this weekend across India'
        : \`Happening this weekend in \${city}\`;

      document.getElementById('homeBrowseLink').textContent = isAll
        ? 'Browse all events across India →'
        : \`Browse all events in \${city} →\`;

      document.getElementById('browseMainHeading').textContent = isAll
        ? 'Browse All Events across India'
        : \`Browse All Events in \${city}\`;

      loadHomeEvents();
      renderBrowseCards();
    }

    function runHomeSearch() {
      const q = document.getElementById('homeSearchInput').value;
      document.getElementById('browseSearchInput').value = q;
      navigateTo('browse');
    }

    function toggleNearMe() {
      nearMeActive = !nearMeActive;
      document.getElementById('nearMeBtn').classList.toggle('active', nearMeActive);
      renderBrowseCards();
      showToast(nearMeActive ? 'Showing events within 15 km 📍' : 'Showing all events');
    }

    function selectPage(btn, pageNum) {
      document.querySelectorAll('.page-num').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showToast(\`Showing Page \${pageNum}\`);
    }

    function colorizeRainbowTitle(text) {
      const palette = ['#e55039', '#eb984e', '#f6b93b', '#78b833', '#38ada9', '#1e90ff', '#8c7ae6'];
      let colorIndex = 0;
      return (text || '').split('').map(ch => {
        if (ch === ' ') return ' ';
        const c = palette[colorIndex % palette.length];
        colorIndex++;
        return \`<span style="color:\${c}; text-shadow: 1px 1px 0 #2b2b2b;">\${ch}</span>\`;
      }).join('');
    }

    // ============================================================================
    // EVENT DETAILS, BULLETPROOF CAROUSEL & DOTS
    // ============================================================================
    function openEventDetailsByIndex(index) {
      if (!activeEventsList || activeEventsList.length === 0) {
        activeEventsList = [...EVENTS_DATA];
      }
      currentDetailIndex = (index + activeEventsList.length) % activeEventsList.length;
      const ev = activeEventsList[currentDetailIndex];

      document.getElementById('detailRainbowTitle').innerHTML = colorizeRainbowTitle(ev.title);

      const artBox = document.getElementById('detailArtworkBox');
      if (ev.image_url || ev.original_image_url) {
        artBox.innerHTML = \`<img src="\${API_BASE}\${ev.image_url || ev.original_image_url}" alt="\${ev.title}" style="width:100%; height:240px; object-fit:cover; border-radius:14px;"/>\`;
      } else {
        artBox.innerHTML = ev.art || ILLUSTRATIONS.riverfront;
      }

      const isFree = (ev.price === 0 || ev.price === '0' || ev.isFree);
      const priceLabel = isFree ? 'Free' : (ev.priceLabel || \`₹\${ev.price}\`);
      document.getElementById('detailPriceBanner').innerHTML = isFree
        ? '🟢 Free Community Event'
        : \`🎟️ Paid Event (\${priceLabel} per attendee)\`;

      const dateStr = ev.start_datetime
        ? new Date(ev.start_datetime).toLocaleDateString('en-IN', { weekday: 'long', year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
        : (ev.fullDate || 'Saturday, 7:00 AM');
      const locStr = ev.location
        ? (ev.location.formatted_address || \`\${ev.location.venue_name || ''}, \${ev.location.city || ''}\`)
        : (ev.fullLocation || 'Ahmedabad, Gujarat');
      const orgStr = ev.organizer ? (ev.organizer.name || ev.organizer) : 'Community Organizer';

      document.getElementById('detailDateTime').textContent = dateStr;
      document.getElementById('detailLocation').textContent = locStr;
      document.getElementById('detailOrganizer').textContent = orgStr;
      document.getElementById('detailDescription').textContent = ev.description || 'Join us for this community event!';

      // Second Chance button for completed/cancelled events
      const scBox = document.getElementById('detailSecondChanceBox');
      if (scBox) {
        scBox.style.display = (ev.status === 'Completed' || ev.status === 'Cancelled') ? 'block' : 'none';
      }

      // Reviews
      const revBox = document.getElementById('reviewsList');
      if (revBox) {
        if (ev.reviews && ev.reviews.length > 0) {
          revBox.innerHTML = ev.reviews.map(r => \`
            <div style="border-bottom:1px dashed #ddd; padding:6px 0;">
              <strong>\${'⭐'.repeat(r.rating)} (\${r.rating}/5)</strong> by \${r.reviewer?.name || 'Verified Attendee'}
              <div>\${r.comment || ''}</div>
            </div>
          \`).join('');
        } else {
          revBox.innerHTML = 'No reviews yet. Be the first checked-in attendee to leave one!';
        }
      }

      // Render dots dynamically with active highlight matching current index
      const dotsEl = document.getElementById('detailDots');
      const displayCount = Math.min(activeEventsList.length, 6);
      dotsEl.innerHTML = activeEventsList.slice(0, displayCount).map((_, i) =>
        \`<span class="dot \${i === currentDetailIndex ? 'active' : ''}" onclick="openEventDetailsByIndex(\${i})"></span>\`
      ).join('');

      navigateTo('details');
    }

    function openEventDetails(index) {
      openEventDetailsByIndex(index);
    }

    function cycleDetailEvent(step) {
      openEventDetailsByIndex(currentDetailIndex + step);
    }

    async function handleRsvp(actionType) {
      if (!currentUser) {
        showToast('Please log in as an Attendee to RSVP!');
        await quickLogin('Priya Sharma', 'Attendee');
      }

      const ev = activeEventsList[currentDetailIndex];
      const evId = ev?.event_id || ev?.id;
      if (evId) {
        try {
          await API.interact(evId, actionType);
        } catch (_) {}
      }
      showToast(\`\${actionType} recorded for "\${ev?.title}"!\`);
    }

    async function handleEventRegistration() {
      if (!currentUser) {
        showToast('Please log in to register & receive your pass!');
        await quickLogin('Priya Sharma', 'Attendee');
      }

      const ev = activeEventsList[currentDetailIndex];
      const evId = ev?.event_id || 1;
      try {
        const res = await API.registerEvent(evId);
        showToast('🎉 Registration Confirmed! Here is your Digital Event Pass.');

        openPassModal({
          title: ev?.title || 'Meetior Event',
          attendee: currentUser?.name || 'Priya Sharma',
          ticket_no: res.ticket_number || 'MTR-PASS-DEMO',
          date: document.getElementById('detailDateTime').textContent,
          venue: document.getElementById('detailLocation').textContent,
          qr_code: res.qr_code
        });
      } catch (err) {
        if (err.message.includes('already registered')) {
          showToast('You are already registered! Opening your pass 🎟️');
          loadBookings();
          navigateTo('bookings');
        } else {
          showToast(err.message || 'Registration failed.');
        }
      }
    }

    function promptSecondChance() {
      const msg = prompt('Tell the organizer why you would like another session of this event:');
      if (!msg) return;
      const ev = activeEventsList[currentDetailIndex];
      API.requestSecondChance(ev?.event_id || 1, msg)
        .then(() => showToast('Second Chance request submitted! Organizer notified.'))
        .catch(err => showToast(err.message || 'Could not submit request.'));
    }

    // ============================================================================
    // DIGITAL EVENT PASS MODAL
    // ============================================================================
    function openPassModal(ticket) {
      document.getElementById('passEventTitle').textContent = ticket.title;
      document.getElementById('passAttendeeName').textContent = ticket.attendee || currentUser?.name || 'Attendee';
      document.getElementById('passTicketNo').textContent = ticket.ticket_no || 'MTR-PASS-DEMO';
      document.getElementById('passDateTime').textContent = ticket.date || 'Upcoming';
      document.getElementById('passVenue').textContent = ticket.venue || 'Ahmedabad';

      const qrImg = document.getElementById('passQrImg');
      if (ticket.qr_code) {
        qrImg.src = ticket.qr_code;
      } else {
        qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(ticket.ticket_no || 'MEETIOR_TICKET');
      }

      document.getElementById('passModal').classList.remove('hidden');
    }

    function closePassModal() {
      document.getElementById('passModal').classList.add('hidden');
    }

    // ============================================================================
    // MY BOOKINGS & PASSES
    // ============================================================================
    async function loadBookings() {
      const container = document.getElementById('bookingsContainer');
      container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:20px;">Loading your bookings...</div>';

      try {
        const res = await API.getMyBookings();
        if (res && res.bookings && res.bookings.length > 0) {
          container.innerHTML = res.bookings.map(b => {
            const ev = b.event || {};
            const ticket = b.ticket || {};
            const statusClass = b.registration_status === 'Confirmed' ? 'status-confirmed' : 'status-cancelled';
            const dateStr = ev.start_datetime
              ? new Date(ev.start_datetime).toLocaleDateString('en-IN', { weekday: 'short', month:'short', day:'numeric', hour: '2-digit', minute:'2-digit' })
              : 'Upcoming';

            return \`
              <article class="sketch-box event-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <span class="status-badge \${statusClass}">\${b.registration_status}</span>
                  <small style="font-weight:700;">\${ticket.public_ticket_number || 'Pass Ready'}</small>
                </div>
                <h4>\${ev.title || 'Meetior Event'}</h4>
                <div class="card-meta">📅 \${dateStr}</div>
                <div class="card-meta">📍 \${ev.location?.venue_name || 'Ahmedabad'}</div>
                <div style="display:flex; gap:8px; margin-top:14px;">
                  <button class="btn-crayon-yellow" style="flex:1; padding:6px 12px; font-size:1.05rem;" onclick="viewPassFromBooking(\${b.registration_id})">
                    🎟️ View Pass
                  </button>
                  <button class="btn-sketch-white" style="padding:6px 10px; font-size:0.95rem; color:#b71540;" onclick="cancelBooking(\${ev.event_id})">
                    Cancel
                  </button>
                </div>
              </article>
            \`;
          }).join('');
          return;
        }
      } catch (_) {}

      container.innerHTML = \`
        <div class="sketch-box" style="grid-column: 1 / -1; padding: 28px; text-align: center; font-size: 1.25rem;">
          No bookings yet! Browse events and click <strong>"Register & Get Pass"</strong> to receive your QR entry pass.
          <div style="margin-top: 14px;">
            <button class="btn-crayon-yellow" onclick="navigateTo('browse')">Browse Events →</button>
          </div>
        </div>
      \`;
    }

    async function viewPassFromBooking(regId) {
      try {
        const res = await API.getMyBookings();
        const b = res.bookings?.find(x => x.registration_id === regId);
        if (b && b.ticket) {
          const tRes = await API.getTicket(b.ticket.ticket_id);
          openPassModal({
            title: b.event?.title || 'Meetior Event',
            attendee: currentUser?.name || 'Attendee',
            ticket_no: b.ticket.public_ticket_number,
            date: b.event?.start_datetime ? new Date(b.event.start_datetime).toLocaleString() : 'Scheduled Date',
            venue: b.event?.location?.venue_name || 'Event Venue',
            qr_code: tRes.qr_code
          });
          return;
        }
      } catch (_) {}
      showToast('Could not load pass details.');
    }

    async function cancelBooking(eventId) {
      if (!confirm('Are you sure you want to cancel your registration? Your digital pass will be invalidated.')) return;
      try {
        await API.cancelRegistration(eventId);
        showToast('Booking cancelled.');
        loadBookings();
      } catch (err) {
        showToast(err.message || 'Could not cancel booking.');
      }
    }

    // ============================================================================
    // MY SAVED EVENTS
    // ============================================================================
    async function loadSavedEvents() {
      const container = document.getElementById('savedEventsContainer');
      container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:20px;">Loading saved events...</div>';

      try {
        const res = await API.getMySaved();
        if (res && res.saved_events && res.saved_events.length > 0) {
          container.innerHTML = res.saved_events.map((ev, idx) => \`
            <article class="sketch-box event-card">
              <h4>\${ev.title}</h4>
              <div class="card-meta">📍 \${ev.location?.venue_name || ev.location?.city || 'Ahmedabad'}</div>
              <div style="display:flex; gap:8px; margin-top:14px;">
                <button class="btn-crayon-yellow" style="flex:1; padding:6px 12px;" onclick="openEventDetailsByIndex(\${idx})">
                  View →
                </button>
                <button class="btn-sketch-white" style="padding:6px 10px; color:#b71540;" onclick="removeSavedEvent(\${ev.event_id})">
                  Remove
                </button>
              </div>
            </article>
          \`).join('');
          return;
        }
      } catch (_) {}

      container.innerHTML = \`
        <div class="sketch-box" style="grid-column: 1 / -1; padding: 28px; text-align: center; font-size: 1.25rem;">
          You haven't bookmarked any events yet. Click <strong>"Save 🔖"</strong> on any event card to save it here!
        </div>
      \`;
    }

    async function removeSavedEvent(eventId) {
      try {
        await API.removeInteract(eventId, 'Save');
        showToast('Removed from saved events.');
        loadSavedEvents();
      } catch (err) {
        showToast(err.message || 'Could not remove.');
      }
    }

    // ============================================================================
    // COMMUNITY DEMAND ENGINE (ORGANIZER VIEW & RESPONSES)
    // ============================================================================
    async function loadDemands() {
      const container = document.getElementById('demandsListContainer');
      container.innerHTML = '<div style="padding:20px; text-align:center;">Loading community requests...</div>';

      try {
        const res = await API.getDemands();
        if (res && res.demands && res.demands.length > 0) {
          container.innerHTML = res.demands.map(d => \`
            <div class="demand-item-box">
              <div class="demand-header-row">
                <strong style="font-size: 1.25rem; color: #222;">\${d.title}</strong>
                <span class="status-badge status-confirmed">\${d.status}</span>
              </div>
              <p style="font-size: 1.05rem; color: #444; margin: 4px 0;">\${d.description || 'Community requested meetup'}</p>
              <div style="font-size: 0.95rem; color: #666;">
                📍 \${d.preferred_location || d.city} · 👤 Requested by \${d.creator?.name || 'Local Member'}
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                <span style="font-size: 1.15rem; font-weight:700; color:#b71540;">
                  🔥 \${d.supporter_count || 1} Supporters
                </span>
                <button class="btn-crayon-yellow" style="padding:4px 14px; font-size:1.05rem;" onclick="supportDemand(\${d.demand_id})">
                  + Support This!
                </button>
              </div>
            </div>
          \`).join('');
          return;
        }
      } catch (_) {}

      container.innerHTML = '<div class="sketch-box" style="padding:20px; text-align:center;">No demands yet. Submit the first event request!</div>';
    }

    async function handleDemandSubmit(e) {
      e.preventDefault();
      const title = document.getElementById('demandTitle').value.trim();
      const category_id = parseInt(document.getElementById('demandCategory').value);
      const city = document.getElementById('demandCity').value;
      const preferred_location = document.getElementById('demandLocation').value.trim();
      const description = document.getElementById('demandDesc').value.trim();

      try {
        await API.createDemand({ title, category_id, city, preferred_location, description });
        showToast('Event demand posted! Organizers can now review it.');
        document.getElementById('demandTitle').value = '';
        document.getElementById('demandDesc').value = '';
        loadDemands();
      } catch (err) {
        showToast(err.message || 'Could not post demand.');
      }
    }

    async function supportDemand(demandId) {
      try {
        await API.supportDemand(demandId);
        showToast('Supported! Your vote has been recorded. 🔥');
        loadDemands();
      } catch (err) {
        showToast(err.message || 'Could not support demand.');
      }
    }

    // ============================================================================
    // ORGANIZER QR SCANNER & CHECK-IN
    // ============================================================================
    let activeCameraStream = null;

    async function loadScannerEvents() {
      const select = document.getElementById('scannerEventSelect');
      select.innerHTML = '<option value="">Loading your organized events...</option>';

      try {
        const res = await API.getMyOrganizedEvents();
        if (res && res.events && res.events.length > 0) {
          select.innerHTML = res.events.map(e => \`
            <option value="\${e.event_id}">\${e.title} (\${e.status})</option>
          \`).join('');
          loadScannerAttendance();
          return;
        }
      } catch (_) {}

      select.innerHTML = '<option value="1">Sabarmati Riverfront Walk (Sample Event)</option>';
      loadScannerAttendance();
    }

    async function loadScannerAttendance() {
      const eventId = document.getElementById('scannerEventSelect').value || 1;
      try {
        const res = await API.getAttendance(eventId);
        if (res && res.attendance) {
          document.getElementById('attendanceCount').textContent = res.total_checkins || res.attendance.length;
          const tbody = document.getElementById('attendanceTableBody');
          if (res.attendance.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#777;">No check-ins yet for this session.</td></tr>';
          } else {
            tbody.innerHTML = res.attendance.map(a => \`
              <tr>
                <td><strong>\${a.attendee?.name || 'Verified Attendee'}</strong></td>
                <td><code>\${a.ticket_number || 'N/A'}</code></td>
                <td>\${new Date(a.checked_in_at).toLocaleTimeString()}</td>
              </tr>
            \`).join('');
          }
        }
      } catch (_) {}
    }

    async function toggleCameraScanner() {
      const video = document.getElementById('scannerVideo');
      const btn = document.getElementById('btnToggleCam');
      const placeholder = document.getElementById('scannerPlaceholderMsg');

      if (activeCameraStream) {
        activeCameraStream.getTracks().forEach(t => t.stop());
        activeCameraStream = null;
        video.srcObject = null;
        btn.textContent = 'Start Camera';
        placeholder.style.display = 'block';
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        activeCameraStream = stream;
        video.srcObject = stream;
        btn.textContent = 'Stop Camera';
        placeholder.style.display = 'none';
        showToast('Camera active! Point at attendee QR code.');
      } catch (err) {
        showToast('Camera access not granted or unavailable.');
      }
    }

    async function verifyScannedToken(token) {
      if (!token) {
        showToast('Please enter a QR token.');
        return;
      }
      const eventId = document.getElementById('scannerEventSelect').value || 1;
      const resultBox = document.getElementById('scanResultBox');
      resultBox.classList.remove('hidden', 'scan-result-success', 'scan-result-duplicate', 'scan-result-error');

      try {
        const res = await API.checkIn(eventId, token.trim());
        resultBox.classList.add('scan-result-success');
        resultBox.innerHTML = \`
          ✅ <strong>Entry Allowed ✓</strong><br>
          Attendee: <strong>\${res.attendee || 'Verified Attendee'}</strong><br>
          <small>Ticket: \${res.ticket_number || 'Valid Ticket'}</small>
        \`;
        loadScannerAttendance();
      } catch (err) {
        if (err.message.includes('Already checked in')) {
          resultBox.classList.add('scan-result-duplicate');
          resultBox.innerHTML = \`⚠️ <strong>Already Checked In</strong><br>\${err.message}\`;
        } else {
          resultBox.classList.add('scan-result-error');
          resultBox.innerHTML = \`❌ <strong>Invalid Ticket</strong><br>\${err.message}\`;
        }
      }
    }

    function simulateScan() {
      const sampleToken = 'test_qr_token_' + Math.random().toString(36).substring(7);
      document.getElementById('manualTokenInput').value = sampleToken;
      showToast('Simulating attendee pass scan...');
      verifyScannedToken(sampleToken);
    }

    // ============================================================================
    // USER PROFILE VIEW
    // ============================================================================
    async function loadProfile() {
      if (!currentUser) {
        navigateTo('login');
        return;
      }

      document.getElementById('profileNameHeading').textContent = currentUser.name || 'User';
      document.getElementById('profileEmailVal').textContent = currentUser.email || 'user@meetior.in';
      document.getElementById('profileCityVal').textContent = currentUser.city || 'Ahmedabad';
      document.getElementById('profileRoleVal').textContent = currentUser.role || 'Attendee';

      const badge = document.getElementById('profileRoleBadge');
      badge.textContent = currentUser.role || 'Attendee';
      badge.className = (currentUser.role === 'Organizer') ? 'status-badge status-valid' : 'status-badge status-confirmed';

      document.getElementById('profileAvatarIcon').textContent = (currentUser.role === 'Organizer') ? '🗓️' : '👤';
      document.getElementById('profileEditName').value = currentUser.name || '';
      document.getElementById('profileEditCity').value = currentUser.city || 'Ahmedabad';
    }

    async function handleUpdateProfile(e) {
      e.preventDefault();
      const name = document.getElementById('profileEditName').value.trim();
      const city = document.getElementById('profileEditCity').value;

      try {
        const res = await API.updateProfile({ name, city });
        currentUser = res.user;
        updateNavbarUserUI();
        loadProfile();
        showToast('Profile updated successfully! ✅');
      } catch (err) {
        showToast(err.message || 'Could not update profile.');
      }
    }

    async function handleUserLogout() {
      setAuthToken(null);
      currentUser = null;
      updateNavbarUserUI();
      showToast('Logged out successfully.');
      navigateTo('home');
    }

    // ============================================================================
    // NOTIFICATIONS
    // ============================================================================
    async function loadNotifications() {
      const container = document.getElementById('notificationsList');
      const badge = document.getElementById('notifBadge');

      try {
        const res = await API.getNotifications();
        if (res && res.notifications) {
          if (res.unread_count > 0) {
            badge.textContent = res.unread_count;
            badge.style.display = 'inline-block';
          } else {
            badge.style.display = 'none';
          }

          if (res.notifications.length === 0) {
            container.innerHTML = '<div style="padding:24px; text-align:center; color:#666;">No notifications right now. You are all caught up! ✨</div>';
            return;
          }

          container.innerHTML = res.notifications.map(n => \`
            <div class="notif-item \${n.is_read ? '' : 'unread'}" onclick="markNotifRead(\${n.notification_id})">
              <span style="font-size:1.4rem;">\${n.notification_type?.includes('reminder') ? '⏰' : '🔔'}</span>
              <div style="flex:1;">
                <strong>\${n.title}</strong>
                <p style="margin:2px 0; color:#444;">\${n.message}</p>
                <small style="color:#777;">\${new Date(n.created_at).toLocaleString()}</small>
              </div>
            </div>
          \`).join('');
          return;
        }
      } catch (_) {}

      container.innerHTML = '<div style="padding:24px; text-align:center; color:#666;">Log in to view your notification center and scheduled reminders.</div>';
    }

    async function markNotifRead(id) {
      try {
        await API.markNotifRead(id);
        loadNotifications();
      } catch (_) {}
    }

    async function markAllNotificationsRead() {
      try {
        await API.markAllNotifsRead();
        showToast('All notifications marked as read.');
        loadNotifications();
      } catch (_) {}
    }

    // ============================================================================
    // AUTH SUBMISSIONS & INSTANT REDIRECT TO HOME
    // ============================================================================
    async function submitRegisterForm(e) {
      e.preventDefault();
      const vName = validateNameLive();
      const vEmail = validateEmailLive();
      const vPass = validatePasswordLive();
      const vConfirm = validateConfirmLive();
      const vCity = validateCityLive();
      const vRole = Boolean(selectedRegRole);

      if (!vRole) {
        document.getElementById('errRole').classList.add('visible');
      }

      if (vName && vEmail && vPass && vConfirm && vCity && vRole) {
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPass').value;
        const city = document.getElementById('regCity').value;
        const role = selectedRegRole;

        try {
          const res = await API.register({ name, email, password, city, role });
          setAuthToken(res.token);
          currentUser = res.user;
          showToast(\`Account created! Welcome, \${currentUser.name} 🎉\`);
          updateNavbarUserUI();
          navigateTo('home'); // ALWAYS redirect to Home page
        } catch (err) {
          showToast(err.message || 'Registration failed.');
        }
      } else {
        showToast('Please complete the highlighted required fields.');
      }
    }

    async function handleLoginSubmit(e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      try {
        const res = await API.login({ email, password });
        setAuthToken(res.token);
        currentUser = res.user;
        showToast(\`Welcome back, \${currentUser.name}! 🌟\`);
        updateNavbarUserUI();
        navigateTo('home'); // ALWAYS redirect to Home page
      } catch (err) {
        showToast(err.message || 'Incorrect email or password.');
      }
    }

    async function quickLogin(displayName, role) {
      const email = (role === 'Organizer') ? 'organizer@meetior.in' : 'attendee@meetior.in';
      try {
        const res = await API.login({ email, password: 'Meetior2026' });
        setAuthToken(res.token);
        currentUser = res.user;
        showToast(\`Logged in as \${currentUser.name} (\${currentUser.role})\`);
      } catch (_) {
        currentUser = { name: displayName, role, email };
        showToast(\`Logged in as \${displayName} (\${role})\`);
      }
      updateNavbarUserUI();
      navigateTo('home'); // ALWAYS redirect to Home page
      loadNotifications();
    }

    // ============================================================================
    // CREATE EVENT (HANDLES DATE & MULTIPART IMAGE UPLOAD)
    // ============================================================================
    async function handlePublishEvent(e) {
      e.preventDefault();
      const title = document.getElementById('ceTitle').value.trim();
      const category = document.getElementById('ceCategory').value;
      const dateVal = document.getElementById('ceDate').value.trim();
      const timeVal = document.getElementById('ceTime').value.trim();
      const costVal = document.getElementById('ceCost').value.trim();
      const locationVal = document.getElementById('ceLocation').value.trim();
      const descVal = document.getElementById('ceDesc').value.trim();
      const fileInput = document.getElementById('cePhotoInput');

      if (title.length < 3 || !category || !dateVal || !timeVal || !costVal || !locationVal) {
        showToast('Please fill in all required (*) fields before publishing.');
        return;
      }

      // Convert DD/MM/YYYY if entered in that format
      let formattedDate = dateVal;
      if (dateVal.includes('/')) {
        const p = dateVal.split('/');
        if (p.length === 3) formattedDate = \`\${p[2]}-\${p[1]}-\${p[0]}\`;
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
      formData.append('city', 'Ahmedabad');
      formData.append('description', descVal || 'Join us for this community event!');

      if (fileInput.files && fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
      }

      try {
        const res = await API.createEvent(formData);

        // Immediate local cache addition so user sees their new event instantly
        const newLocalEvent = {
          event_id: res.event_id || (activeEventsList.length + 1),
          title,
          category,
          price: numCost,
          isFree,
          priceLabel: isFree ? 'Free' : \`₹\${numCost}\`,
          location: { venue_name: locationVal, city: 'Ahmedabad' },
          start_datetime: \`\${formattedDate}T\${timeVal}:00\`,
          description: descVal,
          image_url: res.image_url || uploadedCoverDataUrl,
          art: uploadedCoverDataUrl
            ? \`<img src="\${uploadedCoverDataUrl}" alt="\${title}" style="width:100%; height:180px; object-fit:cover; border-radius:14px;"/>\`
            : ILLUSTRATIONS.riverfront
        };
        activeEventsList.unshift(newLocalEvent);

        showToast(\`🎉 Event "\${title}" published successfully!\`);
        loadHomeEvents();
        renderBrowseCards();
        navigateTo('home');
      } catch (err) {
        showToast(err.message || 'Could not publish event. Please check inputs.');
      }
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================
    (async function initMeetior() {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await API.getMe();
          if (res && res.user) {
            currentUser = res.user;
            updateNavbarUserUI();
          }
        } catch (_) {
          setAuthToken(null);
        }
      }

      loadHomeEvents();
      renderBrowseCards();
      loadNotifications();
      navigateTo('home'); // Opens directly on Home page ready to explore
    })();
  </script>
</body>
</html>
`;

const finalHTML = beforeNav + upgradedEngineJS;

fs.writeFileSync(destPath, finalHTML, 'utf8');
fs.writeFileSync(srcPath, finalHTML, 'utf8');

console.log('✅ JavaScript engine V2 completely upgraded in both files!');
