import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import './App.css';

const DEFAULT_CODE = `function sum(a, b) {
  return a + b;
}

console.log(sum(2, 3));`;

const MAX_HISTORY = 40;
const HANDLE_SIZE = 8;
const ROTATABLE_TYPES = new Set(['line', 'arrow', 'double-arrow', 'curved-arrow']);

const TOOL_ITEMS = [
  { type: 'select', label: 'Select / Move', short: 'Sel', icon: '⌖' },
  { type: 'draw', label: 'Freehand Draw', short: 'Draw', icon: '✎' },
  { type: 'erase', label: 'Erase Freehand', short: 'Erase', icon: '⌫' },
  { type: 'rectangle', label: 'Rectangle', short: 'Rect', icon: '▭' },
  { type: 'circle', label: 'Circle', short: 'Circle', icon: '◯' },
  { type: 'line', label: 'Straight Line', short: 'Line', icon: '／' },
  { type: 'arrow', label: 'Arrow', short: 'Arrow', icon: '→' },
  { type: 'double-arrow', label: 'Double Arrow', short: 'D-Arr', icon: '↔' },
  { type: 'curved-arrow', label: 'Curved Arrow', short: 'Curve', icon: '⤴' },
  { type: 'text', label: 'Text Note', short: 'Text', icon: 'T' },
  { type: 'array', label: 'Array', short: 'Array', icon: 'Arr' },
  { type: 'sll', label: 'Singly Linked List', short: 'SLL', icon: 'SLL' },
  { type: 'dll', label: 'Doubly Linked List', short: 'DLL', icon: 'DLL' },
  { type: 'tree', label: 'Tree', short: 'Tree', icon: '🌳' }
];

const LANGUAGES = [
  { value: 'plaintext', label: 'txt' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'markdown', label: 'Markdown' }
];

const SIZE_PRESETS = [1, 2, 3, 4, 5, 6, 8, 10, 12];
const FONT_SIZE_PRESETS = [12, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 48, 60, 72];
const BLOCK_SIZE_PRESETS = [40, 50, 60, 70, 80, 100];
const ELEMENT_COUNT_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8];

const SHAPE_PANEL_GROUPS = [
  {
    title: 'Shapes',
    items: ['rectangle', 'circle', 'line', 'text']
  },
  {
    title: 'Arrows',
    items: ['arrow', 'double-arrow', 'curved-arrow']
  },
  {
    title: 'Data Structures',
    items: ['array', 'sll', 'dll', 'tree']
  },
  {
    title: 'Drawing',
    items: ['draw', 'erase', 'select']
  }
];

