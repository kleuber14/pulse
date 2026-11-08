import test from "node:test";
import assert from "node:assert/strict";
import { load, save } from "../src/storage.js";
test("progresso de circuitos é separado do jogo antigo, preservando preferências", () => {
  const values = new Map([
    [
      "pulse-v1",
      JSON.stringify({
        wins: { 30: { moves: 1 } },
        sound: true,
        motion: false,
      }),
    ],
  ]);
  globalThis.localStorage = {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
  };
  const data = load();
  assert.deepEqual(data.wins, {});
  assert.equal(data.sound, true);
  assert.equal(data.motion, false);
  data.wins[1] = { moves: 1, medal: "ouro" };
  assert.equal(save(data), true);
  assert.deepEqual(load(), data);
  assert.ok(JSON.parse(values.get("pulse-v1")).wins[30]);
  globalThis.localStorage = {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  };
  assert.equal(load().sound, false);
  assert.equal(save(data), false);
});
