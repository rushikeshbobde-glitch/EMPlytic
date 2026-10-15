import "./Loading.css";

export default function Loading({ message = "Loading analytics...", overlay = false }) {
  if (overlay) {
    return (
      <div className="loading-overlay-screen">
        <div className="loading-content-box">
          <div className="pulsing-spinner"></div>
          <p className="loading-text">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-block">
      <div className="pulsing-spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line line-title"></div>
      <div className="skeleton-line line-value"></div>
      <div className="skeleton-line line-subtitle"></div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="skeleton-chart-box">
      <div className="skeleton-header-line"></div>
      <div className="skeleton-chart-bars">
        <div className="skeleton-bar h-40"></div>
        <div className="skeleton-bar h-60"></div>
        <div className="skeleton-bar h-80"></div>
        <div className="skeleton-bar h-100"></div>
        <div className="skeleton-bar h-50"></div>
        <div className="skeleton-bar h-70"></div>
      </div>
    </div>
  );
}
