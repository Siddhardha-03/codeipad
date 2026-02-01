import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Circle, Arrow, Transformer, Arc, Path } from 'react-konva';
import '../styles/Canvas.css';

const Canvas = React.forwardRef(({
  arrays,
  shapes,
  selectedShapeId,
  onSelectShape,
  onShapeUpdate,
  activeArrayId,
  onArrayActivate,
  onArrayMove,
  cellFontSize,
  cellWidth,
  cellHeight,
  textAnnotations,
  onDropShape,
  onCellValueChange,
  onCellResize,
  onCellRightClick,
  onCellHover,
  onPointerRemove,
  onPointerMove,
  onTextMove,
  onTextRemove,
}, ref) => {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const transformerRef = useRef(null);
  const arrayTransformerRef = useRef(null);
  const shapeRefs = useRef({});
  const arrayRefs = useRef({});
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [selectedArrayId, setSelectedArrayId] = useState(null);

  const CELL_WIDTH = cellWidth;
  const CELL_HEIGHT = cellHeight;
  const INDEX_HEIGHT = 28;
  const START_X = 90;
  const START_Y = 120;
  const CELL_SPACING = 8;
  const ARRAY_GAP = 70;

  const POINTER_COLORS = {
    'i': '#FF6B6B',
    'j': '#4ECDC4',
    'low': '#95E1D3',
    'high': '#FFB84D',
    'left': '#A8D8EA',
    'right': '#FFB3BA',
    'mid': '#FFFACD',
    'start': '#B19CD9',
    'end': '#87CEEB',
    'current': '#FFD700'
  };

  // Handle window resize
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

  // Get cell position
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

  // Handle cell click
  const handleCellClickEvent = (arrayId, arrayIndex, index) => {
    onArrayActivate(arrayId);
    setSelectedArrayId(arrayId);
  };

  const handleCellDoubleClickEvent = (arrayId, arrayIndex, index) => {
    const currentArray = arrays.find((a) => a.id === arrayId);
    const pos = getCellPositionAbsolute(arrayIndex, index, currentArray);
    const customSize = currentArray.cellSizes?.[index];
    const currentCellWidth = customSize?.width || CELL_WIDTH;
    const currentCellHeight = customSize?.height || CELL_HEIGHT;
    
    setEditingCell({
      arrayId,
      index,
      x: pos.x,
      y: pos.y,
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

  // Handle cell right click
  const handleCellRightClickEvent = (arrayId, index, e) => {
    e.evt.preventDefault();
    onCellRightClick(arrayId, index);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const shapeType = e.dataTransfer.getData('application/shape');
    if (!shapeType || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onDropShape(shapeType, { x, y });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
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
  }, [selectedArrayId]);

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

  const handleCellTransformEnd = (arrayId, index, node) => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const array = arrays.find(a => a.id === arrayId);
    const customSize = array.cellSizes?.[index];
    const currentCellWidth = customSize?.width || CELL_WIDTH;
    const currentCellHeight = customSize?.height || CELL_HEIGHT;
    
    const newWidth = Math.max(40, Math.round(currentCellWidth * scaleX));
    const newHeight = Math.max(30, Math.round(currentCellHeight * scaleY));
    
    node.scaleX(1);
    node.scaleY(1);
    onCellResize(arrayId, index, newWidth, newHeight);
  };

  return (
    <div className="canvas-container" ref={containerRef} onDrop={handleDrop} onDragOver={handleDragOver}>
      {editingCell && (
        <input
          ref={inputRef}
          className="cell-input"
          style={{
            left: `${editingCell.x}px`,
            top: `${editingCell.y}px`,
            width: `${editingCell.width}px`,
            height: `${editingCell.height}px`,
            fontSize: `${cellFontSize}px`
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
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        style={{ background: '#ffffff' }}
        onMouseDown={(e) => {
          const clickedOnEmpty = e.target === e.target.getStage();
          if (clickedOnEmpty) {
            onSelectShape(null);
            setSelectedArrayId(null);
          }
        }}
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
                  draggable
                  onClick={() => onSelectShape(shape.id)}
                  onTap={() => onSelectShape(shape.id)}
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
                  draggable
                  onClick={() => onSelectShape(shape.id)}
                  onTap={() => onSelectShape(shape.id)}
                  onDragEnd={(e) => onShapeUpdate(shape.id, { x: e.target.x(), y: e.target.y() })}
                  onTransformEnd={() => handleShapeTransformEnd(shape)}
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
                  draggable
                  onClick={() => onSelectShape(shape.id)}
                  onTap={() => onSelectShape(shape.id)}
                  onDragEnd={(e) => onShapeUpdate(shape.id, { x: e.target.x(), y: e.target.y() })}
                  onTransformEnd={() => handleShapeTransformEnd(shape)}
                />
              );
            }

            if (shape.type === 'arcArrowUp' || shape.type === 'arcArrowDown') {
              const radius = shape.outerRadius || 40;
              const arcEndX = shape.type === 'arcArrowUp' ? -radius : radius;
              const arcEndY = shape.type === 'arcArrowUp' ? 0 : 0;
              
              // Create arc path without diameter lines
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
                >
                  <Path
                    data={pathData}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                  />
                  <Line
                    x={arcEndX}
                    y={arcEndY}
                    points={shape.type === 'arcArrowUp' ? [-6, -6, 0, 0, 6, -6] : [-6, 6, 0, 0, 6, 6]}
                    closed
                    fill={shape.stroke}
                    stroke={shape.stroke}
                    strokeWidth={1}
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
                draggable
                onClick={() => onSelectShape(shape.id)}
                onTap={() => onSelectShape(shape.id)}
                onDragEnd={(e) => onShapeUpdate(shape.id, { x: e.target.x(), y: e.target.y() })}
                onTransformEnd={() => handleShapeTransformEnd(shape)}
              />
            );
          })}
          <Transformer
            ref={transformerRef}
            rotateEnabled
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
          />
        </Layer>

        {/* Array Transformer Layer */}
        <Layer>
          <Transformer
            ref={arrayTransformerRef}
            rotateEnabled={false}
            enabledAnchors={['middle-left', 'middle-right', 'top-center', 'bottom-center']}
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
                ref={(node) => { arrayRefs.current[array.id] = node; }}
                onDragEnd={(e) => onArrayMove(array.id, e.target.x(), e.target.y())}
                onClick={() => {
                  onArrayActivate(array.id);
                  setSelectedArrayId(array.id);
                }}
                onTap={() => {
                  onArrayActivate(array.id);
                  setSelectedArrayId(array.id);
                }}
              >
                {/* Array Label */}
                <Text
                  x={START_X - 70}
                  y={rowY - INDEX_HEIGHT - 2}
                  text={`A${arrayIndex + 1}`}
                  fontSize={12}
                  fontFamily="Arial"
                  fill={isActive ? '#667eea' : '#999'}
                  fontStyle="bold"
                />

                {/* Draw Index Row */}
                <Text
                  x={START_X - 80}
                  y={rowY - INDEX_HEIGHT}
                  text="Index"
                  fontSize={12}
                  fontFamily="Arial"
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
                    fontFamily="Arial"
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
                  fontFamily="Arial"
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
                        onContextMenu={(e) => handleCellRightClickEvent(array.id, index, e)}
                        onMouseEnter={() => onCellHover(`Array ${arrayIndex + 1} Cell [${index}] = ${value}`)}
                        onMouseLeave={() => onCellHover('')}
                        listening={true}
                        cursor="pointer"
                      />

                      <Text
                        width={CELL_WIDTH}
                        height={CELL_HEIGHT}
                        text={value}
                        fontSize={cellFontSize}
                        fontFamily="Arial, monospace"
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

        {/* Pointer Layer */}
        <Layer>
          {arrays.map((array, arrayIndex) => (
            Object.entries(array.pointers).map(([name, index]) => {
              const cellPos = getCellPositionAbsolute(arrayIndex, index, array);
              const pointerColor = POINTER_COLORS[name] || '#FFD700';
              const pointerX = cellPos.x + CELL_WIDTH / 2;
              const pointerY = cellPos.y - 40;

              return (
                <Group
                  key={`pointer-${array.id}-${name}`}
                  x={pointerX}
                  y={pointerY}
                  onClick={() => onPointerRemove(array.id, name)}
                  cursor="pointer"
                >
                  <Line
                    points={[0, 0, 0, 24]}
                    stroke={pointerColor}
                    strokeWidth={2}
                    pointerLength={12}
                    pointerWidth={12}
                  />

                  <Rect
                    x={-30}
                    y={28}
                    width={60}
                    height={22}
                    fill={pointerColor}
                    cornerRadius={4}
                    opacity={0.9}
                  />

                  <Text
                    x={-30}
                    y={31}
                    width={60}
                    text={name}
                    fontSize={12}
                    fontFamily="Arial, monospace"
                    fill="#FFF"
                    fontStyle="bold"
                    align="center"
                    verticalAlign="middle"
                  />
                </Group>
              );
            })
          ))}
        </Layer>

        {/* Text Annotations Layer */}
        <Layer>
          {textAnnotations.map((ann) => (
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
              cursor="move"
            >
              {/* Background */}
              <Rect
                width={200}
                height={60}
                fill="#FFFACD"
                stroke="#999"
                strokeWidth={1}
                cornerRadius={4}
              />

              {/* Text */}
              <Text
                x={5}
                y={5}
                width={190}
                height={50}
                text={ann.text}
                fontSize={ann.fontSize}
                fontFamily="Arial"
                fill="#000"
                wrap="word"
              />
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
