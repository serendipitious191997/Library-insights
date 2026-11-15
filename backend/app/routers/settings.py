import os
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db, DB_PATH
from app.models import Setting, Book, Loan
from app.schemas import SettingResponse, SettingUpdate
from app.utils.sample_seeder import seed_sample_database
from app.utils.date_utils import get_reference_date

router = APIRouter(prefix="/api/settings", tags=["Application Settings"])

@router.get("", response_model=SettingResponse)
def get_settings(db: Session = Depends(get_db)):
    """Retrieves current application settings and system stats."""
    setting = db.query(Setting).first()
    if not setting:
        seed_sample_database(db)
        setting = db.query(Setting).first()

    total_books = db.query(Book).count()
    total_loans = db.query(Loan).count()
    effective_date = get_reference_date(db)

    return SettingResponse(
        id=setting.id,
        library_name=setting.library_name,
        admin_name=setting.admin_name,
        default_loan_days=setting.default_loan_days,
        reference_date=setting.reference_date,
        effective_date=str(effective_date),
        theme=setting.theme or "dark",
        total_books=total_books,
        total_loans=total_loans,
        database_file=os.path.basename(DB_PATH)
    )

@router.put("", response_model=SettingResponse)
def update_settings(payload: SettingUpdate, db: Session = Depends(get_db)):
    """Updates library configuration parameters."""
    setting = db.query(Setting).first()
    if not setting:
        setting = Setting()
        db.add(setting)

    if payload.library_name is not None:
        setting.library_name = payload.library_name.strip()
    if payload.admin_name is not None:
        setting.admin_name = payload.admin_name.strip()
    if payload.default_loan_days is not None:
        setting.default_loan_days = payload.default_loan_days
    if payload.reference_date is not None:
        setting.reference_date = payload.reference_date.strip() if payload.reference_date.strip() else None
    if payload.theme is not None:
        setting.theme = payload.theme

    db.commit()
    db.refresh(setting)

    total_books = db.query(Book).count()
    total_loans = db.query(Loan).count()
    effective_date = get_reference_date(db)

    return SettingResponse(
        id=setting.id,
        library_name=setting.library_name,
        admin_name=setting.admin_name,
        default_loan_days=setting.default_loan_days,
        reference_date=setting.reference_date,
        effective_date=str(effective_date),
        theme=setting.theme,
        total_books=total_books,
        total_loans=total_loans,
        database_file=os.path.basename(DB_PATH)
    )

@router.post("/reset-data")
def reset_sample_dataset(db: Session = Depends(get_db)):
    """Resets the entire database to the clean initial college project sample dataset."""
    try:
        seed_sample_database(db, force=True)
        return {
            "message": "Library dataset has been successfully reset to the standard 50-record college demonstration benchmark.",
            "success": True
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset dataset: {str(e)}"
        )
