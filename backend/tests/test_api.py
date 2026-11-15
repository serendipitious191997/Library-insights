import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.utils.sample_seeder import seed_sample_database

# Create shared in-memory test database using StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_sample_database(db, force=True)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_get_books(client):
    res = client.get("/api/books")
    assert res.status_code == 200
    books = res.json()
    assert len(books) >= 15
    first_book = books[0]
    assert "book_id" in first_book
    assert "total_copies" in first_book
    assert "available_copies" in first_book

def test_create_and_delete_book(client):
    new_book = {
        "title": "Quantum Computing Principles",
        "author": "David Mermin",
        "category": "Physics",
        "publisher": "Cambridge",
        "total_copies": 3,
        "available_copies": 3
    }
    create_res = client.post("/api/books", json=new_book)
    assert create_res.status_code == 201
    created = create_res.json()
    b_id = created["book_id"]

    # Delete the book
    del_res = client.delete(f"/api/books/{b_id}")
    assert del_res.status_code == 200

def test_get_loans(client):
    res = client.get("/api/loans")
    assert res.status_code == 200
    loans = res.json()
    assert len(loans) == 50

def test_issue_and_return_book(client):
    # Check out BK-105 (Python Crash Course)
    issue_payload = {
        "book_id": "BK-105",
        "student_id": "STU-9999",
        "borrow_date": "2026-05-01",
        "due_date": "2026-05-15"
    }
    issue_res = client.post("/api/loans/issue", json=issue_payload)
    assert issue_res.status_code == 201
    loan = issue_res.json()
    l_id = loan["loan_id"]
    assert loan["status"] == "Active"

    # Return book
    return_res = client.post(f"/api/loans/{l_id}/return", json={"return_date": "2026-05-09"})
    assert return_res.status_code == 200
    returned_loan = return_res.json()
    assert returned_loan["status"] == "Returned"
    assert returned_loan["loan_duration"] == 8

def test_analytics_endpoints(client):
    res_overview = client.get("/api/analytics/overview")
    assert res_overview.status_code == 200
    data = res_overview.json()
    assert data["total_loans"] >= 50

    res_cat = client.get("/api/analytics/categories")
    assert res_cat.status_code == 200
    assert res_cat.json()["highest_category"] == "Computer Science"

    res_dur = client.get("/api/analytics/duration")
    assert res_dur.status_code == 200
    assert res_dur.json()["most_common_range"] == "6–10 days"

def test_export_endpoints(client):
    res_csv = client.get("/api/export/loans/csv")
    assert res_csv.status_code == 200
    assert "Loan ID,Book ID" in res_csv.text

    res_json = client.get("/api/export/summary/json")
    assert res_json.status_code == 200
    assert res_json.json()["total_loans"] >= 50
