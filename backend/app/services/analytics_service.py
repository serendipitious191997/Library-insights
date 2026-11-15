import pandas as pd
from datetime import date
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.models import Book, Loan
from app.utils.loan_record import LoanRecord
from app.utils.date_utils import get_reference_date
from app.schemas import (
    OverviewStats,
    CategoryAnalysis,
    CategoryStat,
    MonthlyAnalysis,
    MonthlyStat,
    DurationAnalysis,
    DurationDistributionBin,
    DemandInsightsResponse,
    ResourceSuggestion,
    LoanResponse,
)

def get_loans_dataframe(db: Session, ref_date: Optional[date] = None) -> pd.DataFrame:
    """Loads loans from SQLite into a Pandas DataFrame with enriched fields."""
    loans = db.query(Loan).all()
    if not loans:
        return pd.DataFrame(columns=[
            "id", "loan_id", "book_id", "book_title", "category",
            "student_id", "borrow_date", "due_date", "return_date",
            "loan_duration", "status", "is_overdue", "days_overdue",
            "is_returned_late", "borrow_year", "borrow_month", "borrow_month_name"
        ])

    records_data = []
    for l in loans:
        rec = LoanRecord(
            loan_id=l.loan_id,
            book_id=l.book_id,
            book_title=l.book_title,
            category=l.category,
            student_id=l.student_id,
            borrow_date=l.borrow_date,
            due_date=l.due_date,
            return_date=l.return_date,
            status=l.status,
            record_id=l.id
        )
        d = rec.to_dict(ref_date)
        b_date = rec.borrow_date
        d["borrow_year"] = b_date.year if b_date else None
        d["borrow_month"] = b_date.month if b_date else None
        d["borrow_month_name"] = b_date.strftime("%B") if b_date else None
        records_data.append(d)

    return pd.DataFrame(records_data)

def get_overview_statistics(db: Session) -> OverviewStats:
    """Calculates top-level KPI metrics for the Main Dashboard."""
    ref_date = get_reference_date(db)
    df = get_loans_dataframe(db, ref_date)

    total_books = db.query(Book).count()
    total_categories = db.query(Book.category).distinct().count()

    if df.empty:
        return OverviewStats(
            total_loans=0,
            active_loans=0,
            overdue_books=0,
            total_books=total_books,
            total_categories=total_categories,
            average_loan_duration=0.0,
            recent_activities=[]
        )

    total_loans = len(df)
    active_loans = int((df["status"] == "Active").sum())
    overdue_books = int(df["is_overdue"].sum())

    # Average loan duration of completed (returned) loans
    completed_loans = df[df["status"] == "Returned"]
    if not completed_loans.empty and "loan_duration" in completed_loans.columns:
        valid_durations = completed_loans["loan_duration"].dropna()
        avg_duration = round(float(valid_durations.mean()), 1) if not valid_durations.empty else 0.0
    else:
        avg_duration = 0.0

    # Recent activities (latest 8 loans by id desc)
    recent_loans_db = db.query(Loan).order_by(Loan.id.desc()).limit(8).all()
    recent_activities = []
    for l in recent_loans_db:
        rec = LoanRecord(
            loan_id=l.loan_id,
            book_id=l.book_id,
            book_title=l.book_title,
            category=l.category,
            student_id=l.student_id,
            borrow_date=l.borrow_date,
            due_date=l.due_date,
            return_date=l.return_date,
            status=l.status,
            record_id=l.id
        )
        item = rec.to_dict(ref_date)
        item["created_at"] = l.created_at
        recent_activities.append(LoanResponse(**item))

    return OverviewStats(
        total_loans=total_loans,
        active_loans=active_loans,
        overdue_books=overdue_books,
        total_books=total_books,
        total_categories=total_categories,
        average_loan_duration=avg_duration,
        recent_activities=recent_activities
    )

def get_category_analysis(db: Session) -> CategoryAnalysis:
    """Performs category-wise grouping and percentage frequency analysis via Pandas."""
    ref_date = get_reference_date(db)
    df = get_loans_dataframe(db, ref_date)

    if df.empty or "category" not in df.columns:
        return CategoryAnalysis(
            categories=[],
            highest_category=None,
            highest_count=0,
            lowest_category=None,
            lowest_count=0,
            total_loans=0
        )

    cat_counts = df["category"].value_counts()
    total = int(len(df))

    stat_items: List[CategoryStat] = []
    for cat, count in cat_counts.items():
        percentage = round((count / total) * 100, 1) if total > 0 else 0.0
        stat_items.append(CategoryStat(category=str(cat), count=int(count), percentage=percentage))

    highest_cat = cat_counts.index[0] if not cat_counts.empty else None
    highest_c = int(cat_counts.iloc[0]) if not cat_counts.empty else 0
    lowest_cat = cat_counts.index[-1] if not cat_counts.empty else None
    lowest_c = int(cat_counts.iloc[-1]) if not cat_counts.empty else 0

    return CategoryAnalysis(
        categories=stat_items,
        highest_category=highest_cat,
        highest_count=highest_c,
        lowest_category=lowest_cat,
        lowest_count=lowest_c,
        total_loans=total
    )

