# 🎨 MEETIOR — Local Event Discovery & Meetup Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![Sequelize](https://img.shields.io/badge/Sequelize-ORM-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org)

> **Final Semester Capstone Project (Semester 7)**  
> **Architecture:** Full-Stack Node.js, Express.js, MySQL (Sequelize ORM), Vanilla JavaScript, HTML5 & CSS3  
> **UI Aesthetic:** Hand-Drawn Crayon & Playful Sketchbook Theme  
> **Test Coverage:** 150 Automated Isolated Integration Tests (100% Pass)

---

## 🌟 Overview

**Meetior** is a hyper-local event discovery, community meetup, and ticketing platform designed to connect event attendees and organizers across India. Built from the ground up without heavy frontend framework overhead, Meetior combines an authentic hand-drawn sketchbook aesthetic with a rock-solid, production-grade 25-table relational MySQL backend.

Key highlights include:
- **Interactive Multi-Channel Checkout**: Meetior Demo Student Wallet, UPI QR Code generation with live phone scanning, PayPal Sandbox, and Razorpay Gateway test sandbox.
- **Atomic Entry & Passes**: Cryptographic QR-coded event passes (`MTR-YYYYMMDD-XXXXXX`) with an in-app camera check-in scanner and duplicate-entry safeguards.
- **Community Demand & Second Chance**: Event concept crowdsourcing, upvoting, and repeat session requests for past completed events.
- **Enterprise-Grade Admin Portal**: 16 dedicated governance modules including Role-Based Access Control (RBAC), multi-factor authentication (MFA), location auditing, revenue tracking, and complete **Admin Data Management (Add & Remove Users, Events, and Categories)**.

---

## 🔑 Default Credentials

For quick evaluation and academic demonstration, Meetior comes pre-seeded with clean canonical accounts:

| Role | Name | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Meetior Administrator | `admin@meetior.in` | `Admin@123` | Full platform governance, user/event deletion, demo data controls |
| **Organizer** | Aarav Patel | `organizer@meetior.in` | `Meetior2026` | Event creation, ticketing, in-app QR ticket scanner, earnings |
| **Attendee** | Nevil Sagpariya | `attendee@meetior.in` | `Meetior2026` | Event discovery, demo wallet, UPI bookings, reviews, event pass |

> **Quick Demo Login:** You can also click the quick-login pills (**"Attendee Demo"**, **"Organizer Demo"**, or **"🔐 Admin"**) on the web interface for 1-click access.

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MySQL**: 8.0 or higher running on port `3306`

### 2. Configure Environment Variables
Inside `meetior/backend/`, create or verify your `.env` file:

```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=meetior_db
DB_USER=root
DB_PASSWORD=your_mysql_password

# Authentication & Security
JWT_SECRET=meetior_super_secure_jwt_secret_2026
ADMIN_ENABLED=true

# Optional Razorpay Gateway Credentials
RAZORPAY_KEY_ID=rzp_test_meetior
RAZORPAY_KEY_SECRET=meetior_test_secret
```

### 3. Install Dependencies
```bash
cd meetior/backend
npm install
```

### 4. Initialize Database & Seed Clean Data
```bash
# Auto-check MySQL connection & auto-create meetior_db if missing:
npm run check

# Create all 27 tables and seed verified sample events:
npm run reset:clean
```

### 5. Inspect Your Database in Terminal
```bash
# Pretty-print all users, events, and transactions in a clean ASCII grid:
npm run db:view
```

