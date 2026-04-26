import { useCallback, useMemo, useRef, useState } from 'react';

export function getShapeBounds(shape, scrollOffset = { left: 0, top: 0 }) {
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
    if (!Array.isArray(shape.points) || shape.points.length === 0) {
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

  if (shape.type === 'array' || shape.type === 'sll' || shape.type === 'dll' || shape.type === 'tree') {
    return { left: x - shape.width / 2, top: y - shape.height / 2, width: shape.width, height: shape.height };
  }

  return { left: x - 20, top: y - 20, width: 40, height: 40 };
}

export function isPointInShape(point, shape, scrollOffset = { left: 0, top: 0 }) {
  const bounds = getShapeBounds(shape, scrollOffset);
  const tolerance = 8;
  return point.x >= bounds.left - tolerance &&
    point.x <= bounds.left + bounds.width + tolerance &&
    point.y >= bounds.top - tolerance &&
    point.y <= bounds.top + bounds.height + tolerance;
}

export function isShapeInsideSelectionBox(shape, box, scrollOffset = { left: 0, top: 0 }) {
  const bounds = getShapeBounds(shape, scrollOffset);
  const boxLeft = Math.min(box.x1, box.x2);
  const boxTop = Math.min(box.y1, box.y2);
  const boxRight = Math.max(box.x1, box.x2);
  const boxBottom = Math.max(box.y1, box.y2);

  return !(
    bounds.left > boxRight ||
    bounds.left + bounds.width < boxLeft ||
    bounds.top > boxBottom ||
    bounds.top + bounds.height < boxTop
  );
}

export function getGroupBounds(shapes, scrollOffset = { left: 0, top: 0 }) {
  if (!shapes.length) {
    return null;
  }

  const allBounds = shapes.map((shape) => getShapeBounds(shape, scrollOffset));
  const left = Math.min(...allBounds.map((bounds) => bounds.left));
  const top = Math.min(...allBounds.map((bounds) => bounds.top));
  const right = Math.max(...allBounds.map((bounds) => bounds.left + bounds.width));
  const bottom = Math.max(...allBounds.map((bounds) => bounds.top + bounds.height));

  return {
    left,
    top,
    width: right - left,
    height: bottom - top
  };
}

export function useSelection() {
  const marqueeRef = useRef({ active: false, x1: 0, y1: 0, x2: 0, y2: 0 });
  const [marqueeBox, setMarqueeBox] = useState(null);

  const startMarquee = useCallback((point) => {
    marqueeRef.current = { active: true, x1: point.x, y1: point.y, x2: point.x, y2: point.y };
    setMarqueeBox({ ...marqueeRef.current });
  }, []);

  const updateMarquee = useCallback((point) => {
    if (!marqueeRef.current.active) return;
    marqueeRef.current = { ...marqueeRef.current, x2: point.x, y2: point.y };
    setMarqueeBox({ ...marqueeRef.current });
  }, []);

  const endMarquee = useCallback(() => {
    const finalBox = marqueeRef.current.active ? { ...marqueeRef.current } : null;
    marqueeRef.current = { active: false, x1: 0, y1: 0, x2: 0, y2: 0 };
    setMarqueeBox(null);
    return finalBox;
  }, []);

  return useMemo(() => ({
    marqueeBox,
    marqueeRef,
    startMarquee,
    updateMarquee,
    endMarquee
  }), [endMarquee, marqueeBox, startMarquee, updateMarquee]);
}
