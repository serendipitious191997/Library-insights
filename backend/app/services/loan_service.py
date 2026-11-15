from datetime import date, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models import Book, Loan, Setting
from app.schemas import LoanIssueRequest, LoanReturnRequest, LoanCreate, LoanUpdate
from app.utils.loan_record import LoanRecord
from app.utils.id_generator import generate_loan_id
from app.utils.date_utils import parse_date_safe, get_reference_date

def issue_book(db: Session, request: LoanIssueRequest) -> Loan:
    """Issues a book copy to a student, reducing inventory available copies."""
    book = db.query(Book).filter(Book.book_id == request.book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with ID '{request.book_id}' does not exist in inventory."
        )

    if (book.available_copies or 0) <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Book '{book.title}' is currently out of stock (0 copies available)."
        )

    ref_date = get_reference_date(db)
    borrow_dt = request.borrow_date or ref_date
    
    # Calculate due date based on default loan days in settings if not provided
    if not request.due_date:
        setting = db.query(Setting).first()
        loan_days = setting.default_loan_days if setting else 14
        due_dt = borrow_dt + timedelta(days=loan_days)
    else:
        due_dt = request.due_date

    if due_dt < borrow_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Due date cannot be earlier than borrow date."
        )

    loan_id = generate_loan_id(db)
    new_loan = Loan(
        loan_id=loan_id,
        book_id=book.book_id,
        book_title=book.title,
        category=book.category,
        student_id=request.student_id.strip(),
        borrow_date=borrow_dt,
        due_date=due_dt,
        return_date=None,
        loan_duration=None,
        status="Active"
    )

    # Decrease available copies
    book.available_copies = max(0, book.available_copies - 1)

    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)
    return new_loan

def return_book(db: Session, loan_id: str, request: Optional[LoanReturnRequest] = None) -> Loan:
    """Records the return of an issued book, recalculating duration and restocking available copies."""
    loan = db.query(Loan).filter(Loan.loan_id == loan_id).first()
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan transaction '{loan_id}' not found."
        )

    if loan.status == "Returned" or loan.return_date is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Loan '{loan_id}' is already recorded as returned on {loan.return_date}."
        )

    ref_date = get_reference_date(db)
    ret_date = request.return_date if (request and request.return_date) else ref_date

    if ret_date < loan.borrow_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Return date ({ret_date}) cannot be earlier than borrow date ({loan.borrow_date})."
        )

    # Use LoanRecord OOP class to calculate duration and status
    record = LoanRecord(
        loan_id=loan.loan_id,
        book_id=loan.book_id,
        book_title=loan.book_title,
        category=loan.category,
        student_id=loan.student_id,
        borrow_date=loan.borrow_date,
        due_date=loan.due_date,
        return_date=ret_date
    )

    loan.return_date = ret_date
    loan.loan_duration = record.calculate_loan_duration()
    loan.status = "Returned"

    # Restock book inventory
    book = db.query(Book).filter(Book.book_id == loan.book_id).first()
    if book:
        book.available_copies = min(book.total_copies, (book.available_copies or 0) + 1)

    db.commit()
    db.refresh(loan)
    return loan

