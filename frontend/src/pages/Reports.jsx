import { useState } from "react";
import AppLayout from "../components/AppLayout";
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

  // All state hooks declared strictly at the top
  const [downloading, setDownloading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState("executive");
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [dateRange, setDateRange] = useState("Last 6 Months");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeInsights, setIncludeInsights] = useState(true);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [successToast, setSuccessToast] = useState("");

  const handleDownload = async (reportType, format) => {
    const actionKey = `${reportType}-${format}`;
    setDownloading(actionKey);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const dsParam = selectedDatasetId ? `&dataset_id=${selectedDatasetId}` : "";
      const url = `${apiUrl}/api/reports/${format}?report_type=${reportType}${dsParam}`;

      const response = await fetch(url, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ${format.toUpperCase()} report (${response.status})`);
      }

      if (format === "html") {
        const htmlText = await response.text();
        const blob = new Blob([htmlText], { type: "text/html" });
        const blobUrl = window.URL.createObjectURL(blob);
        const win = window.open(blobUrl, "_blank");
        if (!win) {
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `emplytic_${reportType}_report.html`;
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      } else {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        const ext = format === "pdf" ? "pdf" : "xlsx";
        link.download = `emplytic_${reportType}_report.${ext}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      }

      // Populate interactive report preview on screen
      const reportMeta = REPORT_TYPES.find(r => r.id === reportType) || REPORT_TYPES[0];
      setGeneratedReport({
        type: reportType,
        title: reportMeta.title,
        format: format.toUpperCase(),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        dateRange: dateRange,
        inclusions: {
          charts: includeCharts,
          details: includeDetails,
          insights: includeInsights
        },
        kpis: {
          headcount: 1470,
          avgPerformance: "78.4 / 100",
          productivity: "76.8 / 100",
          attritionRisk: "14.2%",
          promotionReady: "68%"
        }
      });

      setSuccessToast(`${reportMeta.title} (${format.toUpperCase()}) successfully generated & downloaded!`);
      setTimeout(() => setSuccessToast(""), 6000);

    } catch (err) {
      console.error("Report download error:", err);
      alert("Error generating report: " + err.message);
    } finally {
      setDownloading(null);
    }
  };

  const handleGenerateClick = () => {
    handleDownload(selectedReportType, selectedFormat);
  };

  if (loading) {
    return (
      <AppLayout title="Reports Generation" subtitle="Preparing reporting services...">
        <Loading message="Initializing reporting engine..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Reports Generation"
      subtitle="Export publication-ready PDF reports, formatted Excel multi-tab workbooks, and self-contained HTML presentations."
    >
      {/* Toast Alert */}
      {successToast && (
        <div style={{
          background: "#ecfdf5",
          border: "1px solid #a7f3d0",
          borderRadius: "12px",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          boxShadow: "0 4px 12px rgba(16,185,129,0.12)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="material-symbols-outlined" style={{ color: "#059669" }}>check_circle</span>
            <strong style={{ color: "#065f46", fontSize: "14px" }}>{successToast}</strong>
          </div>
          <button onClick={() => setSuccessToast("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#059669" }}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Screen 21: Hero 2-Column Generate Report Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px", marginBottom: "32px" }}>
        {/* Left Card: Form */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "800", color: "#0b192e" }}>
            Generate Report
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Report Type */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                Report Type
              </label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "13px", background: "#f8fafc", color: "#0b192e" }}
              >
                <option value="executive">HR Analytics Report (Executive Dossier)</option>
                <option value="performance">Workforce Performance Evaluation Report</option>
                <option value="attrition">Attrition Risk & Flight Prevention Report</option>
                <option value="productivity">Operational Productivity & Work Hours Report</option>
                <option value="skill_gap">Skill Gap & Talent Development Report</option>
              </select>
            </div>

            {/* Format Selector Pills */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                Format
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                {[
                  { id: "pdf", label: "PDF", icon: "picture_as_pdf" },
                  { id: "excel", label: "Excel", icon: "table_view" },
                  { id: "html", label: "HTML", icon: "code" },
                ].map(fmt => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      background: selectedFormat === fmt.id ? "#2563eb" : "#f1f5f9",
                      color: selectedFormat === fmt.id ? "#ffffff" : "#475569",
                      border: selectedFormat === fmt.id ? "1px solid #2563eb" : "1px solid #cbd5e1",
                      transition: "all 0.15s"
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{fmt.icon}</span>
                    <span>{fmt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Selector */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "13px", background: "#f8fafc", color: "#0b192e" }}
              >
                <option value="Last 6 Months">Last 6 Months</option>
                <option value="Last 3 Months">Last 3 Months</option>
                <option value="Last 12 Months">Last 12 Months</option>
                <option value="Year to Date">Year to Date (YTD)</option>
              </select>
            </div>

            {/* Checkbox Inclusions */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>
                Include
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#2563eb" }}
                  />
                  <span>Charts & Visualizations</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                  <input
                    type="checkbox"
                    checked={includeDetails}
                    onChange={(e) => setIncludeDetails(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#2563eb" }}
                  />
                  <span>Employee Details</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                  <input
                    type="checkbox"
                    checked={includeInsights}
                    onChange={(e) => setIncludeInsights(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#2563eb" }}
                  />
                  <span>Summary Insights</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              className="btn-primary"
              style={{ marginTop: "8px", justifyContent: "center", padding: "12px", fontSize: "14px", fontWeight: "700" }}
              disabled={downloading !== null}
              onClick={handleGenerateClick}
            >
              <span className="material-symbols-outlined">
                {downloading ? "hourglass_top" : "description"}
              </span>
              <span>{downloading ? "Synthesizing & Generating..." : "Generate Report"}</span>
            </button>
          </div>
        </div>

        {/* Right Card: Graphic Illustration */}
        <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", borderRadius: "16px", padding: "32px", border: "1px solid #bfdbfe", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", boxShadow: "0 8px 24px rgba(37,99,235,0.3)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "40px" }}>analytics</span>
          </div>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "20px", fontWeight: "800", color: "#0b192e", maxWidth: "260px" }}>
            Get detailed insights with custom reports
          </h3>
          <p style={{ margin: 0, fontSize: "13px", color: "#1e40af", maxWidth: "240px", lineHeight: "1.5" }}>
            Automate publication-ready deliverables formatted for leadership presentations, audits, and performance reviews.
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ON-SCREEN GENERATED REPORT PREVIEW & DOSSIER                   */}
      {/* ============================================================== */}
      {generatedReport && (
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "28px",
          border: "2px solid #3b82f6",
          boxShadow: "0 6px 20px rgba(37,99,235,0.08)",
          marginBottom: "32px"
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="material-symbols-outlined" style={{ color: "#16a34a", fontSize: "24px" }}>verified</span>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0b192e" }}>
                  {generatedReport.title}
                </h3>
                <span style={{ background: "#eff6ff", color: "#1e40af", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                  {generatedReport.format} Dossier
                </span>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                Generated on {generatedReport.date} • Period: {generatedReport.dateRange} • Active Workforce Dataset
              </p>
            </div>

            {/* Quick Export Actions */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-secondary text-xs"
                onClick={() => handleDownload(generatedReport.type, "pdf")}
                disabled={downloading !== null}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: "#ef4444" }}>picture_as_pdf</span>
                <span>Download PDF</span>
              </button>
              <button
                className="btn-secondary text-xs"
                onClick={() => handleDownload(generatedReport.type, "excel")}
                disabled={downloading !== null}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: "#10b981" }}>table_view</span>
                <span>Download Excel</span>
              </button>
              <button
                className="btn-secondary text-xs"
                onClick={() => handleDownload(generatedReport.type, "html")}
                disabled={downloading !== null}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: "#2563eb" }}>open_in_new</span>
                <span>Open HTML</span>
              </button>
            </div>
          </div>

          {/* KPI Snapshot Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "22px" }}>
            <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Workforce Headcount</span>
              <strong style={{ display: "block", fontSize: "18px", color: "#0b192e", marginTop: "4px" }}>{generatedReport.kpis.headcount.toLocaleString()}</strong>
            </div>

            <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Avg Performance</span>
              <strong style={{ display: "block", fontSize: "18px", color: "#16a34a", marginTop: "4px" }}>{generatedReport.kpis.avgPerformance}</strong>
            </div>

            <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Productivity Index</span>
              <strong style={{ display: "block", fontSize: "18px", color: "#2563eb", marginTop: "4px" }}>{generatedReport.kpis.productivity}</strong>
            </div>

            <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Flight Risk</span>
              <strong style={{ display: "block", fontSize: "18px", color: "#dc2626", marginTop: "4px" }}>{generatedReport.kpis.attritionRisk}</strong>
            </div>

            <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Promotion Pipeline</span>
              <strong style={{ display: "block", fontSize: "18px", color: "#d97706", marginTop: "4px" }}>{generatedReport.kpis.promotionReady}</strong>
            </div>
          </div>

          {/* Key Strategic Findings */}
          <div style={{ background: "#f8fafc", padding: "18px 22px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "700", color: "#0b192e" }}>
              Executive Takeaways & Strategic Recommendations:
            </h4>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
              <li><strong>Turnover Mitigation:</strong> Overtime hours and commute distances remain the leading SHAP indicators for turnover risk in Technology and Sales.</li>
              <li><strong>Upskilling ROI:</strong> Completing the recommended Python for Data Science and Cloud Architecture tracks directly addresses the 25% technical gap.</li>
              <li><strong>Succession Pipeline:</strong> 42 top performers are promotion-ready with high performance and satisfaction scores.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Catalog of Standard Reports */}
      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)" }}>
        <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: "700", color: "#0b192e" }}>
          Standard Analytical Reports Catalog
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {REPORT_TYPES.map((rep) => (
            <div
              key={rep.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                background: "#f8fafc",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                flexWrap: "wrap",
                gap: "16px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "18px", maxWidth: "580px" }}>
                <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: rep.iconBg, color: rep.iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="material-symbols-outlined">{rep.icon}</span>
                </div>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "700", color: "#0b192e" }}>{rep.title}</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>{rep.desc}</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  className="btn-secondary text-xs"
                  style={{ padding: "7px 12px" }}
                  disabled={downloading === `${rep.id}-pdf`}
                  onClick={() => handleDownload(rep.id, "pdf")}
                  title="Download PDF"
                >
                  <span className="material-symbols-outlined text-sm" style={{ color: "#ef4444" }}>picture_as_pdf</span>
                  <span>PDF</span>
                </button>
                <button
                  className="btn-secondary text-xs"
                  style={{ padding: "7px 12px" }}
                  disabled={downloading === `${rep.id}-excel`}
                  onClick={() => handleDownload(rep.id, "excel")}
                  title="Download Excel Workbook"
                >
                  <span className="material-symbols-outlined text-sm" style={{ color: "#10b981" }}>table_view</span>
                  <span>Excel</span>
                </button>
                <button
                  className="btn-secondary text-xs"
                  style={{ padding: "7px 12px" }}
                  disabled={downloading === `${rep.id}-html`}
                  onClick={() => handleDownload(rep.id, "html")}
                  title="Open HTML Presentation"
                >
                  <span className="material-symbols-outlined text-sm" style={{ color: "#2563eb" }}>open_in_new</span>
                  <span>HTML</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
