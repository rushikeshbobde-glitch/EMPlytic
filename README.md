# EMPlytic — Turn Employee Data into Intelligent HR Decisions

**EMPlytic** is an enterprise-grade, AI-powered HR Analytics SaaS platform engineered for HR leadership, people managers, and employees. EMPlytic bridges the gap between raw human resources data and decisive organizational intelligence through automated data hygiene, supervised machine learning with explainable AI (SHAP), transparent talent scoring, role-based data isolation, and automated executive reporting.

---

## Key Capabilities

1. **Intelligent Dataset Ingestion & Validation**
   - Drag-and-drop CSV and Excel (.xlsx, .xls) uploads.
   - Comprehensive data quality scoring (0–100), missing value profiling, duplicate row tracking, and IQR/Z-score outlier detection.
   - Automatic semantic column detection for employee identifiers, departments, roles, compensation, attrition targets, and performance ratings.

2. **Safe Automated Data Cleaning**
   - Numerical median/mean imputation with IQR bounds.
   - Categorical mode imputation.
   - Whitespace normalization and duplicate row removal with zero silent data corruption.
   - Full before-and-after audit logging and downloadable cleaned datasets.

3. **Supervised Attrition Intelligence & Explainable AI (SHAP)**
   - Strict Supervised ML Integrity: models require validated historical attrition targets; if no target is present, the system clearly and truthfully communicates prediction unavailability.
   - Model comparison: **Random Forest** vs. **Gradient Boosting** with class balance adjustment.
   - Comprehensive metrics: Accuracy, Precision, Recall, F1 Score, ROC-AUC, and Confusion Matrix.
   - **SHAP (Shapley Additive Explanations)** with non-causal language and directional indicators.

4. **Multi-Factor Talent Engines**
   - **AI Performance Score (0–100)**: Evaluates workforce performance without synthesizing fake values.
   - **Productivity Index (0–100)**: Evaluates hours, absenteeism, overtime, and project volume.
   - **Promotion Readiness Engine**: Supervised classifier if historical promotion data exists, or transparent multi-factor readiness evaluation if not.
   - **Competency & Skill Gap Analysis**: Identifies organizational capabilities against departmental benchmarks.
   - **Automated Upskilling Curricula**: Generates personalized learning paths with rationale and durations.

5. **Strict Role-Based Access Control & Security**
   - `HR_ADMIN`: Complete administrative control, dataset upload/cleaning, model retraining, user management, and report exports.
   - `HR_USER`: Workforce analytics, employee directory, and departmental intelligence.
   - `EMPLOYEE`: Strict data isolation. Employees can **only** access their personal profile via `/api/employees/me`. Any attempt to access other profiles or the organization directory is rejected with `403 Forbidden`.

6. **Multi-Format Automated Reporting**
   - **Executive PDF**: Styled with ReportLab, executive KPI cards, department breakdowns, and attrition risk tables.
   - **Excel Workbook**: Multi-tab formatted spreadsheet with formulas and styled header columns.
   - **Printable HTML**: Clean web report for in-browser review and presentations.

---

## Architecture & Tech Stack

```
           +---------------------------------------------+
           |           React 18 + Vite Frontend          |
           |   (Vanilla CSS Design System, Recharts)     |
           +---------------------------------------------+
                                  |
                                  | REST API / JWT
                                  v
           +---------------------------------------------+
           |             FastAPI Backend                 |
           |      (Uvicorn, Pydantic v2, Python 3.11)    |
           +---------------------------------------------+
               |                  |                  |
               v                  v                  v
     +------------------+  +-------------+  +------------------+
     |   SQLAlchemy ORM |  | Scikit-Learn|  | Report Generation|
     | (Postgres/SQLite)|  |   & SHAP    |  | (ReportLab/XL/J2)|
     +------------------+  +-------------+  +------------------+
```

- **Backend**: FastAPI, SQLAlchemy, Pydantic, Scikit-Learn, SHAP, ReportLab, OpenPyXL, Pandas, NumPy
- **Frontend**: React 18, Vite, React Router v6, Recharts, Lucide Icons, Vanilla CSS
- **Database**: SQLite (local development fallback) / PostgreSQL 16 (production)
- **Containerization**: Docker & Docker Compose multi-container orchestration

---

## Quickstart Guide

### 1. Local Development Setup

#### Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
pip install pytest requests
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The backend initializes the database, demo users, realistic dataset (1,000+ records), and ML pipeline on startup.

#### Frontend
```powershell
cd frontend
npm install
npm run dev
```
Access the application at `http://127.0.0.1:5173`.

---

## Demo Accounts

The system seeds default demo accounts on first launch:

| Role | Email | Password | Allowed Access |
|------|-------|----------|----------------|
| **HR Administrator** | `admin@emplytic.com` | `admin123` | Full administrative control, all analytics, reports, uploads |
| **Individual Employee** | `employee@emplytic.com` | `emp123` | Personal profile (`/api/employees/me`), private KPIs, skills |
| **HR Analyst** | `analyst@emplytic.com` | `analyst123` | Workforce dashboards, analytics, reports |

---

## Running Automated Tests

Run the test suite covering authentication, data validation, ML training, role isolation, and reports:

```powershell
cd backend
.\venv\Scripts\pytest ..\tests\test_live_api.py -v
```

All 9 automated verification suites will run against the API:
- `test_root_and_health`
- `test_admin_login`
- `test_employee_login`
- `test_datasets_endpoints`
- `test_analytics_and_eda`
- `test_predictions_endpoints`
- `test_skills_and_training`
- `test_employee_directory_and_role_isolation`
- `test_reports_generation`

---

## Docker Deployment

To launch the full production stack (PostgreSQL 16, FastAPI Backend, Nginx Frontend):

```bash
docker-compose up --build -d
```

- Frontend: `http://localhost`
- Backend API & Interactive Swagger Docs: `http://localhost:8000/docs`
