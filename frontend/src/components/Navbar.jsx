import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("user");
    setProfileOpen(false);
    navigate("/");
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
          <span className="badge">3</span>
        </button>

        <button className="navbar-icon-btn" title="Language">
          🌐
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