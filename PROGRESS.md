# FleetIQ Development Progress

## Current Status

Phase 1–6 completed.

Current development:
Phase 7 — Demand Forecasting

## Phase Status

| Phase | Status |
|---|---|
| Phase 1 | COMPLETE |
| Phase 2 | COMPLETE |
| Phase 3 | COMPLETE |
| Phase 4 | COMPLETE |
| Phase 5 | COMPLETE |
| Phase 6 | COMPLETE |
| Phase 7 | COMPLETE |
| Phase 8 | COMPLETE |
| Phase 9 | COMPLETE |
| Phase 10 | COMPLETE |
| Phase 11+ | PLANNED |

## Completed Implementation Details

### Phase 1: Requirements Analysis
- Extracted and analyzed the official challenge dataset from the hackathon prompt.
- Defined the system requirements for solving the Caterpillar Smart Rental Tracking Hackathon.
- Established "Execution Control & Permission Gate" as a core project methodology.

### Phase 2: Data Strategy & Provenance
- Designed a data ingestion strategy mapping directly to the challenge dataset fields.
- Established strict provenance rules: No simulated, derived, or estimated metrics can be represented as REAL challenge data. 

### Phase 3: Database Schema Design
- Designed the canonical 23-table PostgreSQL schema across 4 domains (Master Data, Rental, Operational, Intelligence, Governance).
- Ensured strong relational constraints suitable for scaling.

### Phase 4: Backend Foundation & API
- Initialized FastAPI + SQLAlchemy + Alembic environment.
- Generated and migrated the canonical schema to PostgreSQL.
- Implemented `ingest.py` which populated 7 asset usage records from the challenge CSV into the database.
- Created `FRONTEND_CONTRACT.md`.

### Phase 5: Operational Workflows
- Built transactional workflows for Asset Checkout, Asset Check-in, and Operator Assignments.
- Centralized event logging via `events` table (e.g. CHECKOUT, OVERDUE_DETECTED).
- Created deterministic background scan endpoints (`/system/check_overdue`, `/system/check_underutilization`) to generate Alerts.
- Built a dashboard summary endpoint.

### Phase 6: Analytics & Underutilization Engine
- Created a dedicated `backend/app/services/analytics.py`.
- Evaluates utilization efficiently, safely deriving `productive_hours` where not provided directly by data.
- Built a deterministic rule-based underutilization score that explains exactly *why* an asset is flagged (Score, Severity, Reasons).
- Established an Operational Risk score that looks for sensor/use anomalies (e.g., high idle + missing operators).
- Registered analytics scans natively into `model_runs` tracking the `1.0.0` rule-based version.

### Signature EQX1007 Case
- EQX1007 correctly flags dynamically within the system as our primary anomaly due to:
  - 12 Idle Hours, 0 Engine Hours.
  - NULL Site, NULL Operator.
- Produces an Underutilization Severity of HIGH (score: 70) and Operational Risk of CRITICAL (score: 60) without using black-box scoring.

### Phase 7: Demand Forecasting
- Rebuilt WMA forecasting logic directly connected to database data.
- Added `/forecasts/history`, `/forecasts/generate`, and `/forecasts/runs` routes.
- Stored forecasts and run history natively for complete traceability.

### Phase 8: Allocation Intelligence
- Built allocation candidate scoring system using operational models.
- Evaluates cost of transport, asset risk, and utilization independently.
- Connects unfulfilled forecasts with underutilized candidates.

### Phase 9: Recommendations Engine
- Transforms top allocation candidates into structured actionable recommendations.
- Explains the operational impact and provides confidence scores.
- Persists recommendations to Postgres schema safely.

### Phase 10: Decision & Action Workflows
- Built approval & execution workflow (`approve`, `reject`, `execute` API actions).
- Simulated tracking operational improvements via `impact_records`.
- Full end-to-end trace from prediction -> candidate -> recommendation -> execution -> impact.

## Test Status
- Current Test Status: 17 / 17 Tests Passing (using Pytest)
- Tests validate the rental lifecycle, anomaly detection, fleet aggregation, forecasting, and end-to-end recommendation workflows.

## Known Limitations
- The underlying challenge dataset is extremely small (7 rows of snapshot data), so real ML models are not used for analytics in Phase 6. Deterministic rules are used instead to prevent faking AI predictions.
- No frontend exists yet; all endpoints are accessible purely via API.
- Scheduled checks are manually triggered via HTTP POST, rather than automated chronologically.
