import io
import pandas as pd
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status

from app.models import Book, Loan
from app.utils.loan_record import LoanRecord
from app.utils.date_utils import parse_date_safe
from app.services.validation_service import validate_record_row, REQUIRED_COLUMNS
from app.schemas import ImportPreviewResponse, ValidationIssue, ImportConfirmResponse

def preview_csv_content(file_bytes: bytes, filename: str, db: Session) -> ImportPreviewResponse:
    """Reads CSV using Pandas, inspects structure, validates rows, and returns first 10 for preview."""
    try:
        df = pd.read_csv(io.BytesIO(file_bytes), dtype=str)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to parse CSV file: {str(e)}"
        )

    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded CSV file is empty."
        )

    # Clean header column names
    df.columns = [str(c).strip() for c in df.columns]

    # Check for missing required columns
    normalized_cols = {c.lower().replace("_", " "): c for c in df.columns}
    missing_required = []
    for req in REQUIRED_COLUMNS:
        if req.lower() not in normalized_cols:
            missing_required.append(req)

    issues: List[ValidationIssue] = []
    if missing_required:
        issues.append(ValidationIssue(
            row_number=0,
            field="columns",
            issue_type="Missing Required Columns",
            message=f"Missing essential CSV columns: {', '.join(missing_required)}",
            severity="error"
        ))

    # Existing Book IDs and Loan IDs from DB
    existing_books = db.query(Book.book_id).all()
    known_book_ids = {b_id for (b_id,) in existing_books if b_id}
    existing_loans = db.query(Loan.loan_id).all()
    seen_loan_ids = {l_id for (l_id,) in existing_loans if l_id}

    total_rows = len(df)
    invalid_rows_set = set()

    for idx, row in df.iterrows():
        row_dict = row.to_dict()
        row_issues = validate_record_row(row_dict, idx + 1, known_book_ids, seen_loan_ids)
        if row_issues:
            issues.extend(row_issues)
            for iss in row_issues:
                if iss.severity == "error":
                    invalid_rows_set.add(idx)

    # Convert preview data (first 10 records)
    preview_slice = df.head(10).fillna("").to_dict(orient="records")
    invalid_count = len(invalid_rows_set)
    valid_count = max(0, total_rows - invalid_count)

    return ImportPreviewResponse(
        filename=filename,
        total_rows=total_rows,
        valid_rows_count=valid_count,
        invalid_rows_count=invalid_count,
        preview_rows=preview_slice,
        issues=issues[:50],  # Return up to 50 issues
        can_import=(valid_count > 0 and len(missing_required) == 0)
    )

def import_records_transaction(
    records: List[Dict[str, Any]],
    import_valid_only: bool,
    db: Session
) -> ImportConfirmResponse:
    """Imports validated records into SQLite in an atomic transaction."""
    if not records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No records provided for import."
        )

    # Cache existing database records
    existing_books = {b.book_id: b for b in db.query(Book).all()}
    existing_loan_ids = {l.loan_id for (l,) in db.query(Loan.loan_id).all()}

    imported_count = 0
    skipped_count = 0

    try:
        for idx, row in enumerate(records, start=1):
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
            book_title = get_val("book title") or "Untitled Book"
            category = get_val("category") or "General"
            student_id = get_val("student id")
            borrow_date_raw = get_val("borrow date")
            due_date_raw = get_val("due date")
            return_date_raw = get_val("return date")

            # Check validity
            borrow_dt = parse_date_safe(borrow_date_raw)
            due_dt = parse_date_safe(due_date_raw)
            ret_dt = parse_date_safe(return_date_raw) if return_date_raw else None

            is_valid = bool(
                loan_id and loan_id not in existing_loan_ids and
                book_id and student_id and borrow_dt and due_dt and
                due_dt >= borrow_dt and (ret_dt is None or ret_dt >= borrow_dt)
            )

            if not is_valid:
                skipped_count += 1
                if not import_valid_only:
                    continue
                continue

            # Ensure Book exists in inventory; auto-create if not present
            if book_id not in existing_books:
                new_book = Book(
                    book_id=book_id,
                    title=book_title,
                    author="Author Unknown",
                    category=category,
                    total_copies=5,
                    available_copies=5
                )
                db.add(new_book)
                db.flush()
                existing_books[book_id] = new_book
            
            book = existing_books[book_id]

            # Construct Loan Record
            record = LoanRecord(
                loan_id=loan_id,
                book_id=book_id,
                book_title=book_title,
                category=category,
                student_id=student_id,
                borrow_date=borrow_dt,
                due_date=due_dt,
                return_date=ret_dt
            )

            is_active = (ret_dt is None)
            new_loan = Loan(
                loan_id=loan_id,
                book_id=book_id,
                book_title=book.title if book else book_title,
                category=book.category if book else category,
                student_id=student_id,
                borrow_date=borrow_dt,
                due_date=due_dt,
                return_date=ret_dt,
                loan_duration=record.loan_duration,
                status="Active" if is_active else "Returned"
            )

            if is_active:
                book.available_copies = max(0, (book.available_copies or 0) - 1)

            db.add(new_loan)
            existing_loan_ids.add(loan_id)
            imported_count += 1

        db.commit()
        return ImportConfirmResponse(
            imported_count=imported_count,
            skipped_count=skipped_count,
            message=f"Successfully imported {imported_count} records. {skipped_count} invalid/duplicate records skipped."
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed during transaction: {str(e)}"
        )
