function getCurve(shape) {
  const x = shape.x || 0;
  const y = shape.y || 0;
  const width = shape.width || 140;
  const radius = Math.max(20, width / 2);
  const start = { x: x - radius, y };
  const end = { x: x + radius, y };
  const center = { x, y };
  return { start, end, center, radius };
}

function drawArcArrowHead(ctx, tip, angle, strokeColor, fillColor, strokeWidth) {
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
  const { end, center, radius } = getCurve(shape);
  const strokeColor = shape.strokeColor || '#000000';
  const fillColor = shape.fillColor && shape.fillColor !== 'transparent'
    ? shape.fillColor
    : 'rgba(0, 0, 0, 0.04)';
  const strokeWidth = shape.strokeWidth || 2;
  const clockwise = Boolean(shape.clockwise ?? true);
  const startAngle = clockwise ? Math.PI : 0;
  const endAngle = clockwise ? 0 : Math.PI;
  const arrowAngle = clockwise ? 0 : Math.PI;

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, startAngle, endAngle, !clockwise);
  ctx.stroke();

  drawArcArrowHead(ctx, end, arrowAngle, strokeColor, fillColor, strokeWidth);
  ctx.restore();
}

export function getBounds(shape) {
  const { center, radius } = getCurve(shape);
  const strokeWidth = shape.strokeWidth || 2;
  const padding = Math.max(8, strokeWidth * 3);
  return {
    left: center.x - radius - padding,
    top: center.y - radius - padding,
    width: radius * 2 + padding * 2,
    height: radius * 2 + padding * 2
  };
}

export function isHit(point, shape) {
  const { center, radius } = getCurve(shape);
  const strokeWidth = shape.strokeWidth || 2;
  const tolerance = Math.max(8, strokeWidth * 3);
  const distance = Math.abs(Math.hypot(point.x - center.x, point.y - center.y) - radius);
  return distance <= tolerance;
}
