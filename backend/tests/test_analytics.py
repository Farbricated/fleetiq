import pytest
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

def test_eqx1007_analytics():
    response = client.get("/assets/EQX1007/analytics")
    assert response.status_code == 200
    data = response.json()
    
    assert data["asset_id"] == "EQX1007"
    assert data["underutilization_severity"] == "HIGH"
    assert data["productive_hours_derived"] == 0.0
    
    reasons = " ".join(data["reasons"])
    assert "idle hours" in reasons.lower()
    assert "0 engine hours" in reasons.lower()
    assert "no operator" in reasons.lower()

def test_eqx1007_risk():
    response = client.get("/assets/EQX1007/risk")
    assert response.status_code == 200
    data = response.json()
    
    assert data["asset_id"] == "EQX1007"
    assert data["risk_level"] in ["HIGH", "CRITICAL"]
    factors = " ".join(data["risk_factors"])
    assert "unusual usage" in factors.lower()
    assert "idle" in factors.lower()

def test_fleet_analytics():
    response = client.get("/analytics/fleet")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_assets"] > 0
    assert data["underutilized_assets"] > 0
    assert data["high_risk_assets"] > 0
