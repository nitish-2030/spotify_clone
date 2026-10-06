import { useEffect, useMemo, useState } from "react";
import { searchRemote } from "../sources";
import { uniqueSongs } from "../sources/cards";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 400;

// Search = instant local matches + live results from the active source
// (iTunes in General mode, Spotify search in Spotify mode, nothing extra in Demo).
export function useSearch({ source, songs, query }) {
  const q = query.trim();
  const [remote, setRemote] = useState({ q: "", songs: [] });
  const remoteEnabled = source === "general" || source === "spotify";

  const local = useMemo(() => {
    const lower = q.toLowerCase();
    if (!lower) return [];
    return songs.filter(
      (s) => s.title.toLowerCase().includes(lower) || s.artist.toLowerCase().includes(lower),
    );
  }, [q, songs]);

  useEffect(() => {
    if (!remoteEnabled || q.length < MIN_CHARS) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchRemote(source, q)
        .then((list) => !cancelled && setRemote({ q, songs: list }))
        .catch(() => !cancelled && setRemote({ q, songs: [] })); // a failed search just shows local matches
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, source, remoteEnabled]);

  const remoteForQuery = remote.q === q ? remote.songs : [];
  const searching = remoteEnabled && q.length >= MIN_CHARS && remote.q !== q;

  return { results: uniqueSongs([...local, ...remoteForQuery]), searching };
}
