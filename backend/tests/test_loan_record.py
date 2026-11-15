import pytest
from datetime import date
from app.utils.loan_record import LoanRecord

def test_loan_record_duration_calculation():
    """Verify calculation of completed loan duration."""
    rec = LoanRecord(
        loan_id="LN-TEST1",
        book_id="BK-101",
        book_title="Test Algorithms",
        category="Computer Science",
        student_id="STU-100",
        borrow_date=date(2026, 1, 10),
        due_date=date(2026, 1, 24),
        return_date=date(2026, 1, 18)
    )
    assert rec.loan_duration == 8
    assert rec.status == "Returned"
    assert rec.is_overdue() is False
    assert rec.is_returned_late() is False
    assert rec.get_days_overdue() == 0

def test_loan_record_active_and_overdue():
    """Verify active and overdue status calculation using reference date."""
    ref_date = date(2026, 2, 1)
    
    # Active not yet overdue
    rec_active = LoanRecord(
        loan_id="LN-TEST2",
        book_id="BK-102",
        book_title="Test Code",
        category="Computer Science",
        student_id="STU-101",
        borrow_date=date(2026, 1, 25),
        due_date=date(2026, 2, 8),
        return_date=None
    )
    assert rec_active.is_overdue(ref_date) is False
    assert rec_active.get_days_overdue(ref_date) == 0

    # Active and overdue
    rec_overdue = LoanRecord(
        loan_id="LN-TEST3",
        book_id="BK-103",
        book_title="Test OS",
        category="Computer Science",
        student_id="STU-102",
        borrow_date=date(2026, 1, 5),
        due_date=date(2026, 1, 19),
        return_date=None
    )
    assert rec_overdue.is_overdue(ref_date) is True
    # Due Jan 19, ref Feb 1 -> 13 days overdue
    assert rec_overdue.get_days_overdue(ref_date) == 13

def test_loan_record_returned_late():
    """Verify returned late detection."""
    rec_late = LoanRecord(
        loan_id="LN-TEST4",
        book_id="BK-104",
        book_title="Test DB",
        category="Computer Science",
        student_id="STU-103",
        borrow_date=date(2026, 1, 5),
        due_date=date(2026, 1, 19),
        return_date=date(2026, 1, 23)
    )
    assert rec_late.is_returned_late() is True
    assert rec_late.get_days_overdue() == 4
    assert rec_late.loan_duration == 18

def test_loan_record_dict_serialization():
    """Verify dictionary serialization for JSON representation."""
    rec = LoanRecord(
        loan_id="LN-TEST5",
        book_id="BK-105",
        book_title="Python Crash Course",
        category="Computer Science",
        student_id="STU-104",
        borrow_date=date(2026, 3, 1),
        due_date=date(2026, 3, 15),
        return_date=date(2026, 3, 8)
    )
    d = rec.to_dict()
    assert d["loan_id"] == "LN-TEST5"
    assert d["loan_duration"] == 7
    assert d["status"] == "Returned"
    assert d["book_title"] == "Python Crash Course"
