import React from "react";

export default function RadialRing({ value, max = 100, size = 40, stroke = 5, color = "#E8A33D" }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(value / max, 1));
  const offset = circumference * (1 - pct);

  return (
    <div className="ring-wrap">
      <svg className="ring-svg" width={size} height={size}>
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="ring-label">{Math.round(value)}</span>
    </div>
  );
}