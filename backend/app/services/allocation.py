from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from typing import List
from app.models.all import AllocationCandidate, Forecast, Asset, EquipmentModel, AssetOperatorAssignment
from app.services.analytics import analyze_asset_utilization, analyze_asset_risk
import app.core.scoring_config as config

def generate_allocation_candidates(db: Session, forecast_id: UUID) -> List[AllocationCandidate]:
    forecast = db.query(Forecast).filter(Forecast.id == forecast_id).first()
    if not forecast:
        return []

    # Find matching assets based on equipment type
    # Assets must be AVAILABLE and not already allocated somewhere else
    query = db.query(Asset)
    
    if forecast.equipment_type_id:
        query = query.outerjoin(EquipmentModel, Asset.model_id == EquipmentModel.id)
        query = query.filter(EquipmentModel.type_id == forecast.equipment_type_id)

    assets = query.all()
    candidates = []

    for asset in assets:
        # 1. Eligibility Check
        if asset.status != config.STATUS_AVAILABLE:
            continue
            
        risk_result = analyze_asset_risk(db, asset.id)
        # 2. Score Calculation
        score = 0.0
        reasons = []

        # Demand Fit
        if forecast.equipment_type_id:
            score += config.SCORE_DEMAND_FIT
            reasons.append(f"Strong demand fit: Asset matches required forecast equipment type.")

        # Availability
        if asset.status == config.STATUS_AVAILABLE:
            score += config.SCORE_AVAILABLE
            reasons.append("Asset is currently available and not tied to active rental.")
        
        # Underutilization Opportunity
        utilization_result = analyze_asset_utilization(db, asset.id)
        u_score_val = float(utilization_result.underutilization_score)
        if u_score_val > 0:
            opportunity = u_score_val * config.UNDERUTILIZATION_MULTIPLIER
            score += opportunity
            reasons.append(f"Underutilization opportunity (+{opportunity}): " + " ".join(utilization_result.reasons))
        
        # Risk Penalty
        r_score_val = float(risk_result.risk_score)
        if r_score_val > 0:
            penalty = r_score_val * config.RISK_PENALTY_MULTIPLIER
            score -= penalty
            reasons.append(f"Operational risk penalty (-{penalty}): " + " ".join(risk_result.risk_factors))

        # Operator Readiness
        active_assignment = db.query(AssetOperatorAssignment).filter(
            AssetOperatorAssignment.asset_id == asset.id
        ).order_by(AssetOperatorAssignment.start_date.desc()).first()
        
        if active_assignment and active_assignment.operator_id:
            score += config.SCORE_OPERATOR_READY
            reasons.append("Asset already has an assigned operator, reducing deployment friction.")
        else:
            reasons.append("Note: No operator currently assigned.")

        # 3. Duplicate Prevention & Insertion
        candidate = db.query(AllocationCandidate).filter(
            AllocationCandidate.forecast_id == forecast_id,
            AllocationCandidate.asset_id == asset.id
        ).first()

        reasoning_doc = {
            "reasons": reasons,
            "target_site_id": forecast.site_id,
            "asset_equipment_type_id": str(forecast.equipment_type_id) if forecast.equipment_type_id else None
        }

        if candidate:
            candidate.score = score
            candidate.reasoning = reasoning_doc
        else:
            candidate = AllocationCandidate(
                forecast_id=forecast_id,
                asset_id=asset.id,
                score=score,
                reasoning=reasoning_doc
            )
            db.add(candidate)
            
        candidates.append(candidate)

    db.commit()
    for c in candidates:
        db.refresh(c)
        
    # Rank candidates by score descending
    candidates.sort(key=lambda x: x.score, reverse=True)
    return candidates

def get_candidates_for_forecast(db: Session, forecast_id: UUID) -> List[AllocationCandidate]:
    candidates = db.query(AllocationCandidate).filter(AllocationCandidate.forecast_id == forecast_id).order_by(AllocationCandidate.score.desc()).all()
    return candidates
