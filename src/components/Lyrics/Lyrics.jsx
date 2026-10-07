import { useEffect, useRef } from "react";
import { usePlaybackTime } from "../../utils/playback";
import { activeLineIndex } from "../../utils/lyrics";
import "./Lyrics.css";

// Time-synced lyrics: the line being sung is highlighted and kept in the middle of the view
function SyncedLines({ lines }) {
  const time = usePlaybackTime();
  const active = activeLineIndex(lines, time);
  const bodyRef = useRef(null);

  useEffect(() => {
    const body = bodyRef.current;
    const el = body?.querySelector(".lyrics__line--active");
    if (!body || !el) return;
    body.scrollTo({ top: el.offsetTop - body.clientHeight / 2 + el.clientHeight / 2, behavior: "smooth" });
  }, [active]);

  return (
    <div className="lyrics__body" ref={bodyRef}>
      {lines.map((l, i) => (
        <p
          key={i}
          className={`lyrics__line ${i === active ? "lyrics__line--active" : ""} ${i < active ? "lyrics__line--past" : ""}`}
        >
          {l.text || "♪"}
        </p>
      ))}
    </div>
  );
}

// lyrics = { status, plain, synced } from useLyrics
// A full track (Spotify) has a real position, so its lyrics can follow along. A 30-second
// preview starts somewhere in the middle of the song, so its lyrics are shown as plain text.
function Lyrics({ song, lyrics }) {
  const followAlong = Boolean(song?.uri) && lyrics.synced;

  let body;
  if (lyrics.status === "loading") {
    body = <p className="lyrics__note">Looking for lyrics&hellip;</p>;
  } else if (lyrics.status === "instrumental") {
    body = <p className="lyrics__note">This one is instrumental. Just enjoy the music.</p>;
  } else if (lyrics.status !== "ok") {
    body = <p className="lyrics__note">Lyrics are not available for this song yet.</p>;
  } else if (followAlong) {
    body = <SyncedLines lines={lyrics.synced} />;
  } else {
    body = (
      <div className="lyrics__body">
        {lyrics.plain.split("\n").map((line, i) => (
          <p key={i} className={`lyrics__line lyrics__line--plain ${line.trim() ? "" : "lyrics__gap"}`}>
            {line}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="lyrics">
      {body}
      {lyrics.status === "ok" && (
        <p className="lyrics__credit">
          Lyrics from LRCLIB{!song?.uri ? " · previews are not time-synced" : ""}
        </p>
      )}
    </div>
  );
}

export default Lyrics;