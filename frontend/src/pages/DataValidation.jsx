import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import Loading from "../components/Loading";
import { useDataset } from "../context/DatasetContext";
import "./DataValidation.css";

export default function DataValidation() {
  const navigate = useNavigate();
  const { selectedDatasetId, refreshDatasets } = useDataset();
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const fetchSummary = async () => {
    setLoading(true);
    setError("");
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
      if (!res.ok) {
        throw new Error(json.detail || "Failed to fetch dataset summary");
      }
      if (json.success && json.dataset) {
        setData(json);
      } else {
        setData(null);
      }
    } catch (err) {
      // Fallback to cache if available
      const cached = localStorage.getItem("emplytic_eda_cache");
      if (cached) {
        try {
          setData(JSON.parse(cached));
        } catch (e) {
          setError(err.message);
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedDatasetId]);

  const handleCleanNow = async () => {
    if (!data?.dataset_id) return;
    setCleaning(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/api/eda/clean?dataset_id=${data.dataset_id}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (res.ok && json.updated_dataset) {
        setData(json.updated_dataset);
        localStorage.setItem("emplytic_eda_cache", JSON.stringify(json.updated_dataset));
        refreshDatasets();
      }
    } catch (err) {
      alert("Error cleaning dataset: " + err.message);
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Data Quality & Schema Validation" subtitle="Inspecting dataset health...">
        <Loading message="Fetching data quality metrics..." />
      </AppLayout>
    );
  }

  if (!data || !data.dataset || data.dataset.rows === 0) {
    return (
      <AppLayout title="Data Quality & Schema Validation" subtitle="Audit dataset integrity and column types.">
        <div className="empty-dataset-card">
          <span className="material-symbols-outlined large-empty-icon">upload_file</span>
          <h3>No Dataset Uploaded Yet</h3>
          <p>Upload a CSV or Excel employee dataset to generate quality metrics and automated schema mappings.</p>
          <Link to="/data-upload" className="btn-primary">
            Go to Data Upload
          </Link>
        </div>
      </AppLayout>
    );
  }

  const columnsTableCols = [
    { key: "name", label: "Column Name", sortable: true },
    {
      key: "type",
      label: "Data Type",
      sortable: true,
      render: (val) => (
        <span className={`type-badge ${val === "Numeric" ? "numeric" : "categorical"}`}>
          {val}
        </span>
      )
    },
    {
      key: "null_count",
      label: "Missing Count (%)",
      sortable: true,
      render: (val, row) => (
        <span className={val > 0 ? "text-amber font-semibold" : "text-green"}>
          {val} ({row.null_percentage}%)
        </span>
      )
    },
    { key: "unique_count", label: "Unique Values", sortable: true },
    {
      key: "sample_values",
      label: "Sample Values",
      sortable: false,
      render: (vals) => (
        <span className="sample-vals-text">
          {Array.isArray(vals) ? vals.join(", ") : "—"}
        </span>
      )
    }
  ];

  return (
    <AppLayout
      title="Data Quality & Schema Validation"
      subtitle={`Automated inspection report for ${data.filename || "Employee Dataset"}`}
    >
      {/* Top Action Bar */}
      <div className="page-action-bar">
        <div className="action-bar-title-group">
          <h2>Data Integrity Audit</h2>
          <p>Dataset Health: {data.data_quality.quality_score}% • {data.dataset.rows.toLocaleString()} Records • {data.dataset.columns} Attributes</p>
        </div>
        <div className="flex gap-3">
          {!data.is_cleaned && (
            <button className="btn-ai" onClick={handleCleanNow} disabled={cleaning}>
              <span className="material-symbols-outlined">auto_fix_high</span>
              <span>{cleaning ? "Cleaning..." : "Auto-Clean Now"}</span>
            </button>
          )}
          <button className="btn-secondary" onClick={() => navigate("/eda")}>
            <span className="material-symbols-outlined">insights</span>
            <span>View EDA Charts</span>
          </button>
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
            <strong>Non-HR Dataset Detected:</strong> This dataset does not contain workforce or employee attributes (Department, Role, Salary, Performance). General data quality audit and EDA charts are active, but predictive HR models and talent succession workflows are disabled.
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="stats-grid-4">
        <StatCard
          title="OVERALL QUALITY"
          value={`${data.data_quality.quality_score}%`}
          subtitle={data.data_quality.quality_score >= 90 ? "Excellent Integrity" : "Needs Cleaning"}
          trend={data.data_quality.quality_score >= 90 ? "up" : "warning"}
          icon="verified"
          iconBg="#dcfce7"
          iconColor="#15803d"
        />
        <StatCard
          title="COMPLETENESS"
          value={`${data.data_quality.completeness}%`}
          subtitle={`${data.data_quality.missing_values} missing values`}
          trend={data.data_quality.missing_values === 0 ? "up" : "warning"}
          icon="check_circle"
          iconBg="#eff6ff"
          iconColor="#1e40af"
        />
        <StatCard
          title="DUPLICATE RECORDS"
          value={data.data_quality.duplicate_records}
          subtitle={`${data.data_quality.duplicate_percentage}% duplicates`}
          trend={data.data_quality.duplicate_records === 0 ? "up" : "down"}
          icon="content_copy"
          iconBg="#fee2e2"
          iconColor="#b91c1c"
        />
        <StatCard
          title="ATTRIBUTES"
          value={data.dataset.columns}
          subtitle={`${data.dataset.numeric_columns_count} Numeric, ${data.dataset.categorical_columns_count} Categorical`}
          trend="neutral"
          icon="tune"
          iconBg="#f3f4f6"
          iconColor="#4b5563"
        />
      </div>

      {/* Semantic Schema Detection Section */}
      <div className="schema-detection-section">
        <div className="section-header-box">
          <h3>Semantic Feature Detection</h3>
          <p>EMPlytic automatically maps dataset columns to standard HR analytics concepts.</p>
        </div>

        <div className="semantic-pills-grid">
          {data.feature_status && Object.entries(data.feature_status).map(([key, info]) => (
            <div key={key} className={`semantic-card ${info.available ? "found" : "missing"}`}>
              <div className="semantic-card-top">
                <span className="semantic-feature-name">{info.name}</span>
                <span className={`availability-dot ${info.available ? "green" : "gray"}`}></span>
              </div>
              <div className="semantic-mapped-col">
                {info.available ? (
                  <>
                    <span className="material-symbols-outlined text-green font-bold text-sm">check</span>
                    <strong>{info.column_matched}</strong>
                  </>
                ) : (
                  <span className="text-muted">Not available</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Column Inspection Table */}
      <div className="column-inspection-section">
        <div className="section-header-box">
          <h3>Column-by-Column Data Health</h3>
          <p>Detailed analysis of data types, null rates, and unique distributions.</p>
        </div>
        <DataTable
          columns={columnsTableCols}
          data={data.column_details || []}
          searchPlaceholder="Search columns..."
          pageSize={10}
        />
      </div>
    </AppLayout>
  );
}
