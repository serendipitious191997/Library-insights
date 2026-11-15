from datetime import date, datetime
from typing import Optional, Union
from sqlalchemy.orm import Session
from app.models import Setting

COMMON_DATE_FORMATS = [
    "%Y-%m-%d",
    "%d-%m-%Y",
    "%d/%m/%Y",
    "%m/%d/%Y",
    "%Y/%m/%d",
    "%Y.%m.%d",
    "%d.%m.%Y",
    "%b %d, %Y",
    "%d %b %Y",
]

def parse_date_safe(val: Optional[Union[date, datetime, str]]) -> Optional[date]:
    """Safely normalizes various date inputs into a python date object."""
    if val is None:
        return None
    if isinstance(val, date) and not isinstance(val, datetime):
        return val
    if isinstance(val, datetime):
        return val.date()
    
    val_str = str(val).strip()
    if not val_str or val_str.lower() in ("nan", "none", "null", "nat", ""):
        return None
    
    # Try common formats
    for fmt in COMMON_DATE_FORMATS:
        try:
            return datetime.strptime(val_str, fmt).date()
        except ValueError:
            continue
            
    # Try ISO format
    try:
        return datetime.fromisoformat(val_str.replace("Z", "")).date()
    except (ValueError, TypeError):
        pass

    return None

def format_date_iso(val: Optional[Union[date, datetime, str]]) -> Optional[str]:
    """Formats a date object or string into standard YYYY-MM-DD."""
    d = parse_date_safe(val)
    return d.strftime("%Y-%m-%d") if d else None

def get_reference_date(db: Optional[Session] = None) -> date:
    """
    Returns the configured reference date if set in settings,
    otherwise returns date.today(). This provides deterministic demo calculations
    when inspecting sample datasets.
    """
    if db:
        setting = db.query(Setting).first()
        if setting and setting.reference_date:
            parsed = parse_date_safe(setting.reference_date)
            if parsed:
                return parsed
    return date.today()
