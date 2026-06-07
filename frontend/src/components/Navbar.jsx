import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/api";
import { LanguageContext } from "../context/LanguageContext";

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { lang, switchLang } = useContext(LanguageContext);

  const safeParse = (key) => {
    try {
      const val = localStorage.getItem(key);
      return val && val !== "undefined" ? JSON.parse(val) : null;
    } catch { return null; }
  };
  const user = safeParse("user");

  const handleLogout = () => {
    setProfileOpen(false);
    logoutUser();
  };

  return (
    <div className="top-navbar">
      {/* Left */}
      <div className="navbar-left">
        <div className="navbar-breadcrumb">
          AgroIntel / <span>Dashboard</span>
        </div>
      </div>

      {/* Search */}
      <div className="navbar-search">
        <span className="navbar-search-icon">🔍</span>
        <input type="text" placeholder="Search crops, diseases..." />
      </div>

      {/* Right */}
      <div className="navbar-right">
        <button className="navbar-icon-btn" title="Notifications">
          🔔
        </button>

        <button
          className="navbar-icon-btn"
          title={lang === "en" ? "Switch to Hindi" : "Switch to English"}
          onClick={() => switchLang(lang === "en" ? "hi" : "en")}
        >
          {lang === "en" ? "🇮🇳" : "🇬🇧"}
        </button>

        {/* Profile */}
        <div style={{ position: "relative" }}>
          <div
            className="navbar-profile"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              alt="profile"
              className="navbar-profile-avatar"
            />
            <div className="navbar-profile-info">
              <span className="navbar-profile-name">{user?.name || "Guest"}</span>
              <span className="navbar-profile-role">Farmer</span>
            </div>
          </div>

          {/* Dropdown */}
          {profileOpen && (
            <>
              <div
                className="dropdown-overlay"
                onClick={() => setProfileOpen(false)}
              />
              <div className="dropdown-menu">
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/settings");
                  }}
                >
                  👤 Profile
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/settings");
                  }}
                >
                  ⚙️ Settings
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/report");
                  }}
                >
                  📊 Reports
                </div>
                <div className="dropdown-item danger" onClick={handleLogout}>
                  🚪 Logout
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}