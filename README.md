# FleetIQ

**Caterpillar Smart Rental Tracking Hackathon — Demo Edition**

[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20PostgreSQL-009688)](backend/)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript%20%2B%20Vite-blue)](frontend/)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen)](#)

## Overview

FleetIQ is an intelligent rental tracking and asset analytics platform for the Caterpillar Smart Rental Tracking Hackathon. It converts raw operational telemetry into a **5-beat demo story**: SPOT an idle asset → EXPLAIN why it's a problem → ACT on an AI recommendation → PREDICT future demand → PROVE the impact.

**Signature asset: EQX1007** — 0 engine hours, 12 idle hours/day, no site, no operator.

## The 5-Beat Demo Story

| Beat | What You See | Where |
|---|---|---|
| 01 **SPOT** | EQX1007 highlighted ⚠ IDLE in the dashboard | `/assets` |
| 02 **EXPLAIN** | Asset 360: utilization score, risk reasons, AI natural-language insight | `/assets/EQX1007` |
| 03 **ACT** | Manager approves redeployment — state confirms instantly, no reload | `/approvals` |
| 04 **PREDICT** | WMA demand forecast + What-If simulation (ILLUSTRATIVE ESTIMATE) | `/forecasting` |
| 05 **PROVE** | Before/after impact record tied to the action | `/impact` |

## Architecture

- **Backend:** Python 3.13, FastAPI, SQLAlchemy, Alembic, PostgreSQL 18
- **Frontend:** React 18, TypeScript, Vite, React Router
- **Analytics:** Deterministic rule-based scoring (Explainable, no black-box ML on 7-row dataset)
- **Forecasting:** Weighted Moving Average
- **Provenance:** Strict REAL / DERIVED / ILLUSTRATIVE ESTIMATE labeling throughout

## Current Implementation

FleetIQ is currently implemented through **Phase 6**. 
- The relational database is fully deployed.
- Real challenge data has been ingested successfully.
- Operational endpoints (checkouts, operator assignments) are active.
- Fleet-level analytics and risk engine endpoints are operational.
- For detailed progress see `PROGRESS.md`.

## Setup & Local Development
1. **Environment Initialization:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
2. **Database Migration:**
Ensure you have a local PostgreSQL server running with a database named `fleetiq` (configure in `backend/app/core/config.py`).
```bash
alembic upgrade head
```
3. **Run Application:**
```bash
uvicorn app.main:app --reload
```
4. **Data Ingestion:**
```bash
python app/scripts/ingest.py
```

## Testing
Run the complete test suite to verify operational API contracts and analytics rules:
```bash
cd backend
pytest tests/
```
Current Status: **10/10 Tests Passing**

## Roadmap
- [x] Phases 1–3: Requirements, Data Strategy, Schema Design
- [x] Phases 4-5: Backend Foundation, Operational Workflows
- [x] Phase 6: Analytics & Underutilization Engine
- [ ] Phase 7: Demand Forecasting
- [ ] Phase 8: Final Allocation Candidates Engine
- [ ] Phase 9: Recommendation Engine
- [ ] Phase 10: Frontend Implementation
