import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import Loading from "../components/Loading";
import { useDataset } from "../context/DatasetContext";

export default function Insights() {
  const { selectedDatasetId } = useDataset();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [filterCat, setFilterCat] = useState("all");
  const [filterImpact, setFilterImpact] = useState("all");

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        const url = selectedDatasetId
          ? `${apiUrl}/api/analytics/insights?dataset_id=${selectedDatasetId}`
          : `${apiUrl}/api/analytics/insights`;
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setInsights(json.insights || []);
        }
      } catch (e) {}
      finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [selectedDatasetId]);

  if (loading) {
    return (
      <AppLayout title="Executive AI Insights & Intelligence" subtitle="Scanning workforce patterns...">
        <Loading message="Synthesizing correlation anomalies, attrition drivers, and productivity metrics..." />
      </AppLayout>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <AppLayout title="Executive AI Insights & Intelligence" subtitle="Organizational Strategic Intelligence">
        <div className="empty-dataset-card">
          <span className="material-symbols-outlined large-empty-icon">lightbulb</span>
          <h3>No Strategic HR Insights Detected</h3>
          <p>The active dataset does not contain workforce or employee records (Department, Attrition, Role, Performance). Strategic AI insights and anomaly detection require an employee dataset.</p>
          <button className="btn-primary" onClick={() => window.location.href = "/data-upload"}>
            Upload Employee Dataset
          </button>
        </div>
      </AppLayout>
    );
  }

  const filtered = insights.filter((ins) => {
    if (filterCat !== "all" && ins.category !== filterCat) return false;
    if (filterImpact !== "all" && ins.impact !== filterImpact) return false;
    return true;
  });

  const highCount = insights.filter(i => i.impact === "High").length;
  const medCount = insights.filter(i => i.impact === "Medium").length;

  return (
    <AppLayout
      title="Executive AI Insights & Intelligence"
      subtitle="Explainable, evidence-backed strategic recommendations derived directly from active employee dataset metrics."
    >
      <div className="page-action-bar">
        <div className="action-bar-title-group">
          <h2>Organizational Strategic Intelligence</h2>
          <p>Automated statistical anomaly detection across attrition, compensation parity, and burnout risks.</p>
        </div>
      </div>

      <div className="stats-grid-3">
        <StatCard
          title="TOTAL INSIGHTS GENERATED"
          value={insights.length}
          subtitle="Audited signals"
          trend="neutral"
          trendValue="Active"
          icon="auto_awesome"
          iconBg="#eff6ff"
          iconColor="#1e40af"
        />
        <StatCard
          title="HIGH IMPACT INTERVENTIONS"
          value={highCount}
          subtitle="Immediate priority"
          trend="down"
          trendValue="Action Required"
          icon="priority_high"
          iconBg="#fee2e2"
          iconColor="#dc2626"
        />
        <StatCard
          title="TACTICAL ADVISORIES"
          value={medCount}
          subtitle="Process optimization"
          trend="up"
          trendValue="Medium Impact"
          icon="lightbulb"
          iconBg="#fef3c7"
          iconColor="#d97706"
        />
      </div>

      {/* Filter Bar */}
      <div style={{ background: "#ffffff", padding: "14px 20px", borderRadius: "12px", border: "1px solid #e4e2e4", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#75777d" }}>CATEGORY:</span>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #c5c6cd", fontSize: "13px", background: "#fbf8fb" }}
          >
            <option value="all">All Categories</option>
            <option value="Attrition">Attrition & Flight Risk</option>
            <option value="Performance">Performance & Equity</option>
            <option value="Satisfaction">Satisfaction & Well-being</option>
            <option value="Workforce">Workforce Demographics</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#75777d" }}>IMPACT:</span>
          <select
            value={filterImpact}
            onChange={(e) => setFilterImpact(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #c5c6cd", fontSize: "13px", background: "#fbf8fb" }}
          >
            <option value="all">All Impacts</option>
            <option value="High">High Impact Only</option>
            <option value="Medium">Medium Impact</option>
            <option value="Low">Low Impact</option>
          </select>
        </div>
      </div>

      {/* Insights Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {filtered.length > 0 ? (
          filtered.map((ins) => (
            <div
              key={ins.id}
              style={{
                background: "#ffffff",
                borderLeft: `4px solid ${ins.impact === "High" ? "#dc2626" : ins.impact === "Medium" ? "#f59e0b" : "#3b82f6"}`,
                borderRadius: "12px",
                padding: "24px",
                borderTop: "1px solid #e4e2e4",
                borderRight: "1px solid #e4e2e4",
                borderBottom: "1px solid #e4e2e4",
                boxShadow: "0 4px 16px rgba(11,25,46,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ background: "#eff6ff", color: "#1e40af", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
                    {ins.category}
                  </span>
                  <span style={{ background: ins.impact === "High" ? "#fee2e2" : ins.impact === "Medium" ? "#fef3c7" : "#f0fdf4", color: ins.impact === "High" ? "#991b1b" : ins.impact === "Medium" ? "#92400e" : "#166534", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>
                    {ins.impact} Impact
                  </span>
                </div>
              </div>

              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0b192e" }}>{ins.title}</h3>
              <p style={{ margin: 0, fontSize: "14px", color: "#44474d", lineHeight: "22px" }}>{ins.description}</p>

              <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#1e40af", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
                  <span className="material-symbols-outlined text-base">recommend</span>
                  <span>Recommended Strategic Action:</span>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "#1e293b", fontWeight: "500" }}>{ins.recommendation}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-dataset-card">
            <span className="material-symbols-outlined large-empty-icon">filter_alt_off</span>
            <h3>No Insights Match Filter</h3>
            <p>Adjust your filter criteria above to see all available workforce insights.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
