import os
import re
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np

# Semantic alias mappings for HR datasets
SEMANTIC_ALIASES = {
    "employee_id": ["employee_id", "empid", "emp_id", "staff_id", "employee number", "employee_number", "emp no", "emp_no", "worker_id", "worker id", "staff id", "employee id"],
    "name": ["employee_name", "employee name", "emp_name", "staff_name", "worker_name", "full_name", "fullname", "name"],
    "department": ["department", "dept", "division", "business_unit", "team", "organization unit"],
    "job_role": ["job_role", "role", "designation", "job role", "position", "job_title", "job title"],
    "salary": ["salary", "monthly_income", "monthly income", "compensation", "hourly_rate", "pay_rate", "annual_salary", "base_pay", "income"],
    "age": ["age", "years_old", "cf_age band", "age_years"],
    "gender": ["gender", "sex"],
    "performance": ["performance_rating", "performance", "performancescore", "performance score", "perf_rating", "appraisal_rating", "evaluation_score"],
    "productivity": ["productivity", "task_completion", "productivity_score", "work_hours", "average_hours_worked_per_week", "hours_worked"],
    "satisfaction": ["job_satisfaction", "job satisfaction", "environment_satisfaction", "satisfaction_level", "work_satisfaction", "satisfaction"],
    "attrition": ["attrition", "left", "exited", "turnover", "cf_attrition label", "resigned", "attrition_status"],
    "promotion": ["promotion", "promoted", "promotion_status", "is_promoted", "years_since_last_promotion", "promoted_last_5years"],
    "tenure": ["years_at_company", "total_working_years", "tenure", "years_in_current_role", "experience_years", "years at company", "total working years"],
    "overtime": ["overtime", "over time", "ot", "over_time"],
    "attendance": ["absenteeism", "attendance", "absent_days", "leave_count", "days_absent"],
    "skills": ["skills", "skill_set", "technologies", "competencies", "education_field", "education field", "certifications"],
    "training": ["training_hours_last_year", "training times last year", "training_sessions", "training_hours"]
}

NON_HR_IDENTIFIERS = ["customer", "product", "item", "order", "invoice", "client", "vendor", "account", "store", "book", "vehicle"]

CORE_HR_KEYS = [
    "department", "job_role", "salary", "performance", "productivity",
    "satisfaction", "attrition", "promotion", "tenure", "attendance", "skills", "training"
]

def detect_semantic_column(df: pd.DataFrame, semantic_key: str) -> Optional[str]:
    """Finds the best matching column name in df for a given semantic concept."""
    aliases = SEMANTIC_ALIASES.get(semantic_key, [])
    lower_cols = {str(c).strip().lower(): c for c in df.columns}

    # If column clearly belongs to a non-HR domain (e.g. customer_id, product_name), reject employee-specific matches
    for col_str, orig_col in lower_cols.items():
        if semantic_key in ["employee_id", "name", "job_role", "salary", "performance"]:
            if any(non_hr in col_str for non_hr in NON_HR_IDENTIFIERS):
                continue

    # 1. Exact case-insensitive match
    for alias in aliases:
        for col_str, orig_col in lower_cols.items():
            if semantic_key in ["employee_id", "name"] and any(non_hr in col_str for non_hr in NON_HR_IDENTIFIERS):
                continue
            if alias.lower() == col_str:
                return orig_col

    # 2. Normalized substring match
    for alias in aliases:
        clean_alias = re.sub(r"[^a-zA-Z0-9]", "", alias.lower())
        for col_name in df.columns:
            col_str = str(col_name).lower()
            if semantic_key in ["employee_id", "name"] and any(non_hr in col_str for non_hr in NON_HR_IDENTIFIERS):
                continue
            clean_col = re.sub(r"[^a-zA-Z0-9]", "", col_str)
            if clean_alias == clean_col or (len(clean_alias) >= 4 and clean_alias in clean_col):
                return col_name

    return None

def detect_all_semantic_columns(df: pd.DataFrame) -> Dict[str, Optional[str]]:
    """Maps all standard HR semantic concepts to columns in the provided dataframe."""
    mapping = {}
    for key in SEMANTIC_ALIASES.keys():
        mapping[key] = detect_semantic_column(df, key)
    return mapping

