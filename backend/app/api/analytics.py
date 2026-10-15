from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.core.security import require_hr
from app.services.analytics_service import (
    get_dashboard_data,
    get_active_dataset_df
)
from app.services.insights_service import generate_explainable_insights
from app.ml.performance_model import compute_performance_scores
from app.ml.productivity_model import compute_productivity_indices
from app.ml.segmentation_model import generate_employee_segments

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)

@router.get("/dashboard")
def get_dashboard(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    return get_dashboard_data(db, dataset_id)

@router.get("/performance")
def get_performance_analytics(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    df, _ = get_active_dataset_df(db, dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="No active dataset found.")
    return compute_performance_scores(df)

@router.get("/productivity")
def get_productivity_analytics(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    df, _ = get_active_dataset_df(db, dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="No active dataset found.")
    return compute_productivity_indices(df)

@router.get("/segmentation")
def get_workforce_segmentation(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    df, _ = get_active_dataset_df(db, dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="No active dataset found.")
    return generate_employee_segments(df)

@router.get("/insights")
def get_insights(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    return generate_explainable_insights(db, dataset_id)
