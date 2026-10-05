// Spotify Web Playback SDK (Premium chahiye). Browser khud ek "device" ban jaata hai.
import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken } from "../sources/spotifyAuth";
import { spotifyFetch } from "../sources/spotify";

let sdkPromise = null;
function loadSdk() {
  sdkPromise ??= new Promise((resolve, reject) => {
    if (window.Spotify) return resolve();
    window.onSpotifyWebPlaybackSDKReady = resolve;
    const s = document.createElement("script");
    s.src = "https://sdk.scdn.co/spotify-player.js";
    s.onerror = () => { sdkPromise = null; reject(new Error("Spotify SDK load nahi hua")); };
    document.body.appendChild(s);
  });
  return sdkPromise;
}

export function useSpotifyPlayer({ enabled, onError }) {
  const playerRef = useRef(null);
  const deviceRef = useRef(null);
  const trackRef = useRef(null);     // jo track hum ne start kiya
  const endedRef = useRef(false);    // ek track ke liye "ended" sirf ek baar
  const endHandlerRef = useRef(null); // Player yahan apna onEnded rakhta hai
  const onErrorRef = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; });
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState({ position: 0, duration: 0 });
  const clock = useRef({ position: 0, duration: 0, at: 0, paused: true });

  useEffect(() => {
    if (!enabled) return;
    let player;
    let cancelled = false;

    loadSdk().then(() => {
      if (cancelled) return;
      player = new window.Spotify.Player({
        name: "Spotify Clone (web)",
        getOAuthToken: async (cb) => cb(await getAccessToken()),
        volume: 1,
      });
      playerRef.current = player;

      player.addListener("ready", ({ device_id }) => { deviceRef.current = device_id; setReady(true); });
      player.addListener("not_ready", () => setReady(false));
      player.addListener("initialization_error", () => onErrorRef.current?.("This browser does not support the Spotify player"));
      player.addListener("authentication_error", () => onErrorRef.current?.("Spotify Premium is required for playback"));
      player.addListener("account_error", () => onErrorRef.current?.("Spotify Premium chahiye playback ke liye"));
      player.addListener("playback_error", ({ message }) => onErrorRef.current?.(`Playback error: ${message}`));

      player.addListener("player_state_changed", (state) => {
        if (!state) return;
        clock.current = { position: state.position, duration: state.duration, at: Date.now(), paused: state.paused };
        setProgress({ position: state.position, duration: state.duration });

        // SDK me "ended" event nahi hota: paused + position 0 + current track "previous" list me aa jaye
        const id = trackRef.current;
        const finished =
          id && state.paused && state.position === 0 &&
          state.track_window.previous_tracks.some((t) => t.id === id);
        if (finished && !endedRef.current) {
          endedRef.current = true;
          endHandlerRef.current?.();
        }
      });

      player.connect();
    }).catch((e) => onErrorRef.current?.(e.message));

    // smooth progress bar: har 500ms me clock se position nikalo
    const tick = setInterval(() => {
      const c = clock.current;
      if (c.paused || !c.duration) return;
      setProgress({ position: Math.min(c.position + (Date.now() - c.at), c.duration), duration: c.duration });
    }, 500);

    return () => {
      cancelled = true;
      clearInterval(tick);
      player?.disconnect();
      playerRef.current = null;
      deviceRef.current = null;
      setReady(false);
    };
  }, [enabled]);

  // Browser autoplay rule: user click ke andar call hona chahiye
  const activate = useCallback(() => playerRef.current?.activateElement?.(), []);

  const playUri = useCallback(async (uri) => {
    const id = uri.split(":").pop();
    trackRef.current = id;
    endedRef.current = false;
    clock.current = { position: 0, duration: 0, at: Date.now(), paused: true };
    const start = () =>
      spotifyFetch(`/me/player/play?device_id=${deviceRef.current}`, {
        method: "PUT", body: JSON.stringify({ uris: [uri] }),
      });
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    try {
      try {
        await start();
      } catch (e) {
        if (!String(e.message).includes("404")) throw e;
        // device abhi Spotify server par register ho raha hai: transfer karke ek baar retry
        await wait(1200);
        await spotifyFetch("/me/player", {
          method: "PUT", body: JSON.stringify({ device_ids: [deviceRef.current] }),
        });
        await wait(800);
        await start();
      }
    } catch (e) {
      onErrorRef.current?.(e.message);
    }
  }, []);

  const resume = useCallback(() => playerRef.current?.resume(), []);
  const pause = useCallback(() => playerRef.current?.pause(), []);
  const seek = useCallback((ms) => {
    endedRef.current = false;
    playerRef.current?.seek(ms);
  }, []);
  const setVolume = useCallback((v) => playerRef.current?.setVolume(v), []);

  return { ready, progress, endHandlerRef, activate, playUri, resume, pause, seek, setVolume };
}