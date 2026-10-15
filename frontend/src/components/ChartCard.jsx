import "./ChartCard.css";

export default function ChartCard({
  title,
  subtitle,
  action,
  children,
  loading = false,
  emptyMessage,
  minHeight = 300,
}) {
  return (
    <div className="emplytic-chart-card">
      <div className="chart-card-header">
        <div className="chart-titles">
          <h3 className="chart-card-title">{title}</h3>
          {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="chart-card-action">{action}</div>}
      </div>

      <div className="chart-card-content" style={{ minHeight: `${minHeight}px` }}>
        {loading ? (
          <div className="chart-loading-state">
            <div className="loading-spinner"></div>
            <p>Rendering analytics...</p>
          </div>
        ) : emptyMessage ? (
          <div className="chart-empty-state">
            <span className="material-symbols-outlined empty-icon">query_stats</span>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
