// Clockwise ports: north, east, south, west. A rotation preserves tile shape.
export const directions = [
  { dr: -1, dc: 0, bit: 1, opposite: 4 },
  { dr: 0, dc: 1, bit: 2, opposite: 8 },
  { dr: 1, dc: 0, bit: 4, opposite: 1 },
  { dr: 0, dc: -1, bit: 8, opposite: 2 },
];
export function rotate(tile, turns = 1) {
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++)
    tile = ((tile << 1) & 15) | (tile >> 3);
  return tile;
}
export function neighbor(n, index, direction) {
  const row = Math.floor(index / n) + direction.dr,
    col = (index % n) + direction.dc;
  return row < 0 || row >= n || col < 0 || col >= n ? -1 : row * n + col;
}
export function move(level, state, index) {
  const next = [...state];
  if (index !== level.source && index >= 0 && index < next.length)
    next[index] = rotate(next[index]);
  return next;
}
export function network(level, state) {
  const powered = new Set([level.source]),
    queue = [level.source];
  let loose = 0;
  for (let i = 0; i < state.length; i++)
    for (const d of directions) {
      if (!(state[i] & d.bit)) continue;
      const j = neighbor(level.n, i, d);
      if (j < 0 || !(state[j] & d.opposite)) loose++;
    }
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head];
    for (const d of directions) {
      const j = neighbor(level.n, i, d);
      if (
        j >= 0 &&
        state[i] & d.bit &&
        state[j] & d.opposite &&
        !powered.has(j)
      ) {
        powered.add(j);
        queue.push(j);
      }
    }
  }
  return {
    powered,
    loose,
    solved: powered.size === state.length && loose === 0,
  };
}
function orientations(tile) {
  const result = [];
  for (let k = 0; k < 4; k++) {
    const value = rotate(tile, k);
    if (!result.some((x) => x.value === value)) result.push({ value, cost: k });
  }
  return result;
}
function sequence(state, target, source) {
  const result = [];
  state.forEach((tile, index) => {
    if (index === source) return;
    let value = tile;
    for (let k = 0; k < 4 && value !== target[index]; k++) {
      result.push(index);
      value = rotate(value);
    }
  });
  return result;
}
// Constraint solver: matching ports, closed borders, one connected powered network.
// Arc consistency + branch-and-bound finds a minimum-clockwise-turn solution.
export function solve(level, state) {
  let best = network(level, level.target).solved
    ? sequence(state, level.target, level.source)
    : null;
  const domains = state.map((tile, i) =>
    (i === level.source
      ? [{ value: tile, cost: 0 }]
      : orientations(tile)
    ).filter((o) =>
      directions.every(
        (d) => neighbor(level.n, i, d) >= 0 || !(o.value & d.bit),
      ),
    ),
  );
  function search(input) {
    const ds = input.map((d) => [...d]);
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < ds.length; i++) {
        if (!ds[i].length) return;
        for (const d of directions) {
          const j = neighbor(level.n, i, d);
          if (j < 0) continue;
          const filtered = ds[i].filter((a) =>
            ds[j].some((b) => !!(a.value & d.bit) === !!(b.value & d.opposite)),
          );
          if (!filtered.length) return;
          if (filtered.length !== ds[i].length) {
            ds[i] = filtered;
            changed = true;
          }
        }
      }
    }
    const lower = ds.reduce(
      (total, d) => total + Math.min(...d.map((o) => o.cost)),
      0,
    );
    if (best && lower >= best.length) return;
    let index = -1;
    ds.forEach((d, i) => {
      if (d.length > 1 && (index < 0 || d.length < ds[index].length)) index = i;
    });
    if (index < 0) {
      const target = ds.map((d) => d[0].value);
      if (network(level, target).solved)
        best = sequence(state, target, level.source);
      return;
    }
    for (const option of ds[index]) {
      const branch = [...ds];
      branch[index] = [option];
      search(branch);
    }
  }
  search(domains);
  return best;
}
function rng(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function connect(target, n, a, b) {
  const d = directions.find((d) => neighbor(n, a, d) === b);
  target[a] |= d.bit;
  target[b] |= d.opposite;
}
export function createLevel(number, seed = number, isDaily = false) {
  const n = number <= 10 ? 3 : 4,
    source = 0,
    target = Array(n * n).fill(0),
    random = rng(seed);
  if (number <= 3) {
    const path = [0, 1, 2, 5, 4, 3, 6, 7, 8];
    for (let i = 1; i < path.length; i++)
      connect(target, n, path[i - 1], path[i]);
  } else {
    const visited = new Set([source]),
      stack = [source];
    while (stack.length) {
      const i = stack.at(-1),
        candidates = directions
          .map((d) => neighbor(n, i, d))
          .filter((j) => j >= 0 && !visited.has(j));
      if (!candidates.length) {
        stack.pop();
        continue;
      }
      const j = candidates[Math.floor(random() * candidates.length)];
      connect(target, n, i, j);
      visited.add(j);
      stack.push(j);
    }
    // Later chapters add loops; every tile remains reachable from the source.
    let extra =
      number <= 10
        ? 0
        : number <= 20
          ? 1
          : number <= 30
            ? 2
            : number <= 40
              ? 3
              : 4;
    for (let attempt = 0; extra && attempt < 80; attempt++) {
      const i = Math.floor(random() * n * n),
        d = directions[Math.floor(random() * 4)],
        j = neighbor(n, i, d);
      if (j >= 0 && !(target[i] & d.bit)) {
        connect(target, n, i, j);
        extra--;
      }
    }
  }
  const state = [...target],
    candidates = Array.from({ length: n * n - 1 }, (_, i) => i + 1).filter(
      (i) => rotate(target[i]) !== target[i],
    );
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const count =
    number <= 3
      ? number
      : Math.min(candidates.length, 2 + Math.floor(number / 3));
  const chosen =
    number <= 3
      ? [[1], [2, 5], [1, 3, 7]][number - 1]
      : candidates.slice(0, count);
  chosen.forEach(
    (i) =>
      (state[i] = rotate(
        target[i],
        number <= 3 ? 3 : 1 + Math.floor(random() * 3),
      )),
  );
  const level = { number, n, source, target, state, daily: isDaily };
  if (network(level, state).solved) {
    const i = candidates[0];
    state[i] = rotate(state[i]);
  }
  level.solution = solve(level, state);
  if (!level.solution?.length) throw Error(`Invalid level ${number}`);
  return level;
}
export const levels = Array.from({ length: 50 }, (_, i) => createLevel(i + 1));
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
let cachedDaily;
export function daily(date = localDate()) {
  if (cachedDaily?.date === date) return cachedDaily;
  let seed = 0;
  for (const char of date)
    seed = (Math.imul(seed, 31) + char.charCodeAt(0)) >>> 0;
  cachedDaily = { ...createLevel(24 + (seed % 7), seed, true), date };
  return cachedDaily;
}
export const medal = (moves, reference) =>
  moves <= reference ? "ouro" : moves <= reference + 3 ? "prata" : "bronze";
