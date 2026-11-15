import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.utils.sample_seeder import seed_sample_database
from app.services.analytics_service import (
    get_overview_statistics,
    get_category_analysis,
    get_monthly_analysis,
    get_duration_analysis,
    get_demand_insights
)

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    seed_sample_database(db, force=True)
    yield db
    db.close()

def test_overview_statistics_benchmark(test_db):
    """Verify overview KPIs match sample benchmark."""
    overview = get_overview_statistics(test_db)
    assert overview.total_loans == 50
    assert overview.total_books >= 15
    assert overview.total_categories >= 4
    assert overview.average_loan_duration > 0
    assert len(overview.recent_activities) > 0

def test_category_distribution_benchmark(test_db):
    """Verify category counts match college report specs (CS: 16, Math: 12, Electronics: 9, Physics: 6)."""
    cat_analysis = get_category_analysis(test_db)
    assert cat_analysis.total_loans == 50
    assert cat_analysis.highest_category == "Computer Science"
    assert cat_analysis.highest_count == 16

    counts = {c.category: c.count for c in cat_analysis.categories}
    assert counts.get("Computer Science") == 16
    assert counts.get("Mathematics") == 12
    assert counts.get("Electronics") == 9
    assert counts.get("Physics") == 6

def test_monthly_distribution_benchmark(test_db):
    """Verify monthly counts match college report specs (Jan: 10, Mar: 14, Apr: 14)."""
    monthly = get_monthly_analysis(test_db)
    month_counts = {m.month_name: m.count for m in monthly.trends}
    assert month_counts.get("January") == 10
    assert month_counts.get("March") == 14
    assert month_counts.get("April") == 14

def test_duration_distribution_benchmark(test_db):
    """Verify most common duration is 6-10 days with 20 records."""
    duration_res = get_duration_analysis(test_db)
    assert duration_res.most_common_range == "6–10 days"
    dist_map = {d.range_label: d.count for d in duration_res.distribution}
    assert dist_map.get("6–10 days") == 20

def test_demand_insights_generation(test_db):
    """Verify automatic data-driven insights generation."""
    insights_res = get_demand_insights(test_db)
    assert len(insights_res.insights) > 0
    assert any("Computer Science" in s for s in insights_res.insights)
    assert any("6–10 days" in s or "borrowing period" in s for s in insights_res.insights)
