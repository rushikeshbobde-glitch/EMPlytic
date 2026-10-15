import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import ALLOWED_ORIGINS, DEMO_MODE
from app.db.database import engine, Base, SessionLocal
from app.api.auth import router as auth_router, init_demo_users
from app.api.datasets import router as datasets_router
from app.api.eda import router as eda_router
from app.api.analytics import router as analytics_router
from app.api.predictions import router as predictions_router
from app.api.attrition import router as attrition_router
from app.api.promotion import router as promotion_router
from app.api.performance import router as performance_router
from app.api.productivity import router as productivity_router
from app.api.skills import router as skills_router
from app.api.training import router as training_router
from app.api.employees import router as employees_router
from app.api.reports import router as reports_router
from app.api.settings import router as settings_router
from app.services.demo_service import seed_demo_dataset_if_needed

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        init_demo_users(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="EMPlytic — Turn Employee Data into Intelligent HR Decisions",
    description="Enterprise AI-powered HR Analytics, Automated Data Cleaning, Predictive Retention, and Workforce Intelligence Platform.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API Routers
app.include_router(auth_router)
app.include_router(datasets_router)
app.include_router(eda_router)
app.include_router(analytics_router)
app.include_router(predictions_router)
app.include_router(attrition_router)
app.include_router(promotion_router)
app.include_router(performance_router)
app.include_router(productivity_router)
app.include_router(skills_router)
app.include_router(training_router)
app.include_router(employees_router)
app.include_router(reports_router)
app.include_router(settings_router)

@app.get("/")
def root():
    return {
        "success": True,
        "platform": "EMPlytic HR Analytics API",
        "tagline": "Turn Employee Data into Intelligent HR Decisions.",
        "version": "2.0.0",
        "demo_mode": DEMO_MODE,
        "status": "online"
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "database": "connected",
        "demo_mode": DEMO_MODE,
        "version": "2.0.0"
    }
