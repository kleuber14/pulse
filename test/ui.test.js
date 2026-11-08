import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { Window } from "happy-dom";
import { levels, solve, network, daily } from "../src/engine.js";
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
w.sessionStorage.setItem("pulse-creator-intro", "1");
globalThis.fetch = async (url, options = {}) => {
  const body = options.body ? JSON.parse(options.body) : {};
  const result = String(url).endsWith("/api/leaderboard")
    ? { top: [] }
    : String(url).endsWith("/api/preview")
      ? { eligible: body.level === 1, improved: true, score: 1000 }
      : { rank: 1, top: [{ rank: 1, alias: body.alias, score: 1000 }] };
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
};
w.document.body.innerHTML = '<div id="app"></div>';
w.localStorage.setItem(
  "pulse-circuits-v2",
  JSON.stringify({ wins: {}, daily: {}, sound: false, motion: false }),
);
await import("../src/main.js");
const $ = (s) => w.document.querySelector(s),
  click = (a) => {
    const b = $(`[data-action="${a}"]`);
    assert.ok(b, `action ${a}`);
    b.click();
  },
  wait = () => new Promise((r) => setTimeout(r, 15)),
  state = () =>
    [...w.document.querySelectorAll("[data-node]")].map((b) =>
      Number(b.dataset.ports),
    );
test("entrada oferece áudio, tutorial guia os três circuitos e 50 fases podem ser concluídas", async () => {
  assert.match($('[data-action="play-sound"]').textContent, /com som/);
  assert.equal(
    $('[data-action="sound"]').getAttribute("aria-pressed"),
    "false",
  );
  click("play-silent");
  assert.equal($("#dialog").open, false);
  assert.ok($(".guided"));
  assert.match($("#instruction").textContent, /gerador/);
  $('[data-node="1"]').dispatchEvent(
    new w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
  );
  assert.equal(w.document.activeElement.dataset.node, "2");
  const original = state();
  $('[data-node="0"]').click();
  await wait();
  assert.deepEqual(state(), original);
  assert.equal($("#moves").textContent, "00");
  $('[data-node="2"]').click();
  await wait();
  click("undo");
  assert.deepEqual(state(), original);
  click("restart");
  assert.deepEqual(state(), original);
  click("hint");
  assert.match($("#hint").textContent, /pontas/);
  click("hint");
  assert.ok($(".suggested"));
  for (const l of levels) {
    assert.deepEqual(state(), l.state);
    if (l.number <= 3) {
      assert.equal($("#tutorial").hidden, false);
      assert.ok($(".guided"));
    } else assert.equal($("#tutorial").hidden, true);
    for (const i of solve(l, state())) {
      $(`[data-node="${i}"]`).click();
      await wait();
    }
    assert.ok(network(l, state()).solved);
    assert.equal($("#dialog").open, true);
    assert.match($("#dialog").textContent, /ouro/);
    if (l.number === 1) {
      assert.ok($(".record-form"));
      const input = $("#record-name");
      input.value = "Ana";
      $(".record-form").dispatchEvent(
        new w.Event("submit", { bubbles: true, cancelable: true }),
      );
      await wait();
      assert.equal(
        JSON.parse(w.localStorage.getItem("pulse-circuits-v2")).alias,
        "Ana",
      );
    }

    if (l.number < levels.length) click("next");
    else click("home");
  }
  assert.equal(
    Object.keys(JSON.parse(w.localStorage.getItem("pulse-circuits-v2")).wins)
      .length,
    50,
  );
  click("daily");
  assert.match(w.document.body.textContent, /CIRCUITO DIÁRIO/);
  const day = daily();
  for (const i of solve(day, state())) {
    $(`[data-node="${i}"]`).click();
    await wait();
  }
  assert.ok(
    JSON.parse(w.localStorage.getItem("pulse-circuits-v2")).daily[day.date],
  );
  let shared;
  w.navigator.share = async (v) => {
    shared = v;
  };
  click("share");
  await wait();
  assert.match(shared.text, /giros/);
  click("home");
  click("daily");
  assert.match($("#instruction").textContent, /Seu melhor hoje/);
  click("sound");
  assert.equal(
    JSON.parse(w.localStorage.getItem("pulse-circuits-v2")).sound,
    true,
  );
  assert.equal($('[data-action="sound"]').getAttribute("aria-pressed"), "true");
  click("sound");
  assert.equal(
    JSON.parse(w.localStorage.getItem("pulse-circuits-v2")).sound,
    false,
  );
  click("levels");
  assert.equal($('[data-action="level:30"]').disabled, false);
  click("level:1");
  assert.ok($(".guided"));
});
test("toques repetidos e navegação durante rotação não corrompem outro circuito", async () => {
  click("settings");
  const motion = $("#motion-pref");
  motion.checked = true;
  motion.dispatchEvent(new w.Event("change", { bubbles: true }));
  click("close");
  for (let i = 0; i < 15; i++) $('[data-node="2"]').click();
  assert.equal($("#moves").textContent, "01");
  await new Promise((r) => setTimeout(r, 260));
  assert.equal($("#moves").textContent, "01");
  click("restart");
  $('[data-node="2"]').click();
  click("daily");
  const before = state();
  await new Promise((r) => setTimeout(r, 260));
  assert.deepEqual(state(), before);
  assert.equal($("#moves").textContent, "00");
  await w.happyDOM.close();
});
