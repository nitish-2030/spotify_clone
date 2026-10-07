import { describe, expect, it } from "vitest";
import { detectMood, moodFromText, moodOf, moodInfo } from "./mood";

const song = (title, extra = {}) => ({ id: title, title, artist: "X", ...extra });

describe("detectMood", () => {
  it("finds romantic songs", () => {
    expect(detectMood(song("Tum Hi Ho"))).toBe("romantic");
    expect(detectMood(song("Ishq Wala Love"))).toBe("romantic");
  });

  it("finds devotional songs by title or genre", () => {
    expect(detectMood(song("Hanuman Chalisa"))).toBe("devotional");
    expect(detectMood(song("Something", { genre: "Devotional & Spiritual" }))).toBe("devotional");
  });

  it("finds phonk / bgm songs", () => {
    expect(detectMood(song("Montagem Coral"))).toBe("phonk");
    expect(detectMood(song("Night Drift (Phonk)"))).toBe("phonk");
  });

  it("finds sad songs, and sad wins over romantic", () => {
    expect(detectMood(song("Judaai"))).toBe("sad");
    expect(detectMood(song("Dard"))).toBe("sad");
    expect(detectMood(song("Dil Toot Gaya"))).toBe("sad");
  });

  it("returns null when nothing matches", () => {
    expect(detectMood(song("Neon Skyline"))).toBeNull();
    expect(detectMood(null)).toBeNull();
  });
});

describe("moodOf", () => {
  it("prefers the mood set by the source", () => {
    expect(moodOf(song("Tum Hi Ho", { mood: "sad" }))).toBe("sad");
  });

  it("ignores an unknown mood and falls back to detection", () => {
    expect(moodOf(song("Tum Hi Ho", { mood: "weird" }))).toBe("romantic");
  });
});

describe("moodInfo", () => {
  it("gives the label of a mood", () => {
    expect(moodInfo("phonk").label).toBe("Phonk & BGM");
    expect(moodInfo("nope")).toBeNull();
  });
});

describe("moodFromText", () => {
  it("picks the mood that clearly dominates the lyrics", () => {
    expect(moodFromText("tum se pyaar hai, ishq hai, mohabbat hai, mera dil")).toBe("romantic");
    expect(moodFromText("dard hai judaai hai aansu hain tanha hu")).toBe("sad");
    expect(moodFromText("jai shri ram jai hanuman bhakti aarti")).toBe("devotional");
  });

  it("returns null for short, empty or mixed text", () => {
    expect(moodFromText("")).toBeNull();
    expect(moodFromText("la la la")).toBeNull();
    expect(moodFromText("love dard love dard love dard")).toBeNull();
  });
});