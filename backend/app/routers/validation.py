from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ValidationSummary
from app.services.validation_service import audit_database_data

router = APIRouter(prefix="/api/validation", tags=["Data Quality Validation"])

@router.get("", response_model=ValidationSummary)
def get_validation_report(db: Session = Depends(get_db)):
    """Runs data quality verification against all existing loan records in the database."""
    return audit_database_data(db)

@router.post("/check", response_model=ValidationSummary)
def trigger_validation_check(db: Session = Depends(get_db)):
    """Manually triggers a full data quality validation audit."""
    return audit_database_data(db)
