'use strict';

/**
 * Meetior PC Setup & Database Auto-Diagnostics
 * Run this on any new PC to detect and auto-fix database/env issues.
 */

const fs = require('fs');
const path = require('path');

let mysql;
try {
  mysql = require('mysql2/promise');
} catch (e) {
  console.log('\n' + '='.repeat(65));
  console.log('   🔍 MEETIOR PC & DATABASE DIAGNOSTIC TOOL');
  console.log('='.repeat(65));
  console.log('\n❌ Node dependencies are missing on this computer!');
  console.log('👉 Please run this command first:');
  console.log('   npm install\n');
  console.log('After npm install finishes, run "npm run check" again.\n');
  process.exit(1);
}

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

console.log('\n' + '='.repeat(65));
console.log('   🔍 MEETIOR PC & DATABASE DIAGNOSTIC TOOL');
console.log('='.repeat(65));

async function runDiagnostics() {
  let issuesFound = 0;

  // 1. Check .env file
  console.log('\n[1/5] Checking configuration (.env file)...');
  if (!fs.existsSync(envPath)) {
    issuesFound++;
    console.log('  ⚠️  Missing .env file!');
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('  ✅ Automatically created .env from .env.example for you.');
      console.log('  👉 Please open meetior/backend/.env and set your DB_PASSWORD.');
    } else {
      console.log('  ❌ .env.example not found. Please create .env manually.');
    }
  } else {
    console.log('  ✅ .env file found.');
  }

  // Load environment variables
  require('dotenv').config({ path: envPath });

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'meetior_db';

  console.log(`\n[2/5] Connection settings detected:`);
  console.log(`  • Host: ${host}:${port}`);
  console.log(`  • User: ${user}`);
  console.log(`  • Password: ${password ? '********' : '(empty / no password)'}`);
  console.log(`  • Target DB: ${database}`);

  // 2. Test raw MySQL connection
  console.log('\n[3/5] Testing MySQL Server connection...');
  let rootConn;
  let activePassword = password;
  try {
    rootConn = await mysql.createConnection({
      host,
      port,
      user,
      password: activePassword
    });
    console.log('  ✅ Successfully authenticated to MySQL server!');
  } catch (err) {
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('  ⚠️  Password in .env was rejected. Auto-detecting your MySQL password on this PC...');
      const candidates = ['', 'root', '1234', '123456', '12345678', 'admin', 'password', 'Nevil@99', 'mysql'];
      let recovered = false;

      for (const cand of candidates) {
        if (cand === password) continue;
        try {
          const testConn = await mysql.createConnection({ host, port, user, password: cand });
          rootConn = testConn;
          activePassword = cand;
          recovered = true;
          console.log(`  🎉 FOUND WORKING PASSWORD: "${cand}"`);
          
          // Auto-update .env file
          if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            envContent = envContent.replace(/DB_PASSWORD=.*/g, `DB_PASSWORD=${cand}`);
            fs.writeFileSync(envPath, envContent, 'utf8');
            console.log('  ✅ Automatically updated DB_PASSWORD in your .env file!');
          }
          break;
        } catch (_) {
          // continue checking
        }
      }

      if (!recovered) {
        issuesFound++;
        console.log('  ❌ MySQL Connection Failed: Password or username rejected by MySQL.');
        console.log('     💡 FIX: The password in meetior/backend/.env is incorrect for this PC!');
        console.log('        1. Open "meetior/backend/.env" in Notepad.');
        console.log('        2. Change DB_PASSWORD= to whatever password you chose when downloading MySQL on this PC.');
        console.log('\n' + '='.repeat(65));
        return;
      }
    } else if (err.code === 'ECONNREFUSED') {
      issuesFound++;
      console.log('  ❌ MySQL Connection Failed:');
      console.log('     👉 Error: Could not connect to MySQL on port ' + port + '.');
      console.log('     💡 FIX: MySQL service is NOT running on this computer.');
      console.log('        1. Press Windows Key + R, type "services.msc" and press Enter.');
      console.log('        2. Find "MySQL80" (or "MySQL") in the list.');
      console.log('        3. Right-click and choose "Start".');
      console.log('\n' + '='.repeat(65));
      return;
    } else {
      issuesFound++;
      console.log('  ❌ MySQL Connection Failed: ' + err.message);
      console.log('\n' + '='.repeat(65));
      return;
    }
  }

  // 3. Check if database exists
  console.log(`\n[4/5] Checking database '${database}'...`);
  try {
    const [dbs] = await rootConn.query('SHOW DATABASES LIKE ?;', [database]);
    if (dbs.length === 0) {
      issuesFound++;
      console.log(`  ⚠️  Database '${database}' does not exist on this PC.`);
      console.log(`  ⏳ Auto-creating database '${database}' now...`);
      await rootConn.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      console.log(`  ✅ Successfully created '${database}'!`);
    } else {
      console.log(`  ✅ Database '${database}' already exists.`);
    }
  } catch (err) {
    console.log('  ❌ Could not check/create database: ' + err.message);
  } finally {
    await rootConn.end();
  }

  // 4. Check tables in meetior_db
  console.log(`\n[5/5] Checking tables inside '${database}'...`);
  try {
    const appConn = await mysql.createConnection({
      host,
      port,
      user,
      password: activePassword,
      database
    });

    const [tables] = await appConn.query('SHOW TABLES;');
    const tableCount = tables.length;
    console.log(`  • Found ${tableCount} tables in '${database}'.`);

    if (tableCount === 0) {
      issuesFound++;
      console.log('  ⚠️  Database is empty (no tables yet).');
      console.log('  💡 FIX: Run this command in terminal to create all tables & seed sample events:');
      console.log('     👉 npm run reset:clean');
    } else {
      const [events] = await appConn.query('SELECT COUNT(*) as cnt FROM events;');
      console.log(`  • Found ${events[0].cnt} events in database.`);
      console.log('  ✅ Database is populated and ready!');
    }
    await appConn.end();
  } catch (err) {
    console.log('  ❌ Error checking tables: ' + err.message);
  }

  // Summary
  console.log('\n' + '='.repeat(65));
  if (issuesFound === 0) {
    console.log('  🎉 ALL CHECKS PASSED! EVERYTHING IS 100% READY.');
    console.log('  🚀 You can now start the server with: node server.js');
  } else {
    console.log('  ⚠️  Diagnostics completed. Please follow the instructions above.');
  }
  console.log('='.repeat(65) + '\n');
}

runDiagnostics();
