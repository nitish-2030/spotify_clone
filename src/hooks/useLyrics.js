import { useEffect, useState } from "react";
import { fetchLyrics } from "../utils/lyrics";

const DELAY_MS = 300; // skipping through songs quickly must not fire one request per song

// status: "idle" | "loading" | "ok" | "instrumental" | "none"
export function useLyrics(song) {
  const [entry, setEntry] = useState({ id: null, data: null });

  useEffect(() => {
    if (!song) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      fetchLyrics(song)
        .then((data) => !cancelled && setEntry({ id: song.id, data }))
        .catch(() => !cancelled && setEntry({ id: song.id, data: null }));
    }, DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [song]);

  if (!song) return { status: "idle", plain: "", synced: null };
  if (entry.id !== song.id) return { status: "loading", plain: "", synced: null };
  if (!entry.data) return { status: "none", plain: "", synced: null };
  return {
    status: entry.data.instrumental ? "instrumental" : "ok",
    plain: entry.data.plain,
    synced: entry.data.synced,
  };
}