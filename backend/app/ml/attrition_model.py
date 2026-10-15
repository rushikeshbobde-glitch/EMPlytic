import os
import joblib
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)
from sklearn.model_selection import train_test_split

from app.core.config import MODELS_DIR
from app.ml.preprocessing import PreprocessingPipeline
from app.services.eda_service import detect_semantic_column

MODEL_FILE_PATH = os.path.join(MODELS_DIR, "attrition_model.pkl")

def train_and_evaluate_attrition(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Trains RandomForest and GradientBoosting classifiers if an attrition target column is present.
    Evaluates both, handles class imbalance, saves the best model, and scores the dataset.
    """
    target_col = detect_semantic_column(df, "attrition")
    if not target_col or target_col not in df.columns:
        return {
            "trained": False,
            "target_found": False,
            "message": "No historical attrition target column (e.g. 'Attrition', 'Left', 'Exited') detected in this dataset.",
            "metrics": None
        }

    pipeline = PreprocessingPipeline()
    X, y, feature_cols = pipeline.prepare_features(df, target_col=target_col)

    if y is None or len(np.unique(y)) < 2:
        return {
            "trained": False,
            "target_found": True,
            "message": "Target column has insufficient variation (requires at least 2 distinct classes).",
            "metrics": None
        }

    # Stratified Train/Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 1. Random Forest with balanced class weights
    rf = RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=42)
    rf.fit(X_train, y_train)
    rf_preds = rf.predict(X_test)
    rf_probs = rf.predict_proba(X_test)[:, 1] if hasattr(rf, "predict_proba") else rf_preds

    rf_f1 = float(f1_score(y_test, rf_preds, zero_division=0))
    rf_acc = float(accuracy_score(y_test, rf_preds))
    rf_prec = float(precision_score(y_test, rf_preds, zero_division=0))
    rf_rec = float(recall_score(y_test, rf_preds, zero_division=0))
    try:
        rf_auc = float(roc_auc_score(y_test, rf_probs))
    except Exception:
        rf_auc = 0.5

    # 2. Gradient Boosting Classifier
    gb = GradientBoostingClassifier(n_estimators=100, random_state=42)
    gb.fit(X_train, y_train)
    gb_preds = gb.predict(X_test)
    gb_probs = gb.predict_proba(X_test)[:, 1] if hasattr(gb, "predict_proba") else gb_preds

    gb_f1 = float(f1_score(y_test, gb_preds, zero_division=0))
    gb_acc = float(accuracy_score(y_test, gb_preds))
    gb_prec = float(precision_score(y_test, gb_preds, zero_division=0))
    gb_rec = float(recall_score(y_test, gb_preds, zero_division=0))
    try:
        gb_auc = float(roc_auc_score(y_test, gb_probs))
    except Exception:
        gb_auc = 0.5

    # Select Best Model
    if rf_f1 >= gb_f1:
        best_model = rf
        best_model_name = "RandomForestClassifier"
        best_metrics = {
            "accuracy": round(rf_acc * 100, 2),
            "precision": round(rf_prec * 100, 2),
            "recall": round(rf_rec * 100, 2),
            "f1_score": round(rf_f1 * 100, 2),
            "roc_auc": round(rf_auc * 100, 2),
            "confusion_matrix": confusion_matrix(y_test, rf_preds).tolist()
        }
    else:
        best_model = gb
        best_model_name = "GradientBoostingClassifier"
        best_metrics = {
            "accuracy": round(gb_acc * 100, 2),
            "precision": round(gb_prec * 100, 2),
            "recall": round(gb_rec * 100, 2),
            "f1_score": round(gb_f1 * 100, 2),
            "roc_auc": round(gb_auc * 100, 2),
            "confusion_matrix": confusion_matrix(y_test, gb_preds).tolist()
        }

    # Model comparison object
    comparison = {
        "Random Forest": {
            "accuracy": round(rf_acc * 100, 2),
            "f1_score": round(rf_f1 * 100, 2),
            "roc_auc": round(rf_auc * 100, 2)
        },
        "Gradient Boosting": {
            "accuracy": round(gb_acc * 100, 2),
            "f1_score": round(gb_f1 * 100, 2),
            "roc_auc": round(gb_auc * 100, 2)
        }
    }

    # Feature Importance & SHAP Explainability
    from app.ml.explainability.shap_explainer import generate_shap_explanations
    shap_factors = generate_shap_explanations(best_model, X, feature_cols)

    feature_importances = []
    if hasattr(best_model, "feature_importances_"):
        importances = best_model.feature_importances_
        sorted_indices = np.argsort(importances)[::-1]
        for idx in sorted_indices[:10]:
            feature_importances.append({
                "feature": feature_cols[idx],
                "importance": round(float(importances[idx]) * 100, 2)
            })

    # Save Model Artifact
    artifact = {
        "model": best_model,
        "pipeline": pipeline,
        "metrics": best_metrics,
        "best_model_name": best_model_name,
        "target_col": target_col,
        "feature_cols": feature_cols,
        "shap_explanations": shap_factors
    }
    joblib.dump(artifact, MODEL_FILE_PATH)


    # Score Full Dataset
    all_probs = best_model.predict_proba(X)[:, 1] if hasattr(best_model, "predict_proba") else best_model.predict(X)
    
    risk_counts = {"Low": 0, "Medium": 0, "High": 0}
    scored_employees = []

    id_col = detect_semantic_column(df, "employee_id")
    dept_col = detect_semantic_column(df, "department")
    role_col = detect_semantic_column(df, "job_role")
    name_col = detect_semantic_column(df, "name")

    for i in range(len(df)):
        prob = float(all_probs[i])
        if prob >= 0.55:
            risk_level = "High"
            risk_counts["High"] += 1
        elif prob >= 0.30:
            risk_level = "Medium"
            risk_counts["Medium"] += 1
        else:
            risk_level = "Low"
            risk_counts["Low"] += 1

        emp_id = str(df[id_col].iloc[i]) if id_col and id_col in df.columns else f"EMP-{i+1:04d}"
        emp_name = str(df[name_col].iloc[i]) if name_col and name_col in df.columns else f"Employee {emp_id}"
        emp_dept = str(df[dept_col].iloc[i]) if dept_col and dept_col in df.columns else "General"
        emp_role = str(df[role_col].iloc[i]) if role_col and role_col in df.columns else "Specialist"

        scored_employees.append({
            "employee_id": emp_id,
            "name": emp_name,
            "department": emp_dept,
            "job_role": emp_role,
            "attrition_probability": round(prob * 100, 1),
            "attrition_risk": risk_level,
            "actual_attrition": int(y[i]) if y is not None else None
        })

    return {
        "trained": True,
        "target_found": True,
        "target_column": target_col,
        "best_model_name": best_model_name,
        "metrics": best_metrics,
        "model_comparison": comparison,
        "feature_importances": feature_importances,
        "shap_factors": shap_factors,
        "risk_distribution": risk_counts,
        "scored_employees": scored_employees
    }

