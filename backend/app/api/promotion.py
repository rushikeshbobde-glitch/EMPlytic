from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.services.analytics_service import get_active_dataset_df
from app.ml.promotion_model import evaluate_promotion_readiness
from app.core.security import require_hr

router = APIRouter(
    prefix="/api/promotion",
    tags=["Promotion Analytics & Predictions"]
)

@router.post("/predict")
@router.get("/predict")
def predict_promotion(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    """
    Evaluates promotion readiness.
    If historical promotion target exists, trains a supervised model.
    Otherwise uses a multi-factor transparent readiness score engine.
    """
    df, _ = get_active_dataset_df(db, dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="No active dataset found.")

    return evaluate_promotion_readiness(df)

@router.get("/analytics")
def get_promotion_analytics(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    df, _ = get_active_dataset_df(db, dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="No active dataset found.")

    return evaluate_promotion_readiness(df)
