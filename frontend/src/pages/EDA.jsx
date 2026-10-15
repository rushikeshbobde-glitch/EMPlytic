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
      <AppLayout title="Exploratory Data Analysis (EDA)" subtitle="Generating interactive statistical reports...">
        <Loading message="Processing distributions and correlations..." />
      </AppLayout>
    );
  }

  if (!data || !data.dataset || data.dataset.rows === 0) {
    return (
      <AppLayout title="Exploratory Data Analysis (EDA)" subtitle="Workforce statistical visualizations">
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

  const deptData = data.department_distribution || [];
  const ageHist = data.histograms?.age?.data || [];
  const salaryHist = data.histograms?.salary?.data || [];
  const perfHist = data.histograms?.performance?.data || [];

  return (
    <AppLayout
      title="Exploratory Data Analysis (EDA)"
      subtitle={`Interactive statistical analysis for ${data.filename || "Active Dataset"}`}
    >
      <div className="eda-page-wrapper">
        {/* Top Summary Banner */}
        <div className="eda-summary-banner">
          <div className="summary-col">
            <span className="banner-label">RECORDS</span>
            <span className="banner-val">{data.dataset.rows.toLocaleString()}</span>
          </div>
          <div className="summary-col">
            <span className="banner-label">COLUMNS</span>
            <span className="banner-val">{data.dataset.columns}</span>
          </div>
          <div className="summary-col">
            <span className="banner-label">COMPLETENESS</span>
            <span className="banner-val text-green">{data.data_quality.completeness}%</span>
          </div>
          <div className="summary-col">
            <span className="banner-label">NUMERIC FEATURES</span>
            <span className="banner-val">{data.dataset.numeric_columns_count}</span>
          </div>
          <div className="summary-col">
            <span className="banner-label">CATEGORICAL</span>
            <span className="banner-val">{data.dataset.categorical_columns_count}</span>
          </div>
        </div>

        {data.is_employee_dataset === false && (
          <div style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "10px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
            color: "#92400e"
          }}>
            <span className="material-symbols-outlined" style={{ color: "#d97706" }}>info</span>
            <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
              <strong>Non-HR Tabular Dataset:</strong> This dataset does not contain standard HR workforce attributes (Department, Role, Salary, Performance). General statistical summaries and distributions are shown below; employee-specific predictions are disabled.
            </div>
          </div>
        )}

        {/* First Row of Charts */}
        <div className="charts-grid-2">
          {/* Department Breakdown */}
          <ChartCard
            title="Department Workforce Distribution"
            subtitle="Headcount and proportion across departments"
            emptyMessage={deptData.length === 0 ? "Department column not available in this dataset." : null}
          >
            {deptData.length > 0 && (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={deptData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0edef" />
                  <XAxis dataKey="department" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: "#44474d" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#44474d" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e4e2e4", fontSize: "12px" }}
                    formatter={(val) => [`${val} Employees`, "Headcount"]}
                  />
                  <Bar dataKey="employees" fill="#1e40af" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Age Distribution */}
          <ChartCard
            title="Workforce Age Distribution"
            subtitle="Age brackets across employee population"
            emptyMessage={ageHist.length === 0 ? "Age column not available in this dataset." : null}
          >
            {ageHist.length > 0 && (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ageHist} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0edef" />
                  <XAxis dataKey="range" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: "#44474d" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#44474d" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e4e2e4", fontSize: "12px" }}
                    formatter={(val) => [`${val} Employees`, "Count"]}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Second Row of Charts */}
        <div className="charts-grid-2">
          {/* Salary Distribution */}
          <ChartCard
            title="Compensation & Salary Distribution"
            subtitle="Salary range histogram across workforce"
            emptyMessage={salaryHist.length === 0 ? "Salary column not available in this dataset." : null}
          >
            {salaryHist.length > 0 && (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={salaryHist} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0edef" />
                  <XAxis dataKey="range" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: "#44474d" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#44474d" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e4e2e4", fontSize: "12px" }}
                    formatter={(val) => [`${val} Employees`, "Count"]}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Performance Distribution */}
          <ChartCard
            title="Performance Rating Distribution"
            subtitle="Spread of performance evaluation scores"
            emptyMessage={perfHist.length === 0 ? "Performance column not available in this dataset." : null}
          >
            {perfHist.length > 0 && (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={perfHist} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0edef" />
                  <XAxis dataKey="range" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: "#44474d" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#44474d" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e4e2e4", fontSize: "12px" }}
                    formatter={(val) => [`${val} Employees`, "Count"]}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
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
