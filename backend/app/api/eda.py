import os
import json
import tempfile
import pandas as pd
import numpy as np
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.core.config import UPLOAD_DIR
from app.db.database import get_db
from app.db.models import DatasetMetadata, EmployeeRecord, DatasetColumn, DataQuality, AuditLog, User
from app.core.security import get_current_user, require_hr
from app.services.data_cleaning import clean_dataset
from app.services.eda_service import (
    generate_eda_report,
    detect_all_semantic_columns,
    detect_semantic_column
)

router = APIRouter(
    prefix="/api/eda",
    tags=["EDA & Data Management"]
)

def read_file_to_df(file_path: str) -> pd.DataFrame:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".csv":
        try:
            return pd.read_csv(file_path)
        except UnicodeDecodeError:
            return pd.read_csv(file_path, encoding="latin1")
    elif ext in [".xlsx", ".xls"]:
        return pd.read_excel(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")

from app.services.analytics_service import sync_employee_records_from_df, run_full_ml_pipeline

def _get_dataset_and_df(db: Session, dataset_id: Optional[int] = None) -> tuple[DatasetMetadata, pd.DataFrame]:
    if dataset_id:
        meta = db.query(DatasetMetadata).filter(DatasetMetadata.id == dataset_id).first()
    else:
        meta = db.query(DatasetMetadata).order_by(DatasetMetadata.id.desc()).first()

    if not meta:
        raise HTTPException(status_code=404, detail="No dataset found.")

    path_to_read = meta.cleaned_file_path if (meta.is_cleaned and meta.cleaned_file_path and os.path.exists(meta.cleaned_file_path)) else meta.file_path
    if not os.path.exists(path_to_read):
        raise HTTPException(status_code=404, detail="Dataset file not found on disk.")

    df = read_file_to_df(path_to_read)
    return meta, df

@router.post("/analyze")
async def analyze_uploaded_dataset(
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(require_hr),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected for upload.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".csv", ".xlsx", ".xls"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported format. Please upload a CSV (.csv) or Excel (.xlsx, .xls) file."
        )

    saved_filename = f"raw_{file.filename}"
    saved_path = os.path.join(UPLOAD_DIR, saved_filename)

    try:
        contents = await file.read()
        with open(saved_path, "wb") as f:
            f.write(contents)

        df = read_file_to_df(saved_path)
        eda_results = generate_eda_report(df, filename=file.filename)

        attrition_col = detect_semantic_column(df, "attrition")
        promotion_col = detect_semantic_column(df, "promotion")

        meta = DatasetMetadata(
            filename=file.filename,
            file_path=saved_path,
            total_rows=len(df),
            total_columns=len(df.columns),
            numeric_columns_json=json.dumps(eda_results["dataset"]["numeric_columns"]),
            categorical_columns_json=json.dumps(eda_results["dataset"]["categorical_columns"]),
            quality_score=eda_results["data_quality"]["quality_score"],
            missing_count=eda_results["data_quality"]["missing_values"],
            duplicate_count=eda_results["data_quality"]["duplicate_records"],
            has_attrition_target=bool(attrition_col),
            has_promotion_target=bool(promotion_col),
            is_cleaned=False
        )
        db.add(meta)
        db.commit()
        db.refresh(meta)

        # Save DataQuality record
        dq = DataQuality(
            dataset_id=meta.id,
            quality_score=eda_results["data_quality"]["quality_score"],
            completeness_pct=eda_results["data_quality"]["completeness"],
            missing_values=eda_results["data_quality"]["missing_values"],
            duplicate_records=eda_results["data_quality"]["duplicate_records"],
            invalid_values=0,
            outlier_count=0,
            details_json=json.dumps(eda_results["data_quality"])
        )
        db.add(dq)

        # Save DatasetColumns
        for col_info in eda_results.get("column_details", []):
            dc = DatasetColumn(
                dataset_id=meta.id,
                column_name=col_info["name"],
                data_type=col_info["type"],
                missing_pct=col_info["null_percentage"],
                unique_values=col_info["unique_count"],
                sample_values_json=json.dumps(col_info["sample_values"]),
                status="Missing Values" if col_info["null_percentage"] > 0 else "Valid"
            )
            db.add(dc)

        db.add(AuditLog(action="DATASET_UPLOAD", details=f"Uploaded {file.filename} ({len(df)} rows)"))
        db.commit()

        # Immediately sync employee records and run ML scoring so dataset is active right away
        try:
            sync_employee_records_from_df(db, meta, df)
            run_full_ml_pipeline(db, meta.id)
        except Exception as e:
            print(f"[WARN] ML sync on upload error: {e}")

        eda_results["dataset_id"] = meta.id
        return eda_results

    except Exception as e:
        if os.path.exists(saved_path):
            try:
                os.remove(saved_path)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"Failed to process dataset: {str(e)}")

