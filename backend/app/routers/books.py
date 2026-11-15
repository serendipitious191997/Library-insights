from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Book, Loan
from app.schemas import BookCreate, BookUpdate, BookResponse
from app.utils.id_generator import generate_book_id

router = APIRouter(prefix="/api/books", tags=["Books & Inventory"])

@router.get("", response_model=List[BookResponse])
def get_books(
    search: Optional[str] = Query(None, description="Search by Book ID, Title, or Author"),
    category: Optional[str] = Query(None, description="Filter by Category"),
    sort_by: Optional[str] = Query("title", description="Sort field: title, book_id, available_copies"),
    order: Optional[str] = Query("asc", description="Sort order: asc, desc"),
    db: Session = Depends(get_db)
):
    """Retrieves all book inventory records with search, filter, and sort capabilities."""
    query = db.query(Book)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Book.title.ilike(s),
                Book.book_id.ilike(s),
                Book.author.ilike(s)
            )
        )

    if category and category != "All":
        query = query.filter(Book.category == category)

    # Sorting
    sort_attr = getattr(Book, sort_by, Book.title)
    if order.lower() == "desc":
        query = query.order_by(sort_attr.desc())
    else:
        query = query.order_by(sort_attr.asc())

    books = query.all()
    # Map to response schema
    return [
        BookResponse(
            id=b.id,
            book_id=b.book_id,
            title=b.title,
            author=b.author,
            category=b.category,
            publisher=b.publisher,
            total_copies=b.total_copies,
            available_copies=b.available_copies,
            issued_copies=b.issued_copies,
            created_at=b.created_at
        ) for b in books
    ]

@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(book_in: BookCreate, db: Session = Depends(get_db)):
    """Creates a new book inventory record."""
    book_id = book_in.book_id.strip() if book_in.book_id else generate_book_id(db)

    # Check unique
    existing = db.query(Book).filter(Book.book_id == book_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Book with ID '{book_id}' already exists."
        )

    total_copies = book_in.total_copies
    available_copies = book_in.available_copies if book_in.available_copies is not None else total_copies

    if available_copies > total_copies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Available copies cannot exceed total copies."
        )

    book = Book(
        book_id=book_id,
        title=book_in.title.strip(),
        author=book_in.author.strip(),
        category=book_in.category.strip(),
        publisher=book_in.publisher.strip() if book_in.publisher else None,
        total_copies=total_copies,
        available_copies=available_copies
    )
    db.add(book)
    db.commit()
    db.refresh(book)

    return BookResponse(
        id=book.id,
        book_id=book.book_id,
        title=book.title,
        author=book.author,
        category=book.category,
        publisher=book.publisher,
        total_copies=book.total_copies,
        available_copies=book.available_copies,
        issued_copies=book.issued_copies,
        created_at=book.created_at
    )

@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: str, db: Session = Depends(get_db)):
    """Retrieves a single book by ID."""
    book = db.query(Book).filter(Book.book_id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")
    return BookResponse(
        id=book.id,
        book_id=book.book_id,
        title=book.title,
        author=book.author,
        category=book.category,
        publisher=book.publisher,
        total_copies=book.total_copies,
        available_copies=book.available_copies,
        issued_copies=book.issued_copies,
        created_at=book.created_at
    )

@router.put("/{book_id}", response_model=BookResponse)
def update_book(book_id: str, payload: BookUpdate, db: Session = Depends(get_db)):
    """Updates book information and copy counts."""
    book = db.query(Book).filter(Book.book_id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    if payload.title is not None:
        book.title = payload.title.strip()
    if payload.author is not None:
        book.author = payload.author.strip()
    if payload.category is not None:
        book.category = payload.category.strip()
    if payload.publisher is not None:
        book.publisher = payload.publisher.strip()
    if payload.total_copies is not None:
        book.total_copies = payload.total_copies
    if payload.available_copies is not None:
        book.available_copies = payload.available_copies

    if book.available_copies > book.total_copies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Available copies cannot exceed total copies."
        )

    db.commit()
    db.refresh(book)

    return BookResponse(
        id=book.id,
        book_id=book.book_id,
        title=book.title,
        author=book.author,
        category=book.category,
        publisher=book.publisher,
        total_copies=book.total_copies,
        available_copies=book.available_copies,
        issued_copies=book.issued_copies,
        created_at=book.created_at
    )

@router.delete("/{book_id}")
def delete_book(book_id: str, db: Session = Depends(get_db)):
    """Deletes a book from inventory. Rejects deletion if active loans exist."""
    book = db.query(Book).filter(Book.book_id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    # Check for active loans
    active_loans = db.query(Loan).filter(
        Loan.book_id == book_id,
        Loan.status != "Returned",
        Loan.return_date == None
    ).count()

    if active_loans > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete book '{book.title}' because it has {active_loans} active unreturned loan(s). All copies must be returned first."
        )

    db.delete(book)
    db.commit()
    return {"message": f"Book '{book_id}' successfully removed from inventory."}
