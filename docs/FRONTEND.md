# FleetIQ Frontend Architecture

## Overview

The FleetIQ frontend is a React + Vite + TypeScript single-page application that provides a serious industrial fleet-management and decision-intelligence UI. It connects to the Phase 1–6 FastAPI backend and presents the full asset lifecycle journey:

**Fleet Overview → Identify Underutilized Asset → Asset 360 → Understand Risk → View Future Demand → Allocation Candidates → Recommendation → Approve/Reject → Action → Impact**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build Tool | Vite 8 |
| Language | TypeScript |
| Routing | React Router DOM v7 |
| Charts | Recharts |
| HTTP | Native Fetch (with proxy) |
| Styling | Vanilla CSS (custom design system) |
| Testing | Vitest + React Testing Library |
| Fonts | Inter (Google Fonts) + JetBrains Mono |

---

## Project Structure

```
frontend/
├── index.html                   # Entry HTML with SEO meta
├── vite.config.ts               # Vite + Vitest config, API proxy
├── tsconfig.json                # TypeScript config
├── package.json                 # Scripts: dev, build, test
└── src/
    ├── main.tsx                 # React entry point
    ├── App.tsx                  # Router, layout shell
    ├── index.css                # Global design system (CSS custom props, all utilities)
    ├── types/
    │   └── index.ts             # All TypeScript interfaces matching backend schemas
    ├── api/
    │   ├── client.ts            # Base fetch client (proxied to /api → :8000)
    │   ├── dashboard.ts         # GET /dashboard/summary, /analytics/fleet, system scans
    │   ├── assets.ts            # GET/POST /assets, /operators, /sites
    │   ├── rentals.ts           # GET/POST /rentals + checkout/checkin
    │   ├── alerts.ts            # GET /alerts
    │   └── intelligence.ts      # /forecasts, /recommendations + typed mocks (Phase 7–9)
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.tsx      # Fixed left navigation with 13 sections
    │   │   └── TopBar.tsx       # Top bar with breadcrumb
    │   ├── ui/
    │   │   ├── Badge.tsx        # SeverityBadge, AssetStatusBadge
    │   │   ├── States.tsx       # LoadingState, EmptyState, ErrorState
    │   │   └── ProvenancePill.tsx  # REAL/DERIVED/SIMULATED/ILLUSTRATIVE ESTIMATE
    │   └── analytics/
    │       └── UtilizationBar.tsx  # Color-coded utilization progress bar
    ├── pages/
    │   ├── FleetCommandCenter.tsx   # (1) Main dashboard
    │   ├── AssetDashboard.tsx       # (2) Asset list + filters
    │   ├── Asset360.tsx             # (3) Single asset deep dive (5 tabs)
    │   ├── AlertsPage.tsx           # (5) Alert center + scan triggers
    │   ├── UtilizationAnalytics.tsx # (6) Fleet utilization charts + table
    │   ├── RiskDashboard.tsx        # (7) Risk scores grid
    │   ├── DemandForecasting.tsx    # (8) [SIMULATED mock] Forecast views
    │   ├── AllocationCandidates.tsx # (9) [DERIVED mock] Candidate ranking
    │   ├── RecommendationsPage.tsx  # (10) Recommendation list (real + demo card)
    │   ├── ApprovalFlow.tsx         # (11) Approve/reject UI
    │   ├── ActionStatus.tsx         # (12) [SIMULATED] Action log
    │   ├── ImpactPage.tsx           # (13) [ILLUSTRATIVE ESTIMATE] Impact view
    │   └── RentalWorkflow.tsx       # (4) Check-in/check-out forms
    └── __tests__/
        ├── setup.ts             # jest-dom + fetch mock utility
        └── app.test.tsx         # Full test suite (40+ tests)
```

---

## Pages

| # | Route | Page | Data Source |
|---|-------|------|-------------|
| 1 | `/` | Fleet Command Center | REAL: `/dashboard/summary`, `/analytics/fleet`, `/assets` |
| 2 | `/assets` | Asset Dashboard | REAL: `/assets` |
| 3 | `/assets/:assetId` | Asset 360 | REAL: `/assets/{id}`, `/usage`, `/events`, `/analytics`, `/risk` |
| 4 | `/rentals` | Rental Workflow | REAL: `/rentals` + checkout/checkin POST |
| 5 | `/alerts` | Alert Center | REAL: `/alerts` + system scan POSTs |
| 6 | `/utilization` | Utilization Analytics | REAL: `/analytics/fleet` + per-asset `/analytics` |
| 7 | `/risk` | Risk Dashboard | REAL: per-asset `/risk` |
| 8 | `/forecasting` | Demand Forecasting | **SIMULATED mock** (Phase 7 pending) |
| 9 | `/candidates` | Allocation Candidates | **DERIVED mock** (Phase 8 pending) |
| 10 | `/recommendations` | Recommendations | REAL: `/recommendations` + DERIVED demo card |
| 11 | `/approvals` | Approval / Rejection | **SIMULATED mock** (Phase 9 pending) |
| 12 | `/actions` | Action Status | **SIMULATED mock** (Phase 9 pending) |
| 13 | `/impact` | Impact | **ILLUSTRATIVE ESTIMATE mock** |

---

## Components

### Layout
- **Sidebar** — Fixed 240px left panel. All 13 nav items organized into 4 sections. API health indicator.
- **TopBar** — Fixed top bar with breadcrumb navigation. Shows asset ID for Asset 360 pages.

