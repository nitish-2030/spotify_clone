import { FaPlay, FaPause } from "react-icons/fa";
import "./Card.css";

// round = gol cover (artist), coverClass = extra class, children = cover ke andar ka extra content
function Card({ title, subtitle, cover, round, coverClass = "", isActive, isPlaying, onPlay, children }) {
  return (
    <div className="card" onClick={onPlay}>
      <div
        className={`card__cover ${round ? "card__cover--round" : ""} ${coverClass}`}
        style={{ background: cover }}
      >
        {children}
        <button
          className={`card__play ${isActive ? "card__play--active" : ""}`}
          aria-label={isActive && isPlaying ? "Pause" : "Play"}
        >
          {isActive && isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
        </button>
      </div>
      {title && <p className="card__title">{title}</p>}
      <p className="card__subtitle">{subtitle}</p>
    </div>
  );
}

export default Card;