import { describe, expect, it } from "vitest";
import { pickNext, upNext } from "./queue";

const q = (...ids) => ids.map((id) => ({ id }));
const queue = q("a", "b", "c", "d");

describe("pickNext", () => {
  it("moves forward and backward", () => {
    expect(pickNext(queue, { id: "b" }, 1).id).toBe("c");
    expect(pickNext(queue, { id: "b" }, -1).id).toBe("a");
  });

  it("wraps around at both ends", () => {
    expect(pickNext(queue, { id: "d" }, 1).id).toBe("a");
    expect(pickNext(queue, { id: "a" }, -1).id).toBe("d");
  });

  it("starts from the edges when the current song is not in the queue", () => {
    expect(pickNext(queue, { id: "zzz" }, 1).id).toBe("a");
    expect(pickNext(queue, { id: "zzz" }, -1).id).toBe("d");
  });

  it("returns null for an empty queue", () => {
    expect(pickNext([], { id: "a" }, 1)).toBeNull();
  });

  it("shuffle never picks the current song", () => {
    // rand() = 0.5 -> index 2 ("c"); current is "c", so it must pick another one
    const values = [0.5, 0.0];
    const rand = () => values.shift();
    expect(pickNext(queue, { id: "c" }, 1, true, rand).id).toBe("a");
  });

  it("shuffle does not affect going back", () => {
    expect(pickNext(queue, { id: "b" }, -1, true, () => 0.9).id).toBe("a");
  });
});

describe("upNext", () => {
  it("lists the songs after the current one, wrapping around", () => {
    expect(upNext(queue, { id: "c" }, 3).map((s) => s.id)).toEqual(["d", "a", "b"]);
  });

  it("respects the count and never includes the current song", () => {
    expect(upNext(queue, { id: "a" }, 2).map((s) => s.id)).toEqual(["b", "c"]);
    expect(upNext(queue, { id: "a" }, 10).map((s) => s.id)).toEqual(["b", "c", "d"]);
  });

  it("is empty for tiny queues or unknown songs", () => {
    expect(upNext(q("a"), { id: "a" })).toEqual([]);
    expect(upNext(queue, { id: "zzz" })).toEqual([]);
    expect(upNext(queue, null)).toEqual([]);
  });
});
