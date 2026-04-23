/**
 * ResultCard — Displays AI scan results in the project's glassmorphism theme.
 * Fixed: removed non-existent Tailwind classes.
 */
export default function ResultCard({ result }) {
  if (!result) {
    return (
      <div className="content-card" style={{ textAlign: "center", padding: "32px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          🌱 No analysis data yet — upload a leaf image to get started
        </p>
      </div>
    );
  }

  return (
    <div className="content-card">
      <div className="content-card-header">
        <span className="content-card-title">🧠 AI Analysis Result</span>
        {result.confidence && (
          <span className="content-card-badge">
            {result.confidence}% confident
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div className="report-data-item">
          <label>Disease</label>
          <span>{result.disease || "N/A"}</span>
        </div>
        <div className="report-data-item">
          <label>Pest</label>
          <span>{result.pest || "None detected"}</span>
        </div>
        <div className="report-data-item">
          <label>Treatment</label>
          <span>{result.treatment || "N/A"}</span>
        </div>
        {result.severity && (
          <div className="report-data-item">
            <label>Severity</label>
            <span className={`severity ${result.severity}`}>
              {result.severity.charAt(0).toUpperCase() + result.severity.slice(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}