### UI Primitives
- **ProvenancePill** — Color-coded badge: REAL (blue), DERIVED (purple), SIMULATED (amber), ILLUSTRATIVE ESTIMATE (grey). Used on every data section.
- **Badge / SeverityBadge / AssetStatusBadge** — Severity and status indicators.
- **LoadingState / EmptyState / ErrorState** — Standard feedback states with `data-testid` attributes.
- **UtilizationBar** — Color-coded progress bar: 0% = red, <30% = orange, <60% = yellow, ≥60% = green.

### Domain Components
- **Asset360 tabs**: Overview, Utilization Analytics, Risk, Events timeline, Operations (operator assign/unassign).
- **EQX1007 Spotlight** — Appears on Fleet Command Center and Asset 360 with backend-computed scores (not hardcoded).
- **RecommendationCard** — Inline on Recommendations page showing evidence chain from analytics → candidates → action.

---

## API Integration

### Base Client
`src/api/client.ts` — All requests go through `/api` which Vite proxies to `http://localhost:8000`. Throws `ApiError` with status code on non-2xx responses.

### Real Endpoints (Phase 1–6)
All endpoints in `docs/FRONTEND_CONTRACT.md` are wired to real backend calls.

### Mock / Real Boundary

| File | Status | How to swap |
|------|--------|-------------|
| `api/dashboard.ts` | **REAL** | Direct |
| `api/assets.ts` | **REAL** | Direct |
| `api/rentals.ts` | **REAL** | Direct |
| `api/alerts.ts` | **REAL** | Direct |
| `api/intelligence.ts` → `getMockForecasts()` | **SIMULATED** | Replace with `api.get('/forecasts')` |
| `api/intelligence.ts` → `getMockCandidates()` | **DERIVED** | Replace with `api.get('/allocation_candidates')` |
| `pages/ActionStatus.tsx` → `MOCK_ACTIONS` | **SIMULATED** | Replace with `api.get('/recommendation_actions')` |
| `pages/ImpactPage.tsx` → `ILLUSTRATIVE_IMPACTS` | **ILLUSTRATIVE** | Replace with `api.get('/impact_records')` |

---

## Data Provenance

All data is labeled with its source using `ProvenancePill`:

- **REAL / OFFICIAL** — Data from the official challenge dataset, read directly from backend APIs.
- **DERIVED** — Metrics computed from real data (utilization %, risk score, productive hours). Not raw observations.
- **SIMULATED** — Illustrative mock data for Phase 7–9 features not yet backend-implemented.
- **ILLUSTRATIVE ESTIMATE** — Placeholder financial/impact values with explicit disclaimer.

No synthetic forecast looks like real operational data. Provenance is shown inline on every card, table, and chart.

---

## Demo Flow (EQX1007)

1. **Land on Fleet Command Center** (`/`) → See EQX1007 spotlight banner (0 engine hours, 12 idle hours, HIGH underutil, CRITICAL risk)
2. **Click "Open Asset 360 →"** → Navigate to `/assets/EQX1007`
3. **Overview tab** → See usage record (REAL), derived utilization (0%)
4. **Analytics tab** → See score 70 HIGH, two reasons (DERIVED from rule engine v1.0.0)
5. **Risk tab** → See score 60 CRITICAL, two risk factors (DERIVED)
6. **Click "Future Demand →"** → `/forecasting` (SIMULATED mock showing S003 needs Excavator)
7. **Click "Find Candidates →"** → `/candidates` (DERIVED mock showing EQX1007 rank #1 score 91)
8. **Click "View Recommendation →"** → `/recommendations` (DERIVED demo card with evidence chain)
9. **Click "Go to Approval →"** → `/approvals` (approve/reject flow)
10. **After approval → "View Action Status →"** → `/actions`
11. **View Impact →** → `/impact` (ILLUSTRATIVE ESTIMATE with disclaimer)

All scores/severities displayed come from `GET /assets/EQX1007/analytics` and `GET /assets/EQX1007/risk` — never hardcoded.

---

## Setup & Development

### Prerequisites
- Node.js 18+
- Backend running at `http://localhost:8000`

### Install
```bash
cd frontend
npm install
```

### Development Server
```bash
npm run dev
# Opens at http://localhost:3000
# API requests proxied from /api → http://localhost:8000
```

### Testing
```bash
npm run test
# Runs Vitest (all tests, no browser needed)
```

### Build
```bash
npm run build
```

---

## Design System

- **Background**: `#0a0e1a` (dark industrial)
- **Surface**: `#111827`
- **Accent**: `#00d4aa` (CAT-green-teal)
- **Typography**: Inter (text), JetBrains Mono (IDs, codes)
- **Status colors**: Red (critical), Orange (high), Yellow (medium), Green (low)
- **No unnecessary animation** — Only subtle hover/focus transitions
- **Responsive**: 1920px → 1440px → 1024px → 768px

---

## Testing Coverage

Tests in `src/__tests__/app.test.tsx`:

- **ProvenancePill** — All 4 provenance types
- **Badge** — Severity and status variants including null
- **States** — Loading, empty, error + retry callback
- **UtilizationBar** — Color class selection, label display
- **FleetCommandCenter** — Loading, KPI render, EQX1007 spotlight, API error
- **AssetDashboard** — Table render, DEMO badge, empty state, filter buttons
- **Asset360** — EQX1007 DEMO ASSET badge, attention banner, tab navigation
- **AlertsPage** — Table render, empty state
- **DemandForecasting** — SIMULATED badge, Phase 7 warning
- **AllocationCandidates** — EQX1007 rank #1, DERIVED badge
- **ApprovalFlow** — Button render, APPROVED decision, REJECTED decision
- **ImpactPage** — ILLUSTRATIVE ESTIMATE badges, disclaimer text
- **ActionStatus** — Simulated action log render
