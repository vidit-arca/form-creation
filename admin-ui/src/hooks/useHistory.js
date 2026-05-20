import { useState } from 'react';

export function useHistory(initialState) {
  const [history, setHistory] = useState({
    past: [],
    present: initialState,
    future: []
  });

  const undo = () => {
    setHistory((curr) => {
      if (curr.past.length === 0) return curr;
      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, curr.past.length - 1);
      return { past: newPast, present: previous, future: [curr.present, ...curr.future] };
    });
  };

  const redo = () => {
    setHistory((curr) => {
      if (curr.future.length === 0) return curr;
      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      return { past: [...curr.past, curr.present], present: next, future: newFuture };
    });
  };

  const set = (newPresent) => {
    setHistory((curr) => {
      const resolved = typeof newPresent === 'function' ? newPresent(curr.present) : newPresent;
      if (curr.present === resolved) return curr;
      return { past: [...curr.past, curr.present], present: resolved, future: [] };
    });
  };

  const reset = (initial) => setHistory({ past: [], present: initial, future: [] });

  return { state: history.present, set, undo, redo, reset, history };
}
