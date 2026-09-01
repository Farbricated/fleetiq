# Member 3 — Frontend Progress

## Status: COMPLETE (Phase 10 Frontend)

All 13 pages implemented. 36/36 tests passing. Documentation complete.

---

## Frontend Stack

| Item | Choice |
|---|---|
| Framework | React 18 |
| Build Tool | Vite 8 |
| Language | TypeScript |
| Routing | React Router DOM v7 |
| Charts | Recharts |
| HTTP Client | Native Fetch (Vite proxy) |
| Styling | Vanilla CSS (custom design system) |
| Testing | Vitest + React Testing Library |
| Fonts | Inter (Google Fonts), JetBrains Mono |

---

## Pages Completed

| # | Page | Route | Data |
|---|------|-------|------|
| 1 | Fleet Command Center | `/` | REAL backend |
| 2 | Asset Dashboard | `/assets` | REAL backend |
| 3 | Asset 360 | `/assets/:assetId` | REAL backend |
| 4 | Rental Workflow | `/rentals` | REAL backend |
| 5 | Alert Center | `/alerts` | REAL backend |
| 6 | Utilization Analytics | `/utilization` | REAL backend |
| 7 | Risk Dashboard | `/risk` | REAL backend |
| 8 | Demand Forecasting | `/forecasting` | SIMULATED mock |
| 9 | Allocation Candidates | `/candidates` | DERIVED mock |
| 10 | Recommendations | `/recommendations` | REAL + DERIVED demo card |
| 11 | Approval / Rejection | `/approvals` | SIMULATED mock |
| 12 | Action Status | `/actions` | SIMULATED mock |
| 13 | Impact | `/impact` | ILLUSTRATIVE ESTIMATE mock |

---

## Components

### Layout
- `Sidebar.tsx` — Fixed 240px navigation with API health indicator
- `TopBar.tsx` — Breadcrumb header

### UI Primitives
- `Badge.tsx` — SeverityBadge, AssetStatusBadge
- `States.tsx` — LoadingState, EmptyState, ErrorState
- `ProvenancePill.tsx` — REAL/DERIVED/SIMULATED/ILLUSTRATIVE ESTIMATE

### Analytics
- `UtilizationBar.tsx` — Color-coded progress bar

---

## API Integration

### Base Client (`src/api/client.ts`)
Fetch-based client, proxied via Vite from `/api` → `http://localhost:8000`.

### Real API Adapters
- `dashboard.ts` → `/dashboard/summary`, `/analytics/fleet`, system scans
- `assets.ts` → `/assets`, `/assets/{id}`, `/assets/{id}/usage`, `/analytics`, `/risk`, `/events`
- `rentals.ts` → `/rentals`, `/rentals/{id}/checkout`, `/rentals/{id}/checkin`
- `alerts.ts` → `/alerts`

### Typed Mocks (pending backend)
- `intelligence.ts` → `getMockForecasts()` (Phase 7), `getMockCandidates()` (Phase 8)
- `pages/ActionStatus.tsx` → `MOCK_ACTIONS` (Phase 9)
- `pages/ImpactPage.tsx` → `ILLUSTRATIVE_IMPACTS` (Phase 9+)

Swapping mocks to real APIs is a 1-line change per adapter.

---

## Tests

**36 / 36 passing** (`npm run test` in `frontend/`)

Coverage:
- ProvenancePill (4 tests)
- Badge variants (3 tests)
- LoadingState, EmptyState, ErrorState (3 tests)
- UtilizationBar (3 tests)
- FleetCommandCenter — loading, KPIs, EQX1007, error (4 tests)
- AssetDashboard — table, DEMO badge, empty, filter (3 tests)
- Asset360 — DEMO ASSET badge, attention banner, tabs (3 tests)
- AlertsPage — table, empty (2 tests)
- DemandForecasting — SIMULATED badge, phase banner (2 tests)
- AllocationCandidates — EQX1007 rank 1, DERIVED badge (2 tests)
- ApprovalFlow — buttons, approve, reject (3 tests)
- ImpactPage — ILLUSTRATIVE badge, disclaimer (2 tests)
- ActionStatus — simulated log (1 test)
- Navigation (1 test)

---

## Remaining Integration Work

| Item | Trigger |
|---|---|
| `getMockForecasts()` → real `/forecasts` | Phase 7 backend complete |
| `getMockCandidates()` → real `/allocation_candidates` | Phase 8 backend complete |
| Approval POST → real `/recommendation_actions` | Phase 9 backend complete |
| Action list → real `/recommendation_actions` | Phase 9 backend complete |
| Impact → real `/impact_records` | Phase 9+ backend complete |

All swap points are commented in `src/api/intelligence.ts`.

---

## Known Limitations

- Phase 7–9 pages use typed mock data (clearly labeled SIMULATED/DERIVED/ILLUSTRATIVE ESTIMATE)
- The underlying challenge dataset has only 7 rows, so analytics charts are sparse
- Approval POST is UI-only (no real `recommendation_actions` endpoint yet)
- Responsive at 1920/1440/1024px — sidebar collapses at 768px (mobile menu not implemented)

---

## Documentation

- `docs/FRONTEND.md` — Full architecture, setup, API integration, provenance, demo flow
