import React from 'react';
import '../styles/ShapesPanel.css';

const SHAPES = [
  { type: 'rectangle', label: 'Rectangle' },
  { type: 'circle', label: 'Circle' },
  { type: 'line', label: 'Line' },
  { type: 'vline', label: 'Vertical Line' },
  { type: 'arrowUp', label: 'Arrow Up' },
  { type: 'arrowDown', label: 'Arrow Down' },
  { type: 'arrowLeft', label: 'Arrow Left' },
  { type: 'arrowRight', label: 'Arrow Right' },
  { type: 'arcArrowUp', label: 'Arc Arrow Up' },
  { type: 'arcArrowDown', label: 'Arc Arrow Down' }
];

function ShapesPanel({ shapeColor, onShapeColorChange }) {
  const handleDragStart = (e, shapeType) => {
    e.dataTransfer.setData('application/shape', shapeType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="shapes-panel" style={{ '--shape-color': shapeColor }}>
      <div className="shapes-title">Shapes</div>
      <div className="shape-color">
        <label>Color</label>
        <input
          type="color"
          value={shapeColor}
          onChange={(e) => onShapeColorChange(e.target.value)}
        />
      </div>
      <div className="shapes-list">
        {SHAPES.map((shape) => (
          <div
            key={shape.type}
            className="shape-item"
            draggable
            onDragStart={(e) => handleDragStart(e, shape.type)}
            title={`Drag ${shape.label} onto canvas`}
          >
            <div className={`shape-icon shape-${shape.type}`} />
            <span>{shape.label}</span>
          </div>
        ))}
      </div>
      <div className="shapes-hint">Drag onto canvas</div>
    </div>
  );
}

export default ShapesPanel;
