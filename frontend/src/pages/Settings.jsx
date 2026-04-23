import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { LanguageContext } from "../context/LanguageContext";
import "../styles/dashboard.css";
import "../styles/pages.css";

export default function Settings() {
  const navigate = useNavigate();
  const { lang, switchLang } = useContext(LanguageContext);

  const storedUser = JSON.parse(localStorage.getItem("user") || "null");

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState(lang);
  const [saved, setSaved] = useState(false);

  // Load saved settings
  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem("settings"));
    if (settings) {
      setDarkMode(settings.darkMode || false);
      setNotifications(settings.notifications ?? true);
    }
  }, []);

  // Save settings
  const saveSettings = () => {
    const settings = { language, darkMode, notifications };
    localStorage.setItem("settings", JSON.stringify(settings));
    switchLang(language);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="page-layout">
      <Sidebar />

      <div className="page-body">
        <Navbar />

        <div className="page-inner">
          {/* Header */}
          <div className="detail-header animate-fade-in">
            <h1>⚙️ Settings</h1>
            <p>Manage your account preferences and application settings</p>
          </div>

          {/* Profile Card */}
          <div className="profile-card animate-fade-in-up">
            <img
              src={
                storedUser?.image ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              }
              alt="profile"
              className="profile-avatar-large"
            />
            <h3>{storedUser?.name || "Guest User"}</h3>
            <p>
              {storedUser
                ? `${storedUser.email} — Welcome back to AgroIntel 🌱`
                : "Please login to access all AI features"}
            </p>
            {!storedUser && (
              <button
                className="detail-action-btn"
                style={{ marginTop: "16px" }}
                onClick={() => navigate("/")}
              >
                🔐 Login Now
              </button>
            )}
          </div>

          {/* Settings Grid */}
          <div className="settings-grid stagger">
            {/* Language */}
            <div className="settings-section">
              <h3>🌍 Language</h3>
              <div className="settings-option">
                <div className="settings-option-text">
                  <h4>Display Language</h4>
                  <p>Choose your preferred language</p>
                </div>
                <select
                  className="settings-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  id="settings-language"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            </div>

            {/* Theme */}
            <div className="settings-section">
              <h3>🎨 Appearance</h3>
              <div className="settings-option">
                <div className="settings-option-text">
                  <h4>Dark Mode</h4>
                  <p>Use dark theme for the interface</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={() => setDarkMode(!darkMode)}
                    id="settings-dark-mode"
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            {/* Notifications */}
            <div className="settings-section">
              <h3>🔔 Notifications</h3>
              <div className="settings-option">
                <div className="settings-option-text">
                  <h4>Push Notifications</h4>
                  <p>Get alerts for scan results and tips</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={() => setNotifications(!notifications)}
                    id="settings-notifications"
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            {/* Account */}
            <div className="settings-section">
              <h3>👤 Account</h3>
              <div className="settings-option">
                <div className="settings-option-text">
                  <h4>Sign Out</h4>
                  <p>Logout from your account</p>
                </div>
                <button
                  className="detail-action-btn"
                  style={{
                    background: "rgba(244, 63, 94, 0.12)",
                    color: "var(--accent-rose)",
                    padding: "8px 16px",
                    fontSize: "13px",
                  }}
                  onClick={handleLogout}
                  id="settings-logout"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ marginTop: "28px" }}>
            <button
              className="detail-action-btn"
              onClick={saveSettings}
              id="settings-save"
            >
              {saved ? "✅ Saved Successfully!" : "💾 Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}