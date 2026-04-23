import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { scanCrop } from "../services/api";
import "../styles/dashboard.css";
import "../styles/pages.css";

export default function Scan() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef();
  const navigate = useNavigate();

  // Cleanup URL on unmount or change
  React.useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image);
    };
  }, [image]);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (image) URL.revokeObjectURL(image);
      setImage(URL.createObjectURL(file));
      setImageFile(file);
      setFileName(file.name);
      setError("");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (image) URL.revokeObjectURL(image);
      setImage(URL.createObjectURL(file));
      setImageFile(file);
      setFileName(file.name);
      setError("");
    }
  };

  const handleRemove = () => {
    if (image) URL.revokeObjectURL(image);
    setImage(null);
    setImageFile(null);
    setFileName("");
    setError("");
  };

  // AI Analyze — calls real backend API with full pipeline
  const handleAnalyze = async () => {
    if (!imageFile) {
      setError("Please upload an image first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await scanCrop(imageFile);

      if (result.success) {
        const scanData = result.data;

        // Check if it's a fallback response
        if (scanData.status === "fallback") {
          // Still navigate but show fallback notice
          navigate("/report", { state: { scanResult: scanData } });
        } else if (scanData.status === "error") {
          // Image unclear
          setError(scanData.message || "Image not clear, please upload again");
        } else {
          // Normal success — navigate to report
          navigate("/report", { state: { scanResult: scanData } });
        }
      } else {
        setError(result.error || "Analysis failed — please try again");
      }
    } catch (err) {
      console.error("Scan failed:", err);
      setError(err.message || "Unable to reach AI service — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-layout">
      <Sidebar />

      <div className="page-body">
        <Navbar />

        <div className="page-inner">
          <div className="scan-hero animate-fade-in">
            <h1>🌿 AI Crop Scanner</h1>
            <p>
              Upload or capture a leaf image for instant AI-powered disease
              detection, treatment recommendations, and database verification
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                maxWidth: "520px",
                margin: "0 auto 16px",
                padding: "12px 16px",
                background: "rgba(244, 63, 94, 0.12)",
                border: "1px solid rgba(244, 63, 94, 0.25)",
                borderRadius: "var(--radius-md)",
                color: "var(--accent-rose)",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                animation: "fadeIn 0.3s ease",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Upload Zone */}
          {!image && (
            <div
              className={`scan-upload-zone animate-fade-in-up ${dragActive ? "active" : ""}`}
              onClick={() => fileRef.current.click()}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              id="scan-upload-zone"
            >
              <div className="scan-upload-icon">📷</div>
              <div className="scan-upload-text">
                <h3>Upload Leaf Image</h3>
                <p>
                  Drag & drop your image here, or{" "}
                  <span className="highlight">browse files</span>
                </p>
                <p style={{ marginTop: "8px", fontSize: "12px" }}>
                  Supports JPG, PNG, WEBP up to 10MB
                </p>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            onChange={handleUpload}
            style={{ display: "none" }}
            id="scan-file-input"
          />

          {/* Image Preview */}
          {image && (
            <div className="scan-preview">
              <img src={image} alt="Leaf preview" />
              
              {/* Premium Scanning Effect */}
              {loading && (
                <div className="scanning-overlay">
                  <div className="scanning-line"></div>
                  <div className="scanning-glow"></div>
                </div>
              )}

              <div className="scan-preview-overlay">
                <span>📎 {fileName}</span>
                <button className="scan-remove-btn" onClick={handleRemove} disabled={loading}>
                  ✕ Remove
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="scan-actions animate-fade-in-up">
            <button
              className="scan-btn-upload"
              onClick={() => fileRef.current.click()}
            >
              📸 {image ? "Change Image" : "Browse Files"}
            </button>
            <button
              className="scan-btn-analyze"
              onClick={handleAnalyze}
              disabled={!image || loading}
              id="scan-analyze-btn"
            >
              {loading ? "⏳ Analyzing..." : "🔬 Analyze with AI"}
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="scan-loading">
              <div className="spinner-ring" />
              <p>AI is analyzing your crop image...</p>
              <p className="sub">
                Running disease detection → Database cross-check → Building report
              </p>
            </div>
          )}

          {/* Pipeline Info */}
          <div style={{
            maxWidth: "520px", margin: "24px auto 0", padding: "16px",
            background: "var(--bg-surface)", borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)", animation: "fadeIn 0.6s ease",
          }}>
            <h4 style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px" }}>
              🧠 AI Pipeline
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "var(--text-muted)" }}>
              <span>1️⃣ Image preprocessing (resize, normalize)</span>
              <span>2️⃣ AI model inference (disease + pest detection)</span>
              <span>3️⃣ Database cross-verification (diseases, medicines)</span>
              <span>4️⃣ Structured response with treatment plan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}