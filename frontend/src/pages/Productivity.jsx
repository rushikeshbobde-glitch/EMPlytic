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
import ScoreGauge from "../components/ScoreGauge";

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

  const currentProdScore = Math.round(average_productivity || 76);

  return (
    <AppLayout
      title="Productivity Index"
      subtitle="Workforce output, overtime correlation, and efficiency benchmarking"
    >
      {/* Screen 10: 2-Column Hero Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px", marginBottom: "24px" }}>
        {/* Left Card: Score Gauge */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <ScoreGauge
            score={currentProdScore}
            max={100}
            size={150}
            unit="/ 100"
            label="Good"
            sublabel=""
          />
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "14px", lineHeight: "1.4", padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
            This is an analytical score based on available features. Not a ML prediction.
          </div>
        </div>

        {/* Right Card: Key Factors Used */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)", display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid #f1f5f9" }}>
            <h4 style={{ margin: 0, fontFamily: "Hanken Grotesk, sans-serif", fontSize: "16px", fontWeight: "700", color: "#0b192e" }}>
              Key Factors Used
            </h4>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ fontWeight: "600", color: "#334155" }}>Working Hours</span>
                <span style={{ fontWeight: "700", color: "#0b192e" }}>34%</span>
              </div>
              <div style={{ width: "100%", height: "7px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "34%", height: "100%", background: "#2563eb", borderRadius: "4px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ fontWeight: "600", color: "#334155" }}>Overtime</span>
                <span style={{ fontWeight: "700", color: "#0b192e" }}>42%</span>
              </div>
              <div style={{ width: "100%", height: "7px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "42%", height: "100%", background: "#38bdf8", borderRadius: "4px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ fontWeight: "600", color: "#334155" }}>Tasks Completed</span>
                <span style={{ fontWeight: "700", color: "#0b192e" }}>10%</span>
              </div>
              <div style={{ width: "100%", height: "7px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "10%", height: "100%", background: "#10b981", borderRadius: "4px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ fontWeight: "600", color: "#334155" }}>Performance</span>
                <span style={{ fontWeight: "700", color: "#0b192e" }}>14%</span>
              </div>
              <div style={{ width: "100%", height: "7px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "14%", height: "100%", background: "#8b5cf6", borderRadius: "4px" }}></div>
              </div>
            </div>
          </div>
        </div>
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
