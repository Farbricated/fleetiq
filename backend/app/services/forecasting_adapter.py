from sqlalchemy.orm import Session
from datetime import date
from uuid import UUID
from app.models.all import Forecast, ModelRun, Site, EquipmentType

def ensure_simulated_forecast(db: Session, site_id: str = "S003", equipment_category_name: str = "Excavators", quantity: int = 1) -> Forecast:
    """
    Temporary adapter for Phase 7 (Demand Forecasting).
    This simulates Member 1's output.
    """
    # 1. Ensure site exists
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        site = Site(id=site_id, name=f"Simulated Site {site_id}")
        db.add(site)
        db.commit()

    # 2. Get equipment type (we need an equipment type ID that matches the category)
    # The challenge data uses "Excavators" for EQX1007.
    eq_type = db.query(EquipmentType).filter(EquipmentType.name.ilike(f"%{equipment_category_name}%")).first()
    if not eq_type:
        # Fallback to any equipment type if exact match fails
        eq_type = db.query(EquipmentType).first()

    # 3. Check for existing forecast to avoid duplicates
    existing = db.query(Forecast).filter(
        Forecast.site_id == site_id,
        Forecast.equipment_type_id == eq_type.id if eq_type else None,
        Forecast.forecast_date == date.today()
    ).first()

    if existing:
        return existing

    # 4. Create Simulated Model Run
    model_run = ModelRun(
        model_name="simulated_demand_forecast",
        version="0.1.0-mock",
        metrics={"source": "SIMULATED ADAPTER", "note": "Temporary for Phase 8-10 integration"}
    )
    db.add(model_run)
    db.commit()
    db.refresh(model_run)

    # 5. Create Forecast
    forecast = Forecast(
        site_id=site_id,
        equipment_type_id=eq_type.id if eq_type else None,
        forecast_date=date.today(),
        predicted_quantity=quantity,
        model_run_id=model_run.id
    )
    db.add(forecast)
    db.commit()
    db.refresh(forecast)
    
    return forecast

def get_forecast(db: Session, forecast_id: UUID) -> Forecast:
    return db.query(Forecast).filter(Forecast.id == forecast_id).first()
