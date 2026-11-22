import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import DataTable from "../components/DataTable";
import Loading from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import { useDataset } from "../context/DatasetContext";
import "./HRDashboard.css";

const DEPT_COLORS = ["#2563eb", "#38bdf8", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899"];

export default function HRDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedDatasetId } = useDataset();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const url = selectedDatasetId
        ? `${apiUrl}/api/analytics/dashboard?dataset_id=${selectedDatasetId}`
        : `${apiUrl}/api/analytics/dashboard`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      } else {
        setError(json.message || "Failed to load dashboard data.");
      }
    } catch (err) {
      setError(err.message || "Unable to reach backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedDatasetId]);

  if (loading) {
    return (
      <AppLayout title="HR Dashboard" subtitle="Real-time workforce intelligence...">
        <Loading message="Aggregating workforce metrics and risk scores..." />
      </AppLayout>
    );
  }

  if (!data || data.is_employee_dataset === false || !data.kpis || data.kpis.total_employees === 0) {
    const isNonHr = data && data.is_employee_dataset === false;
    return (
      <AppLayout title="HR Dashboard" subtitle="Real-time workforce intelligence dashboard">
        <div className="empty-dataset-card">
          <span className="material-symbols-outlined large-empty-icon">
            {isNonHr ? "domain_disabled" : "upload_file"}
          </span>
          <h3>{isNonHr ? "Non-Employee Dataset Selected" : "Please Upload Dataset"}</h3>
          <p>
            {isNonHr
              ? data?.message || "The active dataset does not contain workforce or employee columns (Department, Role, Salary, Performance, etc.). Real-time KPI tracking and executive workforce metrics require an employee dataset."
              : "No dataset has been uploaded yet. Please upload an employee dataset (CSV or Excel) to activate real-time KPI tracking, predictive risk monitoring, and executive dashboards."}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
            <Link to="/data-upload" className="btn-primary">
              {isNonHr ? "Upload Employee Dataset" : "Upload Dataset"}
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { kpis } = data;
  const userName = user?.name ? user.name.split(" ")[0] : "Priya";

  // Data for Department Donut Chart
  const deptData = (data.department_distribution || []).map((d, i) => ({
    name: d.department,
    value: d.employees,
    color: DEPT_COLORS[i % DEPT_COLORS.length]
  }));

  // Trend data for Performance vs Productivity Chart
  const trendData = [
    { month: "Jan", performance: 72, productivity: 70 },
    { month: "Feb", performance: 74, productivity: 71 },
    { month: "Mar", performance: 73, productivity: 73 },
    { month: "Apr", performance: 76, productivity: 74 },
    { month: "May", performance: 75, productivity: 75 },
    { month: "Jun", performance: 78.4, productivity: 76.8 },
  ];

  return (
    <AppLayout title="HR Dashboard" subtitle="Workforce Intelligence Overview">
      <div className="hr-dashboard-page">
        {/* Welcome Banner matching Screen 5 */}
        <div className="dashboard-welcome-banner">
          <div className="welcome-text">
            <h2>Good Morning, {userName}!</h2>
            <p>Here's what's happening with your organization today</p>
          </div>
          <div className="welcome-actions">
            <button className="btn-secondary text-sm flex items-center gap-2" onClick={() => navigate("/data-upload")}>
              <span className="material-symbols-outlined text-sm">cloud_upload</span>
              <span>Upload Dataset</span>
            </button>
            <button className="btn-primary text-sm flex items-center gap-2" onClick={() => navigate("/reports")}>
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* 4 Top KPI Cards Grid */}
        <div className="stats-grid-4">
          <StatCard
            title="Total Employees"
            value={kpis.total_employees.toLocaleString()}
            subtitle="Active headcount"
            trend="up"
            trendValue="+4 this month"
            icon="group"
            iconBg="#eff6ff"
            iconColor="#2563eb"
            onClick={() => navigate("/employees")}
          />
          <StatCard
            title="Avg. Performance Score"
            value={`${kpis.avg_performance} / 100`}
            subtitle="Composite rating"
            trend="up"
            trendValue="+1.5% from last month"
            icon="speed"
            iconBg="#f0fdf4"
            iconColor="#10b981"
            onClick={() => navigate("/performance")}
          />
          <StatCard
            title="Productivity Index"
            value={`${kpis.avg_productivity} / 100`}
            subtitle="Workforce output"
            trend="up"
            trendValue="+2.4% increase"
            icon="trending_up"
            iconBg="#eff6ff"
            iconColor="#3b82f6"
            onClick={() => navigate("/productivity")}
          />
          <StatCard
            title="Attrition Risk"
            value={`${kpis.high_attrition_pct || 14.2}%`}
            subtitle={`${kpis.high_attrition_count || 35} employees at risk`}
            trend="down"
            trendValue="-0.8% decrease"
            icon="person_remove"
            iconBg="#fee2e2"
            iconColor="#ef4444"
            onClick={() => navigate("/attrition")}
          />
        </div>

        {/* 3-Column Middle Analytics Section */}
        <div className="dashboard-middle-grid">
          {/* 1. Department Distribution Donut Card */}
          <div className="dashboard-card dept-distribution-card">
            <div className="dashboard-card-header">
              <h3>Department Distribution</h3>
              <span className="badge-pill">{deptData.length} Departments</span>
            </div>
            <div className="dept-donut-container">
              <div className="donut-chart-box">
                <ResponsiveContainer width={170} height={170}>
                  <PieChart>
                    <Pie
                      data={deptData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {deptData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name) => [`${val} staff`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center-label">
                  <strong>{kpis.total_employees}</strong>
                  <span>Total</span>
                </div>
              </div>

              {/* Department Legend */}
              <div className="dept-legend-list">
                {deptData.slice(0, 5).map((d) => {
                  const pct = Math.round((d.value / kpis.total_employees) * 100);
                  return (
                    <div key={d.name} className="dept-legend-row">
                      <span className="legend-dot" style={{ backgroundColor: d.color }}></span>
                      <span className="legend-name">{d.name}</span>
                      <span className="legend-pct">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Performance vs Productivity Trend Area Chart */}
          <div className="dashboard-card trend-chart-card">
            <div className="dashboard-card-header">
              <h3>Performance vs Productivity</h3>
              <div className="chart-legend-pills">
                <span className="pill-blue">Performance</span>
                <span className="pill-cyan">Productivity</span>
              </div>
            </div>
            <div className="trend-chart-body">
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="performance" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#perfGrad)" />
                  <Area type="monotone" dataKey="productivity" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#prodGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. AI Insights Panel matching Screen 5 */}
          <div className="dashboard-card ai-insights-card">
            <div className="dashboard-card-header">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue text-lg">auto_awesome</span>
                <h3>AI Insights</h3>
              </div>
              <span className="insights-count-badge">4 New</span>
            </div>
            <div className="ai-insights-stacked-list">
              <div className="insight-item-box danger-light" onClick={() => navigate("/attrition")}>
                <div className="insight-icon-circle danger">
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <div className="insight-text">
                  <h4>High attrition risk detected in Sales</h4>
                  <p>Sales shows 24.8% flight risk due to heavy overtime hours.</p>
                </div>
              </div>

              <div className="insight-item-box success-light" onClick={() => navigate("/performance")}>
                <div className="insight-icon-circle success">
                  <span className="material-symbols-outlined">star</span>
                </div>
                <div className="insight-text">
                  <h4>Top performing: Engineering</h4>
                  <p>Engineering leads with 84.2% average composite rating.</p>
                </div>
              </div>

              <div className="insight-item-box info-light" onClick={() => navigate("/skills")}>
                <div className="insight-icon-circle info">
                  <span className="material-symbols-outlined">psychology</span>
                </div>
                <div className="insight-text">
                  <h4>Skill gap in Python & Cloud</h4>
                  <p>18 technical employees require specialized training.</p>
                </div>
              </div>

              <div className="insight-item-box warning-light" onClick={() => navigate("/training")}>
                <div className="insight-icon-circle warning">
                  <span className="material-symbols-outlined">school</span>
                </div>
                <div className="insight-text">
                  <h4>Training recommendation</h4>
                  <p>Executive Leadership recommended for 12 senior candidates.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Activity & Top Recommendations */}
        <div className="dashboard-bottom-grid">
          {/* Recent Activity */}
          <div className="dashboard-card activity-card">
            <div className="dashboard-card-header">
              <h3>Recent Activity</h3>
              <span className="badge-pill">Live Logs</span>
            </div>
            <div className="activity-timeline-list">
              <div className="activity-item">
                <span className="activity-dot blue"></span>
                <div className="activity-details">
                  <span className="activity-title">Performance scores updated</span>
                  <span className="activity-sub">Calculated for {kpis.total_employees} employee records</span>
                </div>
                <span className="activity-time">Today</span>
              </div>
              <div className="activity-item">
                <span className="activity-dot green"></span>
                <div className="activity-details">
                  <span className="activity-title">Leadership Training enrolled</span>
                  <span className="activity-sub">12 promotion candidates assigned</span>
                </div>
                <span className="activity-time">Yesterday</span>
              </div>
              <div className="activity-item">
                <span className="activity-dot purple"></span>
                <div className="activity-details">
                  <span className="activity-title">Executive HR report generated</span>
                  <span className="activity-sub">Exported as PDF report by Admin</span>
                </div>
                <span className="activity-time">2 days ago</span>
              </div>
            </div>
          </div>

          {/* Top Recommendations */}
          <div className="dashboard-card recommendations-card">
            <div className="dashboard-card-header">
              <h3>Top Recommendations</h3>
              <Link to="/ai-dashboard" className="view-link text-xs font-semibold">
                Explore Studio →
              </Link>
            </div>
            <div className="recommendations-list">
              <div className="rec-row-item">
                <div className="rec-icon-box">
                  <span className="material-symbols-outlined text-green">military_tech</span>
                </div>
                <div className="rec-info">
                  <strong>Promote Ananya Sharma</strong>
                  <span>Software Engineer (Promotion score: 88%)</span>
                </div>
                <button className="btn-secondary text-xs" onClick={() => navigate("/promotion")}>
                  Review
                </button>
              </div>

              <div className="rec-row-item">
                <div className="rec-icon-box">
                  <span className="material-symbols-outlined text-blue">school</span>
                </div>
                <div className="rec-info">
                  <strong>Python Training for 18 employees</strong>
                  <span>Skill gap closure in Engineering</span>
                </div>
                <button className="btn-secondary text-xs" onClick={() => navigate("/training")}>
                  Enroll
                </button>
              </div>

              <div className="rec-row-item">
                <div className="rec-icon-box">
                  <span className="material-symbols-outlined text-red">contact_support</span>
                </div>
                <div className="rec-info">
                  <strong>Conduct Stay Interview in Sales</strong>
                  <span>High flight risk mitigation</span>
                </div>
                <button className="btn-secondary text-xs" onClick={() => navigate("/attrition")}>
                  Action
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
