import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ChartBox from "../components/ChartBox";
import "../styles/dashboard.css";

import { LanguageContext } from "../context/LanguageContext";
import { getScanStats, getScanHistory, getWeather } from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const { translations } = useContext(LanguageContext);

  // State for API-loaded data
  const [stats, setStats] = useState([
    { icon: "🌿", iconClass: "green", label: "Total Scans", value: "0", trend: "+0%", trendDir: "up" },
    { icon: "🦠", iconClass: "rose", label: "Diseases Found", value: "0", trend: "0%", trendDir: "down" },
    { icon: "💊", iconClass: "amber", label: "Treatments", value: "0", trend: "+0%", trendDir: "up" },
    { icon: "🌾", iconClass: "blue", label: "Health Score", value: "0%", trend: "+0%", trendDir: "up" },
  ]);

  const [recentScans, setRecentScans] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [healthScore, setHealthScore] = useState(0);

  // Fetch data on mount
  useEffect(() => {
    async function loadDashboard() {
      // 1. Load stats
      try {
        const statsResult = await getScanStats();
        if (statsResult.success) {
          const d = statsResult.data;
          setStats([
            { icon: "🌿", iconClass: "green", label: "Total Scans", value: String(d.total_scans), trend: "+12%", trendDir: "up" },
            { icon: "🦠", iconClass: "rose", label: "Diseases Found", value: String(d.diseases_found), trend: d.diseases_found > 0 ? "-3%" : "0%", trendDir: "down" },
            { icon: "💊", iconClass: "amber", label: "Treatments", value: String(d.treatments_given), trend: "+8%", trendDir: "up" },
            { icon: "🌾", iconClass: "blue", label: "Health Score", value: d.health_score, trend: "+5%", trendDir: "up" },
          ]);
          setHealthScore(parseInt(d.health_score) || 0);
        }
      } catch (err) {
        console.warn("Stats load failed:", err);
      }

      // 2. Load recent scans
      try {
        const histResult = await getScanHistory(5);
        if (histResult.success && histResult.data?.scans) {
          const scans = histResult.data.scans.map((scan) => {
            const icons = { "Healthy": "🌿", "Leaf Blight": "🍂", "Rust": "🌾", "Aphid": "🐛" };
            const matchedIcon = Object.entries(icons).find(([k]) =>
              scan.disease?.toLowerCase().includes(k.toLowerCase())
            );
            return {
              icon: matchedIcon ? matchedIcon[1] : "🌱",
              name: scan.disease || "Unknown",
              date: formatTimeAgo(scan.created_at),
              status: scan.severity === "none" || scan.disease === "Healthy" ? "Healthy" : scan.disease,
              statusClass: scan.severity === "high" ? "danger" : scan.severity === "medium" ? "warning" : "healthy",
            };
          });
          setRecentScans(scans);
        }
      } catch (err) {
        console.warn("History load failed:", err);
      }

      // 3. Load weather
      try {
        const weatherResult = await getWeather("Lucknow");
        if (weatherResult.success) {
          setWeatherData(weatherResult.data);
        }
      } catch (err) {
        console.warn("Weather load failed:", err);
      }
    }

    loadDashboard();
  }, []);

  const quickActions = [
    {
      icon: "📸",
      iconBg: "rgba(34, 197, 94, 0.15)",
      title: translations.scan || "Scan Crop",
      desc: "AI-powered leaf analysis",
      path: "/scan",
    },
    {
      icon: "📊",
      iconBg: "rgba(6, 182, 212, 0.15)",
      title: translations.report || "Reports",
      desc: "View analysis history",
      path: "/report",
    },
    {
      icon: "🌾",
      iconBg: "rgba(245, 158, 11, 0.15)",
      title: translations.health || "Crop Health",
      desc: "Monitor field status",
      path: "/health",
    },
    {
      icon: "🤖",
      iconBg: "rgba(139, 92, 246, 0.15)",
      title: "AI Chat",
      desc: "Ask farming questions",
      path: "/chat",
    },
  ];

  // Fallback scans if none loaded
  const displayScans = recentScans.length > 0
    ? recentScans
    : [
        { icon: "🌱", name: "No scans yet", date: "Upload your first image", status: "New", statusClass: "healthy" },
      ];

  // Weather display
  const weather = weatherData || {
    temperature: 32,
    humidity: 45,
    rain_chance: 10,
    city: "Lucknow",
  };

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-content">
        <Navbar />

        <div className="main-content">
          {/* Page Header */}
          <div className="page-header animate-fade-in">
            <h1>Dashboard</h1>
            <p>{translations.welcome || "AI-Based Smart Agriculture System"}</p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid stagger">
            {stats.map((stat, i) => (
              <div key={i} className="stat-card">
                <div className="stat-card-header">
                  <div className={`stat-card-icon ${stat.iconClass}`}>{stat.icon}</div>
                  <span className={`stat-card-trend ${stat.trendDir}`}>{stat.trend}</span>
                </div>
                <div className="stat-card-value">{stat.value}</div>
                <div className="stat-card-label">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="action-grid stagger">
            {quickActions.map((action, i) => (
              <div
                key={i}
                className="action-card"
                onClick={() => navigate(action.path)}
              >
                <div
                  className="action-card-icon"
                  style={{ background: action.iconBg }}
                >
                  {action.icon}
                </div>
                <div className="action-card-text">
                  <h4>{action.title}</h4>
                  <p>{action.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Two Column Layout */}
          <div className="three-columns">
            {/* Left: Chart + Insights */}
            <div>
              <ChartBox />

              {/* AI Insights */}
              <div className="insight-card" style={{ marginTop: "20px" }}>
                <h3>🧠 {translations.ai_insights || "AI Insights"}</h3>
                <div className="insight-item">
                  <span className="check">✓</span>
                  Soil condition is healthy — optimal for planting
                </div>
                <div className="insight-item">
                  <span className="check">✓</span>
                  Disease risk: Low — no immediate threats detected
                </div>
                <div className="insight-item">
                  <span className="check">✓</span>
                  Recommendation: Apply organic fertilizer this week
                </div>
              </div>
            </div>

            {/* Right: Recent Scans + Weather + Health */}
            <div>
              {/* Recent Scans */}
              <div className="content-card">
                <div className="content-card-header">
                  <span className="content-card-title">📋 Recent Scans</span>
                  <span
                    className="content-card-badge"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/report")}
                  >
                    View All
                  </span>
                </div>
                <div className="scan-list">
                  {displayScans.map((scan, i) => (
                    <div key={i} className="scan-item">
                      <span className="icon">{scan.icon}</span>
                      <div className="info">
                        <div className="name">{scan.name}</div>
                        <div className="date">{scan.date}</div>
                      </div>
                      <span className={`status ${scan.statusClass}`}>
                        {scan.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weather */}
              <div className="weather-card">
                <h3>🌤️ Weather — {weather.city}</h3>
                <div className="weather-stats">
                  <div className="weather-stat">
                    <div className="icon">☀️</div>
                    <div className="value">{weather.temperature}°C</div>
                    <div className="label">Temperature</div>
                  </div>
                  <div className="weather-stat">
                    <div className="icon">💧</div>
                    <div className="value">{weather.humidity}%</div>
                    <div className="label">Humidity</div>
                  </div>
                  <div className="weather-stat">
                    <div className="icon">🌧️</div>
                    <div className="value">{weather.rain_chance}%</div>
                    <div className="label">Rain Chance</div>
                  </div>
                </div>
              </div>

              {/* Health Score */}
              <div className="content-card">
                <div className="content-card-header">
                  <span className="content-card-title">🌾 Crop Health</span>
                </div>
                <div className="health-progress">
                  <div className="health-progress-header">
                    <span className="health-progress-label">Overall Score</span>
                    <span className="health-progress-value">{healthScore || 78}%</span>
                  </div>
                  <div className="health-progress-bar">
                    <div
                      className="health-progress-fill"
                      style={{ width: `${healthScore || 78}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper: Format ISO date to "X hours ago"
function formatTimeAgo(isoDate) {
  if (!isoDate) return "Just now";
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}