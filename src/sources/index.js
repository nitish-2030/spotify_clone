// Fallback chain:  spotify -> general -> demo.   (general mode: general -> demo)
import { loadSpotify } from "./spotify";
import { loadGeneral } from "./general";
import { loadDemo } from "./demo";

export const MODES = { SPOTIFY: "spotify", GENERAL: "general", DEMO: "demo" };
const FORCE_FAIL = new URLSearchParams(window.location.search).has("fail"); // presentation trick: ?fail=1

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

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
      const data = await withTimeout(load(), 10000);
      return { ...data, source, notice };
    } catch (e) {
      notice ??= `${source === "spotify" ? "Spotify" : "General"} content could not be loaded (${e.message}). Showing fallback content.`;
    }
  }
}
