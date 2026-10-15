import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import Loading from "../components/Loading";
import { useDataset } from "../context/DatasetContext";

export default function Promotion() {
  const navigate = useNavigate();
  const { selectedDatasetId } = useDataset();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchPromotion = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        const url = selectedDatasetId
          ? `${apiUrl}/api/predictions/promotion?dataset_id=${selectedDatasetId}`
          : `${apiUrl}/api/predictions/promotion`;
        const res = await fetch(url, {
          method: "POST",
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
    fetchPromotion();
  }, [selectedDatasetId]);

  if (loading) {
    return (
      <AppLayout title="Promotion Readiness & Succession Planning" subtitle="Analyzing promotion candidates...">
        <Loading message="Evaluating experience, performance tenure, and leadership indicators..." />
      </AppLayout>
    );
  }

  if (!data || !data.has_promotion_data || !data.promotion_candidates || data.promotion_candidates.length === 0) {
    const isNonHr = data && data.has_promotion_data === false;
    return (
      <AppLayout title="Promotion Readiness & Succession Planning" subtitle="Talent Succession Engine">
        <div className="empty-dataset-card">
          <span className="material-symbols-outlined large-empty-icon">
            {isNonHr ? "badge" : "upload_file"}
          </span>
          <h3>{isNonHr ? "No Promotion Metrics Detected" : "Please Upload Dataset"}</h3>
          <p>
            {isNonHr
              ? data?.message || "The active dataset does not contain employee workforce metrics (e.g. Department, Role, Performance, or Tenure). Promotion readiness evaluation is unavailable for non-employee datasets."
              : "No dataset has been uploaded yet. Please upload an employee dataset (CSV or Excel) to generate promotion readiness scores and succession pipelines."}
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

  const { readiness_distribution, promotion_candidates, method } = data || {};

  const tableCols = [
    { key: "employee_id", label: "ID", sortable: true },
    { key: "name", label: "Employee Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "job_role", label: "Role", sortable: true },
    {
      key: "promotion_score",
      label: "Readiness Score",
      sortable: true,
      render: (val) => <strong>{val} / 100</strong>
    },
    {
      key: "promotion_readiness",
      label: "Status",
      sortable: true,
      render: (val) => (
        <span className={`status-chip ${val?.toLowerCase().replace(" ", "-")}`}>
          {val}
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
          Review
        </button>
      )
    }
  ];

  return (
    <AppLayout
      title="Promotion Readiness & Succession Planning"
      subtitle={`Engine: ${method || "Explainable Multi-Factor Model"}`}
    >
      <div className="page-action-bar">
        <div className="action-bar-title-group">
          <h2>Succession Pipeline & Leadership Readiness</h2>
          <p>Identifies employees exhibiting accelerated performance, tenure depth, and core competency mastery.</p>
        </div>
      </div>

      <div className="stats-grid-3">
        <StatCard
          title="PROMOTION READY"
          value={readiness_distribution?.Ready || 0}
          subtitle="Score >= 75.0"
          trend="up"
          trendValue="Ready Now"
          icon="military_tech"
          iconBg="#dcfce7"
          iconColor="#15803d"
        />
        <StatCard
          title="DEVELOPING TALENT"
          value={readiness_distribution?.Developing || 0}
          subtitle="Score 55.0–74.9"
          trend="neutral"
          trendValue="Pipeline"
          icon="trending_up"
          iconBg="#eff6ff"
          iconColor="#1e40af"
        />
        <StatCard
          title="NOT READY"
          value={readiness_distribution?.["Not Ready"] || 0}
          subtitle="Score < 55.0"
          trend="down"
          trendValue="Early Stage"
          icon="hourglass_empty"
          iconBg="#f5f3f5"
          iconColor="#75777d"
        />
      </div>

      <div className="ai-section-card">
        <div className="section-header-box">
          <h3>Promotion Pipeline Candidates (Ranked by Readiness)</h3>
          <p>Click on any employee to inspect their individual talent profile, skill radar, and development curriculum.</p>
        </div>
        <DataTable
          columns={tableCols}
          data={promotion_candidates || []}
          searchPlaceholder="Search candidates by name, department..."
          pageSize={10}
          onRowClick={(row) => navigate(`/employee/${row.employee_id}`)}
        />
      </div>
    </AppLayout>
  );
}
