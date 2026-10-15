from typing import Dict, Any, List
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.db.models import EmployeeRecord, DatasetMetadata
from app.services.analytics_service import get_active_dataset_df
from app.services.eda_service import detect_semantic_column, is_valid_hr_dataset

def generate_explainable_insights(db: Session, dataset_id: int = None) -> Dict[str, Any]:
    """
    Generates explainable, evidence-based AI insights from actual dataset metrics across:
    Performance, Attrition, Productivity, Satisfaction, Skills, and Workforce demographics.
    """
    df, meta = get_active_dataset_df(db, dataset_id)
    if df is None:
        return {"success": False, "insights": []}

    is_hr, _ = is_valid_hr_dataset(df)
    if not is_hr:
        return {
            "success": True,
            "is_employee_dataset": False,
            "message": "The selected dataset does not contain workforce or employee columns. Strategic HR insights require an employee dataset.",
            "insights": []
        }

    insights = []
    total_employees = len(df)

    # 1. ATTRITION INSIGHT
    attr_col = detect_semantic_column(df, "attrition")
    dept_col = detect_semantic_column(df, "department")
    ot_col = detect_semantic_column(df, "overtime")

    if attr_col and attr_col in df.columns:
        attr_norm = df[attr_col].astype(str).str.strip().str.lower()
        left_mask = attr_norm.isin(["yes", "1", "true", "left", "exited"])
        attr_count = int(left_mask.sum())
        attr_rate = round((attr_count / total_employees) * 100, 1) if total_employees else 0

        # Department with highest attrition
        if dept_col and dept_col in df.columns:
            dept_attr = df[left_mask][dept_col].value_counts()
            if len(dept_attr) > 0:
                worst_dept = dept_attr.index[0]
                worst_dept_count = int(dept_attr.iloc[0])
                insights.append({
                    "id": "ins-attr-1",
                    "category": "Attrition",
                    "title": f"Turnover Concentration in {worst_dept}",
                    "description": f"{worst_dept} accounts for {worst_dept_count} ({round((worst_dept_count / max(1, attr_count)) * 100, 1)}%) of all historical attrition instances in this dataset. The overall attrition rate stands at {attr_rate}%.",
                    "impact": "High" if attr_rate > 15 else "Medium",
                    "recommendation": f"Conduct targeted stay-interviews and compensation reviews within {worst_dept} to identify specific retention blockers."
                })

        # Overtime correlation with attrition
        if ot_col and ot_col in df.columns:
            ot_norm = df[ot_col].astype(str).str.strip().str.lower()
            ot_mask = ot_norm.isin(["yes", "1", "true", "y"])
            ot_attr_rate = round((len(df[ot_mask & left_mask]) / max(1, len(df[ot_mask]))) * 100, 1)
            non_ot_attr_rate = round((len(df[~ot_mask & left_mask]) / max(1, len(df[~ot_mask]))) * 100, 1)

            if ot_attr_rate > non_ot_attr_rate:
                insights.append({
                    "id": "ins-attr-2",
                    "category": "Attrition",
                    "title": "Overtime Burden Accelerates Flight Risk",
                    "description": f"Employees working overtime exhibit a {ot_attr_rate}% turnover rate, compared to {non_ot_attr_rate}% for non-overtime staff ({round(ot_attr_rate - non_ot_attr_rate, 1)}% variance).",
                    "impact": "High",
                    "recommendation": "Institute workload capping and quarterly overtime audits to prevent team burnout."
                })

    # 2. PERFORMANCE INSIGHT
    perf_col = detect_semantic_column(df, "performance")
    sal_col = detect_semantic_column(df, "salary")

    if perf_col and perf_col in df.columns:
        p_series = pd.to_numeric(df[perf_col], errors="coerce").dropna()
        if len(p_series) > 0:
            high_perf_thresh = 4.0 if p_series.max() <= 5.0 else 85.0
            top_performers_count = int((p_series >= high_perf_thresh).sum())
            top_perf_pct = round((top_performers_count / len(p_series)) * 100, 1)

            insights.append({
                "id": "ins-perf-1",
                "category": "Performance",
                "title": f"High-Performance Talent Core ({top_perf_pct}%)",
                "description": f"{top_performers_count} employees qualify as elite tier performers. Preserving this group is critical to maintaining operational benchmarks.",
                "impact": "High",
                "recommendation": "Design dedicated retention equity and accelerated leadership pipelines for high-tier performers."
            })

            # Salary parity among top performers
            if sal_col and sal_col in df.columns:
                sal_series = pd.to_numeric(df[sal_col], errors="coerce").dropna()
                avg_sal_top = df[p_series >= high_perf_thresh][sal_col].mean()
                avg_sal_all = sal_series.mean()
                if avg_sal_top and avg_sal_all and avg_sal_top < avg_sal_all:
                    insights.append({
                        "id": "ins-perf-2",
                        "category": "Performance",
                        "title": "Compensation Inversion for Top Performers",
                        "description": f"Average compensation for top performers (${avg_sal_top:,.0f}) lags behind company-wide average (${avg_sal_all:,.0f}), posing an acute flight hazard.",
                        "impact": "High",
                        "recommendation": "Immediately execute merit-based compensation adjustments for under-indexed high performers."
                    })

    # 3. PRODUCTIVITY & SATISFACTION INSIGHTS
    sat_col = detect_semantic_column(df, "satisfaction")
    if sat_col and sat_col in df.columns:
        s_series = pd.to_numeric(df[sat_col], errors="coerce").dropna()
        if len(s_series) > 0:
            low_sat_thresh = 2.0 if s_series.max() <= 5.0 else 60.0
            disengaged_count = int((s_series <= low_sat_thresh).sum())
            disengaged_pct = round((disengaged_count / len(s_series)) * 100, 1)

            insights.append({
                "id": "ins-sat-1",
                "category": "Satisfaction",
                "title": f"Disengagement Vulnerability ({disengaged_pct}%)",
                "description": f"{disengaged_count} staff members report low job/environment satisfaction, signaling dissatisfaction with team dynamics or physical/remote setup.",
                "impact": "Medium" if disengaged_pct < 20 else "High",
                "recommendation": "Conduct anonymous pulse surveys and manager check-ins focusing on work-life harmony and recognition."
            })

    # 4. WORKFORCE DEMOGRAPHICS INSIGHT
    age_col = detect_semantic_column(df, "age")
    tenure_col = detect_semantic_column(df, "tenure")
    if tenure_col and tenure_col in df.columns:
        t_series = pd.to_numeric(df[tenure_col], errors="coerce").dropna()
        if len(t_series) > 0:
            avg_tenure = round(float(t_series.mean()), 1)
            new_hires_count = int((t_series <= 1).sum())
            new_hires_pct = round((new_hires_count / len(t_series)) * 100, 1)

            insights.append({
                "id": "ins-work-1",
                "category": "Workforce",
                "title": f"Onboarding Ramp Exposure ({new_hires_pct}% New Hires)",
                "description": f"With {new_hires_count} employees having 1 year or less tenure, robust onboarding programs directly dictate 12-month productivity output.",
                "impact": "Medium",
                "recommendation": "Standardize 30-60-90 day milestone reviews and pair new hires with senior departmental mentors."
            })

    # Default fallback insight if dataset has sparse columns
    if len(insights) == 0:
        insights.append({
            "id": "ins-gen-1",
            "category": "Workforce",
            "title": "Baseline Population Analyzed",
            "description": f"Analyzed {total_employees} records across {len(df.columns)} dimensions. Automated health score is {meta.quality_score}%.",
            "impact": "Low",
            "recommendation": "Enrich the dataset with performance, tenure, and satisfaction metrics to generate predictive talent signals."
        })

    return {
        "success": True,
        "total_insights": len(insights),
        "insights": insights
    }
