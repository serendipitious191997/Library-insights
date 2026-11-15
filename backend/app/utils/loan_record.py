"""
OOP Implementation of LoanRecord representing an individual borrowing transaction.
Demonstrates core Object-Oriented Programming (OOP) concepts in Python:
- Encapsulation of loan attributes and state
- Methods for business computations (duration, overdue checks, days overdue)
- Serialization to dictionary representation
"""

from datetime import date, datetime
from typing import Optional, Dict, Any, Union


class LoanRecord:
    """Represents a library circulation borrowing transaction."""

    def __init__(
        self,
        loan_id: str,
        book_id: str,
        book_title: str,
        category: str,
        student_id: str,
        borrow_date: Union[date, str],
        due_date: Union[date, str],
        return_date: Optional[Union[date, str]] = None,
        status: str = "Active",
        record_id: Optional[int] = None,
    ):
        self.record_id = record_id
        self.loan_id = str(loan_id).strip()
        self.book_id = str(book_id).strip()
        self.book_title = str(book_title).strip()
        self.category = str(category).strip()
        self.student_id = str(student_id).strip()

        # Parse borrow_date
        self.borrow_date = self._parse_date(borrow_date)
        # Parse due_date
        self.due_date = self._parse_date(due_date)
        # Parse return_date
        self.return_date = self._parse_date(return_date) if return_date else None

        self._status = status
        self.loan_duration = self.calculate_loan_duration()
        self._update_computed_status()

    @staticmethod
    def _parse_date(val: Optional[Union[date, str]]) -> Optional[date]:
        if val is None or val == "" or str(val).lower() == "none" or str(val).lower() == "nan":
            return None
        if isinstance(val, date):
            return val
        if isinstance(val, datetime):
            return val.date()
        date_str = str(val).strip()
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        raise ValueError(f"Unable to parse date string: '{val}'")

    def calculate_loan_duration(self, custom_return_date: Optional[Union[date, str]] = None) -> Optional[int]:
        """
        Calculates loan duration in days:
        - If returned: return_date - borrow_date
        - If unreturned: None (completed loan duration), or returns elapsed days if checked.
        """
        ret_date = self._parse_date(custom_return_date) if custom_return_date else self.return_date
        if ret_date and self.borrow_date:
            duration = (ret_date - self.borrow_date).days
            return max(0, duration)
        return None

    def get_elapsed_days(self, reference_date: Optional[Union[date, str]] = None) -> int:
        """Calculates days elapsed since borrow_date for active loans."""
        ref = self._parse_date(reference_date) if reference_date else date.today()
        if self.borrow_date and ref >= self.borrow_date:
            return (ref - self.borrow_date).days
        return 0

    def is_overdue(self, reference_date: Optional[Union[date, str]] = None) -> bool:
        """
        Determines if the loan is currently overdue:
        - Unreturned loan where reference_date > due_date.
        """
        if self.return_date is not None:
            return False  # Returned already
        ref = self._parse_date(reference_date) if reference_date else date.today()
        return ref > self.due_date

    def is_returned_late(self) -> bool:
        """
        Determines if a completed loan was returned after the due date.
        """
        if self.return_date and self.due_date:
            return self.return_date > self.due_date
        return False

    def get_days_overdue(self, reference_date: Optional[Union[date, str]] = None) -> int:
        """
        Calculates overdue days:
        - If active and past due: reference_date - due_date
        - If returned late: return_date - due_date
        - Otherwise: 0
        """
        if self.return_date:
            if self.return_date > self.due_date:
                return (self.return_date - self.due_date).days
            return 0

        ref = self._parse_date(reference_date) if reference_date else date.today()
        if ref > self.due_date:
            return (ref - self.due_date).days
        return 0

    def _update_computed_status(self, reference_date: Optional[Union[date, str]] = None):
        if self.return_date:
            self._status = "Returned"
        elif self.is_overdue(reference_date):
            self._status = "Overdue"
        else:
            self._status = "Active"

    @property
    def status(self) -> str:
        return self._status

    def mark_returned(self, return_date: Optional[Union[date, str]] = None):
        """Marks the loan as returned and updates duration and status."""
        self.return_date = self._parse_date(return_date) if return_date else date.today()
        self.loan_duration = self.calculate_loan_duration()
        self._status = "Returned"

    def to_dict(self, reference_date: Optional[Union[date, str]] = None) -> Dict[str, Any]:
        """Converts the loan record into a serializable dictionary."""
        self._update_computed_status(reference_date)
        return {
            "id": self.record_id,
            "loan_id": self.loan_id,
            "book_id": self.book_id,
            "book_title": self.book_title,
            "category": self.category,
            "student_id": self.student_id,
            "borrow_date": self.borrow_date.strftime("%Y-%m-%d") if self.borrow_date else None,
            "due_date": self.due_date.strftime("%Y-%m-%d") if self.due_date else None,
            "return_date": self.return_date.strftime("%Y-%m-%d") if self.return_date else None,
            "loan_duration": self.loan_duration,
            "status": self.status,
            "is_overdue": self.is_overdue(reference_date),
            "days_overdue": self.get_days_overdue(reference_date),
            "is_returned_late": self.is_returned_late(),
        }

    def __repr__(self) -> str:
        return f"<LoanRecord(loan_id='{self.loan_id}', student='{self.student_id}', book='{self.book_title}', status='{self.status}')>"
