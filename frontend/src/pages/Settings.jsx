import { useState } from "react";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, logout } = useAuth();
  const [cleared, setCleared] = useState(false);

  const handleClearCache = () => {
    localStorage.removeItem("emplytic_eda_cache");
    localStorage.removeItem("emplytic_dataset_meta");
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  };

  return (
    <AppLayout
      title="Platform Settings & System Configuration"
      subtitle="Configure workspace settings, API endpoints, and authentication sessions."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* User Account Info */}
        <div className="ai-section-card">
          <div className="section-header-box">
            <h3>Active User Profile</h3>
            <p>Your current session details and assigned role privileges.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            <div style={{ background: "#fbf8fb", padding: "16px", borderRadius: "10px", border: "1px solid #e4e2e4" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#75777d" }}>NAME</span>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#0b192e", marginTop: "4px" }}>{user?.name || "Admin User"}</div>
            </div>
            <div style={{ background: "#fbf8fb", padding: "16px", borderRadius: "10px", border: "1px solid #e4e2e4" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#75777d" }}>EMAIL</span>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#0b192e", marginTop: "4px" }}>{user?.email || "admin@emplytic.com"}</div>
            </div>
            <div style={{ background: "#fbf8fb", padding: "16px", borderRadius: "10px", border: "1px solid #e4e2e4" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#75777d" }}>ROLE</span>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#1e40af", marginTop: "4px" }}>{user?.role?.toUpperCase() || "HR ADMIN"}</div>
            </div>
          </div>
        </div>

        {/* Database & Architecture */}
        <div className="ai-section-card">
          <div className="section-header-box">
            <h3>Backend Architecture & Database</h3>
            <p>Technology stack and data tier configuration.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#fbf8fb", borderRadius: "8px" }}>
              <strong>Database Engine:</strong>
              <span style={{ color: "#1e40af", fontWeight: "600" }}>SQLite (via SQLAlchemy ORM • PostgreSQL-Ready)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#fbf8fb", borderRadius: "8px" }}>
              <strong>API Gateway:</strong>
              <span style={{ color: "#1e40af", fontWeight: "600" }}>FastAPI 0.141 • Python 3.14 • Uvicorn</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#fbf8fb", borderRadius: "8px" }}>
              <strong>ML Framework:</strong>
              <span style={{ color: "#1e40af", fontWeight: "600" }}>Scikit-Learn 1.9 (Random Forest, Gradient Boosting, KMeans)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#fbf8fb", borderRadius: "8px" }}>
              <strong>Frontend Environment:</strong>
              <span style={{ color: "#1e40af", fontWeight: "600" }}>React 19 • Vite 8 • Recharts 3</span>
            </div>
          </div>
        </div>

        {/* Cache & Maintenance */}
        <div className="ai-section-card">
          <div className="section-header-box">
            <h3>Local Storage & Cache Management</h3>
            <p>Clear client-side temporary cached analytics to force a fresh pull from the backend database.</p>
          </div>
          <div>
            <button className="btn-secondary" onClick={handleClearCache}>
              <span className="material-symbols-outlined">delete_sweep</span>
              <span>{cleared ? "Cache Cleared!" : "Clear Local Storage Cache"}</span>
            </button>
            {cleared && <span style={{ marginLeft: "12px", color: "#16a34a", fontSize: "13px", fontWeight: "600" }}>Local cache successfully purged.</span>}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
