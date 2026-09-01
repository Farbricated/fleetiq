# FleetIQ Analytics Engine

This document describes the Phase 6 Analytics layer, which converts raw operational data into explainable asset intelligence without relying on opaque ML models.

## 1. Utilization Engine

The utilization engine deterministically calculates an asset's efficiency based on operational telemetry (`usage_daily`).

### Core Formulas

- **Total Hours** = `engine_hours + idle_hours`
- **Utilization Percent** = `(engine_hours / Total Hours) * 100` (if Total Hours > 0, else 0%)
- **Idle Percent** = `(idle_hours / Total Hours) * 100` (if Total Hours > 0, else 0%)
- **Productive Hours (DERIVED)** = `max(engine_hours - idle_hours, 0.0)`
  - *Note: This is a synthetic metric since the challenge dataset does not explicitly split active working hours from total engine hours.*

## 2. Underutilization Rule Engine

Produces an `underutilization_score` and `underutilization_severity`.
**Methodology:** Rule-based heuristics evaluating usage patterns, operator assignment, and site deployment.

### Thresholds & Scoring
The score starts at `0`.
1. `+50`: 0 engine hours, but >0 idle hours (Strong anomaly).
2. `+30`: Utilization Percent < 20% (Low efficiency).
3. `+20`: No operator assigned.
4. `+20`: Total hours (engine + idle) = 0 (Total inactivity).

### Severity Levels
- **HIGH**: Score >= 60
- **MEDIUM**: Score >= 30
- **LOW**: Score < 30

## 3. Operational Risk Engine

The Operational Risk Engine identifies potential hardware malfunctions, data sensor anomalies, or misuse. This is NOT predictive mechanical failure maintenance.

### Thresholds & Scoring
The score starts at `0`.
1. `+40`: 0 engine hours but >0 idle hours (Suggests sensor failure, false reporting, or misuse).
2. `+30`: Missing operator while active usage metrics are reported.
3. `+20`: Idle hours > 10 (Suggests extreme waste).

### Severity Levels
- **CRITICAL**: Score >= 60
- **HIGH**: Score >= 40
- **MEDIUM**: Score >= 20
- **LOW**: Score < 20

## 4. Anomaly Detection Integration

Both the underutilization and risk engines run dynamically upon API invocation and deterministically log anomalies into the `Alerts` table via `/system/check_underutilization` or `/system/check_overdue`.

## 5. EQX1007 Signature Case

EQX1007 natively flags as our primary target for the Hackathon Demo due to its signature challenge data:
- **Observed Data**: 0 Engine Hours, 12 Idle Hours.
- **Derived Metrics**: 0% Utilization, 0 Productive Hours.
- **Rule Engine Score (Underutilization)**: 70 (HIGH Severity).
  - Reason 1: 12.0 idle hours recorded with 0 engine hours (+50)
  - Reason 2: No operator assigned (+20)
- **Rule Engine Score (Risk)**: 60 (CRITICAL Severity).
  - Factor 1: Unusual usage: high idle time with zero engine hours (+40)
  - Factor 2: Unusually high idle time (12.0h) (+20)

## 6. Model Governance & Provenance

To satisfy the Hackathon Data Provenance rules:
- No derived/simulated data is injected back into the raw operational tables.
- Fleet Analytics scans trigger a `ModelRun` record in the database:
  - **Model Name:** `fleet_analytics_engine`
  - **Version:** `1.0.0`
  - **Method:** `rule_based`
  - **Source:** `official challenge dataset`

This establishes a clean abstraction where `1.0.0` is rule-based, and a future `2.0.0` could inject a true ML model output transparently.
