import { moodInfo } from "../../utils/mood";
import "./Ambience.css";

// Floating particles that match the mood of the playing song: hearts, diya sparks, neon
// diamonds, rain. Pure CSS animation, no randomness (positions come from the index).
const GLYPHS = {
  romantic: ["♥"],
  devotional: ["✦", "ॐ"],
  phonk: ["◆", "▲"],
  sad: [""],
};
const COUNT = 16;

function Ambience({ mood }) {
  const info = moodInfo(mood);
  if (!info) return null;
  const glyphs = GLYPHS[mood];

  return (
    <>
      <div key={mood} className={`ambience ambience--${mood}`} aria-hidden="true">
        {Array.from({ length: COUNT }, (_, i) => (
          <span
            key={i}
            className="ambience__p"
            style={{
              "--x": `${(i * 37 + 11) % 100}%`,
              "--d": `${-(((i * 53) % 100) / 10)}s`,
              "--t": `${9 + ((i * 7) % 8)}s`,
              "--s": `${12 + ((i * 5) % 16)}px`,
            }}
          >
            {glyphs[i % glyphs.length]}
          </span>
        ))}
      </div>
      <div key={`label-${mood}`} className="mood-label" role="status">
        <span className="mood-label__glyph">{info.glyph}</span> {info.label} mood
      </div>
    </>
  );
}

export default Ambience;