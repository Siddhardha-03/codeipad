function getPoints(shape) {
  const points = shape.points || [];
  const fallback = [
    { x: shape.x || 0, y: shape.y || 0 },
    { x: (shape.x || 0) + 40, y: (shape.y || 0) - 40 },
    { x: (shape.x || 0) + 80, y: (shape.y || 0) + 40 },
    { x: (shape.x || 0) + 120, y: shape.y || 0 }
  ];
  return points.length >= 4 ? points : fallback;
}

function drawArrowHead(ctx, tip, angle, strokeColor, fillColor, strokeWidth) {
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
  ctx.restore();
}

export function draw(ctx, shape) {
  const [p0, p1, p2, p3] = getPoints(shape);
  const strokeColor = shape.strokeColor || '#000000';
  const fillColor = shape.fillColor && shape.fillColor !== 'transparent'
    ? shape.fillColor
    : 'rgba(0, 0, 0, 0.04)';
  const strokeWidth = shape.strokeWidth || 2;
  const arrowAngle = Math.atan2(p3.y - p2.y, p3.x - p2.x);

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  ctx.stroke();

  drawArrowHead(ctx, p3, arrowAngle, strokeColor, fillColor, strokeWidth);
  ctx.restore();
}

export function getBounds(shape) {
  const points = getPoints(shape);
  const strokeWidth = shape.strokeWidth || 2;
  const padding = Math.max(8, strokeWidth * 3);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    left: Math.min(...xs) - padding,
    top: Math.min(...ys) - padding,
    width: Math.max(...xs) - Math.min(...xs) + padding * 2,
    height: Math.max(...ys) - Math.min(...ys) + padding * 2
  };
}

export function isHit(point, shape) {
  const points = getPoints(shape);
  const strokeWidth = shape.strokeWidth || 2;
  const tolerance = Math.max(8, strokeWidth * 3);
  let minDistance = Infinity;
  const segments = 50;

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const mt = 1 - t;
    const x = mt ** 3 * points[0].x + 3 * mt ** 2 * t * points[1].x + 3 * mt * t ** 2 * points[2].x + t ** 3 * points[3].x;
    const y = mt ** 3 * points[0].y + 3 * mt ** 2 * t * points[1].y + 3 * mt * t ** 2 * points[2].y + t ** 3 * points[3].y;
    const distance = Math.hypot(point.x - x, point.y - y);
    if (distance < minDistance) minDistance = distance;
  }

  return minDistance <= tolerance;
}

export function getHandlePoints(shape) {
  const points = getPoints(shape);
  return {
    p0: points[0],
    p1: points[1],
    p2: points[2],
    p3: points[3]
  };
}

export function updateHandle(shape, handleName, point) {
  const points = getPoints(shape).map((p) => ({ ...p }));
  const indexMap = { p0: 0, p1: 1, p2: 2, p3: 3 };
  const index = indexMap[handleName];
  if (typeof index !== 'number') return shape;
  points[index] = { x: point.x, y: point.y };
  return { ...shape, points };
}
