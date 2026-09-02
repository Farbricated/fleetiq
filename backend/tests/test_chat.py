import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app
from app.core.database import SessionLocal
from app.models.all import Asset, Alert

client = TestClient(app)

@pytest.fixture
def db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_chat_without_api_key():
    # If no api key is configured, it should return gracefully
    with patch("app.services.llm.os.environ.get", return_value=None):
        response = client.post("/chat", json={"message": "hello"})
        assert response.status_code == 200
        data = response.json()
        assert "unavailable" in data["answer"].lower()
        assert data["grounded"] == False

def test_chat_with_mock_llm():
    mock_response = type("MockResponse", (), {
        "choices": [
            type("Choice", (), {
                "message": type("Message", (), {"content": "This is a grounded answer."})()
            })()
        ]
    })
    
    class MockClient:
        class Chat:
            class Completions:
                @staticmethod
                def create(**kwargs):
                    return mock_response
            completions = Completions()
        chat = Chat()
        
    with patch("app.services.llm.get_llm_client", return_value=MockClient()):
        response = client.post("/chat", json={"message": "What assets are underutilized?"})
        assert response.status_code == 200
        data = response.json()
        assert data["answer"] == "This is a grounded answer."
        assert data["grounded"] == True
        assert "fleet_summary" in data["sources"]

def test_asset_explanation_with_mock_llm():
    mock_response = type("MockResponse", (), {
        "choices": [
            type("Choice", (), {
                "message": type("Message", (), {"content": "EQX1007 is high risk."})()
            })()
        ]
    })
    
    class MockClient:
        class Chat:
            class Completions:
                @staticmethod
                def create(**kwargs):
                    return mock_response
            completions = Completions()
        chat = Chat()
        
    with patch("app.services.llm.get_llm_client", return_value=MockClient()):
        response = client.get("/chat/asset/EQX1007/explanation")
        assert response.status_code == 200
        data = response.json()
        assert "EQX1007 is high risk" in data["answer"]
        assert data["grounded"] == True
        assert "asset_info" in data["sources"]
