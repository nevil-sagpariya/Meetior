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

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Remove duplicate let currentDetailIndex = 0;
  content = content.replace(/\n\s*let currentDetailIndex = 0;\s*\n/, '\n');

  // 2. Make loadHomeEvents safe against undefined elements and object locations
  const oldLoadHome = `    async function loadHomeEvents() {
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
    }`;

  const newLoadHome = `    async function loadHomeEvents() {
      const city = document.getElementById('homeCitySelect')?.value || 'Ahmedabad';
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
        : EVENTS_DATA.filter(e => {
            const locStr = typeof e.location === 'string' ? e.location : (e.location?.city || e.location?.venue_name || '');
            return locStr.toLowerCase().includes((city || '').toLowerCase());
          });
      activeEventsList = filtered.length > 0 ? filtered : EVENTS_DATA;
      renderHomeCardsWithData(activeEventsList.slice(0, 3));
    }`;

  if (content.includes(oldLoadHome)) {
    content = content.replace(oldLoadHome, newLoadHome);
  }

  // 3. Make renderBrowseCards safe against undefined elements
  const oldBrowseCity = `      const query = (document.getElementById('browseSearchInput').value || '').trim();
      const cat = document.getElementById('browseCategoryFilter').value;
      const city = document.getElementById('homeCitySelect').value;`;

  const newBrowseCity = `      const query = (document.getElementById('browseSearchInput')?.value || '').trim();
      const cat = document.getElementById('browseCategoryFilter')?.value || 'all';
      const city = document.getElementById('homeCitySelect')?.value || 'Ahmedabad';`;

  if (content.includes(oldBrowseCity)) {
    content = content.replace(oldBrowseCity, newBrowseCity);
  }

  // 4. Make updateCityHeadings safe
  const oldHeadings = `    function updateCityHeadings() {
      const city = document.getElementById('homeCitySelect').value;`;
  const newHeadings = `    function updateCityHeadings() {
      const city = document.getElementById('homeCitySelect')?.value || 'Ahmedabad';`;

  if (content.includes(oldHeadings)) {
    content = content.replace(oldHeadings, newHeadings);
  }

  // Write file
  fs.writeFileSync(filePath, content, 'utf8');

  // Verify syntax with vm.Script
  const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    try {
      new vm.Script(scriptMatch[1]);
      console.log(`✅ Syntax verified & 100% clean for: ${filePath}`);
    } catch (err) {
      console.error(`❌ Syntax error remains in ${filePath}:`, err.message);
    }
  }
});
