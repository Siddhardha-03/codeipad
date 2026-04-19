import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import './App.css';

const DEFAULT_CODE = `function sum(a, b) {
  return a + b;
}

console.log(sum(2, 3));`;

const MAX_HISTORY = 40;
const HANDLE_SIZE = 8;

const TOOL_ITEMS = [
  { type: 'select', label: 'Select / Move', icon: '⌖' },
  { type: 'draw', label: 'Freehand Draw', icon: '✎' },
  { type: 'rectangle', label: 'Rectangle', icon: '▭' },
  { type: 'circle', label: 'Circle', icon: '◯' },
  { type: 'line', label: 'Straight Line', icon: '／' },
  { type: 'arrow', label: 'Arrow', icon: '→' },
  { type: 'double-arrow', label: 'Double Arrow', icon: '↔' },
  { type: 'curved-arrow', label: 'Curved Arrow', icon: '⤴' },
  { type: 'text', label: 'Text Note', icon: 'T' },
  { type: 'array', label: 'Array', icon: '[]' },
  { type: 'sll', label: 'Singly Linked List', icon: 'SLL' },
  { type: 'dll', label: 'Doubly Linked List', icon: 'DLL' },
  { type: 'tree', label: 'Tree', icon: '🌳' },
  { type: 'graph', label: 'Graph', icon: 'G' }
];

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'python', label: 'Python' },
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'markdown', label: 'Markdown' }
];

const SIZE_PRESETS = [1, 2, 3, 4, 5, 6, 8, 10, 12];
const FONT_SIZE_PRESETS = [12, 14, 15, 16, 18, 20, 22, 24];
const BLOCK_SIZE_PRESETS = [40, 50, 60, 70, 80, 100];
const ELEMENT_COUNT_PRESETS = [3, 4, 5, 6, 7, 8];

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

  if (shape.type === 'tree' || shape.type === 'graph') {
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

function getHandleAtPoint(point, bounds) {
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
  const block = shape.blockSize;
  const gap = withNextArrow ? 18 : 2;
  const count = shape.count;
  const startX = x - shape.width / 2;
  const top = y - shape.height / 2;

  ctx.fillStyle = hexToRgba(shape.fillColor, 0.08);
  ctx.strokeStyle = shape.strokeColor;
  ctx.lineWidth = shape.strokeWidth;

  for (let i = 0; i < count; i += 1) {
    const cellLeft = startX + i * (block + gap);
    ctx.strokeRect(cellLeft, top, block, block);
    ctx.fillRect(cellLeft, top, block, block);
    ctx.fillStyle = shape.strokeColor;
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(i), cellLeft + block / 2, top + block / 2 + 4);
    ctx.fillStyle = hexToRgba(shape.fillColor, 0.08);

    if (i < count - 1 && withNextArrow) {
      const midY = top + block / 2;
      const fromX = cellLeft + block;
      const toX = cellLeft + block + gap;

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
    ctx.fillStyle = shape.strokeColor;
    ctx.textAlign = 'center';
    ctx.font = '13px monospace';
    ctx.fillText(index === 0 ? 'R' : index === 1 ? 'L' : 'R', node.x, node.y + 4);
    ctx.fillStyle = hexToRgba(shape.fillColor, 0.12);
  });
}

function drawGraph(ctx, shape, x, y) {
  const radius = Math.min(shape.width, shape.height) * 0.34;
  const nodeRadius = Math.max(10, shape.blockSize * 0.18);

  const nodes = [
    { x, y: y - radius },
    { x: x + radius, y },
    { x, y: y + radius },
    { x: x - radius, y }
  ];

  ctx.strokeStyle = shape.strokeColor;
  ctx.fillStyle = hexToRgba(shape.fillColor, 0.12);
  ctx.lineWidth = shape.strokeWidth;

  const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]];
  edges.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(nodes[a].x, nodes[a].y);
    ctx.lineTo(nodes[b].x, nodes[b].y);
    ctx.stroke();
  });

  nodes.forEach((node, index) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = shape.strokeColor;
    ctx.textAlign = 'center';
    ctx.font = '12px monospace';
    ctx.fillText(String(index), node.x, node.y + 4);
    ctx.fillStyle = hexToRgba(shape.fillColor, 0.12);
  });
}

