// "General" mode: Apple iTunes Search API (free, no key, 30s preview mp3).
// JSONP is used so CORS can never block the request.
import { imageCover, songCard, songKey, uniqueSongs, discoveryRows, artistCards } from "./cards";

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
    genre: t.primaryGenreName,
  };
}

// iTunes has no artist photos, so they come from Deezer's public search (also via JSONP).
// Only an exact name match is used, so an artist never gets someone else's photo.
// Any failure just means that artist keeps the initials card.
const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

async function artistPhoto(name) {
  const data = await jsonp(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=10&output=jsonp`, 5000);
  const match = (data?.data ?? []).find((a) => sameName(a.name, name) && (a.picture_xl || a.picture_big));
  const url = match?.picture_xl || match?.picture_big;
  return url && !url.includes("/artist//") ? url : null;
}

async function artistPhotos(names) {
  const settled = await Promise.allSettled(names.map(artistPhoto));
  const photos = {};
  settled.forEach((s, i) => {
    if (s.status === "fulfilled" && s.value) photos[names[i]] = s.value;
  });
  return photos;
}

// JSONP first. Some browsers get the script redirected to a musics:// (Apple Music app) link
// and the script fails to load, so a normal CORS fetch is the second try.
async function loadJson(url) {
  try {
    return await jsonp(url);
  } catch {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`iTunes error ${res.status}`);
    return res.json();
  }
}

async function search(term, limit = 16) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&country=IN&limit=${limit}`;
  const data = await loadJson(url);
  return data.results.filter((t) => t.previewUrl && t.trackName).map(mapTrack);
}

// Edit the rows here: change { title, term } and the UI updates by itself
const ROWS = [
  { id: "rec", title: "Recommended for today", caption: "Inspired by your recent activity", term: "arijit singh", tall: true },
  { id: "retro", title: "Retro Bollywood", caption: "Inspired by your recent activity", term: "kishore kumar", tall: true },
  { id: "pop", title: "Popular albums and singles", term: "bollywood hits 2025", tall: true },
  // Mood rows: every song in them gets that mood, so clicking one themes the whole app
  { id: "m-romantic", title: "Romantic hits", caption: "Pink mood", term: "romantic hindi songs", tall: true, mood: "romantic" },
  { id: "m-devotional", title: "Bhajan & devotional", caption: "Saffron mood", term: "bhajan", tall: true, mood: "devotional" },
  { id: "m-phonk", title: "Phonk & BGM", caption: "Violet-red mood", term: "phonk", tall: true, mood: "phonk" },
  { id: "m-sad", title: "Sad songs", caption: "Midnight mood", term: "sad hindi songs", tall: true, mood: "sad" },
];
const ROW_LIMIT = 40; // ask iTunes for plenty, because duplicates are removed afterwards
const ROW_MAX = 20; // cards per row after removing duplicates
const EXTRA = ["mohammed rafi", "lata mangeshkar", "pritam"]; // only used for the artists / radio rows

// Live search used by the search bar
export const searchGeneral = (query) => search(query, 20);

export async function loadGeneral() {
  const jobs = [
    ...ROWS.map((r) => search(r.term, ROW_LIMIT)),
    ...EXTRA.map((t) => search(t)),
  ];
  const settled = await Promise.allSettled(jobs);
  const lists = settled.map((s, i) => {
    const list = s.status === "fulfilled" ? s.value : [];
    const mood = ROWS[i]?.mood; // EXTRA searches come after ROWS and have no mood
    return mood ? list.map((song) => ({ ...song, mood })) : list;
  });
  const songs = uniqueSongs(lists.flat());
  if (songs.length === 0) throw new Error("No songs were returned by the General source");

  // A song shows up in only one song row (no repeated cards), and in that row only once
  const used = new Set();
  const rowSections = ROWS.map((r, i) => {
    const items = [];
    for (const s of lists[i]) {
      const key = songKey(s);
      if (used.has(key)) continue;
      used.add(key);
      items.push(songCard(s));
      if (items.length >= ROW_MAX) break;
    }
    return { id: r.id, title: r.title, caption: r.caption, tall: r.tall, items };
  }).filter((s) => s.items.length > 0);

  const photos = await artistPhotos(artistCards(songs).map((a) => a.title));

  const [first, second, ...rest] = rowSections;
  return { songs, sections: [first, second, ...discoveryRows(songs, photos), ...rest].filter(Boolean) };
}