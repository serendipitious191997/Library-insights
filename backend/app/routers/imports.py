from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ImportPreviewResponse, ImportConfirmRequest, ImportConfirmResponse
from app.services.csv_service import preview_csv_content, import_records_transaction

router = APIRouter(prefix="/api/import", tags=["CSV Import"])

@router.post("/preview", response_model=ImportPreviewResponse)
async def preview_csv_upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Uploads a CSV file, parses it with Pandas, validates columns and dates,
    and returns a preview of the first 10 records with identified issues.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a standard comma-separated (.csv) file."
        )

    # 5MB size limit check
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 5 MB limit."
        )

    return preview_csv_content(contents, file.filename, db)

@router.post("/confirm", response_model=ImportConfirmResponse)
def confirm_import(
    payload: ImportConfirmRequest,
    db: Session = Depends(get_db)
):
    """Imports validated records into SQLite within an atomic database transaction."""
    return import_records_transaction(payload.records, payload.import_valid_only, db)
