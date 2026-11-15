"""
Sample Dataset Seeder for Library Circulation and Demand Dashboard.
Accurately reproduces the exact figures specified in the College Project Report:
- Total borrowing records: 50
- Computer Science: 16 loans
- Mathematics: 12 loans
- Electronics: 9 loans
- Physics: 6 loans
- Mechanical Engineering: 4 loans
- Chemistry: 3 loans
- January: 10 loans
- March: 14 loans
- April: 14 loans
- February: 8 loans
- May: 4 loans
- Most common duration: 6–10 days with 20 records
- Completed loans: 44, Active: 3, Overdue: 3
- Multiple copies per book in inventory
- Reference date: 2026-05-15 (or configurable)
"""

import os
import csv
from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.models import Book, Loan, Setting
from app.utils.loan_record import LoanRecord

SAMPLE_BOOKS = [
    # Computer Science (16 loans needed)
    {"book_id": "BK-101", "title": "Introduction to Algorithms", "author": "Thomas H. Cormen", "category": "Computer Science", "publisher": "MIT Press", "total_copies": 8, "available_copies": 7},
    {"book_id": "BK-102", "title": "Clean Code: A Handbook of Agile Software", "author": "Robert C. Martin", "category": "Computer Science", "publisher": "Prentice Hall", "total_copies": 6, "available_copies": 5},
    {"book_id": "BK-103", "title": "Operating System Concepts", "author": "Abraham Silberschatz", "category": "Computer Science", "publisher": "Wiley", "total_copies": 7, "available_copies": 6},
    {"book_id": "BK-104", "title": "Database System Concepts", "author": "Henry F. Korth", "category": "Computer Science", "publisher": "McGraw-Hill", "total_copies": 6, "available_copies": 5},
    {"book_id": "BK-105", "title": "Python Crash Course", "author": "Eric Matthes", "category": "Computer Science", "publisher": "No Starch Press", "total_copies": 5, "available_copies": 5},

    # Mathematics (12 loans needed)
    {"book_id": "BK-106", "title": "Higher Engineering Mathematics", "author": "B.S. Grewal", "category": "Mathematics", "publisher": "Khanna Publishers", "total_copies": 8, "available_copies": 7},
    {"book_id": "BK-107", "title": "Linear Algebra and Its Applications", "author": "Gilbert Strang", "category": "Mathematics", "publisher": "Cengage", "total_copies": 6, "available_copies": 5},
    {"book_id": "BK-108", "title": "Discrete Mathematics and Its Applications", "author": "Kenneth H. Rosen", "category": "Mathematics", "publisher": "McGraw-Hill", "total_copies": 5, "available_copies": 5},
    {"book_id": "BK-109", "title": "Advanced Engineering Mathematics", "author": "Erwin Kreyszig", "category": "Mathematics", "publisher": "Wiley", "total_copies": 7, "available_copies": 7},

    # Electronics (9 loans needed)
    {"book_id": "BK-110", "title": "Digital Logic and Computer Design", "author": "M. Morris Mano", "category": "Electronics", "publisher": "Pearson", "total_copies": 6, "available_copies": 5},
    {"book_id": "BK-111", "title": "Electronic Devices and Circuit Theory", "author": "Robert L. Boylestad", "category": "Electronics", "publisher": "Pearson", "total_copies": 5, "available_copies": 4},
    {"book_id": "BK-112", "title": "Microelectronic Circuits", "author": "Adel S. Sedra", "category": "Electronics", "publisher": "Oxford Press", "total_copies": 5, "available_copies": 5},

    # Physics (6 loans needed)
    {"book_id": "BK-113", "title": "Concepts of Modern Physics", "author": "Arthur Beiser", "category": "Physics", "publisher": "McGraw-Hill", "total_copies": 6, "available_copies": 5},
    {"book_id": "BK-114", "title": "Fundamentals of Physics", "author": "Halliday & Resnick", "category": "Physics", "publisher": "Wiley", "total_copies": 6, "available_copies": 6},

    # Mechanical Engineering (4 loans needed)
    {"book_id": "BK-115", "title": "Theory of Machines and Mechanisms", "author": "John J. Uicker", "category": "Mechanical Engineering", "publisher": "Oxford", "total_copies": 5, "available_copies": 4},
    {"book_id": "BK-116", "title": "Engineering Thermodynamics", "author": "P.K. Nag", "category": "Mechanical Engineering", "publisher": "McGraw-Hill", "total_copies": 4, "available_copies": 4},

    # Chemistry (3 loans needed)
    {"book_id": "BK-117", "title": "Engineering Chemistry", "author": "P.C. Jain", "category": "Chemistry", "publisher": "Dhanpat Rai", "total_copies": 5, "available_copies": 5},
    {"book_id": "BK-118", "title": "Physical Chemistry", "author": "Peter Atkins", "category": "Chemistry", "publisher": "Oxford", "total_copies": 4, "available_copies": 4},
]

