import { useCallback } from 'react';

export function useClipboard({
  clipboard,
  setClipboard,
  shapesRef,
  setShapes,
  selectedIds,
  setSelectedIds,
  pushHistory,
  captureSnapshot,
  updateStatus
}) {
  const copySelection = useCallback(() => {
    if (!selectedIds.length) return;
    const copied = shapesRef.current
      .filter((shape) => selectedIds.includes(shape.id))
      .map((shape) => JSON.parse(JSON.stringify(shape)));

    if (!copied.length) return;
    setClipboard(copied);
    updateStatus(`${copied.length} item(s) copied`);
  }, [selectedIds, setClipboard, shapesRef, updateStatus]);

  const deleteSelection = useCallback(() => {
    if (!selectedIds.length) return;

    const nextShapes = shapesRef.current.filter((shape) => !selectedIds.includes(shape.id));
    shapesRef.current = nextShapes;
    setShapes(nextShapes);
    setSelectedIds([]);
    pushHistory(captureSnapshot());
    updateStatus('Selection deleted');
  }, [captureSnapshot, pushHistory, selectedIds, setSelectedIds, setShapes, shapesRef, updateStatus]);

  const cutSelection = useCallback(() => {
    if (!selectedIds.length) return;
    copySelection();
    deleteSelection();
    updateStatus('Selection cut');
  }, [copySelection, deleteSelection, selectedIds.length, updateStatus]);

  const pasteClipboard = useCallback(() => {
    if (!clipboard.length) return;

    const createdAt = Date.now();
    const pasted = clipboard.map((shape, index) => {
      const clone = JSON.parse(JSON.stringify(shape));
      const dx = 20;
      const dy = 20;

      const next = {
        ...clone,
        id: `shape-${createdAt}-${index}-${Math.random()}`,
        x: typeof clone.x === 'number' ? clone.x + dx : clone.x,
        y: typeof clone.y === 'number' ? clone.y + dy : clone.y
      };

      if (next.type === 'pen' && Array.isArray(next.points)) {
        next.points = next.points.map((point) => ({ x: point.x + dx, y: point.y + dy }));
      }

      return next;
    });

    const nextShapes = [...shapesRef.current, ...pasted];
    shapesRef.current = nextShapes;
    setShapes(nextShapes);
    setSelectedIds(pasted.map((shape) => shape.id));
    pushHistory(captureSnapshot());
    updateStatus(`${pasted.length} item(s) pasted`);
  }, [captureSnapshot, clipboard, pushHistory, setSelectedIds, setShapes, shapesRef, updateStatus]);

  return {
    copySelection,
    cutSelection,
    pasteClipboard,
    deleteSelection
  };
}
