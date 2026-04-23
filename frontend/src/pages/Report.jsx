import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ChartBox from "../components/ChartBox";
import ResultCard from "../components/ResultCard";
import { getScanHistory } from "../services/api";
import "../styles/dashboard.css";
import "../styles/pages.css";
import "../components/ResultCard.css";

export default function Report() {
  const location = useLocation();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Priority 1: Scan result passed from Scan page
    if (location.state?.scanResult) {
      setReport(location.state.scanResult);
      setLoading(false);
      return;
    }

    // Priority 2: Fetch latest scan from API
    async function fetchLatest() {
      try {
        const result = await getScanHistory(1);
        if (result.success && result.data?.scans?.length > 0) {
          setReport(result.data.scans[0]);
        }
      } catch (err) {
        console.warn("Could not fetch scan history:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLatest();
  }, [location.state]);

  // Fallback data when no scans exist
  const d = report || {
    image_url: null,
    plant_name: "",
    disease: "No scans yet",
    confidence: 0,
    pest: "N/A",
    treatment: "Upload a leaf image in the Scan section to get AI-powered analysis.",
    fertilizer: "N/A",
    severity: "none",
    symptoms: [],
    cause: "",
    organic_treatment: [],
    chemical_treatment: [],
    dosage: "",
    fertilizer_plan: [],
    medicine_list: [],
    pest_control: [],
    watering_schedule: "",
    prevention: "",
    database_verified: false,
    short_summary: "",
    card_title: "",
    severity_color: "green",
  };

  const colorMap = { green: "var(--primary)", yellow: "var(--accent-amber)", red: "var(--accent-rose)" };
  const sevColor = colorMap[d.severity_color] || "var(--primary)";

  return (
    <div className="page-layout">
      <Sidebar />

      <div className="page-body">
        <Navbar />

        <div className="page-inner">
          {/* Header */}
          <div className="detail-header animate-fade-in">
            <h1>📊 Analysis Report</h1>
            <p>{d.short_summary || "AI-powered crop health insights and recommendations"}</p>
          </div>

          {loading ? (
            <div className="scan-loading">
              <div className="spinner-ring" />
              <p>Loading report...</p>
            </div>
          ) : (
            <>
              {/* DB Verified Badge */}
              {d.database_verified && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "6px 14px", marginBottom: "16px",
                  background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: "var(--radius-full)", fontSize: "12px", fontWeight: "600",
                  color: "var(--primary)", animation: "fadeIn 0.5s ease",
                }}>
                  ✅ Database Verified
                </div>
              )}

              {/* Fallback Banner */}
              {d.status === "fallback" && (
                <div style={{
                  padding: "12px 16px", marginBottom: "16px",
                  background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--accent-amber)",
                }}>
                  ⚠️ {d.message || "AI temporarily unavailable, showing database result"}
                </div>
              )}

              <div className="report-main-layout animate-fade-in-up">
                <div className="report-card-container">
                  <ResultCard result={d} />
                </div>
                
                <div className="report-image-side">
                  <div className="report-image-card-premium glass-panel">
                    {d.image_url ? (
                      <img src={d.image_url} alt="Analyzed Leaf" />
                    ) : (
                      <div className="image-placeholder">🌿</div>
                    )}
                    <div className="image-tag">AI ANALYSIS TARGET</div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <ChartBox />

              {/* Info Cards */}
              <div className="report-info-grid">
                <div className="report-info-card">
                  <h3>🦠 Disease Info</h3>
                  <p>
                    {d.disease === "Healthy"
                      ? "Your crop appears healthy with no signs of disease. Continue maintaining good agricultural practices."
                      : d.cause
                      ? `${d.disease}: ${d.cause}`
                      : `${d.disease} is a condition that can reduce yield if untreated. Early AI detection helps prevent spread.`}
                  </p>
                </div>

                <div className="report-info-card">
                  <h3>🛡️ Prevention Tips</h3>
                  {d.prevention ? (
                    <p>{d.prevention}</p>
                  ) : (
                    <ul>
                      <li>Use disease-resistant seed varieties</li>
                      <li>Avoid overwatering and improve drainage</li>
                      <li>Apply organic pesticides regularly</li>
                      <li>Rotate crops each season</li>
                    </ul>
                  )}
                  {d.watering_schedule && (
                    <p style={{ marginTop: "8px" }}>
                      <strong>💧 Watering:</strong> {d.watering_schedule}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}