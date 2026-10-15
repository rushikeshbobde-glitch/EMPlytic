import os
import json
import pandas as pd
import numpy as np
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status, Response
from sqlalchemy.orm import Session

from app.core.config import UPLOAD_DIR
from app.db.database import get_db
from app.db.models import DatasetMetadata, DatasetColumn, DataQuality, AuditLog
from app.core.security import get_current_user, require_hr
from app.services.data_cleaning import clean_dataset
from app.services.eda_service import generate_eda_report, detect_all_semantic_columns, detect_semantic_column

router = APIRouter(
    prefix="/api/datasets",
    tags=["Datasets Management"]
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

@router.get("")
def list_datasets(current_user: User = Depends(require_hr), db: Session = Depends(get_db)):
    """Returns list of all uploaded datasets."""
    datasets = db.query(DatasetMetadata).order_by(DatasetMetadata.id.desc()).all()
    return {
        "success": True,
        "count": len(datasets),
        "data": [
            {
                "id": d.id,
                "filename": d.filename,
                "total_rows": d.total_rows,
                "total_columns": d.total_columns,
                "quality_score": d.quality_score,
                "is_cleaned": d.is_cleaned,
                "has_attrition_target": d.has_attrition_target,
                "has_promotion_target": d.has_promotion_target,
                "created_at": d.created_at.isoformat() if d.created_at else None
            }
            for d in datasets
        ]
    }

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    """Uploads CSV or Excel employee dataset."""
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
        if len(df) == 0:
            raise HTTPException(status_code=400, detail="The uploaded dataset is empty.")

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

        # Save Column Details
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

        # Save DataQuality
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
        db.add(AuditLog(action="DATASET_UPLOAD", details=f"Uploaded {file.filename} (ID: {meta.id})"))
        db.commit()

        # Immediately sync employee records and run ML scoring so dataset is active right away
        try:
            from app.services.analytics_service import sync_employee_records_from_df, run_full_ml_pipeline
            sync_employee_records_from_df(db, meta, df)
            run_full_ml_pipeline(db, meta.id)
        except Exception as e:
            print(f"[WARN] ML sync on upload error: {e}")

        eda_results["dataset_id"] = meta.id
        return {
            "success": True,
            "message": "Dataset uploaded and analyzed successfully.",
            "dataset_id": meta.id,
            "data": eda_results
        }

    except Exception as e:
        if os.path.exists(saved_path):
            try:
                os.remove(saved_path)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"Failed to process dataset: {str(e)}")

@router.get("/{dataset_id}")
def get_dataset_details(dataset_id: int, current_user: User = Depends(require_hr), db: Session = Depends(get_db)):
    meta = db.query(DatasetMetadata).filter(DatasetMetadata.id == dataset_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    columns = db.query(DatasetColumn).filter(DatasetColumn.dataset_id == dataset_id).all()
    quality = db.query(DataQuality).filter(DataQuality.dataset_id == dataset_id).first()

    return {
        "success": True,
        "dataset": {
            "id": meta.id,
            "filename": meta.filename,
            "total_rows": meta.total_rows,
            "total_columns": meta.total_columns,
            "quality_score": meta.quality_score,
            "missing_count": meta.missing_count,
            "duplicate_count": meta.duplicate_count,
            "is_cleaned": meta.is_cleaned,
            "has_attrition_target": meta.has_attrition_target,
            "has_promotion_target": meta.has_promotion_target,
            "created_at": meta.created_at.isoformat() if meta.created_at else None
        },
        "columns": [
            {
                "name": c.column_name,
                "data_type": c.data_type,
                "missing_pct": c.missing_pct,
                "unique_values": c.unique_values,
                "status": c.status
            }
            for c in columns
        ],
        "data_quality": {
            "quality_score": quality.quality_score if quality else meta.quality_score,
            "completeness_pct": quality.completeness_pct if quality else 100.0,
            "missing_values": quality.missing_values if quality else meta.missing_count,
            "duplicate_records": quality.duplicate_records if quality else meta.duplicate_count
        } if quality else None
    }

@router.post("/{dataset_id}/validate")
def validate_dataset(dataset_id: int, current_user: User = Depends(require_hr), db: Session = Depends(get_db)):
    """Validates dataset columns, data types, missing values, duplicates, and outliers."""
    meta = db.query(DatasetMetadata).filter(DatasetMetadata.id == dataset_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = read_file_to_df(meta.file_path)
    eda = generate_eda_report(df, filename=meta.filename)

    # Detect outliers in numeric columns using IQR rule
    outlier_summary = {}
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    for col in num_cols:
        series = df[col].dropna()
        if len(series) > 4:
            q25, q75 = series.quantile(0.25), series.quantile(0.75)
            iqr = q75 - q25
            outliers = series[(series < (q25 - 1.5 * iqr)) | (series > (q75 + 1.5 * iqr))]
            if len(outliers) > 0:
                outlier_summary[col] = int(len(outliers))

    return {
        "success": True,
        "dataset_id": dataset_id,
        "data_quality_score": eda["data_quality"]["quality_score"],
        "missing_values_count": eda["data_quality"]["missing_values"],
        "duplicate_rows_count": eda["data_quality"]["duplicate_records"],
        "outliers_by_column": outlier_summary,
        "column_validation": eda.get("column_details", []),
        "semantic_mappings": eda.get("semantic_mapping", {})
    }

@router.post("/{dataset_id}/clean")
def clean_dataset_by_id(dataset_id: int, current_user: User = Depends(require_hr), db: Session = Depends(get_db)):
    """Executes safe cleaning and returns cleaned summary."""
    from app.api.eda import clean_active_dataset
    return clean_active_dataset(dataset_id=dataset_id, db=db)

@router.get("/{dataset_id}/download-cleaned")
def download_cleaned_dataset(dataset_id: int, current_user: User = Depends(require_hr), db: Session = Depends(get_db)):
    meta = db.query(DatasetMetadata).filter(DatasetMetadata.id == dataset_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    target_path = meta.cleaned_file_path if (meta.is_cleaned and meta.cleaned_file_path and os.path.exists(meta.cleaned_file_path)) else meta.file_path
    if not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="Dataset file not found.")

    with open(target_path, "rb") as f:
        file_bytes = f.read()

    filename = f"cleaned_{meta.filename}" if not meta.filename.startswith("cleaned_") else meta.filename
    return Response(
        content=file_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