# 50 Detailed realistic loan records matching all college project criteria
RAW_LOAN_SPECS = [
    # --- JANUARY (10 loans: 4 CS, 3 Math, 2 Electronics, 1 Physics) ---
    ("LN-1001", "BK-101", "Introduction to Algorithms", "Computer Science", "STU-1001", "2026-01-05", "2026-01-19", "2026-01-12"), # dur 7 (bin 6-10) [1]
    ("LN-1002", "BK-106", "Higher Engineering Mathematics", "Mathematics", "STU-1002", "2026-01-07", "2026-01-21", "2026-01-15"), # dur 8 (bin 6-10) [2]
    ("LN-1003", "BK-110", "Digital Logic and Computer Design", "Electronics", "STU-1003", "2026-01-08", "2026-01-22", "2026-01-17"), # dur 9 (bin 6-10) [3]
    ("LN-1004", "BK-102", "Clean Code: A Handbook of Agile Software", "Computer Science", "STU-1004", "2026-01-10", "2026-01-24", "2026-01-14"), # dur 4 (bin 1-5) [1]
    ("LN-1005", "BK-113", "Concepts of Modern Physics", "Physics", "STU-1005", "2026-01-12", "2026-01-26", "2026-01-22"), # dur 10 (bin 6-10) [4]
    ("LN-1006", "BK-107", "Linear Algebra and Its Applications", "Mathematics", "STU-1006", "2026-01-15", "2026-01-29", "2026-01-23"), # dur 8 (bin 6-10) [5]
    ("LN-1007", "BK-103", "Operating System Concepts", "Computer Science", "STU-1007", "2026-01-18", "2026-02-01", "2026-01-30"), # dur 12 (bin 11-15) [1]
    ("LN-1008", "BK-111", "Electronic Devices and Circuit Theory", "Electronics", "STU-1008", "2026-01-20", "2026-02-03", "2026-01-26"), # dur 6 (bin 6-10) [6]
    ("LN-1009", "BK-108", "Discrete Mathematics and Its Applications", "Mathematics", "STU-1009", "2026-01-22", "2026-02-05", "2026-02-08"), # dur 17 (late by 3, bin 16-20) [1]
    ("LN-1010", "BK-104", "Database System Concepts", "Computer Science", "STU-1010", "2026-01-25", "2026-02-08", "2026-01-28"), # dur 3 (bin 1-5) [2]

    # --- FEBRUARY (8 loans: 2 CS, 2 Math, 1 Electronics, 1 Physics, 1 Mech, 1 Chem) ---
    ("LN-1011", "BK-101", "Introduction to Algorithms", "Computer Science", "STU-1011", "2026-02-02", "2026-02-16", "2026-02-09"), # dur 7 (bin 6-10) [7]
    ("LN-1012", "BK-115", "Theory of Machines and Mechanisms", "Mechanical Engineering", "STU-1012", "2026-02-04", "2026-02-18", "2026-02-12"), # dur 8 (bin 6-10) [8]
    ("LN-1013", "BK-106", "Higher Engineering Mathematics", "Mathematics", "STU-1013", "2026-02-06", "2026-02-20", "2026-02-15"), # dur 9 (bin 6-10) [9]
    ("LN-1014", "BK-117", "Engineering Chemistry", "Chemistry", "STU-1014", "2026-02-10", "2026-02-24", "2026-02-14"), # dur 4 (bin 1-5) [3]
    ("LN-1015", "BK-110", "Digital Logic and Computer Design", "Electronics", "STU-1015", "2026-02-12", "2026-02-26", "2026-02-19"), # dur 7 (bin 6-10) [10]
    ("LN-1016", "BK-113", "Concepts of Modern Physics", "Physics", "STU-1016", "2026-02-15", "2026-03-01", "2026-02-28"), # dur 13 (bin 11-15) [2]
    ("LN-1017", "BK-102", "Clean Code: A Handbook of Agile Software", "Computer Science", "STU-1017", "2026-02-18", "2026-03-04", "2026-02-23"), # dur 5 (bin 1-5) [4]
    ("LN-1018", "BK-107", "Linear Algebra and Its Applications", "Mathematics", "STU-1018", "2026-02-22", "2026-03-08", "2026-03-02"), # dur 8 (bin 6-10) [11]

    # --- MARCH (14 loans: 5 CS, 3 Math, 3 Electronics, 1 Physics, 1 Mech, 1 Chem) ---
    ("LN-1019", "BK-101", "Introduction to Algorithms", "Computer Science", "STU-1019", "2026-03-01", "2026-03-15", "2026-03-09"), # dur 8 (bin 6-10) [12]
    ("LN-1020", "BK-106", "Higher Engineering Mathematics", "Mathematics", "STU-1020", "2026-03-02", "2026-03-16", "2026-03-08"), # dur 6 (bin 6-10) [13]
    ("LN-1021", "BK-111", "Electronic Devices and Circuit Theory", "Electronics", "STU-1021", "2026-03-04", "2026-03-18", "2026-03-11"), # dur 7 (bin 6-10) [14]
    ("LN-1022", "BK-103", "Operating System Concepts", "Computer Science", "STU-1022", "2026-03-05", "2026-03-19", "2026-03-08"), # dur 3 (bin 1-5) [5]
    ("LN-1023", "BK-114", "Fundamentals of Physics", "Physics", "STU-1023", "2026-03-07", "2026-03-21", "2026-03-17"), # dur 10 (bin 6-10) [15]
    ("LN-1024", "BK-107", "Linear Algebra and Its Applications", "Mathematics", "STU-1024", "2026-03-09", "2026-03-23", "2026-03-23"), # dur 14 (bin 11-15) [3]
    ("LN-1025", "BK-110", "Digital Logic and Computer Design", "Electronics", "STU-1025", "2026-03-12", "2026-03-26", "2026-03-20"), # dur 8 (bin 6-10) [16]
    ("LN-1026", "BK-104", "Database System Concepts", "Computer Science", "STU-1026", "2026-03-14", "2026-03-28", "2026-03-18"), # dur 4 (bin 1-5) [6]
    ("LN-1027", "BK-115", "Theory of Machines and Mechanisms", "Mechanical Engineering", "STU-1027", "2026-03-16", "2026-03-30", "2026-03-28"), # dur 12 (bin 11-15) [4]
    ("LN-1028", "BK-108", "Discrete Mathematics and Its Applications", "Mathematics", "STU-1028", "2026-03-18", "2026-04-01", "2026-03-25"), # dur 7 (bin 6-10) [17]
    ("LN-1029", "BK-102", "Clean Code: A Handbook of Agile Software", "Computer Science", "STU-1029", "2026-03-20", "2026-04-03", "2026-04-12"), # dur 23 (late by 9, bin >20) [1]
    ("LN-1030", "BK-112", "Microelectronic Circuits", "Electronics", "STU-1030", "2026-03-22", "2026-04-05", "2026-03-27"), # dur 5 (bin 1-5) [7]
    ("LN-1031", "BK-118", "Physical Chemistry", "Chemistry", "STU-1031", "2026-03-25", "2026-04-08", "2026-04-04"), # dur 10 (bin 6-10) [18]
    ("LN-1032", "BK-105", "Python Crash Course", "Computer Science", "STU-1032", "2026-03-28", "2026-04-11", "2026-04-03"), # dur 6 (bin 6-10) [19]

    # --- APRIL (14 loans: 4 CS, 3 Math, 2 Electronics, 2 Physics, 2 Mech, 1 Chem) ---
    ("LN-1033", "BK-101", "Introduction to Algorithms", "Computer Science", "STU-1033", "2026-04-02", "2026-04-16", "2026-04-09"), # dur 7 (bin 6-10) [20 -> Exactly 20 records in 6-10!]
    ("LN-1034", "BK-106", "Higher Engineering Mathematics", "Mathematics", "STU-1034", "2026-04-03", "2026-04-17", "2026-04-16"), # dur 13 (bin 11-15) [5]
    ("LN-1035", "BK-110", "Digital Logic and Computer Design", "Electronics", "STU-1035", "2026-04-05", "2026-04-19", "2026-04-09"), # dur 4 (bin 1-5) [8]
    ("LN-1036", "BK-113", "Concepts of Modern Physics", "Physics", "STU-1036", "2026-04-06", "2026-04-20", "2026-04-24"), # dur 18 (late by 4, bin 16-20) [2]
    ("LN-1037", "BK-102", "Clean Code: A Handbook of Agile Software", "Computer Science", "STU-1037", "2026-04-08", "2026-04-22", "2026-04-19"), # dur 11 (bin 11-15) [6]
    ("LN-1038", "BK-115", "Theory of Machines and Mechanisms", "Mechanical Engineering", "STU-1038", "2026-04-10", "2026-04-24", "2026-05-02"), # dur 22 (late by 8, bin >20) [2]
    ("LN-1039", "BK-107", "Linear Algebra and Its Applications", "Mathematics", "STU-1039", "2026-04-12", "2026-04-26", "2026-04-29"), # dur 17 (late by 3, bin 16-20) [3]
    ("LN-1040", "BK-103", "Operating System Concepts", "Computer Science", "STU-1040", "2026-04-14", "2026-04-28", "2026-04-18"), # dur 4 (bin 1-5) [9]
    ("LN-1041", "BK-111", "Electronic Devices and Circuit Theory", "Electronics", "STU-1041", "2026-04-16", "2026-04-30", "2026-04-28"), # dur 12 (bin 11-15) [7]
    ("LN-1042", "BK-117", "Engineering Chemistry", "Chemistry", "STU-1042", "2026-04-18", "2026-05-02", "2026-04-23"), # dur 5 (bin 1-5) [10]
    ("LN-1043", "BK-109", "Advanced Engineering Mathematics", "Mathematics", "STU-1043", "2026-04-20", "2026-05-04", "2026-05-08"), # dur 18 (late by 4, bin 16-20) [4]
    ("LN-1044", "BK-114", "Fundamentals of Physics", "Physics", "STU-1044", "2026-04-22", "2026-05-06", "2026-05-05"), # dur 13 (bin 11-15) [8]
    ("LN-1045", "BK-116", "Engineering Thermodynamics", "Mechanical Engineering", "STU-1045", "2026-04-24", "2026-05-08", None), # Active Overdue (due May 8, ref May 15)
    ("LN-1046", "BK-104", "Database System Concepts", "Computer Science", "STU-1002", "2026-04-26", "2026-05-10", None), # Active Overdue (due May 10, ref May 15)

    # --- MAY (4 loans: 1 CS, 1 Math, 1 Electronics, 1 Physics) ---
    ("LN-1047", "BK-110", "Digital Logic and Computer Design", "Electronics", "STU-1004", "2026-05-01", "2026-05-15", None), # Active Overdue (due May 15, ref May 15)
    ("LN-1048", "BK-101", "Introduction to Algorithms", "Computer Science", "STU-1006", "2026-05-02", "2026-05-16", None), # Active (due May 16, ref May 15)

    ("LN-1049", "BK-106", "Higher Engineering Mathematics", "Mathematics", "STU-1008", "2026-05-05", "2026-05-19", None), # Active (due May 19, ref May 15)
    ("LN-1050", "BK-113", "Concepts of Modern Physics", "Physics", "STU-1010", "2026-05-08", "2026-05-22", None), # Active (due May 22, ref May 15)
]

