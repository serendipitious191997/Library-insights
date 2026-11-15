from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict

# ----------------- BOOK SCHEMAS -----------------
class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    publisher: Optional[str] = Field(None, max_length=255)
    total_copies: int = Field(..., ge=1)
    available_copies: Optional[int] = Field(None, ge=0)

    @field_validator("available_copies")
    @classmethod
    def validate_available_copies(cls, v, values):
        if v is not None and "total_copies" in values.data:
            if v > values.data["total_copies"]:
                raise ValueError("Available copies cannot exceed total copies.")
        return v

class BookCreate(BookBase):
    book_id: Optional[str] = None

class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    publisher: Optional[str] = None
    total_copies: Optional[int] = Field(None, ge=1)
    available_copies: Optional[int] = Field(None, ge=0)

class BookResponse(BaseModel):
    id: int
    book_id: str
    title: str
    author: str
    category: str
    publisher: Optional[str] = None
    total_copies: int
    available_copies: int
    issued_copies: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ----------------- LOAN SCHEMAS -----------------
class LoanIssueRequest(BaseModel):
    book_id: str
    student_id: str
    borrow_date: Optional[date] = None
    due_date: Optional[date] = None

class LoanReturnRequest(BaseModel):
    return_date: Optional[date] = None

class LoanCreate(BaseModel):
    loan_id: Optional[str] = None
    book_id: str
    student_id: str
    borrow_date: date
    due_date: date
    return_date: Optional[date] = None
    status: Optional[str] = "Active"

class LoanUpdate(BaseModel):
    book_id: Optional[str] = None
    student_id: Optional[str] = None
    borrow_date: Optional[date] = None
    due_date: Optional[date] = None
    return_date: Optional[date] = None
    status: Optional[str] = None

class LoanResponse(BaseModel):
    id: int
    loan_id: str
    book_id: str
    book_title: str
    category: str
    student_id: str
    borrow_date: date
    due_date: date
    return_date: Optional[date] = None
    loan_duration: Optional[int] = None
    status: str
    days_overdue: int = 0
    is_overdue: bool = False
    is_returned_late: bool = False
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ----------------- OVERDUE SCHEMAS -----------------
class OverdueItem(BaseModel):
    loan_id: str
    book_title: str
    category: str
    student_id: str
    borrow_date: date
    due_date: date
    days_overdue: int
    status: str

class ReturnedLateItem(BaseModel):
    loan_id: str
    book_title: str
    category: str
    student_id: str
    due_date: date
    return_date: date
    days_late: int
    loan_duration: Optional[int] = None

# ----------------- ANALYTICS SCHEMAS -----------------
class OverviewStats(BaseModel):
    total_loans: int
    active_loans: int
    overdue_books: int
    total_books: int
    total_categories: int
    average_loan_duration: float
    recent_activities: List[LoanResponse]

class CategoryStat(BaseModel):
    category: str
    count: int
    percentage: float

class CategoryAnalysis(BaseModel):
    categories: List[CategoryStat]
    highest_category: Optional[str] = None
    highest_count: int = 0
    lowest_category: Optional[str] = None
    lowest_count: int = 0
    total_loans: int = 0

class MonthlyStat(BaseModel):
    month_key: str  # YYYY-MM
    month_name: str
    year: int
    count: int

class MonthlyAnalysis(BaseModel):
    trends: List[MonthlyStat]
    highest_month: Optional[str] = None
    highest_count: int = 0
    lowest_month: Optional[str] = None
    lowest_count: int = 0
    available_years: List[int]

class DurationDistributionBin(BaseModel):
    range_label: str
    count: int
    percentage: float

class DurationAnalysis(BaseModel):
    average_duration: float
    min_duration: int
    max_duration: int
    most_common_range: str
    distribution: List[DurationDistributionBin]
    completed_loans_count: int
    active_loans_count: int

class ResourceSuggestion(BaseModel):
    book_id: Optional[str] = None
    title: Optional[str] = None
    category: str
    suggestion_type: str  # "Increase Copies", "Low Demand", "Optimal"
    message: str

class DemandInsightsResponse(BaseModel):
    insights: List[str]
    resource_suggestions: List[ResourceSuggestion]

# ----------------- VALIDATION & IMPORT SCHEMAS -----------------
class ValidationIssue(BaseModel):
    row_number: Optional[int] = None
    loan_id: Optional[str] = None
    field: str
    issue_type: str
    message: str
    severity: str = "error"  # error, warning

class ValidationSummary(BaseModel):
    total_checked: int
    valid_records: int
    invalid_records: int
    duplicate_records: int
    incomplete_records: int
    issues: List[ValidationIssue]

class ImportPreviewResponse(BaseModel):
    filename: str
    total_rows: int
    valid_rows_count: int
    invalid_rows_count: int
    preview_rows: List[Dict[str, Any]]
    issues: List[ValidationIssue]
    can_import: bool

class ImportConfirmRequest(BaseModel):
    import_valid_only: bool = True
    records: List[Dict[str, Any]]

class ImportConfirmResponse(BaseModel):
    imported_count: int
    skipped_count: int
    message: str

# ----------------- SETTINGS SCHEMAS -----------------
class SettingUpdate(BaseModel):
    library_name: Optional[str] = None
    admin_name: Optional[str] = None
    default_loan_days: Optional[int] = Field(None, ge=1, le=180)
    reference_date: Optional[str] = None
    theme: Optional[str] = None

class SettingResponse(BaseModel):
    id: int
    library_name: str
    admin_name: str
    default_loan_days: int
    reference_date: Optional[str] = None
    effective_date: str
    theme: str
    total_books: int
    total_loans: int
    database_file: str

    model_config = ConfigDict(from_attributes=True)
