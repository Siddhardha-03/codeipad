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
  const [arraySize, setArraySize] = useState(5);
  const [treeSize, setTreeSize] = useState(5);
  const [graphSize, setGraphSize] = useState(5);
  const [linkedListSize, setLinkedListSize] = useState(5);
  const [linkedListType, setLinkedListType] = useState('singly');
  const [structures, setStructures] = useState([]);
  const [textColor, setTextColor] = useState('#000000');
  const [textFont, setTextFont] = useState('Arial');
  const [canvasBackground, setCanvasBackground] = useState('grid');
  const [canvasColor, setCanvasColor] = useState('white');
  const [canvasFont, setCanvasFont] = useState('Arial');
  const [textStyle, setTextStyle] = useState('none');
  const [theme, setTheme] = useState('grid');
  
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
      setStructures(state.structures);
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
      setStructures(state.structures);
      setTextAnnotations(state.textAnnotations);
      setHistoryIndex(newIndex);
      showInfo('Redo');
    }
  }, [historyIndex, history]);

  // Auto-save to history whenever state changes
  useEffect(() => {
    if (history.length === 0 || historyIndex === -1) {
      // Initialize history with first state
      setHistory([{ arrays, shapes, structures, textAnnotations }]);
      setHistoryIndex(0);
    } else if (JSON.stringify(history[historyIndex]) !== JSON.stringify({ arrays, shapes, structures, textAnnotations })) {
      // Save new state to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ arrays, shapes, structures, textAnnotations });
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      } else {
        setHistoryIndex(newHistory.length - 1);
      }
      setHistory(newHistory);
    }
  }, [arrays, shapes, structures, textAnnotations, history, historyIndex]);

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

  const handleDropArray = (x, y) => {
    const newId = Date.now();
    const newArray = {
      id: newId,
      size: arraySize,
      values: new Array(arraySize).fill(''),
      highlights: {},
      offsetX: x - 90,
      offsetY: y - (120 + arrays.length * 148)
    };
    setArrays((prev) => [...prev, newArray]);
    setActiveArrayId(newId);
    showInfo(`Added array #${arrays.length + 1} (size ${arraySize})`);
  };

  const handleArrayMove = (arrayId, offsetX, offsetY) => {
    setArrays((prev) => prev.map((arr) => (
      arr.id === arrayId ? { ...arr, offsetX, offsetY } : arr
    )));
  };

  const handleArrayResize = (arrayId, scaleX, scaleY) => {
    setArrays((prev) => prev.map((arr) => (
      arr.id === arrayId ? { ...arr, scaleX: scaleX || 1, scaleY: scaleY || 1 } : arr
    )));
  };

  const getNextStructurePosition = () => {
    const offset = structures.length * 30;
    return { x: 160 + offset, y: 160 + offset };
  };

  const handleAddStructure = (type, size, listType = null) => {
    const newId = Date.now();
    const pos = getNextStructurePosition();
    const isLinkedList = type === 'linked-list';
    const actualListType = listType || linkedListType;
    const newStructure = {
      id: newId,
      type,
      subType: isLinkedList ? actualListType : null,
      size,
      values: isLinkedList 
        ? Array.from({ length: size }, () => 
            actualListType === 'doubly' 
              ? { prev: '', data: '', next: '' }
              : { data: '', next: '' }
          )
        : new Array(size).fill(''),
      x: pos.x,
      y: pos.y,
      scaleX: 1,
      scaleY: 1
    };
    setStructures((prev) => [...prev, newStructure]);
    showInfo(`Added ${type.replace('-', ' ')} (size ${size})`);
  };

  const handleDropStructure = (type, x, y, size, listType = null) => {
    const newId = Date.now();
    const isLinkedList = type === 'linked-list';
    const actualListType = listType || linkedListType;
    const newStructure = {
      id: newId,
      type,
      subType: isLinkedList ? actualListType : null,
      size,
      values: isLinkedList 
        ? Array.from({ length: size }, () => 
            actualListType === 'doubly' 
              ? { prev: '', data: '', next: '' }
              : { data: '', next: '' }
          )
        : new Array(size).fill(''),
      x,
      y,
      scaleX: 1,
      scaleY: 1
    };
    setStructures((prev) => [...prev, newStructure]);
    showInfo(`Added ${type.replace('-', ' ')} (size ${size})`);
  };

  const handleStructureMove = (id, x, y) => {
    setStructures((prev) => prev.map((item) => (
      item.id === id ? { ...item, x, y } : item
    )));
  };

  const handleStructureResize = (id, scaleX, scaleY) => {
    setStructures((prev) => prev.map((item) => (
      item.id === id ? { ...item, scaleX: scaleX || 1, scaleY: scaleY || 1 } : item
    )));
  };

  const handleStructureValueChange = (id, index, value) => {
    setStructures((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const values = Array.isArray(item.values) ? [...item.values] : new Array(item.size).fill('');
      values[index] = value;
      return { ...item, values };
    }));
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

  const handleDeleteArray = (id) => {
    setArrays((prev) => prev.filter((arr) => arr.id !== id));
    showInfo('Array deleted');
  };

  const handleDeleteStructure = (id) => {
    setStructures((prev) => prev.filter((struct) => struct.id !== id));
    showInfo('Structure deleted');
  };

  const handleDeleteShape = (id) => {
    setShapes((prev) => prev.filter((shape) => shape.id !== id));
    showInfo('Shape deleted');
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

  const handleArraySizeIncrease = () => {
    setArraySize((prev) => Math.min(prev + 1, 20));
  };

  const handleArraySizeDecrease = () => {
    setArraySize((prev) => Math.max(prev - 1, 1));
  };

  const handleTreeSizeIncrease = () => {
    setTreeSize((prev) => Math.min(prev + 1, 20));
  };

  const handleTreeSizeDecrease = () => {
    setTreeSize((prev) => Math.max(prev - 1, 1));
  };

  const handleGraphSizeIncrease = () => {
    setGraphSize((prev) => Math.min(prev + 1, 20));
  };

  const handleGraphSizeDecrease = () => {
    setGraphSize((prev) => Math.max(prev - 1, 1));
  };

  const handleLinkedListSizeIncrease = () => {
    setLinkedListSize((prev) => Math.min(prev + 1, 20));
  };

  const handleLinkedListSizeDecrease = () => {
    setLinkedListSize((prev) => Math.max(prev - 1, 1));
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
        arraySize={arraySize}
        onArraySizeIncrease={handleArraySizeIncrease}
        onArraySizeDecrease={handleArraySizeDecrease}
        onArraySizeChange={setArraySize}
        treeSize={treeSize}
        onTreeSizeIncrease={handleTreeSizeIncrease}
        onTreeSizeDecrease={handleTreeSizeDecrease}
        onTreeSizeChange={setTreeSize}
        graphSize={graphSize}
        onGraphSizeIncrease={handleGraphSizeIncrease}
        onGraphSizeDecrease={handleGraphSizeDecrease}
        onGraphSizeChange={setGraphSize}
        linkedListSize={linkedListSize}
        onLinkedListSizeIncrease={handleLinkedListSizeIncrease}
        onLinkedListSizeDecrease={handleLinkedListSizeDecrease}
        onLinkedListSizeChange={setLinkedListSize}
        linkedListType={linkedListType}
        onLinkedListTypeChange={setLinkedListType}
        onAddStructure={(type) => {
          if (type === 'tree') handleAddStructure('tree', treeSize);
          if (type === 'graph') handleAddStructure('graph', graphSize);
          if (type.startsWith('linked-list')) {
            const listType = type.includes(':') ? type.split(':')[1] : linkedListType;
            handleAddStructure('linked-list', linkedListSize, listType);
          }
        }}
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
          structures={structures}
          shapes={shapes}
          selectedShapeId={selectedShapeId}
          onSelectShape={handleShapeSelect}
          onShapeUpdate={handleShapeUpdate}
          activeArrayId={activeArrayId}
          onArrayActivate={setActiveArrayId}
          onArrayMove={handleArrayMove}
          onArrayResize={handleArrayResize}
          onDropArray={handleDropArray}
          onDeleteArray={handleDeleteArray}
          onStructureMove={handleStructureMove}
          onStructureResize={handleStructureResize}
          onStructureValueChange={handleStructureValueChange}
          onDeleteStructure={handleDeleteStructure}
          onDropStructure={(type, x, y) => {
            if (type === 'tree') handleDropStructure('tree', x, y, treeSize);
            if (type === 'graph') handleDropStructure('graph', x, y, graphSize);
            if (type.startsWith('linked-list')) {
              const listType = type.includes(':') ? type.split(':')[1] : linkedListType;
              handleDropStructure('linked-list', x, y, linkedListSize, listType);
            }
          }}
          textAnnotations={textAnnotations}
          onCellValueChange={handleCellValueChange}
          onCellRightClick={handleShowHighlightModal}
          onCellHover={showInfo}
          onDropShape={handleDropShape}
          onDeleteShape={handleDeleteShape}
          onTextMove={handleUpdateTextPosition}
          onTextRemove={handleRemoveText}
          onAddTextAtPosition={handleAddTextAtPosition}
          onUpdateTextContent={handleUpdateTextContent}
          canvasBackground={canvasBackground}
          canvasColor={canvasColor}
          canvasFont={canvasFont}
          textColor={textColor}
          textStyle={textStyle}
          textFontSize={textFontSize}
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
