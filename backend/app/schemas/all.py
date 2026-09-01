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

class RecommendationResponse(BaseModel):
    id: UUID
    action_type: Optional[str] = None
    confidence: Optional[float] = None
    status: Optional[str] = None

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
