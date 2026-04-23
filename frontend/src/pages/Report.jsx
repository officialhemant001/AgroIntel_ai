import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ChartBox from "../components/ChartBox";
import { getScanHistory } from "../services/api";
import "../styles/dashboard.css";
import "../styles/pages.css";

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

              {/* Top Section: Image + Results */}
              <div className="report-grid animate-fade-in-up">
                {/* Image Card */}
                <div className="report-image-card">
                  {d.image_url ? (
                    <img src={d.image_url} alt="Analyzed Leaf" />
                  ) : (
                    <div style={{
                      width: "100%", height: "240px", background: "var(--bg-elevated)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px",
                    }}>🌿</div>
                  )}
                  <div className="report-image-info">
                    <h3>{d.card_title || "Analyzed Crop Image"}</h3>
                    <p>Processed by AgroIntel AI Engine</p>
                  </div>
                </div>

                {/* Result Card */}
                <div className="report-result-card">
                  <h3>🌿 Analysis Result</h3>

                  <div className="report-data-grid">
                    {d.plant_name && (
                      <div className="report-data-item">
                        <label>Plant</label>
                        <span>{d.plant_name}</span>
                      </div>
                    )}
                    <div className="report-data-item">
                      <label>Disease Detected</label>
                      <span>{d.disease}</span>
                    </div>
                    <div className="report-data-item">
                      <label>Pest Identified</label>
                      <span>{d.pest || "None"}</span>
                    </div>
                    <div className="report-data-item">
                      <label>AI Confidence</label>
                      <span style={{ color: sevColor }}>
                        {d.confidence ? `${d.confidence}%` : "N/A"}
                      </span>
                    </div>
                    <div className="report-data-item">
                      <label>Severity</label>
                      <span style={{ color: sevColor, textTransform: "capitalize" }}>
                        {d.severity || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Symptoms */}
                  {d.symptoms && d.symptoms.length > 0 && (
                    <div style={{ marginTop: "14px" }}>
                      <h4 style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px" }}>Symptoms</h4>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {d.symptoms.map((s, i) => (
                          <span key={i} style={{
                            padding: "4px 10px", background: "var(--bg-elevated)",
                            borderRadius: "var(--radius-full)", fontSize: "12px", color: "var(--text-secondary)",
                          }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Treatment Alert */}
                  <div className="report-alert">
                    <span className="alert-icon">💊</span>
                    <div className="alert-content">
                      <h4>Recommended Treatment</h4>
                      {d.organic_treatment?.length > 0 && (
                        <p><strong>Organic:</strong> {d.organic_treatment.join(", ")}</p>
                      )}
                      {d.chemical_treatment?.length > 0 && (
                        <p><strong>Chemical:</strong> {d.chemical_treatment.join(", ")}</p>
                      )}
                      {d.dosage && <p><strong>Dosage:</strong> {d.dosage}</p>}
                      {!d.organic_treatment?.length && !d.chemical_treatment?.length && d.treatment && (
                        <p>{d.treatment}</p>
                      )}
                    </div>
                  </div>

                  {/* Medicine List */}
                  {d.medicine_list?.length > 0 && (
                    <div style={{ marginTop: "12px", padding: "10px 14px", background: "rgba(6, 182, 212, 0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(6, 182, 212, 0.2)" }}>
                      <h4 style={{ fontSize: "13px", color: "var(--accent-sky)", marginBottom: "4px" }}>💉 Medicines</h4>
                      <p style={{ fontSize: "13px" }}>{d.medicine_list.join(", ")}</p>
                    </div>
                  )}

                  {/* Fertilizer Plan */}
                  {d.fertilizer_plan?.length > 0 && (
                    <div style={{ marginTop: "8px", padding: "10px 14px", background: "rgba(34, 197, 94, 0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
                      <h4 style={{ fontSize: "13px", color: "var(--primary)", marginBottom: "4px" }}>🌱 Fertilizer Plan</h4>
                      <p style={{ fontSize: "13px" }}>{d.fertilizer_plan.join(", ")}</p>
                    </div>
                  )}
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