import React, { useState, useEffect } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { getPests, getMedicines } from "../services/api";
import "../styles/dashboard.css";
import "../styles/pages.css";

export default function PestDetection() {
  const [pests, setPests] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCrop, setSearchCrop] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(crop = "") {
    setLoading(true);
    try {
      const pestRes = await getPests(crop);
      if (pestRes.success && pestRes.data?.data) {
        setPests(pestRes.data.data);
      }
    } catch (err) { console.warn("Pest fetch failed:", err); }

    try {
      const medRes = await getMedicines("pesticide");
      if (medRes.success && medRes.data?.data) {
        setMedicines(medRes.data.data.slice(0, 5));
      }
    } catch (err) { console.warn("Medicine fetch failed:", err); }

    setLoading(false);
  }

  const handleSearch = (e) => {
    e.preventDefault();
    loadData(searchCrop);
  };

  const damageColors = { high: "danger", medium: "warning", low: "healthy" };

  return (
    <div className="page-layout">
      <Sidebar />

      <div className="page-body">
        <Navbar />

        <div className="page-inner">
          <div className="detail-page">
            {/* Header */}
            <div className="detail-header animate-fade-in">
              <h1>🐛 Pest Detection</h1>
              <p>AI-powered pest identification from the AgroIntel database</p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} style={{
              display: "flex", gap: "10px", marginBottom: "20px", maxWidth: "400px",
            }}>
              <input
                type="text"
                value={searchCrop}
                onChange={(e) => setSearchCrop(e.target.value)}
                placeholder="Filter by crop (e.g. wheat, cotton)..."
                style={{
                  flex: 1, padding: "10px 14px", background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)", fontSize: "13px",
                }}
                id="pest-search-input"
              />
              <button type="submit" className="detail-action-btn" style={{ padding: "10px 18px" }}>
                🔍 Search
              </button>
            </form>

            {loading ? (
              <div className="scan-loading"><div className="spinner-ring" /><p>Loading pests database...</p></div>
            ) : (
              <>
                {/* Pest Cards */}
                {pests.length > 0 ? (
                  <div className="content-card animate-fade-in-up">
                    <div className="content-card-header">
                      <span className="content-card-title">🐛 Pest Database</span>
                      <span className="content-card-badge">{pests.length} Found</span>
                    </div>
                    <div className="scan-list">
                      {pests.map((pest, i) => (
                        <div key={i} className="scan-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                          <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
                            <span className="icon">🐞</span>
                            <div className="info">
                              <div className="name">{pest.name}</div>
                              <div className="date">{pest.scientific_name}</div>
                            </div>
                            <span className={`status ${damageColors[pest.damage_level] || ""}`}>
                              {pest.damage_level} risk
                            </span>
                          </div>
                          {/* Details */}
                          <div style={{ paddingLeft: "36px", fontSize: "12px", color: "var(--text-secondary)" }}>
                            <p><strong>Affected Crops:</strong> {(pest.affected_crops || []).join(", ")}</p>
                            <p style={{ marginTop: "4px" }}><strong>Control:</strong> {(pest.control_methods || []).slice(0, 2).join("; ")}</p>
                            {pest.identification_features && (
                              <p style={{ marginTop: "4px", fontStyle: "italic" }}>{pest.identification_features.substring(0, 120)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
                    <p style={{ color: "var(--text-muted)" }}>No pests found. Try a different search or seed the database.</p>
                  </div>
                )}

                {/* Pesticide Medicines */}
                {medicines.length > 0 && (
                  <div className="content-card animate-fade-in-up" style={{ marginTop: "20px" }}>
                    <div className="content-card-header">
                      <span className="content-card-title">💊 Pesticide Medicines</span>
                      <span className="content-card-badge">From Database</span>
                    </div>
                    <div className="scan-list">
                      {medicines.map((med, i) => (
                        <div key={i} className="scan-item">
                          <span className="icon">💉</span>
                          <div className="info">
                            <div className="name">{med.name}</div>
                            <div className="date">Dosage: {med.dosage} | Safety: {med.safety_period}</div>
                          </div>
                          <span className="status warning">{med.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "14px", marginTop: "24px" }}>
                  <button className="detail-action-btn" id="pest-save-report">💾 Save Pest Report</button>
                  <button className="detail-action-btn secondary" onClick={() => { setSearchCrop(""); loadData(); }}>
                    🔄 Show All Pests
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}