import React, { useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { analyzeSoil } from "../services/api";
import "../styles/dashboard.css";
import "../styles/pages.css";

export default function SoilAnalysis() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (image) URL.revokeObjectURL(image);
      setImage(URL.createObjectURL(file));
      setImageFile(file);
      setFileName(file.name);
      setError("");
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile) { setError("Please upload a soil image"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await analyzeSoil(imageFile);
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Analysis failed");
      }
    } catch (err) {
      setError(err.message || "Unable to reach AI service");
    } finally {
      setLoading(false);
    }
  };

  const phColor = (ph) => {
    if (ph < 5.5) return "var(--accent-rose)";
    if (ph < 6) return "var(--accent-amber)";
    if (ph <= 7.5) return "var(--primary)";
    return "var(--accent-amber)";
  };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-body">
        <Navbar />
        <div className="page-inner">
          <div className="detail-page">
            <div className="detail-header animate-fade-in">
              <h1>🧪 Soil Analysis</h1>
              <p>Upload a soil image for AI-powered analysis — type, pH, nutrients, and crop suitability</p>
            </div>

            {error && (
              <div style={{ maxWidth: 520, margin: "0 auto 16px", padding: "12px 16px", background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: "var(--radius-md)", color: "var(--accent-rose)", fontSize: 13, animation: "fadeIn 0.3s ease" }}>
                ⚠️ {error}
              </div>
            )}

            {!result && (
              <>
                {!image ? (
                  <div className="scan-upload-zone animate-fade-in-up" onClick={() => fileRef.current.click()}>
                    <div className="scan-upload-icon">🧪</div>
                    <div className="scan-upload-text">
                      <h3>Upload Soil Image</h3>
                      <p>Take a clear photo of your soil sample</p>
                    </div>
                  </div>
                ) : (
                  <div className="scan-preview">
                    <img src={image} alt="Soil preview" />
                    {loading && <div className="scanning-overlay"><div className="scanning-line" /><div className="scanning-glow" /></div>}
                    <div className="scan-preview-overlay">
                      <span>📎 {fileName}</span>
                      <button className="scan-remove-btn" onClick={() => { URL.revokeObjectURL(image); setImage(null); setImageFile(null); }} disabled={loading}>✕ Remove</button>
                    </div>
                  </div>
                )}
                <input type="file" accept="image/*" ref={fileRef} onChange={handleUpload} style={{ display: "none" }} />
                <div className="scan-actions animate-fade-in-up">
                  <button className="scan-btn-upload" onClick={() => fileRef.current.click()}>📸 {image ? "Change Image" : "Browse"}</button>
                  <button className="scan-btn-analyze" onClick={handleAnalyze} disabled={!image || loading}>
                    {loading ? "⏳ Analyzing..." : "🔬 Analyze Soil"}
                  </button>
                </div>
                {loading && <div className="scan-loading"><div className="spinner-ring" /><p>AI is analyzing your soil...</p></div>}
              </>
            )}

            {result && (
              <div className="animate-fade-in-up">
                <div className="detail-grid stagger">
                  <div className="detail-card">
                    <div className="detail-card-icon" style={{ background: "rgba(139,92,246,0.15)" }}>🏔️</div>
                    <div className="detail-card-content">
                      <h4>Soil Type</h4>
                      <p style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>{result.soil_type || "Unknown"}</p>
                      <p>Color: {result.color || "N/A"}</p>
                    </div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-card-icon" style={{ background: "rgba(6,182,212,0.15)" }}>⚗️</div>
                    <div className="detail-card-content">
                      <h4>pH Level</h4>
                      <p style={{ fontSize: 18, fontWeight: 700, color: phColor(result.estimated_ph || 7) }}>{result.estimated_ph || "N/A"}</p>
                      <p>Texture: {result.texture || "N/A"}</p>
                    </div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-card-icon" style={{ background: "rgba(245,158,11,0.15)" }}>💧</div>
                    <div className="detail-card-content">
                      <h4>Moisture</h4>
                      <p>{result.moisture_level || "N/A"}</p>
                      <p>Organic Matter: {result.organic_matter || "N/A"}</p>
                    </div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-card-icon" style={{ background: "rgba(34,197,94,0.15)" }}>🌾</div>
                    <div className="detail-card-content">
                      <h4>Suitable Crops</h4>
                      <p>{(result.suitability || []).join(", ") || "Run analysis to see"}</p>
                    </div>
                  </div>
                </div>

                {result.recommendations?.length > 0 && (
                  <div className="insight-card">
                    <h3>🧠 Improvement Recommendations</h3>
                    {result.recommendations.map((r, i) => (
                      <div key={i} className="insight-item"><span className="check">✓</span>{r}</div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 24 }}>
                  <button className="detail-action-btn" onClick={() => { setResult(null); setImage(null); setImageFile(null); }}>🔄 Analyze Another Sample</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
