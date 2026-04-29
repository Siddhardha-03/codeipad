function getPoints(shape) {
  const points = shape.points || [];
  const fallback = (() => {
    const x = shape.x || 0;
    const y = shape.y || 0;
    const width = shape.width || 140;
    const radius = Math.max(20, width / 2);
    return [
      { x: x - radius, y },
      { x: x - radius / 2, y: y - radius },
      { x: x + radius / 2, y: y - radius },
      { x: x + radius, y }
    ];
  })();
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
  let [p0, p1, p2, p3] = getPoints(shape);
  const strokeColor = shape.strokeColor || '#000000';
  const fillColor = shape.fillColor && shape.fillColor !== 'transparent'
    ? shape.fillColor
    : 'rgba(0, 0, 0, 0.04)';
  const strokeWidth = shape.strokeWidth || 2;
  const angle = shape.angle || 0;
  const flipped = Boolean(shape.flipped);

  if (flipped) {
    const centerX = (Math.min(p0.x, p1.x, p2.x, p3.x) + Math.max(p0.x, p1.x, p2.x, p3.x)) / 2;
    p0 = { x: 2 * centerX - p0.x, y: p0.y };
    p1 = { x: 2 * centerX - p1.x, y: p1.y };
    p2 = { x: 2 * centerX - p2.x, y: p2.y };
    p3 = { x: 2 * centerX - p3.x, y: p3.y };
    [p1, p2] = [p2, p1];
  }

  if (angle !== 0) {
    const center = {
      x: (Math.min(p0.x, p1.x, p2.x, p3.x) + Math.max(p0.x, p1.x, p2.x, p3.x)) / 2,
      y: (Math.min(p0.y, p1.y, p2.y, p3.y) + Math.max(p0.y, p1.y, p2.y, p3.y)) / 2
    };
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rotate = (p) => ({ x: center.x + (p.x - center.x) * cos - (p.y - center.y) * sin, y: center.y + (p.x - center.x) * sin + (p.y - center.y) * cos });
    p0 = rotate(p0); p1 = rotate(p1); p2 = rotate(p2); p3 = rotate(p3);
  }

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

  const arrowAngle = Math.atan2(p3.y - p2.y, p3.x - p2.x);
  drawArrowHead(ctx, p3, arrowAngle, strokeColor, fillColor, strokeWidth);
  ctx.restore();
}

export function getBounds(shape) {
  const points = getPoints(shape);
  const strokeWidth = shape.strokeWidth || 2;
  const padding = Math.max(8, strokeWidth * 3);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
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
  const segments = 40;

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
  return { p0: points[0], p1: points[1], p2: points[2], p3: points[3] };
}

export function updateHandle(shape, handleName, point) {
  const points = getPoints(shape).map((p) => ({ ...p }));
  const indexMap = { p0: 0, p1: 1, p2: 2, p3: 3 };
  const index = indexMap[handleName];
  if (typeof index !== 'number') return shape;
  points[index] = { x: point.x, y: point.y };
  return { ...shape, points };
}
