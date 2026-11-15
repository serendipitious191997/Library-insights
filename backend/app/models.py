from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    publisher = Column(String(255), nullable=True)
    total_copies = Column(Integer, nullable=False, default=1)
    available_copies = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    loans = relationship("Loan", back_populates="book", foreign_keys="Loan.book_id")

    @property
    def issued_copies(self) -> int:
        return max(0, (self.total_copies or 0) - (self.available_copies or 0))


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(String(50), unique=True, index=True, nullable=False)
    book_id = Column(String(50), ForeignKey("books.book_id"), nullable=False, index=True)
    book_title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    student_id = Column(String(50), nullable=False, index=True)
    borrow_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    return_date = Column(Date, nullable=True)
    loan_duration = Column(Integer, nullable=True)
    status = Column(String(20), nullable=False, default="Active")  # Active, Returned, Overdue
    created_at = Column(DateTime, default=datetime.utcnow)

    book = relationship("Book", back_populates="loans", foreign_keys=[book_id], primaryjoin="Loan.book_id==Book.book_id")


class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    library_name = Column(String(255), default="University Central Library")
    admin_name = Column(String(100), default="Chief Librarian")
    default_loan_days = Column(Integer, default=14)
    reference_date = Column(String(20), nullable=True, default=None)  # YYYY-MM-DD or null for system date
    theme = Column(String(50), default="dark")
