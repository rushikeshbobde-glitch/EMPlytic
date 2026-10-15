from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.services.analytics_service import get_active_dataset_df
from app.ml.attrition_model import train_and_evaluate_attrition
from app.core.security import require_hr

router = APIRouter(
    prefix="/api/attrition",
    tags=["Attrition Analytics & Predictions"]
)

@router.post("/predict")
@router.get("/predict")
def predict_attrition(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    """
    Executes supervised ML attrition model pipeline.
    If no historical attrition target exists, truthfully reports that prediction is unavailable.
    """
    df, _ = get_active_dataset_df(db, dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="No active dataset found.")
    
    result = train_and_evaluate_attrition(df)
    return result

@router.get("/analytics")
def get_attrition_analytics(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    df, _ = get_active_dataset_df(db, dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="No active dataset found.")

    return train_and_evaluate_attrition(df)