def get_monthly_analysis(db: Session, year: Optional[int] = None) -> MonthlyAnalysis:
    """Performs monthly grouping of borrowing trends via Pandas."""
    ref_date = get_reference_date(db)
    df = get_loans_dataframe(db, ref_date)

    if df.empty or "borrow_date" not in df.columns:
        return MonthlyAnalysis(
            trends=[],
            highest_month=None,
            highest_count=0,
            lowest_month=None,
            lowest_count=0,
            available_years=[]
        )

    # Clean date series
    df["borrow_dt"] = pd.to_datetime(df["borrow_date"])
    available_years = sorted(list(df["borrow_dt"].dt.year.dropna().unique().astype(int)), reverse=True)

    if year:
        filtered_df = df[df["borrow_dt"].dt.year == year].copy()
    else:
        filtered_df = df.copy()

    if filtered_df.empty:
        return MonthlyAnalysis(
            trends=[],
            highest_month=None,
            highest_count=0,
            lowest_month=None,
            lowest_count=0,
            available_years=available_years
        )

    filtered_df["year_month"] = filtered_df["borrow_dt"].dt.strftime("%Y-%m")
    filtered_df["month_name"] = filtered_df["borrow_dt"].dt.strftime("%B")
    filtered_df["month_num"] = filtered_df["borrow_dt"].dt.month
    filtered_df["year_val"] = filtered_df["borrow_dt"].dt.year

    monthly_group = filtered_df.groupby(["year_month", "month_name", "year_val", "month_num"]).size().reset_index(name="count")
    monthly_group = monthly_group.sort_values(by=["year_val", "month_num"])

    trends: List[MonthlyStat] = []
    for _, row in monthly_group.iterrows():
        trends.append(MonthlyStat(
            month_key=row["year_month"],
            month_name=row["month_name"],
            year=int(row["year_val"]),
            count=int(row["count"])
        ))

    highest_row = monthly_group.loc[monthly_group["count"].idxmax()] if not monthly_group.empty else None
    lowest_row = monthly_group.loc[monthly_group["count"].idxmin()] if not monthly_group.empty else None

    highest_month = f"{highest_row['month_name']} {highest_row['year_val']}" if highest_row is not None else None
    highest_count = int(highest_row["count"]) if highest_row is not None else 0
    lowest_month = f"{lowest_row['month_name']} {lowest_row['year_val']}" if lowest_row is not None else None
    lowest_count = int(lowest_row["count"]) if lowest_row is not None else 0

    return MonthlyAnalysis(
        trends=trends,
        highest_month=highest_month,
        highest_count=highest_count,
        lowest_month=lowest_month,
        lowest_count=lowest_count,
        available_years=available_years
    )

def get_duration_analysis(db: Session) -> DurationAnalysis:
    """
    Calculates duration statistics and distribution bins using Pandas:
    Bins: 1–5 days, 6–10 days, 11–15 days, 16–20 days, >20 days.
    """
    ref_date = get_reference_date(db)
    df = get_loans_dataframe(db, ref_date)

    if df.empty:
        return DurationAnalysis(
            average_duration=0.0,
            min_duration=0,
            max_duration=0,
            most_common_range="None",
            distribution=[],
            completed_loans_count=0,
            active_loans_count=0
        )

    completed_df = df[df["status"] == "Returned"].copy()
    active_count = int((df["status"] != "Returned").sum())
    completed_count = len(completed_df)

    if completed_df.empty:
        return DurationAnalysis(
            average_duration=0.0,
            min_duration=0,
            max_duration=0,
            most_common_range="None",
            distribution=[
                DurationDistributionBin(range_label="1–5 days", count=0, percentage=0.0),
                DurationDistributionBin(range_label="6–10 days", count=0, percentage=0.0),
                DurationDistributionBin(range_label="11–15 days", count=0, percentage=0.0),
                DurationDistributionBin(range_label="16–20 days", count=0, percentage=0.0),
                DurationDistributionBin(range_label="Above 20 days", count=0, percentage=0.0),
            ],
            completed_loans_count=0,
            active_loans_count=active_count
        )

    durations = completed_df["loan_duration"].dropna().astype(int)
    avg_dur = round(float(durations.mean()), 1) if not durations.empty else 0.0
    min_dur = int(durations.min()) if not durations.empty else 0
    max_dur = int(durations.max()) if not durations.empty else 0

    # Categorize into 5 bins
    bins = [-1, 5, 10, 15, 20, 9999]
    labels = ["1–5 days", "6–10 days", "11–15 days", "16–20 days", "Above 20 days"]
    completed_df["range_bin"] = pd.cut(durations, bins=bins, labels=labels, right=True)

    distribution_counts = completed_df["range_bin"].value_counts(sort=False)
    
    distribution_bins: List[DurationDistributionBin] = []
    most_common = "1–5 days"
    max_bin_count = -1

    for label in labels:
        count = int(distribution_counts.get(label, 0))
        pct = round((count / completed_count) * 100, 1) if completed_count > 0 else 0.0
        distribution_bins.append(DurationDistributionBin(
            range_label=label,
            count=count,
            percentage=pct
        ))
        if count > max_bin_count:
            max_bin_count = count
            most_common = label

    return DurationAnalysis(
        average_duration=avg_dur,
        min_duration=min_dur,
        max_duration=max_dur,
        most_common_range=most_common,
        distribution=distribution_bins,
        completed_loans_count=completed_count,
        active_loans_count=active_count
    )

