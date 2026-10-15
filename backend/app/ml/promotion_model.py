import os
import joblib
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

from app.core.config import MODELS_DIR
from app.ml.preprocessing import PreprocessingPipeline
from app.services.eda_service import detect_semantic_column

PROMOTION_MODEL_FILE = os.path.join(MODELS_DIR, "promotion_model.pkl")

def evaluate_promotion_readiness(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Evaluates promotion readiness. If historical promotion target exists, trains a supervised classifier.
    Otherwise calculates a transparent, explainable multi-factor Promotion Readiness Score (0-100).
    """
    # Detect target
    target_col = None
    possible_targets = ["promotion", "promoted", "is_promoted", "promotion_status", "promoted_last_5years"]
    for col in df.columns:
        if str(col).strip().lower() in possible_targets:
            target_col = col
            break

    # If supervised target exists with sufficient class distribution
    if target_col and df[target_col].nunique() >= 2:
        pipeline = PreprocessingPipeline()
        X, y, feature_cols = pipeline.prepare_features(df, target_col=target_col)
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        rf = RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=42)
        rf.fit(X_train, y_train)
        preds = rf.predict(X_test)
        probs = rf.predict_proba(X)[:, 1] if hasattr(rf, "predict_proba") else preds

        metrics = {
            "accuracy": round(float(accuracy_score(y_test, preds)) * 100, 2),
            "precision": round(float(precision_score(y_test, preds, zero_division=0)) * 100, 2),
            "recall": round(float(recall_score(y_test, preds, zero_division=0)) * 100, 2),
            "f1_score": round(float(f1_score(y_test, preds, zero_division=0)) * 100, 2),
        }

        # Save model
        joblib.dump({"model": rf, "pipeline": pipeline, "metrics": metrics}, PROMOTION_MODEL_FILE)

        readiness_scores = [round(float(p) * 100, 1) for p in probs]
        method_used = "Supervised RandomForest Model"
    else:
        # Extract features
        perf_col = detect_semantic_column(df, "performance")
        tenure_col = detect_semantic_column(df, "tenure")
        train_col = detect_semantic_column(df, "training")
        sat_col = detect_semantic_column(df, "satisfaction")
        role_col = detect_semantic_column(df, "job_role")
        dept_col = detect_semantic_column(df, "department")

        has_hr_features = any([perf_col, tenure_col, train_col, sat_col, role_col, dept_col])
        if not target_col and not has_hr_features:
            return {
                "success": True,
                "has_promotion_data": False,
                "message": "This dataset does not contain employee promotion or workforce evaluation metrics (e.g. Performance, Tenure, Role, Department). Promotion readiness evaluation is unavailable.",
                "readiness_distribution": {"Ready": 0, "Developing": 0, "Not Ready": 0},
                "promotion_candidates": []
            }

        # Multi-factor explainable score
        method_used = "Multi-Factor Explainable Readiness Engine"
        metrics = None

        readiness_scores = []
        for i in range(len(df)):
            score = 50.0  # baseline

            # Performance factor (+0 to +30)
            if perf_col and pd.notna(df[perf_col].iloc[i]):
                p_val = float(df[perf_col].iloc[i])
                if p_val <= 5.0:  # 1 to 5 scale
                    score += (p_val / 5.0) * 30
                else:  # 0 to 100 scale
                    score += (p_val / 100.0) * 30
            else:
                score += 15.0

            # Tenure factor (+0 to +20)
            if tenure_col and pd.notna(df[tenure_col].iloc[i]):
                t_val = float(df[tenure_col].iloc[i])
                # Peak readiness around 2-5 years in role / at company
                score += min(20.0, (t_val / 4.0) * 20.0)
            else:
                score += 10.0

            # Training factor (+0 to +15)
            if train_col and pd.notna(df[train_col].iloc[i]):
                tr_val = float(df[train_col].iloc[i])
                score += min(15.0, (tr_val / 20.0) * 15.0)
            else:
                score += 7.5

            # Satisfaction factor (+0 to +10)
            if sat_col and pd.notna(df[sat_col].iloc[i]):
                s_val = float(df[sat_col].iloc[i])
                if s_val <= 5.0:
                    score += (s_val / 5.0) * 10.0
                else:
                    score += (s_val / 100.0) * 10.0
            else:
                score += 5.0

            # Clamp between 10 and 98
            readiness_scores.append(round(min(98.0, max(10.0, score)), 1))

    # Categorize and build results
    readiness_counts = {"Ready": 0, "Developing": 0, "Not Ready": 0}
    scored_list = []

    id_col = detect_semantic_column(df, "employee_id")
    name_col = detect_semantic_column(df, "name")
    dept_col = detect_semantic_column(df, "department")
    role_col = detect_semantic_column(df, "job_role")

    for i in range(len(df)):
        score = readiness_scores[i]
        if score >= 75.0:
            status = "Ready"
            readiness_counts["Ready"] += 1
        elif score >= 55.0:
            status = "Developing"
            readiness_counts["Developing"] += 1
        else:
            status = "Not Ready"
            readiness_counts["Not Ready"] += 1

        emp_id = str(df[id_col].iloc[i]) if id_col and id_col in df.columns else f"EMP-{i+1:04d}"
        emp_name = str(df[name_col].iloc[i]) if name_col and name_col in df.columns else f"Employee {emp_id}"
        emp_dept = str(df[dept_col].iloc[i]) if dept_col and dept_col in df.columns else "General"
        emp_role = str(df[role_col].iloc[i]) if role_col and role_col in df.columns else "Specialist"

        scored_list.append({
            "employee_id": emp_id,
            "name": emp_name,
            "department": emp_dept,
            "job_role": emp_role,
            "promotion_score": score,
            "promotion_readiness": status
        })

    # Sort descending by score for pipeline view
    scored_list.sort(key=lambda x: x["promotion_score"], reverse=True)

    return {
        "success": True,
        "has_promotion_data": True,
        "method": method_used,
        "supervised_target_found": target_col is not None,
        "target_column": target_col,
        "metrics": metrics,
        "readiness_distribution": readiness_counts,
        "promotion_candidates": scored_list
    }
