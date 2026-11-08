import test from "node:test";
import assert from "node:assert/strict";
import { load, save } from "../src/storage.js";
test("progresso e preferências persistem, sem exigir storage disponível", () => {
  let value = null;
  globalThis.localStorage = {
    getItem: () => value,
    setItem: (_, v) => {
      value = v;
    },
  };
  assert.equal(load().sound, false);
  const d = load();
  d.wins[1] = { moves: 1, medal: "ouro" };
  d.sound = true;
  assert.equal(save(d), true);
  assert.deepEqual(load(), d);
  value = "inválido";
  assert.deepEqual(load().wins, {});
  globalThis.localStorage = {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  };
  assert.equal(load().sound, false);
  assert.equal(save(d), false);
});
