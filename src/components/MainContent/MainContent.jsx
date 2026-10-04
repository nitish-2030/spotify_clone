import { useState } from "react";
import Card from "../Card/Card";
import "./MainContent.css";

const chips = ["All", "Music", "Podcasts"];

function Section({ title, wrap, children }) {
  return (
    <section className="section">
      <div className="section__head">
        <h2>{title}</h2>
        {!wrap && <button className="section__all">Show all</button>}
      </div>
      <div className={`section__row ${wrap ? "section__row--all" : ""}`}>
        {children}
      </div>
    </section>
  );
}

function MainContent({ songs, playlists, currentSong, isPlaying, onPlay, query }) {
  const [activeChip, setActiveChip] = useState("All");

  const q = query.trim().toLowerCase();
  const results = q
    ? songs.filter(
        (s) =>
          s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
      )
    : [];

  const renderSongCard = (song) => (
    <Card
      key={song.id}
      title={song.title}
      subtitle={song.artist}
      cover={song.cover}
      isActive={currentSong?.id === song.id}
      isPlaying={isPlaying}
      onPlay={() => onPlay(song)}
    />
  );

  return (
    <main className="main">
      <div className="main__chips">
        {chips.map((chip) => (
          <button
            key={chip}
            className={`main__chip ${activeChip === chip ? "main__chip--active" : ""}`}
            onClick={() => setActiveChip(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      {q ? (
        results.length > 0 ? (
          <Section title={`Results for "${query.trim()}"`} wrap>
            {results.map(renderSongCard)}
          </Section>
        ) : (
          <p className="main__empty">No results found for "{query.trim()}"</p>
        )
      ) : (
        <>
          <Section title="Popular albums and singles">
            {songs.map(renderSongCard)}
          </Section>

          <Section title="Editor's Picks: No-Skip Playlists">
            {playlists.map((playlist) => (
              <Card
                key={playlist.id}
                title={playlist.title}
                subtitle={playlist.description}
                cover={playlist.song.cover}
                isActive={currentSong?.id === playlist.song.id}
                isPlaying={isPlaying}
                onPlay={() => onPlay(playlist.song)}
              />
            ))}
          </Section>
        </>
      )}
    </main>
  );
}

export default MainContent;