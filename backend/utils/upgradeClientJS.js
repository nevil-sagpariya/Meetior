'use strict';

const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, '../../../Project Demo Front End.html');
const destPath = path.resolve(__dirname, '../../frontend/index.html');

let html = fs.readFileSync(destPath, 'utf8');

// Find where navigationTo starts
const navStartIndex = html.indexOf('function navigateTo(viewName) {');
if (navStartIndex === -1) {
  console.error('Could not find navigateTo start');
  process.exit(1);
}

// Keep everything before navigateTo, which includes ILLUSTRATIONS, state, eye icon, live validations
const beforeNav = html.substring(0, navStartIndex);

// Build the complete client-side full-stack JS engine
const upgradedJS = `
    // ============================================================================
    // FULL-STACK API SERVICE LAYER
    // ============================================================================
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

      try {
        const res = await fetch(url, { ...options, headers });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || \`Request failed (\${res.status})\`);
        }
        return data;
      } catch (err) {
        console.warn('apiFetch warning for', endpoint, ':', err.message);
        throw err;
      }
    }

    const API = {
      // Auth
      register: (payload) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
      login: (payload) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
      getMe: () => apiFetch('/api/auth/me'),
      logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),

      // Events
      getEvents: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return apiFetch(\`/api/events\${qs ? '?' + qs : ''}\`);
      },
      getEventById: (id) => apiFetch(\`/api/events/\${id}\`),
      createEvent: (formData) => apiFetch('/api/events', { method: 'POST', body: formData }),
      interact: (id, type) => apiFetch(\`/api/events/\${id}/\${type.toLowerCase()}\`, { method: 'PUT' }),
      removeInteract: (id, type) => apiFetch(\`/api/events/\${id}/\${type.toLowerCase()}\`, { method: 'DELETE' }),

      // Registration & Bookings
      registerEvent: (id) => apiFetch(\`/api/events/\${id}/register\`, { method: 'POST' }),
      cancelRegistration: (id) => apiFetch(\`/api/events/\${id}/registration\`, { method: 'DELETE' }),
      getMyBookings: () => apiFetch('/api/users/me/bookings'),
      getMySaved: () => apiFetch('/api/users/me/saved-events'),
      getTicket: (id) => apiFetch(\`/api/tickets/\${id}\`),

      // Demands
      getDemands: () => apiFetch('/api/demands'),
      createDemand: (payload) => apiFetch('/api/demands', { method: 'POST', body: JSON.stringify(payload) }),
      supportDemand: (id) => apiFetch(\`/api/demands/\${id}/support\`, { method: 'POST' }),

      // Second Chance
      requestSecondChance: (id, message) => apiFetch(\`/api/events/\${id}/second-chance\`, { method: 'POST', body: JSON.stringify({ message }) }),

      // Scanner / Attendance
      getMyOrganizedEvents: () => apiFetch('/api/organizer/events'),
      checkIn: (eventId, qr_token) => apiFetch(\`/api/organizer/events/\${eventId}/check-in\`, { method: 'POST', body: JSON.stringify({ qr_token }) }),
      getAttendance: (eventId) => apiFetch(\`/api/organizer/events/\${eventId}/attendance\`),

      // Notifications
      getNotifications: () => apiFetch('/api/notifications'),
      markNotifRead: (id) => apiFetch(\`/api/notifications/\${id}/read\`, { method: 'PATCH' }),
      markAllNotifsRead: () => apiFetch('/api/notifications/read-all', { method: 'PATCH' }),

      // Reviews
      submitReview: (eventId, rating, comment) => apiFetch(\`/api/events/\${eventId}/reviews\`, { method: 'POST', body: JSON.stringify({ rating, comment }) })
    };

    // ============================================================================
    // NAVIGATION & VIEW SWITCHER (SUPPORTS ALL 11 VIEWS)
    // ============================================================================
    const ALL_VIEWS = [
      'home', 'browse', 'details', 'create', 'register', 'login',
      'bookings', 'saved', 'demands', 'scanner', 'notifications'
    ];

    function navigateTo(viewName) {
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

      // Trigger view-specific data loaders
      if (viewName === 'home') loadHomeEvents();
      if (viewName === 'browse') renderBrowseCards();
      if (viewName === 'bookings') loadBookings();
      if (viewName === 'saved') loadSavedEvents();
      if (viewName === 'demands') loadDemands();
      if (viewName === 'scanner') loadScannerEvents();
      if (viewName === 'notifications') loadNotifications();
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
      const scannerLink = document.getElementById('navScannerLink');
      const createLink = document.getElementById('navCreateLink');

      if (currentUser) {
        guestBox.classList.add('hidden');
        userBox.classList.remove('hidden');
        document.getElementById('navUserName').textContent = currentUser.name || 'User';
        document.getElementById('navUserRole').textContent = \`(\${currentUser.role || 'Attendee'})\`;

        if (scannerLink) {
          scannerLink.style.display = (currentUser.role === 'Organizer') ? 'inline-block' : 'none';
        }
        if (createLink) {
          createLink.style.display = (currentUser.role === 'Organizer') ? 'inline-block' : 'none';
        }
      } else {
        guestBox.classList.remove('hidden');
        userBox.classList.add('hidden');
      }
    }

    async function toggleRoleOrLogout() {
      if (!currentUser) return;
      if (currentUser.role === 'Organizer') {
        await quickLogin('Priya Sharma', 'Attendee');
        showToast('Switched account to Attendee (Priya)');
      } else {
        setAuthToken(null);
        currentUser = null;
        updateNavbarUserUI();
        showToast('Logged out to Guest view');
        navigateTo('home');
      }
    }

    // ============================================================================
    // HOME & BROWSE EVENTS (BACKEND API + OFFLINE FALLBACK)
    // ============================================================================
    let activeEventsList = [...EVENTS_DATA];

    async function loadHomeEvents() {
      const city = document.getElementById('homeCitySelect').value;
      try {
        const res = await API.getEvents({ city, limit: 3 });
        if (res && res.events && res.events.length > 0) {
          renderHomeCardsWithData(res.events);
          return;
        }
      } catch (_) {
        // use local fallback
      }
      renderHomeCardsWithData(EVENTS_DATA.slice(0, 3));
    }

    function renderHomeCardsWithData(events) {
      const container = document.getElementById('homeCardsContainer');
      container.innerHTML = events.map((ev, idx) => {
        const art = ev.image_url ? \`<img src="\${API_BASE}\${ev.image_url}" alt="\${ev.title}" style="width:100%; height:180px; object-fit:cover; border-radius:14px;"/>\` : (ev.art || ILLUSTRATIONS.riverfront);
        const loc = ev.location ? (ev.location.venue_name || ev.location.city) : (ev.location || 'Ahmedabad');
        const dateStr = ev.start_datetime ? new Date(ev.start_datetime).toLocaleDateString('en-IN', { weekday: 'short', hour: '2-digit', minute:'2-digit' }) : (ev.homeDate || 'This Weekend');

        return \`
          <article class="sketch-box event-card">
            <div class="card-illustration">\${art}</div>
            <h4>\${ev.title}</h4>
            <div class="card-meta">📅 \${dateStr}</div>
            <div class="card-meta">📍 \${loc}</div>
            <div class="card-btn-wrap">
              <button class="btn-crayon-yellow btn-card-view" onclick="openEventDetailsById(\${ev.event_id || ev.id || idx})">
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
      const city = document.getElementById('homeCitySelect').value || 'Ahmedabad';

      const params = {};
      if (query) params.search = query;
      if (cat !== 'all') params.category = cat;
      if (city) params.city = city;

      try {
        const res = await API.getEvents(params);
        if (res && res.events) {
          activeEventsList = res.events;
        }
      } catch (_) {
        // filter local EVENTS_DATA
        activeEventsList = EVENTS_DATA.filter(ev => {
          const matchQ = !query || ev.title.toLowerCase().includes(query.toLowerCase());
          const matchC = (cat === 'all') || (ev.category === cat);
          const matchNear = !nearMeActive || ev.nearMe;
          return matchQ && matchC && matchNear;
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
        const art = ev.image_url ? \`<img src="\${API_BASE}\${ev.image_url}" alt="\${ev.title}" style="width:100%; height:180px; object-fit:cover; border-radius:14px;"/>\` : (ev.art || ILLUSTRATIONS.riverfront);
        const loc = ev.location ? (ev.location.venue_name || ev.location.city) : (ev.location || 'Ahmedabad');
        const dateStr = ev.start_datetime ? new Date(ev.start_datetime).toLocaleDateString('en-IN', { weekday: 'short', month:'short', day:'numeric', hour: '2-digit', minute:'2-digit' }) : (ev.browseDate || 'Upcoming');

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
              <button class="btn-crayon-yellow btn-card-view" onclick="openEventDetailsById(\${ev.event_id || ev.id || idx})">
                View →
              </button>
            </div>
          </article>
        \`;
      }).join('');
    }

    function updateCityHeadings() {
      const city = document.getElementById('homeCitySelect').value;
      document.getElementById('homeWeekendTitle').textContent = \`Happening this weekend in \${city}\`;
      document.getElementById('homeBrowseLink').textContent = \`Browse all events in \${city} →\`;
      document.getElementById('browseMainHeading').textContent = \`Browse All Events in \${city}\`;
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
      showToast(nearMeActive ? 'Showing events within 15 km 📍' : 'Showing all city events');
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
    // EVENT DETAILS & REGISTRATION
    // ============================================================================
    let activeDetailedEvent = null;

    async function openEventDetailsById(idOrIndex) {
      let ev = activeEventsList.find(e => (e.event_id === idOrIndex || e.id === idOrIndex));
      if (!ev) {
        try {
          const res = await API.getEventById(idOrIndex);
          if (res && res.event) ev = res.event;
        } catch (_) {}
      }
      if (!ev && typeof idOrIndex === 'number' && EVENTS_DATA[idOrIndex]) {
        ev = EVENTS_DATA[idOrIndex];
      }
      if (!ev) ev = EVENTS_DATA[0];

      activeDetailedEvent = ev;

      document.getElementById('detailRainbowTitle').innerHTML = colorizeRainbowTitle(ev.title);

      const artBox = document.getElementById('detailArtworkBox');
      if (ev.original_image_url || ev.image_url) {
        artBox.innerHTML = \`<img src="\${API_BASE}\${ev.original_image_url || ev.image_url}" alt="\${ev.title}" style="width:100%; height:240px; object-fit:cover; border-radius:14px;"/>\`;
      } else {
        artBox.innerHTML = ev.art || ILLUSTRATIONS.riverfront;
      }

      const isFree = (ev.price === 0 || ev.price === '0' || ev.isFree);
      const priceLabel = isFree ? 'Free' : (ev.priceLabel || \`₹\${ev.price}\`);
      document.getElementById('detailPriceBanner').innerHTML = isFree
        ? \`🟢 Free Community Event\`
        : \`🎟️ Paid Event (\${priceLabel} per attendee)\`;

      const dateStr = ev.start_datetime ? new Date(ev.start_datetime).toLocaleDateString('en-IN', { weekday: 'long', year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : (ev.fullDate || 'Saturday, 7:00 AM');
      const locStr = ev.location ? (ev.location.formatted_address || \`\${ev.location.venue_name}, \${ev.location.city}\`) : (ev.fullLocation || 'Ahmedabad, Gujarat');
      const orgStr = ev.organizer ? ev.organizer.name : (ev.organizer || 'Community Organizer');

      document.getElementById('detailDateTime').textContent = dateStr;
      document.getElementById('detailLocation').textContent = locStr;
      document.getElementById('detailOrganizer').textContent = orgStr;
      document.getElementById('detailDescription').textContent = ev.description || 'Join us for this exciting community event!';

      // Second chance button visibility for completed events
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
          revBox.innerHTML = 'No reviews yet. Be the first checked-in attendee to leave feedback!';
        }
      }

      // Dots
      const dotsEl = document.getElementById('detailDots');
      dotsEl.innerHTML = activeEventsList.slice(0, 6).map((_, i) =>
        \`<span class="dot \${i === 0 ? 'active' : ''}" onclick="openEventDetailsById(\${i})"></span>\`
      ).join('');

      navigateTo('details');
    }

    function openEventDetails(index) {
      openEventDetailsById(index);
    }

    function cycleDetailEvent(step) {
      if (activeEventsList.length === 0) return;
      const currentIdx = activeEventsList.findIndex(e => e.title === activeDetailedEvent?.title);
      const nextIdx = (currentIdx + step + activeEventsList.length) % activeEventsList.length;
      openEventDetailsById(nextIdx);
    }

    async function handleRsvp(actionType) {
      if (!currentUser) {
        showToast('Logging in as Attendee to record your RSVP! 🎉');
        await quickLogin('Priya Sharma', 'Attendee');
      }

      const evId = activeDetailedEvent?.event_id || activeDetailedEvent?.id;
      if (evId) {
        try {
          await API.interact(evId, actionType);
        } catch (_) {}
      }
      showToast(\`\${actionType} recorded for "\${activeDetailedEvent?.title}"!\`);
    }

    async function handleEventRegistration() {
      if (!currentUser) {
        showToast('Please log in as an Attendee to register!');
        await quickLogin('Priya Sharma', 'Attendee');
      }

      const evId = activeDetailedEvent?.event_id || 1;
      try {
        const res = await API.registerEvent(evId);
        showToast(\`🎉 Registration Confirmed! Your Digital Pass is ready.\`);

        openPassModal({
          title: activeDetailedEvent?.title || 'Sabarmati Riverfront Walk',
          attendee: currentUser?.name || 'Priya Sharma',
          ticket_no: res.ticket_number || 'MTR-20261025-X7A9C',
          date: document.getElementById('detailDateTime').textContent,
          venue: document.getElementById('detailLocation').textContent,
          qr_code: res.qr_code
        });
      } catch (err) {
        if (err.message.includes('already registered')) {
          showToast('You are already registered! Opening your Pass 🎟️');
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
      const evId = activeDetailedEvent?.event_id || 1;
      API.requestSecondChance(evId, msg)
        .then(() => showToast('Second Chance request submitted! The organizer has been notified. 🌟'))
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
        // Fallback sample QR image
        qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(ticket.ticket_no || 'MEETIOR_TICKET');
      }

      document.getElementById('passModal').classList.remove('hidden');
    }

    function closePassModal() {
      document.getElementById('passModal').classList.add('hidden');
    }

    // ============================================================================
    // MY BOOKINGS & PASSES VIEW
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
            const dateStr = ev.start_datetime ? new Date(ev.start_datetime).toLocaleDateString('en-IN', { weekday: 'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : 'Upcoming';

            return \`
              <article class="sketch-box event-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <span class="status-badge \${statusClass}">\${b.registration_status}</span>
                  <small style="font-weight:700;">\${ticket.public_ticket_number || 'Pass Generated'}</small>
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
          No bookings yet! Browse upcoming events and click <strong>"Register & Get Pass"</strong> to receive your QR entry pass.
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
    // MY SAVED EVENTS VIEW
    // ============================================================================
    async function loadSavedEvents() {
      const container = document.getElementById('savedEventsContainer');
      container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:20px;">Loading saved events...</div>';

      try {
        const res = await API.getMySaved();
        if (res && res.saved_events && res.saved_events.length > 0) {
          container.innerHTML = res.saved_events.map(ev => \`
            <article class="sketch-box event-card">
              <h4>\${ev.title}</h4>
              <div class="card-meta">📍 \${ev.location?.venue_name || ev.location?.city || 'Ahmedabad'}</div>
              <div style="display:flex; gap:8px; margin-top:14px;">
                <button class="btn-crayon-yellow" style="flex:1; padding:6px 12px;" onclick="openEventDetailsById(\${ev.event_id})">
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
    // COMMUNITY DEMAND ENGINE
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
      if (!currentUser) {
        showToast('Please log in to submit a demand!');
        await quickLogin('Priya Sharma', 'Attendee');
      }

      const title = document.getElementById('demandTitle').value.trim();
      const category_id = parseInt(document.getElementById('demandCategory').value);
      const city = document.getElementById('demandCity').value;
      const preferred_location = document.getElementById('demandLocation').value.trim();
      const description = document.getElementById('demandDesc').value.trim();

      try {
        await API.createDemand({ title, category_id, city, preferred_location, description });
        showToast('Event demand posted! Other members can now support it.');
        document.getElementById('demandTitle').value = '';
        document.getElementById('demandDesc').value = '';
        loadDemands();
      } catch (err) {
        showToast(err.message || 'Could not post demand.');
      }
    }

    async function supportDemand(demandId) {
      if (!currentUser) {
        showToast('Logging in to record your support...');
        await quickLogin('Priya Sharma', 'Attendee');
      }
      try {
        await API.supportDemand(demandId);
        showToast('Supported! Your vote has been counted. 🔥');
        loadDemands();
      } catch (err) {
        showToast(err.message || 'Could not support demand.');
      }
    }

    // ============================================================================
    // ORGANIZER QR SCANNER & ENTRY VERIFICATION
    // ============================================================================
    let activeCameraStream = null;

    async function loadScannerEvents() {
      const select = document.getElementById('scannerEventSelect');
      select.innerHTML = '<option value="">Loading your events...</option>';

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
        showToast('Camera active! Point at attendee QR pass.');
      } catch (err) {
        showToast('Camera access not granted or unavailable in this context.');
      }
    }

    async function verifyScannedToken(token) {
      if (!token) {
        showToast('Please provide a QR token to verify.');
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
      // Demonstrates live scanner check-in for evaluators
      const sampleToken = 'test_qr_token_' + Math.random().toString(36).substring(7);
      document.getElementById('manualTokenInput').value = sampleToken;
      showToast('Simulating attendee scan...');
      verifyScannedToken(sampleToken);
    }

    // ============================================================================
    // IN-APP NOTIFICATIONS & REMINDERS
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
    // AUTH SUBMISSIONS & QUICK LOGIN
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
          showToast(\`Account created! Welcome to Meetior, \${currentUser.name} 🎉\`);
          updateNavbarUserUI();
          navigateTo(role === 'Organizer' ? 'create' : 'home');
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
        navigateTo(currentUser.role === 'Organizer' ? 'create' : 'home');
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
        // Local simulation fallback
        currentUser = { name: displayName, role };
        showToast(\`Logged in as \${displayName} (\${role})\`);
      }
      updateNavbarUserUI();
      navigateTo(role === 'Organizer' ? 'create' : 'home');
      loadNotifications();
    }

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

      const isFree = costVal === '0' || costVal.toLowerCase().includes('free');
      const numCost = isFree ? 0 : parseFloat(costVal.replace(/[^0-9.]/g, '') || 0);

      const formData = new FormData();
      formData.append('title', title);
      formData.append('category_id', category === 'Heritage' ? 4 : (category === 'Outdoors' ? 5 : (category === 'Music' ? 1 : (category === 'Art' ? 3 : 2))));
      formData.append('start_datetime', \`\${dateVal}T\${timeVal}:00\`);
      formData.append('price', numCost);
      formData.append('currency', 'INR');
      formData.append('venue_name', locationVal);
      formData.append('city', 'Ahmedabad');
      formData.append('description', descVal || 'Join us for this community event!');

      if (fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
      }

      try {
        await API.createEvent(formData);
        showToast(\`Event "\${title}" published successfully! Opening event... 🎉\`);
        renderBrowseCards();
        loadHomeEvents();
        navigateTo('browse');
      } catch (err) {
        showToast(err.message || 'Could not publish event.');
      }
    }

    // ============================================================================
    // INITIALIZATION ON PAGE LOAD
    // ============================================================================
    (async function initMeetior() {
      // Check existing session
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
      navigateTo('register'); // Initial display shows register view as per original mockup
    })();
  </script>
</body>
</html>
`;

const finalHTML = beforeNav + upgradedJS;

fs.writeFileSync(destPath, finalHTML, 'utf8');
fs.writeFileSync(srcPath, finalHTML, 'utf8');

console.log('✅ Upgraded JavaScript client-side API engine in both files successfully!');
