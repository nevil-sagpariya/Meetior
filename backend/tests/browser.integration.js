'use strict';
const fs=require('fs'),path=require('path');
module.exports=async function browserChecks({base,admin,org,mumbai,check}){
  const packageRoot=process.env.MEETIOR_PLAYWRIGHT_MODULES || 'C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
  const {chromium}=require(require.resolve('playwright',{paths:[packageRoot]}));
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const dir=path.join(__dirname,'artifacts');fs.mkdirSync(dir,{recursive:true});
  try {
    await context.addInitScript(token=>localStorage.setItem('meetior_token',token),admin.token);
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof currentUser!=='undefined' && currentUser?.role==='Admin');
    await page.evaluate(()=>navigateTo('admin'));
    for(const tab of ['overview','attendees','organizers','earnings','events','attendance','reviews','payments','finance','reports','categories','broadcast','audit','settings']){
      await page.evaluate(tab=>switchAdminTab(tab),tab);
      await page.waitForTimeout(1200);
      const text=await page.locator('#adminTab-'+tab).innerText();
      check('Browser admin tab '+tab,!/undefined|NaN|Invalid Date|Loading |Error:/.test(text),text.slice(0,2200));
      await page.locator('#adminTab-'+tab).screenshot({path:path.join(dir,'admin-'+tab+'.png')});
    }
    await page.evaluate(id=>openOrganizerDetails(id),org.user.user_id);
    const organizerDetail = await page.locator('#adminOrganizerModalBody').innerText();
    check('Organizer performance modal displays real event history',! /undefined|NaN|Invalid Date/.test(organizerDetail) && organizerDetail.includes('Mumbai publication'),organizerDetail.slice(0,1500));
    await page.evaluate(()=>closeAdminOrganizerModal());
    const mainEventId=await page.evaluate(async()=>{const r=await API.getAdminEvents();return r.events.find(e=>e.title==='Mumbai publication one').event_id;});
    await page.evaluate(id=>openAdminEventInspection(id),mainEventId);
    const eventDetails=await page.locator('#adminEventModalBody').innerText();
    check('Admin event inspection includes new attendee booking',eventDetails.includes('mumbai Test')&&!/undefined|NaN|Invalid Date/.test(eventDetails),eventDetails.slice(0,1400));
    await page.evaluate(()=>closeAdminEventModal());
    await page.evaluate(token=>localStorage.setItem('meetior_token',token),mumbai.token);
    // Replace the init script by opening a separate context for the organizer below.
    await page.evaluate(user=>{currentUser=user;updateBrowsingCityUI('Mumbai')},mumbai.user);
    await page.evaluate(()=>loadHomeEvents());
    const home=await page.locator('#homeCardsContainer').innerText();
    check('Browser Mumbai home excludes other-city events',!home.includes('Navi Mumbai exclusion')&&!home.includes('Ahmedabad exclusion')&&home.includes('Mumbai publication'),home);
    await page.evaluate(()=>{updateBrowsingCityUI('Unlisted Test City');return loadHomeEvents()});
    check('Browser empty city shows empty state, no substituted events',(await page.locator('#homeCardsContainer').innerText()).includes('No events in this city'));
    await page.evaluate(()=>{currentUser=null;navigateTo('register')});
    await page.locator('#regCityInput').fill('Imphal');
    check('Registration accepts manually entered Indian city',await page.locator('#regCityInput').inputValue()==='Imphal');
    // Exercise the actual form handler with valid isolated values and empty district.
    await page.evaluate(()=>{document.getElementById('regName').value='Browser Attendee';document.getElementById('regEmail').value='browser@isolated.example';document.getElementById('regPhone').value='9876543210';document.getElementById('regPass').value='TestPass2026';document.getElementById('regConfirm').value='TestPass2026';document.getElementById('regCityInput').value='Imphal';document.getElementById('regDistrict').value='';document.getElementById('regState').value='Manipur';selectedRegRole='Attendee';});
    await page.evaluate(()=>submitRegisterForm({preventDefault(){},target:{querySelector(){return null}}}));
    check('Browser registration submits city without a database suggestion',await page.evaluate(()=>currentUser?.city==='Imphal'&&currentUser?.email==='browser@isolated.example'));
    const orgContext=await browser.newContext({viewport:{width:1200,height:900}});
    await orgContext.addInitScript(token=>localStorage.setItem('meetior_token',token),org.token);
    const op=await orgContext.newPage();
    await op.goto(base,{waitUntil:'domcontentloaded'});
    await op.waitForFunction(()=>typeof currentUser!=='undefined'&&currentUser?.role==='Organizer');
    await op.evaluate(()=>navigateTo('create'));
    await op.waitForFunction(()=>typeof ceMap!=='undefined'&&ceMap);
    await op.evaluate(()=>{ if (ceMap && ceMap.invalidateSize) ceMap.invalidateSize(); });
    await op.waitForTimeout(1000);
    for(const [city,lat,lng] of [['Mumbai',19.076,72.8777],['Guwahati',26.1445,91.7362],['Imphal',24.817,93.9368]]){
      await op.evaluate(([lat,lng])=>{ceMap.setView([lat,lng],12);setCreateEventPin(lat,lng,false)},[lat,lng]);
      const coords=await op.evaluate(()=>[document.getElementById('ceLatitude').value,document.getElementById('ceLongitude').value]);
      check('Map pin stores coordinates for '+city,Math.abs(Number(coords[0])-lat)<0.00001&&Math.abs(Number(coords[1])-lng)<0.00001,JSON.stringify(coords));
    }
    await op.screenshot({path:path.join(dir,'organizer-map.png'),fullPage:true});
    await op.waitForTimeout(1500);
    const loadedTiles=await op.locator('#ceLeafletMap img.leaflet-tile').evaluateAll(imgs=>imgs.filter(i=>i.complete&&i.naturalWidth>0).length);
    check('Map tiles load in the browser',loadedTiles>0,String(loadedTiles)+' loaded tiles');
    await op.evaluate(()=>searchLocationOnMap('Guwahati'));
    try {
      await op.waitForFunction(()=>Math.abs(ceMap.getCenter().lat-26.14)<0.2&&Math.abs(ceMap.getCenter().lng-91.74)<0.2,{},{timeout:15000});
      check('External geocoder resolves Guwahati in Assam',true);
    } catch(e) {check('External geocoder resolves Guwahati in Assam',false,'No matching map center after 15 seconds; external availability must be checked.');}
    check('Browser reports no uncaught JavaScript errors',errors.length===0,errors.join('; '));
    await orgContext.close();
  } finally {await context.close();await browser.close();}
};

