from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Loan
from app.schemas import (
    LoanResponse,
    LoanCreate,
    LoanUpdate,
    LoanIssueRequest,
    LoanReturnRequest
)
from app.services.loan_service import (
    issue_book,
    return_book,
    create_loan,
    update_loan,
    delete_loan,
    enrich_loan_response
)
from app.utils.date_utils import get_reference_date, parse_date_safe

router = APIRouter(prefix="/api/loans", tags=["Loan Circulation"])

@router.get("", response_model=List[LoanResponse])
def get_loans(
    search: Optional[str] = Query(None, description="Search by Loan ID, Student ID, or Book Title"),
    category: Optional[str] = Query(None, description="Filter by Category"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: Active, Returned, Overdue"),
    start_date: Optional[str] = Query(None, description="Filter from Borrow Date"),
    end_date: Optional[str] = Query(None, description="Filter to Borrow Date"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieves borrowing transaction records with full search, filter, and pagination support."""
    ref_date = get_reference_date(db)
    query = db.query(Loan)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Loan.loan_id.ilike(s),
                Loan.student_id.ilike(s),
                Loan.book_title.ilike(s),
                Loan.book_id.ilike(s)
            )
        )

    if category and category != "All":
        query = query.filter(Loan.category == category)

    if start_date:
        d = parse_date_safe(start_date)
        if d:
            query = query.filter(Loan.borrow_date >= d)

    if end_date:
        d = parse_date_safe(end_date)
        if d:
            query = query.filter(Loan.borrow_date <= d)

    loans = query.order_by(Loan.id.desc()).all()

    # Enrich dynamically using LoanRecord OOP model
    results = [enrich_loan_response(l, ref_date) for l in loans]

    # Filter status post-enrichment (handles dynamic overdue status)
    if status_filter and status_filter != "All":
        results = [r for r in results if r["status"].lower() == status_filter.lower()]

    # Pagination slice
    paginated = results[skip : skip + limit]
    return [LoanResponse(**item) for item in paginated]

@router.post("", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
def add_loan(payload: LoanCreate, db: Session = Depends(get_db)):
    """Creates a new loan record with validation."""
    ref_date = get_reference_date(db)
    loan = create_loan(db, payload)
    return LoanResponse(**enrich_loan_response(loan, ref_date))

@router.post("/issue", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
def issue_new_loan(request: LoanIssueRequest, db: Session = Depends(get_db)):
    """Dedicated Issue Book workflow endpoint."""
    ref_date = get_reference_date(db)
    loan = issue_book(db, request)
    return LoanResponse(**enrich_loan_response(loan, ref_date))

@router.post("/{loan_id}/return", response_model=LoanResponse)
def return_loan(loan_id: str, request: Optional[LoanReturnRequest] = None, db: Session = Depends(get_db)):
    """Dedicated Return Book workflow endpoint."""
    ref_date = get_reference_date(db)
    loan = return_book(db, loan_id, request)
    return LoanResponse(**enrich_loan_response(loan, ref_date))

@router.get("/{loan_id}", response_model=LoanResponse)
def get_loan(loan_id: str, db: Session = Depends(get_db)):
    """Retrieves a single borrowing transaction by Loan ID."""
    ref_date = get_reference_date(db)
    loan = db.query(Loan).filter(Loan.loan_id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan transaction not found.")
    return LoanResponse(**enrich_loan_response(loan, ref_date))

@router.put("/{loan_id}", response_model=LoanResponse)
def modify_loan(loan_id: str, payload: LoanUpdate, db: Session = Depends(get_db)):
    """Modifies an existing borrowing transaction record."""
    ref_date = get_reference_date(db)
    loan = update_loan(db, loan_id, payload)
    return LoanResponse(**enrich_loan_response(loan, ref_date))

@router.delete("/{loan_id}")
def remove_loan(loan_id: str, db: Session = Depends(get_db)):
    """Deletes a borrowing transaction record."""
    delete_loan(db, loan_id)
    return {"message": f"Loan record '{loan_id}' successfully deleted."}
