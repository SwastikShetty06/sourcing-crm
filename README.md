# 🏛️ Sourcing CRM — Channel Partner Ledger & Real Estate Visit Register

<div align="center">

![License](https://img.shields.io/badge/license-MIT-0E5A5A?style=for-the-badge)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Node.js](https://img.shields.io/badge/Node.js_20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_4-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel_Ready-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Mobile](https://img.shields.io/badge/Mobile_Optimized-0E5A5A?style=for-the-badge&logo=android&logoColor=white)

<p align="center">
  <strong>An archival-grade, high-fidelity sourcing CRM designed for real estate sales galleries, developer sales desks, and Channel Partner sourcing teams.</strong>
</p>

<p align="center">
  <i>Replace chaotic WhatsApp groups, lost paper visitor registers, and contested broker commissions with an immutable, auditable digital ledger.</i>
</p>

[Key Features](#-key-features) •
[Architecture](#-system-architecture) •
[Design Philosophy](#-editorial-design-philosophy) •
[Quickstart](#-quickstart--local-development) •
[API Reference](#-api-reference) •
[Deployment](#-deployment-vercel--production)

---

</div>

## 📖 Overview

In real estate property sales, **Channel Partners (CPs)** — real estate brokers, sourcing agencies, and calling desks — drive the majority of project walk-ins. However, managing client attribution, revisit timelines, and broker commission rights is traditionally plagued by:

- **Attribution Disputes**: Disagreements over which broker introduced a buyer first.
- **Untracked Revisits**: Site visits that go stale without timely follow-ups or feedback logs.
- **Commission Blindspots**: Lack of transparent booking records with square footage and agreement values.
- **Data Fragmentation**: Vital buyer notes scattered across personal notebooks and messaging apps.

**Sourcing CRM** solves this with a purpose-built digital ledger. It provides complete attribution lineage (CP Firm &rarr; Individual CP Broker &rarr; Tele-Caller), records timestamped multi-touch interactions, flags overdue follow-ups, and auto-calculates commercial booking figures in real-time.

---

## 🌟 Key Features

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE CRM CAPABILITIES                           │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 📋 Visit Register │ 📈 Live Dashboard │ 💰 Commercial Booking Engine  │
│ 🤝 CP Hierarchy   │ ⏱️ Overdue Engine │ 🏷️ Lost Deal Attribution      │
│ 📝 Touch Timeline │ 👥 Multi-Role RBAC│ 📊 Excel / CSV Export (UTF-8) │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

### 1. 📋 Channel Partner Visit Register
- **Dual-Source Lineage**: Explicitly bifurcates walk-ins into:
  - **Calling Sourcing**: Attributed to a specific Tele-Caller and CP Firm.
  - **Reference Sourcing**: Direct referral from a registered Channel Partner broker.
- **Instant Client Profiling**: Captures client name, 10-digit mobile number, target project/site, visited date, and initial sales manager.
- **Cascaded Dropdowns**: Real-time lookup filtering where selecting a CP Firm instantly cascades available individual brokers.

### 2. 📈 Executive Dashboard & Ledger Strip
- **Real-Time Ledger Strip**: High-contrast, tabular-numeral indicators tracking total visits across pipeline stages:
  - <span style="color:#8A5A08">●</span> **In Progress**: Active pipeline leads undergoing evaluation.
  - <span style="color:#2F6B3F">●</span> **Booked**: Closed sales with unit and commercial details.
  - <span style="color:#9A3324">●</span> **Lost**: Closed-lost opportunities with categorized reasons.
- **7-Day Velocity Counter**: Real-time counter of total customer touches recorded in the trailing week.
- **7+ Days Overdue Alerting**: Instant tabular overview of clients who have not received follow-up interactions within 7 days.
- **Recent Interaction Stream**: Live chronological feed of the last 10 customer touches across all sourcing managers.

### 3. 💰 Booking & Commercial Value Engine
- **Flat & Unit Specifications**: Captures exact unit/tower identifiers (e.g., `Tower B 1402, 3 BHK`) and confirmed booking dates.
- **Real-Time Agreement Value Calculator**:
  $$\text{Agreement Value (₹)} = \text{Area (sq.ft)} \times \text{Price per sq.ft (₹)}$$
- **Flexible & Non-Compulsory**: Allows partial entries or future edits as deals progress through mortgage sanction and agreement signing.
- **Manual Override Support**: Accommodates negotiated lump-sum discounts or adjustments while maintaining clean currency formatting (`₹81,25,000`).
- **Archival Display**: Highlights closed bookings with formatted Indian currency notation on client cards and summary banners.

### 4. 📝 Multi-Touch Interaction Timeline
- **Multi-Modal Touch Logging**: Records sequential feedback across interaction types:
  - `Site Visit` • `Revisit` • `Phone Call` • `Video Conference (VC)` • `Outbound Meeting (OBM)` • `Other`
- **Sales Attendant Tracking**: Logs which sales manager conducted the visit and which user entered the notes.
- **Granular Permissions**: Admins and interaction creators can edit or delete historical interactions (with safeguards preventing accidental deletion of the sole initial visit record).

### 5. 🏷️ Lost Deal Intelligence
- **Categorized Reason Attribution**: Captures structured drop-off causes:
  - `Budget constraints` • `Location mismatch` • `Chose competitor` • `Not interested` • `Unreachable` • `Other`
- **Qualitative Notes**: Detailed freeform remarks to help sales leadership identify recurring buyer objections or pricing mismatches.

### 6. 🤝 Partner Management & Deduplication
- **Unified Master Directory**: Centralized management for `CP Firms`, `Channel Partners`, `Callers`, and `Sales Managers`.
- **Performance Intelligence**: Tracks total visits generated and active client pipeline per partner.
- **Non-Destructive Entity Merging**: Merges duplicate records (e.g., misspelled partner names) across all historical visits and interactions with zero data loss.
- **Status Toggling**: Safely deactivate retiring partners while preserving historical reports.

### 7. 📥 Full-Fidelity Excel / CSV Export
- **One-Click Export**: Generates comprehensive `.csv` spreadsheets reflecting currently filtered or total records.
- **UTF-8 BOM Encoding**: Formatted specifically so Microsoft Excel, Apple Numbers, and Google Sheets correctly display currency symbols, dates, and special characters without encoding errors.
- **Exported Fields**: Client Name, Phone, Project, Source, CP Firm, CP, Caller, Visit Date, Status, Unit Details, Booking Date, Sq.ft, Rate/Sq.ft, Agreement Value, Lost Reason, Lost Remarks, Sales Manager, and Total Touches.

### 8. 📱 Mobile-First Responsive Experience
- **Native Card Conversion**: On mobile screens (`< 768px`), table rows seamlessly convert into stacked cards with zero horizontal clipping.
- **Pinned Top-Right Badges**: Status badges (`Booked`, `In Progress`, `Lost`) and overdue tags stay cleanly anchored to the card header.
- **Ergonomic Touch Targets**: Uniform `40px` and `44px` touch targets designed for fast one-handed entry by on-site sales executives.
- **Safe-Area Inset Navigation**: Custom fixed bottom navigation bar with iOS/Android safe-area notch compensation (`env(safe-area-inset-bottom)`).

---

## 🏗️ System Architecture

### Sourcing & Client Lifecycle Flow

```mermaid
flowchart TD
    CP["Channel Partner Sourcing Desk"] -->|Walk-in / Tele-Lead| SOURCING{Visit Source}
    
    SOURCING -->|Calling| CALLER["Attributed Tele-Caller"]
    SOURCING -->|Reference| FIRM["CP Firm & Individual Broker"]
    
    CALLER --> REG["Visit Registration Desk"]
    FIRM --> REG
    
    REG --> INIT["Initial Site Visit Recorded"]
    
    INIT --> STAGE["Pipeline: In Progress"]
    
    STAGE --> TOUCH["Multi-Touch Interactions<br/>(Revisit / Call / VC / OBM)"]
    TOUCH --> STAGE
    
    STAGE -->|No interaction in 7+ days| OVERDUE["⚠️ Needs Follow-up Alert"]
    OVERDUE --> TOUCH
    
    STAGE -->|Deal Closed| BOOKED["🎉 Status: Booked<br/>Unit Details + Booking Date<br/>Area (sq.ft) × Rate (₹) = Agreement Value (₹)"]
    STAGE -->|Deal Dropped| LOST["❌ Status: Lost<br/>Reason (Budget/Location/Competitor) + Remarks"]
```

### Full-Stack Architecture

```mermaid
flowchart LR
    subgraph Client ["Client Layer (React 18 + Vite 5)"]
        UI["Ledger UI & Cards<br/>(Newsreader / Public Sans)"]
        RQ["TanStack React Query<br/>(Server State Cache)"]
        ROUTER["React Router v6<br/>(Guarded Routes)"]
    end

    subgraph API ["Server Layer (Node.js & Express 4)"]
        AUTH["Auth & JWT Cookie Engine<br/>(bcryptjs + httpOnly)"]
        VALID["Zod Schema Validation<br/>(Strict DTO Checking)"]
        SEC["Security & Protection<br/>(Helmet + Rate Limiting + CORS)"]
        ROUTERS["Express REST Routers<br/>(/clients, /lookups, /stats, /users)"]
    end

    subgraph DB ["Data Layer (MongoDB Atlas)"]
        C_COLL[("Clients Collection")]
        L_COLL[("Lookups Collection")]
        U_COLL[("Users Collection")]
    end

    UI <--> RQ
    RQ <--> ROUTER
    RQ <-->|JSON over HTTPS| VALID
    VALID <--> ROUTERS
    AUTH <--> SEC
    ROUTERS <--> DB
```

---

## 🎨 Editorial Design Philosophy

Sourcing CRM departs from generic corporate dashboards by adopting an **editorial, archival ledger aesthetic** inspired by historic financial registries, legal stationery, and physical site visitor logs:

```
┌─────────────────────────────────────────────────────────────────┐
│                      COLOR PALETTE TOKENS                       │
├───────────────────┬───────────┬─────────────────────────────────┤
│ Token             │ Hex       │ Role                            │
├───────────────────┼───────────┼─────────────────────────────────┤
│ --paper           │ #F5F2EA   │ Warm tactile background canvas  │
│ --surface         │ #FBFAF6   │ Crisp card & modal containers   │
│ --ink             │ #1C1B18   │ High-contrast primary typography│
│ --muted           │ #6A665C   │ Subdued metadata & microcopy    │
│ --hairline        │ #D9D3C3   │ Subtle divider lines & borders  │
│ --accent          │ #0E5A5A   │ Deep executive teal brand accent│
│ --booked-fg / -bg │ #2F6B3F   │ Muted forest green success chip │
│ --progress-fg/-bg │ #8A5A08   │ Rich ochre warm progress chip   │
│ --lost-fg / -bg   │ #9A3324   │ Terracotta crimson alert chip   │
└───────────────────┴───────────┴─────────────────────────────────┘
```

- **Typography**: Paired with **Newsreader** (classic serif for page titles and wordmarks) and **Public Sans** (precision sans-serif with `tabular-nums` for numerals and pricing).
- **Physical Hairlines**: 1px dashed and solid hairlines that evoke ledger rulebooks without visual clutter.
- **Clean Density**: Form inputs and buttons share uniform 38px/40px height baselines for balanced, flush symmetry across all viewport sizes.

---

## 💻 Tech Stack

| Domain | Technologies | Details |
|---|---|---|
| **Frontend Framework** | **React 18**, **Vite 5** | Ultra-fast HMR, component-driven client architecture |
| **State & Cache** | **TanStack Query (React Query v5)** | Declarative queries, automatic cache invalidation, optimistic refetches |
| **Routing** | **React Router DOM v6** | Declarative nested layouts, protected admin & auth routes |
| **Forms & Validation** | **React Hook Form**, **Zod** | Performant, un-controlled form inputs with strict schema parsing |
| **Icons & Typography** | **Lucide React**, **Fontsource** | Precision SVG icon library, Newsreader 600, Public Sans 400/500/600 |
| **Backend Framework** | **Node.js 20+**, **Express 4** | Modular REST API service with clean separation of concerns |
| **Database & ODM** | **MongoDB Atlas**, **Mongoose 8** | Document schema modeling, population hooks, compound indexing |
| **Auth & Security** | **JWT**, **Bcryptjs**, **Helmet** | HttpOnly secure cookies, rate limiting, and password hashing |
| **Export Engine** | **Native CSV Engine** | UTF-8 BOM encoding for seamless Microsoft Excel rendering |
| **Deployment** | **Vercel Serverless / Node Host** | Full-stack monorepo with single-click Vercel configuration |

---

## 📁 Project Directory Structure

```
sourcing-crm/
├── api/                         # Vercel serverless entrypoint
│   └── index.js                 # Serverless adapter for Express app
├── client/                      # React frontend workspace
│   ├── index.html               # HTML entry point with Newsreader/Public Sans
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.js           # Vite dev server & proxy settings
│   └── src/
│       ├── api/                 # Axios / Fetch client API services
│       │   ├── auth.js          # Session, login, logout, password reset
│       │   ├── clients.js       # CRUD, status changes, interactions
│       │   ├── lookups.js       # Master CP firms, brokers, callers
│       │   ├── stats.js         # Dashboard metrics and partner analytics
│       │   └── users.js         # User administration
│       ├── auth/                # Authentication context & route guards
│       │   ├── AuthContext.jsx  # Auth state provider
│       │   ├── RequireAuth.jsx  # Route guard for logged-in managers
│       │   └── RequireAdmin.jsx # Route guard for administrator privileges
│       ├── components/          # Reusable design system components
│       │   ├── AddFeedbackForm.jsx  # Compact interaction recorder
│       │   ├── AppShell.jsx     # Desktop rail & mobile bottom navigation
│       │   ├── CreatableSelect.jsx  # Typeahead searchable select with create
│       │   ├── SourceSegment.jsx    # Calling vs Reference pill toggle
│       │   ├── StatusChip.jsx   # In Progress, Booked, Lost badge
│       │   ├── StatusDialog.jsx # Status transition modal (Sqft, Rate, Value)
│       │   ├── Table.jsx        # Responsive table with mobile card conversion
│       │   └── Timeline.jsx     # Interaction audit trail
│       ├── lib/                 # Utility libraries
│       │   ├── exportExcel.js   # UTF-8 BOM formatted Excel export
│       │   ├── format.js        # Date, time, and currency helpers
│       │   └── similar.js       # Levenshtein string matching for lookups
│       ├── pages/               # Application view controllers
│       │   ├── Account.jsx      # Password change & user profile
│       │   ├── ClientDetail.jsx # Client dossier, booking info & timeline
│       │   ├── Clients.jsx      # Filterable client ledger & export
│       │   ├── Dashboard.jsx    # Metric strips, velocity & overdue alerts
│       │   ├── Login.jsx        # Manager sign-in
│       │   ├── NewVisit.jsx     # Multi-step visit registration form
│       │   ├── Partners.jsx     # CP firm & broker directory & merging
│       │   ├── Setup.jsx        # Initial first-run admin bootstrapper
│       │   └── Team.jsx         # Sourcing team user administration
│       └── styles/              # Design tokens and CSS stylesheets
│           ├── base.css         # Reset, body styling, and typography
│           ├── components.css   # Component styles and @media queries
│           └── tokens.css       # Color, spacing, and font custom properties
├── server/                      # Express backend workspace
│   ├── package.json             # Backend dependencies
│   ├── scripts/
│   │   └── seedDev.js           # Comprehensive development dataset generator
│   └── src/
│       ├── app.js               # Express application initialization & middleware
│       ├── index.js             # HTTP server listener
│       ├── config/              # Database connection & env validation
│       ├── middleware/          # JWT auth, admin authorization, Zod validation
│       ├── models/              # Mongoose schemas (Client, Lookup, User)
│       ├── routes/              # REST controllers (/clients, /lookups, /stats, /users)
│       └── utils/               # String normalization and lookup resolvers
├── package.json                 # Monorepo root scripts (concurrently dev & build)
├── vercel.json                  # Vercel monorepo deployment manifest
└── README.md                    # Project documentation
```

---

## 🚀 Quickstart & Local Development

### Prerequisites

- **Node.js**: `v20.0.0` or higher
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- **npm**: `v9.0.0` or higher

### 1. Clone the Repository

```bash
git clone https://github.com/SwastikShetty06/sourcing-crm.git
cd sourcing-crm
```

### 2. Install Dependencies

Install root, client, and server dependencies in one command:

```bash
npm install
npm run install:all # Or: cd server && npm install && cd ../client && npm install && cd ..
```

### 3. Configure Server Environment

Copy the example environment configuration:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your preferred settings:

```env
MONGODB_URI=mongodb://localhost:27017/cp_ledger
MONGODB_DB=cp_ledger
JWT_SECRET=super_secret_jwt_random_key_min_32_characters_long
PORT=5001
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 4. Seed Development Data (Optional)

Generate realistic CP firms, individual brokers, callers, and client visits:

```bash
cd server
npm run seed:dev
cd ..
```

> **Default Seed Accounts:**
> - **Admin User**: `admin` / `AdminPass123`
> - **Sourcing Manager**: `vikram.m` / `ManagerPass123`

### 5. Launch Development Servers

Run both the Vite frontend client and Express backend simultaneously:

```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:5001](http://localhost:5001)

### 6. First-Run Admin Setup

If starting with an empty database without running the seed script:
1. Open [http://localhost:5173](http://localhost:5173) in your browser.
2. The application will detect no admin exists and redirect to `/setup`.
3. Fill in your name, admin User ID, and a secure password (min. 8 characters).
4. Once completed, you will be automatically logged in to the dashboard.

---

## 📡 API Reference

All API endpoints are prefixed with `/api` and require valid authentication cookies (except setup, login, and health checks).

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/auth/status` | Check if initial setup is completed | Public |
| `POST` | `/api/auth/setup` | Create the initial primary administrator | Public (First Run) |
| `POST` | `/api/auth/login` | Authenticate with User ID & Password | Public |
| `POST` | `/api/auth/logout` | Clear HTTP-only authentication cookie | Authenticated |
| `GET` | `/api/auth/me` | Fetch active user session details | Authenticated |
| `POST` | `/api/auth/change-password` | Update account password | Authenticated |

### Clients & Visits (`/api/clients`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/clients` | Query clients with filtering, sorting & pagination | Authenticated |
| `POST` | `/api/clients` | Register a new client site visit | Authenticated |
| `GET` | `/api/clients/:id` | Fetch client dossier with interaction history | Authenticated |
| `PATCH` | `/api/clients/:id` | Update client details (Unit, Sqft, Rate, Value) | Owner / Admin |
| `POST` | `/api/clients/:id/status` | Update status (In Progress, Booked, Lost) | Owner / Admin |
| `POST` | `/api/clients/:id/interactions` | Add sequential interaction touch | Authenticated |
| `PATCH` | `/api/clients/:id/interactions/:intId` | Update interaction notes or sales manager | Creator / Admin |
| `DELETE` | `/api/clients/:id/interactions/:intId` | Remove interaction touch | Creator / Admin |
| `DELETE` | `/api/clients/:id` | Permanently delete client record | Owner / Admin |
| `POST` | `/api/clients/:id/archive` | Archive client from active reports | Admin Only |

### Partner Lookups (`/api/lookups`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/lookups` | List lookups (`cp_firm`, `cp`, `caller`, `sales_manager`) | Authenticated |
| `POST` | `/api/lookups` | Create new lookup entity | Authenticated |
| `PATCH` | `/api/lookups/:id` | Rename lookup entity or toggle active state | Admin Only |
| `POST` | `/api/lookups/:id/merge` | Merge duplicate lookup into canonical target | Admin Only |

### Analytics & Summary (`/api/stats`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/stats/summary` | Pipeline metrics, 7-day velocity, overdue leads | Authenticated |
| `GET` | `/api/stats/partners` | Partner directory with visit count & active pipeline | Authenticated |

### Team Administration (`/api/users`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/users` | List all team accounts and roles | Admin Only |
| `POST` | `/api/users` | Create manager account with temporary password | Admin Only |
| `PATCH` | `/api/users/:id` | Update user role or toggle active state | Admin Only |
| `POST` | `/api/users/:id/reset-password` | Generate new temporary password | Admin Only |

---

## 🌐 Deployment (Vercel & Production)

The repository is pre-configured for full-stack deployment on **Vercel** via serverless functions and static asset CDN distribution:

### 1. Set Up MongoDB Atlas
1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and whitelist all incoming IPs (`0.0.0.0/0`) or Vercel deployment IP ranges.
3. Copy your MongoDB connection URI (e.g., `mongodb+srv://user:pass@cluster0.mongodb.net/?retryWrites=true&w=majority`).

### 2. Deploy to Vercel
1. Import your `sourcing-crm` repository into the **Vercel Dashboard**.
2. Vercel automatically detects the root [`vercel.json`](file:///Users/swastik/Desktop/CP%20Ledger/vercel.json) configuration.
3. Configure Environment Variables in **Project Settings &rarr; Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `MONGODB_DB`: `cp_ledger`
   - `JWT_SECRET`: A secure 32+ character random string
   - `NODE_ENV`: `production`
4. Click **Deploy**. Vercel will build the Vite frontend into static edge assets and serve the Express backend through `/api` serverless functions.

---

## 🔒 Security & Data Integrity

- **Strict DTO Validation**: All incoming requests are validated against strict Zod schemas before touching business logic or the database.
- **HTTP-Only Cookies**: Authentication tokens are stored exclusively in HTTP-only, SameSite cookies to mitigate XSS exposure.
- **Brute-Force & Rate Limiting**: Built-in IP rate limiters on login and mutation endpoints via `express-rate-limit`.
- **Security Headers**: Standard security headers (HSTS, Content Security Policy, X-Frame-Options) enforced via `helmet`.
- **Audit Trails**: Status history changes and interaction edits capture the authoring user's ID, timestamp, and optional remarks.

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute it for personal, commercial, or enterprise real estate sales deployments.

<div align="center">
  <sub>Crafted with care for modern real estate sales desks and Channel Partner teams.</sub>
</div>
