import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { getCropRecommendations } from "../services/api";
import "../styles/dashboard.css";
import "../styles/pages.css";

export default function CropRecommend() {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadStates() {
      try {
        const data = await getCropRecommendations();
        if (data.success && data.data?.states) {
          setStates(data.data.states);
        }
      } catch (err) {
        setStates(["Bihar","Gujarat","Karnataka","Madhya Pradesh","Maharashtra","Punjab","Rajasthan","Tamil Nadu","Uttar Pradesh","West Bengal"]);
      }
    }
    loadStates();
  }, []);

  const handleRecommend = async () => {
    if (!selectedState) return;
    setLoading(true);
    try {
      const data = await getCropRecommendations(selectedState, selectedSeason);
      if (data.success) setResult(data.data);
    } catch (err) {
      console.error("Recommendation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const seasonIcons = { Kharif: "🌧️", Rabi: "❄️", Zaid: "☀️" };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-body">
        <Navbar />
        <div className="page-inner">
          <div className="detail-page">
            <div className="detail-header animate-fade-in">
              <h1>🌱 Crop Recommendation</h1>
              <p>AI-powered crop suggestions based on your region, season, and soil type</p>
            </div>

            {/* Selection Form */}
            <div className="content-card animate-fade-in-up">
              <div className="content-card-header">
                <span className="content-card-title">📍 Select Your Region</span>
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>State</label>
                  <select
                    value={selectedState}
                    onChange={(e) => { setSelectedState(e.target.value); setResult(null); }}
                    className="settings-select"
                    style={{ width: "100%", padding: 12 }}
                    id="crop-state-select"
                  >
                    <option value="">Select a state...</option>
                    {states.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Season (Optional)</label>
                  <select
                    value={selectedSeason}
                    onChange={(e) => { setSelectedSeason(e.target.value); setResult(null); }}
                    className="settings-select"
                    style={{ width: "100%", padding: 12 }}
                    id="crop-season-select"
                  >
                    <option value="">Current Season</option>
                    <option value="Kharif">🌧️ Kharif (Jun-Oct)</option>
                    <option value="Rabi">❄️ Rabi (Oct-Mar)</option>
                    <option value="Zaid">☀️ Zaid (Mar-Jun)</option>
                  </select>
                </div>
                <button className="detail-action-btn" onClick={handleRecommend} disabled={!selectedState || loading} style={{ minHeight: 44 }}>
                  {loading ? "⏳ Loading..." : "🌾 Get Recommendations"}
                </button>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="animate-fade-in-up" style={{ marginTop: 20 }}>
                <div className="content-card">
                  <div className="content-card-header">
                    <span className="content-card-title">
                      {seasonIcons[result.season] || "🌾"} Recommended Crops for {result.state} — {result.season} Season
                    </span>
                    <span className="content-card-badge">{result.total_options} Crops</span>
                  </div>
                  <div className="detail-grid stagger">
                    {(result.crops || []).map((crop, i) => (
                      <div key={i} className="detail-card">
                        <div className="detail-card-icon" style={{ background: "rgba(34,197,94,0.15)", fontSize: 24 }}>
                          {["🌾","🌽","🍚","🥔","🌻","🧅","🥒","🍅","🫘","🥜"][i % 10]}
                        </div>
                        <div className="detail-card-content">
                          <h4>{crop}</h4>
                          <p>Suitable for {result.state} in {result.season} season</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {result.soil_types?.length > 0 && (
                  <div className="insight-card" style={{ marginTop: 16 }}>
                    <h3>🏔️ Common Soil Types in {result.state}</h3>
                    {result.soil_types.map((s, i) => (
                      <div key={i} className="insight-item"><span className="check">✓</span>{s} Soil</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
