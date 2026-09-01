import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import sys
import os
from datetime import date, timedelta
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

def test_health():
    response = client.get("/health")
    assert response.status_code == 200

def test_dashboard_summary():
    response = client.get("/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_assets" in data

def test_asset_eqx1007():
    response = client.get("/assets/EQX1007")
    assert response.status_code == 200
    assert response.json()["id"] == "EQX1007"
    
def test_usage_derived_utilization():
    response = client.get("/assets/EQX1007/usage")
    assert response.status_code == 200
    usage = response.json()[0]
    assert usage["engine_hours"] == 0.0
    assert usage["idle_hours"] == 12.0
    assert usage["derived_utilization_percent"] == 0.0

def test_rental_lifecycle():
    # 1. Create Rental Order
    resp = client.post("/rentals")
    assert resp.status_code == 200
    rental_id = resp.json()["id"]
    
    # 2. Checkout Asset
    future_date = (date.today() + timedelta(days=5)).isoformat()
    resp = client.post(f"/rentals/{rental_id}/checkout", json={
        "asset_id": "EQX1001",
        "checkout_date": date.today().isoformat(),
        "expected_return_date": future_date
    })
    assert resp.status_code == 200
    
    # 3. Duplicate checkout prevention
    resp2 = client.post(f"/rentals/{rental_id}/checkout", json={
        "asset_id": "EQX1001",
        "checkout_date": date.today().isoformat(),
        "expected_return_date": future_date
    })
    assert resp2.status_code == 400
    
    # 4. Checkin Asset
    resp = client.post(f"/rentals/{rental_id}/checkin", json={
        "checkin_date": date.today().isoformat()
    })
    assert resp.status_code == 200
    
    # 5. Asset status should be AVAILABLE now
    resp = client.get("/assets/EQX1001")
    assert resp.json()["status"] == "AVAILABLE"
    
    # 6. Check events
    resp = client.get("/assets/EQX1001/events")
    events = [e["event_type"] for e in resp.json()]
    assert "CHECKOUT" in events
    assert "CHECKIN" in events

def test_operator_assignment():
    resp = client.post("/assets/EQX1002/operator", json={"operator_id": "OP101"})
    assert resp.status_code == 200
    
    resp = client.get("/assets/EQX1002/events")
    events = [e["event_type"] for e in resp.json()]
    assert "OPERATOR_ASSIGNED" in events

    resp = client.post("/assets/EQX1002/operator/unassign")
    assert resp.status_code == 200
    
    resp = client.get("/assets/EQX1002/events")
    events = [e["event_type"] for e in resp.json()]
    assert "OPERATOR_UNASSIGNED" in events

def test_overdue_and_underutilization_alerts():
    resp = client.post("/system/check_underutilization")
    assert resp.status_code == 200
    
    resp = client.post("/system/check_underutilization")
    # Duplicate prevention
    assert resp.json()["alerts_created"] == 0

    resp = client.get("/alerts")
    alerts = [a["type"] for a in resp.json()]
    assert "UNDERUTILIZATION" in alerts
