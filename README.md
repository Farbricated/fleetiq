# FleetIQ

**Fleet Decision Intelligence — Fleet Analytics & Allocation Platform**

[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20PostgreSQL-009688)](backend/)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript%20%2B%20Vite-blue)](frontend/)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen)](#)
[![Tests](https://img.shields.io/badge/Tests-17%2F17-brightgreen)](#)

## Overview

FleetIQ is an intelligent fleet analytics and asset allocation platform. It converts raw operational telemetry into actionable decisions — identifying underutilized assets, scoring risk, generating demand forecasts, and managing the full approval-to-action workflow.

**Architecture:** Python/FastAPI backend · PostgreSQL · React/TypeScript frontend · Rule-based analytics engine

## Key Features

| Module | Description | Route |
|---|---|---|
| **Fleet Command Center** | Real-time KPI dashboard — total assets, idle count, avg utilization, risk score | `/` |
| **Asset Dashboard** | Full asset inventory with status filter and search | `/assets` |
| **Asset 360** | Per-asset deep-dive: utilization %, risk score, NL insight, telemetry | `/assets/:id` |
| **Alerts** | Overdue and underutilization alerts ranked by severity | `/alerts` |
| **Utilization Analytics** | Idle vs active breakdown by asset | `/utilization` |
| **Risk Dashboard** | Risk scores sorted by severity, filterable | `/risk` |
| **Demand Forecasting** | Weighted Moving Average (WMA) demand forecasts by site | `/forecasting` |
| **Allocation Candidates** | Assets eligible for redeployment against a forecast demand | `/candidates` |
| **Recommendations** | AI-generated redeployment recommendations | `/recommendations` |
| **Approvals** | Manager approval / rejection workflow | `/approvals` |
| **Action Status** | Track status of approved actions | `/actions` |
| **Impact** | Business outcome estimates for completed actions | `/impact` |
| **Rental Workflow** | End-to-end rental lifecycle management | `/rentals` |

## Architecture

- **Backend:** Python 3.13, FastAPI, SQLAlchemy, Alembic, PostgreSQL 18
- **Frontend:** React 18, TypeScript, Vite, React Router
- **Analytics:** Deterministic rule-based scoring (Explainable, no black-box ML on 7-row dataset)
- **Forecasting:** Weighted Moving Average
- **Provenance:** Strict REAL / DERIVED / ILLUSTRATIVE ESTIMATE labeling throughout

## Current Implementation

FleetIQ is currently **100% complete** for the Hackathon Demo (through Phase 12). 
- The relational database is fully deployed and populated with challenge data.
- Operational endpoints, fleet-level analytics, demand forecasting, and risk engines are active.
- The React frontend is fully polished, featuring the 5-Beat Demo Story (SPOT → EXPLAIN → ACT → PREDICT → PROVE).
- For detailed progress see `PROGRESS.md`.

## Setup & Local Development (One-Click Start)

We have created a single script to start the PostgreSQL database, the FastAPI backend, and verify connections.

1. **Start Backend & Database (WSL):**
```bash
bash start_demo.sh
```
*This will spin up PostgreSQL in the background, run Uvicorn on port 8000, and print live logs to `/tmp/api_demo.log`.*

2. **Start Frontend (New Terminal):**
```bash
cd frontend
npm install
npm run dev
```

3. **View the Application:**
Open your browser to `http://localhost:3000`

## Testing
Run the complete test suite to verify operational API contracts and analytics rules:
```bash
cd backend
source venv/bin/activate
pytest tests/
```
Current Status: **17/17 Tests Passing**

## Roadmap
- [x] Phases 1–3: Requirements, Data Strategy, Schema Design
- [x] Phases 4-5: Backend Foundation, Operational Workflows
- [x] Phase 6: Analytics & Underutilization Engine
- [x] Phase 7: Demand Forecasting
- [x] Phase 8: Final Allocation Candidates Engine
- [x] Phase 9: Recommendation Engine
- [x] Phase 10: Decision & Action Workflows
- [x] Phase 11: Frontend Implementation
- [x] Phase 12: 5-Beat Demo Story Integration & UI Polish
