import io
import csv
import json
from datetime import date
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models import Book, Loan
from app.utils.loan_record import LoanRecord
from app.utils.date_utils import get_reference_date
from app.services.analytics_service import (
    get_overview_statistics,
    get_category_analysis,
    get_monthly_analysis,
    get_duration_analysis,
    get_loans_dataframe
)
from app.services.validation_service import audit_database_data

def generate_loans_csv(db: Session) -> str:
    """Generates CSV of all loan records in standard schema."""
    ref_date = get_reference_date(db)
    loans = db.query(Loan).order_by(Loan.id.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Loan ID", "Book ID", "Book Title", "Category", 
        "Student ID", "Borrow Date", "Due Date", "Return Date", 
        "Loan Duration", "Status", "Days Overdue"
    ])

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
        d = rec.to_dict(ref_date)
        writer.writerow([
            d["loan_id"],
            d["book_id"],
            d["book_title"],
            d["category"],
            d["student_id"],
            d["borrow_date"],
            d["due_date"],
            d["return_date"] or "",
            d["loan_duration"] if d["loan_duration"] is not None else "",
            d["status"],
            d["days_overdue"]
        ])

    return output.getvalue()

def generate_overdue_csv(db: Session) -> str:
    """Generates CSV of currently overdue and returned-late books."""
    ref_date = get_reference_date(db)
    loans = db.query(Loan).all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Record Type", "Loan ID", "Book ID", "Book Title", "Category", 
        "Student ID", "Borrow Date", "Due Date", "Return Date", "Days Overdue / Late"
    ])

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
        if rec.is_overdue(ref_date):
            writer.writerow([
                "Currently Overdue",
                rec.loan_id,
                rec.book_id,
                rec.book_title,
                rec.category,
                rec.student_id,
                rec.borrow_date,
                rec.due_date,
                "",
                rec.get_days_overdue(ref_date)
            ])
        elif rec.is_returned_late():
            writer.writerow([
                "Returned Late",
                rec.loan_id,
                rec.book_id,
                rec.book_title,
                rec.category,
                rec.student_id,
                rec.borrow_date,
                rec.due_date,
                rec.return_date,
                rec.get_days_overdue(ref_date)
            ])

    return output.getvalue()

def generate_summary_json(db: Session) -> Dict[str, Any]:
    """Generates structured JSON analytics summary as required by specification."""
    ref_date = get_reference_date(db)
    overview = get_overview_statistics(db)
    category_data = get_category_analysis(db)
    monthly_data = get_monthly_analysis(db)
    duration_data = get_duration_analysis(db)

    return {
        "report_title": "Library Circulation and Demand Analytics Summary",
        "generated_date": str(ref_date),
        "total_loans": overview.total_loans,
        "active_loans": overview.active_loans,
        "overdue_count": overview.overdue_books,
        "total_books_inventory": overview.total_books,
        "total_categories": overview.total_categories,
        "average_loan_duration_days": overview.average_loan_duration,
        "category_summary": {
            "highest_demand_category": category_data.highest_category,
            "lowest_demand_category": category_data.lowest_category,
            "breakdown": [c.model_dump() for c in category_data.categories]
        },
        "monthly_summary": {
            "highest_month": monthly_data.highest_month,
            "lowest_month": monthly_data.lowest_month,
            "trends": [m.model_dump() for m in monthly_data.trends]
        },
        "loan_duration_statistics": {
            "average_duration_days": duration_data.average_duration,
            "minimum_duration_days": duration_data.min_duration,
            "maximum_duration_days": duration_data.max_duration,
            "most_common_range": duration_data.most_common_range,
            "distribution": [d.model_dump() for d in duration_data.distribution],
            "completed_loans_analyzed": duration_data.completed_loans_count
        }
    }

def generate_validation_csv(db: Session) -> str:
    """Generates CSV of the data quality audit issues."""
    summary = audit_database_data(db)

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Row Number", "Loan ID", "Field", "Issue Type", "Severity", "Message"])

    for issue in summary.issues:
        writer.writerow([
            issue.row_number or "N/A",
            issue.loan_id or "N/A",
            issue.field,
            issue.issue_type,
            issue.severity,
            issue.message
        ])

    return output.getvalue()
