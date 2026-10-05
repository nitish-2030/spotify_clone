// Sab sources ek hi shape banate hain, taaki UI ko pata hi na chale data kahan se aaya.
// song  = { id, title, artist, cover, src?, uri? }   (src = preview mp3, uri = Spotify track)
// item  = { id, title, subtitle, cover, round?, radio?, song }   (card ke liye ready)

const RADIO_COLORS = ["#ffd978", "#8fead8", "#ffa575", "#ff9fb3", "#b9a8ff", "#9ad8ff"];

// Artist ke naam se hamesha same gradient + initials (photo nahi hai to)
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

export const imageCover = (url) => `url("${url}") center / cover no-repeat, #282828`;

export const songCard = (song) => ({
  id: `s-${song.id}`,
  title: song.title,
  subtitle: song.artist,
  cover: song.cover,
  song,
});

export function artistCards(songs, max = 8) {
  const byArtist = new Map();
  songs.forEach((s) => {
    const first = s.artist.split(",")[0].trim();
    if (!byArtist.has(first)) byArtist.set(first, s);
  });
  return [...byArtist.entries()].slice(0, max).map(([name, song]) => ({
    id: `a-${name}`,
    title: name,
    subtitle: "Artist",
    cover: nameGradient(name),
    initials: initialsOf(name),
    round: true,
    song,
  }));
}

export function radioCards(songs, max = 6) {
  const artists = artistCards(songs, max);
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
        faces: [others[0]?.song.cover ?? a.song.cover, a.song.cover, others[1]?.song.cover ?? a.song.cover],
      },
      song: a.song,
    };
  });
}

// Duplicate songs hata ke flat list (next/prev, search ke liye)
export function uniqueSongs(list) {
  const seen = new Map();
  list.forEach((s) => seen.has(s.id) || seen.set(s.id, s));
  return [...seen.values()];
}

// Radio/artist rows hamesha songs se bante hain, isliye ek jagah se
export function discoveryRows(songs) {
  const artists = artistCards(songs);
  const radios = radioCards(songs);
  return [
    artists.length > 1 && { id: "artists", title: "Suggested artists", caption: "Inspired by your recent activity", items: artists },
    radios.length > 1 && { id: "radio", title: "Popular radio", items: radios },
  ].filter(Boolean);
}
