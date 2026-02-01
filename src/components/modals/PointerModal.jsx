import React, { useState, useEffect } from 'react';
import '../../styles/Modal.css';

const PRESET_POINTERS = ['i', 'j', 'low', 'high', 'left', 'right', 'mid', 'start', 'end', 'current'];

function PointerModal({ isOpen, onClose, onAdd, onMove, arraySize, existingPointers }) {
  const [name, setName] = useState('');
  const [customName, setCustomName] = useState('');
  const [index, setIndex] = useState('0');
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        document.getElementById('pointer-select')?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleAdd = () => {
    let finalName = name || customName;
    if (!finalName) {
      alert('Please select or enter a pointer name');
      return;
    }

    const numIndex = parseInt(index) || 0;
    if (numIndex >= arraySize) {
      alert(`Invalid index. Array size is ${arraySize}`);
      return;
    }

    if (isMoving && existingPointers[finalName]) {
      onMove(finalName, numIndex);
    } else {
      onAdd(finalName, numIndex);
    }

    setName('');
    setCustomName('');
    setIndex('0');
    setIsMoving(false);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const pointerExists = existingPointers[name || customName];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{pointerExists ? 'Move Pointer' : 'Add Pointer Label'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="pointer-select">Pointer Name</label>
            <select
              id="pointer-select"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setCustomName('');
                if (e.target.value && existingPointers[e.target.value]) {
                  setIsMoving(true);
                  setIndex(existingPointers[e.target.value].toString());
                } else {
                  setIsMoving(false);
                }
              }}
              onKeyPress={handleKeyPress}
            >
              <option value="">-- Select Pointer --</option>
              {PRESET_POINTERS.map(ptr => (
                <option key={ptr} value={ptr}>
                  {ptr} {existingPointers[ptr] !== undefined ? `(exists at [${existingPointers[ptr]}])` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="pointer-custom">Or Enter Custom Name</label>
            <input
              id="pointer-custom"
              type="text"
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                if (e.target.value) {
                  setName('');
                  setIsMoving(false);
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder="e.g., ptr, current, temp"
            />
          </div>

          <div className="form-group">
            <label htmlFor="pointer-index">Index to Point To</label>
            <div className="input-wrapper">
              <input
                id="pointer-index"
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

          {pointerExists && (
            <div className="info-box">
              This pointer exists at index {existingPointers[name || customName]}. It will be moved.
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>
            {pointerExists ? 'Move Pointer' : 'Add Pointer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PointerModal;
