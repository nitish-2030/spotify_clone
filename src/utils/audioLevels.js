// Audio levels for the full screen visualizer.
//
// LIVE mode: a hidden, silent copy of the preview <audio> is played in sync and read with a Web Audio
// AnalyserNode. This only works when the audio host sends CORS headers. We use a copy on purpose:
// connecting the real player to the analyser of a non-CORS file would mute the real sound.
// SIMULATED mode: Spotify tracks are DRM protected (no audio access at all) and some hosts
// have no CORS, so a steady 120 BPM "kick" is generated instead. Same visuals, not the real beat.

export const BINS = 64;

export function simulateBins(t, playing, out = new Float32Array(BINS)) {
  const phase = (t * 2) % 1; // 120 BPM
  const kick = playing ? Math.exp(-phase * 6) : 0;
  const level = playing ? 1 : 0.12;
  for (let i = 0; i < BINS; i++) {
    const slope = Math.pow(1 - i / BINS, 1.4);
    const wobble = 0.55 + 0.45 * Math.sin(t * 3.1 + i * 0.65) * Math.sin(t * 1.7 + i * 0.31);
    const shimmer = playing ? 0.04 * Math.abs(Math.sin(t * 5 + i)) : 0;
    out[i] = Math.min(1, slope * (0.18 + 0.82 * kick) * (0.6 + 0.4 * wobble) * level + shimmer);
  }
  return out;
}

export function createLevels({ src, audio }) {
  const bins = new Float32Array(BINS);
  let failed = !src || !audio;
  let ctx = null;
  let analyser = null;
  let clone = null;
  let data = null;
  let lastSignal = -Infinity;
  let avg = 0;
  let lastBeat = 0;

  if (!failed) {
    try {
      clone = new Audio();
      clone.crossOrigin = "anonymous";
      clone.preload = "auto";
      clone.src = src;
      clone.addEventListener("error", () => {
        failed = true;
      });
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const node = ctx.createMediaElementSource(clone);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      node.connect(analyser); // NOT connected to the speakers: the copy is silent
      data = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      failed = true;
    }
  }

  function readLive(now, playing) {
    if (failed || !clone) return false;
    if (playing) {
      if (clone.paused) clone.play().catch(() => { failed = true; });
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
    } else if (!clone.paused) {
      clone.pause();
    }
    if (clone.readyState >= 2 && Math.abs(clone.currentTime - audio.currentTime) > 0.4) {
      clone.currentTime = audio.currentTime;
    }
    analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    if (sum > 0) {
      lastSignal = now;
      for (let i = 0; i < BINS; i++) bins[i] = Math.min(1, (data[i] / 255) * 1.15);
    }
    return now - lastSignal < 1500;
  }

  return {
    // One animation frame of data: { bins, bass, beat, live }
    step(now, playing) {
      const live = playing && readLive(now, playing);
      if (!live) simulateBins(now / 1000, playing, bins);

      let bass = 0;
      for (let i = 0; i < 6; i++) bass += bins[i];
      bass /= 6;
      avg = avg * 0.96 + bass * 0.04;
      const beat = playing && bass > avg * 1.18 + 0.04 && now - lastBeat > 240;
      if (beat) lastBeat = now;
      return { bins, bass, beat, live };
    },
    destroy() {
      try {
        clone?.pause();
        clone?.removeAttribute("src");
        clone?.load();
        ctx?.close();
      } catch {
        /* nothing to clean up */
      }
    },
  };
}