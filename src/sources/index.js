// Fallback chain:  spotify -> general -> demo.   (general mode: general -> demo)
import { loadSpotify } from "./spotify";
import { loadGeneral } from "./general";
import { loadDemo } from "./demo";

export const MODES = { SPOTIFY: "spotify", GENERAL: "general" };

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

export async function loadContent(mode, { connected }) {
  const chain = [];
  if (mode === MODES.SPOTIFY) {
    if (connected) chain.push(["spotify", loadSpotify]);
    else chain.push(["spotify", async () => { throw new Error("Spotify connect nahi hai"); }]);
  }
  chain.push(["general", loadGeneral], ["demo", loadDemo]);

  let notice = null;
  for (const [source, load] of chain) {
    try {
      const data = await withTimeout(load(), 10000);
      return { ...data, source, notice };
    } catch (e) {
      notice ??= `${source === "spotify" ? "Spotify" : "General"} content load nahi hua (${e.message}). Fallback chal raha hai.`;
    }
  }
}
