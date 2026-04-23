import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { translations } = useContext(LanguageContext);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const mainLinks = [
    { path: "/dashboard", icon: "📊", label: translations.dashboard || "Dashboard" },
    { path: "/scan", icon: "📸", label: translations.scan || "Scan Crop" },
    { path: "/report", icon: "📋", label: translations.report || "Reports" },
  ];

  const analysisLinks = [
    { path: "/health", icon: "🌾", label: translations.health || "Crop Health" },
    { path: "/treatment", icon: "💊", label: translations.treatment || "Treatment" },
    { path: "/pest", icon: "🐛", label: "Pest Detection" },
  ];

  const aiLinks = [
    { path: "/chat", icon: "🤖", label: "AI Chat" },
  ];

  const systemLinks = [
    { path: "/settings", icon: "⚙️", label: "Settings" },
  ];

  const renderLinks = (links) =>
    links.map((link) => (
      <div
        key={link.path}
        className={`sidebar-link ${location.pathname === link.path ? "active" : ""}`}
        onClick={() => navigate(link.path)}
      >
        <span className="sidebar-link-icon">{link.icon}</span>
        <span>{link.label}</span>
        {link.badge && <span className="sidebar-link-badge">{link.badge}</span>}
      </div>
    ));

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">🌱</div>
        <div className="sidebar-brand">
          <span className="sidebar-brand-name">AgroIntel</span>
          <span className="sidebar-brand-sub">AI Agriculture</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Main Menu</div>
        {renderLinks(mainLinks)}

        <div className="sidebar-section-title">Analysis</div>
        {renderLinks(analysisLinks)}

        <div className="sidebar-section-title">AI Assistant</div>
        {renderLinks(aiLinks)}

        <div className="sidebar-section-title">System</div>
        {renderLinks(systemLinks)}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={() => navigate("/settings")}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt="user"
            className="sidebar-user-avatar"
          />
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || "Guest User"}</div>
            <div className="sidebar-user-email">{user?.email || "guest@agrointel.ai"}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}