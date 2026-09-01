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

def test_get_demand_history():
    response = client.get("/forecasts/history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "site_id" in data[0]
        assert "equipment_type" in data[0]
        assert "demand_count" in data[0]
        assert "provenance" in data[0]
        assert data[0]["provenance"] == "SIMULATED"

def test_trigger_forecast_generation():
    # Test the POST endpoint to generate forecasts
    response = client.post("/forecasts/generate?horizon_weeks=2&lookback_weeks=4")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["forecasts_generated"] > 0
    assert data["method"] == "weighted_moving_average"
    assert data["provenance"] == "ILLUSTRATIVE ESTIMATE"
    assert "model_run_id" in data

def test_list_forecasts():
    # Call list forecasts
    response = client.get("/forecasts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "site_id" in data[0]
        assert "equipment_type_name" in data[0]
        assert "predicted_quantity" in data[0]
        assert "available_supply" in data[0]
        assert "demand_gap" in data[0]
        assert "confidence" in data[0]
        assert "evidence" in data[0]
        assert data[0]["provenance"] in ["ILLUSTRATIVE ESTIMATE", "SIMULATED"]

def test_list_model_runs():
    response = client.get("/forecasts/runs")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "model_name" in data[0]
        assert "version" in data[0]
        assert "status" in data[0]
        
def test_forecasting_logic_deterministic():
    from app.services.forecasting import weighted_moving_average
    # Test WMA logic
    data = [10, 20, 30, 40]
    weights = [0.1, 0.2, 0.3, 0.4]
    
    # 10*0.1 + 20*0.2 + 30*0.3 + 40*0.4 = 1 + 4 + 9 + 16 = 30
    wma = weighted_moving_average(data, weights)
    assert wma == 30.0
    
    # If fewer data points than weights
    data_short = [30, 40]
    # Uses last 2 weights: 0.3, 0.4. Sum = 0.7
    # 30*0.3 + 40*0.4 = 9 + 16 = 25
    # 25 / 0.7 = 35.714...
    wma_short = weighted_moving_average(data_short, weights)
    assert round(wma_short, 2) == 35.71
