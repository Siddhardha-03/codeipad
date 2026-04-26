import { useEffect } from 'react';

export function useKeyboardShortcuts({
  mode,
  setMode,
  setSelectedIds,
  shapesRef,
  historyUndo,
  historyRedo,
  copySelection,
  pasteClipboard,
  cutSelection,
  deleteSelection,
  activateTool,
  focusEditor
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const isEditableTarget = Boolean(
        target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        )
      );

      const key = event.key.toLowerCase();
      const meta = event.ctrlKey || event.metaKey;

      if (event.key === 'Escape') {
        setMode('code');
        setSelectedIds([]);
        focusEditor?.();
        event.preventDefault();
        return;
      }

      if (!isEditableTarget && !meta) {
        if (key === 'v') {
          if (mode === 'canvas') {
            activateTool?.('select');
            event.preventDefault();
          }
          return;
        }

        if (key === 'd') {
          if (mode === 'canvas') {
            activateTool?.('draw');
            event.preventDefault();
          }
          return;
        }

        if (key === 'e') {
          if (mode === 'canvas') {
            activateTool?.('erase');
            event.preventDefault();
          }
          return;
        }

        if (key === 'c') {
          setMode('canvas');
          event.preventDefault();
          return;
        }

        if (key === 'm') {
          setMode('code');
          focusEditor?.();
          event.preventDefault();
          return;
        }

        if ((event.key === 'Delete' || event.key === 'Backspace') && mode === 'canvas') {
          deleteSelection();
          event.preventDefault();
          return;
        }
      }

      if (isEditableTarget && mode === 'code') {
        return;
      }

      if (meta && key === 'a' && mode === 'canvas') {
        setSelectedIds(shapesRef.current.map((shape) => shape.id));
        event.preventDefault();
        return;
      }

      if (meta && key === 'c' && mode === 'canvas') {
        copySelection();
        event.preventDefault();
        return;
      }

      if (meta && key === 'x' && mode === 'canvas') {
        cutSelection();
        event.preventDefault();
        return;
      }

      if (meta && key === 'v' && mode === 'canvas') {
        pasteClipboard();
        event.preventDefault();
        return;
      }

      if (meta && key === 'z' && !event.shiftKey) {
        historyUndo();
        event.preventDefault();
        return;
      }

      if (meta && (key === 'y' || (key === 'z' && event.shiftKey))) {
        historyRedo();
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activateTool,
    copySelection,
    cutSelection,
    deleteSelection,
    focusEditor,
    historyRedo,
    historyUndo,
    mode,
    pasteClipboard,
    setMode,
    setSelectedIds,
    shapesRef
  ]);
}
