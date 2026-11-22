import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useDataset } from "../context/DatasetContext";
import "./DataUpload.css";

export default function DataUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { selectDataset, refreshDatasets } = useDataset();

  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [cleaningResult, setCleaningResult] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (selectedFile) => {
    const validExtensions = [".csv", ".xlsx", ".xls"];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setError("Please select a supported file format (.csv, .xlsx, .xls).");
      return;
    }
    setError("");
    setFile(selectedFile);
    setUploadResult(null);
    setCleaningResult(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please choose or drag a dataset file first.");
      return;
    }

    setError("");
    setUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadProgress(50);
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");

      const response = await fetch(`${apiUrl}/api/eda/analyze`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      setUploadProgress(85);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Failed to analyze dataset.");
      }

      setUploadProgress(100);
      setUploadResult(data);

      // Cache metadata for header & app
      localStorage.setItem("emplytic_dataset_meta", JSON.stringify({
        id: data.dataset_id,
        filename: file.name,
        rows: data.dataset.rows,
        columns: data.dataset.columns,
        quality_score: data.data_quality.quality_score,
      }));
      localStorage.setItem("emplytic_eda_cache", JSON.stringify(data));

      selectDataset(data.dataset_id);
      refreshDatasets();

    } catch (err) {
      setError(err.message || "Network error connecting to backend.");
    } finally {
      setUploading(false);
    }
  };

  const handleClean = async () => {
    if (!uploadResult?.dataset_id) return;
    setCleaning(true);
    setError("");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");

      const response = await fetch(`${apiUrl}/api/eda/clean?dataset_id=${uploadResult.dataset_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to clean dataset.");
      }

      setCleaningResult(data);

      // Update cached info
      if (data.updated_dataset) {
        localStorage.setItem("emplytic_dataset_meta", JSON.stringify({
          id: data.updated_dataset.dataset_id,
          filename: file?.name || "Dataset",
          rows: data.updated_dataset.dataset.rows,
          columns: data.updated_dataset.dataset.columns,
          quality_score: data.updated_dataset.data_quality.quality_score,
        }));
        localStorage.setItem("emplytic_eda_cache", JSON.stringify(data.updated_dataset));
        selectDataset(data.updated_dataset.dataset_id);
      }
      refreshDatasets();
    } catch (err) {
      setError(err.message || "Error running automated cleaning.");
    } finally {
      setCleaning(false);
    }
  };

  return (
    <AppLayout
      title="Data Upload & Processing Pipeline"
      subtitle="Upload any employee dataset in CSV or Excel format to begin automatic inspection and ML modeling."
    >
      <div className="upload-page-grid">
        {/* Upload Card */}
        <div className="upload-card-main">
          <div className="upload-header-row">
            <div>
              <h3>Upload Employee Dataset</h3>
              <p>Supported file formats: CSV, XLSX, XLS (Max recommended 50MB)</p>
            </div>
            {file && (
              <button
                className="btn-secondary text-sm"
                onClick={() => { setFile(null); setUploadResult(null); setCleaningResult(null); }}
              >
                Clear File
              </button>
            )}
          </div>

          {/* Dropzone */}
          <div
            className={`dropzone-box ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files[0] && handleFileSelected(e.target.files[0])}
              accept=".csv,.xlsx,.xls"
              style={{ display: "none" }}
            />

            {!file ? (
              <div className="dropzone-empty-content">
                <div className="dropzone-icon-circle">
                  <span className="material-symbols-outlined">cloud_upload</span>
                </div>
                <h4>Drag & drop your file here</h4>
                <p>or <span style={{ color: "#2563eb", fontWeight: "600" }}>click to browse</span></p>
                <span className="dropzone-format-subtext">Supports: CSV, XLSX (Max size: 50MB)</span>
              </div>
            ) : (
              <div className="dropzone-file-preview">
                <div className="file-icon-box">
                  <span className="material-symbols-outlined">table_chart</span>
                </div>
                <div className="file-meta-box">
                  <div className="file-name">{file.name}</div>
                  <div className="file-subtext">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Modified: {new Date(file.lastModified).toLocaleDateString()}
                  </div>
                </div>
                <span className="ready-badge">Ready to inspect</span>
              </div>
            )}
          </div>

          {uploading && (
            <div className="progress-container">
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <span className="progress-status-text">Parsing dataset schema and calculating quality metrics...</span>
            </div>
          )}

          {error && (
            <div className="upload-alert error">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="upload-action-buttons">
            <button
              className="btn-primary"
              onClick={handleAnalyze}
              disabled={!file || uploading}
            >
              <span className="material-symbols-outlined">analytics</span>
              <span>{uploading ? "Analyzing..." : "Inspect & Validate Dataset"}</span>
            </button>

            {uploadResult && (
              <button
                className="btn-ai"
                onClick={handleClean}
                disabled={cleaning}
              >
                <span className="material-symbols-outlined">auto_fix_high</span>
                <span>{cleaning ? "Cleaning Pipeline Running..." : "Auto-Clean Dataset"}</span>
              </button>
            )}
          </div>

          {/* Recent Uploads Table (Screen 6) */}
          <div className="recent-uploads-section">
            <div className="recent-uploads-header">
              <h4>Recent Uploads</h4>
              <span className="recent-uploads-count">3 files logged</span>
            </div>
            <div className="recent-uploads-table-wrapper">
              <table className="recent-uploads-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Uploaded On</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="table-file-cell">
                        <span className="material-symbols-outlined file-cell-icon text-blue">description</span>
                        <span className="font-semibold text-navy">employees_data_2024.csv</span>
                      </div>
                    </td>
                    <td>15 mins ago</td>
                    <td>
                      <span className="upload-status-pill completed">
                        <span className="material-symbols-outlined icon-tiny">check_circle</span>
                        Completed
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="table-actions-group">
                        <button className="table-icon-btn" title="View EDA" onClick={() => navigate("/eda")}>
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <button className="table-icon-btn" title="Inspect Quality" onClick={() => navigate("/data-validation")}>
                          <span className="material-symbols-outlined">refresh</span>
                        </button>
                        <button className="table-icon-btn" title="Download Reports" onClick={() => navigate("/reports")}>
                          <span className="material-symbols-outlined">download</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="table-file-cell">
                        <span className="material-symbols-outlined file-cell-icon text-cyan">table_view</span>
                        <span className="font-semibold text-navy">hr_analytics_q3.xlsx</span>
                      </div>
                    </td>
                    <td>2 hours ago</td>
                    <td>
                      <span className="upload-status-pill validated">
                        <span className="material-symbols-outlined icon-tiny">verified</span>
                        Validated
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="table-actions-group">
                        <button className="table-icon-btn" title="View EDA" onClick={() => navigate("/eda")}>
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <button className="table-icon-btn" title="Inspect Quality" onClick={() => navigate("/data-validation")}>
                          <span className="material-symbols-outlined">refresh</span>
                        </button>
                        <button className="table-icon-btn" title="Download Reports" onClick={() => navigate("/reports")}>
                          <span className="material-symbols-outlined">download</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="table-file-cell">
                        <span className="material-symbols-outlined file-cell-icon text-amber">article</span>
                        <span className="font-semibold text-navy">sample_data.csv</span>
                      </div>
                    </td>
                    <td>Yesterday</td>
                    <td>
                      <span className="upload-status-pill failed">
                        <span className="material-symbols-outlined icon-tiny">error</span>
                        Failed
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="table-actions-group">
                        <button className="table-icon-btn" title="Retry Upload" onClick={() => fileInputRef.current.click()}>
                          <span className="material-symbols-outlined">refresh</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Upload / Inspection Results Panel */}
        {uploadResult && (
          <div className="inspection-results-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <h3>Initial Inspection Summary</h3>
                <span className="quality-score-pill">
                  Quality Score: {uploadResult.data_quality.quality_score}%
                </span>
              </div>
            </div>

            <div className="inspection-kpi-grid">
              <div className="inspect-kpi">
                <span className="kpi-label">TOTAL ROWS</span>
                <span className="kpi-val">{uploadResult.dataset.rows.toLocaleString()}</span>
              </div>
              <div className="inspect-kpi">
                <span className="kpi-label">TOTAL COLUMNS</span>
                <span className="kpi-val">{uploadResult.dataset.columns}</span>
              </div>
              <div className="inspect-kpi">
                <span className="kpi-label">MISSING CELLS</span>
                <span className={`kpi-val ${uploadResult.data_quality.missing_values > 0 ? "text-amber" : "text-green"}`}>
                  {uploadResult.data_quality.missing_values} ({uploadResult.data_quality.missing_percentage}%)
                </span>
              </div>
              <div className="inspect-kpi">
                <span className="kpi-label">DUPLICATE ROWS</span>
                <span className={`kpi-val ${uploadResult.data_quality.duplicate_records > 0 ? "text-red" : "text-green"}`}>
                  {uploadResult.data_quality.duplicate_records}
                </span>
              </div>
            </div>

            {/* Cleaning Audit Report */}
            {cleaningResult && (
              <div className="cleaning-summary-box">
                <div className="cleaning-summary-header">
                  <span className="material-symbols-outlined text-green">verified</span>
                  <h4>Automated Cleaning Pipeline Completed</h4>
                </div>
                <div className="cleaning-diff-grid">
                  <div className="diff-item">
                    <span>Rows Before / After:</span>
                    <strong>{cleaningResult.cleaning_summary.rows_before} → {cleaningResult.cleaning_summary.rows_after}</strong>
                  </div>
                  <div className="diff-item">
                    <span>Duplicates Removed:</span>
                    <strong>{cleaningResult.cleaning_summary.duplicates_removed}</strong>
                  </div>
                  <div className="diff-item">
                    <span>Missing Cells Before / After:</span>
                    <strong>{cleaningResult.cleaning_summary.missing_values_before} → {cleaningResult.cleaning_summary.missing_values_after}</strong>
                  </div>
                  <div className="diff-item">
                    <span>Quality Improvement:</span>
                    <strong className="text-green">
                      {uploadResult.data_quality.quality_score}% → {cleaningResult.updated_dataset.data_quality.quality_score}%
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps CTA */}
            <div className="next-steps-row">
              <button
                className="btn-primary"
                onClick={() => navigate("/data-validation")}
              >
                <span>View Full Validation Report</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate("/eda")}
              >
                <span>Interactive EDA</span>
                <span className="material-symbols-outlined">insights</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
