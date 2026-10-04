import { useEffect, useRef, useState } from "react";
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from "react-icons/fa";
import {
  FiVolume2,
  FiVolumeX,
 
  FiMaximize,
  FiShuffle,
  FiRepeat,
  FiPlusCircle,
} from "react-icons/fi";
import { TbMicrophone2 } from "react-icons/tb";

import {
  
  MdOutlineDevices,
  MdOutlinePictureInPictureAlt,
} from "react-icons/md";
import { HiOutlineQueueList } from "react-icons/hi2";
import "./Player.css";

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
}

function Player({ song, isPlaying, onTogglePlay, onNext, onPrev, shuffle, onToggleShuffle }) {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [repeat, setRepeat] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !song) return;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, song]);

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    audioRef.current.loop = repeat;
  }, [repeat]);

  function handleSeek(e) {
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="player">
      <audio
        ref={audioRef}
        src={song ? song.src : undefined}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={onNext}
      />

      <div className="player__left">
        {song && (
          <>
            <div className="player__cover" style={{ background: song.cover }} />
            <div className="player__info">
              <p className="player__title">{song.title}</p>
              <p className="player__artist">{song.artist}</p>
            </div>
            <button className="player__icon-btn player__add" aria-label="Add to Liked Songs">
              <FiPlusCircle size={16} />
            </button>
          </>
        )}
      </div>

      <div className="player__center">
        <div className="player__controls">
  <div className="player__side player__side--left">
    <button
      className={`player__btn ${shuffle ? "player__btn--on" : ""}`}
      aria-label="Shuffle"
      onClick={onToggleShuffle}
    >
      <FiShuffle size={16} />
    </button>
    <button className="player__btn" aria-label="Previous" onClick={onPrev} disabled={!song}>
      <FaStepBackward size={16} />
    </button>
  </div>

  <button
    className="player__btn player__play"
    aria-label={isPlaying ? "Pause" : "Play"}
    onClick={onTogglePlay}
    disabled={!song}
  >
    {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} />}
  </button>

  <div className="player__side">
    <button className="player__btn" aria-label="Next" onClick={onNext} disabled={!song}>
      <FaStepForward size={16} />
    </button>
    <button
      className={`player__btn ${repeat ? "player__btn--on" : ""}`}
      aria-label="Repeat"
      onClick={() => setRepeat(!repeat)}
    >
      <FiRepeat size={16} />
    </button>
  </div>
</div>

        <div className="player__progress">
          <span className="player__time">{formatTime(currentTime)}</span>
          <input
            className="player__range"
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            disabled={!song}
            aria-label="Seek"
            style={{ "--progress": `${progress}%` }}
          />
          <span className="player__time">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player__right">
        <button className="player__icon-btn player__extra" aria-label="Lyrics">
          <TbMicrophone2 size={16}/>
        </button>
        <button className="player__icon-btn player__extra" aria-label="Queue">
          <HiOutlineQueueList size={20}/>
        </button>
        <button className="player__icon-btn player__extra" aria-label="Connect to a device">
          <MdOutlineDevices size={20} />
        </button>

        <button
          className="player__icon-btn"
          aria-label={volume === 0 ? "Unmute" : "Mute"}
          onClick={() => setVolume(volume === 0 ? 1 : 0)}
        >
          {volume === 0 ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
        </button>
        <input
          className="player__range player__volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Volume"
          style={{ "--progress": `${volume * 100}%` }}
        />

        <button className="player__icon-btn player__extra" aria-label="Mini player">
          <MdOutlinePictureInPictureAlt size={20} />
        </button>
        <button className="player__icon-btn" aria-label="Full screen" onClick={toggleFullscreen}>
          <FiMaximize size={18} />
        </button>
      </div>
    </footer>
  );
}

export default Player;