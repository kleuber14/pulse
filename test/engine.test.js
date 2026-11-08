import test from "node:test";
import assert from "node:assert/strict";
import {
  rotate,
  move,
  network,
  levels,
  solve,
  daily,
  localDate,
  medal,
} from "../src/engine.js";

test("rotação horária preserva formas e quatro giros restauram cada peça", () => {
  assert.equal(rotate(1), 2);
  assert.equal(rotate(2), 4);
  assert.equal(rotate(4), 8);
  assert.equal(rotate(8), 1);
  for (let tile = 1; tile <= 15; tile++) {
    assert.equal(rotate(tile, 4), tile);
    assert.equal(rotate(rotate(tile), 3), tile);
    assert.equal(
      rotate(tile).toString(2).replace(/0/g, "").length,
      tile.toString(2).replace(/0/g, "").length,
    );
  }
});
test("energia só passa entre pontas recíprocas e não atravessa bordas", () => {
  const l = { n: 2, source: 0 };
  assert.deepEqual([...network(l, [2, 8, 2, 8]).powered], [0, 1]);
  assert.equal(network(l, [2, 8, 2, 8]).solved, false);
  assert.equal(network(l, [2, 4, 2, 8]).powered.size, 1);
  assert.equal(network(l, [1, 0, 0, 0]).loose, 1);
  assert.equal(network(l, [6, 12, 3, 9]).solved, true);
});
test("o gerador não gira; os movimentos não modificam o estado anterior", () => {
  const l = levels[0],
    before = [...l.state];
  assert.deepEqual(move(l, before, 0), before);
  const after = move(l, before, 1);
  assert.deepEqual(before, l.state);
  assert.notDeepEqual(after, before);
});
for (const l of levels)
  test(`Circuito ${l.number}: alvo conectado, estado inicial incompleto e solução válida`, () => {
    assert.ok(network(l, l.target).solved);
    assert.equal(network(l, l.state).solved, false);
    assert.ok(l.solution.length > 0);
    assert.ok(
      network(
        l,
        l.solution.reduce((s, i) => move(l, s, i), l.state),
      ).solved,
    );
    // Hint remains valid after arbitrary moves, including a mistaken extra turn.
    let state = [...l.state];
    for (let i = 1; i < state.length; i += 3) state = move(l, state, i);
    const answer = solve(l, state);
    assert.ok(answer);
    assert.ok(
      network(
        l,
        answer.reduce((s, i) => move(l, s, i), state),
      ).solved,
    );
    for (let i = 1; i < l.state.length; i++) {
      let s = l.state;
      for (let k = 0; k < 4; k++) s = move(l, s, i);
      assert.deepEqual(s, l.state);
    }
  });
test("três primeiros circuitos ensinam em um, dois e três giros", () => {
  assert.deepEqual(
    levels.slice(0, 3).map((l) => l.solution.length),
    [1, 2, 3],
  );
  assert.equal(
    new Set(levels.map((l) => JSON.stringify([l.n, l.state]))).size,
    50,
  );
  assert.ok(levels.slice(0, 10).every((l) => l.n === 3));
  assert.ok(levels.slice(10).every((l) => l.n === 4));
});
test("solver escolhe um giro mínimo para qualquer orientação da peça introdutória", () => {
  const l = levels[0];
  let state = [...l.target];
  for (let k = 0; k < 4; k++) {
    assert.equal(solve(l, state).length, k % 2);
    state = move(l, state, 1);
  }
});
test("diário é determinístico por data local e solucionável durante 366 dias", () => {
  assert.equal(localDate(new Date(2026, 10, 8, 23, 59)), "2026-11-08");
  const seen = new Set();
  for (let i = 0; i < 366; i++) {
    const date = localDate(new Date(2026, 0, 1 + i)),
      l = daily(date);
    assert.deepEqual(l, daily(date));
    assert.ok(!network(l, l.state).solved);
    assert.ok(
      network(
        l,
        l.solution.reduce((s, j) => move(l, s, j), l.state),
      ).solved,
    );
    seen.add(l.state.join(","));
  }
  assert.ok(seen.size > 100);
});
test("medalhas premiam eficiência sem punir tentativas", () => {
  assert.equal(medal(3, 3), "ouro");
  assert.equal(medal(6, 3), "prata");
  assert.equal(medal(7, 3), "bronze");
});

test("solver mínimo confere com enumeração independente em circuitos pequenos", () => {
  const l = { n: 2, source: 0, target: [2, 12, 2, 9] };
  for (let a = 0; a < 4; a++)
    for (let b = 0; b < 4; b++)
      for (let c = 0; c < 4; c++) {
        const state = [2, rotate(12, a), rotate(2, b), rotate(9, c)];
        let minimum = Infinity;
        for (let x = 0; x < 4; x++)
          for (let y = 0; y < 4; y++)
            for (let z = 0; z < 4; z++)
              if (
                network(l, [
                  2,
                  rotate(state[1], x),
                  rotate(state[2], y),
                  rotate(state[3], z),
                ]).solved
              )
                minimum = Math.min(minimum, x + y + z);
        assert.equal(solve(l, state).length, minimum);
      }
});
