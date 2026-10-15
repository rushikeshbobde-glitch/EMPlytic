import os
import json
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from app.db.models import DatasetMetadata, EmployeeRecord
from app.services.eda_service import detect_all_semantic_columns, detect_semantic_column, is_valid_hr_dataset
from app.ml.attrition_model import train_and_evaluate_attrition
from app.ml.promotion_model import evaluate_promotion_readiness
from app.ml.performance_model import compute_performance_scores
from app.ml.productivity_model import compute_productivity_indices
from app.ml.segmentation_model import generate_employee_segments

def get_active_dataset_df(db: Session, dataset_id: int = None) -> tuple[Optional[pd.DataFrame], Optional[DatasetMetadata]]:
    if dataset_id:
        meta = db.query(DatasetMetadata).filter(DatasetMetadata.id == dataset_id).first()
    else:
        meta = db.query(DatasetMetadata).order_by(DatasetMetadata.id.desc()).first()

    if not meta:
        return None, None

    path = meta.cleaned_file_path if (meta.is_cleaned and meta.cleaned_file_path and os.path.exists(meta.cleaned_file_path)) else meta.file_path
    if not os.path.exists(path):
        return None, None

    if path.endswith(".csv"):
        try:
            df = pd.read_csv(path)
        except Exception:
            df = pd.read_csv(path, encoding="latin1")
    else:
        df = pd.read_excel(path)

    return df, meta

def sync_employee_records_from_df(db: Session, meta: DatasetMetadata, df: pd.DataFrame):
    """Synchronizes EmployeeRecord database rows from a dataset DataFrame if it is a valid HR dataset."""
    db.query(EmployeeRecord).filter(EmployeeRecord.dataset_id == meta.id).delete()

    is_hr, _ = is_valid_hr_dataset(df)
    if not is_hr:
        db.commit()
        return

    sem_map = detect_all_semantic_columns(df)
    emp_records = []
    for idx, row in df.iterrows():
        emp_id_val = str(row[sem_map["employee_id"]]) if sem_map.get("employee_id") and sem_map["employee_id"] in row and pd.notna(row[sem_map["employee_id"]]) else f"EMP-{idx+1:04d}"
        name_val = str(row[sem_map["name"]]) if sem_map.get("name") and sem_map["name"] in row and pd.notna(row[sem_map["name"]]) else f"Employee {emp_id_val}"
        dept_val = str(row[sem_map["department"]]) if sem_map.get("department") and sem_map["department"] in row and pd.notna(row[sem_map["department"]]) else "General"
        role_val = str(row[sem_map["job_role"]]) if sem_map.get("job_role") and sem_map["job_role"] in row and pd.notna(row[sem_map["job_role"]]) else "Specialist"

        sal_raw = float(row[sem_map["salary"]]) if sem_map.get("salary") and pd.notna(row[sem_map["salary"]]) else 50000.0
        sal_val = sal_raw * 12 if sal_raw < 20000 else sal_raw

        age_val = int(row[sem_map["age"]]) if sem_map.get("age") and pd.notna(row[sem_map["age"]]) else 30
        sat_val = float(row[sem_map["satisfaction"]]) if sem_map.get("satisfaction") and pd.notna(row[sem_map["satisfaction"]]) else 3.5

        raw_perf = float(row[sem_map["performance"]]) if sem_map.get("performance") and pd.notna(row[sem_map["performance"]]) else 3.0
        perf_val = round(min(100.0, (raw_perf / 5.0) * 100), 1) if raw_perf <= 5.0 else round(raw_perf, 1)

        emp = EmployeeRecord(
            dataset_id=meta.id,
            employee_id=emp_id_val,
            name=name_val,
            department=dept_val,
            job_role=role_val,
            salary=round(sal_val, 2),
            age=age_val,
            performance=perf_val,
            productivity=75.0,
            satisfaction=sat_val,
            attrition_risk="Low",
            attrition_probability=0.0,
            promotion_readiness="Developing",
            promotion_score=0.0,
            cluster_segment="Core Workforce",
            raw_data_json=json.dumps(row.to_dict(), default=str)
        )
        emp_records.append(emp)

    db.bulk_save_objects(emp_records)
    db.commit()

