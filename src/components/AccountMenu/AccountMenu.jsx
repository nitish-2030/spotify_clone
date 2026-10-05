import { useEffect, useRef, useState } from "react";
import { FiCheck } from "react-icons/fi";
import "./AccountMenu.css";

// Avatar dropdown: yahin se content source switch hota hai (Spotify / General)
function AccountMenu({ mode, source, spotifyAvailable, spotifyConnected, onModeChange, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  function pick(m) {
    setOpen(false);
    onModeChange(m);
  }

  return (
    <div className="account" ref={ref}>
      <button className="topbar__avatar" aria-label="Profile" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>N</span>
      </button>

      {open && (
        <div className="account__menu" role="menu">
          <p className="account__label">Content source</p>
          <button className="account__item" role="menuitemradio" aria-checked={mode === "general"} onClick={() => pick("general")}>
            <span>General</span>
            {mode === "general" && <FiCheck size={16} />}
          </button>
          {spotifyAvailable && (
            <button className="account__item" role="menuitemradio" aria-checked={mode === "spotify"} onClick={() => pick("spotify")}>
              <span>Spotify{!spotifyConnected && " (connect)"}</span>
              {mode === "spotify" && <FiCheck size={16} />}
            </button>
          )}
          <p className="account__hint">Showing: {source === "spotify" ? "Spotify" : source === "general" ? "General" : "Demo"}</p>
          {spotifyConnected && (
            <button className="account__item account__item--sep" onClick={() => { setOpen(false); onLogout(); }}>
              Disconnect Spotify
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default AccountMenu;
