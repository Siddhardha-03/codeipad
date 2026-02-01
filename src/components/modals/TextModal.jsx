import React, { useState, useEffect } from 'react';
import '../../styles/Modal.css';

function TextModal({ isOpen, onClose, onAdd }) {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState('16');

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        document.getElementById('text-input')?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleAdd = () => {
    if (!text.trim()) {
      alert('Please enter some text');
      return;
    }
    onAdd(text, parseInt(fontSize));
    setText('');
    setFontSize('16');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Text Annotation</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="text-input">Text Content</label>
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your annotation..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="text-size">Font Size</label>
            <div className="input-wrapper">
              <input
                id="text-size"
                type="number"
                min="10"
                max="48"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
              />
              <span className="input-hint">10 to 48 px</span>
            </div>
          </div>

          <div className="text-preview">
            <p>Preview:</p>
            <div
              className="preview-text"
              style={{ fontSize: `${fontSize}px` }}
            >
              {text || 'Your text will appear here'}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>
            Add Text
          </button>
        </div>
      </div>
    </div>
  );
}

export default TextModal;
