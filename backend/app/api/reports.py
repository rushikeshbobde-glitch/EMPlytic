from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import AuditLog, User
from app.core.security import require_hr
from app.services.report_service import (
    generate_pdf_report,
    generate_excel_report,
    generate_html_report
)

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"]
)

@router.get("")
def list_available_reports(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    """Returns catalogue of standard downloadable workforce reports."""
    reports = [
        {
            "id": 1,
            "name": "Executive HR Analytics Report",
            "type": "executive",
            "description": "Comprehensive workforce intelligence briefing covering overall headcount, KPIs, department comparisons, and strategic highlights.",
            "formats": ["pdf", "excel", "html"]
        },
        {
            "id": 2,
            "name": "Employee Performance & Productivity Report",
            "type": "performance",
            "description": "Deep-dive assessment into employee performance scores, productivity indices, and department rankings.",
            "formats": ["pdf", "excel", "html"]
        },
        {
            "id": 3,
            "name": "Workforce Attrition Risk Assessment",
            "type": "attrition",
            "description": "Supervised retention modeling outcomes, flight-risk tiers, department concentrations, and mitigating recommendations.",
            "formats": ["pdf", "excel", "html"]
        },
        {
            "id": 4,
            "name": "Promotion Readiness & Succession Report",
            "type": "promotion",
            "description": "High-potential talent identification, succession pipelines, and readiness classifications.",
            "formats": ["pdf", "excel", "html"]
        },
        {
            "id": 5,
            "name": "Skill Gap & Training Curricula Report",
            "type": "skill_gap",
            "description": "Departmental skill deficiency analysis and personalized course recommendations for upskilling.",
            "formats": ["pdf", "excel", "html"]
        }
    ]
    return {"success": True, "data": reports}

@router.get("/pdf")
@router.post("/pdf")
def export_pdf(
    report_type: str = Query("executive", description="Report type: executive, performance, attrition, productivity, promotion, skill_gap"),
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    pdf_bytes = generate_pdf_report(db, report_type, dataset_id)
    db.add(AuditLog(action="REPORT_GENERATE", details=f"Generated PDF {report_type} report"))
    db.commit()
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=emplytic_{report_type}_report.pdf"
        }
    )

@router.get("/{id}/pdf")
def export_pdf_by_id(
    id: int,
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    type_map = {1: "executive", 2: "performance", 3: "attrition", 4: "promotion", 5: "skill_gap"}
    report_type = type_map.get(id, "executive")
    return export_pdf(report_type=report_type, dataset_id=dataset_id, current_user=current_user, db=db)

@router.get("/excel")
@router.post("/excel")
def export_excel(
    report_type: str = Query("executive", description="Report type: executive, performance, attrition, productivity, promotion, skill_gap"),
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    excel_bytes = generate_excel_report(db, report_type, dataset_id)
    db.add(AuditLog(action="REPORT_GENERATE", details=f"Generated Excel {report_type} report"))
    db.commit()
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=emplytic_{report_type}_report.xlsx"
        }
    )

@router.get("/{id}/excel")
def export_excel_by_id(
    id: int,
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    type_map = {1: "executive", 2: "performance", 3: "attrition", 4: "promotion", 5: "skill_gap"}
    report_type = type_map.get(id, "executive")
    return export_excel(report_type=report_type, dataset_id=dataset_id, current_user=current_user, db=db)

@router.get("/html", response_class=HTMLResponse)
@router.post("/html", response_class=HTMLResponse)
def export_html(
    report_type: str = Query("executive", description="Report type: executive, performance, attrition, productivity, promotion, skill_gap"),
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    return generate_html_report(db, report_type, dataset_id)

@router.get("/{id}/html", response_class=HTMLResponse)
def export_html_by_id(
    id: int,
    dataset_id: Optional[int] = None,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    type_map = {1: "executive", 2: "performance", 3: "attrition", 4: "promotion", 5: "skill_gap"}
    report_type = type_map.get(id, "executive")
    return export_html(report_type=report_type, dataset_id=dataset_id, current_user=current_user, db=db)
