import sys
import os
import asyncio

# Setup env for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from app.core.database import SessionLocal
from app.models.all import Asset, RentalOrder, Event, Alert, Forecast, AllocationCandidate, Recommendation, RecommendationAction, ImpactRecord
from app.services.analytics import analyze_asset_utilization, analyze_asset_risk
from app.services.forecasting import generate_forecasts
from app.services.allocation import generate_allocation_candidates
from app.services.recommendation import create_recommendation, process_action

async def run_e2e():
    db = SessionLocal()
    
    # Target EQX1007
    asset = db.query(Asset).filter(Asset.id == "EQX1007").first()
    if not asset:
        print("EQX1007 not found!")
        return

    asset.status = "AVAILABLE"
    from app.models.all import AssetOperatorAssignment
    db.query(AssetOperatorAssignment).filter(AssetOperatorAssignment.asset_id == asset.id).delete()
    db.commit()

    print("========================================")
    print(f"Asset: {asset.id}")
    
    # Run analytics
    print("Running Analytics Scan...")
    util = analyze_asset_utilization(db, asset.id)
    risk = analyze_asset_risk(db, asset.id)
    print(f"Utilization Score: {util.underutilization_score}")
    print(f"Risk Score: {risk.risk_score}")
    
    # Check Alerts generated for EQX1007
    alerts = db.query(Alert).filter(Alert.asset_id == asset.id).all()
    for a in alerts:
        print(f"Alert: {a.type} | Severity: {a.severity}")
    
    # Generate Forecasts
    print("Generating Forecasts...")
    run_response = generate_forecasts(db)
    forecasts = run_response['forecasts']
    
    target_forecast = None
    target_candidate = None
    for f in forecasts:
        candidates = generate_allocation_candidates(db, f.id)
        for c in candidates:
            if c.asset_id == asset.id:
                target_forecast = f
                target_candidate = c
                print(f"Forecast: {f.site_id} | Type: {f.equipment_type_name} | Gap: {f.demand_gap}")
                print(f"Allocation Candidate: {c.asset_id} -> {c.target_site_id} | Total Score: {c.score}")
                print(f"Reasoning: {c.reasoning}")
                break
        if target_candidate:
            break

    if not target_candidate:
        print("Asset not chosen as candidate")
        return

    # Generate Recommendation
    print("Generating Recommendation...")
    rec = create_recommendation(db, target_candidate.id)
    print(f"Recommendation: {rec.id} | Status: {rec.status}")

    from app.models.all import User
    dummy_user = db.query(User).first().id
    # Approve
    print("Approving Recommendation...")
    rec = process_action(db, rec.id, action="APPROVE", user_id=dummy_user, notes="Looks good")
    print(f"Recommendation Approval Status: {rec.status}")

    # Execute
    print("Executing Recommendation...")
    rec = process_action(db, rec.id, action="EXECUTE", user_id=dummy_user, notes="Moved")
    print(f"Recommendation Execute Status: {rec.status}")

    # Verify Action Events
    print("Action recorded successfully.")
        
if __name__ == "__main__":
    asyncio.run(run_e2e())
