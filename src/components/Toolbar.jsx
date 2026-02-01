import React from 'react';
import '../styles/Toolbar.css';

function Toolbar({
  arrayCreated,
  onArrayClick,
  onTextFontIncrease,
  onTextFontDecrease,
  onTextFontSizeChange,
  textFontSize,
  onClearClick,
  onInfoDisplay,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  canvasBackground,
  onCanvasBackgroundChange,
  canvasFont,
  onCanvasFontChange,
  textStyle,
  onTextStyleChange,
  textColor,
  onTextColorChange,
  textFont,
  onTextFontChange,
  canvasColor,
  onCanvasColorChange,
  theme,
  onThemeChange
}) {
  const isDarkTheme = canvasColor === 'dracula';
  
  return (
    <div className={`toolbar ${isDarkTheme ? 'toolbar-dark' : 'toolbar-light'}`}>
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
            style={{ padding: '6px 10px', fontSize: '18px', minWidth: 'auto' }}
          >
            ↶
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z or Ctrl+Y)"
            style={{ padding: '6px 10px', fontSize: '18px', minWidth: 'auto' }}
          >
            ↷
          </button>
        </div>

        <div className="separator\"></div>

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
          <div className="font-control">
            <span className="font-label">Text Size</span>
            <div className="font-buttons" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onTextFontDecrease}
                title="Decrease text font size"
                style={{ padding: '4px 8px', minWidth: 'auto' }}
              >
                A−
              </button>
              <input
                type="number"
                className="font-size-input"
                value={textFontSize}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 8;
                  onTextFontSizeChange(Math.min(Math.max(value, 8), 72));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.target.blur();
                  }
                }}
                min="8"
                max="72"
                style={{
                  width: '50px',
                  textAlign: 'center',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={onTextFontIncrease}
                title="Increase text font size"
                style={{ padding: '4px 8px', minWidth: 'auto' }}
              >
                A+
              </button>
            </div>
          </div>
        </div>

        <div className="separator"></div>

        <div className="button-group">
          <div className="font-control">
            <span className="font-label">Text Style</span>
            <select
              className="background-select"
              value={textStyle}
              onChange={(e) => onTextStyleChange(e.target.value)}
              title="Change text style effect"
              style={{
                textShadow: textStyle === 'neon' ? '0 0 8px #00ff00' : textStyle === 'outer-glow' ? '0 0 10px #667eea' : textStyle === 'soft-glow' ? '0 0 5px #ffd700' : 'none',
                color: textStyle === 'hologram' ? '#00ffff' : textStyle === 'neon' ? '#00ff00' : '#333'
              }}
            >
              <option value="none">None</option>
              <option value="neon">Neon</option>
              <option value="outer-glow">Outer Glow</option>
              <option value="soft-glow">Soft Glow</option>
              <option value="inner-glow">Inner Glow</option>
              <option value="light-beam">Light Beam</option>
              <option value="aura">Aura</option>
              <option value="hologram">Hologram</option>
            </select>
          </div>
          <div className="font-control">
            <span className="font-label">Text Color</span>
            <input
              type="color"
              className="color-picker"
              value={textColor}
              onChange={(e) => onTextColorChange(e.target.value)}
              title="Change text color"
              style={{ width: '40px', height: '32px', padding: '2px', border: `2px solid ${textColor}`, borderRadius: '4px', cursor: 'pointer' }}
            />
          </div>
          <div className="font-control">
            <span className="font-label">Text Font</span>
            <select
              className="background-select"
              value={textFont}
              onChange={(e) => onTextFontChange(e.target.value)}
              title="Change text font"
              style={{ fontFamily: textFont }}
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Caveat">Caveat</option>
              <option value="Patrick Hand">Patrick Hand</option>
              <option value="Indie Flower">Indie Flower</option>
              <option value="Handlee">Handlee</option>
              <option value="Bradley Hand, cursive">Bradley Hand</option>
            </select>
          </div>
          <div className="font-control">
            <span className="font-label">Canvas Color</span>
            <select
              className="background-select"
              value={canvasColor}
              onChange={(e) => onCanvasColorChange(e.target.value)}
              title="Change canvas color theme"
            >
              <option value="white">White</option>
              <option value="dracula">Dracula</option>
              <option value="vscode-light">VSCode Light</option>
              <option value="light-pink">Light Pink</option>
              <option value="light-yellow">Light Yellow</option>
            </select>
          </div>
          <div className="font-control">
            <span className="font-label">Theme</span>
            <select
              className="background-select"
              value={theme}
              onChange={(e) => onThemeChange(e.target.value)}
              title="Change theme/background"
            >
              <option value="white">White Paper</option>
              <option value="grid">Grid Paper</option>
              <option value="lines">Line Paper</option>
              <option value="graph">Graph Paper</option>
              <option value="dots">Dot Paper</option>
            </select>
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
