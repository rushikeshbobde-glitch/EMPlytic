import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
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
import { useDataset } from "../context/DatasetContext";
import "./HRDashboard.css";

export default function HRDashboard() {
  const navigate = useNavigate();
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
      <AppLayout title="HR Analytics Executive Overview" subtitle="Real-time workforce intelligence...">
        <Loading message="Aggregating workforce metrics and risk scores..." />
      </AppLayout>
    );
  }

  if (!data || data.is_employee_dataset === false || !data.kpis || data.kpis.total_employees === 0) {
    const isNonHr = data && data.is_employee_dataset === false;
    return (
      <AppLayout title="HR Analytics Executive Overview" subtitle="Real-time workforce intelligence dashboard">
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

  const topPerformersCols = [
    { key: "employee_id", label: "ID", sortable: true },
    { key: "name", label: "Employee Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    {
      key: "performance",
      label: "Performance Score",
      sortable: true,
      render: (val) => <strong>{val}%</strong>
    },
    {
      key: "promotion_readiness",
      label: "Readiness",
      sortable: true,
      render: (val) => (
        <span className={`status-chip ${val?.toLowerCase()}`}>
          {val}
        </span>
      )
    }
  ];

  const highRiskCols = [
    { key: "employee_id", label: "ID", sortable: true },
    { key: "name", label: "Employee Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    {
      key: "attrition_probability",
      label: "Flight Risk",
      sortable: true,
      render: (val) => (
        <span className="risk-badge high">
          {val}% Risk
        </span>
      )
    },
    {
      key: "action",
      label: "Action",
      sortable: false,
      render: (_, row) => (
        <button
          className="btn-secondary text-xs py-1 px-2"
          onClick={(e) => { e.stopPropagation(); navigate(`/employee/${row.employee_id}`); }}
        >
          Review Profile
        </button>
      )
    }
  ];

  return (
    <AppLayout
      title="HR Analytics Executive Overview"
      subtitle={`Live workforce insights for ${data.dataset_name || "Enterprise Dataset"}`}
    >
      {/* Top Action Bar */}
      <div className="page-action-bar">
        <div className="action-bar-title-group">
          <h2>Organizational Health Dashboard</h2>
          <p>Calculated from live employee population records</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ai" onClick={() => navigate("/ai-dashboard")}>
            <span className="material-symbols-outlined">hub</span>
            <span>AI Predictive Studio</span>
          </button>
          <button className="btn-primary" onClick={() => navigate("/reports")}>
            <span className="material-symbols-outlined">download</span>
            <span>Export Executive Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid-4">
        <StatCard
          title="TOTAL HEADCOUNT"
          value={kpis.total_employees.toLocaleString()}
          subtitle="Active workforce"
          icon="groups"
          iconBg="#eff6ff"
          iconColor="#1e40af"
          onClick={() => navigate("/employees")}
        />
        <StatCard
          title="AVG PERFORMANCE"
          value={`${kpis.avg_performance}%`}
          subtitle="Composite rating"
          trend={kpis.avg_performance >= 80 ? "up" : "neutral"}
          trendValue={kpis.avg_performance >= 80 ? "High" : "Standard"}
          icon="speed"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
          onClick={() => navigate("/performance")}
        />
        <StatCard
          title="PRODUCTIVITY INDEX"
          value={`${kpis.avg_productivity}`}
          subtitle="Target 75.0"
          trend="up"
          trendValue="+3.2%"
          icon="monitoring"
          iconBg="#eff6ff"
          iconColor="#3755c3"
          onClick={() => navigate("/productivity")}
        />
        <StatCard
          title="HIGH FLIGHT RISK"
          value={`${kpis.high_attrition_count}`}
          subtitle={`${kpis.high_attrition_pct}% of population`}
          trend={kpis.high_attrition_pct > 15 ? "down" : "neutral"}
          trendValue={kpis.high_attrition_pct > 15 ? "Alert" : "Normal"}
          icon="trending_down"
          iconBg="#fee2e2"
          iconColor="#dc2626"
          onClick={() => navigate("/attrition")}
        />
      </div>

      {/* Charts Section */}
      <div className="charts-grid-2">
        {/* Department Breakdown */}
        <ChartCard
          title="Department Headcount & Risk Concentration"
          subtitle="Employee counts and high-risk flags by department"
        >
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={data.department_distribution} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0edef" />
              <XAxis dataKey="department" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: "#44474d" }} />
              <YAxis tick={{ fontSize: 11, fill: "#44474d" }} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e4e2e4", fontSize: "12px" }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="employees" name="Total Employees" fill="#1e40af" radius={[4, 4, 0, 0]} />
              <Bar dataKey="high_risk" name="High Flight Risk" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Attrition Risk Distribution */}
        <ChartCard
          title="Workforce Retention Risk Segmentation"
          subtitle="Distribution of employee population across flight risk tiers"
        >
          <ResponsiveContainer width="100%" height={290}>
            <PieChart>
              <Pie
                data={data.attrition_risk_distribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
              >
                {data.attrition_risk_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} Employees`, name]} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tables Section */}
      <div className="charts-grid-2">
        {/* High Risk Employees */}
        <div className="dashboard-table-card">
          <div className="table-card-header">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red font-bold">warning</span>
              <h3 className="font-bold text-base text-navy">Priority Retention Interventions</h3>
            </div>
            <Link to="/attrition" className="view-all-link">
              View All Risk Tiers <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <DataTable
            columns={highRiskCols}
            data={data.high_risk_employees || []}
            searchable={false}
            pageSize={5}
            onRowClick={(row) => navigate(`/employee/${row.employee_id}`)}
          />
        </div>

        {/* Top Performers */}
        <div className="dashboard-table-card">
          <div className="table-card-header">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber font-bold">star</span>
              <h3 className="font-bold text-base text-navy">Top Organizational Performers</h3>
            </div>
            <Link to="/performance" className="view-all-link">
              Performance Matrix <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <DataTable
            columns={topPerformersCols}
            data={data.top_performers || []}
            searchable={false}
            pageSize={5}
            onRowClick={(row) => navigate(`/employee/${row.employee_id}`)}
          />
        </div>
      </div>
    </AppLayout>
  );
}
