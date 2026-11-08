import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { Window } from "happy-dom";
import { levels, solve, goal, daily } from "../src/engine.js";
registerHooks({
  load(url, context, next) {
    return url.endsWith(".css")
      ? { format: "module", source: "", shortCircuit: true }
      : next(url, context);
  },
});
const w = new Window({ url: "https://pulse.test/" });
for (const name of ["window", "document", "localStorage", "navigator"])
  Object.defineProperty(globalThis, name, {
    value: w[name],
    configurable: true,
  });
globalThis.matchMedia = w.matchMedia.bind(w);
w.document.body.innerHTML = '<div id="app"></div>';
w.localStorage.setItem(
  "pulse-v1",
  JSON.stringify({ wins: {}, daily: {}, sound: false, motion: false }),
);
await import("../src/main.js");
const $ = (s) => w.document.querySelector(s),
  click = (a) => {
    const b = $(`[data-action="${a}"]`);
    assert.ok(b, `action ${a}`);
    b.click();
  };
const wait = () => new Promise((r) => setTimeout(r, 15));
const state = () =>
  [...w.document.querySelectorAll("[data-node]")].reduce(
    (s, b) =>
      s |
      (b.getAttribute("aria-pressed") === "true"
        ? 1 << Number(b.dataset.node)
        : 0),
    0,
  );

test("fluxo completo: bloqueio, dica, teclado, desfazer, 30 vitórias, diário e preferências", async () => {
  assert.match(w.document.body.textContent, /Sinta o padrão/);
  click("play");
  assert.equal($('[data-action="level:2"]').disabled, true);
  click("level:1");
  click("hint");
  assert.match($("#hint").textContent, /vizinhos/);
  click("hint");
  assert.ok($(".suggested"));
  const first = $('[data-node="0"]');
  first.dispatchEvent(
    new w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
  );
  assert.equal(w.document.activeElement.dataset.node, "1");
  $('[data-node="0"]').click();
  await wait();
  click("undo");
  assert.equal(state(), levels[0].state);
  assert.equal($("#moves").textContent, "00");
  for (const l of levels) {
    assert.equal(state(), l.state);
    for (const i of solve(state(), l.n, l.rules)) {
      $(`[data-node="${i}"]`).click();
      await wait();
    }
    assert.equal(state(), goal(l.n));
    assert.equal($("#dialog").open, true);
    assert.match($("#dialog").textContent, /ouro/);
    if (l.number < 30) click("next");
    else click("home");
  }
  const saved = JSON.parse(w.localStorage.getItem("pulse-v1"));
  assert.equal(Object.keys(saved.wins).length, 30);
  click("daily");
  assert.match(w.document.body.textContent, /DESAFIO DIÁRIO/);
  click("hint");
  click("hint");
  assert.ok($(".suggested"));
  click("restart");
  assert.equal($("#moves").textContent, "00");
  const day = daily();
  for (const i of solve(state(), day.n, day.rules)) {
    $(`[data-node="${i}"]`).click();
    await wait();
  }
  assert.ok(JSON.parse(w.localStorage.getItem("pulse-v1")).daily[day.date]);
  let shared;
  w.navigator.share = async (result) => {
    shared = result;
  };
  click("share");
  await wait();
  assert.match(shared.text, /Diário/);
  click("home");
  click("daily");
  assert.match($("#instruction").textContent, /Seu melhor hoje/);

  click("settings");
  const sound = $("#sound-pref");
  sound.checked = true;
  sound.dispatchEvent(new w.Event("change", { bubbles: true }));
  assert.equal(JSON.parse(w.localStorage.getItem("pulse-v1")).sound, true);
  click("close");
  click("levels");
  assert.equal($('[data-action="level:30"]').disabled, false);
  click("level:1");
  assert.equal(state(), levels[0].state);
});
test("toques repetidos durante propagação e navegação não corrompem o jogo", async () => {
  click("settings");
  const motion = $("#motion-pref");
  motion.checked = true;
  motion.dispatchEvent(new w.Event("change", { bubbles: true }));
  const sound = $("#sound-pref");
  sound.checked = false;
  sound.dispatchEvent(new w.Event("change", { bubbles: true }));
  click("close");
  for (let i = 0; i < 15; i++) $('[data-node="0"]').click();
  assert.equal($("#moves").textContent, "00");
  await new Promise((r) => setTimeout(r, 530));
  assert.equal($("#moves").textContent, "01");
  click("restart");
  $('[data-node="0"]').click();
  click("daily");
  const dailyState = state();
  await new Promise((r) => setTimeout(r, 530));
  assert.equal(state(), dailyState);
  assert.equal($("#moves").textContent, "00");
  await w.happyDOM.close();
});
