from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.services.analytics_service import get_active_dataset_df
from app.ml.training_recommendation import generate_training_recommendations
from app.core.security import require_hr

router = APIRouter(
    prefix="/api/training",
    tags=["Training Engine & Recommendations"]
)

@router.get("")
@router.post("")
@router.post("/recommend")
@router.get("/recommend")
def get_training_recommendations(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    """Generates personalized training recommendations based on skill gaps, roles, and performance."""
    df, _ = get_active_dataset_df(db, dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="No active dataset found.")
    return generate_training_recommendations(df)
