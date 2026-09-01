# Demand Forecasting System (Phase 7)

## Overview
The demand forecasting system predicts future equipment needs across different sites based on historical demand patterns. 
To adhere to the requirement that *SIMULATED data must never be presented as real Caterpillar data*, the demand history is deterministically derived from the official challenge dataset patterns, and all forecasts are explicitly labeled as **ILLUSTRATIVE ESTIMATE**.

## Methodology
The forecasting engine uses a deterministic **Weighted Moving Average (WMA)** approach. 
We avoided Deep Learning models to ensure the system is completely explainable, transparent, and reproducible without heavy dependencies.

### Weighted Moving Average (WMA)
- **Lookback Period**: Default 4 weeks of historical demand.
- **Weights**: `[0.1, 0.2, 0.3, 0.4]` (Most recent weeks carry higher weight).
- **Formula**: `Forecast = ceil(sum(weight_i * demand_i) / sum(weight_i))`

This deterministic rule-based approach provides an explainable output (an explicit `evidence` field is generated for every forecast detailing the exact calculation).

## Data Provenance & Confidence
1. **Demand History**: Generated via simulation based on site roles and equipment types. Provenance: `SIMULATED`.
2. **Current Supply**: Extracted deterministically from the `Asset` table derived from challenge data. Provenance: `DERIVED`.
3. **Forecasts**: Provenance: `ILLUSTRATIVE ESTIMATE`. Confidence scores are capped at a maximum of 60% (0.6) to reflect that the underlying demand data is simulated.

## Model Governance
Every execution of the forecasting engine is recorded in the `model_runs` table:
- **model_name**: `demand_forecast_wma`
- **version**: `1.0.0`
- **method**: `weighted_moving_average`
- **provenance**: `ILLUSTRATIVE ESTIMATE`

All generated forecasts (`Forecast` table) are linked to their corresponding `ModelRun` by `model_run_id`, ensuring full traceability.

## API Endpoints
- `GET /api/v1/forecasts/history`: Retrieves deterministic simulated demand history.
- `POST /api/v1/forecasts/generate`: Triggers a WMA forecast generation run.
- `GET /api/v1/forecasts`: Retrieves generated forecasts (optionally filter by site or equipment).
- `GET /api/v1/forecasts/runs`: Retrieves governance records of model runs.
- `GET /api/v1/forecasts/{id}`: Retrieves details and evidence for a specific forecast.
