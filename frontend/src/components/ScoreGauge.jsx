import React from "react";
import "./ScoreGauge.css";

export default function ScoreGauge({
  score = 75,
  maxScore = 100,
  label = "Score",
  sublabel = "Good",
  status = "good", // "good", "excellent", "warning", "danger"
  size = 180,
  strokeWidth = 12,
  showPercentage = false,
  format = "ratio", // "ratio" (82 / 100) or "percent" (92%)
}) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.max(0, Math.min(score, maxScore));
  const progressRatio = normalizedScore / maxScore;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const colorMap = {
    excellent: "#10b981", // emerald
    good: "#10b981",      // emerald
    warning: "#f59e0b",   // amber
    developing: "#f59e0b",// amber
    danger: "#ef4444",    // red
    high: "#ef4444",
    medium: "#f59e0b",
    low: "#10b981",
  };

  const strokeColor = colorMap[status.toLowerCase()] || "#2563eb";

  return (
    <div className="score-gauge-container" style={{ width: size, height: size }}>
      <svg className="score-gauge-svg" width={size} height={size}>
        {/* Background track circle */}
        <circle
          className="score-gauge-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          className="score-gauge-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="score-gauge-content">
        <div className="score-gauge-number">
          {format === "percent" || showPercentage ? (
            <span>{Math.round(score)}%</span>
          ) : (
            <>
              <strong>{score}</strong>
              <span className="score-gauge-max">/{maxScore}</span>
            </>
          )}
        </div>
        {sublabel && (
          <span className={`score-gauge-badge ${status.toLowerCase()}`}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
