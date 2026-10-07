// Tiny shared "playback state" that lives outside React, so a per-frame value (the song position)
// can be read by the lyrics view and the visualizer without re-rendering the whole app.
import { useSyncExternalStore } from "react";

let time = 0; // seconds
const listeners = new Set();
let audioEl = null; // the <audio> element of the player (used by the visualizer)

export function setPlaybackTime(seconds) {
  if (Math.abs(seconds - time) < 0.05) return;
  time = seconds;
  listeners.forEach((fn) => fn());
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const usePlaybackTime = () => useSyncExternalStore(subscribe, () => time);

export const registerAudio = (el) => {
  audioEl = el;
};
export const getAudio = () => audioEl;