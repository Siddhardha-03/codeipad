import React from 'react';
import '../styles/InfoPanel.css';

function InfoPanel({ message }) {
  if (!message) return null;

  return (
    <div className="info-panel">
      <div className="info-content">
        <span className="info-icon">✓</span>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default InfoPanel;
