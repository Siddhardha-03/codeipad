import React, { useState, useEffect } from 'react';
import '../../styles/Modal.css';

const COLORS = [
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Red', hex: '#FF6B6B' },
  { name: 'Teal', hex: '#4ECDC4' },
  { name: 'Mint', hex: '#95E1D3' },
  { name: 'Blue', hex: '#A8D8EA' },
  { name: 'Pink', hex: '#FFB3BA' },
  { name: 'Yellow', hex: '#FFEB3B' },
  { name: 'Green', hex: '#90EE90' }
];

function HighlightModal({
  isOpen,
  onClose,
  onHighlight,
  selectedColor,
  onColorChange,
  cellIndex,
  arraySize
}) {
  const [index, setIndex] = useState(cellIndex.toString());
  const [color, setColor] = useState(selectedColor);

  useEffect(() => {
    setIndex(cellIndex.toString());
  }, [cellIndex]);

  useEffect(() => {
    setColor(selectedColor);
  }, [selectedColor]);

  const handleHighlight = () => {
    const numIndex = parseInt(index) || 0;
    if (numIndex >= arraySize) {
      alert(`Invalid index. Array size is ${arraySize}`);
      return;
    }
    onHighlight(numIndex, color);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleHighlight();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Highlight Cell</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="highlight-index">Cell Index</label>
            <div className="input-wrapper">
              <input
                id="highlight-index"
                type="number"
                min="0"
                max={arraySize - 1}
                value={index}
                onChange={(e) => setIndex(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <span className="input-hint">0 to {arraySize - 1}</span>
            </div>
          </div>

          <div className="form-group">
            <label>Select Color</label>
            <div className="color-grid">
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  className={`color-swatch ${color === c.hex ? 'active' : ''}`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => {
                    setColor(c.hex);
                    onColorChange(c.hex);
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="color-preview">
            <p>Preview:</p>
            <div
              className="preview-box"
              style={{ backgroundColor: color }}
            >
              Cell [{index}]
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleHighlight}>
            Highlight Cell
          </button>
        </div>
      </div>
    </div>
  );
}

export default HighlightModal;
