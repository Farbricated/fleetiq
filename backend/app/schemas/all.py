from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from uuid import UUID

class AssetBase(BaseModel):
    id: str
    status: Optional[str] = None

class AssetResponse(AssetBase):
    model_id: Optional[UUID] = None
    dealer_id: Optional[UUID] = None
    
    class Config:
        from_attributes = True

class SiteResponse(BaseModel):
    id: str
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True

class OperatorResponse(BaseModel):
    id: str
    name: Optional[str] = None
    status: Optional[str] = None

    class Config:
        from_attributes = True

class RentalResponse(BaseModel):
    id: UUID
    customer_id: Optional[UUID] = None
    site_id: Optional[str] = None
    status: Optional[str] = None

    class Config:
        from_attributes = True

class RentalCheckoutRequest(BaseModel):
    asset_id: str
    checkout_date: date
    expected_return_date: Optional[date] = None

class RentalCheckinRequest(BaseModel):
    checkin_date: date

class TelemetryResponse(BaseModel):
    id: UUID
    asset_id: str
    timestamp: datetime
    engine_on: Optional[bool] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

    class Config:
        from_attributes = True

class UsageResponse(BaseModel):
    id: UUID
    asset_id: str
    date: date
    engine_hours: Optional[float] = None
    idle_hours: Optional[float] = None
    operating_days: Optional[int] = None

    class Config:
        from_attributes = True

class EventResponse(BaseModel):
    id: UUID
    asset_id: str
    event_type: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class AlertResponse(BaseModel):
    id: UUID
    asset_id: str
    type: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ForecastResponse(BaseModel):
    id: UUID
    site_id: str
    forecast_date: date
    predicted_quantity: Optional[int] = None

    class Config:
        from_attributes = True



class DashboardSummary(BaseModel):
    total_assets: int
    available_assets: int
    rented_assets: int
    overdue_assets: int
    idle_assets: int
    active_rentals: int
    active_alerts: int

class OperatorAssignRequest(BaseModel):
    operator_id: str

class OperatorAssignmentResponse(BaseModel):
    id: UUID
    asset_id: str
    operator_id: Optional[str] = None
    start_date: date

    class Config:
        from_attributes = True

class AnalyticsResult(BaseModel):
    asset_id: str
    utilization_percent: float
    idle_percent: float
    productive_hours_derived: float
    underutilization_score: str
    underutilization_severity: str
    reasons: List[str]
    model_version: str = "1.0.0"
    method: str = "rule_based"
    timestamp: datetime

class RiskResult(BaseModel):
    asset_id: str
    risk_score: str
    risk_level: str
    risk_factors: List[str]
    explanation: str
    model_version: str = "1.0.0"
    method: str = "rule_based"
    timestamp: datetime

class FleetAnalyticsSummary(BaseModel):
    total_assets: int
    average_utilization: float
    idle_assets: int
    underutilized_assets: int
    high_risk_assets: int
    anomaly_count: int
    overdue_assets: int

# --- Phase 7: Demand Forecasting Schemas ---

class ForecastDetailResponse(BaseModel):
    id: UUID
    site_id: str
    equipment_type_name: Optional[str] = None
    forecast_date: date
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    predicted_quantity: Optional[int] = None
    available_supply: Optional[int] = None
    demand_gap: Optional[int] = None
    confidence: Optional[float] = None
    evidence: Optional[str] = None
    provenance: Optional[str] = None
    method: Optional[str] = None
    model_run_id: Optional[UUID] = None

    class Config:
        from_attributes = True

class ForecastRunResponse(BaseModel):
    model_run_id: UUID
    status: str
    forecasts_generated: int
    method: str
    provenance: str
    horizon_days: int
    message: str

class ModelRunResponse(BaseModel):
    id: UUID
    model_name: str
    version: str
    method: Optional[str] = None
    source: Optional[str] = None
    parameters: Optional[dict] = None
    horizon_days: Optional[int] = None
    provenance: Optional[str] = None
    status: Optional[str] = None
    metrics: Optional[dict] = None
    created_at: datetime

# --- Phase 8, 9, 10 Models ---

class AllocationCandidateResponse(BaseModel):
    id: UUID
    forecast_id: UUID
    asset_id: str
    score: float
    reasoning: dict
    target_site_id: str
    asset_equipment_type_id: Optional[UUID] = None

    class Config:
        from_attributes = True

class RecommendationResponse(BaseModel):
    id: UUID
    selected_candidate_id: UUID
    action_type: Optional[str] = None
    confidence: Optional[float] = None
    status: Optional[str] = None
    
    # Relationships for convenience
    candidate: Optional[AllocationCandidateResponse] = None

    class Config:
        from_attributes = True

class DemandHistoryResponse(BaseModel):
    site_id: str
    equipment_type: str
    period_start: date
    period_end: date
    demand_count: int
    provenance: str

class RecommendationActionRequest(BaseModel):
    user_id: UUID
    notes: Optional[str] = None

class RecommendationActionResponse(BaseModel):
    id: UUID
    recommendation_id: UUID
    user_id: UUID
    action: str
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    notes: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class ImpactRecordResponse(BaseModel):
    id: UUID
    action_id: UUID
    metric: str
    estimated_value: float
    actual_value: Optional[float] = None
    is_illustrative: bool = True

    class Config:
        from_attributes = True

class AssetSummaryResponse(BaseModel):
    asset_id: str
    summary_text: str
