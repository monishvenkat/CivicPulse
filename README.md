# Civic Pulse — Public Grievance Tracker

**Hackathon ID:** HACK-P423  
**Tagline:** *Your Voice, Our Responsibility.*  

---

## Table of Contents
1. [Project Overview & Problem Statement](#1-project-overview--problem-statement)
2. [Key Capabilities by Role](#2-key-capabilities-by-role)
3. [Segregated Authentication & Security Model](#3-segregated-authentication--security-model)
4. [Service Level Agreements (SLAs) & State Machine](#4-service-level-agreements-slas--state-machine)
5. [Demo Accounts & Login Portals](#5-demo-accounts--login-portals)
6. [Technology Stack & System Architecture](#6-technology-stack--system-architecture)
7. [Directory Structure](#7-directory-structure)
8. [Local Quickstart & Execution Guide](#8-local-quickstart--execution-guide)
9. [Automated Test Suite & Verification Results](#9-automated-test-suite--verification-results)
10. [REST API Contract Summary](#10-rest-api-contract-summary)

---

## 1. Project Overview & Problem Statement

Public grievance management often suffers from bureaucratic opacity: complaints submitted by citizens are lost in administrative queues, resolution deadlines are ignored without accountability, and citizens have no visibility into municipal field progress.

**Civic Pulse (HACK-P423)** solves this challenge by delivering an automated, accountable, and transparent civic operations platform:
- **For Citizens:** Transparent complaint lodging with unique tracking IDs (`CP-YYYYMMDD-XXXX`), real-time status progression, guaranteed SLA countdown timers, and resolution certification.
- **For Case Workers:** Scoped case queues, SLA urgency alerts, strict workflow transition gates, and mandatory resolution documentation.
- **For Operations Managers:** A city-wide command center with live metrics, workload distribution tools, non-destructive personnel reassignment, and an automatic overdue escalation register.
- **For Municipal Administrators:** System configuration, role-based account provisioning, user activation controls, and audit diagnostics.

---

## 2. Key Capabilities by Role

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CIVIC PULSE ECOSYSTEM                           │
├────────────────────┬────────────────────┬──────────────────────────────┤
│      CITIZEN       │    CASE WORKER     │      OPERATIONS MANAGER      │
│  (Public Portal)   │ (Official Portal)  │      (Official Portal)       │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ • Self-Registration│ • Scoped Case Queue│ • City-wide Command Center   │
│ • Submit Grievance │ • SLA Countdowns   │ • Workload Distribution      │
│ • Unique Ref Code  │ • State Transitions│ • Assign / Reassign Staff    │
│ • Live Audit Trail │ • Resolution Notes │ • Auto-Escalation Management │
│ • Reopen Cases     │ • Overdue Tracking │ • Resolution Performance     │
└────────────────────┴────────────────────┴──────────────────────────────┘
                                    │
                         ADMINISTRATOR (Official)
                         • Account Provisioning & Staff Onboarding
                         • User Activation Controls (Deactivate/Reactivate)
                         • SLA Policy Configuration & Health Diagnostics
```

### Detailed Role Features
- **Citizen:**
  - Submit grievances with categories (*Roads & Transport, Water & Sanitation, Waste Management, Parks, Street Lighting, Public Safety, Other*), geographic location, priority, and rich description.
  - Automatic SLA calculation based on priority level.
  - Interactive audit timeline showing every step, timestamps, and assigned worker.
  - Case reopening capability if issues persist after resolution (requires mandatory reason).
- **Case Worker:**
  - Isolated queue containing only grievances assigned to that specific worker.
  - Step-by-step lifecycle actions (*Acknowledge $\rightarrow$ Start Progress $\rightarrow$ Request Info $\rightarrow$ Resolve*).
  - Mandatory resolution note (minimum 5 characters) before marking any case as `Resolved`.
- **Operations Manager:**
  - Comprehensive overview of all city grievances with real-time status breakdowns.
  - Quick-assignment drawer to route unassigned cases to active field workers.
  - Personnel reassignment that preserves audit history and original SLA deadlines.
  - Overdue cases monitor and 1-click escalation acknowledgment.
- **Administrator:**
  - Onboard and provision internal staff (*case_worker*, *manager*, *admin*).
  - Activate or deactivate user accounts instantly with backend safety guards.
  - System diagnostics and real-time operational metrics.

---

## 3. Segregated Authentication & Security Model

Civic Pulse enforces a complete physical and visual separation between public citizens and internal municipal officials.

### Dedicated Login Portals
1. **Citizen Portal (`/login`):**
   - Clean, citizen-focused interface with direct links to Registration (`/signup`) and Password Reset (`/forgot-password`).
   - Official accounts attempting to sign in on `/login` are blocked, logged out, and directed to the official portal.
   - Includes a discreet, low-contrast link (`Official Login →`) fixed at the extreme bottom-left corner of the viewport.
2. **Official Portal (`/login/official`):**
   - High-security municipal dark/slate aesthetic.
   - Strictly reserved for `case_worker`, `manager`, and `admin` roles.
   - Citizens attempting to access the official portal are blocked with an explicit redirection message.
   - Authenticated staff are routed dynamically to their verified dashboard:
     - Admin $\rightarrow$ `/admin/dashboard`
     - Manager $\rightarrow$ `/manager/dashboard`
     - Case Worker $\rightarrow$ `/worker/dashboard`

### Production Security Principles
- **No On-Screen Demo Credential Buttons:** The production UI contains zero autofill buttons or hardcoded credentials. All inputs must be entered through standard form inputs.
- **Zero-Trust Role Assignment:** Public registration (`POST /api/auth/register`) strictly sets `role: 'citizen'`, regardless of any injected payload fields.
- **Strict Citizen Data Isolation:** Citizens can only query their own grievances (`citizen: req.user._id`). Any attempt to inspect another citizen's case returns HTTP `403 Forbidden`.
- **JWT HttpOnly Cookies:** Sessions are stored in signed, HTTP-only, `SameSite=Strict` cookies (`civic_session`), immune to client-side XSS extraction.
- **Password Standards:** Minimum 10 characters, maximum 72 characters, containing at least one uppercase letter, one lowercase letter, and one number. Passwords hashed using bcrypt (12 rounds).

---

## 4. Service Level Agreements (SLAs) & State Machine

### Guaranteed SLA Policy Matrix

| Priority | Guaranteed SLA Window | Target Resolution | Incident Examples |
| :--- | :--- | :--- | :--- |
| **Critical** | **4 Hours** | Immediate Emergency Response | Burst water mains, exposed high-voltage wiring, road sinkholes. |
| **High** | **24 Hours** | Priority Field Dispatch | Deep arterial potholes, inoperative traffic signals, water contamination. |
| **Medium** | **48 Hours** | Scheduled Maintenance | Streetlight outages, park waste overflow, catch basin blockages. |
| **Low** | **72 Hours** | Standard Queue | Park boundary graffiti, landscaping clearance, municipal signage. |

- **Deadline Formula:** `slaDeadline = submittedAt + (slaHoursByPriority[priority] * 3600000)`.
- **Automated Escalation Sweep:** An asynchronous background monitor sweeps all active cases every 60 seconds. Cases past their SLA deadline automatically escalate to `escalation.state = 'open'` with priority alerts in the Manager Command Center.
- **Assignment Preservation:** Assigning or reassigning a case records an assignment history entry and does **not** reset the original SLA clock.

### Grievance State Machine Lifecycle

```
[ Submitted ] ──► [ Acknowledged ] ──► [ In Progress ] ──► [ Resolved ] ──► [ Closed ]
                          ▲                   ▲                  │
                          │                   │                  ▼
                          └── [ Awaiting Info ] ◄── (Reopened by Citizen)
```

1. **Submitted $\rightarrow$ Acknowledged:** Case worker confirms receipt of the grievance.
2. **Acknowledged $\rightarrow$ In Progress:** Case worker or dispatch team begins active work.
3. **In Progress $\longleftrightarrow$ Awaiting Info:** Case worker requests additional details or documentation from the citizen.
4. **In Progress $\rightarrow$ Resolved:** Requires mandatory resolution note detailing field action.
5. **Resolved $\rightarrow$ Closed:** Formal closure of the verified grievance.
6. **Resolved / Closed $\rightarrow$ In Progress (Reopened):** Citizen or manager can reopen unresolved issues with documented reasons.

---

## 5. Demo Accounts & Login Portals

Run `npm run seed` to populate the database with realistic demo data, staff members, and active grievances across multiple SLA states:

| Role | Email (Username) | Password | Designated Login Portal | Landing Page |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@civicpulse.demo` | `Citizen@123` | `/login` (Citizen Portal) | `/citizen/dashboard` |
| **Citizen 2** | `citizen2@civicpulse.demo` | `Citizen@123` | `/login` (Citizen Portal) | `/citizen/dashboard` |
| **Case Worker** | `worker@civicpulse.demo` | `Worker@123` | `/login/official` (Official Portal) | `/worker/dashboard` |
| **Case Worker 2** | `worker2@civicpulse.demo` | `Worker@123` | `/login/official` (Official Portal) | `/worker/dashboard` |
| **Manager** | `manager@civicpulse.demo` | `Manager@123` | `/login/official` (Official Portal) | `/manager/dashboard` |
| **Administrator** | `admin@civicpulse.demo` | `Admin@123` | `/login/official` (Official Portal) | `/admin/dashboard` |

---

## 6. Technology Stack & System Architecture

### Frontend Architecture
- **Framework:** React 19 + Vite 7 Single Page Application
- **Styling:** Tailwind CSS v4 directives with custom color palettes and responsive layouts
- **Routing:** React Router 7 with role-guarded route boundaries
- **Icons & Charts:** Lucide React icons & Recharts analytics
- **HTTP Client:** Axios configured with `credentials: 'include'` and interceptors

### Backend Architecture
- **Runtime & Framework:** Node.js 20+ with Express 5 REST API
- **Database Engine:** MongoDB with Mongoose 8 ORM
- **Authentication:** JSON Web Tokens (JWT) issued into `HttpOnly`, `SameSite=Strict` cookies
- **Password Security:** `bcryptjs` with 12 salt rounds
- **Rate Limiting:** `express-rate-limit` protecting authentication routes
- **Automated Daemon:** 60-second periodic SLA check and overdue auto-escalator

---

## 7. Directory Structure

```
.
├── backend/
│   ├── server/
│   │   ├── index.js             # Express app, REST API routes, SLA daemon, static serving
│   │   ├── models.js            # Mongoose schemas: User, Grievance, StatusHistory, AssignmentHistory
│   │   ├── policies.js          # Validators, SLA mapping, lifecycle transition rules
│   │   ├── auth.js              # JWT issueSession, authenticate, allow(roles...) middleware
│   │   ├── seed.js              # Repeatable demo seeding script for users and sample grievances
│   │   ├── check-db.js          # Pre-flight MongoDB Atlas / local connection validator
│   │   ├── auth.test.js         # Unit tests: validators, password strength, transitions
│   │   ├── auth-routes.test.js  # Integration tests: login segregation & role boundaries
│   │   ├── models.test.js       # Unit tests: Mongoose schema and index integrity
│   │   └── workflow.test.js     # End-to-end integration: full grievance lifecycle
│   ├── .env                     # Backend secrets & MongoDB Atlas URI (git-ignored)
│   ├── .env.example             # Configuration template
│   └── package.json             # Backend dependencies and test scripts
│
├── frontend/
│   ├── src/
│   │   ├── api/client.js        # Axios instance configured for cookie-based credentials
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # React authentication state and session methods
│   │   ├── components/          # StatusBadge, PriorityBadge, AppLayout, Table, Modals
│   │   ├── pages/
│   │   │   ├── public/          # LandingPage, LoginPage, OfficialLoginPage, SignupPage, 403, 404
│   │   │   ├── citizen/         # CitizenDashboard, SubmitGrievancePage, MyGrievancesPage
│   │   │   ├── worker/          # WorkerDashboard, AssignedCasesPage
│   │   │   ├── manager/         # ManagerDashboard, AllGrievances, Overdue, Escalations, Analytics
│   │   │   ├── admin/           # AdminDashboard, UserManagement, SystemSettings
│   │   │   └── shared/          # GrievanceDetailPage (Audit timeline, assign, update, reopen)
│   │   ├── main.jsx             # React 19 router root, route guards, role protection
│   │   └── style.css            # Tailwind CSS v4 design system
│   ├── index.html               # Single page root
│   ├── vite.config.js           # Vite 7 config with @tailwindcss/vite & reverse proxy
│   └── package.json             # Frontend dependencies
│
├── docs/
│   ├── REQUIREMENTS.md          # Comprehensive product requirements & user personas
│   ├── API_CONTRACT.md          # Complete REST API reference with payload schemas
│   └── DATABASE_SCHEMA.md       # MongoDB entity models, indexes, and audit collections
│
├── .gitignore                   # Monorepo git ignore protecting secrets and build outputs
├── package.json                 # Monorepo root orchestration scripts
├── AGENTS.md                    # Autonomous agent guidelines & operational rules
└── README.md                    # Project documentation
```

---

## 8. Local Quickstart & Execution Guide

### Prerequisites
- **Node.js:** v20.x or newer
- **npm:** v10.x or newer
- **MongoDB:** Active MongoDB Atlas URI or local instance (`mongodb://127.0.0.1:27017/civic_pulse`)

### 1. Configure Environment Secrets
Ensure `backend/.env` exists:
```env
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/civic_pulse?retryWrites=true&w=majority
JWT_SECRET=civic-pulse-long-secure-random-secret-key-32chars
CLIENT_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
SLA_HOURS=72
DNS_SERVERS=8.8.8.8
```
*(Note: If running on Windows with MongoDB Atlas, `DNS_SERVERS=8.8.8.8` ensures reliable SRV DNS lookup).*

### 2. Install Dependencies
```bash
# Install root orchestration tools
npm install

# Install backend dependencies
npm install --prefix backend

# Install frontend dependencies
npm install --prefix frontend
```

### 3. Seed Database with Demo Data
```bash
npm run seed
```
This provisions the 6 demo accounts and 12 realistic sample grievances across various states.

### 4. Start Development Servers
```bash
npm run dev
```
- **Frontend:** http://localhost:5173 (Vite dev server with automatic `/api` proxying)
- **Backend API:** http://localhost:4000

### 5. Production Build & Static Serving
To build the frontend bundle and serve it directly from the Express backend:
```bash
# Build frontend bundle
npm run build

# Start backend in production mode (serves frontend/dist)
npm start
```

---

## 9. Automated Test Suite & Verification Results

Civic Pulse includes an automated test suite executed with Node's native test runner (`node:test`) and `supertest`.

Execute all test suites with:
```bash
npm test
```
---

## 10. REST API Contract Summary

Base URL: `/api`  
Authentication: Cookie-based JWT (`civic_session`)

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new citizen account (strictly forces `role: 'citizen'`). |
| `POST` | `/api/auth/login` | Public | Authenticate credentials and receive `civic_session` cookie. |
| `POST` | `/api/auth/logout` | Authenticated | Clear session cookie and invalidate login state. |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile and verified role. |
| `GET` | `/api/grievances` | Authenticated | Query grievances with scoped role filtering, status filters, search, and pagination. |
| `POST` | `/api/grievances` | `citizen` | Submit a new civic grievance with auto-generated reference number and SLA. |
| `GET` | `/api/grievances/:id` | Authenticated | Fetch full grievance details, status history, and assignment audit logs. |
| `PATCH`| `/api/grievances/:id/status`| Worker / Manager / Admin | Update grievance status (mandatory resolution note for `Resolved`). |
| `POST` | `/api/grievances/:id/assign`| Manager / Admin | Assign or reassign grievance to active case worker without resetting SLA. |
| `POST` | `/api/grievances/:id/reopen`| Citizen Owner / Manager | Reopen resolved or closed case with mandatory documented reason. |
| `POST` | `/api/grievances/:id/escalate/ack` | Manager / Admin | Acknowledge SLA overdue escalation alert. |
| `GET` | `/api/dashboard/stats` | Authenticated | Fetch role-tailored operational KPIs and priority breakdowns. |
| `GET` | `/api/dashboard/analytics`| Manager / Admin | Retrieve 30-day resolution trends, category frequencies, and department performance. |
| `GET` | `/api/users` | Manager / Admin | List municipal staff and user accounts. |
| `POST` | `/api/users` | `admin` | Provision staff accounts (*case_worker*, *manager*, *admin*). |
| `PATCH`| `/api/users/:id/active` | `admin` | Activate or deactivate user accounts. |

---
