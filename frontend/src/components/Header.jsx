import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDataset } from "../context/DatasetContext";
import "./Header.css";

export default function Header({ title, subtitle, onMenuToggle }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { datasets, selectedDatasetId, selectedDataset, selectDataset } = useDataset();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isEmployee = (user?.role || "").toUpperCase() === "EMPLOYEE";

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="emplytic-header">
      <div className="header-left">
        <button className="menu-toggle-btn md:hidden" onClick={onMenuToggle} aria-label="Toggle Menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="header-titles">
          <h1 className="header-main-title">{title || (isEmployee ? "Employee Portal" : "Workforce Intelligence")}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>

        {/* Global Search Bar as shown in reference design */}
        {!isEmployee && (
          <div className="header-search-bar hidden lg:flex">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Search employees, departments..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.value.trim()) {
                  navigate(`/employees?search=${encodeURIComponent(e.target.value.trim())}`);
                }
              }}
            />
          </div>
        )}
      </div>


      <div className="header-right">
        {isEmployee ? (
          <div className="dataset-status-chip loaded" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }} title="Personal employee view">
            <span className="material-symbols-outlined chip-icon" style={{ color: "#2563eb" }}>verified_user</span>
            <span className="chip-text" style={{ color: "#1e40af" }}>
              <strong>Personal Record</strong> (Isolated View)
            </span>
          </div>
        ) : (
          <div className="dataset-selector-container" ref={dropdownRef}>
            <button
              className={`dataset-selector-btn ${selectedDataset ? "has-dataset" : "no-dataset"}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title="Click to switch active dataset"
            >
              <span className="material-symbols-outlined dataset-icon">
                {selectedDataset ? "database" : "cloud_upload"}
              </span>
              <div className="dataset-btn-text">
                <span className="dataset-btn-label">ACTIVE DATASET</span>
                <span className="dataset-btn-name">
                  {selectedDataset ? (selectedDataset.filename || `Dataset #${selectedDataset.id}`) : "No Dataset Selected"}
                </span>
              </div>
              {selectedDataset && (
                <span className="dataset-rows-tag">
                  {selectedDataset.total_rows?.toLocaleString() || selectedDataset.rows || 0} rows
                </span>
              )}
              <span className="material-symbols-outlined dropdown-arrow">
                {dropdownOpen ? "expand_less" : "expand_more"}
              </span>
            </button>

            {dropdownOpen && (
              <div className="dataset-dropdown-menu">
                <div className="dropdown-menu-header">
                  <span>Switch Active Dataset</span>
                  <span className="dataset-count-badge">{datasets.length} Available</span>
                </div>

                <div className="dataset-list-scroll">
                  {datasets.length === 0 ? (
                    <div className="dropdown-empty-state">
                      <p>No datasets uploaded yet.</p>
                    </div>
                  ) : (
                    datasets.map((ds) => {
                      const isSelected = ds.id === selectedDatasetId;
                      return (
                        <div
                          key={ds.id}
                          className={`dataset-menu-item ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            selectDataset(ds.id);
                            setDropdownOpen(false);
                          }}
                        >
                          <div className="dataset-item-left">
                            <span className="material-symbols-outlined item-icon">
                              {isSelected ? "check_circle" : "description"}
                            </span>
                            <div className="item-meta">
                              <span className="item-filename">{ds.filename}</span>
                              <span className="item-sub">
                                {ds.total_rows?.toLocaleString()} rows • {ds.total_columns || ds.columns || "N/A"} cols • ID: {ds.id}
                              </span>
                            </div>
                          </div>

                          <div className="dataset-item-right">
                            {ds.quality_score && (
                              <span className={`quality-badge ${ds.quality_score >= 80 ? "good" : "warn"}`}>
                                {ds.quality_score}%
                              </span>
                            )}
                            {ds.is_cleaned && <span className="cleaned-pill">Cleaned</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="dropdown-menu-footer">
                  <button
                    className="btn-upload-new"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/data-upload");
                    }}
                  >
                    <span className="material-symbols-outlined">add_circle</span>
                    <span>Upload New Dataset</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notification Bell */}
        <button className="header-notification-btn" title="View Notifications" onClick={() => navigate(isEmployee ? "/employee/dashboard" : "/settings")}>
          <span className="material-symbols-outlined">notifications</span>
          <span className="notification-dot"></span>
        </button>

        <div className="header-user-badge" onClick={() => navigate(isEmployee ? "/employee/dashboard" : "/settings")} style={{ cursor: "pointer" }} title="View Profile">
          <div className="header-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : (isEmployee ? "E" : "A")}
          </div>
          <div className="header-user-info hidden sm:flex">
            <span className="header-name">{user?.name || (isEmployee ? "Ananya Sharma" : "Priya Sharma")}</span>
            <span className="header-role">{user?.role?.toUpperCase() || (isEmployee ? "EMPLOYEE" : "HR ADMIN")}</span>
          </div>
        </div>
      </div>
    </header>
  );

}
