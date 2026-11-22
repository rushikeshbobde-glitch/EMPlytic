import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import Loading from "../components/Loading";
import { useDataset } from "../context/DatasetContext";
import ScoreGauge from "../components/ScoreGauge";

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

  const avgReadyScore = 68;

  return (
    <AppLayout
      title="Promotion Readiness"
      subtitle={`Engine: ${method || "Explainable Multi-Factor Model"}`}
    >
      {/* Screen 12: Hero 2-Column Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px", marginBottom: "24px" }}>
        {/* Left Card: Score Gauge */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <ScoreGauge
            score={avgReadyScore}
            max={100}
            size={150}
            unit="/ 100"
            label="Developing"
            color="#f59e0b"
          />
          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
            <span style={{ color: "#64748b" }}>Readiness Level:</span>
            <span style={{ background: "#fef3c7", color: "#b45309", padding: "2px 10px", borderRadius: "12px", fontWeight: "700", border: "1px solid #fde68a" }}>
              Developing
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "14px", lineHeight: "1.4", padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
            This is an analytical score based on available features. Not a ML prediction.
          </div>
        </div>

        {/* Right Card: Key Factors */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)", display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid #f1f5f9" }}>
            <h4 style={{ margin: 0, fontFamily: "Hanken Grotesk, sans-serif", fontSize: "16px", fontWeight: "700", color: "#0b192e" }}>
              Key Factors
            </h4>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ fontWeight: "600", color: "#334155" }}>Experience</span>
                <span style={{ fontWeight: "700", color: "#0b192e" }}>32%</span>
              </div>
              <div style={{ width: "100%", height: "7px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "32%", height: "100%", background: "#2563eb", borderRadius: "4px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ fontWeight: "600", color: "#334155" }}>Rating</span>
                <span style={{ fontWeight: "700", color: "#0b192e" }}>24%</span>
              </div>
              <div style={{ width: "100%", height: "7px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "24%", height: "100%", background: "#10b981", borderRadius: "4px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ fontWeight: "600", color: "#334155" }}>Training</span>
                <span style={{ fontWeight: "700", color: "#0b192e" }}>18%</span>
              </div>
              <div style={{ width: "100%", height: "7px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "18%", height: "100%", background: "#38bdf8", borderRadius: "4px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ fontWeight: "600", color: "#334155" }}>Skills</span>
                <span style={{ fontWeight: "700", color: "#0b192e" }}>14%</span>
              </div>
              <div style={{ width: "100%", height: "7px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "14%", height: "100%", background: "#8b5cf6", borderRadius: "4px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ fontWeight: "600", color: "#334155" }}>Tenure</span>
                <span style={{ fontWeight: "700", color: "#0b192e" }}>12%</span>
              </div>
              <div style={{ width: "100%", height: "7px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "12%", height: "100%", background: "#f59e0b", borderRadius: "4px" }}></div>
              </div>
            </div>
          </div>
        </div>
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
