// Pure helpers for the play queue (no React, easy to unit test).

/**
 * Pick the song to play after moving `offset` steps (+1 next, -1 previous).
 * With shuffle on, "next" picks a random song other than the current one.
 */
export function pickNext(queue, current, offset, shuffle = false, rand = Math.random) {
  if (!queue.length) return null;
  const index = current ? queue.findIndex((s) => s.id === current.id) : -1;

  if (index === -1) return offset > 0 ? queue[0] : queue[queue.length - 1];

  if (shuffle && offset > 0 && queue.length > 1) {
    let next;
    do {
      next = Math.floor(rand() * queue.length);
    } while (next === index);
    return queue[next];
  }
  return queue[(index + offset + queue.length) % queue.length];
}

/** The next `count` songs after the current one (wraps around, never repeats the current song). */
export function upNext(queue, current, count = 5) {
  if (queue.length < 2) return [];
  const index = current ? queue.findIndex((s) => s.id === current.id) : -1;
  if (index === -1) return [];
  const out = [];
  for (let i = 1; i < queue.length && out.length < count; i++) {
    out.push(queue[(index + i) % queue.length]);
  }
  return out;
}
