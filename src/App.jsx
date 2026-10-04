import { useState, useEffect } from "react";
import TopBar from "./components/TopBar/TopBar";
import Sidebar from "./components/Sidebar/Sidebar";
import MainContent from "./components/MainContent/MainContent";
import Player from "./components/Player/Player";
import NowPlaying from "./components/NowPlaying/NowPlaying";
import { songs, playlists } from "./data/songs";
import "./App.css";

function App() {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [query, setQuery] = useState("");
  const [shuffle, setShuffle] = useState(false);
  const [npOpen, setNpOpen] = useState(false);

  function handlePlay(song) {
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
    <div className={`app ${npOpen ? "app--np-open" : ""}`}>
      <TopBar query={query} onQueryChange={setQuery} />
      <Sidebar />
      <MainContent
        songs={songs}
        playlists={playlists}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        query={query}
      />
      <NowPlaying
  open={npOpen}
  onToggle={() => setNpOpen(!npOpen)}
  song={currentSong}
/>
      <Player
        song={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onNext={() => playByOffset(1)}
        onPrev={() => playByOffset(-1)}
        shuffle={shuffle}
        onToggleShuffle={() => setShuffle(!shuffle)}
      />
    </div>
  );
}

export default App;