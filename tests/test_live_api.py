import pytest
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_root_and_health():
    res = requests.get(f"{BASE_URL}/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"

    health = requests.get(f"{BASE_URL}/api/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"

def test_admin_login():
    res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@emplytic.com",
        "password": "admin123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "HR_ADMIN"
    return data["access_token"]

def test_employee_login():
    res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "employee@emplytic.com",
        "password": "emp123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "EMPLOYEE"
    return data["access_token"]

def test_datasets_endpoints():
    admin_token = test_admin_login()
    headers = {"Authorization": f"Bearer {admin_token}"}

    res = requests.get(f"{BASE_URL}/api/datasets", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]) >= 1

    ds_id = data["data"][0]["id"]
    detail_res = requests.get(f"{BASE_URL}/api/datasets/{ds_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["success"] is True

    val_res = requests.post(f"{BASE_URL}/api/datasets/{ds_id}/validate", headers=headers)
    assert val_res.status_code == 200
    assert val_res.json()["success"] is True

def test_analytics_and_eda():
    admin_token = test_admin_login()
    headers = {"Authorization": f"Bearer {admin_token}"}

    eda = requests.get(f"{BASE_URL}/api/eda/summary?dataset_id=1", headers=headers)
    assert eda.status_code == 200

    dash = requests.get(f"{BASE_URL}/api/analytics/dashboard?dataset_id=1", headers=headers)
    assert dash.status_code == 200
    dash_json = dash.json()
    assert dash_json["success"] is True
    assert dash_json["kpis"]["total_employees"] >= 100

def test_predictions_endpoints():
    admin_token = test_admin_login()
    headers = {"Authorization": f"Bearer {admin_token}"}

    attrition = requests.post(f"{BASE_URL}/api/predictions/attrition?dataset_id=1", headers=headers)
    assert attrition.status_code == 200
    att_data = attrition.json()
    if att_data.get("target_found"):
        assert "best_model_name" in att_data

    promotion = requests.post(f"{BASE_URL}/api/predictions/promotion?dataset_id=1", headers=headers)
    assert promotion.status_code == 200

    perf = requests.post(f"{BASE_URL}/api/predictions/performance?dataset_id=1", headers=headers)
    assert perf.status_code == 200

    prod = requests.post(f"{BASE_URL}/api/predictions/productivity?dataset_id=1", headers=headers)
    assert prod.status_code == 200

def test_skills_and_training():
    admin_token = test_admin_login()
    headers = {"Authorization": f"Bearer {admin_token}"}

    skills = requests.get(f"{BASE_URL}/api/skills/analyze?dataset_id=1", headers=headers)
    assert skills.status_code == 200

    training = requests.get(f"{BASE_URL}/api/training/recommend?dataset_id=1", headers=headers)
    assert training.status_code == 200
    train_data = training.json()
    assert "popular_curricula" in train_data

def test_non_hr_dataset_integrity():
    admin_token = test_admin_login()
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Dataset 13 is customers-100.csv (non-HR dataset)
    dash = requests.get(f"{BASE_URL}/api/analytics/dashboard?dataset_id=13", headers=headers)
    assert dash.status_code == 200
    dash_json = dash.json()
    assert dash_json["success"] is True
    assert dash_json["is_employee_dataset"] is False
    assert dash_json["kpis"] is None

    # Promotion should return no candidates for non-HR
    promo = requests.post(f"{BASE_URL}/api/predictions/promotion?dataset_id=13", headers=headers)
    assert promo.status_code == 200
    promo_json = promo.json()
    assert promo_json["has_promotion_data"] is False
    assert len(promo_json["promotion_candidates"]) == 0

    # Employees list should be empty for non-HR
    emps = requests.get(f"{BASE_URL}/api/employees?dataset_id=13", headers=headers)
    assert emps.status_code == 200
    assert emps.json()["total"] == 0
    assert len(emps.json()["data"]) == 0

def test_employee_directory_and_role_isolation():
    admin_token = test_admin_login()
    emp_token = test_employee_login()

    # 1. Admin can access directory for HR dataset 1
    res_admin = requests.get(f"{BASE_URL}/api/employees?dataset_id=1&limit=10", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    assert len(res_admin.json()["data"]) > 0

    # 2. Employee is strictly FORBIDDEN from accessing the organization directory
    res_emp_blocked = requests.get(f"{BASE_URL}/api/employees?dataset_id=1&limit=10", headers={"Authorization": f"Bearer {emp_token}"})
    assert res_emp_blocked.status_code == 403

    # 3. Employee can access their own record
    res_emp_me = requests.get(f"{BASE_URL}/api/employees/me", headers={"Authorization": f"Bearer {emp_token}"})
    assert res_emp_me.status_code == 200
    assert res_emp_me.json()["success"] is True
    assert "employee_id" in res_emp_me.json()["data"]

def test_reports_generation():
    admin_token = test_admin_login()
    headers = {"Authorization": f"Bearer {admin_token}"}

    # PDF Report
    res_pdf = requests.get(f"{BASE_URL}/api/reports/pdf?report_type=executive", headers=headers)
    assert res_pdf.status_code == 200
    assert len(res_pdf.content) > 1000
    assert res_pdf.headers["content-type"] == "application/pdf"

    # Excel Report
    res_excel = requests.get(f"{BASE_URL}/api/reports/excel?report_type=executive", headers=headers)
    assert res_excel.status_code == 200
    assert len(res_excel.content) > 1000

    # HTML Report
    res_html = requests.get(f"{BASE_URL}/api/reports/html?report_type=executive", headers=headers)
    assert res_html.status_code == 200
    assert "EMPlytic" in res_html.text
