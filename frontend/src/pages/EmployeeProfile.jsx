import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import Loading from "../components/Loading";
import "./EmployeeProfile.css";

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true);
      setError("");
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        const res = await fetch(`${apiUrl}/api/employees/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setEmployee(json.data);
        } else {
          setError(json.detail || "Employee not found.");
        }
      } catch (err) {
        setError(err.message || "Failed to load employee profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <AppLayout title="Employee Talent Profile" subtitle="Loading employee records...">
        <Loading message={`Retrieving record for ${id}...`} />
      </AppLayout>
    );
  }

  if (error || !employee) {
    return (
      <AppLayout title="Employee Talent Profile" subtitle="Profile not found">
        <div className="empty-dataset-card">
          <span className="material-symbols-outlined large-empty-icon">person_off</span>
          <h3>Employee Not Found</h3>
          <p>{error || `No record matching ID "${id}" was found in the active workforce dataset.`}</p>
          <button className="btn-primary mt-4" onClick={() => navigate("/employees")}>
            Return to Employees Directory
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Employee Talent Profile"
      subtitle={`Detailed analytics, risk signals, and development trajectory for ${employee.name}`}
    >
      {/* Top Navigation Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          className="btn-secondary text-xs"
          onClick={() => navigate("/employees")}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Back to Directory</span>
        </button>
        <Link to="/reports" className="btn-primary text-xs">
          <span className="material-symbols-outlined text-sm">download</span>
          <span>Export Profile Report</span>
        </Link>
      </div>

      {/* Employee Hero Card */}
      <div className="employee-hero-card">
        <div className="emp-hero-left">
          <div className="emp-avatar-large">
            {employee.name ? employee.name.charAt(0).toUpperCase() : "E"}
          </div>
          <div className="emp-hero-info">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h2 className="emp-name-title">{employee.name}</h2>
              <span className="emp-id-tag">{employee.employee_id}</span>
              <span className="emp-segment-pill">{employee.cluster_segment}</span>
            </div>
            <div className="emp-role-dept-line">
              <strong>{employee.job_role}</strong> • {employee.department} Department
              {employee.salary && ` • $${Number(employee.salary).toLocaleString()}/yr`}
              {employee.age && ` • ${employee.age} yrs old`}
            </div>
          </div>
        </div>

        <div className="emp-hero-badges">
          <div className="hero-status-pill">
            <span className="status-label">FLIGHT RISK</span>
            <span className={`risk-badge ${employee.attrition_risk?.toLowerCase()}`}>
              {employee.attrition_risk} ({employee.attrition_probability}%)
            </span>
          </div>
          <div className="hero-status-pill">
            <span className="status-label">SUCCESSION</span>
            <span className={`status-chip ${employee.promotion_readiness?.toLowerCase().replace(" ", "-")}`}>
              {employee.promotion_readiness}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Core Metric KPI Cards */}
      <div className="stats-grid-4">
        <StatCard
          title="PERFORMANCE SCORE"
          value={`${employee.performance}%`}
          subtitle="Annual evaluation"
          trend={employee.performance >= 80 ? "up" : "neutral"}
          trendValue={employee.performance >= 80 ? "High" : "Standard"}
          icon="speed"
          iconBg="#eff6ff"
          iconColor="#1e40af"
        />
        <StatCard
          title="PRODUCTIVITY INDEX"
          value={`${employee.productivity}`}
          subtitle="Scale 0–100"
          trend="up"
          trendValue="Target 75"
          icon="monitoring"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
        <StatCard
          title="TURNOVER PROBABILITY"
          value={`${employee.attrition_probability}%`}
          subtitle={`Risk Tier: ${employee.attrition_risk}`}
          trend={employee.attrition_risk === "High" ? "down" : "neutral"}
          trendValue={employee.attrition_risk === "High" ? "Alert" : "Low Risk"}
          icon="trending_down"
          iconBg="#fee2e2"
          iconColor="#dc2626"
        />
        <StatCard
          title="PROMOTION READINESS"
          value={`${employee.promotion_score} / 100`}
          subtitle={`Status: ${employee.promotion_readiness}`}
          trend="up"
          trendValue={employee.promotion_readiness}
          icon="military_tech"
          iconBg="#fef3c7"
          iconColor="#d97706"
        />
      </div>

      {/* Skills & Recommended Training */}
      <div className="charts-grid-2">
        {/* Competencies */}
        <div className="ai-section-card">
          <div className="section-header-box">
            <h3>Verified Skills & Competencies</h3>
            <p>Employee skill profile verified from organizational records.</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {employee.skills?.map((sk, idx) => (
              <span key={idx} className="skill-pill-item">
                <span className="material-symbols-outlined text-sm text-green">verified</span>
                <span>{sk}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Personalized Development Curriculum */}
        <div className="ai-section-card">
          <div className="section-header-box">
            <h3>Assigned Development Pathways</h3>
            <p>Tailored training courses aligned with career progression.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {employee.recommended_courses?.map((c, idx) => (
              <div key={idx} style={{ background: "#fbf8fb", border: "1px solid #e4e2e4", borderRadius: "10px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", color: "#0b192e" }}>{c.title}</h4>
                  <span style={{ fontSize: "12px", color: "#75777d" }}>{c.reason} • {c.duration}</span>
                </div>
                <span style={{ fontSize: "11px", fontWeight: "700", background: "#eff6ff", color: "#1e40af", padding: "4px 10px", borderRadius: "12px" }}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Raw Attributes Panel */}
      {employee.raw_attributes && Object.keys(employee.raw_attributes).length > 0 && (
        <div className="ai-section-card">
          <div className="section-header-box">
            <h3>Complete Dataset Record Metadata</h3>
            <p>All raw column values associated with this employee record.</p>
          </div>
          <div className="raw-attributes-grid">
            {Object.entries(employee.raw_attributes).map(([key, val]) => (
              <div key={key} className="raw-attribute-item">
                <span className="raw-key">{key}</span>
                <span className="raw-val">{val !== null && val !== undefined ? String(val) : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
