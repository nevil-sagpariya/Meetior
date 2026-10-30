'use strict';

const http = require('http');

async function isPortOpen(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function run() {
  console.log('🚀 Checking Meetior test environment...');
  
  // If server is not listening on 5000, start it
  const alreadyRunning = await isPortOpen(5000);
  if (!alreadyRunning) {
    console.log('Starting in-process backend server on port 5000...');
    require('../server');
    let ready = false;
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 1000));
      ready = await isPortOpen(5000);
      if (ready) break;
    }
    if (!ready) {
      console.error('❌ Server failed to bind within 15 seconds.');
      process.exit(1);
    }
    console.log('✅ In-process server is live and responding.\n');
  } else {
    console.log('✅ Server already running on http://127.0.0.1:5000\n');
  }

  const runSuratLifecycleTests = require('./suratTest');
  const runApiTests = require('./api.test');
  const runSyncTests = require('./sync_integration.test');

  let totalPassed = 0;
  let totalFailed = 0;

  try {
    console.log('========================================================');
    console.log('RUNNING SUITE 1: Surat Cross-City & Lifecycle Tests');
    console.log('========================================================');
    const res1 = await runSuratLifecycleTests();
    totalPassed += res1.passed;
    totalFailed += res1.failed;
  } catch (err) {
    console.error('Suite 1 failed with error:', err);
    totalFailed++;
  }

  try {
    console.log('========================================================');
    console.log('RUNNING SUITE 2: Core Platform & Integration Tests');
    console.log('========================================================');
    const res2 = await runApiTests();
    totalPassed += res2.passed;
    totalFailed += res2.failed;
  } catch (err) {
    console.error('Suite 2 failed with error:', err);
    totalFailed++;
  }

  try {
    console.log('========================================================');
    console.log('RUNNING SUITE 3: Bi-directional Synchronization Tests');
    console.log('========================================================');
    const res3 = await runSyncTests();
    totalPassed += res3.passed;
    totalFailed += res3.failed;
  } catch (err) {
    console.error('Suite 3 failed with error:', err);
    totalFailed++;
  }

  console.log('\n========================================================');
  console.log(`🏆 OVERALL TEST RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log('========================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

run();
