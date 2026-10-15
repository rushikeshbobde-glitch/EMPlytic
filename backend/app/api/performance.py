from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.services.analytics_service import get_active_dataset_df
from app.ml.performance_model import compute_performance_scores
from app.core.security import require_hr

router = APIRouter(
    prefix="/api/performance",
    tags=["Performance Scoring Engine"]
)

@router.get("")
@router.post("")
@router.post("/predict")
def get_performance_scores(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    """Computes AI Performance Scores and distribution based on available dataset factors."""
    df, _ = get_active_dataset_df(db, dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="No active dataset found.")
    return compute_performance_scores(df)