function drawShape(ctx, shape, scrollOffset) {
  const x = shape.x - scrollOffset.left;
  const y = shape.y - scrollOffset.top;

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
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x + w / 2, y);
    ctx.stroke();
    return;
  }

  if (shape.type === 'arrow' || shape.type === 'double-arrow') {
    drawArrow(ctx, x, y, shape);
    return;
  }

  if (shape.type === 'curved-arrow') {
    drawCurvedArrow(ctx, x, y, shape);
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
    return;
  }

  if (shape.type === 'graph') {
    drawGraph(ctx, shape, x, y);
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

  ctx.restore();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('light');
  const [editorReady, setEditorReady] = useState(false);

  const [selectedTool, setSelectedTool] = useState('select');
  const [strokeColor, setStrokeColor] = useState('#2563eb');
  const [fillColor, setFillColor] = useState('#2563eb');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [editorFontSize, setEditorFontSize] = useState(15);
  const [elementCount, setElementCount] = useState(5);
  const [blockSize, setBlockSize] = useState(60);
  const [status, setStatus] = useState('Ready');

  const [history, setHistory] = useState({ items: [], index: -1 });
  const [shapes, setShapes] = useState([]);
  const [activeShapeId, setActiveShapeId] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [viewportTick, setViewportTick] = useState(0);

  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const monacoEditorRef = useRef(null);
  const monacoScrollDisposerRef = useRef(null);
  const scrollOffsetRef = useRef({ left: 0, top: 0 });
  const resizeObserverRef = useRef(null);
  const codeHistoryTimerRef = useRef(null);
  const historyLockRef = useRef(false);
  const latestStateRef = useRef({ code: DEFAULT_CODE, language: 'javascript', theme: 'light' });
  const shapesRef = useRef([]);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs';

  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

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
    const canvas = canvasRef.current;
    const layer = canvasContainerRef.current;

    if (canvas) canvas.style.pointerEvents = value;
    if (layer) layer.style.pointerEvents = value === 'none' ? 'none' : 'auto';
  }, []);

  useEffect(() => {
    setCanvasPointerEvents('auto');
  }, [setCanvasPointerEvents]);

  const passPointerThroughToEditor = useCallback((sourceEvent) => {
    setCanvasPointerEvents('none');

    const editor = monacoEditorRef.current;
    if (editor) {
      const target = editor.getTargetAtClientPoint?.(sourceEvent.clientX, sourceEvent.clientY);
      if (target?.position) {
        editor.setPosition(target.position);
      }
      editor.focus();
    }

    window.setTimeout(() => {
      setCanvasPointerEvents('auto');
      monacoEditorRef.current?.focus();
    }, 0);
  }, [setCanvasPointerEvents]);

  const captureSnapshot = useCallback(() => {
    return {
      ...latestStateRef.current,
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
    setCode(snapshot.code ?? DEFAULT_CODE);
    setLanguage(snapshot.language ?? 'javascript');
    setTheme(snapshot.theme ?? 'light');
    setEditorFontSize(snapshot.editorFontSize ?? 15);
    setElementCount(snapshot.elementCount ?? 5);
    setBlockSize(snapshot.blockSize ?? 60);

    const nextShapes = snapshot.shapes ?? [];
    shapesRef.current = nextShapes;
    setShapes(nextShapes);
    setActiveShapeId(null);

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
      shape.count = elementCount;
      shape.blockSize = blockSize;
      shape.width = elementCount * blockSize + (elementCount - 1) * gap;
      shape.height = blockSize;
    } else if (toolType === 'tree') {
      shape.count = Math.max(3, elementCount);
      shape.blockSize = blockSize;
      shape.width = blockSize * 3.2;
      shape.height = blockSize * 2.2;
    } else if (toolType === 'graph') {
      shape.count = Math.max(4, elementCount);
      shape.blockSize = blockSize;
      shape.width = blockSize * 3;
      shape.height = blockSize * 3;
    }

    const nextShapes = [...shapesRef.current, shape];
    shapesRef.current = nextShapes;
    setShapes(nextShapes);
    setActiveShapeId(id);
    updateStatus(`${toolType} added`);
    return shape;
  }, [blockSize, elementCount, fillColor, strokeColor, strokeWidth, updateStatus]);

  const updateCursor = useCallback((point) => {
    const layer = canvasContainerRef.current;
    if (!layer || !point) return;

    if (dragRef.current) {
      layer.style.cursor = 'grabbing';
      return;
    }

    if (resizeRef.current) {
      layer.style.cursor = 'nwse-resize';
      return;
    }

    const activeShape = shapesRef.current.find((shape) => shape.id === activeShapeId);
    if (activeShape && activeShape.type !== 'pen') {
      const bounds = getShapeBounds(activeShape, scrollOffsetRef.current);
      const handle = getHandleAtPoint({
        x: point.x - scrollOffsetRef.current.left,
        y: point.y - scrollOffsetRef.current.top
      }, bounds);
      if (handle) {
        layer.style.cursor = 'nwse-resize';
        return;
      }
    }

    const hitShape = [...shapesRef.current].reverse().find((shape) =>
      isPointInShape(point, shape, scrollOffsetRef.current)
    );
    layer.style.cursor = hitShape ? 'move' : 'text';
  }, [activeShapeId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    shapes.forEach((shape) => {
      drawShape(ctx, shape, scrollOffsetRef.current);
      if (shape.id === activeShapeId) {
        drawResizeHandles(ctx, shape, scrollOffsetRef.current);
      }
    });

    if (isDrawing && currentPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      drawPen(ctx, currentPath, scrollOffsetRef.current);
      ctx.restore();
    }
  }, [activeShapeId, currentPath, isDrawing, shapes, strokeColor, strokeWidth, viewportTick]);

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

    const selectedShape = [...shapesRef.current].reverse().find((shape) =>
      isPointInShape(point, shape, scrollOffsetRef.current)
    );

    if (selectedShape) {
      const shapeBounds = getShapeBounds(selectedShape, scrollOffsetRef.current);
      const handle = selectedShape.id === activeShapeId
        ? getHandleAtPoint({
          x: point.x - scrollOffsetRef.current.left,
          y: point.y - scrollOffsetRef.current.top
        }, shapeBounds)
        : null;

      setActiveShapeId(selectedShape.id);

      if (handle && selectedShape.type !== 'pen') {
        resizeRef.current = {
          shapeId: selectedShape.id,
          handle,
          startX: point.x,
          startY: point.y,
          shape: JSON.parse(JSON.stringify(selectedShape))
        };
        updateCursor(point);
        return;
      }

      dragRef.current = {
        shapeId: selectedShape.id,
        startX: point.x,
        startY: point.y,
        shapeX: selectedShape.x,
        shapeY: selectedShape.y
      };
      updateCursor(point);
      return;
    }

    if (selectedTool === 'draw') {
      setIsDrawing(true);
      setCurrentPath([point]);
      updateStatus('Drawing...');
      return;
    }

    if (selectedTool !== 'select') {
      createShape(selectedTool, point);
      pushHistory(captureSnapshot());
      return;
    }

    setActiveShapeId(null);
    passPointerThroughToEditor(e);
  }, [activeShapeId, captureSnapshot, createShape, getMousePoint, passPointerThroughToEditor, pushHistory, selectedTool, updateCursor, updateStatus]);

  const applyResize = useCallback((currentPoint) => {
    const resizeState = resizeRef.current;
    if (!resizeState) return;

    const dx = currentPoint.x - resizeState.startX;
    const dy = currentPoint.y - resizeState.startY;

    const original = resizeState.shape;

    const resizeByBounds = (bounds) => {
      let left = bounds.left;
      let top = bounds.top;
      let right = bounds.left + bounds.width;
      let bottom = bounds.top + bounds.height;

      if (resizeState.handle.includes('n')) top += dy;
      if (resizeState.handle.includes('s')) bottom += dy;
      if (resizeState.handle.includes('w')) left += dx;
      if (resizeState.handle.includes('e')) right += dx;

      const nextWidth = clamp(right - left, 20, 2000);
      const nextHeight = clamp(bottom - top, 20, 2000);

      return {
        cx: left + nextWidth / 2,
        cy: top + nextHeight / 2,
        width: nextWidth,
        height: nextHeight
      };
    };

    const currentBounds = getShapeBounds(original, { left: 0, top: 0 });
    const next = resizeByBounds(currentBounds);

    const nextShapes = shapesRef.current.map((shape) => {
      if (shape.id !== resizeState.shapeId) return shape;

      const updated = { ...shape, x: next.cx, y: next.cy };

      if (shape.type === 'circle') {
        updated.radius = clamp(Math.max(next.width, next.height) / 2, 10, 1000);
      } else if (shape.type === 'line' || shape.type === 'arrow' || shape.type === 'double-arrow' || shape.type === 'curved-arrow') {
        updated.width = clamp(next.width, 40, 2000);
      } else if (shape.type === 'text') {
        updated.width = clamp(next.width, 120, 2000);
      } else if (shape.type !== 'pen') {
        updated.width = next.width;
        updated.height = next.height;
      }

      return updated;
    });

    shapesRef.current = nextShapes;
    setShapes(nextShapes);
  }, []);

  const handleCanvasMouseMove = useCallback((e) => {
    const point = getMousePoint(e);
    if (!point) return;

    if (isDrawing) {
      setCurrentPath((prev) => [...prev, point]);
      return;
    }

    if (resizeRef.current) {
      applyResize(point);
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
      updateCursor(point);
      return;
    }

    updateCursor(point);
  }, [applyResize, getMousePoint, isDrawing, updateCursor]);

  const handleCanvasMouseUp = useCallback(() => {
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
        setActiveShapeId(penShape.id);
        pushHistory(captureSnapshot());
        updateStatus('Freehand added');
      }

      setIsDrawing(false);
      setCurrentPath([]);
    }

    if (resizeRef.current) {
      resizeRef.current = null;
      pushHistory(captureSnapshot());
    }

    if (dragRef.current) {
      dragRef.current = null;
      pushHistory(captureSnapshot());
    }

    const layer = canvasContainerRef.current;
    if (layer) layer.style.cursor = 'text';
  }, [captureSnapshot, currentPath, fillColor, isDrawing, pushHistory, strokeColor, strokeWidth, updateStatus]);

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
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeShapeId) {
        const tag = e.target?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;

        const nextShapes = shapesRef.current.filter((shape) => shape.id !== activeShapeId);
        shapesRef.current = nextShapes;
        setShapes(nextShapes);
        setActiveShapeId(null);
        pushHistory(captureSnapshot());
        updateStatus('Deleted selected shape');
        e.preventDefault();
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
  }, [activeShapeId, captureSnapshot, handleRedo, handleUndo, pushHistory, updateStatus]);

  useEffect(() => {
    latestStateRef.current = { code, language, theme };
  }, [code, language, theme]);

  useEffect(() => {
    if (!editorReady) return;

    window.clearTimeout(codeHistoryTimerRef.current);
    codeHistoryTimerRef.current = window.setTimeout(() => {
      pushHistory(captureSnapshot());
    }, 450);

    return () => window.clearTimeout(codeHistoryTimerRef.current);
  }, [captureSnapshot, code, editorReady, language, pushHistory, theme]);

  const clearCanvas = useCallback(() => {
    shapesRef.current = [];
    setShapes([]);
    setActiveShapeId(null);
    setIsDrawing(false);
    setCurrentPath([]);
    pushHistory(captureSnapshot());
    updateStatus('Canvas cleared');
  }, [captureSnapshot, pushHistory, updateStatus]);

  const exportJSON = useCallback(() => {
    const payload = JSON.stringify(captureSnapshot(), null, 2);
    downloadText('codeipad-session.json', payload, 'application/json');
    updateStatus('Session exported');
  }, [captureSnapshot, updateStatus]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
    updateStatus('Theme switched');
  }, [updateStatus]);

  const handleToolDragStart = useCallback((e, toolType) => {
    e.dataTransfer.setData('application/x-codeipad-tool', toolType);
    setSelectedTool(toolType);
  }, []);

  const handleDropOnCanvas = useCallback((e) => {
    e.preventDefault();
    const toolType = e.dataTransfer.getData('application/x-codeipad-tool');
    if (!toolType || toolType === 'draw' || toolType === 'select') return;

    const point = getMousePoint(e);
    if (!point) return;

    createShape(toolType, point);
    pushHistory(captureSnapshot());
  }, [captureSnapshot, createShape, getMousePoint, pushHistory]);

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
    renderLineHighlight: 'all',
    tabSize: 2,
    padding: { top: 16, bottom: 16 },
    scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 }
  }), [editorFontSize]);

  return (
    <div className="app-shell" data-theme={theme}>
      <div className="editor-container">
        <div
          className="editor-wrapper"
          onDrop={handleDropOnEditor}
          onDragOver={(e) => e.preventDefault()}
        >
          <Editor
            height="100%"
            language={language}
            theme={monacoTheme}
            value={code}
            options={editorOptions}
            onChange={(value) => setCode(value ?? '')}
            onMount={(editor) => {
              monacoEditorRef.current = editor;
              setEditorReady(true);
              syncCanvasViewportToEditor();
              updateStatus('Editor ready');
            }}
          />
        </div>

        <div
          className="canvas-layer"
          ref={canvasContainerRef}
          onDrop={handleDropOnCanvas}
          onDragOver={(e) => e.preventDefault()}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          <canvas ref={canvasRef} className="canvas-element" style={{ pointerEvents: 'auto' }} />
        </div>
      </div>

      <div className="top-toolbar">
        <div className="toolbar-left">
          <div className="brand">codeipad</div>
        </div>

        <div className="toolbar-center">
          {TOOL_ITEMS.map((tool) => (
            <button
              key={tool.type}
              type="button"
              title={tool.label}
              draggable
              onDragStart={(e) => handleToolDragStart(e, tool.type)}
              onClick={() => setSelectedTool(tool.type)}
              className={`tool-btn ${selectedTool === tool.type ? 'active' : ''}`}
            >
              {tool.icon}
            </button>
          ))}

          <div className="toolbar-divider" />

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            title="Language"
            className="toolbar-select"
          >
            {LANGUAGES.map((item) => (
              <option key={item.value} value={item.value}>{item.label.substring(0, 3)}</option>
            ))}
          </select>

          <button
            type="button"
            className="toolbar-icon-btn"
            onClick={() => setEditorFontSize((prev) => clamp(prev - 1, 10, 36))}
            title="Decrease Font"
          >
            A-
          </button>
          <select
            value={editorFontSize}
            onChange={(e) => setEditorFontSize(Number(e.target.value))}
            title="Editor Font Size"
            className="toolbar-select"
          >
            {FONT_SIZE_PRESETS.map((size) => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
          <button
            type="button"
            className="toolbar-icon-btn"
            onClick={() => setEditorFontSize((prev) => clamp(prev + 1, 10, 36))}
            title="Increase Font"
          >
            A+
          </button>

          <select
            value={blockSize}
            onChange={(e) => setBlockSize(Number(e.target.value))}
            title="Block Size"
            className="toolbar-select"
          >
            {BLOCK_SIZE_PRESETS.map((size) => (
              <option key={size} value={size}>B{size}</option>
            ))}
          </select>

          <select
            value={elementCount}
            onChange={(e) => setElementCount(Number(e.target.value))}
            title="Elements Count"
            className="toolbar-select"
          >
            {ELEMENT_COUNT_PRESETS.map((count) => (
              <option key={count} value={count}>N{count}</option>
            ))}
          </select>

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

          <select
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            title="Stroke Width"
            className="toolbar-select"
          >
            {SIZE_PRESETS.map((size) => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
        </div>

        <div className="toolbar-right">
          <button type="button" className="toolbar-icon-btn" onClick={handleUndo} disabled={history.index <= 0} title="Undo">↶</button>
          <button type="button" className="toolbar-icon-btn" onClick={handleRedo} disabled={history.index >= history.items.length - 1} title="Redo">↷</button>
          <button type="button" className="toolbar-icon-btn" onClick={clearCanvas} title="Clear Canvas">✕</button>
          <button type="button" className="toolbar-icon-btn" onClick={exportJSON} title="Export JSON">↓</button>
          <button type="button" className="toolbar-icon-btn" onClick={toggleTheme} title="Toggle Theme">{theme === 'light' ? '🌙' : '☀'}</button>
        </div>
      </div>

      <div className="status-bar">{status}</div>
    </div>
  );
}

export default App;
