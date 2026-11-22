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

  const [profileTab, setProfileTab] = useState("Overview");

  return (
    <AppLayout
      title="Employee Profile"
      subtitle={`Detailed analytics, risk signals, and development trajectory for ${employee.name}`}
    >
      {/* Top Navigation Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
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

      {/* Screen 15: Employee Hero Card with Score Badge & Subtabs */}
      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px 28px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#eff6ff", border: "2px solid #bfdbfe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "800" }}>
              {employee.name ? employee.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0b192e" }}>{employee.name}</h2>
                <span style={{ fontSize: "11px", background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" }}>Active</span>
              </div>
              <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
                {employee.job_role} • {employee.department}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 16px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="material-symbols-outlined" style={{ color: "#16a34a", fontSize: "20px" }}>verified</span>
              <div>
                <span style={{ fontSize: "11px", color: "#166534", display: "block" }}>Performance Score</span>
                <strong style={{ fontSize: "15px", color: "#15803d" }}>{Math.round(employee.performance || 78)} / 100</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Screen 15 Subtabs */}
        <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
          {["Overview", "Skills", "Training & Reports"].map((tab) => (
            <button
              key={tab}
              onClick={() => setProfileTab(tab)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
                background: profileTab === tab ? "#2563eb" : "#f8fafc",
                color: profileTab === tab ? "#ffffff" : "#64748b",
                border: profileTab === tab ? "1px solid #2563eb" : "1px solid #e2e8f0"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Screen 15: Overview Tab Content (Info Grid + Recent Activity) */}
      {profileTab === "Overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px", marginBottom: "24px" }}>
          {/* Left: General Info Card */}
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "#0b192e" }}>General Information</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#64748b", display: "block", marginBottom: "2px" }}>Department</span>
                <strong style={{ color: "#0b192e" }}>{employee.department}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", marginBottom: "2px" }}>Job Role</span>
                <strong style={{ color: "#0b192e" }}>{employee.job_role}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", marginBottom: "2px" }}>Experience</span>
                <strong style={{ color: "#0b192e" }}>{employee.experience ? `${employee.experience} years` : "4 years"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", marginBottom: "2px" }}>Status</span>
                <strong style={{ color: "#16a34a" }}>Active</strong>
              </div>
            </div>
          </div>

          {/* Right: Recent Activity Card */}
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "#0b192e" }}>Recent Activity</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ color: "#2563eb", fontSize: "18px" }}>analytics</span>
                <div>
                  <div style={{ fontWeight: "600", color: "#0b192e" }}>Performance score updated</div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>2 days ago</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ color: "#10b981", fontSize: "18px" }}>school</span>
                <div>
                  <div style={{ fontWeight: "600", color: "#0b192e" }}>Training recommendation added</div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>5 days ago</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ color: "#8b5cf6", fontSize: "18px" }}>description</span>
                <div>
                  <div style={{ fontWeight: "600", color: "#0b192e" }}>Report generated</div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>1 week ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
