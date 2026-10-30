'use strict';
// Disposable MySQL database; never seed or mutate the configured application DB.
const fs = require('fs'), path = require('path'), vm = require('vm');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const sourceDB = process.env.DB_NAME;
const testDB = 'meetior_test_' + Date.now() + '_' + process.pid;
if (!/^[a-zA-Z0-9_]+$/.test(sourceDB || '') || !/^meetior_test_\d+_\d+$/.test(testDB)) throw Error('Unsafe database identifier');
process.env.DB_NAME = testDB;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'isolated-integration-secret-not-for-production';
process.env.RAZORPAY_KEY_ID = '';
process.env.RAZORPAY_KEY_SECRET = '';
const results = [], legacy = [];
let connection, models, server, base;
function check(name, condition, detail = '') {
  results.push({ name, pass: Boolean(condition), detail: condition ? undefined : detail });
  console.log((condition ? 'PASS ' : 'FAIL ') + name + (condition ? '' : ': ' + detail));
}
async function request(route, method = 'GET', body, token) {
  const res = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json();
  return { status: res.status, ...data };
}
async function scenario(name, fn) { try { await fn(); } catch (e) { check(name, false, e.stack); } }
async function register(city, state, role, tag) {
  const res = await request('/api/auth/register', 'POST', { name: tag + ' Test', email: tag + '@isolated.example', password: 'TestPass2026', role, city, district: city, state });
  check('Register ' + role + ' in ' + city, res.status === 201 && res.user?.city === city, JSON.stringify(res));
  return res;
}
async function event(org, city, state, tag, extras = {}) {
  const res = await request('/api/events', 'POST', { title: tag, description: 'Isolated integration scenario', category_id: 1, venue_name: city + ' Test Hall', city, district: city, state, latitude: city === 'Mumbai' ? 19.076 : 23.0225, longitude: city === 'Mumbai' ? 72.8777 : 72.5714, start_datetime: new Date(Date.now() + 5 * 86400000).toISOString(), end_datetime: new Date(Date.now() + 5 * 86400000 + 7200000).toISOString(), capacity: 100, price: 0, ...extras }, org.token);
  check('Create event: ' + tag, res.status === 201, JSON.stringify(res));
  return res;
}
async function main() {
  connection = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD });
  await connection.query('CREATE DATABASE \x60' + testDB + '\x60 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  models = require('../models');
  await models.sequelize.sync({ force: true });
  // Copy only reference data, never users, bookings, payments or notifications.
  for (const table of ['States', 'Districts', 'Cities', 'PostalCodes', 'Categories', 'AdminRolePermissions']) {
    await connection.query('INSERT INTO \x60' + testDB + '\x60.\x60' + table + '\x60 SELECT * FROM \x60' + sourceDB + '\x60.\x60' + table + '\x60');
  }
  await models.PlatformSetting.create({ setting_key: 'platform_commission_percent', setting_value: '5' });
  const bcrypt = require('bcryptjs');
  for (const [role, email, name, password] of [
    ['Admin', 'admin@meetior.in', 'Test Administrator', 'Admin@123'],
    ['Organizer', 'organizer@meetior.in', 'Test Organizer', 'Meetior2026'],
    ['Attendee', 'attendee@meetior.in', 'Nevil Sagpariya', 'Meetior2026']
  ]) await models.User.create({ name, email, role, city: 'Ahmedabad', state: 'Gujarat', password_hash: await bcrypt.hash(password, 10) });
  server = require('../server').listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
  console.log('ISOLATED DATABASE: ' + testDB + ' URL: ' + base);
  const admin = await request('/api/admin/auth/login', 'POST', { email: 'admin@meetior.in', password: 'Admin@123' });
  const seedOrg = await request('/api/auth/login', 'POST', { email: 'organizer@meetior.in', password: 'Meetior2026' });
  await event(seedOrg, 'Ahmedabad', 'Gujarat', 'Legacy Ahmedabad fixture'); // event/location #1
  const mumbai = await register('Mumbai', 'Maharashtra', 'Attendee', 'mumbai');
  const mumbai2 = await register('Mumbai', 'Maharashtra', 'Attendee', 'mumbai2');
  const ahmedabad = await register('Ahmedabad', 'Gujarat', 'Attendee', 'ahmedabad');
  const navi = await register('Navi Mumbai', 'Maharashtra', 'Attendee', 'navi');
  const org = await register('Mumbai', 'Maharashtra', 'Organizer', 'neworganizer');
  let mainEvent;
  await scenario('Mumbai discovery and notifications', async () => {
    const before = await request('/api/admin/overview', 'GET', undefined, admin.token);
    mainEvent = await event(org, 'Mumbai', 'Maharashtra', 'Mumbai publication one');
    await event(org, 'Navi Mumbai', 'Maharashtra', 'Navi Mumbai exclusion');
    await event(org, 'Ahmedabad', 'Gujarat', 'Ahmedabad exclusion');
    const discovery = await request('/api/events?city=Mumbai');
    check('Mumbai discovery excludes Navi Mumbai and Ahmedabad', discovery.events?.length === 1 && discovery.events.every(e => e.location.city === 'Mumbai'), JSON.stringify(discovery.events?.map(e => e.location.city)));
    for (const person of [mumbai, mumbai2, ahmedabad, navi, org]) {
      const notifications = await request('/api/notifications', 'GET', undefined, person.token);
      const found = notifications.notifications?.filter(n => n.related_event_id === mainEvent.event_id && n.notification_type === 'new_local_event') || [];
      const expected = person === mumbai || person === mumbai2 ? 1 : 0;
      check('Publication notification targeting ' + person.user.email, found.length === expected, 'Found ' + found.length + ', expected ' + expected);
    }
    const second = await event(org, 'Mumbai', 'Maharashtra', 'Mumbai publication two');
    const notes = await request('/api/notifications', 'GET', undefined, mumbai.token);
    check('Every new Mumbai event triggers another notification', notes.notifications?.some(n => n.related_event_id === second.event_id && n.notification_type === 'new_local_event'));
    const after = await request('/api/admin/overview', 'GET', undefined, admin.token);
    check('Admin overview reflects four new events', after.stats?.events?.total === before.stats?.events?.total + 4);
    const list = await request('/api/admin/events', 'GET', undefined, admin.token);
    check('Admin lists new organizer event', list.events?.some(e => e.event_id === mainEvent.event_id));
  });
  await scenario('India location coverage', async () => {
    const states = await request('/api/locations/states');
    check('Reference database has 36 states/UTs', states.states?.length === 36, String(states.states?.length));
    for (const [city, state] of [['Kolkata','West Bengal'], ['Chennai','Tamil Nadu'], ['Bengaluru','Karnataka'], ['Guwahati','Assam'], ['Imphal','Manipur'], ['Leh','Ladakh'], ['Kavaratti','Lakshadweep'], ['Port Blair','Andaman and Nicobar Islands']]) {
      await register(city, state, 'Attendee', city.toLowerCase().replace(/\s/g, ''));
      const cityRes = await request('/api/locations/cities?search=' + encodeURIComponent(city));
      check('City dropdown contains ' + city, cityRes.cities?.some(c => c.city_name.toLowerCase() === city.toLowerCase()), JSON.stringify(cityRes.cities?.map(c => c.city_name)));
    }
    const near = await request('/api/events/nearby?lat=19.076&lng=72.8777&radius=15');
    check('Nearby map finds Mumbai event by coordinates', near.events?.some(e => e.event_id === mainEvent.event_id), JSON.stringify(near));
    const invalid = await request('/api/events/nearby?lat=abc&lng=xyz');
    check('Invalid map coordinates return validation error', invalid.status === 400, String(invalid.status));
  });
  await scenario('Authentication and ownership', async () => {
    for (const [name, payload] of [['invalid email',{email:'wrong'}], ['weak password',{password:'123'}], ['admin escalation',{role:'Admin'}]]) {
      const r = await request('/api/auth/register','POST',{name:'Invalid Test',email:'invalid@isolated.example',password:'TestPass2026',role:'Attendee',...payload});
      check('Reject ' + name, r.status === 422, String(r.status));
    }
    check('Reject duplicate registration', (await request('/api/auth/register','POST',{name:'Duplicate',email:'mumbai@isolated.example',password:'TestPass2026',role:'Attendee'})).status === 409);
    check('Attendee cannot create event', (await request('/api/events','POST',{},mumbai.token)).status === 403);
    check('Unauthenticated cannot create event', (await request('/api/events','POST',{})).status === 401);
    check('Attendee cannot access admin', (await request('/api/admin/overview','GET',undefined,mumbai.token)).status === 403);
    check('Other organizer cannot change event', (await request('/api/events/' + mainEvent.event_id,'PATCH',{title:'Unauthorized'},seedOrg.token)).status === 403);
    check('Wrong password rejected', (await request('/api/auth/login','POST',{email:'mumbai@isolated.example',password:'Wrong123'})).status === 401);
  });
  await scenario('Bookings QR and notifications', async () => {
    const id = mainEvent.event_id;
    const book = await request('/api/events/' + id + '/register','POST',{},mumbai.token);
    check('Free booking issues QR pass', book.status === 201 && book.qr_code?.startsWith('data:image/png'), JSON.stringify(book).slice(0,150));
    check('Duplicate booking rejected', (await request('/api/events/' + id + '/register','POST',{},mumbai.token)).status === 409);
    const reg = await models.EventRegistration.findOne({where:{event_id:id,user_id:mumbai.user.user_id}});
    const ticket = await models.EventTicket.findOne({where:{registration_id:reg.registration_id}});
    check('Other attendee cannot retrieve ticket', (await request('/api/tickets/' + ticket.ticket_id,'GET',undefined,ahmedabad.token)).status === 403);
    const qr = require('../utils/ticketQr').createTicketQrToken(ticket);
    const scan = await request('/api/organizer/events/' + id + '/check-in','POST',{qr_token:qr},org.token);
    check('Organizer scans valid ticket', scan.success === true, JSON.stringify(scan));
    check('Repeated scan rejected', (await request('/api/organizer/events/' + id + '/check-in','POST',{qr_token:qr},org.token)).status === 400);
    const attendance = await request('/api/admin/attendance','GET',undefined,admin.token);
    check('Admin attendance reflects new booking and scan', attendance.events?.some(e => e.event_id === id && e.confirmed_bookings === 1 && e.valid_checkins === 1));
    const users = await request('/api/admin/attendees','GET',undefined,admin.token);
    check('Admin attendee totals update', users.attendees?.some(a=>a.user_id===mumbai.user.user_id && a.total_confirmed_bookings===1 && a.total_verified_attended===1));
    const review = await request('/api/events/' + id + '/reviews','POST',{rating:5,comment:'Verified test review'},mumbai.token);
    check('Checked-in attendee can review', review.success === true, JSON.stringify(review));
    check('Unattended user review rejected', (await request('/api/events/' + id + '/reviews','POST',{rating:5,comment:'Invalid'},ahmedabad.token)).status >= 400);
    const notes = await request('/api/notifications','GET',undefined,mumbai.token);
    check('Booking notification exists', notes.notifications?.some(n=>n.notification_type==='registration_confirmed'));
    await request('/api/notifications/read-all','PATCH',{},mumbai.token);
    check('Notification read-all clears unread count', (await request('/api/notifications','GET',undefined,mumbai.token)).unread_count === 0);
  });
  await scenario('Extended connected scenarios', async()=>{await require('./scenarios.integration')({models,request,check,event,org,mumbai,mumbai2,ahmedabad,admin,mainEvent});});
  await scenario('Admin endpoints and frontend render contracts', async () => {
    const routes = ['overview','attendees','organizers','finance/organizer-earnings','events','attendance','reviews','payments','finance/reports','reports','categories','locations/audit','notifications/alerts','audit-logs','roles-permissions','settings'];
    const responses = {};
    for (const route of routes) {
      responses[route] = await request('/api/admin/' + route,'GET',undefined,admin.token);
      check('Admin endpoint ' + route, responses[route].status===200 && responses[route].success, JSON.stringify(responses[route]).slice(0,200));
    }
    const html = fs.readFileSync(path.join(__dirname,'../../frontend/index.html'),'utf8');
    const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n');
    new vm.Script(scripts);
    check('Frontend inline JavaScript parses', true);
    for (const [fn,api,route,bodyId] of [
      ['loadAdminOverview','getAdminOverview','overview','admMonthlyChartBox'],
      ['loadAdminAttendees','getAdminAttendees','attendees','adminAttendeesTableBody'],
      ['loadAdminOrganizers','getAdminOrganizers','organizers','adminOrganizersTableBody'],
      ['loadAdminAttendance','getAdminAttendance','attendance','adminAttendanceTableBody'],
      ['loadAdminPayments','getAdminPayments','payments','adminPaymentsTableBody'],
      ['loadAdminEarnings','getAdminOrganizerEarnings','finance/organizer-earnings','adminEarningsTableBody'],
      ['loadAdminFinanceReports','getAdminFinanceReports','finance/reports','admFinGrossSales']
    ]) {
      const nodes = new Map(), errors=[];
      const get = id => {if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',value:'',style:{},classList:{add(){},remove(){}}});return nodes.get(id)};
      const ctx=vm.createContext({document:{getElementById:get},API:{[api]:async()=>responses[route]},showToast:m=>errors.push(m),currentAdminTimeFilter:'all',currentAdminCustomStart:null,currentAdminCustomEnd:null,console,URLSearchParams});
      function extract(name) {
        const start=scripts.search(new RegExp('(async\\s+)?function '+name+'\\('));
        const rest=scripts.slice(start); const end=rest.indexOf('\n    }')+6;
        return rest.slice(0,end);
      }
      if(fn==='loadAdminOverview')vm.runInContext(extract('renderAdminMonthlyChart'),ctx);
      vm.runInContext(extract(fn),ctx);
      await vm.runInContext(fn+'()',ctx);
      const output=[...nodes.values()].map(n=>n.textContent+' '+n.innerHTML).join('\n');
      check('Frontend renders ' + route + ' without undefined/NaN/error', !/undefined|NaN|Invalid Date/.test(output)&&!errors.length, errors.join('; ') || output.slice(0,150));
      check('Frontend produces content for ' + route, output.trim().length > 0, 'No rendered data');
      check('Frontend leaves loading state for ' + route, !/Loading (attendees|organizers|attendance|payments|earnings|monthly)/i.test(output), output.slice(0,150));
    }
  });
  await scenario('Real browser scenarios', async()=>{await require('./browser.integration')({base,admin,org,mumbai,check});});
  // Run every existing suite with URL redirection in memory and isolated DB env.
  for (const file of ['api.test.js','admin.test.js','super_admin.test.js','cancellation_revenue.test.js','sync_integration.test.js']) {
    await scenario('Legacy suite ' + file, async () => {
      const source = fs.readFileSync(path.join(__dirname,file),'utf8').replaceAll('http://localhost:5000',base);
      let runner = "const Module=require('module');const m=new Module(" + JSON.stringify(path.join(__dirname,file)) + ");m.filename=" + JSON.stringify(path.join(__dirname,file)) + ";m.paths=Module._nodeModulePaths(" + JSON.stringify(__dirname) + ");m._compile(" + JSON.stringify(source) + ",m.filename);";
      if(file==='api.test.js' || file==='sync_integration.test.js') runner += 'm.exports(' + JSON.stringify(base) + ').then(r=>process.exit(r.failed?1:0)).catch(()=>process.exit(1));';
      const child=spawn(process.execPath,['-e',runner],{cwd:path.join(__dirname,'..'),env:process.env,windowsHide:true});
      let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
      const timer=setTimeout(()=>child.kill(),45000);
      const code=await new Promise(resolve=>child.once('close',resolve));clearTimeout(timer);
      legacy.push({file,code,output});
      const failed=/[1-9]\d*\s+(Failed|FAILED)/.test(output)||/❌/.test(output);
      check('Existing suite ' + file, code===0&&!failed&&output.includes('PASS'), output.slice(-1600));
    });
  }
}
main().catch(e=>check('Harness',false,e.stack)).finally(async()=>{
  if(server)await new Promise(resolve=>server.close(resolve));
  if(models)await models.sequelize.close();
  let cleaned=false;
  if(connection) { await connection.query('DROP DATABASE IF EXISTS \x60'+testDB+'\x60'); const [rows]=await connection.query('SHOW DATABASES LIKE ?', [testDB]);cleaned=rows.length===0;await connection.end(); }
  check('Temporary database deleted',cleaned);
  const report={timestamp:new Date().toISOString(),testDatabase:testDB,sourceDatabase:sourceDB,sourceWrites:false,cleaned,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,results,legacy};
  fs.writeFileSync(path.join(__dirname,'isolated-results.json'),JSON.stringify(report,null,2));
  console.log('RESULT: '+report.passed+' passed, '+report.failed+' failed; database removed='+cleaned);
  process.exitCode=report.failed?1:0;
});

