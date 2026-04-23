import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { getScanHistory, getFertilizers } from "../services/api";
import "../styles/dashboard.css";
import "../styles/pages.css";

export default function Treatment() {
  const location = useLocation();
  const [scanData, setScanData] = useState(null);
  const [fertilizers, setFertilizers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Try scan result from navigation state first
      if (location.state?.scanResult) {
        setScanData(location.state.scanResult);
      } else {
        try {
          const res = await getScanHistory(1);
          if (res.success && res.data?.scans?.length > 0) {
            setScanData(res.data.scans[0]);
          }
        } catch (err) { console.warn("Scan fetch failed:", err); }
      }

      // Fetch fertilizer database
      try {
        const res = await getFertilizers();
        if (res.success && res.data?.data) {
          setFertilizers(res.data.data.slice(0, 6));
        }
      } catch (err) { console.warn("Fertilizer fetch failed:", err); }

      setLoading(false);
    }
    load();
  }, [location.state]);

  const d = scanData || {};

  const treatments = [
    {
      icon: "🌱", iconBg: "rgba(34, 197, 94, 0.15)",
      title: "Organic Treatment",
      value: d.organic_treatment?.length > 0 ? d.organic_treatment.join(", ") : "Neem oil spray (2%)",
      description: d.dosage || "Follow recommended dosage for best results",
    },
    {
      icon: "🧪", iconBg: "rgba(6, 182, 212, 0.15)",
      title: "Chemical Treatment",
      value: d.chemical_treatment?.length > 0 ? d.chemical_treatment.join(", ") : "Consult local agriculture expert",
      description: d.dosage || "Apply as directed on product label",
    },
    {
      icon: "💊", iconBg: "rgba(139, 92, 246, 0.15)",
      title: "Medicines",
      value: d.medicine_list?.length > 0 ? d.medicine_list.join(", ") : "Run a scan to get medicine recommendations",
      description: "Cross-verified with AgroIntel medicine database",
    },
    {
      icon: "🛡️", iconBg: "rgba(245, 158, 11, 0.15)",
      title: "Prevention",
      value: d.prevention || "Regular crop monitoring and rotation recommended",
      description: d.watering_schedule || "Maintain proper irrigation schedule",
    },
  ];

  const dosageSchedule = [
    { week: "Week 1", action: d.organic_treatment?.[0] || "Apply initial treatment spray", status: "Active" },
    { week: "Week 2", action: d.chemical_treatment?.[0] || "Second application cycle", status: "Upcoming" },
    { week: "Week 3", action: "Monitor crop response and re-evaluate", status: "Upcoming" },
    { week: "Week 4", action: "Final assessment and recovery check", status: "Pending" },
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
              <h1>💊 Treatment & Recommendations</h1>
              <p>{d.card_title || "AI-generated treatment plan based on crop analysis"}</p>
              {d.database_verified && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  padding: "4px 12px", marginTop: "8px",
                  background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: "var(--radius-full)", fontSize: "11px", fontWeight: "600", color: "var(--primary)",
                }}>✅ Database Verified</span>
              )}
            </div>

            {loading ? (
              <div className="scan-loading"><div className="spinner-ring" /><p>Loading treatments...</p></div>
            ) : (
              <>
                {/* Treatment Cards */}
                <div className="detail-grid stagger">
                  {treatments.map((item, i) => (
                    <div key={i} className="detail-card">
                      <div className="detail-card-icon" style={{ background: item.iconBg }}>{item.icon}</div>
                      <div className="detail-card-content">
                        <h4>{item.title}</h4>
                        <p>{item.value}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dosage Schedule */}
                <div className="content-card animate-fade-in-up">
                  <div className="content-card-header">
                    <span className="content-card-title">📅 Treatment Schedule</span>
                    <span className="content-card-badge">4 Weeks</span>
                  </div>
                  <div className="scan-list">
                    {dosageSchedule.map((item, i) => (
                      <div key={i} className="scan-item">
                        <span className="icon">📌</span>
                        <div className="info">
                          <div className="name">{item.week}</div>
                          <div className="date">{item.action}</div>
                        </div>
                        <span className={`status ${item.status === "Active" ? "healthy" : item.status === "Upcoming" ? "warning" : ""}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fertilizer Database */}
                {fertilizers.length > 0 && (
                  <div className="content-card animate-fade-in-up" style={{ marginTop: "20px" }}>
                    <div className="content-card-header">
                      <span className="content-card-title">🌾 Fertilizer Database</span>
                      <span className="content-card-badge">{fertilizers.length} Available</span>
                    </div>
                    <div className="scan-list">
                      {fertilizers.map((f, i) => (
                        <div key={i} className="scan-item">
                          <span className="icon">🌱</span>
                          <div className="info">
                            <div className="name">{f.name}</div>
                            <div className="date">{f.benefits?.substring(0, 80) || f.dosage}</div>
                          </div>
                          <span className={`status ${f.type === "organic" ? "healthy" : "warning"}`}>
                            {f.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "14px", marginTop: "24px" }}>
                  <button className="detail-action-btn" id="save-treatment-report">💾 Save Report</button>
                  <button className="detail-action-btn secondary">📤 Share with Expert</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}