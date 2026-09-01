from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import uuid
from datetime import date, datetime

from app.core.database import get_db
from app.models.all import (
    Asset, Site, Operator, RentalOrder, RentalItem, Telemetry, UsageDaily, Event, Alert, 
    Forecast, Recommendation, AssetOperatorAssignment, ModelRun
)
from app.schemas.all import *
from app.services.analytics import analyze_asset_utilization, analyze_asset_risk, register_model_run
from app.services.forecasting import generate_forecasts, get_demand_history_for_api

router = APIRouter()

def log_event(db: Session, asset_id: str, event_type: str):
    evt = Event(asset_id=asset_id, event_type=event_type, timestamp=datetime.utcnow())
    db.add(evt)

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_assets = db.query(Asset).count()
    available_assets = db.query(Asset).filter(Asset.status == "AVAILABLE").count()
    rented_assets = db.query(Asset).filter(Asset.status == "RENTED").count()
    
    today = date.today()
    overdue_assets = db.query(RentalItem).filter(
        RentalItem.status == "ACTIVE", 
        RentalItem.checkin_date < today
    ).count()
    
    # We define idle assets from daily usage (idle > 5 and engine == 0 for demo purposes)
    idle_assets = db.query(UsageDaily).filter(
        UsageDaily.engine_hours == 0, UsageDaily.idle_hours > 5
    ).count()
    
    active_rentals = db.query(RentalItem).filter(RentalItem.status == "ACTIVE").count()
    active_alerts = db.query(Alert).filter(Alert.status == "ACTIVE").count()
    
    return DashboardSummary(
        total_assets=total_assets,
        available_assets=available_assets,
        rented_assets=rented_assets,
        overdue_assets=overdue_assets,
        idle_assets=idle_assets,
        active_rentals=active_rentals,
        active_alerts=active_alerts
    )

@router.get("/assets", response_model=List[AssetResponse])
def get_assets(db: Session = Depends(get_db)):
    return db.query(Asset).all()

