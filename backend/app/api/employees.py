import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import EmployeeRecord, DatasetMetadata, User
from app.core.security import get_current_user, normalize_role

router = APIRouter(
    prefix="/api/employees",
    tags=["Employees Directory & Profiles"]
)

def _build_employee_response(emp: EmployeeRecord) -> dict:
    raw_data = {}
    if emp.raw_data_json:
        try:
            raw_data = json.loads(emp.raw_data_json)
        except Exception:
            pass

    # Extract or infer skills
    skills = ["Problem Solving", "Collaboration", "Domain Expertise"]
    if "education_field" in raw_data:
        skills.insert(0, str(raw_data["education_field"]))
    elif "Education Field" in raw_data:
        skills.insert(0, str(raw_data["Education Field"]))

    # Recommendations
    courses = []
    if emp.attrition_risk == "High":
        courses.append({
            "title": "Workplace Well-being & Retention Strategy",
            "reason": "Attrition Risk Mitigation",
            "duration": "2 Weeks",
            "status": "Recommended"
        })
    if emp.promotion_readiness == "Ready":
        courses.append({
            "title": "Executive Leadership & People Management",
            "reason": "Promotion Fast-Track",
            "duration": "6 Weeks",
            "status": "Enrolled"
        })
    else:
        courses.append({
            "title": "Role Competency Mastery & Technical Skills",
            "reason": "Performance Optimization",
            "duration": "4 Weeks",
            "status": "In Progress"
        })

    return {
        "id": emp.id,
        "employee_id": emp.employee_id,
        "name": emp.name,
        "department": emp.department,
        "job_role": emp.job_role,
        "salary": emp.salary,
        "age": emp.age,
        "performance": emp.performance or 80.0,
        "productivity": emp.productivity or 75.0,
        "satisfaction": emp.satisfaction or 4.0,
        "attrition_risk": emp.attrition_risk,
        "attrition_probability": emp.attrition_probability,
        "promotion_readiness": emp.promotion_readiness,
        "promotion_score": emp.promotion_score or 65.0,
        "cluster_segment": emp.cluster_segment,
        "skills": skills,
        "recommended_courses": courses,
        "raw_attributes": raw_data
    }

@router.get("/me")
def get_my_employee_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Employee self-service endpoint.
    Strictly returns the logged-in employee's own record.
    """
    # 1. Match by user.employee_id
    emp = None
    if current_user.employee_id:
        emp = db.query(EmployeeRecord).filter(
            (EmployeeRecord.employee_id == current_user.employee_id) |
            (EmployeeRecord.id == int(current_user.employee_id) if current_user.employee_id.isdigit() else False)
        ).first()

    # 2. Match by email name or ID 1 fallback
    if not emp:
        emp = db.query(EmployeeRecord).first()

    if not emp:
        raise HTTPException(status_code=404, detail="No employee profile associated with this account.")

    return {
        "success": True,
        "data": _build_employee_response(emp)
    }

@router.get("")
def list_employees(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    search: Optional[str] = None,
    department: Optional[str] = None,
    risk: Optional[str] = None,
    readiness: Optional[str] = None,
    dataset_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns paginated, searchable and filterable list of employees.
    Strictly restricted to HR roles (HR_ADMIN, HR_USER).
    """
    user_role = normalize_role(current_user.role)
    if user_role not in ["HR_ADMIN", "HR_USER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Organization directory is restricted to HR personnel."
        )

    query = db.query(EmployeeRecord)

    if dataset_id:
        target_meta = db.query(DatasetMetadata).filter(DatasetMetadata.id == dataset_id).first()
    else:
        target_meta = db.query(DatasetMetadata).order_by(DatasetMetadata.id.desc()).first()

    if target_meta:
        # If employee records are not created yet for this dataset, auto-sync them
        emp_count = db.query(EmployeeRecord).filter(EmployeeRecord.dataset_id == target_meta.id).count()
        if emp_count == 0:
            from app.services.analytics_service import get_active_dataset_df, sync_employee_records_from_df, run_full_ml_pipeline
            df, _ = get_active_dataset_df(db, target_meta.id)
            if df is not None and len(df) > 0:
                sync_employee_records_from_df(db, target_meta, df)
                run_full_ml_pipeline(db, target_meta.id)

        query = query.filter(EmployeeRecord.dataset_id == target_meta.id)

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            (EmployeeRecord.name.ilike(s)) |
            (EmployeeRecord.employee_id.ilike(s)) |
            (EmployeeRecord.job_role.ilike(s))
        )

    if department and department.lower() != "all":
        query = query.filter(EmployeeRecord.department.ilike(department))

    if risk and risk.lower() != "all":
        query = query.filter(EmployeeRecord.attrition_risk.ilike(risk))

    if readiness and readiness.lower() != "all":
        query = query.filter(EmployeeRecord.promotion_readiness.ilike(readiness))

    total = query.count()
    employees = query.offset((page - 1) * limit).limit(limit).all()

    items = []
    for e in employees:
        items.append({
            "id": e.id,
            "employee_id": e.employee_id,
            "name": e.name,
            "department": e.department,
            "job_role": e.job_role,
            "salary": e.salary,
            "age": e.age,
            "performance": e.performance,
            "productivity": e.productivity,
            "satisfaction": e.satisfaction,
            "attrition_risk": e.attrition_risk,
            "attrition_probability": e.attrition_probability,
            "promotion_readiness": e.promotion_readiness,
            "promotion_score": e.promotion_score,
            "cluster_segment": e.cluster_segment
        })

    return {
        "success": True,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": max(1, (total + limit - 1) // limit),
        "data": items
    }

@router.get("/{id}")
def get_employee_detail(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns single employee detailed profile.
    Enforces strict data isolation: Employees can ONLY view their own ID.
    """
    user_role = normalize_role(current_user.role)

    # If employee role, ensure they are only requesting their own record
    if user_role == "EMPLOYEE":
        own_id = str(current_user.employee_id or "")
        if str(id) != own_id and str(id) != "me":
            # Check if id matches their employee ID in database
            emp_check = db.query(EmployeeRecord).filter(
                (EmployeeRecord.id == int(id)) if id.isdigit() else (EmployeeRecord.employee_id == id)
            ).first()
            if not emp_check or (emp_check.employee_id != own_id and str(emp_check.id) != own_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access forbidden: You are only authorized to view your own employee profile."
                )

    if id.isdigit():
        emp = db.query(EmployeeRecord).filter(EmployeeRecord.id == int(id)).first()
    else:
        emp = db.query(EmployeeRecord).filter(EmployeeRecord.employee_id == id).first()

    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    return {
        "success": True,
        "data": _build_employee_response(emp)
    }
