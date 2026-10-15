from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.core.security import require_hr
from app.services.analytics_service import (
    get_active_dataset_df,
    run_full_ml_pipeline
)
from app.ml.attrition_model import train_and_evaluate_attrition
from app.ml.promotion_model import evaluate_promotion_readiness
from app.ml.performance_model import compute_performance_scores
from app.ml.productivity_model import compute_productivity_indices
from app.ml.segmentation_model import generate_employee_segments

router = APIRouter(
    prefix="/api/predictions",
    tags=["Predictions & Machine Learning"]
)

@router.post("/attrition")
def predict_attrition(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    df, _ = get_active_dataset_df(db, dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="No active dataset found.")
    return train_and_evaluate_attrition(df)

@router.post("/promotion")
def predict_promotion(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    df, _ = get_active_dataset_df(db, dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="No active dataset found.")
    return evaluate_promotion_readiness(df)

@router.post("/performance")
def predict_performance(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    df, _ = get_active_dataset_df(db, dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="No active dataset found.")
    return compute_performance_scores(df)

@router.post("/productivity")
def predict_productivity(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    df, _ = get_active_dataset_df(db, dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="No active dataset found.")
    return compute_productivity_indices(df)

@router.post("/segmentation")
def predict_segmentation(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    df, _ = get_active_dataset_df(db, dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="No active dataset found.")
    return generate_employee_segments(df)

@router.post("/run-all")
def run_all_models(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    return run_full_ml_pipeline(db, dataset_id)
