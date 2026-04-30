function getPoints(shape) {
  if (shape.points && shape.points.length >= 4) {
    return shape.points;
  }

  // Default to an inverted-U (semi-circle-like) using a cubic Bezier approximation
  const x = shape.x ?? 0;
  const y = shape.y ?? 0;
  const width = shape.width ?? 140;
  const r = width / 2;
  // k approximates circle with cubic Bezier (common constant ~0.551915)
  const k = 0.551915024494;

  // Make the semicircle bulge downward (convex down) so the arrow naturally points down
  return [
    { x: x - r, y },
    { x: x - r, y: y + r * k },
    { x: x + r, y: y + r * k },
    { x: x + r, y }
  ];
}

// 🔁 Transform helper (cleaner)
function transformPoints(points, shape) {
  let transformed = [...points];

  // Flip
  if (shape.flipped) {
    const xs = transformed.map(p => p.x);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;

    transformed = transformed.map(p => ({
      x: 2 * centerX - p.x,
      y: p.y
    }));

    // Swap control points
    [transformed[1], transformed[2]] = [transformed[2], transformed[1]];
  }

  // Rotate
  if (shape.angle) {
    const xs = transformed.map(p => p.x);
    const ys = transformed.map(p => p.y);

    const center = {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2
    };

    const cos = Math.cos(shape.angle);
    const sin = Math.sin(shape.angle);

    transformed = transformed.map(p => ({
      x: center.x + (p.x - center.x) * cos - (p.y - center.y) * sin,
      y: center.y + (p.x - center.x) * sin + (p.y - center.y) * cos
    }));
  }

  return transformed;
}

function drawArrowHead(ctx, tip, angle, strokeColor, fillColor, strokeWidth) {
  const size = Math.max(10, strokeWidth * 3);

  ctx.save();
  ctx.translate(tip.x, tip.y);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.5);
  ctx.lineTo(-size, size * 0.5);
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;

  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function draw(ctx, shape) {
  const raw = getPoints(shape);
  const hasCustomPoints = Boolean(shape.points && shape.points.length >= 4);
  const [p0, p1, p2, p3] = transformPoints(raw, shape);

  const strokeColor = shape.strokeColor ?? '#000';
  const fillColor =
    shape.fillColor && shape.fillColor !== 'transparent'
      ? shape.fillColor
      : 'rgba(0,0,0,0.05)';

  const strokeWidth = shape.strokeWidth ?? 2;

  ctx.save();
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = strokeColor;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  if (!hasCustomPoints) {
    // Draw a precise arc for the default semicircle (downward-facing)
    const x = shape.x ?? 0;
    const y = shape.y ?? 0;
    const width = shape.width ?? 140;
    const r = width / 2;

    ctx.beginPath();
    // center at (x, y), arc from PI -> 0 draws the lower semicircle
    ctx.arc(x, y, r, Math.PI, 0, false);
    ctx.stroke();

    // Arrow tip tangent angle at end (theta = 0) -> downward
    const angle = Math.PI / 2;
    const tip = { x: x + r, y };
    drawArrowHead(ctx, tip, angle, strokeColor, fillColor, strokeWidth);
  } else {
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    ctx.stroke();

    const dx = 3 * (p3.x - p2.x);
    const dy = 3 * (p3.y - p2.y);
    const angle = Math.atan2(dy, dx);
    drawArrowHead(ctx, p3, angle, strokeColor, fillColor, strokeWidth);
  }

  ctx.restore();
}

export function getBounds(shape) {
  const points = transformPoints(getPoints(shape), shape);
  const padding = Math.max(8, (shape.strokeWidth ?? 2) * 3);

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);

  return {
    left: Math.min(...xs) - padding,
    top: Math.min(...ys) - padding,
    width: Math.max(...xs) - Math.min(...xs) + padding * 2,
    height: Math.max(...ys) - Math.min(...ys) + padding * 2
  };
}

