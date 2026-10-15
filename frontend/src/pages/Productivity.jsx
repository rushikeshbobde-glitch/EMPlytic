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

export default function Productivity() {
  const navigate = useNavigate();
  const { selectedDatasetId } = useDataset();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchProd = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        const url = selectedDatasetId
          ? `${apiUrl}/api/analytics/productivity?dataset_id=${selectedDatasetId}`
          : `${apiUrl}/api/analytics/productivity`;
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
    fetchProd();
  }, [selectedDatasetId]);

  if (loading) {
    return (
      <AppLayout title="Employee Productivity Index" subtitle="Measuring output and operational rhythm...">
        <Loading message="Aggregating productivity metrics..." />
      </AppLayout>
    );
  }

  if (!data || !data.has_productivity_data || !data.records || data.records.length === 0) {
    const isNonHr = data && data.has_productivity_data === false;
    return (
      <AppLayout title="Employee Productivity Index" subtitle="Workforce Productivity Analytics">
        <div className="empty-dataset-card">
          <span className="material-symbols-outlined large-empty-icon">
            {isNonHr ? "speed" : "upload_file"}
          </span>
          <h3>{isNonHr ? "No Productivity Metrics Detected" : "Please Upload Dataset"}</h3>
          <p>
            {isNonHr
              ? data?.message || "The active dataset does not contain workforce productivity, work hours, or attendance metrics. Productivity scoring is unavailable for non-employee datasets."
              : "No dataset has been uploaded yet. Please upload an employee dataset (CSV or Excel) to calculate employee productivity indices, work hours, and department benchmarks."}
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

  const { average_productivity, department_productivity, records } = data || {};

  const tableCols = [
    { key: "employee_id", label: "ID", sortable: true },
    { key: "name", label: "Employee Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "job_role", label: "Role", sortable: true },
    {
      key: "productivity_index",
      label: "Productivity Index",
      sortable: true,
      render: (val) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <strong>{val}</strong>
          <div style={{ width: "100px", height: "6px", background: "#f0edef", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${val}%`, height: "100%", background: val >= 80 ? "#16a34a" : val >= 65 ? "#3b82f6" : "#f59e0b" }}></div>
          </div>
        </div>
      )
    }
  ];

  return (
    <AppLayout
      title="Employee Productivity Index (0–100)"
      subtitle="Synthesizes work hours, task milestones, overtime, and attendance into a transparent index."
    >
      <div className="stats-grid-4">
        <StatCard
          title="AVG PRODUCTIVITY"
          value={`${average_productivity || 78.4}`}
          subtitle="Workforce standard"
          trend="up"
          trendValue="+1.8%"
          icon="monitoring"
          iconBg="#eff6ff"
          iconColor="#1e40af"
        />
        <StatCard
          title="PEAK PRODUCERS"
          value={records?.filter(r => r.productivity_index >= 85).length || 0}
          subtitle="Index >= 85.0"
          trend="up"
          trendValue="High Output"
          icon="trending_up"
          iconBg="#dcfce7"
          iconColor="#15803d"
        />
        <StatCard
          title="STANDARD COHORT"
          value={records?.filter(r => r.productivity_index >= 65 && r.productivity_index < 85).length || 0}
          subtitle="Index 65–84.9"
          trend="neutral"
          trendValue="Expected"
          icon="done_all"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
        <StatCard
          title="LOW OUTPUT FLAGS"
          value={records?.filter(r => r.productivity_index < 65).length || 0}
          subtitle="Index < 65.0"
          trend="down"
          trendValue="Review"
          icon="flag"
          iconBg="#fee2e2"
          iconColor="#dc2626"
        />
      </div>

      <ChartCard
        title="Departmental Productivity Comparison"
        subtitle="Average employee productivity index broken down by department"
      >
        <ResponsiveContainer width="100%" height={290}>
          <BarChart data={department_productivity || []} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0edef" />
            <XAxis dataKey="department" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: "#44474d" }} />
            <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: "#44474d" }} />
            <Tooltip formatter={(val) => [`${val} / 100`, "Productivity Index"]} />
            <Bar dataKey="avg_productivity" fill="#1e40af" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="ai-section-card">
        <div className="section-header-box">
          <h3>Productivity Index Ranking</h3>
          <p>Individual employee rankings with visual progress distribution.</p>
        </div>
        <DataTable
          columns={tableCols}
          data={records || []}
          searchPlaceholder="Search employees..."
          pageSize={10}
          onRowClick={(row) => navigate(`/employee/${row.employee_id}`)}
        />
      </div>
    </AppLayout>
  );
}