def run_full_ml_pipeline(db: Session, dataset_id: int = None) -> Dict[str, Any]:
    """Runs all ML models, persists results into the database and model files."""
    df, meta = get_active_dataset_df(db, dataset_id)
    if df is None or meta is None:
        return {"success": False, "message": "No active dataset found to analyze."}

    is_hr, _ = is_valid_hr_dataset(df)
    if not is_hr:
        return {
            "success": True,
            "is_employee_dataset": False,
            "message": "The selected dataset does not contain workforce or employee columns (Department, Role, Salary, Performance, etc.).",
            "attrition": {"success": True, "target_found": False, "message": "No attrition target in non-employee dataset."},
            "promotion": {"success": True, "has_promotion_data": False, "promotion_candidates": []},
            "performance": {"success": True, "has_performance_data": False, "records": []},
            "productivity": {"success": True, "has_productivity_data": False, "records": []},
            "segmentation": {"success": False, "message": "Workforce clustering is disabled for non-employee datasets."}
        }

    # If employee records don't exist yet for this dataset, create them first
    emp_count = db.query(EmployeeRecord).filter(EmployeeRecord.dataset_id == meta.id).count()
    if emp_count == 0:
        sync_employee_records_from_df(db, meta, df)

    # 1. Attrition
    attrition_res = train_and_evaluate_attrition(df)

    # 2. Promotion
    promotion_res = evaluate_promotion_readiness(df)

    # 3. Performance
    perf_res = compute_performance_scores(df)

    # 4. Productivity
    prod_res = compute_productivity_indices(df)

    # 5. Segmentation
    seg_res = generate_employee_segments(df)

    # Sync with EmployeeRecord table in SQLite DB
    employees = db.query(EmployeeRecord).filter(EmployeeRecord.dataset_id == meta.id).all()
    if employees:
        for idx, emp in enumerate(employees):
            if idx < len(df):
                if attrition_res.get("scored_employees") and idx < len(attrition_res["scored_employees"]):
                    emp.attrition_risk = attrition_res["scored_employees"][idx]["attrition_risk"]
                    emp.attrition_probability = attrition_res["scored_employees"][idx]["attrition_probability"]

                if promotion_res.get("promotion_candidates") and idx < len(promotion_res["promotion_candidates"]):
                    emp.promotion_readiness = promotion_res["promotion_candidates"][idx]["promotion_readiness"]
                    emp.promotion_score = promotion_res["promotion_candidates"][idx]["promotion_score"]

                if perf_res.get("records") and idx < len(perf_res["records"]):
                    emp.performance = perf_res["records"][idx]["performance_score"]

                if prod_res.get("records") and idx < len(prod_res["records"]):
                    emp.productivity = prod_res["records"][idx]["productivity_index"]

                if seg_res.get("segment_names") and idx < len(seg_res["segment_names"]):
                    emp.cluster_segment = seg_res["segment_names"][idx]

        db.commit()

    return {
        "success": True,
        "is_employee_dataset": True,
        "dataset_id": meta.id,
        "attrition": attrition_res,
        "promotion": promotion_res,
        "performance": perf_res,
        "productivity": prod_res,
        "segmentation": seg_res
    }

