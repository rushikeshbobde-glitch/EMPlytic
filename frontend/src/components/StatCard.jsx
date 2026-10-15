import "./StatCard.css";

export default function StatCard({
  title,
  value,
  subtitle,
  trend, // "up", "down", "neutral", "warning"
  trendValue,
  icon,
  iconBg = "#eff6ff",
  iconColor = "#1e40af",
  onClick,
}) {
  return (
    <div className={`emplytic-stat-card ${onClick ? "clickable" : ""}`} onClick={onClick}>
      <div className="stat-card-header">
        <span className="stat-title">{title}</span>
        {icon && (
          <div className="stat-icon-wrapper" style={{ backgroundColor: iconBg, color: iconColor }}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
        )}
      </div>

      <div className="stat-card-body">
        <div className="stat-value">{value !== undefined && value !== null ? value : "—"}</div>
        
        {(trendValue || subtitle) && (
          <div className="stat-meta">
            {trendValue && (
              <span className={`trend-pill ${trend || "neutral"}`}>
                {trend === "up" && <span className="material-symbols-outlined trend-icon">trending_up</span>}
                {trend === "down" && <span className="material-symbols-outlined trend-icon">trending_down</span>}
                {trendValue}
              </span>
            )}
            {subtitle && <span className="stat-subtitle">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
