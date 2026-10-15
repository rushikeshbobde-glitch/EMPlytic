import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const hrNavItems = [
  { name: "Overview", icon: "dashboard", path: "/hr/dashboard" },
  { name: "Employees", icon: "groups", path: "/employees" },
  { name: "Data Upload", icon: "upload_file", path: "/data-upload" },
  { name: "Data Validation", icon: "fact_check", path: "/data-validation" },
  { name: "EDA Report", icon: "insights", path: "/eda" },
  { name: "AI Dashboard", icon: "hub", path: "/ai-dashboard" },
  { name: "Performance", icon: "speed", path: "/performance" },
  { name: "Productivity", icon: "monitoring", path: "/productivity" },
  { name: "Attrition Risk", icon: "trending_down", path: "/attrition" },
  { name: "Promotion Readiness", icon: "military_tech", path: "/promotion" },
  { name: "Skill Gaps", icon: "psychology", path: "/skills" },
  { name: "Training", icon: "school", path: "/training" },
  { name: "AI Insights", icon: "auto_awesome", path: "/ai-insights" },
  { name: "Reports Center", icon: "assessment", path: "/reports" },
  { name: "Settings", icon: "settings", path: "/settings" },
];

const employeeNavItems = [
  { name: "My Dashboard", icon: "dashboard", path: "/employee/dashboard" },
  { name: "My Performance", icon: "speed", path: "/employee/performance" },
  { name: "My Skills & Growth", icon: "psychology", path: "/employee/skills" },
  { name: "Recommended Training", icon: "school", path: "/employee/training" },
  { name: "Career Reports", icon: "assessment", path: "/employee/reports" },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isEmployee = (user?.role || "").toUpperCase() === "EMPLOYEE";
  const navItems = isEmployee ? employeeNavItems : hrNavItems;
  const sectionLabel = isEmployee ? "EMPLOYEE SELF-SERVICE" : "CORE WORKSPACE";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay md:hidden" onClick={onClose}></div>}
      <aside className={`emplytic-sidebar ${isOpen ? "open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              analytics
            </span>
          </div>
          <div className="brand-text-block">
            <span className="brand-title">EMPlytic</span>
            <span className="brand-subtitle">
              {isEmployee ? "Employee Portal" : "AI Workforce Intelligence"}
            </span>
          </div>
          <button className="sidebar-close-btn md:hidden" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">{sectionLabel}</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose && onClose()}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="material-symbols-outlined nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer with User Info and Logout */}
        <div className="sidebar-footer">
          <div className="user-profile-summary">
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : (isEmployee ? "E" : "A")}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name || (isEmployee ? "Employee" : "Admin User")}</div>
              <div className="user-role-badge">
                {user?.role?.toUpperCase() || (isEmployee ? "EMPLOYEE" : "HR ADMIN")}
              </div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign Out">
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
