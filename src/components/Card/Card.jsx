import { FaPlay, FaPause } from "react-icons/fa";
import "./Card.css";

function Card({ title, subtitle, cover, isActive, isPlaying, onPlay }) {
  return (
    <div className="card" onClick={onPlay}>
      <div className="card__cover" style={{ background: cover }}>
        <button
          className={`card__play ${isActive ? "card__play--active" : ""}`}
          aria-label={isActive && isPlaying ? "Pause" : "Play"}
        >
          {isActive && isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
        </button>
      </div>
      <p className="card__title">{title}</p>
      <p className="card__subtitle">{subtitle}</p>
    </div>
  );
}

export default Card;