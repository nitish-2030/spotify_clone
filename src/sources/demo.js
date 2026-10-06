// Last fallback: local demo data. Never fails and needs no internet.
import { songs as rawSongs, playlists } from "../data/songs";
import { songCard, discoveryRows } from "./cards";

export async function loadDemo() {
  const songs = rawSongs.map((s) => ({ ...s, demo: true }));
  const byId = new Map(songs.map((s) => [s.id, s]));

  return {
    songs,
    sections: [
      { id: "rec", title: "Recommended for today", caption: "Inspired by your recent activity", tall: true, items: songs.map(songCard) },
      {
        id: "recent",
        title: "Based on your recent listening",
        caption: "Inspired by your recent activity",
        tall: true,
        items: playlists.map((p) => ({
          id: p.id,
          title: p.title,
          subtitle: p.description,
          cover: p.song.cover,
          song: byId.get(p.song.id),
        })),
      },
      ...discoveryRows(songs),
      { id: "popular", title: "Popular albums and singles", tall: true, items: [...songs].reverse().map(songCard) },
    ],
  };
}
