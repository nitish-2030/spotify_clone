import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import TopBar from "./components/TopBar/TopBar";
import Sidebar from "./components/Sidebar/Sidebar";
import MainContent from "./components/MainContent/MainContent";
import Player from "./components/Player/Player";
import NowPlaying from "./components/NowPlaying/NowPlaying";
import Ambience from "./components/Ambience/Ambience";
import Visualizer from "./components/Visualizer/Visualizer";
import Toast from "./components/Toast/Toast";
import { useSpotifyPlayer } from "./hooks/useSpotifyPlayer";
import { useSearch } from "./hooks/useSearch";
import { useLyrics } from "./hooks/useLyrics";
import { usePersistentState } from "./hooks/usePersistentState";
import { pickNext, upNext } from "./utils/queue";
import { moodFromText, moodOf } from "./utils/mood";
import { loadContent, MODES } from "./sources";
import { hasSpotifyConfig, isConnected, startLogin, logout, handleAuthCallback } from "./sources/spotifyAuth";
import "./App.css";

// 1008px and above: the library is expanded, below that: collapsed rail (measured from real Spotify)
const LIBRARY_QUERY = "(min-width: 1008px)";

const MODE_KEY = "content_mode";
// The app always opens in General (live iTunes content); the mode only changes from the menu.
// If General cannot load, the fallback chain shows Demo content automatically.
const savedMode = () => MODES.GENERAL;

function App() {
  // ---- content source (Demo / General / Spotify) ----
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
  const [shuffle, setShuffle] = usePersistentState("pref:shuffle", false);
  const [queue, setQueue] = useState([]); // songs of the row/list the current song was played from
  const [npOpen, setNpOpen] = useState(false);
  const [npView, setNpView] = useState("now"); // right panel: "now" (now playing) | "lyrics"
  const [vizOpen, setVizOpen] = useState(false); // full screen visualizer
  const [moodOverrides, setMoodOverrides] = usePersistentState("pref:moodOverrides", {}); // song id -> mood | "none"
  const [view, setView] = useState("home"); // "home" | "browse"

  // Library: the default comes from the screen width, clicking toggles it
  const [isWide, setIsWide] = useState(() => window.matchMedia(LIBRARY_QUERY).matches);
  const [libOverride, setLibOverride] = useState(null); // null = follow the screen width
  const libOpen = libOverride ?? isWide;

  useEffect(() => {
    const mq = window.matchMedia(LIBRARY_QUERY);
    function handleChange(e) {
      setIsWide(e.matches);
      setLibOverride(null); // reset the manual override when a breakpoint is crossed
    }
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  // if the content key does not match the current mode, a new load is still running
  const loading = !content || content.key !== `${mode}-${reloadKey}`;
  const songs = useMemo(() => content?.songs ?? [], [content]);
  const activeQueue = queue.length ? queue : songs;

  // The mood of the playing song themes the whole app (colours fade smoothly, see index.css).
  // Order: the user's own pick > row / title / genre > words in the lyrics > no mood (green).
  const lyrics = useLyrics(currentSong);
  const lyricsMood = useMemo(() => moodFromText(lyrics.plain), [lyrics.plain]);
  const moodChoice = (currentSong && moodOverrides[currentSong.id]) || "auto";
  const autoMood = moodOf(currentSong) ?? lyricsMood;
  const mood = !currentSong ? null : moodChoice === "auto" ? autoMood : moodChoice === "none" ? null : moodChoice;

  function handleMoodChoice(choice) {
    setMoodOverrides((prev) => {
      const next = { ...prev };
      if (choice === "auto") delete next[currentSong.id];
      else next[currentSong.id] = choice;
      return next;
    });
  }
  useEffect(() => {
    if (mood) document.documentElement.dataset.mood = mood;
    else delete document.documentElement.dataset.mood;
  }, [mood]);
  const search = useSearch({ source: content?.source, songs, query });

  const switchMode = useCallback((next) => {
    localStorage.setItem(MODE_KEY, next);
    setMode(next);
    setCurrentSong(null); // stop the song from the previous source
    setVizOpen(false);
    setQueue([]);
    setIsPlaying(false);
  }, []);

  // When we come back from the Spotify redirect, finish the login; the content loads afterwards
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

  // Home / logo / browse click: clear the search, switch the view and scroll to the top
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

  // The Spotify player only runs when the content really came from Spotify
  const spotify = useSpotifyPlayer({
    enabled: mode === MODES.SPOTIFY && content?.source === "spotify",
    onError: (msg) => {
      showToast(`${msg}. Switching to General content.`);
      switchMode(MODES.GENERAL);
    },
  });

  // `list` = the songs of the row the card belongs to; next/previous then stay inside that row
  // opts.switchContext = the same song was clicked in another row: keep playing, just move the queue
  function handlePlay(song, list, opts) {
    if (song.uri) {
      if (!spotify.ready) {
        showToast("Spotify player is still connecting. Please try again in 2-3 seconds.");
        return;
      }
      spotify.activate();
    }
    if (currentSong && currentSong.id === song.id) {
      setIsPlaying(opts?.switchContext ? true : !isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
      setNpOpen(true); // a song picked from a card opens the Now Playing panel
    }
    if (list?.length) setQueue(list);
  }

  const playByOffset = useCallback(
    (offset) => {
      if (!currentSong) return;
      const next = pickNext(activeQueue, currentSong, offset, shuffle);
      if (!next) return;
      setCurrentSong(next);
      setIsPlaying(true);
    },
    [currentSong, activeQueue, shuffle],
  );

  // "Next in queue" list in the Now Playing panel (hidden with shuffle: the next song is random)
  const upcoming = shuffle ? [] : upNext(activeQueue, currentSong, 5);

  // Keyboard shortcuts: Space = play/pause, N = next, P = previous
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey || !currentSong) return;

      const tag = e.target.tagName;
      const isTyping =
        tag === "TEXTAREA" || tag === "SELECT" || (tag === "INPUT" && e.target.type !== "range");
      if (isTyping) return;

      if (e.code === "Space") {
        if (tag === "BUTTON") return; // Space already clicks a focused button
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === "KeyN") {
        playByOffset(1);
      } else if (e.code === "KeyP") {
        playByOffset(-1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSong, playByOffset]);

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
        search={search}
      />
      <NowPlaying
        open={npOpen}
        onToggle={() => setNpOpen(!npOpen)}
        song={currentSong}
        view={npView}
        lyrics={lyrics}
        moodChoice={moodChoice}
        onMoodChoice={handleMoodChoice}
        upNext={upcoming}
        onPlayUpNext={(s) => {
          setCurrentSong(s);
          setIsPlaying(true);
        }}
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
        onToggleQueue={() => {
          // Queue button: show the Now Playing view (with the queue); press again to close it
          if (npOpen && npView === "now") setNpOpen(false);
          else {
            setNpView("now");
            setNpOpen(true);
          }
        }}
        onToggleLyrics={() => {
          if (npOpen && npView === "lyrics") setNpView("now");
          else {
            setNpView("lyrics");
            setNpOpen(true);
          }
        }}
        lyricsOpen={npOpen && npView === "lyrics"}
        onOpenVisualizer={() => setVizOpen(true)}
      />
      <Toast message={toast} />
      <Ambience mood={mood} />
      {vizOpen && currentSong && (
        <Visualizer
          song={currentSong}
          isPlaying={isPlaying}
          mood={mood}
          lyrics={lyrics}
          onClose={() => setVizOpen(false)}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onNext={() => playByOffset(1)}
          onPrev={() => playByOffset(-1)}
        />
      )}
    </div>
  );
}

export default App;