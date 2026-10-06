// Every source produces the same shapes, so the UI never needs to know where data came from.
// song  = { id, title, artist, cover, src?, uri? }   (src = preview mp3, uri = Spotify track)
// item  = { id, title, subtitle, cover, round?, radio?, song }   (ready to render as a card)

const RADIO_COLORS = ["#ffd978", "#8fead8", "#ffa575", "#ff9fb3", "#b9a8ff", "#9ad8ff"];

// Same gradient + initials for the same artist name (used when there is no photo)
function nameHue(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) % 360;
  return h;
}
const nameGradient = (name) => {
  const h = nameHue(name);
  return `linear-gradient(135deg, hsl(${h} 60% 46%), hsl(${(h + 40) % 360} 65% 28%))`;
};
const initialsOf = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => Array.from(w)[0].toUpperCase()).join("");

// iTunes joins several artists as "A & B", "A feat. B" or "A, B". The first one is the main artist.
export const primaryArtist = (name) => name.split(/\s*,\s*|\s+&\s+|\s+(?:feat\.?|ft\.?|featuring)\s+/i)[0].trim();

export const imageCover = (url) => `url("${url}") center / cover no-repeat, #282828`;

export const songCard = (song) => ({
  id: `s-${song.id}`,
  title: song.title,
  subtitle: song.artist,
  cover: song.cover,
  song,
});

// photos = { "Artist Name": imageUrl } (optional). Without a photo the card uses initials on a gradient.
export function artistCards(songs, max = 8, photos = {}) {
  const byArtist = new Map();
  songs.forEach((s) => {
    const first = primaryArtist(s.artist);
    if (!byArtist.has(first)) byArtist.set(first, s);
  });
  return [...byArtist.entries()].slice(0, max).map(([name, song]) => ({
    id: `a-${name}`,
    title: name,
    subtitle: "Artist",
    cover: photos[name] ? imageCover(photos[name]) : nameGradient(name),
    initials: photos[name] ? undefined : initialsOf(name),
    round: true,
    song,
  }));
}

export function radioCards(songs, max = 6, photos = {}) {
  const artists = artistCards(songs, max, photos);
  // the face of an artist on a radio card: the artist photo if we have one, else the song cover
  const face = (card) => (photos[card.title] ? card.cover : card.song.cover);
  return artists.map((a, i) => {
    const others = artists.filter((x) => x !== a);
    const color = RADIO_COLORS[i % RADIO_COLORS.length];
    const names = others.slice(0, 3).map((x) => x.title);
    return {
      id: `r-${a.title}`,
      title: "",
      subtitle: names.length ? `With ${names.join(", ")} and more` : "Radio",
      cover: color,
      radio: {
        color,
        name: a.title,
        faces: [others[0] ? face(others[0]) : face(a), face(a), others[1] ? face(others[1]) : face(a)],
      },
      song: a.song,
    };
  });
}

// Same song = same title + first artist. Some sources (iTunes) return one song several times
// with different ids (single, album, "From the film..." edition), so the id alone is not enough.
export function songKey(song) {
  const title = song.title
    .toLowerCase()
    .replace(/\s*[([].*?[)\]]/g, "") // "(From ...)", "[Remastered]"
    .replace(/\s+-\s+.*$/, "") // "Song - From 'Film'"
    .trim();
  return `${title}|${primaryArtist(song.artist).toLowerCase()}`;
}

// Flat list without duplicate songs (for next/prev and search)
export function uniqueSongs(list) {
  const ids = new Set();
  const keys = new Set();
  return list.filter((s) => {
    const key = songKey(s);
    if (ids.has(s.id) || keys.has(key)) return false;
    ids.add(s.id);
    keys.add(key);
    return true;
  });
}

// Artist and radio rows are always built from songs, so they live in one place
export function discoveryRows(songs, photos = {}) {
  const artists = artistCards(songs, 8, photos);
  const radios = radioCards(songs, 6, photos);
  return [
    artists.length > 1 && { id: "artists", title: "Suggested artists", caption: "Inspired by your recent activity", items: artists },
    radios.length > 1 && { id: "radio", title: "Popular radio", items: radios },
  ].filter(Boolean);
}