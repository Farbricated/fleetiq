from sqlalchemy.orm import Session
from app.models.all import Asset, Alert, Telemetry, UsageDaily, Recommendation, DataSource

def get_asset_context(db: Session, asset_id: str) -> dict:
    context = {}
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        return {"error": "Asset not found"}
        
    provenance = "OFFICIAL" if asset_id.startswith("EQX") else "SIMULATED"
        
    context["asset_info"] = {
        "id": asset.id,
        "status": asset.status,
        "provenance": provenance
    }
    
    # Get latest telemetry
    telem = db.query(Telemetry).filter(Telemetry.asset_id == asset_id).order_by(Telemetry.timestamp.desc()).first()
    if telem:
        context["latest_telemetry"] = {
            "engine_hours": telem.engine_hours,
            "fuel_level": telem.fuel_level,
            "latitude": telem.latitude,
            "longitude": telem.longitude
        }
        
    # Get alerts
    alerts = db.query(Alert).filter(Alert.asset_id == asset_id, Alert.status == "ACTIVE").all()
    if alerts:
        context["active_alerts"] = [{"type": a.type, "severity": a.severity, "reason": a.reason} for a in alerts]
        
    # (Skipping recommendation retrieval as it relies on complex joins through allocation candidates)
        
    return context

def get_fleet_summary_context(db: Session) -> dict:
    total_assets = db.query(Asset).count()
    rented = db.query(Asset).filter(Asset.status == "RENTED").count()
    active_alerts = db.query(Alert).filter(Alert.status == "ACTIVE").count()
    
    top_alerts = db.query(Alert).filter(Alert.status == "ACTIVE").order_by(Alert.created_at.desc()).limit(5).all()
    
    # Import locally to avoid circular imports if needed, or just use the models
    from app.models.all import ImpactRecord
    recent_impacts = db.query(ImpactRecord).order_by(ImpactRecord.id.desc()).limit(5).all()
    
    return {
        "fleet_summary": {
            "total_assets": total_assets,
            "rented_assets": rented,
            "available_assets": total_assets - rented,
            "total_active_alerts": active_alerts
        },
        "top_active_alerts": [
            {"asset_id": a.asset_id, "type": a.type, "severity": a.severity, "reason": a.reason} for a in top_alerts
        ],
        "recent_financial_impacts": [
            {"metric": i.metric, "estimated_value": i.estimated_value, "actual_value": i.actual_value} for i in recent_impacts
        ]
    }
