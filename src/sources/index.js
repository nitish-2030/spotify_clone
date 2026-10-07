// Content loading with a fallback chain.
//   Spotify mode: spotify -> general -> demo
//   General mode: general -> demo
//   Demo mode:    demo (never fails)
import { loadSpotify, searchSpotify } from "./spotify";
import { loadGeneral, searchGeneral } from "./general";
import { loadDemo } from "./demo";

export const MODES = { SPOTIFY: "spotify", GENERAL: "general", DEMO: "demo" };

// Presentation trick: add ?fail=1 to the URL to force Spotify and General to fail,
// so the fallback to Demo can be shown live.
const FORCE_FAIL = new URLSearchParams(window.location.search).has("fail");

const SOURCE_TIMEOUT_MS = 10000;
const CACHE_TTL_MS = 10 * 60 * 1000; // General content is cached for 10 minutes

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

// ---- tiny sessionStorage cache (General only: Spotify data is personal) ----
function readCache(key) {
  try {
    const hit = JSON.parse(sessionStorage.getItem(`content:v3:${key}`));
    return hit && Date.now() - hit.at < CACHE_TTL_MS ? hit.data : null;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    sessionStorage.setItem(`content:v3:${key}`, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* storage full or unavailable: just skip caching */
  }
}

export async function loadContent(mode, { connected }) {
  const chain = [];
  if (mode === MODES.SPOTIFY) {
    if (connected) chain.push(["spotify", loadSpotify]);
    else chain.push(["spotify", async () => { throw new Error("Spotify is not connected"); }]);
  }
  if (mode !== MODES.DEMO) chain.push(["general", loadGeneral]);
  chain.push(["demo", loadDemo]);

  let notice = null;
  for (const [source, load] of chain) {
    try {
      if (FORCE_FAIL && source !== "demo") throw new Error("forced failure");

      const cached = source === "general" ? readCache(source) : null;
      if (cached) return { ...cached, source, notice };

      const data = await withTimeout(load(), SOURCE_TIMEOUT_MS);
      if (source === "general") writeCache(source, data);
      return { ...data, source, notice };
    } catch (e) {
      notice ??= `${source === "spotify" ? "Spotify" : "General"} content could not be loaded (${e.message}). Showing fallback content.`;
    }
  }
}

// Live search in whichever source is actually showing. Demo has nothing to search remotely.
export async function searchRemote(source, query) {
  if (FORCE_FAIL) return [];
  if (source === "general") return searchGeneral(query);
  if (source === "spotify") return searchSpotify(query);
  return [];
}