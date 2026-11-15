import re
from sqlalchemy.orm import Session
from app.models import Book, Loan

def generate_book_id(db: Session) -> str:
    """Generates the next sequential Book ID like BK-101, BK-102..."""
    books = db.query(Book.book_id).all()
    max_num = 100
    for (b_id,) in books:
        if b_id:
            match = re.search(r'\d+', str(b_id))
            if match:
                num = int(match.group())
                if num > max_num:
                    max_num = num
    return f"BK-{max_num + 1}"

def generate_loan_id(db: Session) -> str:
    """Generates the next sequential Loan ID like LN-1001, LN-1002..."""
    loans = db.query(Loan.loan_id).all()
    max_num = 1000
    for (l_id,) in loans:
        if l_id:
            match = re.search(r'\d+', str(l_id))
            if match:
                num = int(match.group())
                if num > max_num:
                    max_num = num
    return f"LN-{max_num + 1}"
