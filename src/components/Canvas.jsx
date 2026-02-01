import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Circle, Arrow, Transformer, Path } from 'react-konva';
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
  textAnnotations,
  onDropShape,
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
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);
  const [editingTextValue, setEditingTextValue] = useState('');

  const CELL_WIDTH = 50;
  const CELL_HEIGHT = 50;
  const INDEX_HEIGHT = 28;
  const START_X = 90;
  const START_Y = 120;
  const CELL_SPACING = 8;
  const ARRAY_GAP = 70;

  const getTextStyleProps = (style) => {
    const baseProps = {
      none: { shadowColor: 'transparent', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0 },
      neon: { 
        shadowColor: '#00ff00', 
        shadowBlur: 15, 
        shadowOffsetX: 0, 
        shadowOffsetY: 0,
        stroke: '#00ff00',
        strokeWidth: 0.5
      },
      'outer-glow': {
        shadowColor: '#667eea',
        shadowBlur: 20,
        shadowOffsetX: 0,
        shadowOffsetY: 0
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
        shadowColor: '#ffff00',
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
    if (!shapeType || !containerRef.current || !stageRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const stagePos = stageRef.current.getPosition();
    const stageScale = stageRef.current.scaleX();
    const stageX = (x - stagePos.x) / stageScale;
    const stageY = (y - stagePos.y) / stageScale;

    onDropShape(shapeType, { x: stageX, y: stageY });
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

  const handleArrayResizeEnd = (arrayId) => {
    const node = arrayRefs.current[arrayId];
    if (!node) return;

    node.scaleX(1);
    node.scaleY(1);
  };

  const shapeStyleProps = getTextStyleProps(textStyle);

  return (
    <div
      className={`canvas-container canvas-bg-${canvasBackground} canvas-color-${canvasColor || 'white'}`}
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
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
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        style={{ background: 'transparent' }}
        draggable={!isDraggingObject}
        onDragStart={() => {
          if (stageRef.current && !isDraggingObject) {
            stageRef.current.container().style.cursor = 'grabbing';
          }
        }}
        onDragEnd={() => {
          if (stageRef.current) {
            stageRef.current.container().style.cursor = !isDraggingObject ? 'grab' : 'default';
          }
        }}
        onMouseDown={(e) => {
          const clickedOnEmpty = e.target === e.target.getStage();
          if (clickedOnEmpty) {
            onSelectShape(null);
            setSelectedArrayId(null);
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
                  {...shapeStyleProps}
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
                  {...shapeStyleProps}
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
