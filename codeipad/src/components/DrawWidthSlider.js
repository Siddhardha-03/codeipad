import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const DrawWidthSlider = React.memo(function DrawWidthSlider({
  value,
  min = 1,
  max = 12,
  onChange
}) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);
  const rafRef = useRef(0);
  const pendingValueRef = useRef(value);

  const ratio = useMemo(() => {
    if (max <= min) return 0;
    return clamp((value - min) / (max - min), 0, 1);
  }, [max, min, value]);

  const thumbTop = useMemo(() => {
    const trackHeight = 120;
    const thumbSize = 12;
    const available = trackHeight - thumbSize;
    return `${Math.round((1 - ratio) * available)}px`;
  }, [ratio]);

  const emitChange = useCallback((nextValue) => {
    pendingValueRef.current = nextValue;
    if (rafRef.current) return;

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      onChange(pendingValueRef.current);
    });
  }, [onChange]);

  const getValueFromClientY = useCallback((clientY) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return value;

    const percentage = clamp((rect.bottom - clientY) / rect.height, 0, 1);
    return min + percentage * (max - min);
  }, [max, min, value]);

  const applyPointerValue = useCallback((clientY) => {
    const nextValue = getValueFromClientY(clientY);
    emitChange(nextValue);
  }, [emitChange, getValueFromClientY]);

  const handleThumbMouseDown = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTrackMouseDown = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
    applyPointerValue(event.clientY);
  }, [applyPointerValue]);

  const handleKeyDown = useCallback((event) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

    event.preventDefault();
    const delta = event.key === 'ArrowUp' ? 1 : -1;
    const step = event.shiftKey ? 2 : 1;
    onChange(clamp(value + delta * step, min, max));
  }, [max, min, onChange, value]);

  useEffect(() => {
    if (!isDragging) return undefined;

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';

    const handleMouseMove = (event) => {
      applyPointerValue(event.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [applyPointerValue, isDragging]);

  useEffect(() => () => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
    }
  }, []);

  return (
    <div className="draw-width-slider" aria-label="Draw width slider">
      <div
        className="draw-width-slider-track"
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        aria-valuetext={`${Math.round(value)}px`}
        onMouseDown={handleTrackMouseDown}
        onKeyDown={handleKeyDown}
      >
        <div
          className={`draw-width-slider-thumb ${isDragging ? 'dragging' : ''}`}
          style={{ top: thumbTop }}
          onMouseDown={handleThumbMouseDown}
        />
      </div>
      <div className="draw-width-slider-value">{Math.round(value)}px</div>
    </div>
  );
});

export default DrawWidthSlider;
