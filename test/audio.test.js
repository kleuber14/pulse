import test from "node:test";
import assert from "node:assert/strict";
import { tone, silence } from "../src/audio.js";
test("áudio respeita silêncio, desbloqueia contexto suspenso e sintetiza giros e vitória", async () => {
  let created = 0,
    resumed = 0,
    starts = 0,
    stops = 0;
  class AudioContext {
    constructor() {
      created++;
      this.state = "suspended";
      this.currentTime = 0;
      this.destination = {};
    }
    async resume() {
      resumed++;
      this.state = "running";
    }
    createOscillator() {
      return {
        frequency: { setValueAtTime() {} },
        connect() {},
        disconnect() {},
        start() {
          starts++;
        },
        stop() {
          stops++;
        },
      };
    }
    createGain() {
      return {
        gain: {
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect() {},
        disconnect() {},
      };
    }
  }
  globalThis.window = { AudioContext };
  assert.equal(await tone(false), false);
  assert.equal(created, 0);
  assert.equal(await tone(true), true);
  assert.equal(created, 1);
  assert.equal(resumed, 1);
  assert.equal(starts, 2);
  assert.equal(await tone(true, true), true);
  assert.equal(starts, 6);
  silence();
  assert.ok(stops >= 12);
});
