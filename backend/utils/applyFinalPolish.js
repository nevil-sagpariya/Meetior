'use strict';

const fs = require('fs');
const path = require('path');

const filePaths = [
  path.resolve(__dirname, '../../frontend/index.html'),
  path.resolve(__dirname, '../../../Project Demo Front End.html')
];

filePaths.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Update quick preview bar
  const oldSwitcher = `<div class="demo-switcher">
      <span>Quick Screen Preview:</span>
      <button class="demo-pill" id="pill-home" onclick="navigateTo('home')">1. Home</button>
      <button class="demo-pill" id="pill-browse" onclick="navigateTo('browse')">2. Browse All</button>
      <button class="demo-pill" id="pill-details" onclick="openEventDetails(3)">3. Event Details</button>
      <button class="demo-pill" id="pill-create" onclick="switchToOrganizerCreate()">4. Create Event</button>
      <button class="demo-pill active" id="pill-register" onclick="navigateTo('register')">5. Register (Live Validation)</button>
      <button class="demo-pill" id="pill-login" onclick="navigateTo('login')">6. Log In</button>
      <button class="demo-pill" id="pill-bookings" onclick="navigateTo('bookings')">7. My Bookings</button>
      <button class="demo-pill" id="pill-saved" onclick="navigateTo('saved')">8. My Saved Events</button>
      <button class="demo-pill" id="pill-demands" onclick="navigateTo('demands')">9. Demand Engine</button>
      <button class="demo-pill" id="pill-scanner" onclick="navigateTo('scanner')">10. QR Entry Scanner</button>
      <button class="demo-pill" id="pill-notifications" onclick="navigateTo('notifications')">11. Notifications</button>
    </div>`;

  const newSwitcher = `<div class="demo-switcher">
      <span>Quick Screen Preview:</span>
      <button class="demo-pill active" id="pill-home" onclick="navigateTo('home')">1. Home</button>
      <button class="demo-pill" id="pill-browse" onclick="navigateTo('browse')">2. Browse All</button>
      <button class="demo-pill" id="pill-details" onclick="openEventDetails(3)">3. Event Details</button>
      <button class="demo-pill organizer-only" id="pill-create" onclick="switchToOrganizerCreate()" style="display:none;">4. Create Event</button>
      <button class="demo-pill" id="pill-register" onclick="navigateTo('register')">5. Register</button>
      <button class="demo-pill" id="pill-login" onclick="navigateTo('login')">6. Log In</button>
      <button class="demo-pill" id="pill-bookings" onclick="navigateTo('bookings')">7. My Bookings</button>
      <button class="demo-pill" id="pill-saved" onclick="navigateTo('saved')">8. My Saved Events</button>
      <button class="demo-pill organizer-only" id="pill-demands" onclick="navigateTo('demands')" style="display:none;">9. Demand Engine</button>
      <button class="demo-pill organizer-only" id="pill-scanner" onclick="navigateTo('scanner')" style="display:none;">10. QR Entry Scanner</button>
      <button class="demo-pill" id="pill-notifications" onclick="navigateTo('notifications')">11. Notifications</button>
      <button class="demo-pill" id="pill-profile" onclick="navigateTo('profile')">12. Profile</button>
    </div>`;

  if (content.includes(oldSwitcher)) {
    content = content.replace(oldSwitcher, newSwitcher);
  }

  // 2. Make view-home active by default and view-register hidden by default
  content = content.replace('<section id="view-home" class="hidden">', '<section id="view-home">');
  content = content.replace('<section id="view-register">', '<section id="view-register" class="hidden">');

  // 3. Remove old legacy submitRegisterForm duplicate
  const oldLegacySubmitRegex = /function submitRegisterForm\(e\) \{[\s\S]*?showToast\('Please complete the remaining highlighted fields\.'\);\s*\}\s*\}/;
  content = content.replace(oldLegacySubmitRegex, '');

  // 4. Update updateNavbarUserUI to strictly manage demo pills visibility too
  const oldUpdateNav = `    function updateNavbarUserUI() {
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
    }`;

  const newUpdateNav = `    function updateNavbarUserUI() {
      const guestBox = document.getElementById('navGuestActions');
      const userBox = document.getElementById('navUserActions');

      const demandLink = document.getElementById('navDemandLink');
      const createLink = document.getElementById('navCreateLink');
      const scannerLink = document.getElementById('navScannerLink');

      const pillDemands = document.getElementById('pill-demands');
      const pillScanner = document.getElementById('pill-scanner');
      const pillCreate = document.getElementById('pill-create');

      const isOrg = Boolean(currentUser && currentUser.role === 'Organizer');

      if (currentUser) {
        guestBox.classList.add('hidden');
        userBox.classList.remove('hidden');

        document.getElementById('navUserName').textContent = currentUser.name || 'User';
        document.getElementById('navUserRole').textContent = \`(\${currentUser.role || 'Attendee'})\`;
      } else {
        guestBox.classList.remove('hidden');
        userBox.classList.add('hidden');
      }

      // Strictly show Demand Engine, + Create Event, and Scan Passes ONLY to Organizers
      if (demandLink) demandLink.style.display = isOrg ? 'inline-block' : 'none';
      if (createLink) createLink.style.display = isOrg ? 'inline-block' : 'none';
      if (scannerLink) scannerLink.style.display = isOrg ? 'inline-block' : 'none';

      if (pillDemands) pillDemands.style.display = isOrg ? 'inline-block' : 'none';
      if (pillScanner) pillScanner.style.display = isOrg ? 'inline-block' : 'none';
      if (pillCreate) pillCreate.style.display = isOrg ? 'inline-block' : 'none';
    }`;

  if (content.includes(oldUpdateNav)) {
    content = content.replace(oldUpdateNav, newUpdateNav);
  }

  // 5. Update handlePublishEvent with auto-organizer switch and smart city detection
  const oldPublishRegex = /async function handlePublishEvent\(e\) \{[\s\S]*?showToast\(err\.message \|\| 'Could not publish event\. Please check inputs\.'\);\s*\}\s*\}/;

  const newPublish = `async function handlePublishEvent(e) {
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

      if (title.length < 3 || !category || !dateVal || !timeVal || !costVal || !locationVal) {
        showToast('Please fill in all required (*) fields before publishing.');
        return;
      }

      // Robust date parsing (DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD)
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

      // Smart city detection
      let detectedCity = 'Ahmedabad';
      const locLower = locationVal.toLowerCase();
      if (locLower.includes('gandhinagar')) detectedCity = 'Gandhinagar';
      else if (locLower.includes('mumbai')) detectedCity = 'Mumbai';
      else if (locLower.includes('delhi')) detectedCity = 'Delhi';
      else if (locLower.includes('bengaluru') || locLower.includes('bangalore')) detectedCity = 'Bengaluru';
      else {
        const homeCity = document.getElementById('homeCitySelect')?.value;
        if (homeCity && homeCity !== 'all') detectedCity = homeCity;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('category_id', catId);
      formData.append('start_datetime', \`\${formattedDate}T\${timeVal}:00\`);
      formData.append('price', numCost);
      formData.append('currency', 'INR');
      formData.append('venue_name', locationVal);
      formData.append('city', detectedCity);
      formData.append('discovery_city', detectedCity);
      formData.append('description', descVal || 'Join us for this community event!');

      if (fileInput.files && fileInput.files[0]) {
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
          location: { venue_name: locationVal, city: detectedCity },
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
    }`;

  if (oldPublishRegex.test(content)) {
    content = content.replace(oldPublishRegex, newPublish);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Applied polish to: ${filePath}`);
});
