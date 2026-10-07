import { useEffect, useRef, useState } from "react";
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import { createLevels, BINS } from "../../utils/audioLevels";
import { activeLineIndex } from "../../utils/lyrics";
import { getAudio, usePlaybackTime } from "../../utils/playback";
import "./Visualizer.css";

const STYLES = [
  { id: "disco", label: "Disco" },
  { id: "rings", label: "Rings" },
  { id: "wave", label: "Wave" },
];
const MOOD_HUE = { romantic: 335, devotional: 32, phonk: 320, sad: 215 };
const DEFAULT_HUE = 145;

// The line being sung (only for songs whose lyrics are time-synced)
function LyricLine({ synced }) {
  const time = usePlaybackTime();
  const i = activeLineIndex(synced, time);
  return (
    <div className="viz__lyric">
      <p key={i} className="viz__lyric-now">{synced[i]?.text || "♪"}</p>
      <p className="viz__lyric-next">{synced[i + 1]?.text ?? ""}</p>
    </div>
  );
}

function Visualizer({ song, isPlaying, mood, lyrics, onClose, onTogglePlay, onNext, onPrev }) {
  const canvasRef = useRef(null);
  const coverRef = useRef(null);
  const [style, setStyle] = useState("disco");
  const [live, setLive] = useState(false);

  // The animation loop reads these through refs, so changing them never restarts the loop
  const playingRef = useRef(isPlaying);
  const styleRef = useRef(style);
  const hueRef = useRef(MOOD_HUE[mood] ?? DEFAULT_HUE);
  const closeRef = useRef(onClose); // the parent passes a new function every render
  useEffect(() => {
    closeRef.current = onClose;
    playingRef.current = isPlaying;
    styleRef.current = style;
    hueRef.current = MOOD_HUE[mood] ?? DEFAULT_HUE;
  }, [onClose, isPlaying, style, mood]);

  // Browser full screen while this view is open; leaving full screen (Esc) closes the view too
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    const onChange = () => {
      if (!document.fullscreenElement) closeRef.current();
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.code === "Escape") closeRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- the animation ----
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const levels = createLevels({ src: song.uri ? null : song.src, audio: getAudio() });
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let wasLive = false;
    let flash = 0;
    const rings = [];
    const sparks = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const size = Math.min(w, h) * 0.36;
      coverRef.current.style.width = `${size}px`;
      coverRef.current.style.height = `${size}px`;
    }
    resize();
    window.addEventListener("resize", resize);

    function frame(now) {
      const t = now / 1000;
      const f = levels.step(now, playingRef.current);
      if (f.live !== wasLive) {
        wasLive = f.live;
        setLive(f.live);
      }

      const mode = styleRef.current;
      const baseHue = hueRef.current;
      // Disco cycles through every colour, the other styles stay close to the mood colour
      const hueAt = (k = 0) => (mode === "disco" ? (baseHue + t * 45 + k) % 360 : baseHue + Math.sin(t * 0.5) * 25 + k * 0.12);

      const cx = w / 2;
      const cy = h * 0.46;
      const cover = Math.min(w, h) * 0.36;
      const r0 = cover * 0.54;
      const reach = Math.min(w, h) * 0.55;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = mode === "wave" ? "rgba(6, 4, 12, 0.3)" : "rgba(6, 4, 12, 0.2)"; // trails
      ctx.fillRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(cx, cy, r0 * 0.5, cx, cy, reach);
      glow.addColorStop(0, `hsla(${hueAt()}, 90%, 45%, ${0.1 + f.bass * 0.3})`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";

      if (f.beat) {
        rings.push({ born: now, hue: hueAt() });
        if (rings.length > 8) rings.shift();
        flash = 0.35;
        if (mode === "disco") {
          for (let i = 0; i < 22; i++) {
            const a = (i / 22) * Math.PI * 2 + Math.random() * 0.3;
            const speed = 2.5 + Math.random() * 5;
            sparks.push({ x: cx + Math.cos(a) * r0, y: cy + Math.sin(a) * r0, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 1, hue: hueAt(i * 16) });
          }
          if (sparks.length > 220) sparks.splice(0, sparks.length - 220);
        }
      }

      // rotating disco light beams
      if (mode === "disco") {
        const beamR = Math.max(w, h);
        for (let b = 0; b < 8; b++) {
          const a = t * 0.5 + (b * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, beamR, a, a + 0.16);
          ctx.closePath();
          ctx.fillStyle = `hsla(${hueAt(b * 45)}, 100%, 60%, ${0.04 + f.bass * 0.1})`;
          ctx.fill();
        }
      }

      // expanding rings (one per beat)
      for (let i = rings.length - 1; i >= 0; i--) {
        const age = (now - rings[i].born) / 1600;
        if (age > 1) {
          rings.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(cx, cy, r0 + age * reach, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${rings[i].hue}, 100%, 62%, ${(1 - age) * 0.75})`;
        ctx.lineWidth = 2 + (1 - age) * 7;
        ctx.stroke();
      }

      // circular spectrum around the cover
      if (mode !== "wave") {
        const maxLen = r0 * (mode === "rings" ? 0.55 : 0.95);
        ctx.lineCap = "round";
        ctx.lineWidth = Math.max(2, (Math.PI * 2 * r0) / (BINS * 2 * 1.9));
        for (let k = 0; k < BINS * 2; k++) {
          const v = f.bins[k < BINS ? k : BINS * 2 - 1 - k];
          const a = (k / (BINS * 2)) * Math.PI * 2 - Math.PI / 2;
          const len = 5 + v * maxLen;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * (r0 + 6), cy + Math.sin(a) * (r0 + 6));
          ctx.lineTo(cx + Math.cos(a) * (r0 + 6 + len), cy + Math.sin(a) * (r0 + 6 + len));
          ctx.strokeStyle = `hsl(${hueAt(k * 2.8)}, 95%, ${55 + v * 15}%)`;
          ctx.stroke();
        }
      }

      // spectrum bars along the bottom (disco + rings)
      if (mode !== "wave") {
        const bw = w / BINS;
        for (let i = 0; i < BINS; i++) {
          const bh = f.bins[i] * h * 0.2;
          ctx.fillStyle = `hsla(${hueAt(i * 5)}, 95%, 58%, 0.8)`;
          ctx.fillRect(i * bw + 1, h - bh, bw - 2, bh);
        }
      }

      // flowing waves (wave style)
      if (mode === "wave") {
        for (let layer = 0; layer < 3; layer++) {
          ctx.beginPath();
          for (let x = 0; x <= w; x += 8) {
            const bin = f.bins[Math.min(BINS - 1, Math.floor((x / w) * BINS * 0.8))];
            const amp = (0.04 + bin * 0.5 + f.bass * 0.2) * h * 0.22 * (1 - layer * 0.22);
            const y = h * 0.8 + Math.sin(x * 0.012 + t * (1.2 + layer * 0.6) + layer * 2) * amp;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = `hsla(${hueAt(layer * 40)}, 100%, 62%, 0.85)`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }

      // confetti sparks (disco)
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.07;
        s.life -= 0.015;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.5 * s.life + 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 100%, 65%, ${s.life})`;
        ctx.fill();
      }

      // white flash on the beat
      flash *= 0.88;
      if (mode === "disco" && flash > 0.01) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.22})`;
        ctx.fillRect(0, 0, w, h);
      }

      // the cover pulses with the bass
      const el = coverRef.current;
      el.style.transform = `scale(${1 + f.bass * 0.08})`;
      el.style.boxShadow = `0 0 ${40 + f.bass * 90}px hsla(${hueAt()}, 100%, 60%, 0.6)`;

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      levels.destroy();
    };
  }, [song]);

  const nextStyle = () => setStyle(STYLES[(STYLES.findIndex((s) => s.id === style) + 1) % STYLES.length].id);

  return (
    <div className="viz" role="dialog" aria-label="Full screen player" data-source={live ? "live" : "simulated"}>
      <canvas ref={canvasRef} className="viz__canvas" />

      <div className="viz__top">
        <button className="viz__btn" onClick={onClose} aria-label="Close full screen">
          <FiX size={22} />
        </button>
        <span className="viz__badge" title={live ? "Reacting to the real audio" : "Spotify tracks and some previews cannot be analysed, so the beat is simulated"}>
          <i className={live ? "viz__dot viz__dot--live" : "viz__dot"} />
          {live ? "Live audio" : "Simulated beat"}
        </span>
        <button className="viz__btn viz__btn--text" onClick={nextStyle} aria-label="Change visual style">
          {STYLES.find((s) => s.id === style).label}
        </button>
      </div>

      <div className="viz__stage">
        <div ref={coverRef} className="viz__cover" style={{ background: song.cover }} onClick={onTogglePlay} />
      </div>

      <div className="viz__bottom">
        <div className="viz__text">
          <h2>{song.title}</h2>
          <p>{song.artist}</p>
        </div>
        {song.uri && lyrics?.synced && <LyricLine synced={lyrics.synced} />}
        <div className="viz__controls">
          <button className="viz__btn" onClick={onPrev} aria-label="Previous"><FaStepBackward size={16} /></button>
          <button className="viz__btn viz__btn--play" onClick={onTogglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
          </button>
          <button className="viz__btn" onClick={onNext} aria-label="Next"><FaStepForward size={16} /></button>
        </div>
      </div>
    </div>
  );
}

export default Visualizer;