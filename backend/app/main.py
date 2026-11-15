import os
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, SessionLocal
from app.utils.sample_seeder import seed_sample_database
from app.routers import (
    books,
    loans,
    analytics,
    imports,
    reports,
    validation,
    settings
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and auto-seed sample dataset if necessary
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_sample_database(db, force=False)
    finally:
        db.close()
    yield
    # Shutdown logic if needed

app = FastAPI(
    title="Library Circulation and Demand Dashboard API",
    description="Full-stack Python & FastAPI backend with Pandas analytics for library circulation, demand tracking, and inventory control.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(books.router)
app.include_router(loans.router)
app.include_router(analytics.router)
app.include_router(imports.router)
app.include_router(reports.router)
app.include_router(validation.router)
app.include_router(settings.router)

@app.get("/api/health", tags=["System"])
def health_check():
    """Health check endpoint indicating API operational status."""
    return {
        "status": "healthy",
        "service": "Library Circulation and Demand API",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
