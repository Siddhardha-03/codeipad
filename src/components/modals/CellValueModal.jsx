import React, { useEffect } from 'react';
import '../../styles/Modal.css';

function CellValueModal({ isOpen, onClose, index, value, onChange, onSave }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        document.getElementById('cell-value-input')?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Cell Value</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="cell-value-input">Cell [{index}] Value</label>
            <input
              id="cell-value-input"
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter value"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            Save Value
          </button>
        </div>
      </div>
    </div>
  );
}

export default CellValueModal;
