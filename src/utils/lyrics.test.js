import { afterEach, describe, expect, it, vi } from "vitest";
import { activeLineIndex, cleanTitle, fetchLyrics, parseLrc } from "./lyrics";
import { BINS, simulateBins } from "./audioLevels";

describe("parseLrc", () => {
  it("parses timestamps and sorts the lines", () => {
    const lines = parseLrc("[00:10.50] second\n[00:01.00] first\nnot a lyric line\n[01:02.5]third");
    expect(lines).toEqual([
      { t: 1, text: "first" },
      { t: 10.5, text: "second" },
      { t: 62.5, text: "third" },
    ]);
  });

  it("repeats a line that has several timestamps", () => {
    const lines = parseLrc("[00:05.00][00:20.00] chorus");
    expect(lines.map((l) => l.t)).toEqual([5, 20]);
  });
});

describe("activeLineIndex", () => {
  const lines = [{ t: 5 }, { t: 10 }, { t: 15 }];
  it("finds the line being sung", () => {
    expect(activeLineIndex(lines, 0)).toBe(-1);
    expect(activeLineIndex(lines, 5)).toBe(0);
    expect(activeLineIndex(lines, 12)).toBe(1);
    expect(activeLineIndex(lines, 99)).toBe(2);
  });
});

describe("cleanTitle", () => {
  it("drops edition info", () => {
    expect(cleanTitle('Tum Hi Ho (From "Aashiqui 2")')).toBe("Tum Hi Ho");
    expect(cleanTitle("Kesariya - Remastered")).toBe("Kesariya");
  });
});

describe("fetchLyrics", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("falls back from /get to /search when there is no exact match", async () => {
    const calls = [];
    vi.stubGlobal("fetch", async (url) => {
      calls.push(url);
      if (url.includes("/get?")) return { status: 404, ok: false };
      return { status: 200, ok: true, json: async () => [{ plainLyrics: "hello\nworld", syncedLyrics: "[00:01.00] hello\n[00:05.00] world" }] };
    });
    const res = await fetchLyrics({ id: "t1", title: "Song (From X)", artist: "A & B" });
    expect(calls[0]).toContain("track_name=Song");
    expect(calls[0]).toContain("artist_name=A");
    expect(res.plain).toBe("hello\nworld");
    expect(res.synced).toHaveLength(2);
  });

  it("returns null when nothing is found", async () => {
    vi.stubGlobal("fetch", async () => ({ status: 404, ok: false, json: async () => null }));
    expect(await fetchLyrics({ id: "t2", title: "Nope", artist: "Nobody" })).toBeNull();
  });
});

describe("simulateBins", () => {
  it("stays in 0..1 and is louder on the beat than between beats", () => {
    const onBeat = simulateBins(0, true);
    const between = simulateBins(0.45, true);
    expect(onBeat).toHaveLength(BINS);
    expect([...onBeat, ...between].every((v) => v >= 0 && v <= 1)).toBe(true);
    expect(onBeat[0]).toBeGreaterThan(between[0]);
  });

  it("is almost flat when paused", () => {
    expect(Math.max(...simulateBins(1, false))).toBeLessThan(0.2);
  });
});