def get_demand_insights(db: Session) -> DemandInsightsResponse:
    """Generates automated statistical insights and inventory suggestions."""
    ref_date = get_reference_date(db)
    df = get_loans_dataframe(db, ref_date)
    books = db.query(Book).all()

    insights: List[str] = []
    suggestions: List[ResourceSuggestion] = []

    if df.empty:
        insights.append("No circulation data is currently recorded. Add or import loan records to generate demand insights.")
        return DemandInsightsResponse(insights=insights, resource_suggestions=[])

    total_loans = len(df)
    
    # 1. Category insights
    cat_counts = df["category"].value_counts()
    if not cat_counts.empty:
        top_cat = cat_counts.index[0]
        top_count = int(cat_counts.iloc[0])
        top_pct = round((top_count / total_loans) * 100, 1)
        insights.append(f"'{top_cat}' is currently the highest-demand category with {top_count} loans ({top_pct}% of total circulation).")

        if len(cat_counts) > 1:
            bottom_cat = cat_counts.index[-1]
            bottom_count = int(cat_counts.iloc[-1])
            bottom_pct = round((bottom_count / total_loans) * 100, 1)
            insights.append(f"'{bottom_cat}' has the lowest borrowing demand with {bottom_count} loans ({bottom_pct}% of total circulation).")

    # 2. Duration insights
    completed_loans = df[df["status"] == "Returned"]
    if not completed_loans.empty and "loan_duration" in completed_loans.columns:
        durations = completed_loans["loan_duration"].dropna()
        if not durations.empty:
            avg_days = round(float(durations.mean()), 1)
            # Find most frequent duration range
            bins = [-1, 5, 10, 15, 20, 9999]
            labels = ["1–5 days", "6–10 days", "11–15 days", "16–20 days", "Above 20 days"]
            binned = pd.cut(durations, bins=bins, labels=labels, right=True)
            mode_bin = binned.mode()[0] if not binned.mode().empty else "6–10 days"
            mode_count = int((binned == mode_bin).sum())
            insights.append(f"Most completed transactions fall within the {mode_bin} borrowing period ({mode_count} records, avg duration: {avg_days} days).")

    # 3. Monthly trend insights
    df["borrow_dt"] = pd.to_datetime(df["borrow_date"])
    df["year_month"] = df["borrow_dt"].dt.strftime("%B %Y")
    monthly_counts = df["year_month"].value_counts()
    if not monthly_counts.empty:
        peak_month = monthly_counts.index[0]
        peak_c = int(monthly_counts.iloc[0])
        insights.append(f"Peak borrowing activity occurred in {peak_month} with {peak_c} borrowing transactions.")

    # 4. Overdue rate insight
    active_df = df[df["status"] == "Active"]
    overdue_count = int(df["is_overdue"].sum())
    if len(active_df) > 0:
        overdue_rate = round((overdue_count / len(active_df)) * 100, 1)
        insights.append(f"{overdue_count} books are currently overdue ({overdue_rate}% of active checkouts).")

    # Resource Allocation Suggestions based on inventory vs demand
    book_demand = df["book_id"].value_counts()
    for book in books:
        loans_for_book = int(book_demand.get(book.book_id, 0))
        available = book.available_copies or 0
        total = book.total_copies or 1

        if available == 0 and loans_for_book >= 3:
            suggestions.append(ResourceSuggestion(
                book_id=book.book_id,
                title=book.title,
                category=book.category,
                suggestion_type="Increase Copies",
                message=f"'{book.title}' is completely out of stock with {loans_for_book} historical borrowings. Consider procuring additional copies."
            ))
        elif available == 1 and total >= 3 and loans_for_book >= 5:
            suggestions.append(ResourceSuggestion(
                book_id=book.book_id,
                title=book.title,
                category=book.category,
                suggestion_type="High Demand",
                message=f"'{book.title}' has high utilization ({loans_for_book} loans) with only 1 copy currently remaining on shelf."
            ))
        elif loans_for_book == 0 and total >= 4:
            suggestions.append(ResourceSuggestion(
                book_id=book.book_id,
                title=book.title,
                category=book.category,
                suggestion_type="Low Demand",
                message=f"'{book.title}' has {available} unused copies with zero recorded borrowings. Review curriculum syllabus or shelf placement."
            ))

    # Add category-level suggestions if empty
    if not suggestions and not cat_counts.empty:
        suggestions.append(ResourceSuggestion(
            category=cat_counts.index[0],
            suggestion_type="Optimal",
            message=f"Circulation across '{cat_counts.index[0]}' is balanced. Maintain current replenishment cycle."
        ))

    return DemandInsightsResponse(
        insights=insights,
        resource_suggestions=suggestions
    )