def create_loan(db: Session, payload: LoanCreate) -> Loan:
    """Creates a new loan record with validation."""
    book = db.query(Book).filter(Book.book_id == payload.book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with ID '{payload.book_id}' does not exist."
        )

    if payload.loan_id:
        existing = db.query(Loan).filter(Loan.loan_id == payload.loan_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Loan ID '{payload.loan_id}' already exists."
            )
        loan_id = payload.loan_id
    else:
        loan_id = generate_loan_id(db)

    if payload.due_date < payload.borrow_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Due date cannot be earlier than borrow date."
        )

    is_returned = payload.return_date is not None
    if is_returned and payload.return_date < payload.borrow_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Return date cannot be earlier than borrow date."
        )

    # Check stock only if active
    if not is_returned and (book.available_copies or 0) <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Book '{book.title}' has no copies available."
        )

    record = LoanRecord(
        loan_id=loan_id,
        book_id=book.book_id,
        book_title=book.title,
        category=book.category,
        student_id=payload.student_id,
        borrow_date=payload.borrow_date,
        due_date=payload.due_date,
        return_date=payload.return_date
    )

    new_loan = Loan(
        loan_id=loan_id,
        book_id=book.book_id,
        book_title=book.title,
        category=book.category,
        student_id=payload.student_id.strip(),
        borrow_date=payload.borrow_date,
        due_date=payload.due_date,
        return_date=payload.return_date,
        loan_duration=record.loan_duration,
        status="Returned" if is_returned else "Active"
    )

    if not is_returned:
        book.available_copies = max(0, book.available_copies - 1)

    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)
    return new_loan

def update_loan(db: Session, loan_id: str, payload: LoanUpdate) -> Loan:
    """Updates loan details while maintaining inventory consistency."""
    loan = db.query(Loan).filter(Loan.loan_id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found.")

    old_book_id = loan.book_id
    old_status = loan.status
    old_return_date = loan.return_date

    # Update basic fields
    if payload.student_id is not None:
        loan.student_id = payload.student_id.strip()
    if payload.borrow_date is not None:
        loan.borrow_date = payload.borrow_date
    if payload.due_date is not None:
        loan.due_date = payload.due_date
    if payload.return_date is not None:
        loan.return_date = payload.return_date

    # Validate dates
    if loan.due_date < loan.borrow_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Due date cannot be earlier than borrow date.")
    if loan.return_date and loan.return_date < loan.borrow_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Return date cannot be earlier than borrow date.")

    # Status determination
    if loan.return_date:
        loan.status = "Returned"
        record = LoanRecord(
            loan_id=loan.loan_id,
            book_id=loan.book_id,
            book_title=loan.book_title,
            category=loan.category,
            student_id=loan.student_id,
            borrow_date=loan.borrow_date,
            due_date=loan.due_date,
            return_date=loan.return_date
        )
        loan.loan_duration = record.calculate_loan_duration()
    else:
        loan.status = payload.status if payload.status in ("Active", "Overdue") else "Active"
        loan.loan_duration = None

    # Handle inventory change if status transitioned between active and returned
    if old_status != "Returned" and loan.status == "Returned":
        book = db.query(Book).filter(Book.book_id == loan.book_id).first()
        if book:
            book.available_copies = min(book.total_copies, (book.available_copies or 0) + 1)
    elif old_status == "Returned" and loan.status != "Returned":
        book = db.query(Book).filter(Book.book_id == loan.book_id).first()
        if book:
            book.available_copies = max(0, (book.available_copies or 0) - 1)

    db.commit()
    db.refresh(loan)
    return loan

def delete_loan(db: Session, loan_id: str) -> None:
    """Deletes a loan record. If the loan was active, replenishes available copies."""
    loan = db.query(Loan).filter(Loan.loan_id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found.")

    if loan.status != "Returned":
        book = db.query(Book).filter(Book.book_id == loan.book_id).first()
        if book:
            book.available_copies = min(book.total_copies, (book.available_copies or 0) + 1)

    db.delete(loan)
    db.commit()

def enrich_loan_response(loan: Loan, ref_date: Optional[date] = None) -> dict:
    """Enriches loan model into schema response with dynamic overdue calculation."""
    record = LoanRecord(
        loan_id=loan.loan_id,
        book_id=loan.book_id,
        book_title=loan.book_title,
        category=loan.category,
        student_id=loan.student_id,
        borrow_date=loan.borrow_date,
        due_date=loan.due_date,
        return_date=loan.return_date,
        status=loan.status,
        record_id=loan.id
    )
    data = record.to_dict(ref_date)
    data["created_at"] = loan.created_at
    return data
