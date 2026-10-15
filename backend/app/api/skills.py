from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.services.analytics_service import get_active_dataset_df
from app.ml.skill_gap import analyze_skill_gaps
from app.core.security import require_hr

router = APIRouter(
    prefix="/api/skills",
    tags=["Skills & Competencies"]
)

@router.get("")
@router.post("")
@router.post("/analyze")
@router.get("/analyze")
def get_skill_gaps(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    """Analyzes workforce skill gaps against department benchmarks."""
    df, _ = get_active_dataset_df(db, dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="No active dataset found.")
    return analyze_skill_gaps(df)