### 6. Start the Server
```bash
npm start
```
The application will launch on:
- **Web App (Frontend):** [http://localhost:5000/](http://localhost:5000/)
- **Health Check Endpoint:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Admin Portal:** [http://localhost:5000/#admin](http://localhost:5000/#admin)

---

## 🧹 GitHub Cleaning & Maintenance Commands

Before pushing changes to GitHub or submitting your project, you can easily clean up all temporary test accounts, demo registrations, and mock bookings with dedicated commands:

```bash
# In meetior/backend:

# 1. Purge all test users, demo organizers, and their events while preserving canonical baseline accounts:
npm run clean:demo
# (alias)
npm run clean:github

# 2. Clean temporary bookings, passes, and payments made during testing:
npm run clean:test

# 3. Complete clean reset and re-seed of the database from scratch:
npm run reset:clean
```

### What `npm run clean:demo` Does:
- Scans `meetior_db` and identifies all non-canonical test users (`mumbai_org_*`, `student_*`, temporary registrations).
- Cascades and removes their created events, bookings, tickets, check-ins, payments, reviews, and notifications.
- Preserves the canonical accounts (`admin@meetior.in`, `organizer@meetior.in`, `attendee@meetior.in`, and official community profiles).
- Keeps your repository clean and ready for GitHub commits without test pollution.

---

## 🛠️ Admin Data Management (Add & Remove Data)

Administrators have full administrative control to add and remove data directly from the **Admin Dashboard** (`#admin` tab) or via REST API:

### 1. Removing Data
- **Delete User / Organizer**: In the **Attendees** or **Organizers** tab, click the **🗑️** button on any row. This cascades and removes the user along with their registrations, passes, reviews, and created events (safeguards prevent deleting self or the primary admin).
- **Delete Event**: In the **Events** tab, click **🗑️** on any event row to permanently remove the event and cancel its tickets.
- **Delete Category**: In the **Categories** tab, click **🗑️** to delete obsolete categories (reassigns events safely).
- **Purge Demo Data**: In the **Settings** tab, click **`🧹 Purge Demo Users & Test Data`** to wipe all test clutter in 1 click.

### 2. Adding Data
- **Add Attendee / Organizer**: Click **`➕ Add Attendee`** or **`➕ Add Organizer`** in the respective tab to create an account immediately with custom name, email, password, and city.
- **Add Event as Admin**: Click **`➕ Add Event`** in the **Events** tab to publish an event directly to any Indian city.
- **Seed Sample Events**: In the **Settings** tab, click **`🌱 Seed Fresh Sample Events`** to populate realistic events on demand.

### Admin Data API Endpoints:
```http
POST   /api/admin/users/create        # Create Attendee, Organizer, or Admin
DELETE /api/admin/users/:id           # Permanently remove user and cascade data
POST   /api/admin/events/create       # Create and publish an event as Admin
DELETE /api/admin/events/:id          # Permanently remove event and cascade records
DELETE /api/admin/categories/:id      # Delete taxonomy category
POST   /api/admin/data/clean-demo     # One-click demo data purge
POST   /api/admin/data/seed-demo      # One-click sample events re-seed
```

---

## 💳 Payment System Workflows

Meetior offers a versatile, academic-friendly multi-channel payment architecture:

```text
                                  ┌──────────────────────────────────────────────┐
                                  │           MEETIOR CHECKOUT MODAL             │
                                  └──────────────────────┬───────────────────────┘
                                                         │
             ┌───────────────────────┬───────────────────┴───────────────┬────────────────────────┐
             ▼                       ▼                                   ▼                        ▼
  ┌─────────────────────┐  ┌──────────────────┐               ┌────────────────────┐  ┌───────────────────────┐
  │ Meetior Demo Wallet │  │   UPI QR Code    │               │   PayPal Sandbox   │  │   Razorpay Gateway    │
  │  (Instant 1-Click)  │  │ (Scan with GPay/ │               │ (Instant Mock Pay) │  │      (Test Mode)      │
  │   ₹5,000 Balance    │  │ PhonePe / Paytm) │               │ PAYID-MTR-... Log  │  │   Order / Signature   │
  └──────────┬──────────┘  └─────────┬────────┘               └─────────┬──────────┘  └───────────┬───────────┘
             │                       │                                  │                         │
             └───────────────────────┴─────────────────┬────────────────┴─────────────────────────┘
                                                       │
                                                       ▼
                                     ┌───────────────────────────────────┐
                                     │     ISSUES DIGITAL PASS TICKET    │
                                     │        (Cryptographic QR)         │
                                     └───────────────────────────────────┘
```

1. **Meetior Demo Wallet**:
   - Every user receives a private starting balance of **₹5,000**.
   - 1-click instant pass issuance with real-time balance debiting and transaction ledger history.
   - Built-in `+ Top-up ₹2,000` via PayPal Sandbox simulation.

2. **UPI Scan & Pay QR Code**:
   - Backend endpoint `/api/payments/upi-qr` generates standard, high-resolution QR codes via `qrcode`.
   - Formatted with unencoded `@` (`upi://pay?pa=meetior.events@okhdfcbank&...`) for maximum phone scanner compatibility.
   - **Real Phone Testing**: Click **"⚙️ Change UPI ID for real scan testing"** to type your own personal UPI ID (e.g. `yourname@okaxis`), and the QR code will regenerate live for your phone to scan!
   - Complete checkout with the **`✅ I Have Paid / Verify UPI Payment`** button.

3. **PayPal Sandbox**:
   - Instant simulation generating authentic `PAYID-MTR-XXXXXX` references.

4. **Razorpay Test Gateway**:
   - Supports live test keys or automatic simulation fallback.

---

## 🧪 Automated Testing

Meetior includes an end-to-end automated test harness running in isolated disposable databases:

```bash
cd meetior/backend
npm test
```

### Test Suite Highlights:
- **150 passed, 0 failed** across 5 test suites.
- Validates:
  - Auth, registrations, and password hashing
  - Concurrency & booking race conditions
  - Map geocoding, radius calculations, and Koba administrative boundary rules
  - Ticket issuance, QR token hashing, and organizer check-in scanner
  - Financial ledgers, cancellation policies, and organizer payouts
  - Admin RBAC, MFA token verification, and moderation
  - Full browser frontend render contracts

---

## 📁 Repository Structure

```text
meetior/
├── backend/
│   ├── config/
│   │   └── database.js              # Sequelize MySQL connection pool
│   ├── controllers/                 # Express controllers (Admin, Auth, Events, Payments...)
│   ├── middleware/                  # JWT auth, role validation, RBAC permission checks
│   ├── models/                      # 25 Sequelize models (User, Event, Ticket, Payment...)
│   ├── routes/                      # Modular API routing
│   ├── seeders/                     # Seed scripts for admin and baseline accounts
│   ├── services/                    # In-app notifications & ComfyUI sketch workers
│   ├── tests/                       # 150-test isolated automated integration test suite
│   ├── utils/
│   │   ├── cleanDemoUsers.js        # GitHub cleaner script (Purge demo users & events)
│   │   ├── cleanupTestData.js       # Purge temporary test registrations & tickets
│   │   ├── seeder.js                # Core database seed pipeline
│   │   └── seedPublicGatherings.js  # Realistic event seeder across Indian cities
│   ├── server.js                    # Express application entry point (port 5000)
│   └── package.json
├── database/
│   ├── schema.sql                   # Clean MySQL DDL table schemas (25 tables)
│   └── database-relationships.md    # Foreign keys and entity relationship reference
└── frontend/
    └── index.html                   # Unified, zero-build single-file HTML5/CSS3/JS app
```

---

## 📜 Academic Declaration
This project is developed for the **Semester 7 Project Capstone**. All student evaluation materials, architectural documents, and database scripts are preserved in the `database/` and `docs/` directories.