@router.post("/clean")
def clean_active_dataset(
    dataset_id: Optional[int] = None,
    current_user: Optional[User] = Depends(require_hr),
    db: Session = Depends(get_db)
):
    """Executes safe data cleaning pipeline and syncs employee records."""
    if dataset_id:
        meta = db.query(DatasetMetadata).filter(DatasetMetadata.id == dataset_id).first()
    else:
        meta = db.query(DatasetMetadata).order_by(DatasetMetadata.id.desc()).first()

    if not meta:
        raise HTTPException(status_code=404, detail="No uploaded dataset found to clean.")

    if not os.path.exists(meta.file_path):
        raise HTTPException(status_code=404, detail="Original dataset file not found on disk.")

    try:
        raw_df = read_file_to_df(meta.file_path)
        cleaned_df, cleaning_summary = clean_dataset(raw_df)

        cleaned_filename = f"cleaned_{meta.filename}.csv"
        cleaned_path = os.path.join(UPLOAD_DIR, cleaned_filename)
        cleaned_df.to_csv(cleaned_path, index=False)

        meta.cleaned_file_path = cleaned_path
        meta.is_cleaned = True
        meta.total_rows = len(cleaned_df)
        meta.total_columns = len(cleaned_df.columns)
        meta.missing_count = int(cleaned_df.isnull().sum().sum())
        meta.quality_score = round(100.0 - (meta.missing_count / (max(1, len(cleaned_df) * len(cleaned_df.columns))) * 100), 1)

        # Sync EmployeeRecord table with cleaned data
        sync_employee_records_from_df(db, meta, cleaned_df)

        # Update DataQuality record
        dq = db.query(DataQuality).filter(DataQuality.dataset_id == meta.id).first()
        if dq:
            dq.quality_score = meta.quality_score
            dq.missing_values = meta.missing_count
            dq.duplicate_records = cleaning_summary.get("duplicates_removed", 0)
            dq.details_json = json.dumps(cleaning_summary)
        else:
            dq = DataQuality(
                dataset_id=meta.id,
                quality_score=meta.quality_score,
                completeness_pct=100.0 - (meta.missing_count / (max(1, len(cleaned_df) * len(cleaned_df.columns))) * 100),
                missing_values=meta.missing_count,
                duplicate_records=cleaning_summary.get("duplicates_removed", 0),
                invalid_values=0,
                outlier_count=0,
                details_json=json.dumps(cleaning_summary)
            )
            db.add(dq)

        db.add(AuditLog(action="DATASET_CLEAN", details=f"Cleaned dataset ID: {meta.id}. Removed {cleaning_summary.get('duplicates_removed', 0)} duplicates."))
        db.commit()

        # Re-run ML pipeline on cleaned dataset
        try:
            run_full_ml_pipeline(db, meta.id)
        except Exception as e:
            print(f"[WARN] ML pipeline run error after clean: {e}")

        eda_cleaned = generate_eda_report(cleaned_df, filename=f"cleaned_{meta.filename}")
        eda_cleaned["dataset_id"] = meta.id
        eda_cleaned["is_cleaned"] = True

        return {
            "success": True,
            "message": "Dataset cleaned successfully.",
            "dataset_id": meta.id,
            "summary": cleaning_summary,
            "cleaning_summary": cleaning_summary,
            "quality_score": meta.quality_score,
            "rows_after": len(cleaned_df),
            "columns_after": len(cleaned_df.columns),
            "updated_dataset": eda_cleaned
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error cleaning dataset: {str(e)}")

@router.get("/cleaning-comparison")
def get_cleaning_comparison(
    dataset_id: Optional[int] = None,
    current_user: Optional[User] = Depends(require_hr),
    db: Session = Depends(get_db)
):
    """
    Returns comparative data preview and metrics before cleaning vs after cleaning.
    """
    if dataset_id:
        meta = db.query(DatasetMetadata).filter(DatasetMetadata.id == dataset_id).first()
    else:
        meta = db.query(DatasetMetadata).order_by(DatasetMetadata.id.desc()).first()

    if not meta or not meta.file_path or not os.path.exists(meta.file_path):
        raise HTTPException(status_code=404, detail="No active dataset available.")

    raw_df = read_file_to_df(meta.file_path)

    # Check if cleaned file exists, otherwise clean on the fly
    if meta.is_cleaned and meta.cleaned_file_path and os.path.exists(meta.cleaned_file_path):
        cleaned_df = read_file_to_df(meta.cleaned_file_path)
        cleaning_summary = {
            "rows_before": meta.total_rows,
            "rows_after": len(cleaned_df),
            "missing_before": meta.missing_count,
            "missing_after": int(cleaned_df.isnull().sum().sum()),
            "duplicates_removed": meta.duplicate_count,
            "columns_modified": [
                "Column headers trimmed and whitespace normalized",
                "Duplicate records dropped",
                "Numeric and currency symbols parsed to numbers",
                "Missing values imputed using statistical medians and modes"
            ]
        }
    else:
        cleaned_df, cleaning_summary = clean_dataset(raw_df)

    # Convert samples to JSON-serializable list of dicts (handling NaN, inf)
    raw_sample = raw_df.head(20).replace({np.nan: "NULL", np.inf: None, -np.inf: None}).to_dict(orient="records")
    cleaned_sample = cleaned_df.head(20).replace({np.nan: "NULL", np.inf: None, -np.inf: None}).to_dict(orient="records")

    columns = list(raw_df.columns[:15])

    return {
        "success": True,
        "dataset_id": meta.id,
        "filename": meta.filename,
        "is_cleaned": meta.is_cleaned,
        "metrics_before": {
            "rows": len(raw_df),
            "columns": len(raw_df.columns),
            "missing_values": int(raw_df.isnull().sum().sum()),
            "duplicate_records": int(raw_df.duplicated().sum()),
            "quality_score": round(max(0.0, 100.0 - (raw_df.isnull().sum().sum() / max(1, len(raw_df) * len(raw_df.columns)) * 100)), 1)
        },
        "metrics_after": {
            "rows": len(cleaned_df),
            "columns": len(cleaned_df.columns),
            "missing_values": int(cleaned_df.isnull().sum().sum()),
            "duplicate_records": 0,
            "quality_score": round(max(0.0, 100.0 - (cleaned_df.isnull().sum().sum() / max(1, len(cleaned_df) * len(cleaned_df.columns)) * 100)), 1)
        },
        "summary": cleaning_summary,
        "columns": columns,
        "raw_sample": raw_sample,
        "cleaned_sample": cleaned_sample
    }

@router.get("/summary")
def get_dataset_summary(
    dataset_id: Optional[int] = None,
    current_user: Optional[User] = Depends(require_hr),
    db: Session = Depends(get_db)
):
    """Retrieves current active dataset EDA overview."""
    try:
        meta, df = _get_dataset_and_df(db, dataset_id)
        eda = generate_eda_report(df, filename=meta.filename)
        eda["dataset_id"] = meta.id
        eda["is_cleaned"] = meta.is_cleaned
        return eda
    except HTTPException:
        return {
            "success": False,
            "message": "No dataset uploaded yet.",
            "dataset": None
        }

@router.get("/{dataset_id}/summary")
def get_eda_summary_by_id(dataset_id: int, db: Session = Depends(get_db)):
    meta, df = _get_dataset_and_df(db, dataset_id)
    eda = generate_eda_report(df, filename=meta.filename)
    eda["dataset_id"] = meta.id
    eda["is_cleaned"] = meta.is_cleaned
    return {"success": True, "data": eda}

@router.get("/{dataset_id}/distributions")
def get_eda_distributions(dataset_id: int, db: Session = Depends(get_db)):
    meta, df = _get_dataset_and_df(db, dataset_id)
    eda = generate_eda_report(df, filename=meta.filename)
    return {
        "success": True,
        "histograms": eda.get("histograms", {}),
        "categorical_distributions": eda.get("categorical_distributions", {}),
        "statistics": eda.get("statistics", {})
    }

@router.get("/{dataset_id}/departments")
def get_eda_departments(dataset_id: int, db: Session = Depends(get_db)):
    meta, df = _get_dataset_and_df(db, dataset_id)
    eda = generate_eda_report(df, filename=meta.filename)
    return {
        "success": True,
        "department_distribution": eda.get("department_distribution", [])
    }

@router.get("/{dataset_id}/performance")
def get_eda_performance(dataset_id: int, db: Session = Depends(get_db)):
    meta, df = _get_dataset_and_df(db, dataset_id)
    sem_map = detect_all_semantic_columns(df)
    perf_col = sem_map.get("performance")
    dept_col = sem_map.get("department")

    perf_data = []
    if perf_col and perf_col in df.columns:
        if dept_col and dept_col in df.columns:
            for dept, sub in df.groupby(dept_col):
                perf_data.append({
                    "department": str(dept),
                    "avg_performance": round(float(sub[perf_col].mean()), 2),
                    "min_performance": round(float(sub[perf_col].min()), 2),
                    "max_performance": round(float(sub[perf_col].max()), 2),
                    "count": len(sub)
                })

    return {
        "success": True,
        "performance_column": perf_col,
        "department_performance": perf_data
    }

@router.get("/{dataset_id}/attendance")
def get_eda_attendance(dataset_id: int, db: Session = Depends(get_db)):
    meta, df = _get_dataset_and_df(db, dataset_id)
    sem_map = detect_all_semantic_columns(df)
    att_col = sem_map.get("attendance")
    dept_col = sem_map.get("department")

    att_data = []
    if att_col and att_col in df.columns and dept_col and dept_col in df.columns:
        for dept, sub in df.groupby(dept_col):
            att_data.append({
                "department": str(dept),
                "avg_absenteeism": round(float(sub[att_col].mean()), 2),
                "count": len(sub)
            })

    return {
        "success": True,
        "attendance_column": att_col,
        "department_attendance": att_data
    }

@router.get("/{dataset_id}/attrition")
def get_eda_attrition(dataset_id: int, db: Session = Depends(get_db)):
    meta, df = _get_dataset_and_df(db, dataset_id)
    sem_map = detect_all_semantic_columns(df)
    attr_col = sem_map.get("attrition")
    dept_col = sem_map.get("department")

    attr_breakdown = []
    if attr_col and attr_col in df.columns and dept_col and dept_col in df.columns:
        attr_norm = df[attr_col].astype(str).str.strip().str.lower()
        left_mask = attr_norm.isin(["yes", "1", "true", "left", "exited"])
        for dept, sub in df.groupby(dept_col):
            dept_left = (sub[attr_col].astype(str).str.strip().str.lower().isin(["yes", "1", "true", "left", "exited"])).sum()
            attr_breakdown.append({
                "department": str(dept),
                "total": len(sub),
                "attrition_count": int(dept_left),
                "attrition_rate": round((dept_left / len(sub)) * 100, 1)
            })

    return {
        "success": True,
        "attrition_column": attr_col,
        "department_attrition": attr_breakdown
    }

@router.get("/{dataset_id}/correlation")
def get_eda_correlation(dataset_id: int, db: Session = Depends(get_db)):
    meta, df = _get_dataset_and_df(db, dataset_id)
    eda = generate_eda_report(df, filename=meta.filename)
    return {
        "success": True,
        "correlation": eda.get("correlation", {})
    }
