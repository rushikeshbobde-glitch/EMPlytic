import os
import io
import datetime
import pandas as pd
import numpy as np
from typing import Optional
from sqlalchemy.orm import Session
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.core.config import REPORTS_DIR
from app.db.models import EmployeeRecord, DatasetMetadata
from app.services.analytics_service import get_dashboard_data, get_active_dataset_df

def generate_pdf_report(db: Session, report_type: str = "executive", dataset_id: int = None) -> bytes:
    """Generates an executive PDF report with tables and metrics."""
    dash_data = get_dashboard_data(db, dataset_id)
    kpis = dash_data.get("kpis") or {}
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0b192e")
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#75777d")
    )
    section_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#1e40af"),
        spaceBefore=14,
        spaceAfter=6
    )

    elements = []

    # Title & Branding
    elements.append(Paragraph(f"EMPlytic — {report_type.replace('_', ' ').title()} Report", title_style))
    elements.append(Paragraph(f"Generated on {datetime.datetime.utcnow().strftime('%B %d, %Y')} • Dataset: {dash_data.get('dataset_name', 'Active Dataset')}", subtitle_style))
    elements.append(Spacer(1, 16))

    # KPI Table
    elements.append(Paragraph("Executive Workforce KPIs", section_style))
    kpi_table_data = [
        ["Metric", "Value", "Benchmark / Status"],
        ["Total Employees", str(kpis.get("total_employees", 0)), "Full Population"],
        ["Average Performance", f"{kpis.get('avg_performance', 0)} / 100", "Composite Index"],
        ["Productivity Index", f"{kpis.get('avg_productivity', 0)} / 100", "Work Output Target"],
        ["High Flight Risk", f"{kpis.get('high_attrition_count', 0)} ({kpis.get('high_attrition_pct', 0)}%)", "Critical Attention"],
        ["Promotion Ready", f"{kpis.get('promotion_ready_count', 0)} ({kpis.get('promotion_ready_pct', 0)}%)", "Succession Pipeline"]
    ]
    t_kpi = Table(kpi_table_data, colWidths=[200, 150, 190])
    t_kpi.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0b192e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white])
    ]))
    elements.append(t_kpi)
    elements.append(Spacer(1, 16))

    # Department Breakdown Table
    elements.append(Paragraph("Departmental Breakdown & Risk Concentrations", section_style))
    dept_rows = [["Department", "Headcount", "High Risk Count", "Avg Performance"]]
    for d in dash_data.get("department_distribution", []):
        dept_rows.append([
            d["department"],
            str(d["employees"]),
            str(d.get("high_risk", 0)),
            f"{d.get('avg_performance', 0)}%"
        ])
    t_dept = Table(dept_rows, colWidths=[180, 120, 120, 120])
    t_dept.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white])
    ]))
    elements.append(t_dept)

    # Top At-Risk Table if Attrition Report or Executive
    high_risks = dash_data.get("high_risk_employees", [])
    if high_risks:
        elements.append(Spacer(1, 16))
        elements.append(Paragraph("Top Priority At-Risk Talent", section_style))
        risk_rows = [["Employee ID", "Name", "Department", "Turnover Probability", "Performance"]]
        for e in high_risks[:6]:
            risk_rows.append([
                e["employee_id"],
                e["name"],
                e["department"],
                f"{e.get('attrition_probability', 0)}%",
                f"{e.get('performance', 0)}%"
            ])
        t_risk = Table(risk_rows, colWidths=[110, 140, 130, 100, 60])
        t_risk.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dc2626")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fee2e2")),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#fff1f2"), colors.white])
        ]))
        elements.append(t_risk)

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def generate_excel_report(db: Session, report_type: str = "executive", dataset_id: int = None) -> bytes:
    """Generates a professional multi-tab Excel workbook using OpenPyXL."""
    wb = Workbook()
    
    # Sheet 1: Executive Summary
    ws_exec = wb.active
    ws_exec.title = "Executive Summary"

    header_font = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="0B192E", end_color="0B192E", fill_type="solid")
    bold_font = Font(name="Calibri", size=11, bold=True)
    normal_font = Font(name="Calibri", size=11)
    sub_header_fill = PatternFill(start_color="1E40AF", end_color="1E40AF", fill_type="solid")

    ws_exec["A1"] = "EMPlytic AI-Powered HR Analytics Platform"
    ws_exec["A1"].font = Font(name="Calibri", size=16, bold=True, color="0B192E")
    ws_exec["A2"] = f"Report: {report_type.title()} • Date: {datetime.datetime.utcnow().strftime('%Y-%m-%d')}"
    ws_exec["A2"].font = Font(name="Calibri", size=10, italic=True, color="64748B")

    dash_data = get_dashboard_data(db, dataset_id)
    kpis = dash_data.get("kpis") or {}

    ws_exec["A4"] = "KPI Metric"
    ws_exec["B4"] = "Current Value"
    ws_exec["A4"].font = header_font
    ws_exec["B4"].font = header_font
    ws_exec["A4"].fill = header_fill
    ws_exec["B4"].fill = header_fill

    kpi_list = [
        ("Total Headcount", kpis.get("total_employees", 0)),
        ("Average Performance Score", f"{kpis.get('avg_performance', 0)}%"),
        ("Productivity Index", f"{kpis.get('avg_productivity', 0)} / 100"),
        ("Average Satisfaction", f"{kpis.get('avg_satisfaction', 0)} / 5"),
        ("High Attrition Risk Count", kpis.get("high_attrition_count", 0)),
        ("High Attrition Rate", f"{kpis.get('high_attrition_pct', 0)}%"),
        ("Promotion Ready Count", kpis.get("promotion_ready_count", 0)),
        ("Promotion Pipeline %", f"{kpis.get('promotion_ready_pct', 0)}%"),
        ("Dataset Quality Health", f"{kpis.get('quality_score', 100)}%")
    ]

    for r_idx, (k, v) in enumerate(kpi_list, start=5):
        ws_exec.cell(row=r_idx, column=1, value=k).font = bold_font
        ws_exec.cell(row=r_idx, column=2, value=v).font = normal_font

    ws_exec.column_dimensions["A"].width = 30
    ws_exec.column_dimensions["B"].width = 20

    # Sheet 2: Employee Analytics
    ws_emp = wb.create_sheet(title="Employee Records")
    headers = [
        "Employee ID", "Name", "Department", "Job Role", "Salary",
        "Performance", "Productivity", "Satisfaction", "Attrition Risk",
        "Attrition Prob (%)", "Promotion Readiness", "Cluster Segment"
    ]
    for col_num, h in enumerate(headers, 1):
        cell = ws_emp.cell(row=1, column=col_num, value=h)
        cell.font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        cell.fill = sub_header_fill
        cell.alignment = Alignment(horizontal="center")

    _, meta = get_active_dataset_df(db, dataset_id)
    if meta:
        employees = db.query(EmployeeRecord).filter(EmployeeRecord.dataset_id == meta.id).all()
    else:
        employees = db.query(EmployeeRecord).all()
    for row_idx, emp in enumerate(employees[:500], 2):
        ws_emp.cell(row=row_idx, column=1, value=emp.employee_id)
        ws_emp.cell(row=row_idx, column=2, value=emp.name)
        ws_emp.cell(row=row_idx, column=3, value=emp.department)
        ws_emp.cell(row=row_idx, column=4, value=emp.job_role)
        ws_emp.cell(row=row_idx, column=5, value=emp.salary)
        ws_emp.cell(row=row_idx, column=6, value=emp.performance)
        ws_emp.cell(row=row_idx, column=7, value=emp.productivity)
        ws_emp.cell(row=row_idx, column=8, value=emp.satisfaction)
        ws_emp.cell(row=row_idx, column=9, value=emp.attrition_risk)
        ws_emp.cell(row=row_idx, column=10, value=emp.attrition_probability)
        ws_emp.cell(row=row_idx, column=11, value=emp.promotion_readiness)
        ws_emp.cell(row=row_idx, column=12, value=emp.cluster_segment)

    for col in ws_emp.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        col_letter = col[0].column_letter
        ws_emp.column_dimensions[col_letter].width = max(max_len + 3, 12)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()

