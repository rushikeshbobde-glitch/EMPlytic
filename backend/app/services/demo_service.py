import os
import json
import pandas as pd
from sqlalchemy.orm import Session

from app.core.config import DEMO_MODE, UPLOAD_DIR
from app.db.models import DatasetMetadata, DatasetColumn, DataQuality, EmployeeRecord, User, AuditLog
from app.services.eda_service import generate_eda_report, detect_semantic_column
from app.services.data_cleaning import clean_dataset
from app.services.analytics_service import run_full_ml_pipeline
from app.api.auth import init_demo_users
from app.api.eda import clean_active_dataset

def seed_demo_dataset_if_needed(db: Session):
    """
    When DEMO_MODE is true, ensures a rich realistic workforce dataset is ready
    so that all dashboard charts, predictions, and reports work out-of-the-box.
    """
    if not DEMO_MODE:
        return

    # Seed demo users first
    init_demo_users(db)

    # Check if a dataset already exists in the database
    existing = db.query(DatasetMetadata).first()
    if existing:
        return

    # Look for the primary dataset: raw_HR Data.xlsx - HR data.csv, fallback to raw_employee_attrition_dataset.csv
    candidate_files = [
        ("raw_HR Data.xlsx - HR data.csv", "HR Data.xlsx - HR data.csv"),
        ("raw_employee_attrition_dataset.csv", "employee_attrition_dataset.csv")
    ]
    sample_csv_path = None
    target_filename = "employee_attrition_dataset.csv"

    for c_file, f_name in candidate_files:
        p = os.path.join(UPLOAD_DIR, c_file)
        if os.path.exists(p):
            sample_csv_path = p
            target_filename = f_name
            break

    if not sample_csv_path or not os.path.exists(sample_csv_path):
        return

    try:
        df = pd.read_csv(sample_csv_path)
        eda_results = generate_eda_report(df, filename=target_filename)

        attrition_col = detect_semantic_column(df, "attrition")
        promotion_col = detect_semantic_column(df, "promotion")

        meta = DatasetMetadata(
            filename=target_filename,
            file_path=sample_csv_path,
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
                status="Valid"
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
        db.add(AuditLog(action="DEMO_INIT", details="Initialized DEMO dataset with 1,000+ records"))
        db.commit()

        # Clean dataset and populate EmployeeRecord table
        clean_active_dataset(dataset_id=meta.id, db=db)

        # Run ML pipelines (Attrition, Promotion, Performance, Productivity)
        run_full_ml_pipeline(db, dataset_id=meta.id)

    except Exception as e:
        db.rollback()
        print(f"[WARN] Failed to seed demo dataset: {e}")
