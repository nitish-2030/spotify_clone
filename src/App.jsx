import { useState, useEffect, useCallback, useRef } from "react";
import TopBar from "./components/TopBar/TopBar";
import Sidebar from "./components/Sidebar/Sidebar";
import MainContent from "./components/MainContent/MainContent";
import Player from "./components/Player/Player";
import NowPlaying from "./components/NowPlaying/NowPlaying";
import Toast from "./components/Toast/Toast";
import { useSpotifyPlayer } from "./hooks/useSpotifyPlayer";
import { loadContent, MODES } from "./sources";
import { hasSpotifyConfig, isConnected, startLogin, logout, handleAuthCallback } from "./sources/spotifyAuth";
import "./App.css";

// 1008px aur upar: library khuli hoti hai, usse neeche: rail (real Spotify se napa)
const LIBRARY_QUERY = "(min-width: 1008px)";

const MODE_KEY = "content_mode";
// Har baar app khulte hi Demo (local aur Vercel dono me); mode sirf menu se badalta hai
const savedMode = () => MODES.DEMO;

function App() {
  // ---- content source (Spotify / General) ----
  const [mode, setMode] = useState(savedMode);
  const [authReady, setAuthReady] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [content, setContent] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }, []);

  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [query, setQuery] = useState("");
  const [shuffle, setShuffle] = useState(false);
  const [npOpen, setNpOpen] = useState(false);
  const [view, setView] = useState("home"); // "home" | "browse"

  // Library: screen ki width se default milta hai, click karne par ulta ho jaata hai
  const [isWide, setIsWide] = useState(() => window.matchMedia(LIBRARY_QUERY).matches);
  const [libOverride, setLibOverride] = useState(null); // null = screen ke hisaab se
  const libOpen = libOverride ?? isWide;

  useEffect(() => {
    const mq = window.matchMedia(LIBRARY_QUERY);
    function handleChange(e) {
      setIsWide(e.matches);
      setLibOverride(null); // breakpoint cross hone par click wala override reset
    }
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  // content ka key abhi ke mode se match na kare to naya load chal raha hai
  const loading = !content || content.key !== `${mode}-${reloadKey}`;
  const songs = content?.songs ?? [];

  const switchMode = useCallback((next) => {
    localStorage.setItem(MODE_KEY, next);
    setMode(next);
    setCurrentSong(null); // purane source ka gaana band
    setIsPlaying(false);
  }, []);

  // Spotify redirect se wapas aane par login complete karo, phir content load hoga
  useEffect(() => {
    handleAuthCallback().then((r) => {
      if (r.status === "ok") switchMode(MODES.SPOTIFY);
      if (r.status === "error") showToast(r.message);
      setAuthReady(true);
    });
  }, [switchMode, showToast]);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    loadContent(mode, { connected: isConnected() }).then((c) => {
      if (cancelled) return;
      setContent({ ...c, key: `${mode}-${reloadKey}` });
      if (c.notice) showToast(c.notice);
    });
    return () => { cancelled = true; };
  }, [mode, authReady, reloadKey, showToast]);

  // Home / logo / browse click: search saaf, page ke hisaab se view, aur upar scroll
  function handleView(next) {
    setView(next);
    setQuery("");
    document.querySelector(".main")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleModeChange(next) {
    if (next === MODES.SPOTIFY && !isConnected()) {
      localStorage.setItem(MODE_KEY, MODES.SPOTIFY);
      startLogin();
      return;
    }
    if (next !== mode) switchMode(next);
  }

  function handleLogout() {
    logout();
    switchMode(MODES.GENERAL);
    setReloadKey((k) => k + 1);
  }

  // Spotify player sirf tab chalta hai jab content sach me Spotify se aaya ho
  const spotify = useSpotifyPlayer({
    enabled: mode === MODES.SPOTIFY && content?.source === "spotify",
    onError: (msg) => {
      showToast(`${msg}. Switching to General content.`);
      switchMode(MODES.GENERAL);
    },
  });

  function handlePlay(song) {
    if (song.uri) {
      if (!spotify.ready) {
        showToast("Spotify player is still connecting. Please try again in 2-3 seconds.");
        return;
      }
      spotify.activate();
    }
    if (currentSong && currentSong.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  }

  function playByOffset(offset) {
    if (!currentSong) return;
    const index = songs.findIndex((s) => s.id === currentSong.id);
    let nextIndex;

    if (shuffle && offset === 1) {
      do {
        nextIndex = Math.floor(Math.random() * songs.length);
      } while (nextIndex === index && songs.length > 1);
    } else {
      nextIndex = (index + offset + songs.length) % songs.length;
    }

    setCurrentSong(songs[nextIndex]);
    setIsPlaying(true);
  }

  // Now Playing me "Next in queue" (shuffle me next random hota hai, isliye tab nahi dikhate)
  const nowIndex = currentSong ? songs.findIndex((s) => s.id === currentSong.id) : -1;
  const nextSong = nowIndex >= 0 && songs.length > 1 && !shuffle ? songs[(nowIndex + 1) % songs.length] : null;

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.code !== "Space") return;

      const tag = e.target.tagName;
      const isTyping =
        tag === "TEXTAREA" || (tag === "INPUT" && e.target.type !== "range");
      if (isTyping || tag === "BUTTON") return;
      if (!currentSong) return;

      e.preventDefault();
      setIsPlaying((prev) => !prev);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSong]);

  return (
    <div
      className={`app ${npOpen ? "app--np-open" : ""} ${libOpen ? "" : "app--lib-collapsed"}`}
    >
      <TopBar
        query={query}
        onQueryChange={setQuery}
        view={view}
        onViewChange={handleView}
        menu={{
          mode,
          source: content?.source,
          spotifyAvailable: hasSpotifyConfig,
          spotifyConnected: isConnected(),
          onModeChange: handleModeChange,
          onLogout: handleLogout,
        }}
      />
      <Sidebar expanded={libOpen} onToggle={() => setLibOverride(!libOpen)} library={loading ? [] : content?.library} />
      <MainContent
        content={content}
        loading={loading}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        query={query}
        view={view}
      />
      <NowPlaying
        open={npOpen}
        onToggle={() => setNpOpen(!npOpen)}
        song={currentSong}
        nextSong={nextSong}
        onPlayNext={() => playByOffset(1)}
      />
      <Player
        song={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onNext={() => playByOffset(1)}
        onPrev={() => playByOffset(-1)}
        shuffle={shuffle}
        onToggleShuffle={() => setShuffle(!shuffle)}
        spotify={spotify}
      />
      <Toast message={toast} />
    </div>
  );
}

export default App;