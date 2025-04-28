import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.models import Base
from app.database import get_db

# Use SQLite for testing instead of PostgreSQL
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create all tables before testing
Base.metadata.create_all(bind=engine)

client = TestClient(app)

# ===========================
# TEST 1: CSV Upload
# ===========================
def test_upload_csv():
    csv_content = """date,ticker,action,shares,price,amount,notes
2023-01-01,AAPL,buy,10,150,1500,Initial investment
2023-02-01,GOOGL,buy,5,100,500,Extra shares
2023-03-01,AAPL,sell,2,160,320,Partial sell
"""
    files = {"file": ("test.csv", csv_content)}
    headers = {"X-User-Id": "user-1234"}

    response = client.post("/portfolio/upload", files=files, headers=headers)
    assert response.status_code == 200
    assert "portfolio_id" in response.json()

# ===========================
# TEST 2: Get Portfolio Metrics
# ===========================
def test_portfolio_metrics():
    headers = {"X-User-Id": "user-1234"}
    response = client.get("/portfolio/metrics/1", headers=headers)
    assert response.status_code == 200
    assert "metrics" in response.json()

# ===========================
# TEST 3: Update Portfolio Name
# ===========================
def test_update_portfolio():
    headers = {"X-User-Id": "user-1234"}
    data = {"name": "Updated Portfolio Name"}
    response = client.put("/portfolio/portfolio/1", json=data, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Portfolio Name"

# ===========================
# TEST 4: Update Transaction
# ===========================
def test_update_transaction():
    headers = {"X-User-Id": "user-1234"}
    data = {
        "date": "2023-01-01",
        "ticker": "AAPL",
        "action": "buy",
        "shares": 20,
        "price": 155,
        "amount": 3100,
        "notes": "Updated note"
    }
    response = client.put("/portfolio/transaction/1", json=data, headers=headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Transaction 1 updated"

# ===========================
# TEST 5: Delete Transaction
# ===========================
def test_delete_transaction():
    headers = {"X-User-Id": "user-1234"}
    response = client.delete("/portfolio/transaction/1", headers=headers)
    assert response.status_code == 200
    assert "deleted" in response.json()["message"]

# ===========================
# TEST 6: Delete Portfolio
# ===========================
def test_delete_portfolio():
    headers = {"X-User-Id": "user-1234"}
    response = client.delete("/portfolio/portfolio/1", headers=headers)
    assert response.status_code == 200
    assert "deleted" in response.json()["message"]