@router.get("/assets/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset: raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.get("/sites", response_model=List[SiteResponse])
def get_sites(db: Session = Depends(get_db)):
    return db.query(Site).all()

@router.get("/sites/{site_id}", response_model=SiteResponse)
def get_site(site_id: str, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site: raise HTTPException(status_code=404, detail="Site not found")
    return site

@router.get("/operators", response_model=List[OperatorResponse])
def get_operators(db: Session = Depends(get_db)):
    return db.query(Operator).all()

@router.get("/operators/{operator_id}", response_model=OperatorResponse)
def get_operator(operator_id: str, db: Session = Depends(get_db)):
    op = db.query(Operator).filter(Operator.id == operator_id).first()
    if not op: raise HTTPException(status_code=404, detail="Operator not found")
    return op

@router.get("/rentals", response_model=List[RentalResponse])
def get_rentals(db: Session = Depends(get_db)):
    return db.query(RentalOrder).all()

@router.get("/rentals/{rental_id}", response_model=RentalResponse)
def get_rental(rental_id: uuid.UUID, db: Session = Depends(get_db)):
    rental = db.query(RentalOrder).filter(RentalOrder.id == rental_id).first()
    if not rental: raise HTTPException(status_code=404, detail="Rental not found")
    return rental

@router.post("/rentals", response_model=RentalResponse)
def create_rental(db: Session = Depends(get_db)):
    rental = RentalOrder(status="NEW")
    db.add(rental)
    db.commit()
    db.refresh(rental)
    return rental

@router.post("/rentals/{rental_id}/checkout")
def checkout_rental(rental_id: uuid.UUID, req: RentalCheckoutRequest, db: Session = Depends(get_db)):
    # Validate rental
    rental = db.query(RentalOrder).filter(RentalOrder.id == rental_id).first()
    if not rental: raise HTTPException(status_code=404, detail="Rental not found")
    
    # Validate asset
    asset = db.query(Asset).filter(Asset.id == req.asset_id).first()
    if not asset: raise HTTPException(status_code=404, detail="Asset not found")
    
    # Duplicate checkout prevention
    existing = db.query(RentalItem).filter(RentalItem.asset_id == req.asset_id, RentalItem.status == "ACTIVE").first()
    if existing: raise HTTPException(status_code=400, detail="Asset is already actively rented")
    
    item = RentalItem(
        rental_order_id=rental_id,
        asset_id=req.asset_id,
        checkout_date=req.checkout_date,
        checkin_date=req.expected_return_date,
        status="ACTIVE"
    )
    db.add(item)
    
    # Update asset state
    asset.status = "RENTED"
    
    # Log event
    log_event(db, asset.id, "CHECKOUT")
    
    db.commit()
    return {"status": "ok", "rental_item_id": item.id}

@router.post("/rentals/{rental_id}/checkin")
def checkin_rental(rental_id: uuid.UUID, req: RentalCheckinRequest, db: Session = Depends(get_db)):
    item = db.query(RentalItem).filter(RentalItem.rental_order_id == rental_id, RentalItem.status == "ACTIVE").first()
    if not item: raise HTTPException(status_code=404, detail="Active rental item not found")
    
    item.checkin_date = req.checkin_date # Actual return date
    item.status = "COMPLETED"
    
    asset = db.query(Asset).filter(Asset.id == item.asset_id).first()
    if asset:
        asset.status = "AVAILABLE"
        log_event(db, asset.id, "CHECKIN")
        
    db.commit()
    return {"status": "ok"}

@router.post("/assets/{asset_id}/operator", response_model=OperatorAssignmentResponse)
def assign_operator(asset_id: str, req: OperatorAssignRequest, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset: raise HTTPException(status_code=404, detail="Asset not found")
    
    op = db.query(Operator).filter(Operator.id == req.operator_id).first()
    if not op: raise HTTPException(status_code=404, detail="Operator not found")
    
    assignment = AssetOperatorAssignment(
        asset_id=asset_id,
        operator_id=req.operator_id,
        start_date=date.today()
    )
    db.add(assignment)
    log_event(db, asset_id, "OPERATOR_ASSIGNED")
    db.commit()
    db.refresh(assignment)
    return assignment

@router.post("/assets/{asset_id}/operator/unassign")
def unassign_operator(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset: raise HTTPException(status_code=404, detail="Asset not found")
    
    log_event(db, asset_id, "OPERATOR_UNASSIGNED")
    db.commit()
    return {"status": "ok"}

@router.get("/assets/{asset_id}/telemetry", response_model=List[TelemetryResponse])
def get_telemetry(asset_id: str, db: Session = Depends(get_db)):
    return db.query(Telemetry).filter(Telemetry.asset_id == asset_id).all()

@router.get("/assets/{asset_id}/usage")
def get_usage(asset_id: str, db: Session = Depends(get_db)):
    usages = db.query(UsageDaily).filter(UsageDaily.asset_id == asset_id).all()
    results = []
    for u in usages:
        total = (u.engine_hours or 0) + (u.idle_hours or 0)
        utilization = (u.engine_hours / total * 100) if total > 0 else 0.0
        
        results.append({
            "id": str(u.id),
            "asset_id": u.asset_id,
            "date": u.date,
            "engine_hours": u.engine_hours,
            "idle_hours": u.idle_hours,
            "operating_days": u.operating_days,
            "derived_utilization_percent": round(utilization, 2)
        })
    return results

@router.get("/assets/{asset_id}/events", response_model=List[EventResponse])
def get_events(asset_id: str, db: Session = Depends(get_db)):
    return db.query(Event).filter(Event.asset_id == asset_id).order_by(Event.timestamp.desc()).all()

@router.post("/system/check_overdue")
def check_overdue(db: Session = Depends(get_db)):
    today = date.today()
    overdue_rentals = db.query(RentalItem).filter(
        RentalItem.status == "ACTIVE",
        RentalItem.checkin_date < today
    ).all()
    
    alerts_created = 0
    for r in overdue_rentals:
        existing_alert = db.query(Alert).filter(
            Alert.asset_id == r.asset_id,
            Alert.type == "OVERDUE_RENTAL",
            Alert.status == "ACTIVE"
        ).first()
        
        if not existing_alert:
            alert = Alert(
                asset_id=r.asset_id,
                type="OVERDUE_RENTAL",
                severity="HIGH",
                status="ACTIVE",
                reason=f"Rental overdue. Expected return was {r.checkin_date}."
            )
            db.add(alert)
            log_event(db, r.asset_id, "OVERDUE_DETECTED")
            alerts_created += 1
            
    db.commit()
    return {"status": "ok", "alerts_created": alerts_created}

@router.post("/system/check_underutilization")
def check_underutilization(db: Session = Depends(get_db)):
    # Deterministic rule for underutilization (e.g. EQX1007)
    usages = db.query(UsageDaily).filter(UsageDaily.engine_hours == 0, UsageDaily.idle_hours > 10).all()
    
    alerts_created = 0
    for u in usages:
        existing_alert = db.query(Alert).filter(
            Alert.asset_id == u.asset_id,
            Alert.type == "UNDERUTILIZATION",
            Alert.status == "ACTIVE"
        ).first()
        
        if not existing_alert:
            alert = Alert(
                asset_id=u.asset_id,
                type="UNDERUTILIZATION",
                severity="HIGH",
                status="ACTIVE",
                reason=f"Asset has 0 engine hours but {u.idle_hours} idle hours today."
            )
            db.add(alert)
            log_event(db, u.asset_id, "UNDERUTILIZATION_DETECTED")
            alerts_created += 1
            
    db.commit()
    return {"status": "ok", "alerts_created": alerts_created}

@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).all()

@router.get("/alerts/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: uuid.UUID, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert: raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.get("/forecasts", response_model=List[ForecastResponse])
def get_forecasts(db: Session = Depends(get_db)):
    return db.query(Forecast).all()

@router.get("/sites/{site_id}/forecasts", response_model=List[ForecastResponse])
def get_site_forecasts(site_id: str, db: Session = Depends(get_db)):
    return db.query(Forecast).filter(Forecast.site_id == site_id).all()

@router.get("/recommendations", response_model=List[RecommendationResponse])
def get_recommendations(db: Session = Depends(get_db)):
    return db.query(Recommendation).all()

@router.get("/recommendations/{recommendation_id}", response_model=RecommendationResponse)
def get_recommendation(recommendation_id: uuid.UUID, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not rec: raise HTTPException(status_code=404, detail="Recommendation not found")
    return rec

@router.get("/assets/{asset_id}/analytics", response_model=AnalyticsResult)
def get_asset_analytics(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset: raise HTTPException(status_code=404, detail="Asset not found")
    return analyze_asset_utilization(db, asset_id)

@router.get("/assets/{asset_id}/risk", response_model=RiskResult)
def get_asset_risk(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset: raise HTTPException(status_code=404, detail="Asset not found")
    return analyze_asset_risk(db, asset_id)

@router.get("/analytics/fleet", response_model=FleetAnalyticsSummary)
def get_fleet_analytics(db: Session = Depends(get_db)):
    total_assets = db.query(Asset).count()
    usages = db.query(UsageDaily).all()
    
    total_engine_hours = sum(u.engine_hours or 0.0 for u in usages)
    total_idle_hours = sum(u.idle_hours or 0.0 for u in usages)
    total_hours = total_engine_hours + total_idle_hours
    average_utilization = (total_engine_hours / total_hours * 100) if total_hours > 0 else 0.0
    
    idle_assets = 0
    underutilized_assets = 0
    high_risk_assets = 0
    
    for a in db.query(Asset).all():
        u_res = analyze_asset_utilization(db, a.id)
        if u_res.underutilization_severity in ["HIGH", "CRITICAL"]:
            underutilized_assets += 1
            
        r_res = analyze_asset_risk(db, a.id)
        if r_res.risk_level in ["HIGH", "CRITICAL"]:
            high_risk_assets += 1
            
    # For demo, idle_assets is the same as underutilized
    idle_assets = underutilized_assets
    
    anomaly_count = db.query(Alert).filter(Alert.type == "OPERATIONAL_ANOMALY").count()
    overdue_assets = db.query(RentalItem).filter(RentalItem.status == "ACTIVE", RentalItem.checkin_date < date.today()).count()
    
    register_model_run(db, "fleet_analytics_engine", "rule_based")
    
    return FleetAnalyticsSummary(
        total_assets=total_assets,
        average_utilization=average_utilization,
        idle_assets=idle_assets,
        underutilized_assets=underutilized_assets,
        high_risk_assets=high_risk_assets,
        anomaly_count=anomaly_count,
        overdue_assets=overdue_assets
    )

# --- Phase 7: Demand Forecasting Endpoints ---

@router.get("/forecasts/history", response_model=List[DemandHistoryResponse], tags=["Forecasting"])
def get_demand_history(
    site_id: Optional[str] = None,
    equipment_type: Optional[str] = None,
    reference_date: Optional[date] = None,
):
    """
    Get deterministic, simulated demand history.
    """
    history = get_demand_history_for_api(
        reference_date=reference_date,
        site_id=site_id,
        equipment_type=equipment_type
    )
    return history


@router.post("/forecasts/generate", response_model=ForecastRunResponse, tags=["Forecasting"])
def trigger_forecast_generation(
    horizon_weeks: int = 4,
    lookback_weeks: int = 4,
    reference_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Trigger a Weighted Moving Average forecast run.
    """
    result = generate_forecasts(
        db=db,
        reference_date=reference_date,
        horizon_weeks=horizon_weeks,
        lookback_weeks=lookback_weeks
    )
    return result


@router.get("/forecasts", response_model=List[ForecastDetailResponse], tags=["Forecasting"])
def list_forecasts(
    site_id: Optional[str] = None,
    equipment_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all generated forecasts, optionally filtered.
    """
    query = db.query(Forecast)
    if site_id:
        query = query.filter(Forecast.site_id == site_id)
    if equipment_type:
        query = query.filter(Forecast.equipment_type_name == equipment_type)
    
    return query.order_by(Forecast.forecast_date.desc()).all()


@router.get("/forecasts/runs", response_model=List[ModelRunResponse], tags=["Forecasting"])
def list_model_runs(db: Session = Depends(get_db)):
    """
    Get all model runs for governance.
    """
    runs = db.query(ModelRun).order_by(ModelRun.created_at.desc()).all()
    return runs


@router.get("/forecasts/{forecast_id}", response_model=ForecastDetailResponse, tags=["Forecasting"])
def get_forecast(forecast_id: str, db: Session = Depends(get_db)):
    """
    Get details of a specific forecast.
    """
    forecast = db.query(Forecast).filter(Forecast.id == forecast_id).first()
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    return forecast
