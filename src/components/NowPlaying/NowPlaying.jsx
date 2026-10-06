import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "./NowPlaying.css";

function NowPlaying({ open, onToggle, song, upNext = [], onPlayUpNext }) {
  if (!open) {
    return (
      <aside className="nowplaying nowplaying--closed">
        <button
          className="nowplaying__toggle"
          aria-label="Show now playing view"
          onClick={onToggle}
        >
          <FiChevronLeft size={20} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="nowplaying">
      <div className="nowplaying__header">
        <button
          className="nowplaying__toggle"
          aria-label="Hide now playing view"
          onClick={onToggle}
        >
          <FiChevronRight size={20} />
        </button>
        <h2>Now playing</h2>
      </div>

      {song ? (
        <>
          <div className="nowplaying__cover" style={{ background: song.cover }} />
          <h3 className="nowplaying__title">{song.title}</h3>
          <p className="nowplaying__artist">{song.artist}</p>

          <div className="nowplaying__card">
            <h4>About the artist</h4>
            <p className="nowplaying__name">{song.artist}</p>
            {song.demo && (
              <p>
                A made-up artist created for this demo project.
              </p>
            )}
            {song.uri && <p>Playing from your Spotify account.</p>}
            {!song.demo && !song.uri && <p>30-second preview from Apple Music.</p>}
            {song.link && (
              <a className="nowplaying__link" href={song.link} target="_blank" rel="noreferrer">
                {song.uri ? "Open in Spotify" : "Open in Apple Music"}
              </a>
            )}
          </div>

          {upNext.length > 0 && (
            <div className="nowplaying__card">
              <h4>Next in queue</h4>
              {upNext.map((next) => (
                <button key={next.id} className="nowplaying__next" onClick={() => onPlayUpNext(next)}>
                  <div className="nowplaying__next-cover" style={{ background: next.cover }} />
                  <div className="nowplaying__next-text">
                    <p className="nowplaying__next-title">{next.title}</p>
                    <p>{next.artist}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="nowplaying__empty">
          Pick a song and it will show up here.
        </p>
      )}
    </aside>
  );
}

export default NowPlaying;