// "General" mode: Apple iTunes Search API (free, no key, 30s preview mp3).
// JSONP use kiya hai taaki CORS ki wajah se kabhi block na ho.
import { imageCover, songCard, uniqueSongs, discoveryRows } from "./cards";

function jsonp(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const cb = `__itunes_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timer = setTimeout(() => { cleanup(); reject(new Error("timeout")); }, timeout);
    function cleanup() {
      clearTimeout(timer);
      delete window[cb];
      script.remove();
    }
    window[cb] = (data) => { cleanup(); resolve(data); };
    script.onerror = () => { cleanup(); reject(new Error("network")); };
    script.src = `${url}${url.includes("?") ? "&" : "?"}callback=${cb}`;
    document.head.appendChild(script);
  });
}

function mapTrack(t) {
  return {
    id: `i${t.trackId}`,
    title: t.trackName,
    artist: t.artistName,
    src: t.previewUrl,
    link: t.trackViewUrl,
    cover: imageCover(t.artworkUrl100.replace("100x100", "400x400")),
  };
}

async function search(term, limit = 16) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&country=IN&limit=${limit}`;
  const data = await jsonp(url);
  return data.results.filter((t) => t.previewUrl && t.trackName).map(mapTrack);
}

// Rows yahin se edit karo: { title, term } badal do, UI apne aap badal jaayegi
const ROWS = [
  { id: "rec", title: "Recommended for today", caption: "Inspired by your recent activity", term: "arijit singh", tall: true },
  { id: "retro", title: "Retro Bollywood", caption: "Inspired by your recent activity", term: "kishore kumar", tall: true },
  { id: "pop", title: "Popular albums and singles", term: "bollywood hits 2025", tall: true },
];
const EXTRA = ["mohammed rafi", "lata mangeshkar", "pritam"]; // sirf artists/radio rows ke liye

export async function loadGeneral() {
  const jobs = [...ROWS.map((r) => r.term), ...EXTRA].map((t) => search(t));
  const settled = await Promise.allSettled(jobs);
  const lists = settled.map((s) => (s.status === "fulfilled" ? s.value : []));
  const songs = uniqueSongs(lists.flat());
  if (songs.length === 0) throw new Error("No songs were returned by the General source");

  const rowSections = ROWS.map((r, i) => ({
    id: r.id, title: r.title, caption: r.caption, tall: r.tall,
    items: lists[i].map(songCard),
  })).filter((s) => s.items.length > 0);

  const [first, second, ...rest] = rowSections;
  return { songs, sections: [first, second, ...discoveryRows(songs), ...rest].filter(Boolean) };
}