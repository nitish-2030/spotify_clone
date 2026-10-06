import { FaPlay, FaPause } from "react-icons/fa";
import "./Card.css";

// round = circular cover (artist), initials = letters when there is no photo,
// coverClass = extra class, children = extra content inside the cover
function Card({ title, subtitle, cover, round, initials, coverClass = "", isActive, isPlaying, onPlay, children }) {
  return (
    <div className="card" onClick={onPlay}>
      <div
        className={`card__cover ${round ? "card__cover--round" : ""} ${initials ? "card__cover--initials" : ""} ${coverClass}`}
        style={{ background: cover }}
      >
        {initials && <span className="card__initials">{initials}</span>}
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