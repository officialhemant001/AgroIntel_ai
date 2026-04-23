import React from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/dashboard.css";
import "../styles/pages.css";

export default function CropHealth() {
  const healthMetrics = [
    {
      icon: "📊",
      iconBg: "rgba(34, 197, 94, 0.15)",
      title: "Health Score",
      value: "78%",
      description: "Above average — crop is in good condition",
    },
    {
      icon: "🌱",
      iconBg: "rgba(6, 182, 212, 0.15)",
      title: "Growth Rate",
      value: "Moderate",
      description: "Growing at expected pace for current season",
    },
    {
      icon: "🧪",
      iconBg: "rgba(139, 92, 246, 0.15)",
      title: "Soil Condition",
      value: "Healthy",
      description: "pH 6.5 — optimal for most crops",
    },
    {
      icon: "📍",
      iconBg: "rgba(245, 158, 11, 0.15)",
      title: "Field Status",
      value: "Good Condition",
      description: "No waterlogging or drainage issues detected",
    },
  ];

  const progressBars = [
    { label: "Overall Health", value: 78, color: "#22c55e" },
    { label: "Nitrogen Level", value: 65, color: "#06b6d4" },
    { label: "Moisture Content", value: 72, color: "#8b5cf6" },
    { label: "Disease Resistance", value: 85, color: "#f59e0b" },
  ];

  return (
    <div className="page-layout">
      <Sidebar />

      <div className="page-body">
        <Navbar />

        <div className="page-inner">
          <div className="detail-page">
            {/* Header */}
            <div className="detail-header animate-fade-in">
              <h1>🌾 Crop Health Monitoring</h1>
              <p>Real-time analytics and health tracking for your crops</p>
            </div>

            {/* Health Metric Cards */}
            <div className="detail-grid stagger">
              {healthMetrics.map((item, i) => (
                <div key={i} className="detail-card">
                  <div
                    className="detail-card-icon"
                    style={{ background: item.iconBg }}
                  >
                    {item.icon}
                  </div>
                  <div className="detail-card-content">
                    <h4>{item.title}</h4>
                    <p>{item.value}</p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        marginTop: "4px",
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Bars */}
            <div className="content-card animate-fade-in-up">
              <div className="content-card-header">
                <span className="content-card-title">📈 Health Breakdown</span>
                <span className="content-card-badge">Live</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {progressBars.map((bar, i) => (
                  <div key={i} className="health-progress">
                    <div className="health-progress-header">
                      <span className="health-progress-label">{bar.label}</span>
                      <span
                        className="health-progress-value"
                        style={{ color: bar.color }}
                      >
                        {bar.value}%
                      </span>
                    </div>
                    <div className="health-progress-bar">
                      <div
                        className="health-progress-fill"
                        style={{
                          width: `${bar.value}%`,
                          background: `linear-gradient(90deg, ${bar.color}aa, ${bar.color})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="insight-card animate-fade-in-up">
              <h3>🧠 AI Recommendations</h3>
              <div className="insight-item">
                <span className="check">✓</span>
                Nitrogen levels are slightly low — consider adding NPK fertilizer
              </div>
              <div className="insight-item">
                <span className="check">✓</span>
                Moisture levels are optimal — maintain current irrigation schedule
              </div>
              <div className="insight-item">
                <span className="check">✓</span>
                Disease resistance is strong — continue with organic pest prevention
              </div>
              <div className="insight-item">
                <span className="check">✓</span>
                Next soil test recommended in 2 weeks for accurate monitoring
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}