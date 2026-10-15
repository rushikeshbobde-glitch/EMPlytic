import os
import joblib
from typing import Dict, Any
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from app.core.config import MODELS_DIR
from app.ml.preprocessing import PreprocessingPipeline
from app.services.eda_service import detect_semantic_column

PERF_MODEL_FILE = os.path.join(MODELS_DIR, "performance_model.pkl")

def compute_performance_scores(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes AI Performance Scores (0-100) and classifications.
    Uses regression if historical continuous target exists, else calculates transparent composite score.
    """
    perf_col = detect_semantic_column(df, "performance")
    
    # Check if target is already a continuous performance percentage
    is_regression_target = False
    if perf_col and df[perf_col].dtype in [np.float64, np.int64]:
        if df[perf_col].nunique() > 10 and df[perf_col].max() <= 100:
            is_regression_target = True

    if is_regression_target:
        pipeline = PreprocessingPipeline()
        X, y, feature_cols = pipeline.prepare_features(df, target_col=perf_col)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        rf = RandomForestRegressor(n_estimators=100, random_state=42)
        rf.fit(X_train, y_train)
        preds = rf.predict(X_test)
        
        metrics = {
            "mae": round(float(mean_absolute_error(y_test, preds)), 2),
            "rmse": round(float(np.sqrt(mean_squared_error(y_test, preds))), 2),
            "r2": round(float(r2_score(y_test, preds)), 2)
        }
        joblib.dump({"model": rf, "pipeline": pipeline, "metrics": metrics}, PERF_MODEL_FILE)
        all_scores = rf.predict(X)
        method_used = "Supervised RandomForest Regressor"
    else:
        # Calculate composite score from available metrics
        sat_col = detect_semantic_column(df, "satisfaction")
        train_col = detect_semantic_column(df, "training")
        prod_col = detect_semantic_column(df, "productivity")
        dept_col = detect_semantic_column(df, "department")
        role_col = detect_semantic_column(df, "job_role")

        has_features = any([perf_col, sat_col, prod_col, train_col, dept_col, role_col])
        if not has_features:
            return {
                "success": True,
                "has_performance_data": False,
                "message": "This dataset does not contain employee performance evaluation metrics.",
                "average_score": None,
                "categories": {},
                "department_performance": [],
                "records": []
            }

        method_used = "Transparent Composite Performance Scoring Engine"
        metrics = None

        all_scores = []
        for i in range(len(df)):
            score = 65.0
            if perf_col and pd.notna(df[perf_col].iloc[i]):
                raw_p = float(df[perf_col].iloc[i])
                if raw_p <= 5.0:
                    score = 50.0 + (raw_p / 5.0) * 40.0
                elif raw_p <= 100.0:
                    score = raw_p
            
            # Minor adjustments based on satisfaction and training
            if sat_col and pd.notna(df[sat_col].iloc[i]):
                sat_val = float(df[sat_col].iloc[i])
                score += ((sat_val / 5.0) - 0.5) * 5.0 if sat_val <= 5.0 else 0
            if train_col and pd.notna(df[train_col].iloc[i]):
                score += min(5.0, float(df[train_col].iloc[i]) * 0.2)
                
            all_scores.append(round(min(99.0, max(40.0, score)), 1))

    # Categorize into:
    # 90-100 Excellent, 75-89 Good, 60-74 Average, Below 60 Needs Improvement
    categories = {
        "Excellent (90-100)": 0,
        "Good (75-89)": 0,
        "Average (60-74)": 0,
        "Needs Improvement (<60)": 0
    }

    id_col = detect_semantic_column(df, "employee_id")
    name_col = detect_semantic_column(df, "name")
    dept_col = detect_semantic_column(df, "department")
    role_col = detect_semantic_column(df, "job_role")

    scored_records = []
    for i in range(len(df)):
        s = float(all_scores[i])
        if s >= 90:
            cat = "Excellent"
            categories["Excellent (90-100)"] += 1
        elif s >= 75:
            cat = "Good"
            categories["Good (75-89)"] += 1
        elif s >= 60:
            cat = "Average"
            categories["Average (60-74)"] += 1
        else:
            cat = "Needs Improvement"
            categories["Needs Improvement (<60)"] += 1

        emp_id = str(df[id_col].iloc[i]) if id_col and id_col in df.columns else f"EMP-{i+1:04d}"
        emp_name = str(df[name_col].iloc[i]) if name_col and name_col in df.columns else f"Employee {emp_id}"
        emp_dept = str(df[dept_col].iloc[i]) if dept_col and dept_col in df.columns else "General"
        emp_role = str(df[role_col].iloc[i]) if role_col and role_col in df.columns else "Specialist"

        scored_records.append({
            "employee_id": emp_id,
            "name": emp_name,
            "department": emp_dept,
            "job_role": emp_role,
            "performance_score": s,
            "performance_category": cat
        })

    avg_score = round(float(np.mean(all_scores)), 1)
    
    # Department breakdown
    dept_scores = {}
    for r in scored_records:
        d = r["department"]
        if d not in dept_scores:
            dept_scores[d] = []
        dept_scores[d].append(r["performance_score"])

    dept_performance = [
        {"department": d, "avg_performance": round(float(np.mean(vals)), 1), "count": len(vals)}
        for d, vals in dept_scores.items()
    ]

    return {
        "success": True,
        "has_performance_data": True,
        "method": method_used,
        "average_score": avg_score,
        "metrics": metrics,
        "categories": categories,
        "department_performance": dept_performance,
        "records": scored_records
    }
