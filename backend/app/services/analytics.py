from sqlalchemy.orm import Session
from datetime import datetime, date
from app.models.all import Asset, UsageDaily, AssetOperatorAssignment, RentalItem, Site, ModelRun
from app.schemas.all import AnalyticsResult, RiskResult

def analyze_asset_utilization(db: Session, asset_id: str) -> AnalyticsResult:
    # 1. Gather evidence
    usages = db.query(UsageDaily).filter(UsageDaily.asset_id == asset_id).all()
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    operator_assignment = db.query(AssetOperatorAssignment).filter(AssetOperatorAssignment.asset_id == asset_id).first()
    
    total_engine_hours = sum(u.engine_hours or 0.0 for u in usages)
    total_idle_hours = sum(u.idle_hours or 0.0 for u in usages)
    
    # Derivations
    total_hours = total_engine_hours + total_idle_hours
    if total_hours > 0:
        utilization_percent = (total_engine_hours / total_hours) * 100
        idle_percent = (total_idle_hours / total_hours) * 100
    else:
        utilization_percent = 0.0
        idle_percent = 0.0
        
    productive_hours_derived = max(total_engine_hours - total_idle_hours, 0.0)
    
    # 2. Rule-Based Underutilization Engine
    reasons = []
    score = 0
    
    if total_engine_hours == 0 and total_idle_hours > 0:
        reasons.append(f"{total_idle_hours} idle hours recorded with 0 engine hours.")
        score += 50
    elif utilization_percent < 20 and total_hours > 0:
        reasons.append(f"Very low utilization: {round(utilization_percent, 1)}%.")
        score += 30
        
    if not operator_assignment:
        reasons.append("No operator assigned.")
        score += 20
        
    if total_engine_hours == 0 and total_idle_hours == 0:
        reasons.append("No productive activity detected.")
        score += 20
        
    # Determine severity
    if score >= 60:
        severity = "HIGH"
    elif score >= 30:
        severity = "MEDIUM"
    else:
        severity = "LOW"
        
    if score == 0:
        reasons.append("Asset is being adequately utilized.")
        
    return AnalyticsResult(
        asset_id=asset_id,
        utilization_percent=utilization_percent,
        idle_percent=idle_percent,
        productive_hours_derived=productive_hours_derived,
        underutilization_score=str(score),
        underutilization_severity=severity,
        reasons=reasons,
        timestamp=datetime.utcnow()
    )

def analyze_asset_risk(db: Session, asset_id: str) -> RiskResult:
    # Gather evidence
    usages = db.query(UsageDaily).filter(UsageDaily.asset_id == asset_id).all()
    operator_assignment = db.query(AssetOperatorAssignment).filter(AssetOperatorAssignment.asset_id == asset_id).first()
    
    total_engine_hours = sum(u.engine_hours or 0.0 for u in usages)
    total_idle_hours = sum(u.idle_hours or 0.0 for u in usages)
    
    risk_score = 0
    factors = []
    
    if total_engine_hours == 0 and total_idle_hours > 0:
        risk_score += 40
        factors.append("Unusual usage: high idle time with zero engine hours (Possible sensor failure or misuse).")
        
    if not operator_assignment and (total_engine_hours > 0 or total_idle_hours > 0):
        risk_score += 30
        factors.append("Missing operator while asset shows active usage metrics.")
        
    if total_idle_hours > 10:
        risk_score += 20
        factors.append(f"Unusually high idle time ({total_idle_hours}h).")
        
    if risk_score >= 60:
        risk_level = "CRITICAL"
    elif risk_score >= 40:
        risk_level = "HIGH"
    elif risk_score >= 20:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
        
    if risk_score == 0:
        factors.append("No immediate operational risks detected.")
        explanation = "Asset is operating within expected parameters."
    else:
        explanation = "Detected statistical/rule-based anomalies suggesting operational or data-quality concerns."
        
    return RiskResult(
        asset_id=asset_id,
        risk_score=str(risk_score),
        risk_level=risk_level,
        risk_factors=factors,
        explanation=explanation,
        timestamp=datetime.utcnow()
    )

def register_model_run(db: Session, model_name: str, method: str):
    run = ModelRun(
        model_name=model_name,
        version="1.0.0",
        metrics={"method": method, "source": "official challenge dataset"}
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run
