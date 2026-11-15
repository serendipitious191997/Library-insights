from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Loan
from app.utils.loan_record import LoanRecord
from app.utils.date_utils import get_reference_date
from app.schemas import (
    OverviewStats,
    CategoryAnalysis,
    MonthlyAnalysis,
    DurationAnalysis,
    DemandInsightsResponse,
    OverdueItem,
    ReturnedLateItem
)
from app.services.analytics_service import (
    get_overview_statistics,
    get_category_analysis,
    get_monthly_analysis,
    get_duration_analysis,
    get_demand_insights
)

router = APIRouter(tags=["Analytics & Overdue"])

@router.get("/api/analytics/overview", response_model=OverviewStats)
def get_dashboard_overview(db: Session = Depends(get_db)):
    """Provides high-level KPI indicators and recent activities for the Overview Dashboard."""
    return get_overview_statistics(db)

@router.get("/api/analytics/categories", response_model=CategoryAnalysis)
def get_category_metrics(db: Session = Depends(get_db)):
    """Computes category-wise borrowing counts, percentages, and peak categories via Pandas."""
    return get_category_analysis(db)

@router.get("/api/analytics/monthly", response_model=MonthlyAnalysis)
def get_monthly_metrics(year: Optional[int] = Query(None, description="Filter by Year"), db: Session = Depends(get_db)):
    """Computes monthly borrowing trends and identifies seasonal peaks and troughs via Pandas."""
    return get_monthly_analysis(db, year)

@router.get("/api/analytics/duration", response_model=DurationAnalysis)
def get_duration_metrics(db: Session = Depends(get_db)):
    """Calculates loan duration distribution across 5 groups (1-5, 6-10, 11-15, 16-20, >20)."""
    return get_duration_analysis(db)

@router.get("/api/analytics/insights", response_model=DemandInsightsResponse)
def get_insights_and_suggestions(db: Session = Depends(get_db)):
    """Generates automated statistical insights and resource allocation suggestions."""
    return get_demand_insights(db)

@router.get("/api/overdue", response_model=List[OverdueItem])
def get_currently_overdue(
    student_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    min_days_overdue: Optional[int] = Query(None, ge=1),
    db: Session = Depends(get_db)
):
    """Retrieves all currently unreturned books where reference_date > due_date."""
    ref_date = get_reference_date(db)
    loans = db.query(Loan).filter(Loan.return_date == None).all()

    overdue_list = []
    for l in loans:
        rec = LoanRecord(
            loan_id=l.loan_id,
            book_id=l.book_id,
            book_title=l.book_title,
            category=l.category,
            student_id=l.student_id,
            borrow_date=l.borrow_date,
            due_date=l.due_date,
            return_date=None,
            status=l.status
        )
        if rec.is_overdue(ref_date):
            days_overdue = rec.get_days_overdue(ref_date)
            
            # Apply filters
            if student_id and student_id.lower() not in l.student_id.lower():
                continue
            if category and category != "All" and l.category != category:
                continue
            if min_days_overdue and days_overdue < min_days_overdue:
                continue

            overdue_list.append(OverdueItem(
                loan_id=l.loan_id,
                book_title=l.book_title,
                category=l.category,
                student_id=l.student_id,
                borrow_date=l.borrow_date,
                due_date=l.due_date,
                days_overdue=days_overdue,
                status="Overdue"
            ))

    return sorted(overdue_list, key=lambda x: x.days_overdue, reverse=True)

@router.get("/api/overdue/returned-late", response_model=List[ReturnedLateItem])
def get_returned_late(
    student_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieves all returned transactions where return_date > due_date."""
    loans = db.query(Loan).filter(Loan.return_date != None).all()

    late_list = []
    for l in loans:
        rec = LoanRecord(
            loan_id=l.loan_id,
            book_id=l.book_id,
            book_title=l.book_title,
            category=l.category,
            student_id=l.student_id,
            borrow_date=l.borrow_date,
            due_date=l.due_date,
            return_date=l.return_date,
            status=l.status
        )
        if rec.is_returned_late():
            # Filters
            if student_id and student_id.lower() not in l.student_id.lower():
                continue
            if category and category != "All" and l.category != category:
                continue

            late_list.append(ReturnedLateItem(
                loan_id=l.loan_id,
                book_title=l.book_title,
                category=l.category,
                student_id=l.student_id,
                due_date=l.due_date,
                return_date=l.return_date,
                days_late=rec.get_days_overdue(),
                loan_duration=l.loan_duration
            ))

    return sorted(late_list, key=lambda x: x.days_late, reverse=True)
