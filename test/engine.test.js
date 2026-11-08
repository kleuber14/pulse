import test from "node:test";
import assert from "node:assert/strict";
import {
  affected,
  goal,
  mask,
  move,
  solve,
  table,
  levels,
  daily,
  localDate,
  medal,
} from "../src/engine.js";

test("Pulso: centro, canto e borda usam somente vizinhos ortogonais", () => {
  assert.deepEqual(affected(3, { pulse: true }, 4).sort(), [1, 3, 4, 5, 7]);
  assert.deepEqual(affected(3, { pulse: true }, 0).sort(), [0, 1, 3]);
  assert.deepEqual(affected(3, { pulse: true }, 1).sort(), [0, 1, 2, 4]);
});
test("Espelho adiciona só o correspondente horizontal, com união dos efeitos", () => {
  assert.deepEqual(
    affected(3, { pulse: true, mirror: true }, 0).sort(),
    [0, 1, 2, 3],
  );
  assert.deepEqual(
    affected(3, { pulse: true, mirror: true }, 4).sort(),
    [1, 3, 4, 5, 7],
  );
  assert.deepEqual(
    affected(4, { pulse: true, mirror: true }, 1).sort(),
    [0, 1, 2, 5],
  );
});
test("Ressonância e combinações não repetem núcleos nem ultrapassam as bordas", () => {
  assert.deepEqual(affected(3, { diagonal: true }, 0).sort(), [0, 4]);
  assert.deepEqual(
    affected(3, { pulse: true, mirror: true, diagonal: true }, 4).sort(),
    [0, 1, 2, 3, 4, 5, 6, 7, 8],
  );
  assert.deepEqual(
    affected(3, { mirror: true, diagonal: true }, 0).sort(),
    [0, 2, 4],
  );
});
for (const level of levels)
  test(`Fase ${level.number}: determinística, não resolvida, reversível e solução mínima válida`, () => {
    const { n, rules, state, solution } = level;
    assert.notEqual(state, goal(n));
    assert.ok(solution.length > 0);
    let s = state;
    for (const i of solution) s = move(s, n, rules, i);
    assert.equal(s, goal(n));
    // Generation is the inverse of the known sequence applied to a solved board.
    s = goal(n);
    for (const i of [...solution].reverse()) s = move(s, n, rules, i);
    assert.equal(s, state);
    for (let i = 0; i < n * n; i++) {
      assert.notEqual(mask(n, rules, i), 0);
      assert.equal(move(move(state, n, rules, i), n, rules, i), state);
      const after = move(state, n, rules, i);
      const hint = solve(after, n, rules);
      assert.ok(hint);
      assert.equal(
        hint.reduce((s, j) => move(s, n, rules, j), after),
        goal(n),
      );
    }
    assert.equal(table(n, rules).distance[state], solution.length);
  });
test("progressão inicia em um movimento e termina com planejamento maior", () => {
  assert.equal(levels[0].solution.length, 1);
  assert.ok(levels[29].solution.length >= 4);
  assert.equal(levels.length, 30);
  assert.equal(
    new Set(levels.map((l) => JSON.stringify([l.n, l.rules, l.state]))).size,
    30,
  );
  assert.ok(levels.slice(0, 6).every((l) => l.n === 3));
  assert.ok(levels.slice(6).every((l) => l.n === 4));
});
test("diário: data local, mesmo estado por dia, solução válida por 366 dias", () => {
  assert.equal(localDate(new Date(2026, 10, 8, 23, 59)), "2026-11-08");
  const seen = new Set();
  for (let i = 0; i < 366; i++) {
    const date = new Date(2026, 0, 1 + i),
      l = daily(localDate(date));
    assert.deepEqual(l, daily(localDate(date)));
    assert.notEqual(l.state, goal(l.n));
    assert.equal(
      l.solution.reduce((s, j) => move(s, l.n, l.rules, j), l.state),
      goal(l.n),
    );
    seen.add(l.state);
  }
  assert.ok(seen.size > 50);
});
test("medalhas usam eficiência relativa à solução mínima", () => {
  assert.equal(medal(3, 3), "ouro");
  assert.equal(medal(5, 3), "prata");
  assert.equal(medal(6, 3), "bronze");
});