def seed_sample_database(db: Session, force: bool = False):
    """Populates the database with initial books, settings, and the 50 college report loans."""
    # Check if already seeded
    if not force:
        existing_loans_count = db.query(Loan).count()
        if existing_loans_count >= 50:
            return  # Already populated

    # Clear existing tables if force
    if force:
        db.query(Loan).delete()
        db.query(Book).delete()
        db.query(Setting).delete()
        db.commit()

    # 1. Seed Setting
    setting = Setting(
        library_name="University Central Library",
        admin_name="Dr. S. Ramanathan (Chief Librarian)",
        default_loan_days=14,
        reference_date="2026-05-15",
        theme="dark"
    )
    db.add(setting)
    db.flush()

    # 2. Seed Books
    book_map = {}
    for b_data in SAMPLE_BOOKS:
        book = Book(**b_data)
        db.add(book)
        book_map[book.book_id] = book

    db.flush()

    # 3. Seed Loans
    for l_id, b_id, title, cat, stu_id, b_date_s, d_date_s, r_date_s in RAW_LOAN_SPECS:
        b_dt = date.fromisoformat(b_date_s)
        d_dt = date.fromisoformat(d_date_s)
        r_dt = date.fromisoformat(r_date_s) if r_date_s else None

        rec = LoanRecord(
            loan_id=l_id,
            book_id=b_id,
            book_title=title,
            category=cat,
            student_id=stu_id,
            borrow_date=b_dt,
            due_date=d_dt,
            return_date=r_dt
        )

        status_str = "Returned" if r_dt else ("Overdue" if rec.is_overdue(date(2026, 5, 15)) else "Active")

        loan = Loan(
            loan_id=l_id,
            book_id=b_id,
            book_title=title,
            category=cat,
            student_id=stu_id,
            borrow_date=b_dt,
            due_date=d_dt,
            return_date=r_dt,
            loan_duration=rec.loan_duration,
            status=status_str
        )
        db.add(loan)

    db.commit()

    # Write CSV version to backend/data/sample_library.csv for manual imports and tests
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
    os.makedirs(data_dir, exist_ok=True)
    csv_file = os.path.join(data_dir, "sample_library.csv")

    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Loan ID", "Book ID", "Book Title", "Category", "Student ID", "Borrow Date", "Due Date", "Return Date"])
        for l_id, b_id, title, cat, stu_id, b_date_s, d_date_s, r_date_s in RAW_LOAN_SPECS:
            writer.writerow([l_id, b_id, title, cat, stu_id, b_date_s, d_date_s, r_date_s or ""])