export function isHit(point, shape) {
  const points = transformPoints(getPoints(shape), shape);
  const tolerance = Math.max(8, (shape.strokeWidth ?? 2) * 3);

  const steps = 30;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;

    const x =
      mt ** 3 * points[0].x +
      3 * mt ** 2 * t * points[1].x +
      3 * mt * t ** 2 * points[2].x +
      t ** 3 * points[3].x;

    const y =
      mt ** 3 * points[0].y +
      3 * mt ** 2 * t * points[1].y +
      3 * mt * t ** 2 * points[2].y +
      t ** 3 * points[3].y;

    if (Math.hypot(point.x - x, point.y - y) <= tolerance) {
      return true; // ✅ early exit
    }
  }

  return false;
}

export function getHandlePoints(shape) {
  const points = transformPoints(getPoints(shape), shape);
  const hasCustomPoints = Boolean(shape.points && shape.points.length >= 4);

  // For default arc mode, show p1/p2 handles on the visible arc.
  if (!hasCustomPoints) {
    const x = shape.x ?? 0;
    const y = shape.y ?? 0;
    const width = shape.width ?? 140;
    const r = width / 2;

    const p0 = { x: x - r, y };
    const p3 = { x: x + r, y };
    // quarter points on upper semicircle (matches ctx.arc(x, y, r, Math.PI, 0, false))
    const p1Arc = { x: x - r * Math.SQRT1_2, y: y - r * Math.SQRT1_2 };
    const p2Arc = { x: x + r * Math.SQRT1_2, y: y - r * Math.SQRT1_2 };
    const pmid = { x, y: y - r };

    // Keep handle positions in the same transformed space used by rendering interactions
    const [tp0, tp1, tp2, tp3, tpmid] = transformPoints([p0, p1Arc, p2Arc, p3, pmid], shape);
    return { p0: tp0, p1: tp1, p2: tp2, p3: tp3, pmid: tpmid };
  }

  // Add a middle handle on the Bezier at t=0.5 (always on rendered curve)
  const t = 0.5;
  const mt = 1 - t;
  const midX = mt ** 3 * points[0].x + 3 * mt ** 2 * t * points[1].x + 3 * mt * t ** 2 * points[2].x + t ** 3 * points[3].x;
  const midY = mt ** 3 * points[0].y + 3 * mt ** 2 * t * points[1].y + 3 * mt * t ** 2 * points[2].y + t ** 3 * points[3].y;

  return { p0: points[0], p1: points[1], p2: points[2], p3: points[3], pmid: { x: midX, y: midY } };
}

export function updateHandle(shape, handleName, point) {
  const points = getPoints(shape).map(p => ({ ...p }));
  const map = { p0: 0, p1: 1, p2: 2, p3: 3 };

  if (handleName === 'pmid') {
    // Work in transformed space to compute current midpoint and delta
    const raw = points;
    const trans = transformPoints(raw, shape);

    const t = 0.5;
    const mt = 1 - t;
    const curMid = {
      x: mt ** 3 * trans[0].x + 3 * mt ** 2 * t * trans[1].x + 3 * mt * t ** 2 * trans[2].x + t ** 3 * trans[3].x,
      y: mt ** 3 * trans[0].y + 3 * mt ** 2 * t * trans[1].y + 3 * mt * t ** 2 * trans[2].y + t ** 3 * trans[3].y
    };

    const deltaTrans = { x: point.x - curMid.x, y: point.y - curMid.y };

    // inverse rotate the delta vector
    let dx = deltaTrans.x;
    let dy = deltaTrans.y;
    if (shape.angle) {
      const cos = Math.cos(-shape.angle);
      const sin = Math.sin(-shape.angle);
      const nx = dx * cos - dy * sin;
      const ny = dx * sin + dy * cos;
      dx = nx; dy = ny;
    }
    if (shape.flipped) dx = -dx;

    // Clamp movement to avoid extreme distortions
    const span = Math.hypot(raw[3].x - raw[0].x, raw[3].y - raw[0].y) || 1;
    const maxMove = Math.max(20, span * 0.8);
    const mag = Math.hypot(dx, dy);
    const scale = mag > maxMove ? maxMove / mag : 1;
    dx *= scale; dy *= scale;

    // Symmetric adjustment of both control points
    raw[1].x += dx; raw[1].y += dy;
    raw[2].x += dx; raw[2].y += dy;

    return { ...shape, points: raw };
  }

  if (!(handleName in map)) return shape;

  points[map[handleName]] = { x: point.x, y: point.y };

  return { ...shape, points };
}