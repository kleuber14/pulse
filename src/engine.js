// Each effect is a union: a node can toggle at most once per move.
export function affected(n, rules, index) {
  const r = Math.floor(index / n),
    c = index % n;
  const cells = new Set([index]);
  if (rules.pulse)
    for (const [dr, dc] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      if (r + dr >= 0 && r + dr < n && c + dc >= 0 && c + dc < n)
        cells.add((r + dr) * n + c + dc);
    }
  if (rules.mirror) cells.add(r * n + n - 1 - c);
  if (rules.diagonal)
    for (const [dr, dc] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      if (r + dr >= 0 && r + dr < n && c + dc >= 0 && c + dc < n)
        cells.add((r + dr) * n + c + dc);
    }
  return [...cells];
}
export const goal = (n) => (1 << (n * n)) - 1;
export const mask = (n, rules, i) =>
  affected(n, rules, i).reduce((m, j) => m | (1 << j), 0);
export const move = (state, n, rules, i) => state ^ mask(n, rules, i);
const caches = new Map();
// Exhaustive BFS over <= 65,536 states: shortest solutions for every reachable board.
export function table(n, rules) {
  const key = JSON.stringify([n, rules]);
  if (caches.has(key)) return caches.get(key);
  const size = 1 << (n * n),
    distance = new Int16Array(size).fill(-1),
    step = new Int8Array(size).fill(-1);
  const queue = new Uint32Array(size),
    masks = Array.from({ length: n * n }, (_, i) => mask(n, rules, i));
  let head = 0,
    tail = 1;
  queue[0] = goal(n);
  distance[queue[0]] = 0;
  while (head < tail) {
    const s = queue[head++];
    masks.forEach((m, i) => {
      const t = s ^ m;
      if (distance[t] < 0) {
        distance[t] = distance[s] + 1;
        step[t] = i;
        queue[tail++] = t;
      }
    });
  }
  const result = { distance, step, states: queue.slice(0, tail) };
  caches.set(key, result);
  return result;
}
export function solve(state, n, rules) {
  const { step, distance } = table(n, rules);
  if (distance[state] < 0) return null;
  const answer = [];
  while (state !== goal(n)) {
    const i = step[state];
    answer.push(i);
    state = move(state, n, rules, i);
  }
  return answer;
}
export function createLevel(number, seed = number) {
  const n = number <= 6 ? 3 : 4;
  const rules =
    number <= 10
      ? { pulse: true }
      : number <= 20
        ? { pulse: true, mirror: true }
        : number <= 23
          ? { pulse: true, diagonal: true }
          : number <= 26
            ? { mirror: true, diagonal: true }
            : { pulse: true, mirror: true, diagonal: true };
  const t = table(n, rules),
    max = Math.max(...t.distance);
  const target = Math.min(
    max,
    number <= 6
      ? 1 + Math.floor((number - 1) / 2)
      : number <= 10
        ? 3 + Math.floor((number - 7) / 2)
        : number <= 20
          ? 3 + Math.floor((number - 11) / 2)
          : 4 + Math.floor((number - 21) / 2),
  );
  const candidates = Array.from(t.states).filter(
    (s) => t.distance[s] === target,
  );
  const state = candidates[((seed * 2654435761) >>> 0) % candidates.length];
  return { number, n, rules, state, solution: solve(state, n, rules) };
}
export const levels = Array.from({ length: 30 }, (_, i) => createLevel(i + 1));
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function daily(date = localDate()) {
  let seed = 0;
  for (const c of date) seed = (Math.imul(seed, 31) + c.charCodeAt(0)) >>> 0;
  return { ...createLevel(27 + (seed % 4), seed), date, daily: true };
}
export const medal = (moves, optimum) =>
  moves <= optimum ? "ouro" : moves <= optimum + 2 ? "prata" : "bronze";
