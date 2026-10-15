from typing import Dict, Any
import pandas as pd
import numpy as np

from app.services.eda_service import detect_semantic_column

def compute_productivity_indices(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes Employee Productivity Index (0-100) using available metrics:
    work hours, performance, absenteeism/attendance, project count, overtime.
    """
    hours_col = detect_semantic_column(df, "productivity")
    perf_col = detect_semantic_column(df, "performance")
    absent_col = detect_semantic_column(df, "attendance")
    ot_col = detect_semantic_column(df, "overtime")
    dept_col = detect_semantic_column(df, "department")
    role_col = detect_semantic_column(df, "job_role")

    has_features = any([hours_col, perf_col, absent_col, ot_col, dept_col, role_col])
    if not has_features:
        return {
            "success": True,
            "has_productivity_data": False,
            "message": "This dataset does not contain workforce productivity, work hours, or attendance metrics.",
            "average_productivity": None,
            "department_productivity": [],
            "records": []
        }

    indices = []
    for i in range(len(df)):
        # Base productivity index
        base_index = 68.0

        # Hours contribution (optimal is ~40-45 hrs/wk)
        if hours_col and pd.notna(df[hours_col].iloc[i]):
            h_val = float(df[hours_col].iloc[i])
            if h_val > 60:
                # Diminishing returns / burnout
                base_index += 12.0
            elif h_val >= 40:
                base_index += 16.0
            elif h_val >= 30:
                base_index += 8.0
            else:
                base_index -= 10.0
        else:
            base_index += 10.0

        # Performance impact (+0 to +15)
        if perf_col and pd.notna(df[perf_col].iloc[i]):
            p_val = float(df[perf_col].iloc[i])
            if p_val <= 5.0:
                base_index += (p_val / 5.0) * 15.0
            else:
                base_index += (p_val / 100.0) * 15.0
        else:
            base_index += 8.0

        # Attendance / Absenteeism penalty (-0 to -15)
        if absent_col and pd.notna(df[absent_col].iloc[i]):
            ab_val = float(df[absent_col].iloc[i])
            # Higher absenteeism reduces index
            base_index -= min(15.0, (ab_val / 20.0) * 15.0)

        # Overtime status
        if ot_col and pd.notna(df[ot_col].iloc[i]):
            ot_str = str(df[ot_col].iloc[i]).strip().lower()
            if ot_str in ["yes", "1", "true", "y"]:
                base_index += 3.0  # extra output short term

        clamped = round(min(99.0, max(35.0, base_index)), 1)
        indices.append(clamped)

    id_col = detect_semantic_column(df, "employee_id")
    name_col = detect_semantic_column(df, "name")
    dept_col = detect_semantic_column(df, "department")
    role_col = detect_semantic_column(df, "job_role")

    records = []
    for i in range(len(df)):
        emp_id = str(df[id_col].iloc[i]) if id_col and id_col in df.columns else f"EMP-{i+1:04d}"
        emp_name = str(df[name_col].iloc[i]) if name_col and name_col in df.columns else f"Employee {emp_id}"
        emp_dept = str(df[dept_col].iloc[i]) if dept_col and dept_col in df.columns else "General"
        emp_role = str(df[role_col].iloc[i]) if role_col and role_col in df.columns else "Specialist"

        records.append({
            "employee_id": emp_id,
            "name": emp_name,
            "department": emp_dept,
            "job_role": emp_role,
            "productivity_index": indices[i]
        })

    # Department productivity
    dept_map = {}
    for r in records:
        d = r["department"]
        if d not in dept_map:
            dept_map[d] = []
        dept_map[d].append(r["productivity_index"])

    dept_productivity = [
        {"department": d, "avg_productivity": round(float(np.mean(vals)), 1), "count": len(vals)}
        for d, vals in dept_map.items()
    ]

    return {
        "success": True,
        "has_productivity_data": True,
        "average_productivity": round(float(np.mean(indices)), 1),
        "department_productivity": dept_productivity,
        "records": records
    }
