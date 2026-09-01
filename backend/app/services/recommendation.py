from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, date
from app.models.all import (
    Recommendation, AllocationCandidate, RecommendationAction, ImpactRecord, 
    Asset, Event, RentalOrder, RentalItem
)
import app.core.scoring_config as config

def create_recommendation(db: Session, candidate_id: UUID) -> Recommendation:
    candidate = db.query(AllocationCandidate).filter(AllocationCandidate.id == candidate_id).first()
    if not candidate:
        raise ValueError("Candidate not found")
        
    existing = db.query(Recommendation).filter(
        Recommendation.selected_candidate_id == candidate_id,
        Recommendation.status.in_([config.REC_STATUS_PENDING, config.REC_STATUS_APPROVED])
    ).first()
    
    if existing:
        return existing
        
    rec = Recommendation(
        selected_candidate_id=candidate_id,
        action_type="REALLOCATE",
        confidence=0.9, # Derived from data quality in a full ML model
        status=config.REC_STATUS_PENDING
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

def process_action(db: Session, recommendation_id: UUID, user_id: UUID, action: str, notes: str = None) -> Recommendation:
    rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not rec:
        raise ValueError("Recommendation not found")

    prev_status = rec.status
    new_status = prev_status

    if action == config.ACTION_APPROVE:
        if prev_status != config.REC_STATUS_PENDING:
            raise ValueError(f"Invalid transition from {prev_status} to APPROVED")
        new_status = config.REC_STATUS_APPROVED
        
    elif action == config.ACTION_REJECT:
        if prev_status != config.REC_STATUS_PENDING:
            raise ValueError(f"Invalid transition from {prev_status} to REJECTED")
        new_status = config.REC_STATUS_REJECTED
        
    elif action == config.ACTION_EXECUTE:
        if prev_status != config.REC_STATUS_APPROVED:
            raise ValueError(f"Invalid transition from {prev_status} to EXECUTED")
        new_status = config.REC_STATUS_EXECUTED
    else:
        raise ValueError("Invalid action")

    rec.status = new_status

    # Record Audit Action
    rec_action = RecommendationAction(
        recommendation_id=rec.id,
        user_id=user_id,
        action=action,
        previous_status=prev_status,
        new_status=new_status,
        notes=notes,
        timestamp=datetime.utcnow()
    )
    db.add(rec_action)
    db.commit()
    db.refresh(rec_action)
    
    # If execute, do domain operations transactionally
    if action == config.ACTION_EXECUTE:
        try:
            candidate = db.query(AllocationCandidate).filter(AllocationCandidate.id == rec.selected_candidate_id).first()
            asset = db.query(Asset).filter(Asset.id == candidate.asset_id).with_for_update().first()
            
            if asset.status != config.STATUS_AVAILABLE:
                raise ValueError("Asset is no longer available for execution")
                
            asset.status = config.STATUS_RENTED
            
            target_site_id = candidate.reasoning.get("target_site_id")
            
            # Create a RentalOrder for the allocation
            rental = RentalOrder(
                site_id=target_site_id,
                status="ACTIVE"
            )
            db.add(rental)
            db.flush()
            
            rental_item = RentalItem(
                rental_order_id=rental.id,
                asset_id=asset.id,
                checkout_date=date.today(),
                status="CHECKED_OUT",
                daily_rate=0.0
            )
            db.add(rental_item)
            
            # Create execution event
            event = Event(
                asset_id=asset.id,
                event_type=config.EVENT_ALLOCATION_EXECUTED,
                timestamp=datetime.utcnow()
            )
            db.add(event)
            
            # Create Projected Impact Record
            impact = ImpactRecord(
                action_id=rec_action.id,
                metric="projected_utilization_improvement",
                estimated_value=candidate.score,
                is_illustrative=True
            )
            db.add(impact)
            
            db.commit()
        except Exception as e:
            db.rollback()
            raise e

    db.refresh(rec)
    return rec
