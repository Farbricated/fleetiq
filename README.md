# FleetIQ

**Caterpillar Smart Rental Tracking Hackathon Project**

## Overview
FleetIQ is an intelligent rental tracking and asset analytics platform designed for the Caterpillar Smart Rental Tracking Hackathon. It converts raw operational telemetry data into explainable business intelligence to identify underutilized assets, detect operational anomalies, and predict demand to optimize fleet allocation.

## The Problem
Fleet operators often lose significant revenue due to assets sitting idle, being rented but underutilized, or being assigned improperly. Raw telemetry (engine hours, idle hours, location) exists, but without an intelligence layer, managers cannot proactively answer: *Which asset should we allocate next? Which asset is wasting money right now?*

## Our Solution
FleetIQ provides:
1. **Operational Workflows:** Robust asset lifecycle management, rental checkout/check-in tracking, and operator assignment.
2. **Explainable Analytics:** Deterministic utilization scoring that avoids black-box AI by providing human-readable reasons (e.g. "12 idle hours with 0 engine hours").
3. **Data Provenance Governance:** A strict separation between observed truth and synthetic derivations.
4. **Demand Forecasting & Allocation (Upcoming):** Predictive matching of underutilized assets to future demand.

## Key Differentiation
- **Explainable Analytics:** We don't just produce a score. We produce the reasoning.
- **Strict Data Provenance:** We distinguish cleanly between the official challenge dataset, derived calculations, and future simulated telemetry. No fake ML predictions on tiny datasets.
- **Scalable Architecture:** A fully normalized 23-table PostgreSQL database designed for an enterprise environment, not just a weekend hackathon.

## Architecture & Tech Stack
- **Backend:** Python, FastAPI
- **Database:** PostgreSQL (via SQLAlchemy ORM and Alembic migrations)
- **Testing:** Pytest
- **Frontend:** (Planned)
- **Intelligence:** Deterministic Rule Engines (Phase 1-6), Machine Learning (Phase 7+)

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
