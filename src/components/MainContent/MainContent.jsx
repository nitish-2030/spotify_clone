import { useState } from "react";
import { FaSpotify, FaInstagram, FaTwitter, FaFacebook } from "react-icons/fa";
import Card from "../Card/Card";
import { uniqueSongs } from "../../sources/cards";
import { MOODS, moodInfo, moodOf } from "../../utils/mood";
import "./MainContent.css";

// "All / Music / Podcasts" + one chip per mood (a mood chip shows every song of that mood)
const chips = ["All", "Music", "Podcasts", ...MOODS.map((m) => m.id)];
const chipLabel = (chip) => moodInfo(chip)?.label ?? chip;

// Grey placeholder cards shown while the content is loading
function Skeleton() {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Loading your music">
      {[0, 1, 2].map((row) => (
        <div key={row} className="skeleton__section">
          <div className="skeleton__title" />
          <div className="skeleton__row">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="skeleton__card">
                <div className="skeleton__cover" />
                <div className="skeleton__line" />
                <div className="skeleton__line skeleton__line--short" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const FOOTER_COLUMNS = [
  {
    title: "Company",
    links: [
      { label: "About", href: "https://www.spotify.com/about-us/contact/" },
      { label: "Jobs", href: "https://www.lifeatspotify.com/" },
      { label: "For the Record", href: "https://newsroom.spotify.com/" },
    ],
  },
  {
    title: "Communities",
    links: [
      { label: "For Artists", href: "https://artists.spotify.com/" },
      { label: "Developers", href: "https://developer.spotify.com/" },
      { label: "Advertising", href: "https://ads.spotify.com/" },
    ],
  },
  {
    title: "Useful links",
    links: [
      { label: "Support", href: "https://support.spotify.com/" },
      { label: "Free Mobile App", href: "https://www.spotify.com/download/" },
    ],
  },
];

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__columns">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="footer__col">
              <h3>{col.title}</h3>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer__social">
          <a href="https://www.instagram.com/spotify" target="_blank" rel="noreferrer" aria-label="Instagram"><FaInstagram size={16} /></a>
          <a href="https://twitter.com/spotify" target="_blank" rel="noreferrer" aria-label="Twitter"><FaTwitter size={16} /></a>
          <a href="https://www.facebook.com/Spotify" target="_blank" rel="noreferrer" aria-label="Facebook"><FaFacebook size={16} /></a>
        </div>
      </div>
      <div className="footer__bottom">
        <p>&copy; {new Date().getFullYear()} Spotify Clone. A learning project, not affiliated with Spotify AB.</p>
      </div>
    </footer>
  );
}

function Section({ title, caption, wrap, tall, children }) {
  const [expanded, setExpanded] = useState(false);
  const showAll = wrap || expanded;
  return (
    <section className="section">
      {caption && <p className="section__caption">{caption}</p>}
      <div className="section__head">
        <h2>{title}</h2>
        {!wrap && (
          <button className="section__all" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Show less" : "Show all"}
          </button>
        )}
      </div>
      <div
        className={`section__row ${showAll ? "section__row--all" : ""} ${tall ? "section__row--tall" : ""}`}
      >
        {children}
      </div>
    </section>
  );
}

// content = { songs, sections: [{ id, title, caption, tall, items: [card] }] }
// Demo, General and Spotify all produce this same shape, so the UI is the same for all of them.
// search = { results: [song], searching: boolean } from useSearch
function MainContent({ content, loading, currentSong, isPlaying, onPlay, query, view, search }) {
  const [activeChip, setActiveChip] = useState("All");
  // Which section the playing song was started from. The same song can sit in several sections
  // (e.g. a song row and an artist card), and only the card that was clicked should light up.
  const [playingSection, setPlayingSection] = useState(null);

  const q = query.trim();
  const songs = content?.songs ?? [];

  // `list` = the songs of the row this card is in, so next/previous stay inside that row
  // `sectionId` = the section the card is in, `visible` = ids of all sections on screen
  const renderCard = (item, list, sectionId, visible) => (
    <Card
      key={item.id}
      round={item.round}
      initials={item.initials}
      coverClass={item.radio ? "radio" : ""}
      title={item.title}
      subtitle={item.subtitle}
      cover={item.cover}
      isActive={
        currentSong?.id === item.song.id &&
        (!visible.includes(playingSection) || playingSection === sectionId)
      }
      isPlaying={isPlaying}
      onPlay={() => {
        const switchContext = playingSection !== sectionId;
        setPlayingSection(sectionId);
        onPlay(item.song, list, { switchContext });
      }}
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
    body = <Skeleton />;
  } else if (q) {
    const { results, searching } = search;
    body =
      results.length > 0 ? (
        <Section title={`Results for "${q}"`} wrap>
          {results.map((s) => renderCard(songItem(s), results, "search", ["search"]))}
        </Section>
      ) : searching ? (
        <p className="main__empty">Searching…</p>
      ) : (
        <p className="main__empty">No results found for "{q}"</p>
      );
  } else if (moodInfo(activeChip)) {
    const moodSongs = songs.filter((s) => moodOf(s) === activeChip);
    body =
      moodSongs.length > 0 ? (
        <Section title={`${chipLabel(activeChip)} songs`} caption="Opens in its own colour theme" wrap>
          {moodSongs.map((s) => renderCard(songItem(s), moodSongs, `mood-${activeChip}`, [`mood-${activeChip}`]))}
        </Section>
      ) : (
        <p className="main__empty">No {chipLabel(activeChip).toLowerCase()} songs in this list yet</p>
      );
  } else if (activeChip === "Podcasts") {
    body = <p className="main__empty">No podcasts to show yet</p>;
  } else if (view === "browse") {
    body = (
      <Section title="Browse all" wrap>
        {songs.map((s) => renderCard(songItem(s), songs, "browse", ["browse"]))}
      </Section>
    );
  } else {
    const visible = content.sections.map((sec) => sec.id);
    body = content.sections.map((sec) => {
      const list = uniqueSongs(sec.items.map((item) => item.song));
      return (
        <Section key={sec.id} title={sec.title} caption={sec.caption} tall={sec.tall}>
          {sec.items.map((item) => renderCard(item, list, sec.id, visible))}
        </Section>
      );
    });
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
            {chipLabel(chip)}
          </button>
        ))}
      </div>
      {body}
      {!loading && content && <Footer />}
    </main>
  );
}

export default MainContent;