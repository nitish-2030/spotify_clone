import { beforeEach, describe, expect, it, vi } from "vitest";

// loadContent reads window.location when the module loads, and uses sessionStorage for caching
function stubBrowser(search = "") {
  const store = new Map();
  vi.stubGlobal("window", { location: { search, origin: "http://127.0.0.1:5173" } });
  vi.stubGlobal("sessionStorage", {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  });
}

const data = (label) => ({ songs: [{ id: label, title: label, artist: "x", cover: "c" }], sections: [] });

async function setup({ search = "", spotify, general, demo } = {}) {
  vi.resetModules();
  stubBrowser(search);
  const mocks = {
    loadSpotify: vi.fn(spotify ?? (async () => data("spotify"))),
    searchSpotify: vi.fn(async () => [{ id: "sp-hit" }]),
    loadGeneral: vi.fn(general ?? (async () => data("general"))),
    searchGeneral: vi.fn(async () => [{ id: "gen-hit" }]),
    loadDemo: vi.fn(demo ?? (async () => data("demo"))),
  };
  vi.doMock("./spotify", () => ({ loadSpotify: mocks.loadSpotify, searchSpotify: mocks.searchSpotify }));
  vi.doMock("./general", () => ({ loadGeneral: mocks.loadGeneral, searchGeneral: mocks.searchGeneral }));
  vi.doMock("./demo", () => ({ loadDemo: mocks.loadDemo }));
  const api = await import("./index");
  return { ...api, mocks };
}

describe("loadContent: fallback chain", () => {
  beforeEach(() => vi.resetModules());

  it("Demo mode only loads Demo", async () => {
    const { loadContent, MODES, mocks } = await setup();
    const result = await loadContent(MODES.DEMO, { connected: false });
    expect(result.source).toBe("demo");
    expect(result.notice).toBeNull();
    expect(mocks.loadGeneral).not.toHaveBeenCalled();
    expect(mocks.loadSpotify).not.toHaveBeenCalled();
  });

  it("General mode uses General when it works", async () => {
    const { loadContent, MODES } = await setup();
    const result = await loadContent(MODES.GENERAL, { connected: false });
    expect(result.source).toBe("general");
    expect(result.notice).toBeNull();
  });

  it("General mode falls back to Demo and explains why", async () => {
    const { loadContent, MODES } = await setup({ general: async () => { throw new Error("network"); } });
    const result = await loadContent(MODES.GENERAL, { connected: false });
    expect(result.source).toBe("demo");
    expect(result.notice).toContain("General content could not be loaded");
    expect(result.notice).toContain("network");
  });

  it("Spotify mode uses Spotify when connected", async () => {
    const { loadContent, MODES } = await setup();
    const result = await loadContent(MODES.SPOTIFY, { connected: true });
    expect(result.source).toBe("spotify");
  });

  it("Spotify mode without a login falls back to General", async () => {
    const { loadContent, MODES, mocks } = await setup();
    const result = await loadContent(MODES.SPOTIFY, { connected: false });
    expect(result.source).toBe("general");
    expect(result.notice).toContain("Spotify");
    expect(mocks.loadSpotify).not.toHaveBeenCalled();
  });

  it("Spotify failure falls back to General, General failure falls back to Demo", async () => {
    const fail = async () => { throw new Error("boom"); };
    const { loadContent, MODES } = await setup({ spotify: fail, general: fail });
    const result = await loadContent(MODES.SPOTIFY, { connected: true });
    expect(result.source).toBe("demo");
    expect(result.notice).toContain("Spotify content could not be loaded");
  });

  it("?fail=1 forces Spotify and General to fail but never Demo", async () => {
    const { loadContent, MODES, mocks } = await setup({ search: "?fail=1" });
    const result = await loadContent(MODES.SPOTIFY, { connected: true });
    expect(result.source).toBe("demo");
    expect(mocks.loadSpotify).not.toHaveBeenCalled();
    expect(mocks.loadGeneral).not.toHaveBeenCalled();
  });

  it("caches General content so a second load does not hit the API", async () => {
    const { loadContent, MODES, mocks } = await setup();
    await loadContent(MODES.GENERAL, { connected: false });
    const second = await loadContent(MODES.GENERAL, { connected: false });
    expect(second.source).toBe("general");
    expect(mocks.loadGeneral).toHaveBeenCalledTimes(1);
  });
});

describe("searchRemote", () => {
  it("routes the query to the active source", async () => {
    const { searchRemote } = await setup();
    expect(await searchRemote("general", "arijit")).toEqual([{ id: "gen-hit" }]);
    expect(await searchRemote("spotify", "arijit")).toEqual([{ id: "sp-hit" }]);
    expect(await searchRemote("demo", "arijit")).toEqual([]);
  });

  it("returns nothing with ?fail=1", async () => {
    const { searchRemote } = await setup({ search: "?fail=1" });
    expect(await searchRemote("general", "arijit")).toEqual([]);
  });
});
