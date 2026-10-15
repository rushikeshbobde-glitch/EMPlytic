import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import Loading from "../components/Loading";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (location.pathname.includes("/performance") || location.hash === "#performance") {
      setActiveTab("performance");
    } else if (location.pathname.includes("/skills") || location.hash === "#skills") {
      setActiveTab("skills");
    } else if (location.pathname.includes("/training") || location.hash === "#training") {
      setActiveTab("training");
    } else if (location.pathname.includes("/reports") || location.hash === "#reports") {
      setActiveTab("reports");
    } else {
      setActiveTab("overview");
    }
  }, [location]);

  useEffect(() => {
    const fetchMyProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        
        // Strictly fetch own employee profile
        const res = await fetch(`${apiUrl}/api/employees/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (res.ok && json.data) {
          setProfile(json.data);
        } else {
          setError(json.detail || "Unable to load personal profile.");
        }
      } catch (e) {
        setError("Network error connecting to employee service.");
      } finally {
        setLoading(false);
      }
    };
    fetchMyProfile();
  }, []);

  if (loading) {
    return (
      <AppLayout title="Employee Portal" subtitle="Authenticating personal workforce profile...">
        <Loading message="Loading your personal employee records and career analytics..." />
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout title="Employee Portal" subtitle="Personal workforce profile">
        <div className="empty-dataset-card">
          <span className="material-symbols-outlined large-empty-icon">upload_file</span>
          <h3>Please Upload Dataset</h3>
          <p>No workforce dataset has been uploaded yet. Please contact your HR administrator to upload the employee dataset.</p>
        </div>
      </AppLayout>
    );
  }

  const p = profile;

  return (
    <AppLayout title="My Employee Portal" subtitle="Personal performance metrics, competency tracking, and learning pathways">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Profile Card Banner */}
        <div style={{ background: "#ffffff", padding: "24px 28px", borderRadius: "16px", border: "1px solid #e4e2e4", boxShadow: "0 4px 16px rgba(11,25,46,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "800", boxShadow: "0 4px 12px rgba(30,64,175,0.2)" }}>
              {p.name.charAt(0)}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0b192e" }}>{p.name}</h2>
                <span style={{ fontSize: "11px", background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "10px", fontWeight: "700", border: "1px solid #bbf7d0" }}>Active</span>
              </div>
              <p style={{ margin: "4px 0 0 0", color: "#75777d", fontSize: "13px" }}>
                {p.job_role} • {p.department} Department • Employee ID: <strong>{p.employee_id}</strong>
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", padding: "6px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "700" }}>
              Status: {p.promotion_readiness}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e4e2e4", paddingBottom: "8px" }}>
          {[
            { key: "overview", label: "My Overview", icon: "dashboard" },
            { key: "performance", label: "My Performance", icon: "speed" },
            { key: "skills", label: "Skills & Capabilities", icon: "psychology" },
            { key: "training", label: "Assigned Training", icon: "school" },
            { key: "reports", label: "My Career Summary", icon: "assessment" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: activeTab === tab.key ? "700" : "500",
                color: activeTab === tab.key ? "#1e40af" : "#555860",
                background: activeTab === tab.key ? "#eff6ff" : "transparent",
                border: activeTab === tab.key ? "1px solid #bfdbfe" : "1px solid transparent",
                cursor: "pointer"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 4 Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <StatCard
            title="MY PERFORMANCE SCORE"
            value={`${Math.round(p.performance)}%`}
            subtitle="AI Evaluation Index"
            trend="up"
            trendValue="Strong"
            icon="speed"
            iconBg="#eff6ff"
            iconColor="#1e40af"
          />
          <StatCard
            title="PRODUCTIVITY INDEX"
            value={`${Math.round(p.productivity)}`}
            subtitle="Output Benchmark"
            trend="up"
            trendValue="Optimal"
            icon="monitoring"
            iconBg="#f0fdf4"
            iconColor="#16a34a"
          />
          <StatCard
            title="PROMOTION READINESS"
            value={p.promotion_readiness}
            subtitle="Talent Pipeline"
            trend="up"
            trendValue="Fast-Track"
            icon="military_tech"
            iconBg="#fef3c7"
            iconColor="#d97706"
          />
          <StatCard
            title="SATISFACTION RATING"
            value={`${p.satisfaction} / 5`}
            subtitle="Engagement Index"
            trend="up"
            trendValue="Positive"
            icon="sentiment_satisfied"
            iconBg="#dcfce7"
            iconColor="#15803d"
          />
        </div>

        {/* Dynamic Tab Content */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e4e2e4", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "#0b192e" }}>Verified Role Competencies</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {p.skills?.map((sk, idx) => (
                  <span key={idx} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                    ✓ {sk}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e4e2e4", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "#0b192e" }}>Recommended Upskilling</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {p.recommended_courses?.map((c, idx) => (
                  <div key={idx} style={{ background: "#fbf8fb", border: "1px solid #e4e2e4", padding: "12px 16px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#0b192e" }}>{c.title}</h4>
                      <span style={{ fontSize: "11px", color: "#75777d" }}>{c.reason || "Skill Enhancement"} • {c.duration}</span>
                    </div>
                    <span style={{ background: "#eff6ff", color: "#1e40af", padding: "3px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                      {c.status || "Recommended"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e4e2e4", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "700", color: "#0b192e" }}>Detailed Performance Breakdown</h3>
            <p style={{ color: "#75777d", fontSize: "13px", marginBottom: "20px" }}>
              Your composite score is evaluated using verified performance ratings, delivery milestones, and peer feedback metrics.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div style={{ padding: "16px", background: "#fbf8fb", borderRadius: "8px", border: "1px solid #e4e2e4" }}>
                <span style={{ fontSize: "12px", color: "#75777d" }}>Evaluation Score</span>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#1e40af", marginTop: "4px" }}>{Math.round(p.performance)}/100</div>
              </div>
              <div style={{ padding: "16px", background: "#fbf8fb", borderRadius: "8px", border: "1px solid #e4e2e4" }}>
                <span style={{ fontSize: "12px", color: "#75777d" }}>Promotion Readiness</span>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#15803d", marginTop: "4px" }}>{p.promotion_readiness}</div>
              </div>
              <div style={{ padding: "16px", background: "#fbf8fb", borderRadius: "8px", border: "1px solid #e4e2e4" }}>
                <span style={{ fontSize: "12px", color: "#75777d" }}>Productivity Index</span>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#0b192e", marginTop: "4px" }}>{Math.round(p.productivity)}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "skills" && (
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e4e2e4", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "700", color: "#0b192e" }}>Role Capability Matrix</h3>
            <p style={{ color: "#75777d", fontSize: "13px", marginBottom: "16px" }}>
              Benchmarked against departmental standards for {p.job_role} in {p.department}.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {p.skills?.map((sk, idx) => (
                <div key={idx} style={{ padding: "10px 16px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#16a34a" }}>check_circle</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>{sk}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "training" && (
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e4e2e4", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "700", color: "#0b192e" }}>Assigned Upskilling Pathways</h3>
            <p style={{ color: "#75777d", fontSize: "13px", marginBottom: "20px" }}>
              Curated training programs aligned with your role progression and career milestones.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {p.recommended_courses?.map((c, idx) => (
                <div key={idx} style={{ background: "#fbf8fb", border: "1px solid #e4e2e4", padding: "16px 20px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", color: "#0b192e" }}>{c.title}</h4>
                    <span style={{ fontSize: "12px", color: "#75777d" }}>Duration: {c.duration} • Focus: {c.reason || "Career Growth"}</span>
                  </div>
                  <span style={{ background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
                    {c.status || "Enrolled"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e4e2e4", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "700", color: "#0b192e" }}>Personal Career & Performance Summary</h3>
            <p style={{ color: "#75777d", fontSize: "13px", marginBottom: "16px" }}>
              Confidential talent profile generated for Employee ID: {p.employee_id}
            </p>
            <div style={{ padding: "16px", background: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe", color: "#1e40af", fontSize: "13px" }}>
              <strong>Confidentiality Notice:</strong> This profile is strictly isolated to your individual account. Only authorized HR administrators and direct leadership have administrative audit privileges.
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
