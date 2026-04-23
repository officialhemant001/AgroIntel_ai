/**
 * UploadCard — Standalone image upload component.
 * Fixed: now uses project's CSS design system instead of ad-hoc white inline styles.
 */
import React, { useState, useRef } from "react";

export default function UploadCard({ onImageSelected }) {
  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef();

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setFileName(file.name);
      if (onImageSelected) onImageSelected(file);
    }
  };

  const handleRemove = () => {
    setImage(null);
    setFileName("");
    if (onImageSelected) onImageSelected(null);
  };

  return (
    <div className="content-card">
      <div className="content-card-header">
        <span className="content-card-title">📸 Upload Leaf Image</span>
      </div>

      {!image ? (
        <div
          className="scan-upload-zone"
          onClick={() => fileRef.current.click()}
          style={{ margin: 0, maxWidth: "100%" }}
        >
          <div className="scan-upload-icon">📷</div>
          <div className="scan-upload-text">
            <h3>Click to browse</h3>
            <p>
              or drag & drop an image here
            </p>
          </div>
        </div>
      ) : (
        <div className="scan-preview" style={{ maxWidth: "100%" }}>
          <img src={image} alt="preview" />
          <div className="scan-preview-overlay">
            <span>📎 {fileName}</span>
            <button className="scan-remove-btn" onClick={handleRemove}>
              ✕ Remove
            </button>
          </div>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        ref={fileRef}
        onChange={handleUpload}
        style={{ display: "none" }}
      />

      {image && (
        <button
          className="detail-action-btn"
          style={{ marginTop: "16px", width: "100%" }}
          onClick={() => fileRef.current.click()}
        >
          📸 Change Image
        </button>
      )}
    </div>
  );
}