def is_valid_hr_dataset(df: pd.DataFrame) -> tuple[bool, list[str]]:
    """
    Evaluates whether a dataset contains sufficient HR/workforce domain signals.
    Returns (is_valid, detected_hr_features).
    """
    if df is None or len(df) == 0 or len(df.columns) == 0:
        return False, []

    mapping = detect_all_semantic_columns(df)
    detected_hr = [k for k in CORE_HR_KEYS if mapping.get(k) is not None]

    has_emp_id = mapping.get("employee_id") is not None
    # Require at least 2 core HR features or (1 core HR feature + an employee_id)
    is_valid = len(detected_hr) >= 2 or (has_emp_id and len(detected_hr) >= 1)

    return is_valid, detected_hr

def generate_eda_report(df: pd.DataFrame, filename: str = "dataset") -> Dict[str, Any]:
    """
    Generates a full EDA report on the dataset adapting dynamically to any columns.
    Never crashes when columns are missing; reports missing features gracefully.
    """
    total_rows = int(len(df))
    total_cols = int(len(df.columns))

    if total_rows == 0 or total_cols == 0:
        return {
            "success": False,
            "message": "The dataset is empty.",
            "dataset": {"rows": 0, "columns": 0}
        }

    # Numeric & Categorical classification
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

    # Missing & Quality stats
    total_cells = total_rows * total_cols
    missing_cells = int(df.isnull().sum().sum())
    completeness = round(((total_cells - missing_cells) / total_cells) * 100, 2) if total_cells > 0 else 100.0
    missing_pct = round((missing_cells / total_cells) * 100, 2) if total_cells > 0 else 0.0
    duplicate_count = int(df.duplicated().sum())
    duplicate_pct = round((duplicate_count / total_rows) * 100, 2) if total_rows > 0 else 0.0

    # Semantic column detection
    semantic_map = detect_all_semantic_columns(df)

    # Column Details
    column_details = []
    for col in df.columns:
        is_num = col in numeric_cols
        null_cnt = int(df[col].isnull().sum())
        uniq_cnt = int(df[col].nunique())
        samples = df[col].dropna().head(3).tolist()
        # Ensure JSON serializable samples
        clean_samples = [int(s) if isinstance(s, (np.integer, int)) else (float(s) if isinstance(s, (np.floating, float)) else str(s)) for s in samples]

        col_meta = {
            "name": str(col),
            "type": "Numeric" if is_num else "Categorical",
            "null_count": null_cnt,
            "null_percentage": round((null_cnt / total_rows) * 100, 1) if total_rows else 0,
            "unique_count": uniq_cnt,
            "sample_values": clean_samples
        }
        column_details.append(col_meta)

    # Descriptive Statistics for Numeric Columns
    numeric_statistics = {}
    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) > 0:
            numeric_statistics[col] = {
                "mean": round(float(series.mean()), 2),
                "median": round(float(series.median()), 2),
                "std": round(float(series.std()), 2) if len(series) > 1 else 0.0,
                "minimum": round(float(series.min()), 2),
                "maximum": round(float(series.max()), 2),
                "q25": round(float(series.quantile(0.25)), 2),
                "q75": round(float(series.quantile(0.75)), 2)
            }

    # Department Analysis
    dept_col = semantic_map.get("department")
    department_distribution = []
    if dept_col and dept_col in df.columns:
        counts = df[dept_col].fillna("Unknown").value_counts().head(10)
        salary_col = semantic_map.get("salary")
        perf_col = semantic_map.get("performance")

        for dept_name, count in counts.items():
            dept_sub = df[df[dept_col] == dept_name]
            item = {
                "department": str(dept_name),
                "employees": int(count),
                "percentage": round((count / total_rows) * 100, 1)
            }
            if salary_col and salary_col in df.columns:
                sal_mean = dept_sub[salary_col].mean()
                item["avg_salary"] = round(float(sal_mean), 2) if not pd.isna(sal_mean) else None
            if perf_col and perf_col in df.columns:
                perf_mean = dept_sub[perf_col].mean()
                item["avg_performance"] = round(float(perf_mean), 2) if not pd.isna(perf_mean) else None
            department_distribution.append(item)

    # Key Histograms for Numeric Distribution (Binned for Recharts)
    histograms = {}
    target_hist_keys = ["age", "salary", "performance", "productivity", "satisfaction", "tenure"]
    for key in target_hist_keys:
        col = semantic_map.get(key)
        if col and col in df.columns and col in numeric_cols:
            series = pd.to_numeric(df[col], errors='coerce').dropna()
            if len(series) > 0 and series.nunique() > 1:
                try:
                    counts, bin_edges = np.histogram(series, bins=min(6, series.nunique()))
                    hist_data = []
                    for i in range(len(counts)):
                        low = round(float(bin_edges[i]), 1 if bin_edges[i] < 10 else 0)
                        high = round(float(bin_edges[i+1]), 1 if bin_edges[i+1] < 10 else 0)
                        range_label = f"{low:g} – {high:g}"
                        hist_data.append({
                            "range": range_label,
                            "count": int(counts[i])
                        })
                    histograms[key] = {
                        "column_name": col,
                        "data": hist_data
                    }
                except Exception:
                    pass

    # Categorical Distributions (Value counts for top categorical columns)
    categorical_distributions = {}
    for col in categorical_cols[:6]:
        top_vals = df[col].fillna("Unknown").value_counts().head(8)
        categorical_distributions[col] = [
            {"category": str(cat), "count": int(cnt), "percentage": round((cnt / total_rows) * 100, 1)}
            for cat, cnt in top_vals.items()
        ]

    # Correlation Matrix (Top meaningful numeric features with variance)
    correlation_data = []
    correlation_columns = []
    
    # Exclude ID columns and zero-variance columns
    meaningful_num = []
    for c in numeric_cols:
        clean_name = str(c).lower().replace("_", "").replace(" ", "")
        if clean_name in ["id", "employeeid", "recordid", "empid", "employeecount", "standardhours"]:
            continue
        if df[c].nunique() > 1:
            meaningful_num.append(c)

    if len(meaningful_num) >= 2:
        top_num = meaningful_num[:7] # up to 7 features for optimal matrix readability
        corr_df = df[top_num].corr().round(2).fillna(0)
        correlation_columns = [str(c) for c in top_num]
        for row_idx in top_num:
            row_dict = {"feature": str(row_idx)}
            for col_idx in top_num:
                row_dict[str(col_idx)] = float(corr_df.loc[row_idx, col_idx])
            correlation_data.append(row_dict)

    # Feature Availability Status Map
    feature_status = {}
    feature_descriptions = {
        "employee_id": "Employee Identifier",
        "department": "Department / Division",
        "job_role": "Job Role / Title",
        "salary": "Compensation / Monthly Income",
        "age": "Employee Age",
        "performance": "Performance Rating / Score",
        "productivity": "Productivity / Work Hours",
        "satisfaction": "Job / Environment Satisfaction",
        "attrition": "Historical Attrition / Turnover Status",
        "promotion": "Promotion History / Readiness",
        "skills": "Technical Skills / Education Field",
        "overtime": "Overtime Hours / Status",
        "attendance": "Absenteeism / Attendance Rate"
    }

    for key, desc in feature_descriptions.items():
        found_col = semantic_map.get(key)
        feature_status[key] = {
            "name": desc,
            "available": found_col is not None,
            "column_matched": found_col or "Not available in this dataset."
        }

    is_hr, detected_hr_keys = is_valid_hr_dataset(df)

    return {
        "success": True,
        "filename": filename,
        "is_employee_dataset": is_hr,
        "hr_features_detected": detected_hr_keys,
        "dataset": {
            "rows": total_rows,
            "columns": total_cols,
            "numeric_columns_count": len(numeric_cols),
            "categorical_columns_count": len(categorical_cols),
            "numeric_columns": numeric_cols,
            "categorical_columns": categorical_cols,
        },
        "data_quality": {
            "completeness": completeness,
            "missing_percentage": missing_pct,
            "missing_values": missing_cells,
            "duplicate_records": duplicate_count,
            "duplicate_percentage": duplicate_pct,
            "quality_score": round(max(0.0, min(100.0, completeness - (duplicate_pct * 1.5))), 1)
        },
        "semantic_mapping": semantic_map,
        "feature_status": feature_status,
        "column_details": column_details,
        "statistics": numeric_statistics,
        "department_distribution": department_distribution,
        "histograms": histograms,
        "categorical_distributions": categorical_distributions,
        "correlation": {
            "columns": correlation_columns,
            "matrix": correlation_data
        }
    }
