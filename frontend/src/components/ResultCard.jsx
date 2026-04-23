import React from 'react';
import './ResultCard.css';

const ResultCard = ({ result }) => {
  if (!result) return null;

  const {
    disease,
    confidence,
    severity,
    plant_name,
    treatment,
    severity_color,
    short_summary,
    database_verified
  } = result;

  const getStatusIcon = (sev) => {
    switch (sev.toLowerCase()) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      case 'none': return '✅';
      default: return '⚪';
    }
  };

  return (
    <div className="result-card glass-panel animate-fade-in-up">
      <div className="result-card-header">
        <div className="status-badge" style={{ backgroundColor: `var(--accent-${severity_color})` }}>
          {getStatusIcon(severity)} {severity.toUpperCase()} SEVERITY
        </div>
        {database_verified && (
          <div className="verified-badge">
            🛡️ DB VERIFIED
          </div>
        )}
      </div>

      <div className="result-card-body">
        <h2 className="disease-name">{disease}</h2>
        <p className="plant-info">Target: <span className="highlight">{plant_name}</span></p>
        
        <div className="confidence-meter">
          <div className="meter-label">
            <span>AI Confidence</span>
            <span>{confidence}%</span>
          </div>
          <div className="meter-bar">
            <div 
              className="meter-fill" 
              style={{ width: `${confidence}%`, backgroundColor: `var(--accent-${severity_color})` }}
            ></div>
          </div>
        </div>

        <div className="summary-box">
          <h4>Analysis Summary</h4>
          <p>{short_summary}</p>
        </div>

        {treatment && (
          <div className="treatment-preview">
            <h4>Quick Treatment</h4>
            <p>{treatment}</p>
          </div>
        )}
      </div>

      <div className="result-card-footer">
        <button className="btn-details">View Full Protocol →</button>
      </div>
    </div>
  );
};

export default ResultCard;