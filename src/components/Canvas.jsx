import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Circle, Arrow, Transformer, Path } from 'react-konva';
import '../styles/Canvas.css';

const Canvas = React.forwardRef(({
  arrays,
  structures,
  shapes,
  selectedShapeId,
  onSelectShape,
  onShapeUpdate,
  activeArrayId,
  onArrayActivate,
  onArrayMove,
  onArrayResize,
  onDropArray,
  onDeleteArray,
  onStructureMove,
  onStructureResize,
  onStructureValueChange,
  onDeleteStructure,
  onDropStructure,
  textAnnotations,
  onDropShape,
  onDeleteShape,
  onCellValueChange,
  onCellRightClick,
  onCellHover,
  onTextMove,
  onTextRemove,
  onAddTextAtPosition,
  onUpdateTextContent,
  canvasBackground,
  canvasColor,
  canvasFont,
  textColor,
  textStyle,
  textFontSize,
}, ref) => {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const transformerRef = useRef(null);
  const arrayTransformerRef = useRef(null);
  const structureTransformerRef = useRef(null);
  const shapeRefs = useRef({});
  const arrayRefs = useRef({});
  const structureRefs = useRef({});
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [selectedArrayId, setSelectedArrayId] = useState(null);
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const [selectedStructureId, setSelectedStructureId] = useState(null);
  const [editingStructure, setEditingStructure] = useState(null);
  const [editingStructureValue, setEditingStructureValue] = useState('');
  const [editingStructureField, setEditingStructureField] = useState(null); // 'prev', 'data', or 'next'
  const [contextMenu, setContextMenu] = useState(null); // { x, y, type, id }
  const [stageTransform, setStageTransform] = useState({ x: 0, y: 0, scale: 1 });

  const CELL_WIDTH = 50;
  const CELL_HEIGHT = 50;
  const INDEX_HEIGHT = 28;
  const START_X = 90;
  const START_Y = 120;
  const CELL_SPACING = 8;
  const ARRAY_GAP = 70;
  const STRUCT_NODE_SIZE = 32;
  const LIST_NODE_WIDTH = 46;
  const LIST_NODE_HEIGHT = 30;
  const LIST_NODE_GAP = 30;

  const getTextStyleProps = (style) => {
    const baseProps = {
      none: { shadowColor: 'transparent', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0 },
      neon: { 
        shadowColor: '#5e7ded', 
        shadowBlur: 2, 
        shadowOffsetX: 0, 
        shadowOffsetY: 0,
        stroke: '#5e7ded',
        strokeWidth: 0.3
      },
      'outer-glow': {
        shadowColor: '#667eea',
        shadowBlur: 3,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        stroke: '#667eea',
        strokeWidth: 0.15,
        shadowForStrokeEnabled: true
      },
      'soft-glow': {
        shadowColor: '#ffd700',
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        opacity: 0.95
      },
      'inner-glow': {
        shadowColor: '#ff69b4',
        shadowBlur: 8,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        stroke: '#ff69b4',
        strokeWidth: 0.3
      },
      'light-beam': {
        shadowColor: '#667eea',
        shadowBlur: 25,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        strokeWidth: 1
      },
      aura: {
        shadowColor: '#ff00ff',
        shadowBlur: 18,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        opacity: 0.92
      },
      hologram: {
        shadowColor: '#00ffff',
        shadowBlur: 12,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        stroke: '#00ffff',
        strokeWidth: 0.2,
        opacity: 0.85
      }
    };
    return baseProps[style] || baseProps.none;
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resizeTextArea = (el, value, fontSize = 14) => {
    if (!el) return;
    const lines = (value || '').split('\n');
    const maxLineLength = Math.max(1, ...lines.map((line) => line.length));
    const estimatedWidth = Math.ceil(maxLineLength * fontSize * 0.62) + 16;
    const width = Math.min(900, Math.max(120, estimatedWidth));
    el.style.width = `${width}px`;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (editingTextId && inputRef.current) {
      const el = inputRef.current;
      const currentText = textAnnotations.find((t) => t.id === editingTextId);
      const currentFontSize = currentText?.fontSize || 14;
      resizeTextArea(el, editingTextValue, currentFontSize);
    }
  }, [editingTextId, editingTextValue, textAnnotations]);

  const getArrayBaseY = (arrayIndex) => {
    return START_Y + arrayIndex * (CELL_HEIGHT + INDEX_HEIGHT + ARRAY_GAP);
  };

  const getCellPositionBase = (arrayIndex, index) => {
    return {
      x: START_X + index * (CELL_WIDTH + CELL_SPACING),
      y: getArrayBaseY(arrayIndex)
    };
  };

  const getCellPositionAbsolute = (arrayIndex, index, array) => {
    const base = getCellPositionBase(arrayIndex, index);
    return {
      x: base.x + (array.offsetX || 0),
      y: base.y + (array.offsetY || 0)
    };
  };

  const handleCellClickEvent = (arrayId, arrayIndex, index) => {
    onArrayActivate(arrayId);
    setSelectedArrayId(arrayId);
    setIsDraggingObject(true);
  };

  const handleCellDoubleClickEvent = (arrayId, arrayIndex, index) => {
    const currentArray = arrays.find((a) => a.id === arrayId);
    const pos = getCellPositionAbsolute(arrayIndex, index, currentArray);
    const customSize = currentArray.cellSizes?.[index];
    const currentCellWidth = customSize?.width || CELL_WIDTH;
    const currentCellHeight = customSize?.height || CELL_HEIGHT;
    
    let stageX = 0;
    let stageY = 0;
    let stageScale = 1;
    if (stageRef.current) {
      const stagePos = stageRef.current.getPosition();
      stageX = stagePos.x;
      stageY = stagePos.y;
      stageScale = stageRef.current.scaleX();
    }
    
    const scrollX = containerRef.current?.scrollLeft || 0;
    const scrollY = containerRef.current?.scrollTop || 0;
    const containerX = pos.x * stageScale + stageX + scrollX;
    const containerY = pos.y * stageScale + stageY + scrollY;
    
    setEditingCell({
      arrayId,
      index,
      x: containerX,
      y: containerY,
      width: currentCellWidth,
      height: currentCellHeight
    });
    setEditingValue(currentArray?.values[index] ?? '');
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const commitEdit = () => {
    if (editingCell) {
      onCellValueChange(editingCell.arrayId, editingCell.index, editingValue);
    }
    setEditingCell(null);
  };

  const cancelEdit = () => {
    setEditingCell(null);
  };

  const handleTextDoubleClick = (textId, text) => {
    const textAnnotation = textAnnotations.find(t => t.id === textId);
    if (!textAnnotation) return;

    setEditingTextId(textId);
    setEditingTextValue(text);

    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const commitTextEdit = () => {
    if (editingTextId && editingTextValue !== '') {
      onUpdateTextContent(editingTextId, editingTextValue);
    }
    setEditingTextId(null);
  };

  const cancelTextEdit = () => {
    setEditingTextId(null);
  };

  const handleStageDoubleClick = (e) => {
    // Only add text if clicking on empty Stage
    if (e.target === e.target.getStage() && onAddTextAtPosition) {
      const stage = stageRef.current;
      if (!stage) return;

      // Get click position relative to the stage
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        // Convert to stage coordinates
        const stagePos = stage.getPosition();
        const stageX = (pointerPos.x - stagePos.x) / stage.scaleX();
        const stageY = (pointerPos.y - stagePos.y) / stage.scaleY();
        
        // Create the text annotation
        const textId = Date.now();
        onAddTextAtPosition(stageX, stageY, textId);
        
        // Immediately enter edit mode
        setEditingTextId(textId);
        setEditingTextValue('');
        
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const shapeType = e.dataTransfer.getData('application/shape');
    const arrayType = e.dataTransfer.getData('application/array');
    const structureType = e.dataTransfer.getData('application/structure');
    
    if (!containerRef.current || !stageRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const stagePos = stageRef.current.getPosition();
    const stageScale = stageRef.current.scaleX();
    const stageX = (x - stagePos.x) / stageScale;
    const stageY = (y - stagePos.y) / stageScale;

    if (shapeType && onDropShape) {
      onDropShape(shapeType, { x: stageX, y: stageY });
    } else if (arrayType && onDropArray) {
      onDropArray(stageX, stageY);
    } else if (structureType && onDropStructure) {
      onDropStructure(structureType, stageX, stageY);
    }
  };

  const handleContextMenu = (e, type, id) => {
    e.evt.preventDefault();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    
    setContextMenu({
      x: e.evt.clientX - containerRect.left,
      y: e.evt.clientY - containerRect.top,
      type,
      id
    });
  };

  const handleDeleteItem = () => {
    if (!contextMenu) return;
    
    switch (contextMenu.type) {
      case 'array':
        onDeleteArray?.(contextMenu.id);
        break;
      case 'structure':
        onDeleteStructure?.(contextMenu.id);
        break;
      case 'shape':
        onDeleteShape?.(contextMenu.id);
        break;
      case 'text':
        onTextRemove?.(contextMenu.id);
        break;
    }
    
    setContextMenu(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleShapeTransformEnd = (shape) => {
    const node = shapeRefs.current[shape.id];
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    if (shape.type === 'rectangle') {
      const newWidth = Math.max(20, node.width() * scaleX);
      const newHeight = Math.max(20, node.height() * scaleY);
      node.scaleX(1);
      node.scaleY(1);
      onShapeUpdate(shape.id, { width: newWidth, height: newHeight, x: node.x(), y: node.y() });
      return;
    }

    if (shape.type === 'circle') {
      const newRadius = Math.max(10, node.radius() * Math.max(scaleX, scaleY));
      node.scaleX(1);
      node.scaleY(1);
      onShapeUpdate(shape.id, { radius: newRadius, x: node.x(), y: node.y() });
      return;
    }

    if (shape.type === 'line' || shape.type === 'arrowUp' || shape.type === 'arrowDown') {
      const points = node.points();
      const newPoints = points.map((p, i) => (i % 2 === 0 ? p * scaleX : p * scaleY));
      node.scaleX(1);
      node.scaleY(1);
      onShapeUpdate(shape.id, { points: newPoints, x: node.x(), y: node.y() });
    }
  };

  const handleSelectShapeId = (id) => {
    onSelectShape(id);
    setSelectedArrayId(null);
    setSelectedStructureId(null);
  };

  const handleSelectArray = (arrayId) => {
    onArrayActivate(arrayId);
    setSelectedArrayId(arrayId);
    setSelectedStructureId(null);
    onSelectShape(null);
  };

  const handleSelectStructure = (structureId) => {
    setSelectedStructureId(structureId);
    setSelectedArrayId(null);
    onSelectShape(null);
  };

  useEffect(() => {
    if (!transformerRef.current) return;
    const node = selectedShapeId ? shapeRefs.current[selectedShapeId] : null;
    if (node) {
      transformerRef.current.nodes([node]);
    } else {
      transformerRef.current.nodes([]);
    }
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedShapeId, shapes]);

  useEffect(() => {
    if (!arrayTransformerRef.current) return;
    let node = null;
    if (selectedArrayId) {
      node = arrayRefs.current[selectedArrayId];
    }
    if (node) {
      arrayTransformerRef.current.nodes([node]);
    } else {
      arrayTransformerRef.current.nodes([]);
    }
    arrayTransformerRef.current.getLayer()?.batchDraw();
  }, [selectedArrayId, arrays]);

  useEffect(() => {
    if (!structureTransformerRef.current) return;
    let node = null;
    if (selectedStructureId) {
      node = structureRefs.current[selectedStructureId];
    }
    if (node) {
      structureTransformerRef.current.nodes([node]);
    } else {
      structureTransformerRef.current.nodes([]);
    }
    structureTransformerRef.current.getLayer()?.batchDraw();
  }, [selectedStructureId]);

  const handleArrayResizeEnd = (arrayId) => {
    const node = arrayRefs.current[arrayId];
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Save the scale to state
    if (onArrayResize) {
      onArrayResize(arrayId, scaleX, scaleY);
    }

    // Reset node scale to 1 (scale is now stored in state)
    node.scaleX(1);
    node.scaleY(1);
  };

  const handleStructureResizeEnd = (structureId) => {
    const node = structureRefs.current[structureId];
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Only update if scale actually changed
    if ((scaleX !== 1 || scaleY !== 1) && onStructureResize) {
      onStructureResize(structureId, scaleX, scaleY);
      // Reset node scale to 1 (scale is now stored in state)
      node.scaleX(1);
      node.scaleY(1);
      // Keep structure selected after resize
      setSelectedStructureId(structureId);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (!stageRef.current) return;

      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const pointerPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      // Determine zoom direction (scroll up = zoom in, scroll down = zoom out)
      const direction = e.deltaY > 0 ? -1 : 1;
      const zoomSpeed = 1.1;

      setStageTransform((prev) => {
        const oldScale = prev.scale;
        const newScale = direction > 0 ? oldScale * zoomSpeed : oldScale / zoomSpeed;
        const clampedScale = Math.max(0.5, Math.min(5, newScale));

        const mousePointTo = {
          x: (pointerPos.x - prev.x) / oldScale,
          y: (pointerPos.y - prev.y) / oldScale
        };

        const newPos = {
          x: pointerPos.x - mousePointTo.x * clampedScale,
          y: pointerPos.y - mousePointTo.y * clampedScale
        };

        return { x: newPos.x, y: newPos.y, scale: clampedScale };
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const shapeStyleProps = getTextStyleProps(textStyle);

  const getTreePositions = (size) => {
    return Array.from({ length: size }).map((_, i) => {
      const level = Math.floor(Math.log2(i + 1));
      const levelStart = Math.pow(2, level) - 1;
      const indexInLevel = i - levelStart;
      const nodesInLevel = Math.pow(2, level);
      const x = (indexInLevel - (nodesInLevel - 1) / 2) * 60;
      const y = level * 60;
      return { x, y };
    });
  };

  const getGraphPositions = (size) => {
    const radius = 60 + size * 2;
    return Array.from({ length: size }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / size;
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    });
  };

  const getStructureNodePosition = (structure, index) => {
    const size = Math.max(1, structure.size || 1);
    if (structure.type === 'tree') {
      const positions = getTreePositions(size);
      return { x: positions[index]?.x || 0, y: positions[index]?.y || 0, width: STRUCT_NODE_SIZE, height: STRUCT_NODE_SIZE };
    }
    if (structure.type === 'graph') {
      const positions = getGraphPositions(size);
      return { x: positions[index]?.x || 0, y: positions[index]?.y || 0, width: STRUCT_NODE_SIZE, height: STRUCT_NODE_SIZE };
    }
    if (structure.type === 'linked-list') {
      const boxWidth = 40;
      const nodeTotalWidth = boxWidth * 2 + 2 + 20; // +2 for separator, +20 for gap
      return { x: index * nodeTotalWidth, y: 0, width: boxWidth * 2 + 2, height: 40 };
    }
    return { x: 0, y: 0, width: STRUCT_NODE_SIZE, height: STRUCT_NODE_SIZE };
  };

  const handleStructureNodeDoubleClick = (structure, index, field = 'data') => {
    if (!stageRef.current) return;

    const nodePos = getStructureNodePosition(structure, index);
    const stagePos = stageRef.current.getPosition();
    const stageScale = stageRef.current.scaleX();
    const scrollX = containerRef.current?.scrollLeft || 0;
    const scrollY = containerRef.current?.scrollTop || 0;

    const scaleX = structure.scaleX || 1;
    const scaleY = structure.scaleY || 1;

    const containerX = (structure.x + nodePos.x * scaleX) * stageScale + stagePos.x + scrollX;
    const containerY = (structure.y + nodePos.y * scaleY) * stageScale + stagePos.y + scrollY;

    setEditingStructure({
      id: structure.id,
      index,
      type: structure.type,
      x: containerX - nodePos.width / 2,
      y: containerY - nodePos.height / 2,
      width: nodePos.width,
      height: nodePos.height
    });
    
    setEditingStructureField(field);
    
    // Handle linked list with data and next fields
    if (structure.type === 'linked-list') {
      setEditingStructureValue(structure.values?.[index]?.[field] ?? '');
    } else {
      setEditingStructureValue(structure.values?.[index] ?? '');
    }
    
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const commitStructureEdit = () => {
    if (editingStructure && onStructureValueChange) {
      if (editingStructure.type === 'linked-list') {
        // For linked list, update the specific field (prev, data, or next)
        const currentValue = structures.find(s => s.id === editingStructure.id)?.values?.[editingStructure.index] || {};
        const updatedValue = {
          ...currentValue,
          [editingStructureField]: editingStructureValue
        };
        onStructureValueChange(editingStructure.id, editingStructure.index, updatedValue);
      } else {
        onStructureValueChange(editingStructure.id, editingStructure.index, editingStructureValue);
      }
    }
    setEditingStructure(null);
    setEditingStructureField(null);
  };

  const cancelStructureEdit = () => {
    setEditingStructure(null);
  };

  const renderTree = (structure) => {
    const size = Math.max(1, structure.size || 1);
    const nodeRadius = 16;
    const levelGap = 60;
    const nodeGap = 60;
    const positions = Array.from({ length: size }).map((_, i) => {
      const level = Math.floor(Math.log2(i + 1));
      const levelStart = Math.pow(2, level) - 1;
      const indexInLevel = i - levelStart;
      const nodesInLevel = Math.pow(2, level);
      const x = (indexInLevel - (nodesInLevel - 1) / 2) * nodeGap;
      const y = level * levelGap;
      return { x, y };
    });

    return (
      <Group
        key={`structure-${structure.id}`}
        ref={(node) => { structureRefs.current[structure.id] = node; }}
        x={structure.x}
        y={structure.y}
        scaleX={structure.scaleX || 1}
        scaleY={structure.scaleY || 1}
        draggable
        onClick={() => handleSelectStructure(structure.id)}
        onTap={() => handleSelectStructure(structure.id)}
        onDragEnd={(e) => onStructureMove?.(structure.id, e.target.x(), e.target.y())}
        onTransformEnd={() => handleStructureResizeEnd(structure.id)}
        onContextMenu={(e) => handleContextMenu(e, 'structure', structure.id)}
      >
        {positions.map((pos, i) => {
          if (i === 0) return null;
          const parentIndex = Math.floor((i - 1) / 2);
          const parent = positions[parentIndex];
          return (
            <Line
              key={`tree-line-${structure.id}-${i}`}
              points={[parent.x, parent.y, pos.x, pos.y]}
              stroke="#667eea"
              strokeWidth={2}
              {...shapeStyleProps}
            />
          );
        })}
        {positions.map((pos, i) => (
          <Group
            key={`tree-node-${structure.id}-${i}`}
            x={pos.x}
            y={pos.y}
            onDblClick={() => handleStructureNodeDoubleClick(structure, i)}
          >
            <Circle
              radius={nodeRadius}
              fill="#ffffff"
              stroke="#667eea"
              strokeWidth={2}
              {...shapeStyleProps}
            />
            <Text
              text={structure.values?.[i] ?? ''}
              fontSize={12}
              fontFamily={canvasFont}
              fill="#333"
              offsetX={-nodeRadius / 2}
              offsetY={-6}
            />
          </Group>
        ))}
      </Group>
    );
  };

  const renderGraph = (structure) => {
    const size = Math.max(1, structure.size || 1);
    const nodeRadius = 14;
    const radius = 60 + size * 2;
    const positions = Array.from({ length: size }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / size;
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    });

    return (
      <Group
        key={`structure-${structure.id}`}
        ref={(node) => { structureRefs.current[structure.id] = node; }}
        x={structure.x}
        y={structure.y}
        scaleX={structure.scaleX || 1}
        scaleY={structure.scaleY || 1}
        draggable
        onClick={() => handleSelectStructure(structure.id)}
        onTap={() => handleSelectStructure(structure.id)}
        onDragEnd={(e) => onStructureMove?.(structure.id, e.target.x(), e.target.y())}
        onTransformEnd={() => handleStructureResizeEnd(structure.id)}
      >
        {size > 1 && positions.map((pos, i) => {
          const next = positions[(i + 1) % size];
          return (
            <Line
              key={`graph-line-${structure.id}-${i}`}
              points={[pos.x, pos.y, next.x, next.y]}
              stroke="#667eea"
              strokeWidth={2}
              {...shapeStyleProps}
            />
          );
        })}
        {positions.map((pos, i) => (
          <Group
            key={`graph-node-${structure.id}-${i}`}
            x={pos.x}
            y={pos.y}
            onDblClick={() => handleStructureNodeDoubleClick(structure, i)}
          >
            <Circle
              radius={nodeRadius}
              fill="#ffffff"
              stroke="#667eea"
              strokeWidth={2}
              {...shapeStyleProps}
            />
            <Text
              text={structure.values?.[i] ?? ''}
              fontSize={11}
              fontFamily={canvasFont}
              fill="#333"
              offsetX={-nodeRadius / 2}
              offsetY={-6}
            />
          </Group>
        ))}
      </Group>
    );
  };

  const renderLinkedList = (structure) => {
    const size = Math.max(1, structure.size || 1);
    const listType = structure.subType || 'singly'; // singly, doubly, circular
    const boxWidth = 40;
    const boxHeight = 40;
    const gap = 25;
    let nodeTotalWidth;
    
    // Different widths for different list types
    if (listType === 'doubly') {
      nodeTotalWidth = boxWidth * 3 + 4; // prev | data | next (3 boxes with separators)
    } else {
      nodeTotalWidth = boxWidth * 2 + 2; // data | next (2 boxes with separator)
    }

    return (
      <Group
        key={`structure-${structure.id}`}
        ref={(node) => { structureRefs.current[structure.id] = node; }}
        x={structure.x}
        y={structure.y}
        scaleX={structure.scaleX || 1}
        scaleY={structure.scaleY || 1}
        draggable
        onClick={() => handleSelectStructure(structure.id)}
        onTap={() => handleSelectStructure(structure.id)}
        onDragEnd={(e) => onStructureMove?.(structure.id, e.target.x(), e.target.y())}  
        onTransformEnd={() => handleStructureResizeEnd(structure.id)}
        onContextMenu={(e) => handleContextMenu(e, 'structure', structure.id)}
      >
        {/* Label for list type */}
        <Text
          text={listType.charAt(0).toUpperCase() + listType.slice(1)}
          fontSize={10}
          fontFamily={canvasFont}
          fill="#667eea"
          x={0}
          y={-18}
          fontStyle="italic"
        />

        {Array.from({ length: size }).map((_, i) => {
          const x = i * (nodeTotalWidth + gap);
          const y = 0;
          return (
            <Group
              key={`list-node-${structure.id}-${i}`}
              x={x}
              y={y}
              onDblClick={() => handleStructureNodeDoubleClick(structure, i)}
            >
              {listType === 'doubly' ? (
                // Doubly Linked List: [prev | data | next]
                <>
                  {/* Prev Pointer Box */}
                  <Rect
                    width={boxWidth}
                    height={boxHeight}
                    fill="#f0f4ff"
                    stroke="#667eea"
                    strokeWidth={2}
                    cornerRadius={2}
                    {...shapeStyleProps}
                    onClick={() => handleStructureNodeDoubleClick(structure, i, 'prev')}
                    onDblClick={() => handleStructureNodeDoubleClick(structure, i, 'prev')}
                    onTap={() => handleStructureNodeDoubleClick(structure, i, 'prev')}
                  />
                  <Text
                    text={typeof structure.values?.[i] === 'object' ? (structure.values?.[i]?.prev ?? '') : ''}
                    fontSize={textFontSize || 14}
                    fontFamily={canvasFont}
                    fill="#333"
                    x={boxWidth / 2 - 6}
                    y={boxHeight / 2 - 7}
                  />

                  {/* Separator Line */}
                  <Line
                    points={[boxWidth, 0, boxWidth, boxHeight]}
                    stroke="#667eea"
                    strokeWidth={2}
                  />

                  {/* Data Box */}
                  <Rect
                    x={boxWidth}
                    width={boxWidth}
                    height={boxHeight}
                    fill="#ffffff"
                    stroke="#667eea"
                    strokeWidth={2}
                    cornerRadius={2}
                    {...shapeStyleProps}
                    onClick={() => handleStructureNodeDoubleClick(structure, i, 'data')}
                    onDblClick={() => handleStructureNodeDoubleClick(structure, i, 'data')}
                    onTap={() => handleStructureNodeDoubleClick(structure, i, 'data')}
                  />
                  <Text
                    text={typeof structure.values?.[i] === 'object' ? (structure.values?.[i]?.data ?? '') : (structure.values?.[i] ?? '')}
                    fontSize={textFontSize || 14}
                    fontFamily={canvasFont}
                    fill="#333"
                    x={boxWidth + boxWidth / 2 - 6}
                    y={boxHeight / 2 - 7}
                  />

                  {/* Separator Line */}
                  <Line
                    points={[boxWidth * 2, 0, boxWidth * 2, boxHeight]}
                    stroke="#667eea"
                    strokeWidth={2}
                  />

                  {/* Next Pointer Box */}
                  <Rect
                    x={boxWidth * 2}
                    width={boxWidth}
                    height={boxHeight}
                    fill="#f0f4ff"
                    stroke="#667eea"
                    strokeWidth={2}
                    cornerRadius={2}
                    {...shapeStyleProps}
                    onClick={() => handleStructureNodeDoubleClick(structure, i, 'next')}
                    onDblClick={() => handleStructureNodeDoubleClick(structure, i, 'next')}
                    onTap={() => handleStructureNodeDoubleClick(structure, i, 'next')}
                  />
                  <Text
                    text={typeof structure.values?.[i] === 'object' ? (structure.values?.[i]?.next ?? '') : ''}
                    fontSize={textFontSize || 14}
                    fontFamily={canvasFont}
                    fill="#333"
                    x={boxWidth * 2 + boxWidth / 2 - 6}
                    y={boxHeight / 2 - 7}
                  />

                  {/* Bidirectional arrows for doubly linked list */}
                  {i < size - 1 && (
                    <>
                      {/* Forward arrow */}
                      <Arrow
                        points={[boxWidth * 3, boxHeight / 2, boxWidth * 3 + gap - 4, boxHeight / 2]}
                        stroke="#667eea"
                        fill="#667eea"
                        strokeWidth={2}
                        pointerLength={6}
                        pointerWidth={6}
                        {...shapeStyleProps}
                      />
                      {/* Backward arrow */}
                      <Arrow
                        points={[boxWidth * 3 + gap - 4, boxHeight / 2 - 8, boxWidth * 3, boxHeight / 2 - 8]}
                        stroke="#ff6b6b"
                        fill="#ff6b6b"
                        strokeWidth={1.5}
                        pointerLength={6}
                        pointerWidth={6}
                        {...shapeStyleProps}
                      />
                    </>
                  )}
                </>
              ) : (
                // Singly Linked List: [data | next]
                <>
                  {/* Data Box */}
                  <Rect
                    width={boxWidth}
                    height={boxHeight}
                    fill="#ffffff"
                    stroke="#667eea"
                    strokeWidth={2}
                    cornerRadius={2}
                    {...shapeStyleProps}
                    onClick={() => handleStructureNodeDoubleClick(structure, i, 'data')}
                    onDblClick={() => handleStructureNodeDoubleClick(structure, i, 'data')}
                    onTap={() => handleStructureNodeDoubleClick(structure, i, 'data')}
                  />
                  <Text
                    text={structure.values?.[i]?.data ?? ''}
                    fontSize={textFontSize || 14}
                    fontFamily={canvasFont}
                    fill="#333"
                    x={boxWidth / 2 - 6}
                    y={boxHeight / 2 - 7}
                  />

                  {/* Separator Line */}
                  <Line
                    points={[boxWidth, 0, boxWidth, boxHeight]}
                    stroke="#667eea"
                    strokeWidth={2}
                  />

                  {/* Next Box */}
                  <Rect
                    x={boxWidth}
                    width={boxWidth}
                    height={boxHeight}
                    fill="#f0f4ff"
                    stroke="#667eea"
                    strokeWidth={2}
                    cornerRadius={2}
                    {...shapeStyleProps}
                    onClick={() => handleStructureNodeDoubleClick(structure, i, 'next')}
                    onDblClick={() => handleStructureNodeDoubleClick(structure, i, 'next')}
                    onTap={() => handleStructureNodeDoubleClick(structure, i, 'next')}
                  />
                  <Text
                    text={structure.values?.[i]?.next ?? ''}
                    fontSize={textFontSize || 14}
                    fontFamily={canvasFont}
                    fill="#333"
                    x={boxWidth + boxWidth / 2 - 6}
                    y={boxHeight / 2 - 7}
                  />
                </>
              )}
            </Group>
          );
        })}


      </Group>
    );
  };

  return (
    <div
      className={`canvas-container canvas-bg-${canvasBackground} canvas-color-${canvasColor || 'white'}`}
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => setContextMenu(null)}
    >
      {editingCell && (
        <input
          ref={inputRef}
          className="cell-input"
          style={{
            left: `${editingCell.x}px`,
            top: `${editingCell.y}px`,
            width: `${editingCell.width}px`,
            height: `${editingCell.height}px`,
            fontSize: '14px',
            color: textColor || '#000'
          }}
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commitEdit();
            }
            if (e.key === 'Escape') {
              cancelEdit();
            }
          }}
        />
      )}
      {editingTextId && (() => {
        const textAnn = textAnnotations.find(t => t.id === editingTextId);
        if (!textAnn || !stageRef.current) return null;
        
        // Get Stage's current position and scale
        const stagePos = stageRef.current.getPosition();
        const stageScale = stageRef.current.scaleX();
        
        // Calculate textarea position in container space
        const textX = textAnn.x * stageScale + stagePos.x;
        const textY = textAnn.y * stageScale + stagePos.y;
        
        return (
          <textarea
            ref={inputRef}
            className="text-annotation-input"
            style={{
              position: 'absolute',
              zIndex: 6,
              left: `${textX}px`,
              top: `${textY}px`,
              width: 'auto',
              height: 'auto',
              fontSize: `${textAnn.fontSize || 14}px`,
              fontFamily: canvasFont,
              border: '2px solid #667eea',
              borderRadius: '4px',
              padding: '0px',
              margin: '0px',
              outline: 'none',
              boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.15)',
              resize: 'none',
              background: 'transparent',
              color: textColor || '#000',
              whiteSpace: 'pre-wrap',
              overflow: 'hidden',
              minWidth: '120px',
              maxWidth: '900px'
            }}
            value={editingTextValue}
            onChange={(e) => {
              setEditingTextValue(e.target.value);
              if (inputRef.current) {
                resizeTextArea(inputRef.current, e.target.value, textAnn.fontSize || 14);
              }
            }}
            onBlur={commitTextEdit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                cancelTextEdit();
              }
            }}
          />
        );
      })()}
      {editingStructure && (
        <input
          ref={inputRef}
          className="cell-input"
          style={{
            left: `${editingStructure.x}px`,
            top: `${editingStructure.y}px`,
            width: `${editingStructure.width}px`,
            height: `${editingStructure.height}px`,
            fontSize: '13px',
            color: textColor || '#000'
          }}
          value={editingStructureValue}
          onChange={(e) => setEditingStructureValue(e.target.value)}
          onBlur={commitStructureEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commitStructureEdit();
            }
            if (e.key === 'Escape') {
              cancelStructureEdit();
            }
          }}
        />
      )}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'absolute',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '120px'
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              color: '#ff4444',
              fontWeight: '500'
            }}
            onClick={handleDeleteItem}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Delete
          </div>
        </div>
      )}
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        style={{ background: 'transparent' }}
        x={stageTransform.x}
        y={stageTransform.y}
        scaleX={stageTransform.scale}
        scaleY={stageTransform.scale}
        draggable={!isDraggingObject}
        onDragStart={() => {
          if (stageRef.current && !isDraggingObject) {
            stageRef.current.container().style.cursor = 'grabbing';
          }
        }}
        onDragMove={() => {
          if (stageRef.current) {
            setStageTransform((prev) => ({
              ...prev,
              x: stageRef.current.x(),
              y: stageRef.current.y()
            }));
          }
        }}
        onDragEnd={() => {
          if (stageRef.current) {
            stageRef.current.container().style.cursor = !isDraggingObject ? 'grab' : 'default';
            setStageTransform((prev) => ({
              ...prev,
              x: stageRef.current.x(),
              y: stageRef.current.y()
            }));
          }
        }}
        onMouseDown={(e) => {
          const clickedOnEmpty = e.target === e.target.getStage();
          if (clickedOnEmpty) {
            onSelectShape(null);
            setSelectedArrayId(null);
            setSelectedStructureId(null);
            setIsDraggingObject(false);
          } else {
            setIsDraggingObject(true);
          }
        }}
        onMouseUp={() => {
          setIsDraggingObject(false);
        }}
        onMouseEnter={() => {
          if (stageRef.current && !isDraggingObject) {
            stageRef.current.container().style.cursor = 'grab';
          }
        }}
        onMouseLeave={() => {
          if (stageRef.current) {
            stageRef.current.container().style.cursor = 'default';
          }
        }}
        onDblClick={handleStageDoubleClick}
      >
        {/* Shapes Layer */}
        <Layer>
          {shapes.map((shape) => {
            if (shape.type === 'circle') {
              return (
                <Circle
                  key={shape.id}
                  ref={(node) => { shapeRefs.current[shape.id] = node; }}
                  x={shape.x}
                  y={shape.y}
                  radius={shape.radius}
                  fill={shape.fill}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  {...shapeStyleProps}
                  draggable
                  onClick={() => handleSelectShapeId(shape.id)}
                  onTap={() => handleSelectShapeId(shape.id)}
                  onDragEnd={(e) => onShapeUpdate(shape.id, { x: e.target.x(), y: e.target.y() })}
                  onTransformEnd={() => handleShapeTransformEnd(shape)}
                />
              );
            }

            if (shape.type === 'line') {
              return (
                <Line
                  key={shape.id}
                  ref={(node) => { shapeRefs.current[shape.id] = node; }}
                  x={shape.x}
                  y={shape.y}
                  points={shape.points}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  {...shapeStyleProps}
                  draggable
                  onClick={() => handleSelectShapeId(shape.id)}
                  onTap={() => handleSelectShapeId(shape.id)}
                  onDragEnd={(e) => onShapeUpdate(shape.id, { x: e.target.x(), y: e.target.y() })}
                  onTransformEnd={() => handleShapeTransformEnd(shape)}
                  onContextMenu={(e) => handleContextMenu(e, 'shape', shape.id)}
                />
              );
            }

            if (shape.type === 'arrowUp' || shape.type === 'arrowDown' || shape.type === 'arrowLeft' || shape.type === 'arrowRight') {
              return (
                <Arrow
                  key={shape.id}
                  ref={(node) => { shapeRefs.current[shape.id] = node; }}
                  x={shape.x}
                  y={shape.y}
                  points={shape.points}
                  stroke={shape.stroke}
                  fill={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  pointerLength={shape.pointerLength}
                  pointerWidth={shape.pointerWidth}
                  {...shapeStyleProps}
                  draggable
                  onClick={() => handleSelectShapeId(shape.id)}
                  onTap={() => handleSelectShapeId(shape.id)}
                  onDragEnd={(e) => onShapeUpdate(shape.id, { x: e.target.x(), y: e.target.y() })}
                  onTransformEnd={() => handleShapeTransformEnd(shape)}
                  onContextMenu={(e) => handleContextMenu(e, 'shape', shape.id)}
                />
              );
            }

            if (shape.type === 'arcArrowUp' || shape.type === 'arcArrowDown') {
              const radius = shape.outerRadius || 40;
              const arcEndX = shape.type === 'arcArrowUp' ? -radius : radius;
              const arcEndY = shape.type === 'arcArrowUp' ? 0 : 0;
              
              const pathData = shape.type === 'arcArrowUp' 
                ? `M ${radius} 0 A ${radius} ${radius} 0 0 0 ${-radius} 0`
                : `M ${-radius} 0 A ${radius} ${radius} 0 0 0 ${radius} 0`;
              
              return (
                <Group
                  key={shape.id}
                  ref={(node) => { shapeRefs.current[shape.id] = node; }}
                  x={shape.x}
                  y={shape.y}
                  draggable
                  onClick={() => onSelectShape(shape.id)}
                  onTap={() => onSelectShape(shape.id)}
                  onDragEnd={(e) => onShapeUpdate(shape.id, { x: e.target.x(), y: e.target.y() })}
                  onTransformEnd={() => handleShapeTransformEnd(shape)}
                  onContextMenu={(e) => handleContextMenu(e, 'shape', shape.id)}
                >
                  <Path
                    data={pathData}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                    {...shapeStyleProps}
                  />
                  <Line
                    x={arcEndX}
                    y={arcEndY}
                    points={shape.type === 'arcArrowUp' ? [-6, -6, 0, 0, 6, -6] : [-6, 6, 0, 0, 6, 6]}
                    closed
                    fill={shape.stroke}
                    stroke={shape.stroke}
                    strokeWidth={1}
                    {...shapeStyleProps}
                  />
                </Group>
              );
            }

            return (
              <Rect
                key={shape.id}
                ref={(node) => { shapeRefs.current[shape.id] = node; }}
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                fill={shape.fill}
                stroke={shape.stroke}
                strokeWidth={shape.strokeWidth}
                cornerRadius={shape.cornerRadius}
                {...shapeStyleProps}
                draggable
                onClick={() => handleSelectShapeId(shape.id)}
                onTap={() => handleSelectShapeId(shape.id)}
                onDragEnd={(e) => onShapeUpdate(shape.id, { x: e.target.x(), y: e.target.y() })}
                onTransformEnd={() => handleShapeTransformEnd(shape)}
                onContextMenu={(e) => handleContextMenu(e, 'shape', shape.id)}
              />
            );
          })}
          <Transformer
            ref={transformerRef}
            rotateEnabled
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
          />
        </Layer>

        {/* Structures Layer */}
        <Layer>
          {structures?.map((structure) => {
            if (structure.type === 'tree') return renderTree(structure);
            if (structure.type === 'graph') return renderGraph(structure);
            if (structure.type === 'linked-list') return renderLinkedList(structure);
            return null;
          })}
        </Layer>

        {/* Structure Transformer Layer */}
        <Layer>
          <Transformer
            ref={structureTransformerRef}
            rotateEnabled={false}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
            padding={12}
            onTransformEnd={() => {
              if (selectedStructureId) handleStructureResizeEnd(selectedStructureId);
            }}
          />
        </Layer>

        {/* Array Transformer Layer */}
        <Layer>
          <Transformer
            ref={arrayTransformerRef}
            rotateEnabled={false}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
            padding={15}
            onTransformEnd={() => {
              if (selectedArrayId) handleArrayResizeEnd(selectedArrayId);
            }}
          />
        </Layer>

        {/* Main Layer - Arrays */}
        <Layer>
          {arrays.map((array, arrayIndex) => {
            const rowY = getArrayBaseY(arrayIndex);
            const isActive = array.id === activeArrayId;
            return (
              <Group
                key={`array-${array.id}`}
                draggable
                x={array.offsetX || 0}
                y={array.offsetY || 0}
                scaleX={array.scaleX || 1}
                scaleY={array.scaleY || 1}
                ref={(node) => { arrayRefs.current[array.id] = node; }}
                onDragEnd={(e) => onArrayMove(array.id, e.target.x(), e.target.y())}
                onClick={() => handleSelectArray(array.id)}
                onTap={() => handleSelectArray(array.id)}
                onContextMenu={(e) => handleContextMenu(e, 'array', array.id)}
              >
                {/* Array Label */}
                <Text
                  x={START_X - 70}
                  y={rowY - INDEX_HEIGHT - 2}
                  text={`A${arrayIndex + 1}`}
                  fontSize={12}
                  fontFamily={canvasFont}
                  fill={isActive ? '#667eea' : '#999'}
                  fontStyle="bold"
                />

                {/* Draw Index Row */}
                <Text
                  x={START_X - 80}
                  y={rowY - INDEX_HEIGHT}
                  text="Index"
                  fontSize={12}
                  fontFamily={canvasFont}
                  fill="#666"
                  fontStyle="bold"
                />
                {array.values.map((_, index) => (
                  <Text
                    key={`index-${array.id}-${index}`}
                    x={getCellPositionBase(arrayIndex, index).x + CELL_WIDTH / 2 - 12}
                    y={rowY - INDEX_HEIGHT}
                    text={index.toString()}
                    fontSize={12}
                    fontFamily={canvasFont}
                    fill="#333"
                    fontStyle="bold"
                  />
                ))}

                {/* Draw Value Label */}
                <Text
                  x={START_X - 80}
                  y={rowY + CELL_HEIGHT / 2 - 10}
                  text="Value"
                  fontSize={12}
                  fontFamily={canvasFont}
                  fill="#666"
                  fontStyle="bold"
                />

                {/* Draw Cells */}
                {array.values.map((value, index) => {
                  const pos = getCellPositionBase(arrayIndex, index);
                  const highlight = array.highlights[index];
                  const cellFill = highlight || '#FFFFFF';

                  return (
                    <Group 
                      key={`cell-${array.id}-${index}`} 
                      x={pos.x} 
                      y={pos.y}
                      draggable={false}
                      onClick={(e) => {
                        e.cancelBubble = true;
                        handleCellClickEvent(array.id, arrayIndex, index);
                      }}
                      onDblClick={(e) => {
                        e.cancelBubble = true;
                        handleCellDoubleClickEvent(array.id, arrayIndex, index);
                      }}
                    >
                      <Rect
                        width={CELL_WIDTH}
                        height={CELL_HEIGHT}
                        fill={cellFill}
                        stroke={isActive ? '#667eea' : '#333'}
                        strokeWidth={isActive ? 2.5 : 2}
                        cornerRadius={4}
                        listening={true}
                        cursor="pointer"
                      />

                      <Text
                        width={CELL_WIDTH}
                        height={CELL_HEIGHT}
                        text={value}
                        fontSize={14}
                        fontFamily={canvasFont}
                        fill="#000"
                        align="center"
                        verticalAlign="middle"
                        listening={false}
                      />
                    </Group>
                  );
                })}
              </Group>
            );
          })}
        </Layer>

        {/* Text Annotations Layer */}
        <Layer>
          {textAnnotations.map((ann) => {
            const styleProps = getTextStyleProps(ann.style);
            return (
              <Group
                key={`text-${ann.id}`}
                x={ann.x}
                y={ann.y}
                draggable
                onDragEnd={(e) => {
                  onTextMove(ann.id, e.target.x(), e.target.y());
                }}
                onClick={(e) => {
                  if (e.evt.detail === 2) {
                    onTextRemove(ann.id);
                  }
                }}
                onContextMenu={(e) => handleContextMenu(e, 'text', ann.id)}
                cursor="move"
              >
                <Text
                  x={0}
                  y={0}
                  text={ann.text}
                  fontSize={ann.fontSize}
                  fontFamily={ann.font || canvasFont}
                  fill={ann.color || '#000'}
                  wrap="none"
                  {...styleProps}
                  onDblClick={(e) => {
                    e.cancelBubble = true;
                    handleTextDoubleClick(ann.id, ann.text);
                  }}
                  cursor="text"
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
