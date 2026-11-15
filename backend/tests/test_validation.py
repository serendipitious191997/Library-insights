import pytest
from app.services.validation_service import validate_record_row

def test_validation_detects_missing_fields():
    known_books = {"BK-101", "BK-102"}
    seen_loans = set()
    
    # Missing loan ID and student ID
    row = {
        "loan id": "",
        "book id": "BK-101",
        "book title": "Book Title",
        "category": "Computer Science",
        "student id": "",
        "borrow date": "2026-01-10",
        "due date": "2026-01-24"
    }
    issues = validate_record_row(row, 1, known_books, seen_loans)
    issue_types = [i.issue_type for i in issues]
    assert "Missing Loan ID" in issue_types
    assert "Missing Student ID" in issue_types

def test_validation_detects_reversed_dates():
    known_books = {"BK-101"}
    seen_loans = set()

    # Due date before borrow date, and return date before borrow date
    row = {
        "loan id": "LN-9999",
        "book id": "BK-101",
        "book title": "Book Title",
        "category": "Computer Science",
        "student id": "STU-999",
        "borrow date": "2026-02-15",
        "due date": "2026-02-10",
        "return date": "2026-02-01"
    }
    issues = validate_record_row(row, 1, known_books, seen_loans)
    issue_types = [i.issue_type for i in issues]
    assert "Date Relationship Error" in issue_types

def test_validation_detects_duplicate_loan_id():
    known_books = {"BK-101"}
    seen_loans = {"LN-DUPLICATE"}

    row = {
        "loan id": "LN-DUPLICATE",
        "book id": "BK-101",
        "book title": "Book Title",
        "category": "Computer Science",
        "student id": "STU-999",
        "borrow date": "2026-02-15",
        "due date": "2026-02-28"
    }
    issues = validate_record_row(row, 2, known_books, seen_loans)
    assert any("Duplicate Loan ID" in i.issue_type for i in issues)
