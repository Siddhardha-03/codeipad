import React from 'react';
import '../styles/Toolbar.css';

function Toolbar({
  arrayCreated,
  onArrayClick,
  onTextClick,
  onPointerClick,
  onShapeClick,
  onFontIncrease,
  onFontDecrease,
  cellFontSize,
  cellWidth,
  cellHeight,
  onCellWidthIncrease,
  onCellWidthDecrease,
  onCellHeightIncrease,
  onCellHeightDecrease,
  onClearClick,
  onInfoDisplay,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-brand">
        <h1 className="brand-title">DSA Visualizer</h1>
        <p className="brand-subtitle">Algorithm Teaching Tool</p>
      </div>

      <div className="toolbar-content">
        <div className="button-group">
          <button
            className="btn btn-secondary btn-sm"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z or Ctrl+Y)"
          >
            ↷ Redo
          </button>
        </div>

        <div className="separator"></div>

        <div className="button-group">
          <button
            className="btn btn-primary btn-lg"
            onClick={onArrayClick}
            title="Add a new array"
          >
            Add Array
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onInfoDisplay('Tree visualization coming soon')}
            title="Create a tree (Coming soon)"
            disabled
          >
            Tree
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onInfoDisplay('Graph visualization coming soon')}
            title="Create a graph (Coming soon)"
            disabled
          >
            Graph
          </button>
        </div>

        <div className="separator"></div>

        <div className="button-group">
          <button
            className="btn btn-secondary"
            onClick={onTextClick}
            disabled={!arrayCreated}
            title="Add text annotation"
          >
            Text
          </button>
          <button
            className="btn btn-secondary"
            onClick={onPointerClick}
            disabled={!arrayCreated}
            title="Add pointer label"
          >
            Pointer
          </button>
          <button
            className="btn btn-secondary"
            onClick={onShapeClick}
            title="Add shape"
          >
            Shapes
          </button>
        </div>

        <div className="separator"></div>

        <div className="button-group">
          <div className="font-control">
            <span className="font-label">Cell Font</span>
            <div className="font-buttons">
              <button
                className="btn btn-secondary btn-sm"
                onClick={onFontDecrease}
                title="Decrease cell font size"
              >
                Font -
              </button>
              <span className="font-size">{cellFontSize}px</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onFontIncrease}
                title="Increase cell font size"
              >
                Font +
              </button>
            </div>
          </div>
        </div>

        <div className="separator"></div>

        <div className="button-group">
          <div className="font-control">
            <span className="font-label">Cell Width</span>
            <div className="font-buttons">
              <button
                className="btn btn-secondary btn-sm"
                onClick={onCellWidthDecrease}
                title="Decrease cell width"
              >
                -
              </button>
              <span className="font-size">{cellWidth}px</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onCellWidthIncrease}
                title="Increase cell width"
              >
                +
              </button>
            </div>
          </div>
          <div className="font-control">
            <span className="font-label">Cell Height</span>
            <div className="font-buttons">
              <button
                className="btn btn-secondary btn-sm"
                onClick={onCellHeightDecrease}
                title="Decrease cell height"
              >
                -
              </button>
              <span className="font-size">{cellHeight}px</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onCellHeightIncrease}
                title="Increase cell height"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="separator"></div>

        <div className="button-group">
          <button
            className="btn btn-danger"
            onClick={onClearClick}
            title="Clear the entire canvas"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}

export default Toolbar;
