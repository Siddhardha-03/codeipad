import React, { useState, useRef, useEffect } from 'react';
import './styles/App.css';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import ShapesPanel from './components/ShapesPanel';
import ArrayModal from './components/modals/ArrayModal';
import ShapeModal from './components/modals/ShapeModal';
import HighlightModal from './components/modals/HighlightModal';
import InfoPanel from './components/InfoPanel';

function App() {
  const [arrays, setArrays] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [shapeColor, setShapeColor] = useState('#333333');
  const [activeArrayId, setActiveArrayId] = useState(null);
  const [textAnnotations, setTextAnnotations] = useState([]);
  const [selectedColor, setSelectedColor] = useState('#FFD700');
  const [infoMessage, setInfoMessage] = useState('');
  const [textFontSize, setTextFontSize] = useState(14);
  const [textColor, setTextColor] = useState('#000000');
  const [textFont, setTextFont] = useState('Arial');
  const [canvasBackground, setCanvasBackground] = useState('white');
  const [canvasColor, setCanvasColor] = useState('white');
  const [canvasFont, setCanvasFont] = useState('Arial');
  const [textStyle, setTextStyle] = useState('none');
  const [theme, setTheme] = useState('white');
  
  // History management
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistorySize = 50;
  
  // Modal states
  const [showArrayModal, setShowArrayModal] = useState(false);
  const [showShapeModal, setShowShapeModal] = useState(false);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [highlightArrayId, setHighlightArrayId] = useState(null);

  // Canvas ref
  const canvasRef = useRef(null);

  // Show info message with auto-hide
  const showInfo = (message) => {
    setInfoMessage(message);
    setTimeout(() => setInfoMessage(''), 3000);
  };

  const handleUndo = React.useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setArrays(state.arrays);
      setShapes(state.shapes);
      setTextAnnotations(state.textAnnotations);
      setHistoryIndex(newIndex);
      showInfo('Undo');
    }
  }, [historyIndex, history]);

  const handleRedo = React.useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setArrays(state.arrays);
      setShapes(state.shapes);
      setTextAnnotations(state.textAnnotations);
      setHistoryIndex(newIndex);
      showInfo('Redo');
    }
  }, [historyIndex, history]);

  // Auto-save to history whenever state changes
  useEffect(() => {
    if (history.length === 0 || historyIndex === -1) {
      // Initialize history with first state
      setHistory([{ arrays, textAnnotations }]);
      setHistoryIndex(0);
    } else if (JSON.stringify(history[historyIndex]) !== JSON.stringify({ arrays, textAnnotations })) {
      // Save new state to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ arrays, textAnnotations });
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      } else {
        setHistoryIndex(newHistory.length - 1);
      }
      setHistory(newHistory);
    }
  }, [arrays, textAnnotations, history, historyIndex]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Array operations
  const handleCreateArray = (size) => {
    const newId = Date.now();
    const newArray = {
      id: newId,
      size,
      values: new Array(size).fill(''),
      highlights: {},
      offsetX: 0,
      offsetY: 0
    };
    setArrays((prev) => [...prev, newArray]);
    setActiveArrayId(newId);
    setShowArrayModal(false);
    showInfo(`Added array #${arrays.length + 1} (size ${size})`);
  };

  const handleArrayMove = (arrayId, offsetX, offsetY) => {
    setArrays((prev) => prev.map((arr) => (
      arr.id === arrayId ? { ...arr, offsetX, offsetY } : arr
    )));
  };

  const handleUpdateCellValue = (arrayId, index, value) => {
    setArrays((prev) => prev.map((arr) => {
      if (arr.id !== arrayId) return arr;
      const newValues = [...arr.values];
      newValues[index] = value;
      return { ...arr, values: newValues };
    }));
    const arrayNumber = arrays.findIndex((a) => a.id === arrayId) + 1;
    showInfo(`Array ${arrayNumber} cell [${index}] = ${value}`);
  };

  const handleCellValueChange = (arrayId, index, value) => {
    handleUpdateCellValue(arrayId, index, value);
  };

  const handleHighlightCell = (arrayId, index, color) => {
    setArrays((prev) => prev.map((arr) => {
      if (arr.id !== arrayId) return arr;
      return { ...arr, highlights: { ...arr.highlights, [index]: color } };
    }));
    const arrayNumber = arrays.findIndex((a) => a.id === arrayId) + 1;
    showInfo(`Highlighted array ${arrayNumber} cell [${index}]`);
    setShowHighlightModal(false);
  };

  const handleRemoveText = (id) => {
    setTextAnnotations(textAnnotations.filter(ann => ann.id !== id));
  };

  const handleUpdateTextPosition = (id, x, y) => {
    setTextAnnotations(textAnnotations.map(ann =>
      ann.id === id ? { ...ann, x, y } : ann
    ));
  };

  const handleUpdateTextContent = (id, text) => {
    setTextAnnotations(textAnnotations.map(ann =>
      ann.id === id ? { ...ann, text, style: textStyle, color: textColor, font: textFont } : ann
    ));
  };

  const handleAddTextAtPosition = (x, y, textId) => {
    const newAnnotation = {
      id: textId || Date.now(),
      text: '',
      fontSize: textFontSize,
      style: textStyle,
      color: textColor,
      font: textFont,
      x: x,
      y: y
    };
    setTextAnnotations([...textAnnotations, newAnnotation]);
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all elements from canvas?')) {
      setArrays([]);
      setShapes([]);
      setActiveArrayId(null);
      setSelectedShapeId(null);
      setTextAnnotations([]);
      showInfo('Canvas cleared');
    }
  };

  const handleShowHighlightModal = (arrayId, index) => {
    setHighlightArrayId(arrayId);
    setHighlightIndex(index);
    setShowHighlightModal(true);
  };

  const handleAddShape = (shape) => {
    const newShape = {
      id: Date.now(),
      ...shape,
      x: 120 + shapes.length * 20,
      y: 420 + shapes.length * 20
    };
    setShapes((prev) => [...prev, newShape]);
    setSelectedShapeId(newShape.id);
    showInfo(`Added ${shape.type} shape`);
    setShowShapeModal(false);
  };

  const handleDropShape = (shapeType, position) => {
    const base = {
      id: Date.now(),
      x: position.x,
      y: position.y
    };

    if (shapeType === 'circle') {
      setShapes((prev) => [...prev, {
        ...base,
        type: 'circle',
        radius: 36,
        fill: '#ffffff',
        stroke: shapeColor,
        strokeWidth: 2
      }]);
      setSelectedShapeId(base.id);
      return;
    }

    if (shapeType === 'line') {
      setShapes((prev) => [...prev, {
        ...base,
        type: 'line',
        points: [0, 0, 120, 0],
        stroke: shapeColor,
        strokeWidth: 2
      }]);
      setSelectedShapeId(base.id);
      return;
    }

    if (shapeType === 'vline') {
      setShapes((prev) => [...prev, {
        ...base,
        type: 'line',
        points: [0, 0, 0, 160],
        stroke: shapeColor,
        strokeWidth: 2
      }]);
      setSelectedShapeId(base.id);
      return;
    }

    if (shapeType === 'arrowUp') {
      setShapes((prev) => [...prev, {
        ...base,
        type: 'arrowUp',
        points: [0, 40, 0, 0],
        stroke: shapeColor,
        strokeWidth: 2,
        pointerLength: 10,
        pointerWidth: 10
      }]);
      setSelectedShapeId(base.id);
      return;
    }

    if (shapeType === 'arrowDown') {
      setShapes((prev) => [...prev, {
        ...base,
        type: 'arrowDown',
        points: [0, 0, 0, 40],
        stroke: shapeColor,
        strokeWidth: 2,
        pointerLength: 10,
        pointerWidth: 10
      }]);
      setSelectedShapeId(base.id);
      return;
    }

    if (shapeType === 'arrowLeft') {
      setShapes((prev) => [...prev, {
        ...base,
        type: 'arrowLeft',
        points: [40, 0, 0, 0],
        stroke: shapeColor,
        strokeWidth: 2,
        pointerLength: 10,
        pointerWidth: 10
      }]);
      setSelectedShapeId(base.id);
      return;
    }

    if (shapeType === 'arrowRight') {
      setShapes((prev) => [...prev, {
        ...base,
        type: 'arrowRight',
        points: [0, 0, 40, 0],
        stroke: shapeColor,
        strokeWidth: 2,
        pointerLength: 10,
        pointerWidth: 10
      }]);
      setSelectedShapeId(base.id);
      return;
    }

    if (shapeType === 'arcArrowUp') {
      setShapes((prev) => [...prev, {
        ...base,
        type: 'arcArrowUp',
        angle: 180,
        innerRadius: 40,
        outerRadius: 40,
        stroke: shapeColor,
        strokeWidth: 2,
        rotation: 0
      }]);
      setSelectedShapeId(base.id);
      return;
    }

    if (shapeType === 'arcArrowDown') {
      setShapes((prev) => [...prev, {
        ...base,
        type: 'arcArrowDown',
        angle: 180,
        innerRadius: 40,
        outerRadius: 40,
        stroke: shapeColor,
        strokeWidth: 2,
        rotation: 180
      }]);
      setSelectedShapeId(base.id);
      return;
    }

    setShapes((prev) => [...prev, {
      ...base,
      type: 'rectangle',
      width: 120,
      height: 70,
      cornerRadius: 6,
      fill: '#ffffff',
      stroke: shapeColor,
      strokeWidth: 2
    }]);
    setSelectedShapeId(base.id);
  };

  const handleShapeUpdate = (id, updates) => {
    setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, ...updates } : shape)));
  };

  const handleShapeSelect = (id) => {
    setSelectedShapeId(id || null);
    if (!id) return;
    const current = shapes.find((s) => s.id === id);
    if (current) {
      setShapeColor(current.stroke || '#333333');
    }
  };

  const handleShapeColorChange = (color) => {
    setShapeColor(color);
    if (!selectedShapeId) return;
    setShapes((prev) => prev.map((shape) => {
      if (shape.id !== selectedShapeId) return shape;
      if (shape.type === 'line' || shape.type === 'arrowUp' || shape.type === 'arrowDown') {
        return { ...shape, stroke: color };
      }
      return { ...shape, stroke: color, fill: '#ffffff' };
    }));
  };

  const handleTextFontIncrease = () => {
    setTextFontSize((prev) => Math.min(prev + 2, 72));
  };

  const handleTextFontDecrease = () => {
    setTextFontSize((prev) => Math.max(prev - 2, 8));
  };

  const handleTextFontSizeChange = (size) => {
    setTextFontSize(size);
  };

  return (
    <div className="app">
      <Toolbar
        arrayCreated={arrays.length > 0}
        onArrayClick={() => setShowArrayModal(true)}
        onTextFontIncrease={handleTextFontIncrease}
        onTextFontDecrease={handleTextFontDecrease}
        onTextFontSizeChange={handleTextFontSizeChange}
        textFontSize={textFontSize}
        onClearClick={handleClearAll}
        onInfoDisplay={showInfo}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canvasBackground={canvasBackground}
        onCanvasBackgroundChange={(bg) => {
          setCanvasBackground(bg);
          setTheme(bg);
        }}
        canvasFont={canvasFont}
        onCanvasFontChange={setCanvasFont}
        textStyle={textStyle}
        onTextStyleChange={setTextStyle}
        textColor={textColor}
        onTextColorChange={setTextColor}
        textFont={textFont}
        onTextFontChange={setTextFont}
        canvasColor={canvasColor}
        onCanvasColorChange={setCanvasColor}
        theme={theme}
        onThemeChange={(t) => {
          setTheme(t);
          setCanvasBackground(t);
        }}
      />

      <div className="main-content">
        <ShapesPanel
          shapeColor={shapeColor}
          onShapeColorChange={handleShapeColorChange}
        />
        <Canvas
          ref={canvasRef}
          arrays={arrays}
          shapes={shapes}
          selectedShapeId={selectedShapeId}
          onSelectShape={handleShapeSelect}
          onShapeUpdate={handleShapeUpdate}
          activeArrayId={activeArrayId}
          onArrayActivate={setActiveArrayId}
          onArrayMove={handleArrayMove}
          textAnnotations={textAnnotations}
          onCellValueChange={handleCellValueChange}
          onCellRightClick={handleShowHighlightModal}
          onCellHover={showInfo}
          onDropShape={handleDropShape}
          onTextMove={handleUpdateTextPosition}
          onTextRemove={handleRemoveText}
          onAddTextAtPosition={handleAddTextAtPosition}
          onUpdateTextContent={handleUpdateTextContent}
          canvasBackground={canvasBackground}
          canvasColor={canvasColor}
          canvasFont={canvasFont}
          textColor={textColor}
          textStyle={textStyle}
        />
      </div>

      {/* Modals */}
      <ArrayModal
        isOpen={showArrayModal}
        onClose={() => setShowArrayModal(false)}
        onCreate={handleCreateArray}
      />

      <ShapeModal
        isOpen={showShapeModal}
        onClose={() => setShowShapeModal(false)}
        onAdd={handleAddShape}
      />

      <HighlightModal
        isOpen={showHighlightModal}
        onClose={() => setShowHighlightModal(false)}
        onHighlight={(index, color) => handleHighlightCell(highlightArrayId, index, color)}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        cellIndex={highlightIndex}
        arraySize={arrays.find((a) => a.id === highlightArrayId)?.size || 0}
      />

      {/* Info Panel */}
      <InfoPanel message={infoMessage} />
    </div>
  );
}

export default App;
