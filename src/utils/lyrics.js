// Lyrics from LRCLIB (https://lrclib.net): free, no API key, plain + time-synced lyrics.
import { primaryArtist } from "../sources/cards";

const API = "https://lrclib.net/api";
const cache = new Map(); // song id -> result (null = no lyrics found)

// "Song (From "Film")" / "Song - Remastered" -> "Song"
export const cleanTitle = (title) =>
  title.replace(/\s*[([].*?[)\]]/g, "").replace(/\s+-\s+.*$/, "").trim();

// "[01:23.45] some words"  ->  { t: 83.45, text: "some words" }
export function parseLrc(text) {
  const lines = [];
  for (const raw of text.split(/\r?\n/)) {
    const m = raw.match(/^((?:\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\])+)\s*(.*)$/);
    if (!m) continue;
    const words = m[2].trim();
    for (const tag of m[1].matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)) {
      const frac = tag[3] ? Number(`0.${tag[3]}`) : 0;
      lines.push({ t: Number(tag[1]) * 60 + Number(tag[2]) + frac, text: words });
    }
  }
  return lines.sort((a, b) => a.t - b.t);
}

// Index of the line being sung at `time` (last line that has already started), -1 before the first line
export function activeLineIndex(lines, time) {
  let lo = 0;
  let hi = lines.length - 1;
  let answer = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].t <= time) {
      answer = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return answer;
}

async function getJson(url, timeoutMs = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Lyrics error ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const hasText = (r) => r && (r.syncedLyrics || r.plainLyrics || r.instrumental);

function shape(rec) {
  if (!rec) return null;
  if (rec.instrumental) return { instrumental: true, plain: "", synced: null };
  const synced = rec.syncedLyrics ? parseLrc(rec.syncedLyrics) : [];
  const plain = rec.plainLyrics || synced.map((l) => l.text).join("\n");
  if (!plain.trim()) return null;
  return { instrumental: false, plain, synced: synced.length > 1 ? synced : null };
}

// Exact match first, then a looser search by title + artist, then a free-text search
export async function fetchLyrics(song) {
  if (cache.has(song.id)) return cache.get(song.id);

  const title = cleanTitle(song.title);
  const artist = primaryArtist(song.artist);
  const params = new URLSearchParams({ track_name: title, artist_name: artist });

  let rec = await getJson(`${API}/get?${params}`);
  if (!hasText(rec)) rec = (await getJson(`${API}/search?${params}`))?.find(hasText) ?? null;
  if (!hasText(rec)) {
    const q = encodeURIComponent(`${title} ${artist}`);
    rec = (await getJson(`${API}/search?q=${q}`))?.find(hasText) ?? null;
  }

  const result = shape(rec);
  cache.set(song.id, result); // only successful lookups are cached; a thrown error is retried next time
  return result;
}