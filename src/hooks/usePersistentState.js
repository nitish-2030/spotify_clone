import { useCallback, useState } from "react";

// Like useState, but the value is saved in localStorage (e.g. volume, shuffle, repeat).
// Storage can be unavailable (private mode, quota), so every access is wrapped in try/catch.
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const v = typeof next === "function" ? next(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(v));
        } catch {
          /* ignore: the value just will not be remembered */
        }
        return v;
      });
    },
    [key],
  );

  return [value, set];
}
