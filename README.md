# LIBRARY CIRCULATION AND DEMAND DASHBOARD ("Library Insights")
### Academic Full-Stack Web Application — Python Programming Laboratory Project

A complete, production-grade library circulation and demand analytics platform developed for college laboratory demonstration. The application connects a modern **React.js + Tailwind CSS** frontend with a high-performance **Python FastAPI + Pandas + SQLAlchemy** backend and persistent **SQLite** database.

---

## 🌟 Key Project Highlights

- **Python Object-Oriented Programming (OOP)**: Core business transactions encapsulated in the [`LoanRecord`](file:///c:/Users/lenovo/Desktop/LIBRARY%20CIRCULATION%20AND%20DEMAND%20DASHBOARD/backend/app/utils/loan_record.py) class with methods for loan duration calculation, overdue detection, days overdue calculation, and dictionary serialization.
- **Data Analytics with Pandas**: Statistical category grouping, percentage demand contributions, monthly borrowing trends, duration distribution grouping (1–5d, 6–10d, 11–15d, 16–20d, >20d), and automated demand insight generation.
- **Data Quality & Integrity Monitoring**: Real-time auditing against 11 database rules (duplicate Loan IDs, missing attributes, inverted borrow/due/return dates, and non-existent inventory references).
- **Transactional CSV Import & Verification**: Upload CSVs with Pandas preview of first 10 rows, schema verification, and atomic database commits.
- **Reporting & Exports**: Multi-format exports including CSV for loans and overdue items, structured nested JSON summaries, and a dedicated browser **Print-to-PDF** report.
- **Benchmark Sample Dataset**: Pre-seeded with 50 realistic circulation transactions across Computer Science (16), Mathematics (12), Electronics (9), Physics (6), Mechanical (4), and Chemistry (3).

---

## 🏛 Architecture & Technology Stack

```
LIBRARY CIRCULATION AND DEMAND DASHBOARD
├── backend/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py           # FastAPI entry point, CORS & Lifespan
│   │   ├── database.py       # SQLite engine & SessionLocal
│   │   ├── models.py         # SQLAlchemy models (Book, Loan, Setting)
│   │   ├── schemas.py        # Pydantic validation schemas
│   │   ├── routers/          # Modular API routers (Books, Loans, Analytics, etc.)
│   │   ├── services/         # Business logic & Pandas analytical services
│   │   └── utils/            # OOP LoanRecord class, date & ID utilities
│   ├── data/
│   │   └── sample_library.csv# Benchmark sample dataset
│   ├── tests/                # Pytest unit & integration test suite
│   ├── pytest.ini            # Pytest configuration
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React.js + Vite Frontend
│   ├── src/
│   │   ├── components/       # Reusable UI (Sidebar, Topbar, StatCard, DataTable, etc.)
│   │   ├── pages/            # 10 Dedicated page tabs
│   │   ├── layouts/          # Responsive App Shell
│   │   ├── services/         # Axios API client
│   │   ├── App.jsx           # React Router DOM configuration
│   │   └── index.css         # Tailwind directives & print styles
│   ├── package.json          # Frontend npm dependencies
│   ├── tailwind.config.js    # Dark navy theme configuration
│   └── vite.config.js        # Vite port & proxy settings
├── start.bat                 # One-click Windows concurrent launcher
└── README.md
```

### Technology Matrix

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, JavaScript, Tailwind CSS, Recharts, Lucide React, Axios, React Hot Toast |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pandas, SQLAlchemy ORM, Pydantic V2 |
| **Database** | SQLite 3, Atomic Transactions, Foreign Key Constraints |
| **Testing** | Pytest 9.2+, FastAPI TestClient, SQLAlchemy StaticPool in-memory fixtures |

---

## 📑 Detailed Page-Wise Functionality (10 Tabs)

1. **Overview / Main Dashboard (`/`)**
   - 6 Interactive KPI Statistic Cards: Total Loans, Active Loans, Overdue Books, Total Books, Total Categories, Average Loan Duration.
   - 4 Interactive Recharts: Category-wise Bar Chart, Monthly Trend Line Chart, Duration Distribution Bins, Status Donut Chart.
   - Recent Activities Table with live status badges.
   - Quick Action buttons: Issue Book, Import CSV, View Overdue, Generate Report.

2. **Books & Inventory (`/books`)**
   - Complete catalog table with title, author, category, total copies, available copies, and checked-out copies.
   - Search by Title, Author, or Book ID; category dropdown; sort by title/copies.
   - Add and Edit Book modals with copy count validation.
   - Delete Book with safety check (prevents deletion if active unreturned loans exist).

3. **Loan Records (`/loans`)**
   - Complete borrowing transaction history.
   - Search across Loan ID, Student ID, Book Title; filters for Category, Status (Active, Returned, Overdue), and Borrow Date ranges.
   - Client-side pagination.
   - Add new borrowing transaction or edit existing loans.
   - Delete loan with automatic shelf copy replenishment.

4. **Issue / Return Management (`/issue-return`)**
   - **Dedicated Issue Book Form**: Instant stock availability indicator, student ID entry, default due date auto-calculation.
   - **Dedicated Return Book Interface**: Quick search of active checkouts, loan preview card, custom return date picker, and one-click return with automatic duration calculation and inventory restocking.

5. **Overdue Management (`/overdue`)**
   - **Currently Overdue Section**: Unreturned loans past due date with dynamic `+N days` badges and one-click Return button.
   - **Returned Late History**: Historical checkouts completed after the due date with days late.
   - Filter by Student ID, Category, or minimum overdue days threshold.

6. **Demand Analytics (`/analytics`)**
   - **Category-wise Demand**: Horizontal bar chart showing frequencies and percentage demand contributions.
   - **Monthly Circulation Trend**: Chronological line chart with multi-year filter support.
   - **Duration Distribution**: Grouped into standard intervals (1–5d, 6–10d, 11–15d, 16–20d, >20d).
   - **Automated Demand Insights**: Real-time analytical statements derived from data (e.g. top category, peak month, average durations).
   - **Resource Allocation Suggestions**: Automatic recommendations identifying out-of-stock high demand titles or under-utilized categories.

7. **Data Import (`/import`)**
   - Upload any `.csv` file with drag-and-drop support.
   - First 10 rows preview via Pandas.
   - Structure verification against required columns and date formats.
   - Identification of missing fields, duplicates, or date relationship errors.
   - Atomic database commit for verified rows with error report download.

8. **Data Validation (`/validation`)**
   - Live health monitor auditing all loans in SQLite against 11 integrity rules.
   - Summary cards: Total Checked, Valid Records, Invalid Records, Duplicate IDs, Incomplete Records.
   - Detailed audit issue log filterable by severity and field.
   - "Export Validation CSV" button.

9. **Reports & Export (`/reports`)**
   - Dedicated export buttons for Complete Loans CSV, Summary JSON, Overdue CSV, and Validation CSV.
   - Live formatted JSON viewer with one-click clipboard copy.
   - **Printable Executive Report**: Clean document view with summary statistics, category tables, and findings suitable for browser Print-to-PDF (`Ctrl + P`).

10. **Settings (`/settings`)**
    - Configure Library Name, Administrator Display Name, and Default Loan Period.
    - Reference Date configuration (allows locking or overriding the demo date or using live system date).
    - Database state details (SQLite filename, book count, loan count).
    - **Reset Benchmark Dataset**: One-click restore of the exact 50-record college project dataset.

---

## 🚀 Quick Start Guide

### 1. One-Click Launcher (Windows)
Double-click [`start.bat`](file:///c:/Users/lenovo/Desktop/LIBRARY%20CIRCULATION%20AND%20DEMAND%20DASHBOARD/start.bat) in the project root. It will launch both the FastAPI backend and Vite frontend in separate terminal windows.

Once started:
- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend Root**: [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc API Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 2. Manual Startup (Step-by-Step)

#### Backend Setup & Startup
```powershell
# Open terminal in backend directory
cd backend

# Create virtual environment with Python 3.11
uv venv --python 3.11

# Activate virtual environment
.\.venv\Scripts\activate

# Install requirements
uv pip install -r requirements.txt

# Start backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### Frontend Setup & Startup
```powershell
# Open a new terminal in frontend directory
cd frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```

---

## 🧪 Running Automated Tests

Run the complete test suite containing 19 unit and integration tests:

```powershell
cd backend
.\.venv\Scripts\pytest -v
```

### Test Coverage Summary:
- `tests/test_loan_record.py`: Validates `LoanRecord` OOP methods for durations, active/overdue status, late returns, and dict serialization.
- `tests/test_analytics.py`: Validates Pandas analytics algorithms (Category share, Monthly volume, Duration bins: 6–10d has 20 records, automated insights).
- `tests/test_validation.py`: Validates rule checking for missing attributes, reversed dates, and duplicate Loan IDs.
- `tests/test_api.py`: Tests API health check, book CRUD, loan issue/return workflows, analytics, and CSV/JSON export endpoints.

---

## 📊 Sample Dataset Benchmark Specifications

| Dimension | Benchmark Value |
| :--- | :--- |
| **Total Borrowing Records** | 50 records |
| **Computer Science Demand** | 16 loans (Top Category) |
| **Mathematics Demand** | 12 loans |
| **Electronics Demand** | 9 loans |
| **Physics Demand** | 6 loans |
| **Mechanical Engineering** | 4 loans |
| **Chemistry Demand** | 3 loans |
| **January Circulation** | 10 loans |
| **March Circulation** | 14 loans |
| **April Circulation** | 14 loans |
| **February Circulation** | 8 loans |
| **May Circulation** | 4 loans |
| **Most Common Duration** | 6–10 days (20 records) |
| **Reference Demo Date** | `2026-05-15` (Deterministic reference date) |

---

## 🔒 Security & Reliability

- **SQL Injection Prevention**: All database interactions use SQLAlchemy ORM parameter binding.
- **Input Validation**: Strict typing and range checking via Pydantic V2 schemas.
- **Safe Uploads**: CSV uploads enforce file extension verification and a 5 MB file size limit without executing file contents.
- **Atomic Operations**: Database issue, return, and batch import routines execute inside transactions (`commit` / `rollback` on error) ensuring zero partial or corrupted states.
- **Zero Mock Fallbacks**: Persistent SQLite database is the single source of truth across all 10 pages.