def generate_html_report(db: Session, report_type: str = "executive", dataset_id: int = None) -> str:
    """Generates a standalone, beautiful HTML report."""
    dash_data = get_dashboard_data(db, dataset_id)
    kpis = dash_data.get("kpis") or {}
    depts = dash_data.get("department_distribution") or []
    high_risks = dash_data.get("high_risk_employees") or []

    dept_rows_html = "".join([
        f"<tr><td><strong>{d['department']}</strong></td><td>{d['employees']}</td><td>{d.get('high_risk', 0)}</td><td>{d.get('avg_performance', 0)}%</td></tr>"
        for d in depts
    ])

    risk_rows_html = "".join([
        f"<tr><td>{e['employee_id']}</td><td>{e['name']}</td><td>{e['department']}</td><td><span class='badge red'>{e.get('attrition_probability', 0)}%</span></td><td>{e.get('performance', 0)}%</td></tr>"
        for e in high_risks[:8]
    ])

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EMPlytic — {report_type.title()} Report</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; background: #fbf8fb; color: #1b1b1d; }}
    .header {{ background: #0b192e; color: #fff; padding: 24px 32px; border-radius: 12px; margin-bottom: 28px; }}
    .header h1 {{ margin: 0; font-size: 24px; }}
    .header p {{ margin: 6px 0 0 0; color: #708cfd; font-size: 13px; }}
    .kpi-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }}
    .kpi-card {{ background: #fff; padding: 18px; border-radius: 10px; border: 1px solid #e4e2e4; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }}
    .kpi-title {{ font-size: 11px; font-weight: 700; color: #75777d; text-transform: uppercase; }}
    .kpi-val {{ font-size: 24px; font-weight: 700; color: #0b192e; margin-top: 4px; }}
    .section {{ background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e4e2e4; margin-bottom: 28px; }}
    .section h2 {{ font-size: 16px; margin: 0 0 16px 0; color: #0b192e; border-bottom: 2px solid #3755c3; padding-bottom: 8px; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
    th, td {{ padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: left; }}
    th {{ background: #f8fafc; color: #475569; font-weight: 600; }}
    .badge {{ padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }}
    .badge.red {{ background: #fee2e2; color: #b91c1c; }}
    .badge.green {{ background: #dcfce7; color: #15803d; }}
    @media print {{ body {{ margin: 0; background: #fff; }} }}
  </style>
</head>
<body>
  <div class="header">
    <h1>EMPlytic — {report_type.title()} Report</h1>
    <p>Generated: {datetime.datetime.utcnow().strftime('%B %d, %Y')} • Dataset: {dash_data.get('dataset_name', 'Active Dataset')}</p>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Headcount</div>
      <div class="kpi-val">{kpis.get('total_employees', 0)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Avg Performance</div>
      <div class="kpi-val">{kpis.get('avg_performance', 0)}%</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Productivity</div>
      <div class="kpi-val">{kpis.get('avg_productivity', 0)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">High Flight Risk</div>
      <div class="kpi-val" style="color:#dc2626;">{kpis.get('high_attrition_count', 0)}</div>
    </div>
  </div>

  <div class="section">
    <h2>Departmental Distribution & Performance</h2>
    <table>
      <thead>
        <tr><th>Department</th><th>Headcount</th><th>High Risk Employees</th><th>Avg Performance</th></tr>
      </thead>
      <tbody>
        {dept_rows_html}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>High-Risk Flight Alert</h2>
    <table>
      <thead>
        <tr><th>Employee ID</th><th>Name</th><th>Department</th><th>Attrition Probability</th><th>Performance</th></tr>
      </thead>
      <tbody>
        {risk_rows_html}
      </tbody>
    </table>
  </div>
</body>
</html>"""
    return html
