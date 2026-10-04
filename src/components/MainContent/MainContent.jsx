import { useState } from "react";
import { FaSpotify } from "react-icons/fa";
import Card from "../Card/Card";
import "./MainContent.css";

const chips = ["All", "Music", "Podcasts"];

function Section({ title, caption, wrap, tall, children }) {
  return (
    <section className="section">
      {caption && <p className="section__caption">{caption}</p>}
      <div className="section__head">
        <h2>{title}</h2>
        {!wrap && <button className="section__all">Show all</button>}
      </div>
      <div
        className={`section__row ${wrap ? "section__row--all" : ""} ${tall ? "section__row--tall" : ""}`}
      >
        {children}
      </div>
    </section>
  );
}

function MainContent({
  songs,
  playlists,
  artists,
  radios,
  currentSong,
  isPlaying,
  onPlay,
  query,
}) {
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
          <Section
            title="Recommended for today"
            caption="Inspired by your recent activity"
            tall
          >
            {songs.map(renderSongCard)}
          </Section>

          <Section
            title="Based on your recent listening"
            caption="Inspired by your recent activity"
            tall
          >
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

          <Section title="Suggested artists" caption="Inspired by your recent activity">
            {artists.map((artist) => (
              <Card
                key={artist.id}
                round
                title={artist.name}
                subtitle="Artist"
                cover={artist.song.cover}
                isActive={currentSong?.id === artist.song.id}
                isPlaying={isPlaying}
                onPlay={() => onPlay(artist.song)}
              />
            ))}
          </Section>

          <Section title="Popular radio">
            {radios.map((radio) => (
              <Card
                key={radio.id}
                coverClass="radio"
                subtitle={radio.note}
                cover={radio.color}
                isActive={currentSong?.id === radio.song.id}
                isPlaying={isPlaying}
                onPlay={() => onPlay(radio.song)}
              >
                <div className="radio__top">
                  <FaSpotify size={14} />
                  <span>RADIO</span>
                </div>
                <div className="radio__faces" style={{ "--radio-bg": radio.color }}>
                  <i style={{ background: radio.faces[0] }} />
                  <i style={{ background: radio.faces[2] }} />
                  <i style={{ background: radio.faces[1] }} />
                </div>
                <p className="radio__name">{radio.name}</p>
              </Card>
            ))}
          </Section>

          <Section title="Popular albums and singles" tall>
            {[...songs].reverse().map(renderSongCard)}
          </Section>
        </>
      )}
    </main>
  );
}

export default MainContent;