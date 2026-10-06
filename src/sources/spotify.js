// Spotify content: only endpoints that work in Development Mode
// (top tracks/artists, recently played, liked songs). If one fails the rest still work.
import { getAccessToken } from "./spotifyAuth";
import { imageCover, songCard, uniqueSongs, discoveryRows } from "./cards";

export async function spotifyFetch(path, options = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error("Not logged in to Spotify");
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...options.headers },
  });
  if (res.status === 403) {
    throw new Error("Spotify denied access (add your email under Dashboard > User Management)");
  }
  if (!res.ok) throw new Error(`Spotify API ${res.status}`);
  return res.status === 204 ? null : res.json();
}

const pickImage = (images = []) => (images[1] || images[0])?.url;

function mapTrack(t) {
  if (!t?.id || !t.uri) return null;
  const img = pickImage(t.album?.images);
  return {
    id: `sp${t.id}`,
    uri: t.uri,
    link: `https://open.spotify.com/track/${t.id}`,
    title: t.name,
    artist: t.artists.map((a) => a.name).join(", "),
    cover: img ? imageCover(img) : "linear-gradient(135deg, #535353, #282828)",
  };
}

// Live search used by the search bar (Development Mode caps the page size at 10)
export async function searchSpotify(query) {
  const data = await spotifyFetch(`/search?q=${encodeURIComponent(query)}&type=track&limit=10`);
  return (data?.tracks?.items ?? []).map(mapTrack).filter(Boolean);
}

export async function loadSpotify() {
  const [top, recent, saved, artists, playlists] = await Promise.allSettled([
    spotifyFetch("/me/top/tracks?limit=20&time_range=medium_term"),
    spotifyFetch("/me/player/recently-played?limit=20"),
    spotifyFetch("/me/tracks?limit=20"),
    spotifyFetch("/me/top/artists?limit=12&time_range=medium_term"),
    spotifyFetch("/me/playlists?limit=20"),
  ]);

  const tracks = (r, pick = (x) => x) =>
    r.status === "fulfilled" ? (r.value?.items ?? []).map(pick).map(mapTrack).filter(Boolean) : [];
  const topT = tracks(top);
  const recentT = uniqueSongs(tracks(recent, (i) => i.track));
  const savedT = tracks(saved, (i) => i.track);

  const songs = uniqueSongs([...topT, ...recentT, ...savedT]);
  if (songs.length === 0) {
    const firstErr = [top, recent, saved].find((r) => r.status === "rejected");
    throw new Error(firstErr?.reason?.message || "No listening history or liked songs found in this Spotify account");
  }

  // An artist card needs one playable track by that artist
  const artistCards =
    artists.status === "fulfilled"
      ? (artists.value?.items ?? [])
          .map((a) => {
            const song = songs.find((s) => s.artist.split(", ").includes(a.name));
            const img = pickImage(a.images);
            return song && { id: `a-${a.id}`, title: a.name, subtitle: "Artist", cover: img ? imageCover(img) : song.cover, round: true, song };
          })
          .filter(Boolean)
      : [];

  const discovery = discoveryRows(songs);
  if (artistCards.length > 1) {
    const i = discovery.findIndex((r) => r.id === "artists");
    const row = { id: "artists", title: "Your top artists", caption: "Based on your listening", items: artistCards };
    i >= 0 ? (discovery[i] = row) : discovery.unshift(row);
  }

  const rows = [
    topT.length && { id: "top", title: "Your top tracks", caption: "Your most played lately", tall: true, items: topT.map(songCard) },
    recentT.length && { id: "recent", title: "Recently played", tall: true, items: recentT.map(songCard) },
    savedT.length && { id: "saved", title: "From your Liked Songs", tall: true, items: savedT.map(songCard) },
  ].filter(Boolean);

  // Library (sidebar): if playlists fail, library stays [] and everything else still works
  const library =
    playlists.status === "fulfilled"
      ? (playlists.value?.items ?? [])
          .filter((p) => p?.id)
          .map((p) => {
            const img = pickImage(p.images ?? []);
            return {
              id: `pl-${p.id}`,
              title: p.name,
              subtitle: `Playlist • ${p.owner?.display_name ?? "Spotify"}`,
              cover: img ? imageCover(img) : "linear-gradient(135deg, #535353, #282828)",
              url: p.external_urls?.spotify,
            };
          })
      : [];

  return { songs, sections: [...rows.slice(0, 2), ...discovery, ...rows.slice(2)], library };
}