def get_dashboard_data(db: Session, dataset_id: int = None) -> Dict[str, Any]:
    """Generates real KPIs and visualizations for the HR dashboard."""
    df, meta = get_active_dataset_df(db, dataset_id)
    if df is None:
        return {"success": False, "message": "No active dataset found.", "kpis": None}

    is_hr, hr_keys = is_valid_hr_dataset(df)
    if not is_hr:
        return {
            "success": True,
            "is_employee_dataset": False,
            "dataset_name": meta.filename,
            "message": "The selected dataset does not contain workforce or employee columns (Department, Role, Salary, Performance, etc.). Please select or upload an employee dataset.",
            "kpis": None,
            "department_distribution": [],
            "attrition_risk_distribution": [],
            "top_performers": [],
            "high_risk_employees": []
        }

    # Fetch employee records from DB
    emp_query = db.query(EmployeeRecord).filter(EmployeeRecord.dataset_id == meta.id)
    total_count = emp_query.count()

    # If records not yet created in DB or not yet scored, sync & run ML pipeline
    if total_count == 0:
        sync_employee_records_from_df(db, meta, df)
        run_full_ml_pipeline(db, meta.id)
        emp_query = db.query(EmployeeRecord).filter(EmployeeRecord.dataset_id == meta.id)
        total_count = emp_query.count()
    else:
        sample_emp = emp_query.first()
        if sample_emp and sample_emp.attrition_probability == 0.0:
            run_full_ml_pipeline(db, meta.id)
            emp_query = db.query(EmployeeRecord).filter(EmployeeRecord.dataset_id == meta.id)

    records = emp_query.all()

    # Aggregate KPIs
    perfs = [e.performance for e in records if e.performance is not None]
    prods = [e.productivity for e in records if e.productivity is not None]
    sats = [e.satisfaction for e in records if e.satisfaction is not None]

    avg_perf = round(float(np.mean(perfs)), 1) if perfs else 82.0
    avg_prod = round(float(np.mean(prods)), 1) if prods else 78.0
    avg_sat = round(float(np.mean(sats)), 1) if sats else 4.2

    high_risk_count = sum(1 for e in records if e.attrition_risk == "High")
    high_risk_pct = round((high_risk_count / total_count) * 100, 1) if total_count > 0 else 0.0

    promotion_ready_count = sum(1 for e in records if e.promotion_readiness == "Ready")
    promotion_ready_pct = round((promotion_ready_count / total_count) * 100, 1) if total_count > 0 else 0.0

    # Department breakdown
    dept_map = {}
    for e in records:
        d = e.department or "General"
        if d not in dept_map:
            dept_map[d] = {"count": 0, "high_risk": 0, "perf_sum": 0}
        dept_map[d]["count"] += 1
        if e.attrition_risk == "High":
            dept_map[d]["high_risk"] += 1
        if e.performance:
            dept_map[d]["perf_sum"] += e.performance

    dept_chart = [
        {
            "department": d,
            "employees": v["count"],
            "high_risk": v["high_risk"],
            "avg_performance": round(v["perf_sum"] / max(1, v["count"]), 1)
        }
        for d, v in dept_map.items()
    ]

    # Attrition Risk Distribution
    risk_dist = [
        {"name": "Low Risk", "value": sum(1 for e in records if e.attrition_risk == "Low"), "color": "#10b981"},
        {"name": "Medium Risk", "value": sum(1 for e in records if e.attrition_risk == "Medium"), "color": "#f59e0b"},
        {"name": "High Risk", "value": high_risk_count, "color": "#ef4444"}
    ]

    # Top Performers table
    top_performers = sorted(
        [{"employee_id": e.employee_id, "name": e.name, "department": e.department, "performance": e.performance, "productivity": e.productivity, "promotion_readiness": e.promotion_readiness}
         for e in records if e.performance is not None],
        key=lambda x: x["performance"],
        reverse=True
    )[:8]

    # High Risk Employees table
    high_risk_emps = sorted(
        [{"employee_id": e.employee_id, "name": e.name, "department": e.department, "attrition_probability": e.attrition_probability, "attrition_risk": e.attrition_risk, "performance": e.performance}
         for e in records if e.attrition_risk == "High"],
        key=lambda x: x["attrition_probability"],
        reverse=True
    )[:8]

    return {
        "success": True,
        "dataset_name": meta.filename,
        "kpis": {
            "total_employees": total_count,
            "avg_performance": avg_perf,
            "avg_productivity": avg_prod,
            "avg_satisfaction": avg_sat,
            "high_attrition_count": high_risk_count,
            "high_attrition_pct": high_risk_pct,
            "promotion_ready_count": promotion_ready_count,
            "promotion_ready_pct": promotion_ready_pct,
            "quality_score": meta.quality_score
        },
        "department_distribution": dept_chart,
        "attrition_risk_distribution": risk_dist,
        "top_performers": top_performers,
        "high_risk_employees": high_risk_emps
    }

