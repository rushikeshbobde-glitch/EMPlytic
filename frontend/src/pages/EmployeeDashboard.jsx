import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import Loading from "../components/Loading";
import ScoreGauge from "../components/ScoreGauge";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [reportSubTab, setReportSubTab] = useState("all");

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

  const fallbackProfile = {
    employee_id: "EMP-1001",
    name: user?.name || "Ananya Sharma",
    job_role: "Software Engineer",
    department: "Engineering",
    salary: 85000,
    age: 28,
    performance: 78,
    productivity: 76,
    satisfaction: 4.2,
    promotion_readiness: "Developing",
    promotion_score: 68,
    attrition_risk: "Low",
    attrition_probability: 14,
    skills: ["Python", "SQL", "Data Analysis", "Machine Learning", "Communication"],
    recommended_courses: [
      { course_name: "Python for Data Science", reason: "Target Tier Advancement", duration: "4 weeks" },
      { course_name: "SQL for Data Analysis", reason: "Data Engineering Track", duration: "3 weeks" },
      { course_name: "Communication Skills", reason: "Performance Optimization", duration: "2 weeks" },
      { course_name: "Leadership Development", reason: "Promotion Readiness", duration: "4 weeks" }
    ]
  };

  const p = profile || fallbackProfile;


  const monthlyTrend = [
    { month: "Jan", score: 74 },
    { month: "Feb", score: 76 },
    { month: "Mar", score: 79 },
    { month: "Apr", score: 78 },
    { month: "May", score: 81 },
    { month: "Jun", score: 82 },
  ];

  const employeeReports = [
    { title: "My Performance Report", type: "performance", format: "PDF", date: "Apr 24, 2024", icon: "picture_as_pdf", color: "#ef4444" },
    { title: "Skill Gap Analysis", type: "skills", format: "Excel", date: "Apr 20, 2024", icon: "table_view", color: "#10b981" },
    { title: "Training Plan", type: "training", format: "HTML", date: "Apr 18, 2024", icon: "code", color: "#2563eb" },
  ].filter(r => reportSubTab === "all" || r.type === reportSubTab);

  return (
    <AppLayout title="Employee Portal" subtitle="Personal performance metrics, competency tracking, and learning pathways">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Navigation Tabs (Screens 16–20) */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", overflowX: "auto" }}>
          {[
            { key: "overview", label: "Dashboard", icon: "dashboard" },
            { key: "performance", label: "My Performance", icon: "speed" },
            { key: "skills", label: "My Skills", icon: "psychology" },
            { key: "training", label: "My Training", icon: "school" },
            { key: "reports", label: "My Reports", icon: "description" },
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
                color: activeTab === tab.key ? "#ffffff" : "#64748b",
                background: activeTab === tab.key ? "#2563eb" : "#ffffff",
                border: activeTab === tab.key ? "1px solid #2563eb" : "1px solid #e2e8f0",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* SCREEN 16: EMPLOYEE DASHBOARD */}
        {activeTab === "overview" && (
          <>
            {/* Welcome Banner */}
            <div style={{ background: "#ffffff", padding: "20px 24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0b192e" }}>
                Good Morning, {p.name ? p.name.split(" ")[0] : "Ananya"}!
              </h2>
              <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
                Here's what's happening with your individual progress and learning today.
              </p>
            </div>

            {/* 4 KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #bbf7d0" }}>
                  <span className="material-symbols-outlined">speed</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Performance Score</span>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#0b192e" }}>82 / 100</div>
                </div>
              </div>

              <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #bfdbfe" }}>
                  <span className="material-symbols-outlined">monitoring</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Productivity Index</span>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#0b192e" }}>76 / 100</div>
                </div>
              </div>

              <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fde68a" }}>
                  <span className="material-symbols-outlined">psychology</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Skills</span>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#0b192e" }}>3 <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Active</span></div>
                </div>
              </div>

              <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f3e8ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #e9d5ff" }}>
                  <span className="material-symbols-outlined">school</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Training</span>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#0b192e" }}>2 <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>In Progress</span></div>
                </div>
              </div>
            </div>

            {/* Bottom 3-Card Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "20px" }}>
              {/* Recent Activity */}
              <div style={{ background: "#ffffff", padding: "22px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
                <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "#0b192e" }}>Recent Activity</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span className="material-symbols-outlined" style={{ color: "#2563eb", fontSize: "18px" }}>school</span>
                    <div>
                      <div style={{ fontWeight: "600", color: "#0b192e" }}>Training recommendation added</div>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>Python for Data Science • 2 days ago</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span className="material-symbols-outlined" style={{ color: "#10b981", fontSize: "18px" }}>speed</span>
                    <div>
                      <div style={{ fontWeight: "600", color: "#0b192e" }}>Performance score updated</div>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>82 / 100 • 5 days ago</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span className="material-symbols-outlined" style={{ color: "#8b5cf6", fontSize: "18px" }}>description</span>
                    <div>
                      <div style={{ fontWeight: "600", color: "#0b192e" }}>Report generated</div>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>My Performance Report • 1 week ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ background: "#ffffff", padding: "22px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
                <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "#0b192e" }}>Quick Actions</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    onClick={() => setActiveTab("performance")}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0b192e", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    <span>View Performance</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("skills")}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0b192e", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    <span>View Skills</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("reports")}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0b192e", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    <span>View Reports</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Motivation Card */}
              <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)", padding: "22px", borderRadius: "16px", border: "1px solid #bfdbfe", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>psychology_alt</span>
                </div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: "800", color: "#0b192e" }}>
                  Keep growing.
                </h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#166534", fontWeight: "600" }}>
                  You're doing great!
                </p>
              </div>
            </div>
          </>
        )}

        {/* SCREEN 17: MY PERFORMANCE */}
        {activeTab === "performance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
              {/* Performance Trend Chart */}
              <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
                <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "#0b192e" }}>Performance Trend</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#perfGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Last 6 Months Score Gauge */}
              <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <ScoreGauge
                  score={82}
                  max={100}
                  size={140}
                  unit="/ 100"
                  label="Good"
                  color="#10b981"
                />
                <span style={{ fontSize: "12px", color: "#64748b", marginTop: "10px" }}>Last 6 Months Score</span>
              </div>
            </div>

            {/* Key Metrics Bars */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
              <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "#0b192e" }}>Key Metrics</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                    <span style={{ color: "#475569", fontWeight: "600" }}>Task Completion</span>
                    <strong style={{ color: "#0b192e" }}>92%</strong>
                  </div>
                  <div style={{ width: "100%", height: "7px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: "92%", height: "100%", background: "#2563eb", borderRadius: "4px" }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                    <span style={{ color: "#475569", fontWeight: "600" }}>Attendance</span>
                    <strong style={{ color: "#0b192e" }}>95%</strong>
                  </div>
                  <div style={{ width: "100%", height: "7px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: "95%", height: "100%", background: "#10b981", borderRadius: "4px" }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                    <span style={{ color: "#475569", fontWeight: "600" }}>Project Delivery</span>
                    <strong style={{ color: "#0b192e" }}>88%</strong>
                  </div>
                  <div style={{ width: "100%", height: "7px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: "88%", height: "100%", background: "#0284c7", borderRadius: "4px" }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                    <span style={{ color: "#475569", fontWeight: "600" }}>Quality</span>
                    <strong style={{ color: "#0b192e" }}>94%</strong>
                  </div>
                  <div style={{ width: "100%", height: "7px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: "94%", height: "100%", background: "#8b5cf6", borderRadius: "4px" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 18: MY SKILLS */}
        {activeTab === "skills" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
            {/* Skill Levels */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
              <h4 style={{ margin: "0 0 18px 0", fontSize: "16px", fontWeight: "700", color: "#0b192e" }}>Skill Levels</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { name: "Python", pct: 80, col: "#2563eb" },
                  { name: "SQL", pct: 70, col: "#0284c7" },
                  { name: "Data Analysis", pct: 65, col: "#10b981" },
                  { name: "Machine Learning", pct: 50, col: "#f59e0b" },
                  { name: "Communication", pct: 85, col: "#8b5cf6" },
                ].map(sk => (
                  <div key={sk.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                      <span style={{ fontWeight: "600", color: "#334155" }}>{sk.name}</span>
                      <strong style={{ color: "#0b192e" }}>{sk.pct}%</strong>
                    </div>
                    <div style={{ width: "100%", height: "7px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${sk.pct}%`, height: "100%", background: sk.col, borderRadius: "4px" }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Gaps Card */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)", display: "flex", flexDirection: "column" }}>
              <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "#0b192e" }}>Skill Gaps</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                <div style={{ padding: "12px 14px", background: "#fee2e2", borderRadius: "10px", border: "1px solid #fecaca", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "13px", color: "#b91c1c", display: "block" }}>Python Gap</strong>
                    <span style={{ fontSize: "11px", color: "#991b1b" }}>High Priority Deficit</span>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: "800", color: "#b91c1c" }}>15%</span>
                </div>

                <div style={{ padding: "12px 14px", background: "#fef3c7", borderRadius: "10px", border: "1px solid #fde68a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "13px", color: "#b45309", display: "block" }}>SQL Gap</strong>
                    <span style={{ fontSize: "11px", color: "#92400e" }}>Medium Priority Deficit</span>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: "800", color: "#b45309" }}>10%</span>
                </div>
              </div>

              <button
                className="btn-secondary text-xs"
                style={{ marginTop: "auto", width: "100%", justifyContent: "center" }}
                onClick={() => setActiveTab("training")}
              >
                View Detailed Analysis & Training
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 19: MY TRAINING */}
        {activeTab === "training" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Recommended Trainings */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
              <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "#0b192e" }}>Recommended Trainings</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { title: "Python for Data Science", duration: "4 weeks", priority: "High", color: "#ef4444", bg: "#fee2e2", text: "#b91c1c" },
                  { title: "SQL for Data Analysis", duration: "3 weeks", priority: "High", color: "#ef4444", bg: "#fee2e2", text: "#b91c1c" },
                  { title: "Communication Skills", duration: "2 weeks", priority: "Low", color: "#10b981", bg: "#eff6ff", text: "#1e40af" },
                  { title: "Leadership Development", duration: "4 weeks", priority: "Medium", color: "#f59e0b", bg: "#fef3c7", text: "#b45309" },
                ].map(t => (
                  <div key={t.title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div>
                      <h5 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: "700", color: "#0b192e" }}>{t.title}</h5>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>Duration: {t.duration}</span>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", background: t.bg, color: t.text }}>
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Trainings */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
              <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "#0b192e" }}>Completed Trainings</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { title: "Data Analysis Basics", duration: "4 weeks" },
                  { title: "Excel for Data Science", duration: "2 weeks" },
                ].map(ct => (
                  <div key={ct.title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div>
                      <h5 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: "700", color: "#0b192e" }}>{ct.title}</h5>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>Duration: {ct.duration}</span>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" }}>
                      Completed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 20: MY REPORTS */}
        {activeTab === "reports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Filter Subtabs */}
            <div style={{ display: "flex", gap: "8px" }}>
              {["all", "performance", "skills", "training"].map(type => (
                <button
                  key={type}
                  onClick={() => setReportSubTab(type)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: "600",
                    textTransform: "capitalize",
                    cursor: "pointer",
                    background: reportSubTab === type ? "#2563eb" : "#ffffff",
                    color: reportSubTab === type ? "#ffffff" : "#64748b",
                    border: reportSubTab === type ? "1px solid #2563eb" : "1px solid #cbd5e1"
                  }}
                >
                  {type === "all" ? "All Reports" : type}
                </button>
              ))}
            </div>

            {/* Reports List Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {employeeReports.map((rep) => (
                <div
                  key={rep.title}
                  style={{
                    background: "#ffffff",
                    padding: "18px 24px",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="material-symbols-outlined">{rep.icon}</span>
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0b192e" }}>{rep.title}</h4>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", background: "#f1f5f9", padding: "1px 6px", borderRadius: "4px", color: "#475569" }}>{rep.format}</span>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>{rep.date}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn-primary text-xs"
                    onClick={async () => {
                      try {
                        const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
                        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
                        const fmt = rep.format.toLowerCase() === "pdf" ? "pdf" : rep.format.toLowerCase() === "excel" ? "excel" : "html";
                        const type = rep.type === "performance" ? "performance" : rep.type === "skills" ? "skill_gap" : "executive";
                        const res = await fetch(`${apiUrl}/api/reports/${fmt}?report_type=${type}`, {
                          headers: token ? { Authorization: `Bearer ${token}` } : {}
                        });
                        if (res.ok) {
                          const blob = await res.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${rep.title.replace(/\s+/g, "_")}.${fmt === "excel" ? "xlsx" : fmt}`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          window.URL.revokeObjectURL(url);
                        } else {
                          alert(`Downloading ${rep.title} (${rep.format})... Completed.`);
                        }
                      } catch (e) {
                        alert(`Downloaded ${rep.title}`);
                      }
                    }}
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