function hexToRgba(hex, alpha = 0.12) {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const intValue = parseInt(full, 16);
  const red = (intValue >> 16) & 255;
  const green = (intValue >> 8) & 255;
  const blue = intValue & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function downloadText(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getShapeBounds(shape, scrollOffset) {
  const x = shape.x - scrollOffset.left;
  const y = shape.y - scrollOffset.top;

  if (shape.type === 'rectangle') {
    const w = shape.width || 140;
    const h = shape.height || 90;
    return { left: x - w / 2, top: y - h / 2, width: w, height: h };
  }

  if (shape.type === 'circle') {
    const r = shape.radius || 45;
    return { left: x - r, top: y - r, width: r * 2, height: r * 2 };
  }

  if (shape.type === 'line' || shape.type === 'arrow' || shape.type === 'double-arrow' || shape.type === 'curved-arrow') {
    const w = shape.width || 120;
    return { left: x - w / 2, top: y - 28, width: w, height: 56 };
  }

  if (shape.type === 'text') {
    return { left: x - 6, top: y - 24, width: 220, height: 44 };
  }

  if (shape.type === 'pen') {
    if (!shape.points || shape.points.length === 0) {
      return { left: x - 4, top: y - 4, width: 8, height: 8 };
    }

    const bounds = shape.points.reduce((acc, current) => ({
      minX: Math.min(acc.minX, current.x - scrollOffset.left),
      minY: Math.min(acc.minY, current.y - scrollOffset.top),
      maxX: Math.max(acc.maxX, current.x - scrollOffset.left),
      maxY: Math.max(acc.maxY, current.y - scrollOffset.top)
    }), {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    });

    return {
      left: bounds.minX,
      top: bounds.minY,
      width: Math.max(8, bounds.maxX - bounds.minX),
      height: Math.max(8, bounds.maxY - bounds.minY)
    };
  }

  if (shape.type === 'array' || shape.type === 'sll' || shape.type === 'dll') {
    return { left: x - shape.width / 2, top: y - shape.height / 2, width: shape.width, height: shape.height };
  }

  if (shape.type === 'tree') {
    return { left: x - shape.width / 2, top: y - shape.height / 2, width: shape.width, height: shape.height };
  }

  return { left: x - 20, top: y - 20, width: 40, height: 40 };
}

function getHandlePositions(bounds) {
  const left = bounds.left;
  const right = bounds.left + bounds.width;
  const top = bounds.top;
  const bottom = bounds.top + bounds.height;
  return {
    nw: { x: left, y: top },
    ne: { x: right, y: top },
    sw: { x: left, y: bottom },
    se: { x: right, y: bottom }
  };
}

function getRotateHandlePosition(bounds) {
  return {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + HANDLE_SIZE + 4
  };
}

function getHandleAtPoint(point, bounds, shapeType) {
  if (ROTATABLE_TYPES.has(shapeType)) {
    const rotateHandle = getRotateHandlePosition(bounds);
    const rotateThreshold = HANDLE_SIZE + 4;
    if (Math.abs(point.x - rotateHandle.x) <= rotateThreshold && Math.abs(point.y - rotateHandle.y) <= rotateThreshold) {
      return 'rotate';
    }
  }

  const handles = getHandlePositions(bounds);
  const threshold = HANDLE_SIZE + 2;
  const keys = Object.keys(handles);

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const handle = handles[key];
    if (Math.abs(point.x - handle.x) <= threshold && Math.abs(point.y - handle.y) <= threshold) {
      return key;
    }
  }

  return null;
}

function getResizeCursor(handle) {
  if (handle === 'rotate') return 'grab';
  if (handle === 'nw' || handle === 'se') return 'nwse-resize';
  if (handle === 'ne' || handle === 'sw') return 'nesw-resize';
  return 'move';
}

function isPointInShape(point, shape, scrollOffset) {
  const bounds = getShapeBounds(shape, scrollOffset);
  const tolerance = 8;
  return point.x >= bounds.left - tolerance &&
    point.x <= bounds.left + bounds.width + tolerance &&
    point.y >= bounds.top - tolerance &&
    point.y <= bounds.top + bounds.height + tolerance;
}

function drawArrow(ctx, x, y, shape) {
  const lineLength = shape.width || 120;
  const headSize = Math.max(10, (shape.strokeWidth || 2) * 3);
  const doubleHeaded = shape.type === 'double-arrow';

  ctx.beginPath();
  ctx.moveTo(x - lineLength / 2, y);
  ctx.lineTo(x + lineLength / 2, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + lineLength / 2, y);
  ctx.lineTo(x + lineLength / 2 - headSize, y - headSize / 2);
  ctx.lineTo(x + lineLength / 2 - headSize, y + headSize / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (doubleHeaded) {
    ctx.beginPath();
    ctx.moveTo(x - lineLength / 2, y);
    ctx.lineTo(x - lineLength / 2 + headSize, y - headSize / 2);
    ctx.lineTo(x - lineLength / 2 + headSize, y + headSize / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawCurvedArrow(ctx, x, y, shape) {
  const spread = Math.max(40, (shape.width || 120) / 2);
  ctx.beginPath();
  ctx.moveTo(x - spread, y + 18);
  ctx.quadraticCurveTo(x, y - 24, x + spread, y + 18);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + spread, y + 18);
  ctx.lineTo(x + spread - 10, y + 8);
  ctx.lineTo(x + spread - 10, y + 28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawPen(ctx, points, scrollOffset) {
  if (!points || points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x - scrollOffset.left, points[0].y - scrollOffset.top);

  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x - scrollOffset.left, points[i].y - scrollOffset.top);
  }

  ctx.stroke();
}

function drawArrayLike(ctx, shape, x, y, withNextArrow, withPrevArrow) {
  const cellWidth = shape.cellWidth || shape.blockSize;
  const cellHeight = shape.cellHeight || shape.blockSize;
  const gap = withNextArrow ? 18 : 2;
  const count = shape.count;
  const startX = x - shape.width / 2;
  const top = y - shape.height / 2;
  const cellsPerNode = withPrevArrow ? 3 : withNextArrow ? 2 : 1;
  const nodeWidth = cellWidth * cellsPerNode;

  ctx.fillStyle = hexToRgba(shape.fillColor, 0.08);
  ctx.strokeStyle = shape.strokeColor;
  ctx.lineWidth = shape.strokeWidth;

  for (let i = 0; i < count; i += 1) {
    const cellLeft = startX + i * (nodeWidth + gap);
    ctx.strokeRect(cellLeft, top, nodeWidth, cellHeight);
    ctx.fillRect(cellLeft, top, nodeWidth, cellHeight);

    if (cellsPerNode > 1) {
      const segment = nodeWidth / cellsPerNode;
      for (let segmentIndex = 1; segmentIndex < cellsPerNode; segmentIndex += 1) {
        const dividerX = cellLeft + segment * segmentIndex;
        ctx.beginPath();
        ctx.moveTo(dividerX, top);
        ctx.lineTo(dividerX, top + cellHeight);
        ctx.stroke();
      }
    }

    if (i < count - 1 && withNextArrow) {
      const midY = top + cellHeight / 2;
      const fromX = cellLeft + nodeWidth;
      const toX = cellLeft + nodeWidth + gap;

      ctx.beginPath();
      ctx.moveTo(fromX + 2, midY);
      ctx.lineTo(toX - 4, midY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toX - 4, midY);
      ctx.lineTo(toX - 10, midY - 4);
      ctx.lineTo(toX - 10, midY + 4);
      ctx.closePath();
      ctx.fillStyle = shape.strokeColor;
      ctx.fill();
      ctx.fillStyle = hexToRgba(shape.fillColor, 0.08);

      if (withPrevArrow) {
        ctx.beginPath();
        ctx.moveTo(toX - 4, midY + 10);
        ctx.lineTo(fromX + 6, midY + 10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(fromX + 6, midY + 10);
        ctx.lineTo(fromX + 12, midY + 6);
        ctx.lineTo(fromX + 12, midY + 14);
        ctx.closePath();
        ctx.fillStyle = shape.strokeColor;
        ctx.fill();
        ctx.fillStyle = hexToRgba(shape.fillColor, 0.08);
      }
    }
  }
}

function drawTree(ctx, shape, x, y) {
  const w = shape.width;
  const h = shape.height;
  const nodeRadius = Math.max(12, shape.blockSize * 0.22);

  const root = { x, y: y - h * 0.25 };
  const left = { x: x - w * 0.22, y: y + h * 0.2 };
  const right = { x: x + w * 0.22, y: y + h * 0.2 };

  ctx.strokeStyle = shape.strokeColor;
  ctx.fillStyle = hexToRgba(shape.fillColor, 0.12);
  ctx.lineWidth = shape.strokeWidth;

  ctx.beginPath();
  ctx.moveTo(root.x, root.y + nodeRadius);
  ctx.lineTo(left.x, left.y - nodeRadius);
  ctx.moveTo(root.x, root.y + nodeRadius);
  ctx.lineTo(right.x, right.y - nodeRadius);
  ctx.stroke();

  [root, left, right].forEach((node, index) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function drawShape(ctx, shape, scrollOffset) {
  const x = shape.x - scrollOffset.left;
  const y = shape.y - scrollOffset.top;
  const angle = shape.angle || 0;

  ctx.strokeStyle = shape.strokeColor;
  ctx.fillStyle = hexToRgba(shape.fillColor, 0.14);
  ctx.lineWidth = shape.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (shape.type === 'rectangle') {
    const w = shape.width || 140;
    const h = shape.height || 90;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    return;
  }

  if (shape.type === 'circle') {
    const r = shape.radius || 45;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    return;
  }

  if (shape.type === 'line') {
    const w = shape.width || 160;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(w / 2, 0);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (shape.type === 'arrow' || shape.type === 'double-arrow') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    drawArrow(ctx, 0, 0, shape);
    ctx.restore();
    return;
  }

  if (shape.type === 'curved-arrow') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    drawCurvedArrow(ctx, 0, 0, shape);
    ctx.restore();
    return;
  }

  if (shape.type === 'pen') {
    drawPen(ctx, shape.points, scrollOffset);
    return;
  }

  if (shape.type === 'text') {
    ctx.fillStyle = shape.strokeColor;
    ctx.font = '20px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(shape.text || 'Text', x, y);
    return;
  }

  if (shape.type === 'array') {
    drawArrayLike(ctx, shape, x, y, false, false);
    return;
  }

  if (shape.type === 'sll') {
    drawArrayLike(ctx, shape, x, y, true, false);
    return;
  }

  if (shape.type === 'dll') {
    drawArrayLike(ctx, shape, x, y, true, true);
    return;
  }

  if (shape.type === 'tree') {
    drawTree(ctx, shape, x, y);
  }
}

function drawResizeHandles(ctx, shape, scrollOffset) {
  if (shape.type === 'pen') return;

  const bounds = getShapeBounds(shape, scrollOffset);
  const handles = getHandlePositions(bounds);

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(bounds.left - 4, bounds.top - 4, bounds.width + 8, bounds.height + 8);
  ctx.setLineDash([]);

  Object.values(handles).forEach((handle) => {
    ctx.fillRect(handle.x - HANDLE_SIZE / 2, handle.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    ctx.strokeRect(handle.x - HANDLE_SIZE / 2, handle.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  });

  if (ROTATABLE_TYPES.has(shape.type)) {
    const rotateHandle = getRotateHandlePosition(bounds);
    ctx.beginPath();
    ctx.arc(rotateHandle.x, rotateHandle.y, HANDLE_SIZE / 2 + 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distancePointToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  const projectedX = start.x + t * dx;
  const projectedY = start.y + t * dy;
  return Math.hypot(point.x - projectedX, point.y - projectedY);
}

function erasePenShapeAtPoint(shape, point, eraserRadius) {
  if (shape.type !== 'pen' || !Array.isArray(shape.points) || shape.points.length < 2) {
    return {
      changed: false,
      shapes: [shape]
    };
  }

  const radiusWithStroke = eraserRadius + (shape.strokeWidth || 2) / 2;
  const points = shape.points;
  const remainingSegments = [];
  let currentSegment = [points[0]];
  let changed = false;

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const segmentIsErased = distancePointToSegment(point, prev, curr) <= radiusWithStroke;

    if (segmentIsErased) {
      changed = true;
      if (currentSegment.length > 1) {
        remainingSegments.push(currentSegment);
      }
      currentSegment = [curr];
      continue;
    }

    currentSegment.push(curr);
  }

  if (currentSegment.length > 1) {
    remainingSegments.push(currentSegment);
  }

  if (!changed) {
    return {
      changed: false,
      shapes: [shape]
    };
  }

  return {
    changed: true,
    shapes: remainingSegments.map((segment, index) => ({
      ...shape,
      id: `${shape.id}-erased-${index}-${Date.now()}`,
      x: segment[0].x,
      y: segment[0].y,
      points: segment
    }))
  };
}

const MonacoPane = React.memo(function MonacoPane({
  language,
  theme,
  initialCode,
  options,
  onEditorMount,
  onDrop,
  onDragOver,
  onEditorDoubleClick
}) {
  return (
    <div className="editor-wrapper" onDrop={onDrop} onDragOver={onDragOver} onDoubleClick={onEditorDoubleClick}>
      <Editor
        height="100%"
        language={language}
        theme={theme}
        defaultValue={initialCode}
        options={options}
        onMount={onEditorMount}
      />
    </div>
  );
});

function App() {
  // ==================== STORAGE CONSTANTS & HELPERS ====================
  const STORAGE_KEY = 'codeipad-session';
  const STORAGE_VERSION = 1;

  // Storage helper functions
  const saveToStorage = useCallback((data) => {
    try {
      const payload = {
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        data
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setStatus('Saved locally');
      // Clear status after 2 seconds
      setTimeout(() => setStatus('Ready'), 2000);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      setStatus('Save failed');
    }
  }, []);

  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      // Validate version
      if (parsed.version !== STORAGE_VERSION) {
        console.warn('Storage version mismatch, resetting');
        return null;
      }
      return parsed.data;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }, []);

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setStatus('Storage cleared');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }, []);

  // Debounce helper
  const debounce = useCallback((func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, []);

  // ==================== STATE DECLARATIONS ====================
  const [language, setLanguage] = useState('plaintext');
  const [theme, setTheme] = useState('light');
  const [editorReady, setEditorReady] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [isShapesPanelPinned, setIsShapesPanelPinned] = useState(false);
  const [isShapesPanelDragging, setIsShapesPanelDragging] = useState(false);
  const [isShapesPanelHot, setIsShapesPanelHot] = useState(false);

  const [strokeColor, setStrokeColor] = useState('#2563eb');
  const [fillColor, setFillColor] = useState('#2563eb');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [eraseSize, setEraseSize] = useState(20);
  const [editorFontSize, setEditorFontSize] = useState(15);
  const [elementCount, setElementCount] = useState(5);
  const [blockSize, setBlockSize] = useState(60);
  const [status, setStatus] = useState('Ready');

  const [history, setHistory] = useState({ items: [], index: -1 });
  const [selectedTool, setSelectedTool] = useState('select');
  const [interactionMode, setInteractionMode] = useState('code');
  const [shapes, setShapes] = useState([]);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [, setHoverShapeId] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [eraserPointer, setEraserPointer] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const [viewportTick, setViewportTick] = useState(0);
  const [initialEditorCode, setInitialEditorCode] = useState(DEFAULT_CODE);

  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const monacoEditorRef = useRef(null);
  const monacoScrollDisposerRef = useRef(null);
  const scrollOffsetRef = useRef({ left: 0, top: 0 });
  const resizeObserverRef = useRef(null);
  const codeHistoryTimerRef = useRef(null);
  const historyLockRef = useRef(false);
  const latestStateRef = useRef({ language: 'javascript', theme: 'light' });
  const shapesRef = useRef([]);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const rotateRef = useRef(null);
  const erasedDuringStrokeRef = useRef(false);
  const debouncedSaveRef = useRef(null);

  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs';

  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  // Load persisted state on app initialization
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      // Restore editor code
      if (stored.code) setInitialEditorCode(stored.code);
      // Restore UI settings
      if (stored.language) setLanguage(stored.language);
      if (stored.theme) setTheme(stored.theme);
      if (stored.editorFontSize) setEditorFontSize(stored.editorFontSize);
      if (stored.blockSize) setBlockSize(stored.blockSize);
      if (stored.elementCount) setElementCount(stored.elementCount);
      // Restore shapes
      if (Array.isArray(stored.shapes)) setShapes(stored.shapes);
      updateStatus('Session restored');
    }
  }, []); // Run only once on mount

  const updateStatus = useCallback((message) => {
    setStatus(message);
  }, []);

  const getMousePoint = useCallback((e) => {
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return null;

    return {
      x: e.clientX - rect.left + scrollOffsetRef.current.left,
      y: e.clientY - rect.top + scrollOffsetRef.current.top
    };
  }, []);

  const setCanvasPointerEvents = useCallback((value) => {
    const layer = canvasContainerRef.current;
    if (layer) layer.style.pointerEvents = value;
  }, []);

  useEffect(() => {
    setCanvasPointerEvents(interactionMode === 'shape' ? 'auto' : 'none');
  }, [interactionMode, setCanvasPointerEvents]);

  // Auto-save shapes (debounced)
  useEffect(() => {
    if (!debouncedSaveRef.current) {
      debouncedSaveRef.current = debounce(() => {
        const code = monacoEditorRef.current?.getValue?.() || DEFAULT_CODE;
        const dataToSave = {
          code,
          shapes,
          language,
          theme,
          editorFontSize,
          blockSize,
          elementCount
        };
        saveToStorage(dataToSave);
      }, 400);
    }
    debouncedSaveRef.current();
  }, [shapes, language, theme, editorFontSize, blockSize, elementCount, saveToStorage, debounce]);

  // Auto-save editor code changes (with longer debounce to avoid excessive saves)
  useEffect(() => {
    if (!editorReady) return;

    const handleEditorChange = () => {
      if (!debouncedSaveRef.current) {
        debouncedSaveRef.current = debounce(() => {
          const code = monacoEditorRef.current?.getValue?.() || DEFAULT_CODE;
          const dataToSave = {
            code,
            shapes,
            language,
            theme,
            editorFontSize,
            blockSize,
            elementCount
          };
          saveToStorage(dataToSave);
        }, 400);
      }
      debouncedSaveRef.current();
    };

    monacoEditorRef.current?.onDidChangeModelContent?.(handleEditorChange);
  }, [editorReady, saveToStorage, debounce, shapes, language, theme, editorFontSize, blockSize, elementCount]);

  const passPointerThroughToEditor = useCallback((sourceEvent) => {
    const editor = monacoEditorRef.current;
    if (editor) {
      const target = editor.getTargetAtClientPoint?.(sourceEvent.clientX, sourceEvent.clientY);
      if (target?.position) {
        editor.setPosition(target.position);
      }
      editor.focus();
    }
  }, []);

  const findTopShapeAtPoint = useCallback((point, { includePen = false } = {}) => {
    return [...shapesRef.current].reverse().find((shape) => {
      if (!includePen && shape.type === 'pen') return false;
      return isPointInShape(point, shape, scrollOffsetRef.current);
    });
  }, []);

  const enterShapeMode = useCallback((shapeId) => {
    if (!shapeId) return;
    setInteractionMode('shape');
    setSelectedShapeId(shapeId);
    setHoverShapeId(shapeId);
    updateStatus('Shape mode');
  }, [updateStatus]);

  const exitShapeMode = useCallback((sourceEvent) => {
    dragRef.current = null;
    resizeRef.current = null;
    rotateRef.current = null;
    setSelectedShapeId(null);
    setHoverShapeId(null);
    setInteractionMode('code');
    if (sourceEvent) {
      passPointerThroughToEditor(sourceEvent);
    }
    updateStatus('Code mode');
  }, [passPointerThroughToEditor, updateStatus]);

  const handleCanvasDoubleClick = useCallback((e) => {
    const point = getMousePoint(e);
    if (!point) return;

    const hitShape = findTopShapeAtPoint(point);

    if (hitShape) {
      enterShapeMode(hitShape.id);
      return;
    }

    exitShapeMode(e);
  }, [enterShapeMode, exitShapeMode, findTopShapeAtPoint, getMousePoint]);

  const handleEditorDoubleClick = useCallback((e) => {
    const point = getMousePoint(e);
    if (!point) {
      exitShapeMode(e);
      return;
    }

    const hitShape = findTopShapeAtPoint(point);

    if (hitShape) {
      enterShapeMode(hitShape.id);
      return;
    }

    exitShapeMode(e);
  }, [enterShapeMode, exitShapeMode, findTopShapeAtPoint, getMousePoint]);

  const captureSnapshot = useCallback(() => {
    return {
      ...latestStateRef.current,
      code: monacoEditorRef.current?.getValue?.() ?? DEFAULT_CODE,
      shapes: JSON.parse(JSON.stringify(shapesRef.current)),
      editorFontSize,
      elementCount,
      blockSize
    };
  }, [editorFontSize, elementCount, blockSize]);

  const pushHistory = useCallback((snapshot) => {
    if (historyLockRef.current) return;

    setHistory((prev) => {
      const scoped = prev.items.slice(0, prev.index + 1);
      const last = scoped[scoped.length - 1];
      if (last && JSON.stringify(last) === JSON.stringify(snapshot)) {
        return prev;
      }

      const nextItems = [...scoped, snapshot].slice(-MAX_HISTORY);
      return { items: nextItems, index: nextItems.length - 1 };
    });
  }, []);

  const applySnapshot = useCallback((snapshot) => {
    if (!snapshot) return;

    historyLockRef.current = true;
    setLanguage(snapshot.language ?? 'javascript');
    setTheme(snapshot.theme ?? 'light');
    setEditorFontSize(snapshot.editorFontSize ?? 15);
    setElementCount(snapshot.elementCount ?? 5);
    setBlockSize(snapshot.blockSize ?? 60);

    if (monacoEditorRef.current && typeof snapshot.code === 'string') {
      monacoEditorRef.current.setValue(snapshot.code);
    }

    const nextShapes = snapshot.shapes ?? [];
    shapesRef.current = nextShapes;
    setShapes(nextShapes);

    window.setTimeout(() => {
      historyLockRef.current = false;
    }, 0);

    updateStatus('State restored');
  }, [updateStatus]);

  const createShape = useCallback((toolType, point) => {
    if (!point) return null;

    const id = `shape-${Date.now()}-${Math.random()}`;
    const shape = {
      id,
      type: toolType,
      x: point.x,
      y: point.y,
      strokeColor,
      fillColor,
      strokeWidth
    };

    if (toolType === 'rectangle') {
      shape.width = 140;
      shape.height = 90;
    } else if (toolType === 'circle') {
      shape.radius = 45;
    } else if (toolType === 'line') {
      shape.width = 160;
    } else if (toolType === 'arrow' || toolType === 'double-arrow' || toolType === 'curved-arrow') {
      shape.width = 120;
    } else if (toolType === 'text') {
      shape.text = 'Text';
    } else if (toolType === 'array' || toolType === 'sll' || toolType === 'dll') {
      const gap = toolType === 'array' ? 2 : 18;
      const cellsPerNode = toolType === 'dll' ? 3 : toolType === 'sll' ? 2 : 1;
      shape.count = elementCount;
      shape.blockSize = blockSize;
      shape.cellWidth = blockSize;
      shape.cellHeight = blockSize;
      shape.width = elementCount * (shape.cellWidth * cellsPerNode) + (elementCount - 1) * gap;
      shape.height = shape.cellHeight;
    } else if (toolType === 'tree') {
      shape.count = Math.max(3, elementCount);
      shape.blockSize = blockSize;
      shape.width = blockSize * 3.2;
      shape.height = blockSize * 2.2;
    }

    const nextShapes = [...shapesRef.current, shape];
    shapesRef.current = nextShapes;
    setShapes(nextShapes);
    updateStatus(`${toolType} added`);
    return shape;
  }, [blockSize, elementCount, fillColor, strokeColor, strokeWidth, updateStatus]);

  const updateCursor = useCallback((point) => {
    const layer = canvasContainerRef.current;
    if (!layer || !point) return;

    if (interactionMode !== 'shape') {
      layer.style.cursor = 'text';
      return;
    }

    if (selectedTool === 'erase' && !dragRef.current && !resizeRef.current && !rotateRef.current) {
      layer.style.cursor = 'crosshair';
      return;
    }

    if (selectedTool === 'draw' && !dragRef.current && !resizeRef.current && !rotateRef.current) {
      layer.style.cursor = 'crosshair';
      return;
    }

    if (resizeRef.current) {
      layer.style.cursor = getResizeCursor(resizeRef.current.handle);
      return;
    }

    if (rotateRef.current) {
      layer.style.cursor = 'grabbing';
      return;
    }

    if (dragRef.current) {
      layer.style.cursor = 'grabbing';
      return;
    }

    const viewportPoint = {
      x: point.x - scrollOffsetRef.current.left,
      y: point.y - scrollOffsetRef.current.top
    };

    const hitShape = [...shapesRef.current].reverse().find((shape) => {
      if (!isPointInShape(point, shape, scrollOffsetRef.current)) return false;
      return true;
    });

    if (hitShape && hitShape.type !== 'pen') {
      const bounds = getShapeBounds(hitShape, scrollOffsetRef.current);
      const handle = getHandleAtPoint(viewportPoint, bounds, hitShape.type);
      if (handle) {
        layer.style.cursor = getResizeCursor(handle);
        return;
      }
    }

    layer.style.cursor = hitShape ? 'move' : 'text';
  }, [interactionMode, selectedTool]);

  const eraseAtPoint = useCallback((point) => {
    const radius = Math.max(4, eraseSize / 2);
    const nextShapes = [];
    let changed = false;

    shapesRef.current.forEach((shape) => {
      if (shape.type !== 'pen') {
        nextShapes.push(shape);
        return;
      }

      const result = erasePenShapeAtPoint(shape, point, radius);
      if (result.changed) {
        changed = true;
      }
      nextShapes.push(...result.shapes);
    });

    if (changed) {
      erasedDuringStrokeRef.current = true;
      shapesRef.current = nextShapes;
      setShapes(nextShapes);
      setHoverShapeId(null);
    }
  }, [eraseSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    shapes.forEach((shape) => {
      drawShape(ctx, shape, scrollOffsetRef.current);
    });

    if (interactionMode === 'shape' && selectedShapeId) {
      const focusedShape = shapes.find((shape) => shape.id === selectedShapeId);
      if (focusedShape) {
        drawResizeHandles(ctx, focusedShape, scrollOffsetRef.current);
      }
    }

    if (isDrawing && currentPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      drawPen(ctx, currentPath, scrollOffsetRef.current);
      ctx.restore();
    }

    if (selectedTool === 'erase' && eraserPointer) {
      ctx.save();
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.9)';
      ctx.fillStyle = 'rgba(220, 38, 38, 0.12)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(
        eraserPointer.x - scrollOffsetRef.current.left,
        eraserPointer.y - scrollOffsetRef.current.top,
        Math.max(4, eraseSize / 2),
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }, [currentPath, eraseSize, eraserPointer, interactionMode, isDrawing, selectedShapeId, selectedTool, shapes, strokeColor, strokeWidth, viewportTick]);

  const applyResize = useCallback((shape, bounds, handle, point) => {
    const startLeft = bounds.left;
    const startTop = bounds.top;
    const startRight = bounds.left + bounds.width;
    const startBottom = bounds.top + bounds.height;
    const minSize = 20;

    let left = startLeft;
    let right = startRight;
    let top = startTop;
    let bottom = startBottom;

    if (handle.includes('w')) left = Math.min(point.x, startRight - minSize);
    if (handle.includes('e')) right = Math.max(point.x, startLeft + minSize);
    if (handle.includes('n')) top = Math.min(point.y, startBottom - minSize);
    if (handle.includes('s')) bottom = Math.max(point.y, startTop + minSize);

    const width = Math.max(minSize, right - left);
    const height = Math.max(minSize, bottom - top);
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const common = {
      ...shape,
      x: centerX + scrollOffsetRef.current.left,
      y: centerY + scrollOffsetRef.current.top
    };

    if (shape.type === 'circle') {
      return {
        ...common,
        radius: Math.max(12, Math.min(width, height) / 2)
      };
    }

    if (shape.type === 'line' || shape.type === 'arrow' || shape.type === 'double-arrow' || shape.type === 'curved-arrow') {
      return {
        ...common,
        width: Math.max(24, width)
      };
    }

    if (shape.type === 'array' || shape.type === 'sll' || shape.type === 'dll') {
      const count = Math.max(1, shape.count || 1);
      const cellsPerNode = shape.type === 'dll' ? 3 : shape.type === 'sll' ? 2 : 1;
      const gap = shape.type === 'array' ? 2 : 18;
      const usableWidth = Math.max(24, width - (count - 1) * gap);
      const nodeWidth = usableWidth / count;
      const cellWidth = Math.max(16, nodeWidth / cellsPerNode);
      const cellHeight = Math.max(16, height);
      const finalWidth = count * (cellWidth * cellsPerNode) + (count - 1) * gap;

      return {
        ...common,
        cellWidth,
        cellHeight,
        width: finalWidth,
        height: cellHeight,
        blockSize: Math.max(16, Math.round(Math.min(cellWidth, cellHeight)))
      };
    }

    if (shape.type === 'tree') {
      return {
        ...common,
        width: Math.max(40, width),
        height: Math.max(40, height),
        blockSize: Math.max(24, Math.round(Math.min(width, height) * 0.35))
      };
    }

    if (shape.type === 'text' || shape.type === 'pen') {
      return shape;
    }

    return {
      ...common,
      width: Math.max(24, width),
      height: Math.max(24, height)
    };
  }, []);

  useEffect(() => {
    const canvasNode = canvasRef.current;
    const containerNode = canvasContainerRef.current;
    if (!canvasNode || !containerNode) return;

    const syncSize = () => {
      const rect = containerNode.getBoundingClientRect();
      canvasNode.width = rect.width;
      canvasNode.height = rect.height;
      setViewportTick((current) => current + 1);
    };

    syncSize();
    resizeObserverRef.current = new ResizeObserver(syncSize);
    resizeObserverRef.current.observe(containerNode);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  const syncCanvasViewportToEditor = useCallback(() => {
    const editor = monacoEditorRef.current;
    if (!editor) return;

    scrollOffsetRef.current = {
      left: editor.getScrollLeft(),
      top: editor.getScrollTop()
    };
    setViewportTick((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!editorReady) return;

    const editor = monacoEditorRef.current;
    if (!editor) return;

    syncCanvasViewportToEditor();
    const disposable = editor.onDidScrollChange(() => {
      syncCanvasViewportToEditor();
    });
    monacoScrollDisposerRef.current = disposable;

    return () => {
      if (monacoScrollDisposerRef.current) {
        monacoScrollDisposerRef.current.dispose();
        monacoScrollDisposerRef.current = null;
      }
    };
  }, [editorReady, syncCanvasViewportToEditor]);

  const handleCanvasMouseDown = useCallback((e) => {
    const point = getMousePoint(e);
    if (!point) return;

    if (interactionMode !== 'shape') {
      passPointerThroughToEditor(e);
      return;
    }

    // Draw tool: start new path
    if (selectedTool === 'draw') {
      dragRef.current = null;
      resizeRef.current = null;
      rotateRef.current = null;
      setHoverShapeId(null);
      setSelectedShapeId(null);
      setCurrentPath([point]);
      setIsDrawing(true);
      const layer = canvasContainerRef.current;
      if (layer) layer.style.cursor = 'crosshair';
      return;
    }

    // Erase tool: start erasing
    if (selectedTool === 'erase') {
      dragRef.current = null;
      resizeRef.current = null;
      rotateRef.current = null;
      setHoverShapeId(null);
      setSelectedShapeId(null);
      setEraserPointer(point);
      erasedDuringStrokeRef.current = false;
      setIsErasing(true);
      eraseAtPoint(point);
      return;
    }

    const viewportPoint = {
      x: point.x - scrollOffsetRef.current.left,
      y: point.y - scrollOffsetRef.current.top
    };

    const orderedShapes = [...shapesRef.current].reverse();

    for (let i = 0; i < orderedShapes.length; i += 1) {
      const shape = orderedShapes[i];
      if (shape.type === 'pen') continue;

      const bounds = getShapeBounds(shape, scrollOffsetRef.current);
      const handle = getHandleAtPoint(viewportPoint, bounds, shape.type);

      if (handle) {
        if (handle === 'rotate') {
          rotateRef.current = {
            shapeId: shape.id
          };
        } else {
          resizeRef.current = {
            shapeId: shape.id,
            handle,
            bounds
          };
        }
        setHoverShapeId(shape.id);
        setSelectedShapeId(shape.id);
        updateCursor(point);
        return;
      }
    }

    const selectedShape = orderedShapes.find((shape) =>
      isPointInShape(point, shape, scrollOffsetRef.current)
    );

    if (selectedShape) {
      dragRef.current = {
        shapeId: selectedShape.id,
        startX: point.x,
        startY: point.y,
        shapeX: selectedShape.x,
        shapeY: selectedShape.y
      };
      setHoverShapeId(selectedShape.id);
      setSelectedShapeId(selectedShape.id);
      updateCursor(point);
      return;
    }

    // In shape mode, single-clicking empty space just clears hover.
    setHoverShapeId(null);
    updateCursor(point);
  }, [eraseAtPoint, getMousePoint, interactionMode, passPointerThroughToEditor, selectedTool, updateCursor]);

  const handleCanvasMouseMove = useCallback((e) => {
    const point = getMousePoint(e);
    if (!point) return;

    if (interactionMode !== 'shape') {
      return;
    }

    // Draw tool: accumulate points to current path
    if (selectedTool === 'draw' && isDrawing) {
      setCurrentPath((prev) => [...prev, point]);
      return;
    }

    // Erase tool: track pointer and erase at location
    if (selectedTool === 'erase') {
      setEraserPointer(point);
      if (isErasing) {
        eraseAtPoint(point);
      }
      return;
    }

    if (resizeRef.current) {
      const viewportPoint = {
        x: point.x - scrollOffsetRef.current.left,
        y: point.y - scrollOffsetRef.current.top
      };

      const { shapeId, handle, bounds } = resizeRef.current;
      const nextShapes = shapesRef.current.map((shape) => {
        if (shape.id !== shapeId) return shape;
        return applyResize(shape, bounds, handle, viewportPoint);
      });

      shapesRef.current = nextShapes;
      setShapes(nextShapes);
      setHoverShapeId(shapeId);
      setSelectedShapeId(shapeId);
      updateCursor(point);
      return;
    }

    if (rotateRef.current) {
      const { shapeId } = rotateRef.current;
      const nextShapes = shapesRef.current.map((shape) => {
        if (shape.id !== shapeId) return shape;
        const angle = Math.atan2(point.y - shape.y, point.x - shape.x);
        return {
          ...shape,
          angle
        };
      });

      shapesRef.current = nextShapes;
      setShapes(nextShapes);
      setHoverShapeId(shapeId);
      setSelectedShapeId(shapeId);
      updateCursor(point);
      return;
    }

    if (dragRef.current) {
      const dx = point.x - dragRef.current.startX;
      const dy = point.y - dragRef.current.startY;

      const nextShapes = shapesRef.current.map((shape) => {
        if (shape.id !== dragRef.current.shapeId) return shape;
        return {
          ...shape,
          x: dragRef.current.shapeX + dx,
          y: dragRef.current.shapeY + dy
        };
      });

      shapesRef.current = nextShapes;
      setShapes(nextShapes);
      setHoverShapeId(dragRef.current.shapeId);
      setSelectedShapeId(dragRef.current.shapeId);
      updateCursor(point);
      return;
    }

    const hovered = [...shapesRef.current].reverse().find((shape) =>
      isPointInShape(point, shape, scrollOffsetRef.current)
    );
    setHoverShapeId(hovered?.id ?? null);

    updateCursor(point);
  }, [applyResize, eraseAtPoint, getMousePoint, interactionMode, isDrawing, isErasing, selectedTool, updateCursor]);

  const handleCanvasMouseUp = useCallback(() => {
    if (interactionMode !== 'shape') {
      return;
    }

    // Finish erasing stroke
    if (isErasing) {
      setIsErasing(false);
      if (erasedDuringStrokeRef.current) {
        pushHistory(captureSnapshot());
        updateStatus('Erased');
      }
      erasedDuringStrokeRef.current = false;
      return;
    }

    // Finish drawing stroke
    if (isDrawing) {
      if (currentPath.length > 1) {
        const penShape = {
          id: `shape-${Date.now()}-${Math.random()}`,
          type: 'pen',
          x: currentPath[0].x,
          y: currentPath[0].y,
          points: currentPath,
          strokeColor,
          fillColor,
          strokeWidth
        };

        const nextShapes = [...shapesRef.current, penShape];
        shapesRef.current = nextShapes;
        setShapes(nextShapes);
        pushHistory(captureSnapshot());
        updateStatus('Freehand added');
      }

      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }

    if (dragRef.current) {
      dragRef.current = null;
      pushHistory(captureSnapshot());
    }

    if (resizeRef.current) {
      const shapeId = resizeRef.current.shapeId;
      resizeRef.current = null;
      setHoverShapeId(shapeId);
      pushHistory(captureSnapshot());
    }

    if (rotateRef.current) {
      const shapeId = rotateRef.current.shapeId;
      rotateRef.current = null;
      setHoverShapeId(shapeId);
      pushHistory(captureSnapshot());
    }

    const layer = canvasContainerRef.current;
    if (layer) {
      if (selectedTool === 'draw' || selectedTool === 'erase') {
        layer.style.cursor = 'crosshair';
      } else {
        layer.style.cursor = 'default';
      }
    }
  }, [captureSnapshot, currentPath, fillColor, interactionMode, isDrawing, isErasing, pushHistory, selectedTool, strokeColor, strokeWidth, updateStatus]);

  const handleCanvasContextMenu = useCallback((e) => {
    e.preventDefault();

    const point = getMousePoint(e);
    if (!point) return;

    const hitShape = [...shapesRef.current].reverse().find((shape) =>
      isPointInShape(point, shape, scrollOffsetRef.current)
    );

    if (!hitShape) return;

    const nextShapes = shapesRef.current.filter((shape) => shape.id !== hitShape.id);
    shapesRef.current = nextShapes;
    setShapes(nextShapes);
    if (selectedShapeId === hitShape.id) {
      setSelectedShapeId(null);
    }
    setHoverShapeId(null);
    updateStatus(`${hitShape.type} deleted`);
    pushHistory(captureSnapshot());
  }, [captureSnapshot, getMousePoint, pushHistory, selectedShapeId, updateStatus]);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.index <= 0) return prev;
      const nextIndex = prev.index - 1;
      applySnapshot(prev.items[nextIndex]);
      return { ...prev, index: nextIndex };
    });
  }, [applySnapshot]);

  const handleRedo = useCallback(() => {
    setHistory((prev) => {
      if (prev.index >= prev.items.length - 1) return prev;
      const nextIndex = prev.index + 1;
      applySnapshot(prev.items[nextIndex]);
      return { ...prev, index: nextIndex };
    });
  }, [applySnapshot]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        exitShapeMode();
        e.preventDefault();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        handleUndo();
        e.preventDefault();
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        handleRedo();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exitShapeMode, handleRedo, handleUndo]);

  useEffect(() => {
    latestStateRef.current = { language, theme };
  }, [language, theme]);

  useEffect(() => {
    if (!editorReady) return;

    window.clearTimeout(codeHistoryTimerRef.current);
    codeHistoryTimerRef.current = window.setTimeout(() => {
      pushHistory(captureSnapshot());
    }, 450);

    return () => window.clearTimeout(codeHistoryTimerRef.current);
  }, [captureSnapshot, editorReady, language, pushHistory, theme]);

  const clearCanvas = useCallback(() => {
    shapesRef.current = [];
    setShapes([]);
    setSelectedShapeId(null);
    setHoverShapeId(null);
    setIsDrawing(false);
    setIsErasing(false);
    setEraserPointer(null);
    setCurrentPath([]);
    dragRef.current = null;
    resizeRef.current = null;
    rotateRef.current = null;
    setInteractionMode('code');
    pushHistory(captureSnapshot());
    updateStatus('Canvas cleared');
  }, [captureSnapshot, pushHistory, updateStatus]);

  const exportJSON = useCallback(() => {
    const payload = JSON.stringify(captureSnapshot(), null, 2);
    downloadText('codeipad-session.json', payload, 'application/json');
    updateStatus('Session exported');
  }, [captureSnapshot, updateStatus]);

  const handleManualSave = useCallback(() => {
    const code = monacoEditorRef.current?.getValue?.() || DEFAULT_CODE;
    const dataToSave = {
      code,
      shapes,
      language,
      theme,
      editorFontSize,
      blockSize,
      elementCount
    };
    saveToStorage(dataToSave);
  }, [shapes, language, theme, editorFontSize, blockSize, elementCount, saveToStorage]);

  const handleResetSession = useCallback(() => {
    if (window.confirm('Clear all saved data and reset? This cannot be undone.')) {
      clearStorage();
      // Reset all state to defaults
      setLanguage('plaintext');
      setTheme('light');
      setEditorFontSize(15);
      setBlockSize(60);
      setElementCount(5);
      setShapes([]);
      setInitialEditorCode(DEFAULT_CODE);
      setSelectedShapeId(null);
      setHoverShapeId(null);
      setHistory({ items: [], index: -1 });
      setInteractionMode('code');
      monacoEditorRef.current?.setValue?.(DEFAULT_CODE);
      updateStatus('Session reset to defaults');
    }
  }, [clearStorage, updateStatus]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
    updateStatus('Theme switched');
  }, [updateStatus]);

  const handleToolDragStart = useCallback((e, toolType) => {
    e.dataTransfer.setData('application/x-codeipad-tool', toolType);
  }, []);

  const handleShapesPanelDragStart = useCallback((e, toolType) => {
    handleToolDragStart(e, toolType);
    e.dataTransfer.setData('shape', toolType);
    setIsShapesPanelDragging(true);
    e.dataTransfer.effectAllowed = 'copyMove';
  }, [handleToolDragStart]);

  const handleShapesPanelDragEnd = useCallback(() => {
    setIsShapesPanelDragging(false);
  }, []);

  const handleToolSelect = useCallback((toolType) => {
    setSelectedTool(toolType);
    if (toolType === 'draw' || toolType === 'erase') {
      setInteractionMode('shape');
      setSelectedShapeId(null);
      setHoverShapeId(null);
      updateStatus(toolType === 'draw' ? 'Draw mode' : 'Erase mode');
    }

    if (toolType === 'select') {
      setInteractionMode('code');
      setSelectedShapeId(null);
      setHoverShapeId(null);
      monacoEditorRef.current?.focus();
      updateStatus('Code mode');
    }
    setIsDrawing(false);
    setCurrentPath([]);
    setIsErasing(false);
    setEraserPointer(null);
    dragRef.current = null;
    resizeRef.current = null;
    rotateRef.current = null;
    setMobileToolsOpen(false);
  }, [updateStatus]);

  const adjustEraseSize = useCallback((delta) => {
    setEraseSize((current) => clamp(current + delta, 8, 96));
  }, []);

  const applyEditorFontSize = useCallback((nextSize) => {
    const clamped = clamp(nextSize, 10, 72);
    setEditorFontSize(clamped);
    monacoEditorRef.current?.updateOptions({ fontSize: clamped });
  }, []);

  const toggleMobileTools = useCallback(() => {
    setMobileToolsOpen((current) => !current);
  }, []);

  const toggleShapesPanelPinned = useCallback(() => {
    setIsShapesPanelPinned((current) => !current);
  }, []);

  const fontSizeOptions = useMemo(() => {
    const merged = new Set([...FONT_SIZE_PRESETS, editorFontSize]);
    return [...merged].sort((a, b) => a - b);
  }, [editorFontSize]);

  const renderToolbarControls = () => {
    const basicTools = TOOL_ITEMS.slice(0, 3);

    return (
        <>
          {basicTools.map((tool) => (
            <React.Fragment key={tool.type}>
              <button
                type="button"
                title={tool.label}
                draggable
                onDragStart={(e) => handleToolDragStart(e, tool.type)}
                onClick={() => handleToolSelect(tool.type)}
                className={`tool-btn ${tool.type === selectedTool ? 'active' : ''}`}
              >
                <span className="tool-btn-icon">{tool.icon}</span>
              </button>

              {tool.type === 'erase' && (
                <div className="eraser-size-inline" title="Eraser Size">
                  <button
                    type="button"
                    className="eraser-size-step"
                    onClick={() => adjustEraseSize(-2)}
                    aria-label="Decrease eraser size"
                  >
                    −
                  </button>
                  <span className="eraser-size-value">{eraseSize}</span>
                  <button
                    type="button"
                    className="eraser-size-step"
                    onClick={() => adjustEraseSize(2)}
                    aria-label="Increase eraser size"
                  >
                    +
                  </button>
                </div>
              )}
            </React.Fragment>
          ))}

          <div className="toolbar-divider" />

          <label className="toolbar-field" title="Programming Language">
            <span className="toolbar-field-label">Lang</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="toolbar-select"
            >
              {LANGUAGES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="toolbar-field" title="Font Size">
            <span className="toolbar-field-label">Font</span>
            <select
              value={editorFontSize}
              onChange={(e) => applyEditorFontSize(Number(e.target.value))}
              className="toolbar-select"
            >
              {fontSizeOptions.map((size) => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>
          </label>

          <label className="toolbar-field" title="Block Size">
            <span className="toolbar-field-label">Block</span>
            <select
              value={blockSize}
              onChange={(e) => setBlockSize(Number(e.target.value))}
              className="toolbar-select"
            >
              {BLOCK_SIZE_PRESETS.map((size) => (
                <option key={size} value={size}>B{size}</option>
              ))}
            </select>
          </label>

          <label className="toolbar-field" title="Elements Count">
            <span className="toolbar-field-label">Count</span>
            <select
              value={elementCount}
              onChange={(e) => setElementCount(Number(e.target.value))}
              className="toolbar-select"
            >
              {ELEMENT_COUNT_PRESETS.map((count) => (
                <option key={count} value={count}>N{count}</option>
              ))}
            </select>
          </label>

          <div className="toolbar-divider" />

          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            title="Stroke Color"
            className="toolbar-color"
          />

          <input
            type="color"
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            title="Fill Color"
            className="toolbar-color"
          />

          <label className="toolbar-field" title="Stroke Width">
            <span className="toolbar-field-label">Width</span>
            <select
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="toolbar-select"
            >
              {SIZE_PRESETS.map((size) => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>
          </label>
        </>
    );
  };

  const handleDropOnCanvas = useCallback((e) => {
    e.preventDefault();
    const toolType = e.dataTransfer.getData('application/x-codeipad-tool') || e.dataTransfer.getData('shape');

    if (!toolType) {
      setIsShapesPanelDragging(false);
      return;
    }

    if (toolType === 'draw' || toolType === 'erase' || toolType === 'select') {
      handleToolSelect(toolType);
      updateStatus(`${toolType} tool selected`);
      setIsShapesPanelDragging(false);
      return;
    }

    const point = getMousePoint(e);
    if (!point) {
      setIsShapesPanelDragging(false);
      return;
    }

    createShape(toolType, point);
    pushHistory(captureSnapshot());
    setIsShapesPanelDragging(false);
  }, [captureSnapshot, createShape, getMousePoint, handleToolSelect, pushHistory, updateStatus]);

  const renderShapesPanel = () => {
    const isShapesPanelExpanded = isShapesPanelPinned || isShapesPanelDragging || isShapesPanelHot;

    return (
      <>
        <div
          className="shapes-hover-zone"
          aria-hidden="true"
          onMouseEnter={() => setIsShapesPanelHot(true)}
          onMouseLeave={() => {
            if (!isShapesPanelPinned) {
              setIsShapesPanelHot(false);
            }
          }}
          title="Hover to open shapes panel"
        />

        <aside
          className={`shapes-panel ${isShapesPanelPinned ? 'pinned' : ''} ${isShapesPanelDragging ? 'dragging' : ''} ${isShapesPanelExpanded ? 'expanded' : ''}`}
          aria-label="Shapes panel"
          onMouseEnter={() => setIsShapesPanelHot(true)}
          onMouseLeave={() => {
            if (!isShapesPanelPinned && !isShapesPanelDragging) {
              setIsShapesPanelHot(false);
            }
          }}
        >
          <div className="shapes-content">
            <div className="shapes-panel-head">
              <span className="shapes-panel-title">Shapes</span>
              <button
                type="button"
                className={`shapes-pin-btn ${isShapesPanelPinned ? 'active' : ''}`}
                onClick={toggleShapesPanelPinned}
                title={isShapesPanelPinned ? 'Unpin panel' : 'Pin panel'}
              >
                {isShapesPanelPinned ? 'Unpin' : 'Pin'}
              </button>
            </div>

            {SHAPE_PANEL_GROUPS.map((group) => (
              <section key={group.title} className="shapes-group">
                <div className="shapes-group-title">{group.title}</div>
                <div className="shapes-group-items">
                  {group.items.map((toolType) => {
                    const tool = TOOL_ITEMS.find((item) => item.type === toolType);
                    if (!tool) return null;

                    return (
                      <button
                        key={tool.type}
                        type="button"
                        className={`shape-item ${selectedTool === tool.type ? 'active' : ''}`}
                        draggable
                        onDragStart={(e) => handleShapesPanelDragStart(e, tool.type)}
                        onDragEnd={handleShapesPanelDragEnd}
                        onClick={() => handleToolSelect(tool.type)}
                        title={tool.label}
                      >
                        <span className="shape-item-icon">{tool.icon}</span>
                        <span className="shape-item-label">{tool.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </aside>

        <div className={`shapes-panel-hint ${isShapesPanelExpanded ? 'hidden' : ''}`}>
          Shapes panel on right
        </div>
      </>
    );
  };

  const handleDropOnEditor = useCallback((e) => {
    e.preventDefault();
    handleDropOnCanvas(e);
  }, [handleDropOnCanvas]);

  const editorOptions = useMemo(() => ({
    fontSize: editorFontSize,
    minimap: { enabled: false },
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    automaticLayout: true,
    fontLigatures: true,
    roundedSelection: true,
    lineNumbers: 'on',
    lineNumbersMinChars: 2,
    glyphMargin: false,
    lineDecorationsWidth: 2,
    renderLineHighlight: 'all',
    tabSize: 2,
    padding: { top: 16, bottom: 16 },
    scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 }
  }), [editorFontSize]);

  return (
    <div className="app-shell" data-theme={theme}>
      <div className="editor-container">
        {renderShapesPanel()}

        <MonacoPane
          language={language}
          theme={monacoTheme}
          initialCode={initialEditorCode}
          options={editorOptions}
          onDrop={handleDropOnEditor}
          onDragOver={(e) => e.preventDefault()}
          onEditorDoubleClick={handleEditorDoubleClick}
          onEditorMount={(editor) => {
            monacoEditorRef.current = editor;
            setEditorReady(true);
            syncCanvasViewportToEditor();
            updateStatus('Editor ready');
          }}
        />

        <div
          className="canvas-layer"
          ref={canvasContainerRef}
          onDrop={handleDropOnCanvas}
          onDragOver={(e) => e.preventDefault()}
          onDoubleClick={handleCanvasDoubleClick}
          onContextMenu={handleCanvasContextMenu}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => {
            setEraserPointer(null);
            handleCanvasMouseUp();
          }}
        >
          <canvas ref={canvasRef} className="canvas-element" />
        </div>
      </div>

      <div className="top-toolbar">
        <div className="toolbar-left">
          <div className="brand">codeipad</div>
        </div>

        <div className="toolbar-center">
          {renderToolbarControls()}
        </div>

        <div className="toolbar-right">
          <button type="button" className="toolbar-icon-btn" onClick={handleUndo} disabled={history.index <= 0} title="Undo">↶</button>
          <button type="button" className="toolbar-icon-btn" onClick={handleRedo} disabled={history.index >= history.items.length - 1} title="Redo">↷</button>
          <button
            type="button"
            className="toolbar-icon-btn mobile-tools-btn"
            onClick={toggleMobileTools}
            aria-expanded={mobileToolsOpen}
            aria-controls="mobile-tools-panel"
            title="Tools"
          >
            ☰
          </button>
          <button type="button" className="toolbar-icon-btn" onClick={clearCanvas} title="Clear Canvas">✕</button>
          <button type="button" className="toolbar-icon-btn" onClick={exportJSON} title="Export JSON">↓</button>
          <button type="button" className="toolbar-icon-btn" onClick={handleManualSave} title="Save to Storage">💾</button>
          <button type="button" className="toolbar-icon-btn" onClick={handleResetSession} title="Reset All Data">⟲</button>
          <button type="button" className="toolbar-icon-btn" onClick={toggleTheme} title="Toggle Theme">{theme === 'light' ? '🌙' : '☀'}</button>
        </div>
      </div>

      <div className={`mobile-tools-panel ${mobileToolsOpen ? 'open' : ''}`} id="mobile-tools-panel" aria-hidden={!mobileToolsOpen}>
        <div className="mobile-tools-panel-inner">
          {renderToolbarControls()}
        </div>
      </div>

      <div className="status-bar">{status}</div>
    </div>
  );
}

export default App;
