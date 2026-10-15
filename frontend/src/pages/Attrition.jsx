import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import "./Attrition.css";

export default function Attrition() {
  const navigate = useNavigate();
  const { selectedDatasetId } = useDataset();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const fetchAttrition = async () => {
    setLoading(true);
    setError("");
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const url = selectedDatasetId
        ? `${apiUrl}/api/predictions/attrition?dataset_id=${selectedDatasetId}`
        : `${apiUrl}/api/predictions/attrition`;
      const res = await fetch(url, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setError(json.message || "Failed to load attrition model.");
      }
    } catch (err) {
      setError(err.message || "Unable to reach prediction server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttrition();
  }, [selectedDatasetId]);

  if (loading) {
    return (
      <AppLayout title="Attrition Risk Prediction" subtitle="Evaluating retention and turnover probabilities...">
        <Loading message="Running Random Forest and Gradient Boosting classification..." />
      </AppLayout>
    );
  }

  if (!data || data.detail || !data.target_found) {
    const isMissingDataset = !data || (data.detail && data.detail.toLowerCase().includes("no active dataset"));
    return (
      <AppLayout title="Attrition Risk Prediction" subtitle="Supervised Retention Analysis">
        <div className="empty-dataset-card">
          <span className="material-symbols-outlined large-empty-icon">upload_file</span>
          <h3>{isMissingDataset ? "Please Upload Dataset" : "No Historical Attrition Target Found"}</h3>
          <p>
            {isMissingDataset
              ? "No dataset has been uploaded yet. Please upload an employee dataset (CSV or Excel) with historical attrition data to evaluate turnover probabilities."
              : data?.message || "This dataset does not contain an attrition or turnover target column (e.g. 'Attrition', 'Left', 'Exited'). Supervised turnover prediction is disabled to avoid false predictions."}
          </p>
          <Link to="/data-upload" className="btn-primary">
            {isMissingDataset ? "Upload Dataset" : "Upload Dataset with Attrition Target"}
          </Link>
        </div>
      </AppLayout>
    );
  }

  const { metrics, risk_distribution, feature_importances, scored_employees } = data;

  const employeesTableCols = [
    { key: "employee_id", label: "ID", sortable: true },
    { key: "name", label: "Employee Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "job_role", label: "Role", sortable: true },
    {
      key: "attrition_probability",
      label: "Turnover Prob",
      sortable: true,
      render: (val) => <strong>{val}%</strong>
    },
    {
      key: "attrition_risk",
      label: "Risk Level",
      sortable: true,
      render: (val) => (
        <span className={`risk-badge ${val?.toLowerCase()}`}>
          {val} Risk
        </span>
      )
    },
    {
      key: "action",
      label: "Profile",
      sortable: false,
      render: (_, row) => (
        <button
          className="btn-secondary text-xs py-1 px-2"
          onClick={(e) => { e.stopPropagation(); navigate(`/employee/${row.employee_id}`); }}
        >
          View
        </button>
      )
    }
  ];

  return (
    <AppLayout
      title="Attrition Risk Prediction & Mitigation"
      subtitle={`Model: ${data.best_model_name} • Target Column: ${data.target_column}`}
    >
      {/* Action Header */}
      <div className="page-action-bar">
        <div className="action-bar-title-group">
          <h2>Predictive Turnover Modeling</h2>
          <p>Trained with balanced class weighting to address typical employee turnover imbalances.</p>
        </div>
        <button className="btn-ai" onClick={fetchAttrition}>
          <span className="material-symbols-outlined">refresh</span>
          <span>Retrain Model</span>
        </button>
      </div>

      {/* Model KPI Cards */}
      <div className="stats-grid-4">
        <StatCard
          title="ACCURACY"
          value={metrics ? `${metrics.accuracy}%` : "—"}
          subtitle="Test set evaluation"
          trend="up"
          trendValue="Test Set"
          icon="verified"
          iconBg="#dcfce7"
          iconColor="#15803d"
        />
        <StatCard
          title="F1-SCORE"
          value={metrics ? `${metrics.f1_score}%` : "—"}
          subtitle="Harmonic mean"
          trend="neutral"
          trendValue="Balanced"
          icon="balance"
          iconBg="#eff6ff"
          iconColor="#1e40af"
        />
        <StatCard
          title="HIGH RISK POPULATION"
          value={risk_distribution?.High || 0}
          subtitle="Probability >= 55%"
          trend="down"
          trendValue="Critical"
          icon="warning"
          iconBg="#fee2e2"
          iconColor="#dc2626"
        />
        <StatCard
          title="LOW RISK POPULATION"
          value={risk_distribution?.Low || 0}
          subtitle="Stable workforce"
          trend="up"
          trendValue="Safe"
          icon="check_circle"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
      </div>

      {/* Feature Importance & Risk Overview */}
      <div className="charts-grid-2">
        <ChartCard
          title="Top Attrition Feature Drivers"
          subtitle="Relative importance percentage in predicting turnover"
          emptyMessage={feature_importances?.length === 0 ? "No feature importances computed." : null}
        >
          {feature_importances && (
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={feature_importances} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0edef" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#44474d" }} />
                <YAxis dataKey="feature" type="category" width={140} tick={{ fontSize: 11, fill: "#44474d" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e4e2e4", fontSize: "12px" }}
                  formatter={(val) => [`${val}%`, "Importance"]}
                />
                <Bar dataKey="importance" fill="#1e40af" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Confusion Matrix Card */}
        <div className="confusion-matrix-card">
          <div className="section-header-box">
            <h3>Confusion Matrix Evaluation</h3>
            <p>True Positives, False Positives, True Negatives & False Negatives on holdout validation.</p>
          </div>
          {metrics?.confusion_matrix && (
            <div className="cm-grid">
              <div className="cm-cell tn">
                <span className="cm-label">True Negative (Retained)</span>
                <span className="cm-count">{metrics.confusion_matrix[0][0]}</span>
              </div>
              <div className="cm-cell fp">
                <span className="cm-label">False Positive</span>
                <span className="cm-count">{metrics.confusion_matrix[0][1]}</span>
              </div>
              <div className="cm-cell fn">
                <span className="cm-label">False Negative</span>
                <span className="cm-count">{metrics.confusion_matrix[1][0]}</span>
              </div>
              <div className="cm-cell tp">
                <span className="cm-label">True Positive (Turnover)</span>
                <span className="cm-count">{metrics.confusion_matrix[1][1]}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scored Employees Table */}
      <div className="ai-section-card">
        <div className="section-header-box">
          <h3>Individual Flight Risk Scores</h3>
          <p>Every employee evaluated with turnover probabilities and recommended action paths.</p>
        </div>
        <DataTable
          columns={employeesTableCols}
          data={scored_employees || []}
          searchPlaceholder="Search by name, ID, or department..."
          pageSize={10}
          onRowClick={(row) => navigate(`/employee/${row.employee_id}`)}
        />
      </div>
    </AppLayout>
  );
}
