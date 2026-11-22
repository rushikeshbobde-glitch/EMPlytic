import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import Loading from "../components/Loading";
import { useDataset } from "../context/DatasetContext";
import "./AIDashboard.css";

export default function AIDashboard() {
  const navigate = useNavigate();
  const { selectedDatasetId } = useDataset();
  const [loading, setLoading] = useState(true);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const fetchMLStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const url = selectedDatasetId
        ? `${apiUrl}/api/predictions/run-all?dataset_id=${selectedDatasetId}`
        : `${apiUrl}/api/predictions/run-all`;
      const res = await fetch(url, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      } else {
        setError(json.message || "Failed to load ML pipeline state.");
      }
    } catch (err) {
      setError(err.message || "Unable to reach ML server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMLStatus();
  }, [selectedDatasetId]);

  const handleRetrain = async () => {
    setRunningPipeline(true);
    await fetchMLStatus();
    setRunningPipeline(false);
  };

  if (loading) {
    return (
      <AppLayout title="AI Predictive Intelligence Studio" subtitle="Initializing machine learning models...">
        <Loading message="Evaluating Random Forest, Gradient Boosting, and KMeans clustering..." />
      </AppLayout>
    );
  }

  if (!data || data.is_employee_dataset === false || !data.attrition) {
    const isNonHr = data && data.is_employee_dataset === false;
    return (
      <AppLayout title="AI Predictive Intelligence Studio" subtitle="Supervised & Unsupervised ML Center">
        <div className="empty-dataset-card">
          <span className="material-symbols-outlined large-empty-icon">
            {isNonHr ? "model_training" : "upload_file"}
          </span>
          <h3>{isNonHr ? "Non-Employee Dataset Selected" : "Please Upload Dataset"}</h3>
          <p>
            {isNonHr
              ? data?.message || "The active dataset does not contain workforce or employee columns (Department, Role, Salary, Performance, etc.). Machine learning pipelines for retention and promotion require an employee dataset."
              : error || "No dataset has been uploaded yet. Please upload an employee dataset (CSV or Excel) to train Attrition classifiers, compute Performance indices, and run KMeans clustering."}
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

  const { attrition, promotion, performance, productivity, segmentation } = data;

  return (
    <AppLayout
      title="AI Predictive Intelligence Studio"
      subtitle="Supervised Classification, Regression, and Unsupervised Clustering Pipelines"
    >
      {/* Top Action Bar */}
      <div className="page-action-bar">
        <div className="action-bar-title-group">
          <h2>Machine Learning Model Management</h2>
          <p>Trained with stratified cross-validation and imbalanced class weighting</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ai" onClick={handleRetrain} disabled={runningPipeline}>
            <span className="material-symbols-outlined">refresh</span>
            <span>{runningPipeline ? "Retraining Models..." : "Re-run ML Pipeline"}</span>
          </button>
        </div>
      </div>

      {/* 4 Supervised & Unsupervised Model Status Cards */}
      <div className="stats-grid-4">
        <StatCard
          title="ATTRITION MODEL"
          value={attrition.metrics ? `${attrition.metrics.accuracy}%` : "Rule Engine"}
          subtitle={attrition.best_model_name || "Target Unavailable"}
          trend="up"
          trendValue={attrition.metrics ? `ROC-AUC: ${attrition.metrics.roc_auc}%` : "Active"}
          icon="model_training"
          iconBg="#eff6ff"
          iconColor="#1e40af"
          onClick={() => navigate("/attrition")}
        />
        <StatCard
          title="PROMOTION READINESS"
          value={`${promotion.readiness_distribution?.Ready || 0}`}
          subtitle={`${promotion.readiness_distribution?.Developing || 0} developing candidates`}
          trend="up"
          trendValue="Ready"
          icon="military_tech"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
          onClick={() => navigate("/promotion")}
        />
        <StatCard
          title="AI PERFORMANCE ENGINE"
          value={`${performance.average_score || 82}%`}
          subtitle={performance.method?.includes("RandomForest") ? "Supervised Regressor" : "Composite Engine"}
          trend="neutral"
          trendValue="Live"
          icon="speed"
          iconBg="#fef3c7"
          iconColor="#d97706"
          onClick={() => navigate("/performance")}
        />
        <StatCard
          title="CLUSTERING SILHOUETTE"
          value={`${segmentation.silhouette_score || 0.42}`}
          subtitle={`${segmentation.n_clusters || 4} Segment Clusters`}
          trend="up"
          trendValue="KMeans"
          icon="scatter_plot"
          iconBg="#f5f3ff"
          iconColor="#7c3aed"
        />
      </div>

      {/* Model Performance Comparison Section */}
      {attrition.model_comparison && (
        <div className="ai-section-card">
          <div className="section-header-box">
            <h3>Supervised Model Comparison (Attrition Prediction)</h3>
            <p>Benchmarked with 80/20 stratified train/test split to prevent overfitting.</p>
          </div>
          <div className="models-comparison-grid">
            {Object.entries(attrition.model_comparison).map(([mName, mMetrics]) => (
              <div key={mName} className={`model-card ${attrition.best_model_name?.toLowerCase().includes(mName.toLowerCase().replace(" ", "")) ? "winner" : ""}`}>
                <div className="model-card-header">
                  <h4>{mName}</h4>
                  {attrition.best_model_name?.toLowerCase().includes(mName.toLowerCase().replace(" ", "")) && (
                    <span className="best-model-badge">Selected Model</span>
                  )}
                </div>
                <div className="model-metrics-row">
                  <div className="metric-box">
                    <span>Accuracy</span>
                    <strong>{mMetrics.accuracy}%</strong>
                  </div>
                  <div className="metric-box">
                    <span>F1-Score</span>
                    <strong>{mMetrics.f1_score}%</strong>
                  </div>
                  <div className="metric-box">
                    <span>ROC-AUC</span>
                    <strong>{mMetrics.roc_auc}%</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workforce Segmentation Clusters */}
      <div className="ai-section-card">
        <div className="section-header-box">
          <h3>Unsupervised KMeans Workforce Segmentation</h3>
          <p>Employees grouped dynamically based on multidimensional feature centroids (Age, Salary, Performance, Satisfaction, Productivity).</p>
        </div>
        <div className="clusters-grid">
          {segmentation.cluster_profiles?.map((cluster) => (
            <div key={cluster.cluster_id} className="cluster-card">
              <div className="cluster-card-top">
                <span className="cluster-id-badge">Segment {cluster.cluster_id + 1}</span>
                <span className="cluster-size">{cluster.size} Employees ({cluster.percentage}%)</span>
              </div>
              <h4 className="cluster-title">{cluster.name}</h4>
              <div className="traits-row">
                {cluster.key_traits.map((t, idx) => (
                  <span key={idx} className="trait-chip">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
