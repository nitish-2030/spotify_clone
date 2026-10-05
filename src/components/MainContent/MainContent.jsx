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

// content = { songs, sections: [{ id, title, caption, tall, items: [card] }] }
// Spotify, General aur Demo teeno isi shape me aate hain, isliye UI ek hi hai.
function MainContent({ content, loading, currentSong, isPlaying, onPlay, query }) {
  const [activeChip, setActiveChip] = useState("All");

  const q = query.trim().toLowerCase();
  const songs = content?.songs ?? [];
  const results = q
    ? songs.filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
    : [];

  const renderCard = (item) => (
    <Card
      key={item.id}
      round={item.round}
      initials={item.initials}
      coverClass={item.radio ? "radio" : ""}
      title={item.title}
      subtitle={item.subtitle}
      cover={item.cover}
      isActive={currentSong?.id === item.song.id}
      isPlaying={isPlaying}
      onPlay={() => onPlay(item.song)}
    >
      {item.radio && (
        <>
          <div className="radio__top">
            <FaSpotify size={14} />
            <span>RADIO</span>
          </div>
          <div className="radio__faces" style={{ "--radio-bg": item.radio.color }}>
            <i style={{ background: item.radio.faces[0] }} />
            <i style={{ background: item.radio.faces[2] }} />
            <i style={{ background: item.radio.faces[1] }} />
          </div>
          <p className="radio__name">{item.radio.name}</p>
        </>
      )}
    </Card>
  );

  const songItem = (song) => ({ id: `q-${song.id}`, title: song.title, subtitle: song.artist, cover: song.cover, song });

  let body;
  if (loading || !content) {
    body = <p className="main__empty">Loading your music…</p>;
  } else if (q) {
    body =
      results.length > 0 ? (
        <Section title={`Results for "${query.trim()}"`} wrap>
          {results.map((s) => renderCard(songItem(s)))}
        </Section>
      ) : (
        <p className="main__empty">No results found for "{query.trim()}"</p>
      );
  } else {
    body = content.sections.map((sec) => (
      <Section key={sec.id} title={sec.title} caption={sec.caption} tall={sec.tall}>
        {sec.items.map(renderCard)}
      </Section>
    ));
  }

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
      {body}
    </main>
  );
}

export default MainContent;
