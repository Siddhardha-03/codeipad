import React, { useState, useEffect } from 'react';
import '../../styles/Modal.css';

function ShapeModal({ isOpen, onClose, onAdd }) {
  const [type, setType] = useState('rectangle');
  const [width, setWidth] = useState('120');
  const [height, setHeight] = useState('70');
  const [radius, setRadius] = useState('40');
  const [strokeWidth, setStrokeWidth] = useState('2');
  const [fill, setFill] = useState('#FFFFFF');
  const [stroke, setStroke] = useState('#333333');

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        document.getElementById('shape-type')?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleAdd = () => {
    if (type === 'circle') {
      onAdd({
        type: 'circle',
        radius: parseInt(radius) || 40,
        fill,
        stroke,
        strokeWidth: parseInt(strokeWidth) || 2
      });
      return;
    }

    if (type === 'line') {
      onAdd({
        type: 'line',
        points: [0, 0, 140, 0],
        stroke,
        strokeWidth: parseInt(strokeWidth) || 2
      });
      return;
    }

    onAdd({
      type: 'rectangle',
      width: parseInt(width) || 120,
      height: parseInt(height) || 70,
      cornerRadius: 6,
      fill,
      stroke,
      strokeWidth: parseInt(strokeWidth) || 2
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Shape</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="shape-type">Shape Type</label>
            <select
              id="shape-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="rectangle">Rectangle</option>
              <option value="circle">Circle</option>
              <option value="line">Line</option>
            </select>
          </div>

          {type === 'rectangle' && (
            <div className="form-group">
              <label>Size</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  min="30"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="Width"
                />
                <span className="input-hint">Width</span>
              </div>
              <div className="input-wrapper" style={{ marginTop: '10px' }}>
                <input
                  type="number"
                  min="30"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Height"
                />
                <span className="input-hint">Height</span>
              </div>
            </div>
          )}

          {type === 'circle' && (
            <div className="form-group">
              <label>Radius</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  min="10"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  placeholder="Radius"
                />
                <span className="input-hint">px</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Stroke Width</label>
            <div className="input-wrapper">
              <input
                type="number"
                min="1"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(e.target.value)}
              />
              <span className="input-hint">px</span>
            </div>
          </div>

          <div className="form-group">
            <label>Fill Color</label>
            <input
              type="text"
              value={fill}
              onChange={(e) => setFill(e.target.value)}
              placeholder="#FFFFFF"
            />
          </div>

          <div className="form-group">
            <label>Stroke Color</label>
            <input
              type="text"
              value={stroke}
              onChange={(e) => setStroke(e.target.value)}
              placeholder="#333333"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>
            Add Shape
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShapeModal;
