# Frontend API Contract (Phase 5)

## Base URL
`http://localhost:8000`

## Operational Endpoints

### 1. Dashboard & Health
`GET /health` - Returns `{"status": "ok"}`
`GET /dashboard/summary` - Returns `DashboardSummary`
```json
{
  "total_assets": 7,
  "available_assets": 1,
  "rented_assets": 6,
  "overdue_assets": 0,
  "idle_assets": 2,
  "active_rentals": 6,
  "active_alerts": 1
}
```

### 2. Assets
`GET /assets` - Returns `List[AssetResponse]`
`GET /assets/{asset_id}` - Returns `AssetResponse`
`POST /assets/{asset_id}/operator` - Assigns an operator. Returns `OperatorAssignmentResponse`
`POST /assets/{asset_id}/operator/unassign` - Unassigns the operator.

### 3. Usage & Telemetry & Events
`GET /assets/{asset_id}/usage` - Returns `List[UsageResponse]` (includes `derived_utilization_percent`)
`GET /assets/{asset_id}/telemetry` - Returns `List[TelemetryResponse]`
`GET /assets/{asset_id}/events` - Returns `List[EventResponse]`

### 4. Rentals
`GET /rentals` - Returns `List[RentalResponse]`
`GET /rentals/{rental_id}` - Returns `RentalResponse`
`POST /rentals` - Creates new rental order
`POST /rentals/{rental_id}/checkout` - Adds item to rental (transactional). Request body:
```json
{
  "asset_id": "EQX1001",
  "checkout_date": "2025-04-01",
  "expected_return_date": "2025-04-16"
}
```
`POST /rentals/{rental_id}/checkin` - Checks in active item. Request body:
```json
{
  "checkin_date": "2025-04-16"
}
```

### 5. System Tasks (Cron/Background triggers)
`POST /system/check_overdue` - Scans for overdue rentals and creates alerts.
`POST /system/check_underutilization` - Scans for underutilized assets and creates alerts.

### 6. Intelligence
`GET /alerts` - Returns `List[AlertResponse]`
`GET /alerts/{alert_id}` - Returns `AlertResponse`
`GET /forecasts` - Returns `List[ForecastDetailResponse]` (Phase 7)
`GET /recommendations` - Returns `List[RecommendationResponse]`

### 7. Demand Forecasting (Phase 7)
`GET /forecasts/history` - Returns deterministic, simulated demand history (`List[DemandHistoryResponse]`)
`POST /forecasts/generate` - Triggers forecast generation via WMA and returns run details (`ForecastRunResponse`)
`GET /forecasts` - Returns generated forecasts, optionally filtered by `site_id` or `equipment_type` (`List[ForecastDetailResponse]`)
`GET /forecasts/runs` - Returns model run governance records for forecasts (`List[ModelRunResponse]`)
`GET /forecasts/{forecast_id}` - Returns specific forecast details (`ForecastDetailResponse`)

### 8. Allocation Intelligence (Phase 8)
`POST /forecasts/mock` - Generates mock forecast for testing. Returns `ForecastResponse`
`POST /forecasts/{forecast_id}/candidates` - Generates allocation candidates. Returns `List[AllocationCandidateResponse]`
`GET /forecasts/{forecast_id}/candidates` - Returns `List[AllocationCandidateResponse]`

### 9. Recommendations (Phase 9 & 10)
`GET /recommendations` - Returns `List[RecommendationResponse]`
`POST /candidates/{candidate_id}/recommend` - Creates a recommendation for a candidate. Returns `RecommendationResponse`
`POST /recommendations/{recommendation_id}/approve` - Approves a pending recommendation.
`POST /recommendations/{recommendation_id}/reject` - Rejects a pending recommendation.
`POST /recommendations/{recommendation_id}/execute` - Executes an approved recommendation, creating an ImpactRecord.
