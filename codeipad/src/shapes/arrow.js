function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getLinePoints(shape) {
  const x = shape.x || 0;
  const y = shape.y || 0;
  const width = shape.width || 120;
  const angle = shape.angle || 0;
  const halfWidth = width / 2;
  const dx = Math.cos(angle) * halfWidth;
  const dy = Math.sin(angle) * halfWidth;

  return {
    start: { x: x - dx, y: y - dy },
    end: { x: x + dx, y: y + dy }
  };
}

function drawArrowHead(ctx, tip, angle, strokeColor, fillColor, strokeWidth, doubleHeaded = false) {
  const headLength = Math.max(10, strokeWidth * 3.2);
  const headSpread = headLength * 0.55;

  ctx.save();
  ctx.translate(tip.x, tip.y);
  ctx.rotate(angle);
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-headLength, -headSpread / 2);
  ctx.lineTo(-headLength, headSpread / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (doubleHeaded) {
    ctx.beginPath();
    ctx.moveTo(-headLength * 0.2, 0);
    ctx.lineTo(headLength * 0.8, -headSpread / 2);
    ctx.lineTo(headLength * 0.8, headSpread / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export function draw(ctx, shape) {
  const { start, end } = getLinePoints(shape);
  const strokeColor = shape.strokeColor || '#000000';
  const fillColor = shape.fillColor && shape.fillColor !== 'transparent'
    ? shape.fillColor
    : 'rgba(0, 0, 0, 0.04)';
  const strokeWidth = shape.strokeWidth || 2;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const doubleHeaded = shape.type === 'double-arrow';

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  drawArrowHead(ctx, end, angle, strokeColor, fillColor, strokeWidth, doubleHeaded);
  if (doubleHeaded) {
    drawArrowHead(ctx, start, angle + Math.PI, strokeColor, fillColor, strokeWidth, false);
  }

  ctx.restore();
}

export function getBounds(shape) {
  const { start, end } = getLinePoints(shape);
  const strokeWidth = shape.strokeWidth || 2;
  const padding = Math.max(8, strokeWidth * 3);
  const left = Math.min(start.x, end.x) - padding;
  const top = Math.min(start.y, end.y) - padding;
  const right = Math.max(start.x, end.x) + padding;
  const bottom = Math.max(start.y, end.y) + padding;

  return {
    left,
    top,
    width: right - left,
    height: bottom - top
  };
}

export function isHit(point, shape) {
  const { start, end } = getLinePoints(shape);
  const strokeWidth = shape.strokeWidth || 2;
  const tolerance = Math.max(8, strokeWidth * 3);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y) <= tolerance;
  }

  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
  const projectedX = start.x + t * dx;
  const projectedY = start.y + t * dy;
  return Math.hypot(point.x - projectedX, point.y - projectedY) <= tolerance;
}

export function getHandlePoints(shape) {
  const { start, end } = getLinePoints(shape);
  return {
    start,
    end
  };
}

export function moveHandle(shape, handleName, point) {
  const next = { ...shape };
  const oppositeKey = handleName === 'start' ? 'end' : 'start';
  const opposite = getHandlePoints(shape)[oppositeKey];
  const dx = point.x - opposite.x;
  const dy = point.y - opposite.y;

  next.x = (point.x + opposite.x) / 2;
  next.y = (point.y + opposite.y) / 2;
  next.width = Math.max(24, Math.hypot(dx, dy));
  next.angle = Math.atan2(point.y - opposite.y, point.x - opposite.x);
  return next;
}
