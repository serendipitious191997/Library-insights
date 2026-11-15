from fastapi import APIRouter, Depends
from fastapi.responses import Response, JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.export_service import (
    generate_loans_csv,
    generate_overdue_csv,
    generate_summary_json,
    generate_validation_csv
)

router = APIRouter(tags=["Reports & Exports"])

@router.get("/api/export/loans/csv")
def export_loans_csv(db: Session = Depends(get_db)):
    """Exports all loan transactions as a standard CSV file."""
    csv_data = generate_loans_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=library_loans_export.csv"}
    )

@router.get("/api/export/summary/json")
def export_summary_json(db: Session = Depends(get_db)):
    """Exports circulation analytics and KPIs as a structured JSON file."""
    data = generate_summary_json(db)
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": "attachment; filename=library_analytics_summary.json"}
    )

@router.get("/api/export/overdue/csv")
def export_overdue_csv(db: Session = Depends(get_db)):
    """Exports overdue and returned-late transactions as a CSV file."""
    csv_data = generate_overdue_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=overdue_loans_report.csv"}
    )

@router.get("/api/export/validation/csv")
def export_validation_csv(db: Session = Depends(get_db)):
    """Exports the data quality validation audit as a CSV file."""
    csv_data = generate_validation_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=data_validation_report.csv"}
    )

@router.get("/api/reports/printable")
def get_printable_report_data(db: Session = Depends(get_db)):
    """Returns full data package for rendering the browser printable report."""
    return generate_summary_json(db)
