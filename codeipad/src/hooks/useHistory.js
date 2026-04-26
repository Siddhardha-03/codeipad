import { useCallback } from 'react';

export function useHistory({ setHistory, applySnapshot, MAX_HISTORY = 40 }) {
  const pushHistory = useCallback((snapshot, historyLockRef) => {
    if (historyLockRef?.current) return;

    setHistory((prev) => {
      const scoped = prev.items.slice(0, prev.index + 1);
      const last = scoped[scoped.length - 1];
      if (last && JSON.stringify(last) === JSON.stringify(snapshot)) {
        return prev;
      }

      const nextItems = [...scoped, snapshot].slice(-MAX_HISTORY);
      return { items: nextItems, index: nextItems.length - 1 };
    });
  }, [MAX_HISTORY, setHistory]);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.index <= 0) return prev;
      const nextIndex = prev.index - 1;
      applySnapshot(prev.items[nextIndex]);
      return { ...prev, index: nextIndex };
    });
  }, [applySnapshot, setHistory]);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.index >= prev.items.length - 1) return prev;
      const nextIndex = prev.index + 1;
      applySnapshot(prev.items[nextIndex]);
      return { ...prev, index: nextIndex };
    });
  }, [applySnapshot, setHistory]);

  return {
    pushHistory,
    undo,
    redo
  };
}
