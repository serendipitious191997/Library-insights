import pandas as pd
from typing import List, Dict, Any, Optional, Set
from sqlalchemy.orm import Session

from app.models import Book, Loan
from app.utils.date_utils import parse_date_safe
from app.schemas import ValidationSummary, ValidationIssue

REQUIRED_COLUMNS = [
    "Loan ID", "Book ID", "Book Title", "Category", 
    "Student ID", "Borrow Date", "Due Date"
]

def validate_record_row(
    row: Dict[str, Any],
    row_idx: int,
    known_book_ids: Set[str],
    seen_loan_ids: Set[str]
) -> List[ValidationIssue]:
    """Validates an individual row/record against all 11 library quality criteria."""
    issues: List[ValidationIssue] = []

    # Map possible column names (case-insensitive and trimmed)
    normalized = {str(k).strip().lower().replace("_", " "): v for k, v in row.items()}
    
    def get_val(key_name: str) -> Optional[str]:
        v = normalized.get(key_name.lower())
        if v is None:
            return None
        s = str(v).strip()
        if s.lower() in ("nan", "none", "null", "nat", ""):
            return None
        return s

    loan_id = get_val("loan id")
    book_id = get_val("book id")
    book_title = get_val("book title")
    category = get_val("category")
    student_id = get_val("student id")
    borrow_date_raw = get_val("borrow date")
    due_date_raw = get_val("due date")
    return_date_raw = get_val("return date")

    # 1 & 2: Missing or Duplicate Loan ID
    if not loan_id:
        issues.append(ValidationIssue(
            row_number=row_idx,
            loan_id="MISSING",
            field="loan_id",
            issue_type="Missing Loan ID",
            message="Loan ID is required and cannot be empty.",
            severity="error"
        ))
    else:
        if loan_id in seen_loan_ids:
            issues.append(ValidationIssue(
                row_number=row_idx,
                loan_id=loan_id,
                field="loan_id",
                issue_type="Duplicate Loan ID",
                message=f"Duplicate Loan ID '{loan_id}' detected.",
                severity="error"
            ))
        else:
            seen_loan_ids.add(loan_id)

    # 3: Missing Book ID
    if not book_id:
        issues.append(ValidationIssue(
            row_number=row_idx,
            loan_id=loan_id,
            field="book_id",
            issue_type="Missing Book ID",
            message="Book ID is required.",
            severity="error"
        ))
    else:
        # 11: Book ID does not exist in inventory
        if known_book_ids and book_id not in known_book_ids:
            issues.append(ValidationIssue(
                row_number=row_idx,
                loan_id=loan_id,
                field="book_id",
                issue_type="Unknown Book ID",
                message=f"Book ID '{book_id}' does not exist in inventory.",
                severity="warning"
            ))

    # 4: Missing Category
    if not category:
        issues.append(ValidationIssue(
            row_number=row_idx,
            loan_id=loan_id,
            field="category",
            issue_type="Missing Category",
            message="Book Category is required.",
            severity="error"
        ))

    # 5: Missing Student ID
    if not student_id:
        issues.append(ValidationIssue(
            row_number=row_idx,
            loan_id=loan_id,
            field="student_id",
            issue_type="Missing Student ID",
            message="Student ID is required.",
            severity="error"
        ))

    # 6: Invalid Borrow Date
    borrow_dt = None
    if not borrow_date_raw:
        issues.append(ValidationIssue(
            row_number=row_idx,
            loan_id=loan_id,
            field="borrow_date",
            issue_type="Missing Borrow Date",
            message="Borrow Date is required.",
            severity="error"
        ))
    else:
        borrow_dt = parse_date_safe(borrow_date_raw)
        if not borrow_dt:
            issues.append(ValidationIssue(
                row_number=row_idx,
                loan_id=loan_id,
                field="borrow_date",
                issue_type="Invalid Borrow Date",
                message=f"Invalid borrow date format: '{borrow_date_raw}'.",
                severity="error"
            ))

    # 7: Invalid Due Date
    due_dt = None
    if not due_date_raw:
        issues.append(ValidationIssue(
            row_number=row_idx,
            loan_id=loan_id,
            field="due_date",
            issue_type="Missing Due Date",
            message="Due Date is required.",
            severity="error"
        ))
    else:
        due_dt = parse_date_safe(due_date_raw)
        if not due_dt:
            issues.append(ValidationIssue(
                row_number=row_idx,
                loan_id=loan_id,
                field="due_date",
                issue_type="Invalid Due Date",
                message=f"Invalid due date format: '{due_date_raw}'.",
                severity="error"
            ))

    # 8: Invalid Return Date (optional field, but if present must be valid)
    ret_dt = None
    if return_date_raw:
        ret_dt = parse_date_safe(return_date_raw)
        if not ret_dt:
            issues.append(ValidationIssue(
                row_number=row_idx,
                loan_id=loan_id,
                field="return_date",
                issue_type="Invalid Return Date",
                message=f"Invalid return date format: '{return_date_raw}'.",
                severity="error"
            ))

    # 9: Return Date earlier than Borrow Date
    if borrow_dt and ret_dt and ret_dt < borrow_dt:
        issues.append(ValidationIssue(
            row_number=row_idx,
            loan_id=loan_id,
            field="return_date",
            issue_type="Date Relationship Error",
            message=f"Return Date ({ret_dt}) is earlier than Borrow Date ({borrow_dt}).",
            severity="error"
        ))

    # 10: Due Date earlier than Borrow Date
    if borrow_dt and due_dt and due_dt < borrow_dt:
        issues.append(ValidationIssue(
            row_number=row_idx,
            loan_id=loan_id,
            field="due_date",
            issue_type="Date Relationship Error",
            message=f"Due Date ({due_dt}) is earlier than Borrow Date ({borrow_dt}).",
            severity="error"
        ))

    return issues

def audit_database_data(db: Session) -> ValidationSummary:
    """Performs full quality validation on all loan records currently residing in the SQLite database."""
    books = db.query(Book.book_id).all()
    known_book_ids = {b_id for (b_id,) in books if b_id}

    loans = db.query(Loan).all()
    total_checked = len(loans)

    all_issues: List[ValidationIssue] = []
    seen_loan_ids: Set[str] = set()
    invalid_rows_set: Set[int] = set()
    incomplete_rows_set: Set[int] = set()
    duplicate_rows_set: Set[int] = set()

    for idx, l in enumerate(loans, start=1):
        row_dict = {
            "loan id": l.loan_id,
            "book id": l.book_id,
            "book title": l.book_title,
            "category": l.category,
            "student id": l.student_id,
            "borrow date": str(l.borrow_date) if l.borrow_date else None,
            "due date": str(l.due_date) if l.due_date else None,
            "return date": str(l.return_date) if l.return_date else None
        }

        row_issues = validate_record_row(row_dict, idx, known_book_ids, seen_loan_ids)
        if row_issues:
            all_issues.extend(row_issues)
            for iss in row_issues:
                if iss.severity == "error":
                    invalid_rows_set.add(idx)
                if "Missing" in iss.issue_type:
                    incomplete_rows_set.add(idx)
                if "Duplicate" in iss.issue_type:
                    duplicate_rows_set.add(idx)

    invalid_records = len(invalid_rows_set)
    valid_records = max(0, total_checked - invalid_records)

    return ValidationSummary(
        total_checked=total_checked,
        valid_records=valid_records,
        invalid_records=invalid_records,
        duplicate_records=len(duplicate_rows_set),
        incomplete_records=len(incomplete_rows_set),
        issues=all_issues
    )
