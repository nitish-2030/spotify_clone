import { describe, expect, it } from "vitest";
import { artistCards, discoveryRows, primaryArtist, radioCards, songCard, songKey, uniqueSongs } from "./cards";

const song = (id, title, artist) => ({ id, title, artist, cover: `cover-${id}` });
const songs = [
  song("1", "One", "Arijit Singh"),
  song("2", "Two", "Arijit Singh, Pritam"),
  song("3", "Three", "Kishore Kumar"),
  song("4", "Four", "Lata Mangeshkar"),
];

describe("songCard", () => {
  it("turns a song into a card that plays that song", () => {
    const card = songCard(songs[0]);
    expect(card).toMatchObject({ title: "One", subtitle: "Arijit Singh", cover: "cover-1" });
    expect(card.song).toBe(songs[0]);
  });
});

describe("uniqueSongs", () => {
  it("removes duplicates and keeps the first occurrence", () => {
    const list = uniqueSongs([songs[0], songs[1], songs[0], songs[2]]);
    expect(list.map((s) => s.id)).toEqual(["1", "2", "3"]);
  });

  it("treats the same title + artist with a different id as one song", () => {
    const list = uniqueSongs([
      song("a", "Tum Hi Ho", "Arijit Singh"),
      song("b", "Tum Hi Ho (From \"Aashiqui 2\")", "Arijit Singh"),
      song("c", "Tum Hi Ho - Unplugged", "Arijit Singh"),
      song("d", "Tum Hi Ho", "Someone Else"),
    ]);
    expect(list.map((s) => s.id)).toEqual(["a", "d"]);
  });
});

describe("primaryArtist", () => {
  it("takes the first artist from comma, & and feat. lists", () => {
    expect(primaryArtist("Pritam & Arijit Singh")).toBe("Pritam");
    expect(primaryArtist("Arijit Singh, Pritam")).toBe("Arijit Singh");
    expect(primaryArtist("Pritam feat. Arijit Singh")).toBe("Pritam");
    expect(primaryArtist("A.R. Rahman")).toBe("A.R. Rahman");
  });

  it("groups 'A & B' songs under artist A", () => {
    const list = [song("1", "One", "Pritam"), song("2", "Two", "Pritam & Arijit Singh")];
    expect(artistCards(list).map((c) => c.title)).toEqual(["Pritam"]);
  });
});

describe("songKey", () => {
  it("ignores case, bracketed edition info and featured artists", () => {
    expect(songKey(song("1", "Kesariya [Remastered]", "Arijit Singh, Pritam"))).toBe("kesariya|arijit singh");
  });
});

describe("artistCards", () => {
  it("makes one round card per artist (first listed artist only)", () => {
    const cards = artistCards(songs);
    expect(cards.map((c) => c.title)).toEqual(["Arijit Singh", "Kishore Kumar", "Lata Mangeshkar"]);
    expect(cards.every((c) => c.round)).toBe(true);
  });

  it("builds initials and a stable gradient from the name", () => {
    const [first] = artistCards(songs);
    expect(first.initials).toBe("AS");
    expect(first.cover).toContain("linear-gradient");
    expect(artistCards(songs)[0].cover).toBe(first.cover); // same name -> same colour
  });

  it("uses the artist photo when there is one, initials otherwise", () => {
    const cards = artistCards(songs, 8, { "Arijit Singh": "https://img/arijit.jpg" });
    expect(cards[0].cover).toContain("https://img/arijit.jpg");
    expect(cards[0].initials).toBeUndefined();
    expect(cards[1].initials).toBe("KK");
  });

  it("respects the max", () => {
    expect(artistCards(songs, 2)).toHaveLength(2);
  });
});

describe("radioCards", () => {
  it("creates radio cards that mention the other artists", () => {
    const cards = radioCards(songs, 3);
    expect(cards).toHaveLength(3);
    expect(cards[0].radio.name).toBe("Arijit Singh");
    expect(cards[0].subtitle).toMatch(/^With /);
  });
});

describe("discoveryRows", () => {
  it("returns artists and radio rows when there is enough data", () => {
    expect(discoveryRows(songs).map((r) => r.id)).toEqual(["artists", "radio"]);
  });

  it("skips the rows when there is only one artist", () => {
    expect(discoveryRows([songs[0]])).toEqual([]);
  });
});