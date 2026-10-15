import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import DataTable from "../components/DataTable";
import Loading from "../components/Loading";
import { useDataset } from "../context/DatasetContext";

export default function Performance() {
  const navigate = useNavigate();
  const { selectedDatasetId } = useDataset();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchPerf = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        const url = selectedDatasetId
          ? `${apiUrl}/api/analytics/performance?dataset_id=${selectedDatasetId}`
          : `${apiUrl}/api/analytics/performance`;
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (res.ok) {
          setData(json);
        }
      } catch (e) {}
      finally {
        setLoading(false);
      }
    };
    fetchPerf();
  }, [selectedDatasetId]);

  if (loading) {
    return (
      <AppLayout title="AI Performance Score Analytics" subtitle="Analyzing workforce performance...">
        <Loading message="Evaluating performance ratings and composite scores..." />
      </AppLayout>
    );
  }

  if (!data || !data.has_performance_data || !data.records || data.records.length === 0) {
    const isNonHr = data && data.has_performance_data === false;
    return (
      <AppLayout title="AI Performance Score Analytics" subtitle="Workforce Performance Benchmarking">
        <div className="empty-dataset-card">
          <span className="material-symbols-outlined large-empty-icon">
            {isNonHr ? "trending_up" : "upload_file"}
          </span>
          <h3>{isNonHr ? "No Performance Metrics Detected" : "Please Upload Dataset"}</h3>
          <p>
            {isNonHr
              ? data?.message || "The active dataset does not contain employee performance evaluation metrics. Performance scoring and category distributions are unavailable for non-employee datasets."
              : "No dataset has been uploaded yet. Please upload an employee dataset (CSV or Excel) to evaluate workforce performance ratings and category distributions."}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
            <button className="btn-primary" onClick={() => navigate("/data-upload")}>
              {isNonHr ? "Upload Employee Dataset" : "Upload Dataset"}
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { categories, department_performance, records, average_score, method } = data || {};

  const tableCols = [
    { key: "employee_id", label: "ID", sortable: true },
    { key: "name", label: "Employee Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "job_role", label: "Role", sortable: true },
    {
      key: "performance_score",
      label: "Performance Score",
      sortable: true,
      render: (val) => <strong>{val}%</strong>
    },
    {
      key: "performance_category",
      label: "Category",
      sortable: true,
      render: (val) => {
        let chipClass = "developing";
        if (val === "Excellent") chipClass = "ready";
        else if (val === "Needs Improvement") chipClass = "not-ready";
        return <span className={`status-chip ${chipClass}`}>{val}</span>;
      }
    }
  ];

  return (
    <AppLayout
      title="AI Performance Score Analytics"
      subtitle={`Scoring Engine: ${method || "Transparent Composite"} • Scale: 0–100`}
    >
      <div className="page-action-bar">
        <div className="action-bar-title-group">
          <h2>Workforce Performance Benchmarking</h2>
          <p>Transparent evaluation of output, evaluation ratings, and goal completions.</p>
        </div>
      </div>

      <div className="stats-grid-4">
        <StatCard
          title="AVG PERFORMANCE"
          value={`${average_score || 82}%`}
          subtitle="Organization-wide mean"
          trend="up"
          trendValue="Live"
          icon="speed"
          iconBg="#eff6ff"
          iconColor="#1e40af"
        />
        <StatCard
          title="EXCELLENT TIER"
          value={categories?.["Excellent (90-100)"] || 0}
          subtitle="Scores 90–100"
          trend="up"
          trendValue="High"
          icon="star"
          iconBg="#dcfce7"
          iconColor="#15803d"
        />
        <StatCard
          title="GOOD TIER"
          value={categories?.["Good (75-89)"] || 0}
          subtitle="Scores 75–89"
          trend="neutral"
          trendValue="Core"
          icon="thumb_up"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
        <StatCard
          title="NEEDS IMPROVEMENT"
          value={categories?.["Needs Improvement (<60)"] || 0}
          subtitle="Scores < 60"
          trend="down"
          trendValue="Review"
          icon="error"
          iconBg="#fee2e2"
          iconColor="#dc2626"
        />
      </div>

      <div className="charts-grid-2">
        <ChartCard
          title="Average Performance by Department"
          subtitle="Comparative departmental performance averages"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={department_performance || []} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0edef" />
              <XAxis dataKey="department" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: "#44474d" }} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: "#44474d" }} />
              <Tooltip formatter={(val) => [`${val}%`, "Avg Performance"]} />
              <Bar dataKey="avg_performance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Performance Category Breakdown"
          subtitle="Distribution of employee population across performance categories"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "12px 0" }}>
            {categories && Object.entries(categories).map(([catName, count]) => {
              const total = records?.length || 1;
              const pct = ((count / total) * 100).toFixed(1);
              return (
                <div key={catName} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span>{catName}</span>
                    <strong>{count} ({pct}%)</strong>
                  </div>
                  <div style={{ height: "8px", background: "#f0edef", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: catName.includes("Excellent") ? "#16a34a" : catName.includes("Good") ? "#3b82f6" : catName.includes("Average") ? "#f59e0b" : "#ef4444" }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      <div className="ai-section-card">
        <div className="section-header-box">
          <h3>Individual Performance Scores & Classifications</h3>
          <p>Complete ranking with categorized talent tiers.</p>
        </div>
        <DataTable
          columns={tableCols}
          data={records || []}
          searchPlaceholder="Search employees by name, role..."
          pageSize={10}
          onRowClick={(row) => navigate(`/employee/${row.employee_id}`)}
        />
      </div>
    </AppLayout>
  );
}
