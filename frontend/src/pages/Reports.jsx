import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import Loading from "../components/Loading";
import { useDataset } from "../context/DatasetContext";

const REPORT_TYPES = [
  {
    id: "executive",
    title: "Executive HR Strategy Report",
    desc: "Holistic organizational summary with C-suite KPIs, departmental health scores, and critical flight risk summaries.",
    icon: "assessment",
    iconBg: "#eff6ff",
    iconColor: "#1e40af"
  },
  {
    id: "attrition",
    title: "Attrition Risk & Flight Prevention Report",
    desc: "Predictive turnover probabilities, confusion matrix metrics, and targeted intervention strategies for at-risk staff.",
    icon: "trending_down",
    iconBg: "#fee2e2",
    iconColor: "#dc2626"
  },
  {
    id: "performance",
    title: "Workforce Performance Evaluation Report",
    desc: "Comprehensive performance score rankings, category distributions, and merit compensation benchmarking.",
    icon: "speed",
    iconBg: "#f0fdf4",
    iconColor: "#16a34a"
  },
  {
    id: "productivity",
    title: "Operational Productivity & Work Hours Report",
    desc: "Departmental productivity index synthesis, overtime correlations, and attendance reliability metrics.",
    icon: "monitoring",
    iconBg: "#eff6ff",
    iconColor: "#3755c3"
  },
  {
    id: "skill_gap",
    title: "Skill Gap & Talent Development Report",
    desc: "Competency deficit audits, learning pathway enrollments, and professional curriculum recommendations.",
    icon: "psychology",
    iconBg: "#fef3c7",
    iconColor: "#d97706"
  }
];

export default function Reports() {
  const { selectedDatasetId } = useDataset();
  const [downloading, setDownloading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasDataset, setHasDataset] = useState(false);

  useEffect(() => {
    const checkDataset = async () => {
      setLoading(true);
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
        if (res.ok && json.success && json.kpis && json.kpis.total_employees > 0) {
          setHasDataset(true);
        } else {
          setHasDataset(false);
        }
      } catch (e) {
        setHasDataset(false);
      } finally {
        setLoading(false);
      }
    };
    checkDataset();
  }, [selectedDatasetId]);

  const handleDownload = async (reportType, format) => {
    setDownloading(`${reportType}-${format}`);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const dsParam = selectedDatasetId ? `&dataset_id=${selectedDatasetId}` : "";

      if (format === "html") {
        // Open standalone HTML in new tab
        window.open(`${apiUrl}/api/reports/html?report_type=${reportType}${dsParam}`, "_blank");
        return;
      }

      const response = await fetch(`${apiUrl}/api/reports/${format}?report_type=${reportType}${dsParam}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ${format.toUpperCase()} report.`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `emplytic_${reportType}_report.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert("Error generating report: " + err.message);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Executive Report Generation Center" subtitle="Preparing reporting services...">
        <Loading message="Checking workforce dataset status..." />
      </AppLayout>
    );
  }

  if (!hasDataset) {
    return (
      <AppLayout title="Executive Report Generation Center" subtitle="Multi-Format Executive Reporting">
        <div className="empty-dataset-card">
          <span className="material-symbols-outlined large-empty-icon">upload_file</span>
          <h3>Please Upload Dataset</h3>
          <p>No dataset has been uploaded yet. Please upload an employee dataset (CSV or Excel) to generate PDF, Excel, and HTML executive reports.</p>
          <Link to="/data-upload" className="btn-primary">
            Upload Dataset
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Executive Report Generation Center"
      subtitle="Export publication-ready PDF reports, formatted Excel multi-tab workbooks, and self-contained HTML presentations."
    >
      <div className="page-action-bar">
        <div className="action-bar-title-group">
          <h2>Workforce Analytics Export Suite</h2>
          <p>Instant automated document generation from live analyzed datasets.</p>
        </div>
      </div>

      <div className="stats-grid-3">
        <StatCard
          title="EXPORT FORMATS"
          value="PDF • Excel • HTML"
          subtitle="Enterprise multi-format"
          icon="file_download"
          iconBg="#eff6ff"
          iconColor="#1e40af"
        />
        <StatCard
          title="AVAILABLE TEMPLATES"
          value="5 Specialized Reports"
          subtitle="Executive to granular audits"
          icon="library_books"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
        <StatCard
          title="DATA AUDITING"
          value="100% Live Synced"
          subtitle="Generated from active records"
          icon="verified"
          iconBg="#dcfce7"
          iconColor="#15803d"
        />
      </div>

      {/* Reports Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {REPORT_TYPES.map((rep) => (
          <div
            key={rep.id}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "24px 28px",
              border: "1px solid #e4e2e4",
              boxShadow: "0 4px 16px rgba(11,25,46,0.04)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "18px", maxWidth: "680px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: rep.iconBg, color: rep.iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined text-2xl">{rep.icon}</span>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0b192e" }}>{rep.title}</h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#75777d", lineHeight: "20px" }}>{rep.desc}</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                className="btn-primary text-xs"
                disabled={downloading === `${rep.id}-pdf`}
                onClick={() => handleDownload(rep.id, "pdf")}
              >
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                <span>{downloading === `${rep.id}-pdf` ? "Generating..." : "Download PDF"}</span>
              </button>

              <button
                className="btn-secondary text-xs"
                disabled={downloading === `${rep.id}-excel`}
                onClick={() => handleDownload(rep.id, "excel")}
              >
                <span className="material-symbols-outlined text-sm">table_view</span>
                <span>{downloading === `${rep.id}-excel` ? "Generating..." : "Download Excel"}</span>
              </button>

              <button
                className="btn-secondary text-xs"
                onClick={() => handleDownload(rep.id, "html")}
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                <span>View HTML</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
