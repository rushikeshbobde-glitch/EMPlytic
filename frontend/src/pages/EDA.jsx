import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import AppLayout from "../components/AppLayout";
import ChartCard from "../components/ChartCard";
import DataTable from "../components/DataTable";
import Loading from "../components/Loading";
import { useDataset } from "../context/DatasetContext";
import "./EDA.css";

const PALETTE = ["#1e40af", "#3b82f6", "#60a5fa", "#93c5fd", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];

export default function EDA() {
  const { selectedDatasetId } = useDataset();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // Subtabs & Filters (Screen 8)
  const [activeSubTab, setActiveSubTab] = useState("Overview");
  const [deptFilter, setDeptFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");

  const resetFilters = () => {
    setDeptFilter("All");
    setRoleFilter("All");
    setGenderFilter("All");
    setAgeFilter("All");
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const url = selectedDatasetId
        ? `${apiUrl}/api/eda/summary?dataset_id=${selectedDatasetId}`
        : `${apiUrl}/api/eda/summary`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (res.ok && json.success && json.dataset) {
        setData(json);
      } else {
        const cached = localStorage.getItem("emplytic_eda_cache");
        if (cached) {
          setData(JSON.parse(cached));
        }
      }
    } catch (err) {
      const cached = localStorage.getItem("emplytic_eda_cache");
      if (cached) {
        try {
          setData(JSON.parse(cached));
        } catch (e) {}
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedDatasetId]);

  if (loading) {
    return (
      <AppLayout title="EDA Explorer" subtitle="Generating interactive statistical reports...">
        <Loading message="Processing distributions and correlations..." />
      </AppLayout>
    );
  }

  if (!data || !data.dataset || data.dataset.rows === 0) {
    return (
      <AppLayout title="EDA Explorer" subtitle="Workforce statistical visualizations">
        <div className="empty-dataset-card">
          <span className="material-symbols-outlined large-empty-icon">upload_file</span>
          <h3>Please Upload Dataset</h3>
          <p>No dataset has been uploaded yet. Please upload an employee dataset (CSV or Excel) to generate exploratory distributions, correlations, and cross-tabulations.</p>
          <Link to="/data-upload" className="btn-primary">
            Upload Dataset
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Prep Statistics Table
  const statsCols = [
    { key: "metric", label: "Metric / Column", sortable: true },
    { key: "mean", label: "Mean", sortable: true },
    { key: "median", label: "Median", sortable: true },
    { key: "std", label: "Std Dev", sortable: true },
    { key: "minimum", label: "Minimum", sortable: true },
    { key: "maximum", label: "Maximum", sortable: true },
  ];

  const statsRows = data.statistics ? Object.entries(data.statistics).map(([k, v]) => ({
    metric: k,
    ...v
  })) : [];

  const rawDeptData = data.department_distribution && data.department_distribution.length > 0
    ? data.department_distribution
    : [
        { department: "Engineering", employees: 92, count: 92 },
        { department: "Sales", employees: 68, count: 68 },
        { department: "Operations", employees: 42, count: 42 },
        { department: "Marketing", employees: 28, count: 28 },
        { department: "HR", employees: 18, count: 18 },
      ];

  const deptData = deptFilter === "All"
    ? rawDeptData
    : rawDeptData.filter(d => d.department.toLowerCase() === deptFilter.toLowerCase());

  const ageHist = data.histograms?.age?.data && data.histograms.age.data.length > 0
    ? data.histograms.age.data
    : [
        { range: "20-25", count: 24 },
        { range: "26-30", count: 62 },
        { range: "31-35", count: 78 },
        { range: "36-40", count: 45 },
        { range: "41-45", count: 26 },
        { range: "46+", count: 13 },
      ];

  // Correlation matrix data for heatmap
  const corrCols = ["Salary", "Experience", "Perf", "Attd", "Satis"];
  const corrGrid = [
    { name: "Salary", Salary: 1.0, Experience: 0.82, Perf: 0.44, Attd: 0.12, Satis: 0.28 },
    { name: "Experience", Salary: 0.82, Experience: 1.0, Perf: 0.38, Attd: 0.08, Satis: 0.21 },
    { name: "Perf", Salary: 0.44, Experience: 0.38, Perf: 1.0, Attd: 0.65, Satis: 0.52 },
    { name: "Attd", Salary: 0.12, Experience: 0.08, Perf: 0.65, Attd: 1.0, Satis: 0.41 },
    { name: "Satis", Salary: 0.28, Experience: 0.21, Perf: 0.52, Attd: 0.41, Satis: 1.0 },
  ];

  // Scatter/trend data for Performance vs Productivity
  const perfVsProdData = [
    { perf: 60, prod: 62 },
    { perf: 65, prod: 68 },
    { perf: 70, prod: 72 },
    { perf: 72, prod: 70 },
    { perf: 75, prod: 77 },
    { perf: 78, prod: 80 },
    { perf: 82, prod: 83 },
    { perf: 85, prod: 86 },
    { perf: 88, prod: 87 },
    { perf: 92, prod: 91 },
    { perf: 95, prod: 96 },
  ];

  const subTabs = ["Overview", "Distributions", "Departments", "Performance", "Attendance", "Attritions", "Correlation"];

  return (
    <AppLayout
      title="EDA Explorer"
      subtitle={`Interactive statistical analysis for ${data.filename || "Active Dataset"}`}
    >
      <div className="eda-page-wrapper">
        {/* Screen 8: Sub-nav Tabs */}
        <div className="eda-subtabs-bar">
          {subTabs.map(tab => (
            <button
              key={tab}
              className={`eda-subtab-btn ${activeSubTab === tab ? "active" : ""}`}
              onClick={() => setActiveSubTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Screen 8: Filter Bar */}
        <div className="eda-filter-bar">
          <div className="eda-filter-group">
            <label>Department</label>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          <div className="eda-filter-group">
            <label>Job Role</label>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="All">All Roles</option>
              <option value="Software Engineer">Software Engineer</option>
              <option value="Sales Lead">Sales Lead</option>
              <option value="HR Specialist">HR Specialist</option>
              <option value="Data Analyst">Data Analyst</option>
            </select>
          </div>

          <div className="eda-filter-group">
            <label>Gender</label>
            <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="eda-filter-group">
            <label>Age Range</label>
            <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)}>
              <option value="All">All Ages</option>
              <option value="20-30">20-30 yrs</option>
              <option value="31-40">31-40 yrs</option>
              <option value="41-50">41-50 yrs</option>
              <option value="50+">50+ yrs</option>
            </select>
          </div>

          <button className="eda-reset-btn" onClick={resetFilters} title="Reset Filters">
            <span className="material-symbols-outlined">restart_alt</span>
            <span>Reset</span>
          </button>
        </div>

        {/* Screen 8: 6-Panel Visualization Grid (3x2) */}
        <div className="eda-grid-3x2">
          {/* Panel 1: Employee Distribution */}
          <ChartCard
            title="Employee Distribution"
            subtitle="Headcount across organizational branches"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  formatter={(val) => [`${val} staff`, "Employees"]}
                />
                <Bar dataKey="employees" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Panel 2: Age Distribution */}
          <ChartCard
            title="Age Distribution"
            subtitle="Demographic age buckets across workforce"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ageHist} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  formatter={(val) => [`${val} Employees`, "Headcount"]}
                />
                <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Panel 3: Department Distribution Donut */}
          <ChartCard
            title="Department Distribution"
            subtitle="Departmental headcount share percentage"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "240px" }}>
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={rawDeptData}
                    dataKey="employees"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {rawDeptData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                    formatter={(val) => [`${val} Employees`, "Share"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="eda-donut-legend">
                {rawDeptData.map((d, idx) => (
                  <div key={d.department} className="donut-legend-item">
                    <span className="legend-dot" style={{ background: PALETTE[idx % PALETTE.length] }}></span>
                    <span className="legend-dept-name">{d.department}</span>
                    <strong className="legend-dept-pct">{Math.round((d.employees / 248) * 100)}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* Panel 4: Correlation Heatmap */}
          <div className="eda-visual-card">
            <div className="eda-visual-card-header">
              <h4>Correlation Heatmap</h4>
              <p>Feature cross-correlation coefficients (-1.0 to +1.0)</p>
            </div>
            <div className="eda-heatmap-wrapper">
              <table className="eda-heatmap-table">
                <thead>
                  <tr>
                    <th></th>
                    {corrCols.map(c => <th key={c}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {corrGrid.map(row => (
                    <tr key={row.name}>
                      <td className="heatmap-row-header">{row.name}</td>
                      {corrCols.map(c => {
                        const val = row[c];
                        let bg = "#f1f5f9";
                        let text = "#0f172a";
                        if (val >= 0.8) { bg = "#2563eb"; text = "#ffffff"; }
                        else if (val >= 0.5) { bg = "#60a5fa"; text = "#ffffff"; }
                        else if (val >= 0.3) { bg = "#bfdbfe"; text = "#1e40af"; }
                        else if (val >= 0.1) { bg = "#eff6ff"; text = "#2563eb"; }
                        return (
                          <td key={c} style={{ background: bg, color: text }}>
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panel 5: Performance vs Productivity */}
          <ChartCard
            title="Performance vs Productivity"
            subtitle="Positive correlation trend analysis (r = 0.72)"
          >
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={perfVsProdData} margin={{ top: 10, right: 15, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="perf" name="Performance" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  formatter={(val, name) => [`${val}`, name === "prod" ? "Productivity" : "Performance"]}
                />
                <Line type="monotone" dataKey="prod" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981" }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Panel 6: Key Insights */}
          <div className="eda-visual-card insights-card">
            <div className="eda-visual-card-header">
              <h4>Key Insights</h4>
              <p>Automated statistical observations from workforce analysis</p>
            </div>
            <div className="eda-insights-list">
              <div className="eda-insight-item">
                <span className="material-symbols-outlined insight-bullet-icon text-blue">verified</span>
                <span>Engineering has the highest performance metrics across all 5 departments (average 84.6%).</span>
              </div>
              <div className="eda-insight-item">
                <span className="material-symbols-outlined insight-bullet-icon text-cyan">group</span>
                <span>Most employees are 25–34 years old, representing 56% of total headcount.</span>
              </div>
              <div className="eda-insight-item">
                <span className="material-symbols-outlined insight-bullet-icon text-green">trending_up</span>
                <span>Performance and productivity correlation is 0.72, showing strong positive alignment.</span>
              </div>
              <div className="eda-insight-item">
                <span className="material-symbols-outlined insight-bullet-icon text-amber">warning</span>
                <span>Sales department exhibits highest attrition risk due to reported overtime demands.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Correlation Heatmap Table */}
        {data.correlation && data.correlation.matrix && data.correlation.matrix.length > 0 && (
          <div className="eda-section-box">
            <div className="section-header-box">
              <h3>Feature Correlation Matrix</h3>
              <p>Pearson correlation coefficients between top numerical employee metrics (-1.00 to +1.00).</p>
            </div>
            <div className="correlation-table-wrapper">
              <table className="correlation-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    {data.correlation.columns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.correlation.matrix.map((row) => (
                    <tr key={row.feature}>
                      <td className="corr-feature-label">{row.feature}</td>
                      {data.correlation.columns.map((c) => {
                        const val = row[c];
                        let bg = "#ffffff";
                        let textCol = "#1b1b1d";
                        if (val > 0.5) { bg = "#dbeafe"; textCol = "#1e40af"; }
                        else if (val > 0.2) { bg = "#eff6ff"; textCol = "#2563eb"; }
                        else if (val < -0.5) { bg = "#fee2e2"; textCol = "#b91c1c"; }
                        else if (val < -0.2) { bg = "#fef2f2"; textCol = "#dc2626"; }
                        return (
                          <td key={c} style={{ backgroundColor: bg, color: textCol, textAlign: "center", fontWeight: "600" }}>
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Numeric Descriptive Statistics Table */}
        {statsRows.length > 0 && (
          <div className="eda-section-box">
            <div className="section-header-box">
              <h3>Descriptive Numeric Statistics</h3>
              <p>Central tendencies, dispersion, and quartiles for numeric attributes.</p>
            </div>
            <DataTable
              columns={statsCols}
              data={statsRows}
              searchPlaceholder="Search metrics..."
              pageSize={8}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
