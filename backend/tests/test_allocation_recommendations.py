import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_signature_workflow():
    # 0. Reset EQX1001 state in persistent test db
    db = next(override_get_db())
    from app.models.all import Asset, AssetOperatorAssignment
    eqx1001 = db.query(Asset).filter(Asset.id == "EQX1001").first()
    if eqx1001:
        eqx1001.status = "AVAILABLE"
        db.query(AssetOperatorAssignment).filter(AssetOperatorAssignment.asset_id == "EQX1001").delete()
        db.commit()
        
    # 1. Generate Mock Forecast for S003 (Excavators)
    forecast_resp = client.post("/forecasts/mock?site_id=S003&equipment_category_name=Excavators")
    assert forecast_resp.status_code == 200
    forecast = forecast_resp.json()
    forecast_id = forecast["id"]
    
    # 2. Trigger Candidate Generation
    candidates_resp = client.post(f"/forecasts/{forecast_id}/candidates")
    assert candidates_resp.status_code == 200
    candidates = candidates_resp.json()
    
    # EQX1001 should be in candidates and highly ranked (EQX1007 is disqualified due to CRITICAL risk)
    eqx1001_candidate = next((c for c in candidates if c["asset_id"] == "EQX1001"), None)
    assert eqx1001_candidate is not None
    assert eqx1001_candidate["target_site_id"] == "S003"
    
    # Check that reasons exist
    assert len(eqx1001_candidate["reasoning"]["reasons"]) > 0
    candidate_id = eqx1001_candidate["id"]
    
    # 3. Create Recommendation
    rec_resp = client.post(f"/candidates/{candidate_id}/recommend")
    assert rec_resp.status_code == 200
    rec = rec_resp.json()
    assert rec["status"] == "PENDING"
    assert rec["action_type"] == "REALLOCATE"
    rec_id = rec["id"]
    
    # Use the first user we can find, or create one
    from app.models.all import User
    user = db.query(User).first()
    if not user:
        user = User(id=uuid.uuid4(), role="DISPATCHER", name="Test User")
        db.add(user)
        db.commit()
    user_id = str(user.id)
    
    # 4. Approve Recommendation
    approve_resp = client.post(f"/recommendations/{rec_id}/approve", json={"user_id": user_id, "notes": "Approved for demo"})
    assert approve_resp.status_code == 200
    assert approve_resp.json()["status"] == "APPROVED"
    
    # 5. Execute Recommendation
    execute_resp = client.post(f"/recommendations/{rec_id}/execute", json={"user_id": user_id})
    assert execute_resp.status_code == 200
    assert execute_resp.json()["status"] == "EXECUTED"
    
    # 6. Check Impact
    impact_resp = client.get(f"/recommendations/{rec_id}/impact")
    assert impact_resp.status_code == 200
    impacts = impact_resp.json()
    assert len(impacts) > 0
    assert impacts[0]["is_illustrative"] == True
    
    # 7. Check Asset status is RENTED
    asset_resp = client.get("/assets/EQX1001")
    assert asset_resp.status_code == 200
    assert asset_resp.json()["status"] == "RENTED"

def test_invalid_transitions():
    db = next(override_get_db())
    from app.models.all import Asset, AssetOperatorAssignment
    eqx1001 = db.query(Asset).filter(Asset.id == "EQX1001").first()
    if eqx1001:
        eqx1001.status = "AVAILABLE"
        db.query(AssetOperatorAssignment).filter(AssetOperatorAssignment.asset_id == "EQX1001").delete()
        db.commit()

    forecast_resp = client.post("/forecasts/mock?site_id=S004&equipment_category_name=Excavators")
    forecast_id = forecast_resp.json()["id"]
    client.post(f"/forecasts/{forecast_id}/candidates")
    candidates = client.get(f"/forecasts/{forecast_id}/candidates").json()
    candidate_id = candidates[0]["id"]
    
    rec_resp = client.post(f"/candidates/{candidate_id}/recommend")
    rec_id = rec_resp.json()["id"]
    
    import uuid
    from app.models.all import User
    user = db.query(User).first()
    if not user:
        user = User(id=uuid.uuid4(), role="DISPATCHER", name="Test User")
        db.add(user)
        db.commit()
    user_id = str(user.id)
    
    # Try to execute pending recommendation -> should fail
    execute_resp = client.post(f"/recommendations/{rec_id}/execute", json={"user_id": user_id})
    assert execute_resp.status_code == 400
    
    # Reject it
    client.post(f"/recommendations/{rec_id}/reject", json={"user_id": user_id})
    
    # Try to approve rejected recommendation -> should fail
    approve_resp = client.post(f"/recommendations/{rec_id}/approve", json={"user_id": user_id})
    assert approve_resp.status_code == 400
