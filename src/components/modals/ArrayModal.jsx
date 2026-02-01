import React, { useState, useEffect } from 'react';
import '../../styles/Modal.css';

function ArrayModal({ isOpen, onClose, onCreate }) {
  const [size, setSize] = useState('5');

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        document.getElementById('array-size-input')?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleCreate = () => {
    const numSize = parseInt(size);
    if (numSize > 0 && numSize <= 20) {
      onCreate(numSize);
      setSize('5');
    } else {
      alert('Please enter a size between 1 and 20');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Array</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="array-size-input">Array Size</label>
            <div className="input-wrapper">
              <input
                id="array-size-input"
                type="number"
                min="1"
                max="20"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter array size (1-20)"
              />
              <span className="input-hint">{size} elements</span>
            </div>
          </div>

          <div className="size-suggestions">
            <p>Quick select:</p>
            <div className="suggestion-buttons">
              {[3, 5, 8, 10, 15, 20].map(num => (
                <button
                  key={num}
                  className="suggestion-btn"
                  onClick={() => setSize(num.toString())}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            Create Array
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArrayModal;
