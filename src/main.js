import "./style.css";
import {
  levels,
  daily,
  network,
  move,
  solve,
  medal,
  directions,
  neighbor,
  rotate,
} from "./engine.js";
import { tutorial } from "./tutorial.js";
import { load, save } from "./storage.js";
import { tone, silence, setVolume } from "./audio.js";
import { fetchTop, previewScore, submitScore, escapeText } from "./ranking.js";
import { celebrate, creatorIntro } from "./effects.js";
import { track, analyticsAvailable, analyticsConsent, setAnalyticsConsent } from "./analytics.js";
const app = document.querySelector("#app"),
  data = load();
let screen = "home",
  level,
  state,
  history = [],
  angles = [],
  busy = false,
  epoch = 0,
  hints = 0,
  selected = 1;
setVolume(data.volume ?? 0.9);
const chapters = ["CONEXÃO", "CIRCUITOS", "FLUXO", "RESSONÂNCIA", "HARMONIA"];
const button = (text, action, cls = "", extra = "") =>
  `<button class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
function persist() {
  if (!save(data)) announce("O navegador não permitiu salvar seu progresso.");
}
function unlocked() {
  let i = 1;
  while (data.wins[i] && i < levels.length) i++;
  return i;
}
function header() {
  return `<header class="${screen === "game" ? "playing-header" : ""}"><div class="brand-group"><a class="brand" href="#" aria-label="PULSE início">P<span>U</span>LSE<i></i></a>${screen === "game" ? '<img class="creator-credit" src="./creator-logo.webp" alt="Kleuber Avila, criador do jogo" width="108" height="66" decoding="async">' : ""}</div><nav>${button("Jogar", "continue", screen === "game" ? "nav-active" : "")}${button("Fases", "levels", screen === "levels" ? "nav-active" : "")}${button('Diário <span class="nav-dot"></span>', "daily")}${button(data.sound ? "♪ <span>Som ligado</span>" : "♪ <span>Ativar som</span>", "sound", "sound-toggle", `aria-label="${data.sound ? "Desligar" : "Ligar"} som" aria-pressed="${data.sound}"`)}${button("⚙", "settings", "icon", 'aria-label="Configurações"')}</nav></header>`;
}
function footer() {
  return "<footer><span>GIRE. CONECTE. DEIXE FLUIR.</span><span>NO SEU RITMO <i>✦</i></span></footer>";
}
function shell(content) {
  app.innerHTML =
    header() +
    content +
    footer() +
    '<div id="toast" role="status" aria-live="polite"></div><dialog id="dialog"></dialog>';
  applyMotion();
}
function applyMotion() {
  document.documentElement.classList.toggle("still", !data.motion);
}
function updateSound() {
  document.querySelectorAll('[data-action="sound"]').forEach((b) => {
    b.innerHTML = data.sound
      ? "♪ <span>Som ligado</span>"
      : "♪ <span>Ativar som</span>";
    b.setAttribute("aria-pressed", data.sound);
    b.setAttribute("aria-label", `${data.sound ? "Desligar" : "Ligar"} som`);
  });
}
function setSound(enabled) {
  data.sound = enabled;
  persist();
  updateSound();
  if (enabled) tone(true);
  else silence();
}
function announce(text) {
  const toast = document.querySelector("#toast");
  toast.textContent = text;
  setTimeout(() => {
    if (toast.isConnected && toast.textContent === text) toast.textContent = "";
  }, 4000);
}
const points = { 1: [50, 0], 2: [100, 50], 4: [50, 100], 8: [0, 50] };
function wire(tile) {
  const ports = directions
    .filter((d) => tile & d.bit)
    .map((d) => points[d.bit]);
  if (ports.length === 2) {
    const [a, b] = ports;
    const opposite = a[0] + b[0] === 100 && a[1] + b[1] === 100;
    const inset = (p) => p.map((v) => 50 + (v - 50) * 0.24);
    return `<path d="M${a} ${opposite ? `L${b}` : `L${inset(a)} Q50,50 ${inset(b)} L${b}`}"/>`;
  }
  return ports.map((p) => `<path d="M50,50 L${p}"/>`).join("");
}
function drawBoard(l, s, decorative = false) {
  const status = network(l, s),
    n = l.n;
  return `<div class="board circuit-board ${decorative ? "decorative" : ""}" style="--n:${n}" ${decorative ? 'aria-hidden="true"' : 'role="group" aria-label="Circuito. Gire as peças para conectar todos os núcleos ao gerador verde. Setas para navegar; Enter ou espaço para girar."'}>${s.map((tile, i) => `<button class="node circuit-tile ${status.powered.has(i) ? "live" : ""} ${i === l.source ? "generator" : ""}" style="left:${(((i % n) + 0.5) * 100) / n}%;top:${((Math.floor(i / n) + 0.5) * 100) / n}%" data-node="${i}" data-ports="${tile}" ${decorative ? 'tabindex="-1" disabled' : `aria-label="${i === l.source ? "Gerador fixo" : "Peça giratória"}, linha ${Math.floor(i / n) + 1}, coluna ${(i % n) + 1}. ${status.powered.has(i) ? "Com energia" : "Sem energia"}." tabindex="${i === selected ? "0" : "-1"}" ${i === l.source ? 'aria-disabled="true"' : ""}`}><svg class="tile-svg" viewBox="0 0 100 100" aria-hidden="true"><g class="tile-wires">${wire(tile)}</g><circle class="tile-hub" cx="50" cy="50" r="${i === l.source ? 12 : 5}"/>${i === l.source ? '<path class="generator-symbol" d="M52 41 L46 50 H52 L48 59 L56 48 H50Z"/>' : ""}</svg><span class="turn-indicator" aria-hidden="true">↻</span></button>`).join("")}<div class="board-instruction" aria-hidden="true">${decorative ? "ENERGIA EM MOVIMENTO" : "TOQUE PARA GIRAR ↻"}</div></div>`;
}
function home() {
  trackAbandonedTutorial();
  screen = "home";
  epoch++;
  busy = false;
  const completed = Object.keys(data.wins).length;
  shell(
    `<main class="home minimal-home"><section class="hero-copy"><h1>Conecte.<br>Deixe <em>fluir.</em></h1><p>Gire as peças. Acenda toda a rede.</p><div class="hero-actions">${button("Jogar com som ♪", "play-sound", "primary")}${completed ? button("Continuar →", "continue", "secondary") : ""}</div>${button("Jogar sem som", "play-silent", "text-button silent-start")}<div class="home-links">${button("Fases · 50", "levels", "secondary")}${button("Diário ✳", "daily", "secondary")}</div></section><section class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div>${drawBoard(levels[0], levels[0].target, true)}</section><section class="online-ranking"><div class="ranking-heading"><h2>Top 3 geral</h2>${button("↻", "refresh-ranking", "text-button", 'aria-label="Atualizar ranking"')}</div><div id="leaderboard" aria-live="polite"><p>Carregando placar…</p></div><p class="ranking-note">Mais fases e menos giros. Sem cadastro.</p></section></main>`,
  );
  loadTop();
}
async function loadTop() {
  const container = document.querySelector("#leaderboard");
  if (!container) return;
  try {
    const result = await fetchTop();
    if (!container.isConnected) return;
    container.innerHTML = result.top.length
      ? `<ol class="podium">${result.top.map((row) => `<li><b>${row.rank}</b><span>${escapeText(row.alias)}</span><strong>${Number(row.score).toLocaleString("pt-BR")} <small>pts</small></strong></li>`).join("")}</ol>`
      : "<p>O primeiro nome pode ser o seu.</p>";
  } catch {
    if (container.isConnected)
      container.innerHTML =
        "<p>Placar indisponível. Você pode jogar normalmente.</p>";
  }
}
function levelSelect() {
  trackAbandonedTutorial();
  screen = "levels";
  epoch++;
  busy = false;
  shell(
    `<main class="level-page"><div class="eyebrow">SUA JORNADA</div><h1>Escolha seu <em>circuito.</em></h1><div class="chapters">${chapters
      .map(
        (c, k) =>
          `<section class="chapter"><div class="chapter-title"><span>0${k + 1} / ${c}</span><small>${levels.slice(k * 10, k * 10 + 10).filter((l) => data.wins[l.number]).length} DE 10</small></div><p>${["Aprenda a conectar.", "Feche os caminhos.", "Siga a energia.", "Encontre novos laços.", "Una toda a rede."][k]}</p><div class="level-grid">${levels
            .slice(k * 10, k * 10 + 10)
            .map((l) =>
              button(
                `<span>${String(l.number).padStart(2, "0")}</span><small>${data.wins[l.number] ? "◆ " + data.wins[l.number].medal : l.number > unlocked() ? "⌑" : l.number <= 3 ? "GUIADO" : "○"}</small>`,
                `level:${l.number}`,
                `level-tile ${data.wins[l.number] ? "complete" : ""}`,
                l.number > unlocked() ? "disabled" : "",
              ),
            )
            .join("")}</div></section>`,
      )
      .join("")}</div></main>`,
  );
}
function start(l) {
  trackAbandonedTutorial();
  epoch++;
  level = l;
  state = [...l.state];
  history = [];
  angles = state.map(() => 0);
  busy = false;
  hints = 0;
  selected = 1;
  screen = "game";
  track("level_start", { level_number: l.daily ? 0 : l.number, mode: l.daily ? "daily" : "campaign" });
  tutorialPending = !l.daily && l.number <= 3;
  if (tutorialPending) track("tutorial_start", { level_number: l.number });
  if (l.daily) track("daily_challenge_start");
  renderGame();
}
function renderGame() {
  const status = network(level, state),
    lesson = tutorial(level, state, solve(level, state));
  shell(
    `<main class="game-page"><div class="game-top">${button("← <span>Fases</span>", "levels", "text-button")}<span>${level.daily ? "CIRCUITO DIÁRIO · " + level.date : `CAPÍTULO 0${Math.ceil(level.number / 10)} / ${chapters[Math.ceil(level.number / 10) - 1]}`}</span><span class="stage-id">${level.daily ? "✳" : String(level.number).padStart(2, "0")}<small>${level.daily ? "DO DIA" : "/ 50"}</small></span></div><div class="game-heading"><div class="eyebrow">${lesson ? lesson.lesson : ""}</div><h1>${lesson ? lesson.title : "Acenda toda a rede."}</h1><p id="instruction">${lesson ? lesson.text : level.daily && data.daily[level.date] ? `Seu melhor hoje: ${data.daily[level.date].moves} giros · ${data.daily[level.date].medal}.` : "Gire para conectar."}</p></div><div class="game-layout"><aside class="game-aside"><span class="tiny-label">COMO JOGAR</span><h3>Gire. Conecte.</h3><p>Cada toque gira uma peça em 90°. A luz percorre os fios conectados ao gerador.</p><div class="circuit-legend"><span><i class="source-dot"></i> Gerador fixo</span><span><i></i> Com energia</span><span><i class="unlit-dot"></i> Sem conexão</span></div></aside><div class="board-wrap">${drawBoard(level, state)}<div class="board-status"><span><i></i> <b id="lit">${status.powered.size}</b> / ${state.length} COM ENERGIA</span><span id="board-state">${status.loose} PONTAS SOLTAS</span></div><div id="tutorial" class="tutorial-card" ${lesson ? "" : "hidden"} role="status" aria-live="polite"></div></div><aside class="stats"><span class="tiny-label">GIROS</span><strong id="moves">00</strong><div class="efficiency"><span>◇</span><div><small>FLUXO IDEAL</small><p>Referência: ${level.solution.length} giros</p></div></div><p class="gentle">Sem tempo limite.<br>Uma conexão de cada vez.</p></aside></div><div class="game-controls">${button("↶ <span>Desfazer</span>", "undo", "secondary", "disabled")}${button("⟳ <span>Reiniciar</span>", "restart", "secondary")}${button("✧ <span>Dica</span>", "hint", "secondary")}</div><div id="hint" class="hint-area" role="status" aria-live="polite"></div></main>`,
  );
  updateTutorial();
}
function updateTutorial() {
  const status = network(level, state),
    lesson = tutorial(level, state, solve(level, state), status.solved),
    card = document.querySelector("#tutorial");
  document
    .querySelectorAll(".guided,.guide-neighbor")
    .forEach((b) => b.classList.remove("guided", "guide-neighbor"));
  if (!lesson) return;
  card.hidden = false;
  if (status.solved) {
    card.innerHTML =
      '<span class="tutorial-step">✓</span><div><strong>A energia chegou!</strong><p>Todos conectados. Nenhuma ponta solta.</p></div>';
    return;
  }
  const index = lesson.index,
    row = Math.floor(index / level.n) + 1,
    col = (index % level.n) + 1;
  document.querySelector(`[data-node="${index}"]`).classList.add("guided");
  card.innerHTML = `<span class="tutorial-step">↻</span><div><strong>${history.length ? "Conecte o próximo trecho." : "Toque na peça marcada."}</strong><p>${lesson.remaining === 1 ? "Mais um giro." : "Siga a luz."}</p></div>`;
}
function updateBoard() {
  const status = network(level, state);
  document.querySelectorAll("[data-node]").forEach((b) => {
    const i = Number(b.dataset.node);
    b.dataset.ports = state[i];
    b.classList.toggle("live", status.powered.has(i));
    b.classList.remove("suggested");
    b.querySelector(".tile-svg").style.transform = `rotate(${angles[i]}deg)`;
    b.setAttribute(
      "aria-label",
      `${i === level.source ? "Gerador fixo" : "Peça giratória"}, linha ${Math.floor(i / level.n) + 1}, coluna ${(i % level.n) + 1}. ${status.powered.has(i) ? "Com energia" : "Sem energia"}.`,
    );
  });
  document.querySelector("#lit").textContent = status.powered.size;
  document.querySelector("#moves").textContent = String(
    history.length,
  ).padStart(2, "0");
  document.querySelector("#board-state").textContent = status.solved
    ? "REDE COMPLETA"
    : `${status.loose} PONTAS SOLTAS`;
  document.querySelector('[data-action="undo"]').disabled = !history.length;
  updateTutorial();
  return status;
}
function duration(ms) {
  return !data.motion || matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : ms;
}
async function turn(index) {
  if (busy || screen !== "game" || network(level, state).solved) return;
  if (index === level.source)
    return announce("Este é o gerador fixo. Gire as peças ao redor dele.");
  if (rotate(state[index]) === state[index])
    return announce("Esta junção já está alinhada.");
  busy = true;
  const token = epoch;
  history.push({ state: [...state], angles: [...angles], index });
  state = move(level, state, index);
  angles[index] += 90;
  tone(data.sound);
  const status = updateBoard();
  document.querySelector(`[data-node="${index}"]`).classList.add("turning");
  await new Promise((r) => setTimeout(r, duration(220)));
  if (token !== epoch) return;
  document.querySelector(".turning")?.classList.remove("turning");
  busy = false;
  if (status.solved) win();
}
async function win() {
  busy = true;
  const token = epoch;
  document.querySelector(".board").classList.add("won");
  tone(data.sound, true);
  const result = {
      moves: history.length,
      medal: medal(history.length, level.solution.length),
    },
    store = level.daily ? data.daily : data.wins,
    key = level.daily ? level.date : level.number;
  if (!store[key] || store[key].moves > result.moves) store[key] = result;
  const proof = {
    level: level.number,
    turns: history.map((entry) => entry.index),
  };
  const recordCheck = level.daily
    ? Promise.resolve(null)
    : data.alias
      ? submitScore(data, proof, data.alias)
          .then((saved) => ({
            saved,
            eligible: saved.improved && !!saved.rank,
          }))
          .catch(() => null)
      : previewScore(data, proof).catch(() => null);
  persist();
  track("level_complete", { level_number: level.daily ? 0 : level.number, mode: level.daily ? "daily" : "campaign", moves: history.length, medal: result.medal });
  if (level.daily) track("daily_challenge_complete", { moves: history.length });
  if (!level.daily && level.number <= 3) { track("tutorial_complete", { level_number: level.number }); tutorialPending = false; }
  await new Promise((r) => setTimeout(r, duration(600)));
  if (token !== epoch) return;
  busy = false;
  showDialog(
    `<div class="victory"><div class="medal ${result.medal}">✦</div><div class="eyebrow">A ENERGIA ENCONTROU SEU CAMINHO</div><h2>Tudo flui.</h2><p>Medalha de ${result.medal} · ${history.length} giros</p><small>${level.number <= 3 && !level.daily ? ["Um toque conecta caminhos.", "A luz segue os fios conectados.", "Você já sabe: gire, una e complete a rede."][level.number - 1] : `Referência: ${level.solution.length} giros`}</small><div class="victory-actions">${button(level.daily ? "Voltar ao início" : level.number === levels.length ? "Jornada concluída ↗" : "Próximo circuito ↗", level.daily || level.number === levels.length ? "home" : "next", "primary")}${button("Compartilhar resultado", "share", "secondary")}${button("Revisitar circuito", "close", "text-button")}</div></div>`,
  );
  recordCheck.then((result) => {
    if (result && token === epoch && screen === "game")
      handleRecord(result, proof);
  });
  document.querySelector("#hint").innerHTML = button(
    level.daily || level.number === levels.length
      ? "Voltar ao início"
      : "Próximo circuito ↗",
    level.daily || level.number === levels.length ? "home" : "next",
    "text-button",
  );
}
async function handleRecord(result, proof) {
  const victory = document.querySelector(".victory");
  if (!victory) return;
  if (result.eligible) {
    victory.classList.add("record-victory");
    victory.querySelector("h2").textContent = "Novo recorde!";
    victory.querySelector(".eyebrow").textContent =
      "VOCÊ ENTROU NA DISPUTA PELO TOP 3";
    tone(data.sound, "record");
    celebrate(data.motion);
  }
  if (result.saved) {
    if (result.saved.rank) {
      const note = document.createElement("p");
      note.className = "rank-success";
      note.textContent = `${result.saved.rank}º no ranking geral · ${data.alias}`;
      victory.querySelector(".victory-actions").before(note);
    }
    return;
  }
  if (data.alias) {
    try {
      const saved = await submitScore(data, proof, data.alias);
      if (victory.isConnected && saved.rank) {
        const note = document.createElement("p");
        note.className = "rank-success";
        note.textContent = `${saved.rank}º no ranking geral · ${data.alias}`;
        victory.querySelector(".victory-actions").before(note);
      }
    } catch {
      if (victory.isConnected)
        announce("Sem conexão com o placar. Sua fase foi salva.");
    }
    return;
  }
  if (!result.eligible) return;
  const form = document.createElement("form");
  form.className = "record-form";
  form.innerHTML =
    '<label for="record-name">Seu nome no top 3</label><div><input id="record-name" name="alias" autocomplete="nickname" maxlength="18" minlength="2" placeholder="Seu apelido" required><button class="primary" type="submit">Salvar</button></div><small>Opcional. O apelido ficará público.</small><p class="record-message" role="status"></p>';
  victory.querySelector(".victory-actions").before(form);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const name = form.elements.alias.value.trim();
    if (name.length < 2) return;
    const submit = form.querySelector("button"),
      message = form.querySelector(".record-message");
    submit.disabled = true;
    message.textContent = "Salvando…";
    try {
      const response = await submitScore(data, proof, name);
      data.alias = name;
      persist();
      if (!form.isConnected) return;
      form.innerHTML = `<p class="rank-success">${response.rank ? response.rank + "º no ranking geral" : "Resultado salvo"} · ${escapeText(name)}</p>`;
    } catch (error) {
      message.textContent = error.message;
      submit.disabled = false;
    }
  };
}
function showDialog(content) {
  const dialog = document.querySelector("#dialog");
  dialog.innerHTML = content;
  if (!dialog.open) dialog.showModal();
  dialog.onclick = (e) => {
    if (e.target === dialog) dialog.close();
  };
}
function settings() {
  showDialog(
    `<div class="settings"><div class="eyebrow">NO SEU RITMO</div><h2>Configurações</h2><label><div>Som <small>Notas a cada giro e ao completar a rede</small></div><input id="sound-pref" type="checkbox" ${data.sound ? "checked" : ""}></label><label><div>Animações <small>Respeita o movimento reduzido do dispositivo</small></div><input id="motion-pref" type="checkbox" ${data.motion ? "checked" : ""}></label><label class="volume-setting"><div>Volume</div><input id="volume-pref" type="range" min="0" max="1" step="0.05" value="${data.volume ?? 0.9}" aria-label="Volume dos efeitos"></label><p>Sem login. Seu apelido é público no placar.</p>${analyticsAvailable() ? `<label><div>Cookies de análise <small>O PULSE envia sinais de uso sem cookies ao Google. Ative para permitir métricas detalhadas; desative quando quiser.</small></div><input id="analytics-pref" type="checkbox" ${analyticsConsent() === "yes" ? "checked" : ""}></label>` : ""}${button("Tudo certo", "close", "primary")}</div>`,
  );
}
async function share() {
  const text = `PULSE ${level.daily ? "· Circuito diário " + level.date : "· Circuito " + level.number + "/50"}\n${history.length} giros · ${medal(history.length, level.solution.length)} ✦\nGire. Conecte. Deixe fluir.`;
  try {
    if (navigator.share) { await navigator.share({ title: "PULSE", text }); track("share_result", { mode: level.daily ? "daily" : "campaign" }); }
    else {
      await navigator.clipboard.writeText(text);
      track("share_result", { mode: level.daily ? "daily" : "campaign" });
      announce("Resultado copiado.");
    }
  } catch (e) {
    if (e.name !== "AbortError")
      showDialog(
        `<h2>Seu circuito</h2><textarea readonly aria-label="Resultado para copiar">${text}</textarea>${button("Fechar", "close", "primary")}`,
      );
  }
}
app.addEventListener("click", (e) => {
  if (e.target.closest(".brand")) {
    e.preventDefault();
    return home();
  }
  const node = e.target.closest("[data-node]");
  if (node && screen === "game") return turn(Number(node.dataset.node));
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const a = b.dataset.action;
  if (a === "refresh-ranking") return loadTop();
  if (a === "sound") return setSound(!data.sound);
  if (a === "settings") return settings();
  if (a === "close") return document.querySelector("#dialog").close();
  if (a === "share") return share();
  if (a === "home") return home();
  if (a === "levels" || a === "play") return levelSelect();
  if (a === "play-sound") {
    setSound(true);
    return start(levels[0]);
  }
  if (a === "play-silent") {
    setSound(false);
    return start(levels[0]);
  }
  if (a === "continue") return start(levels[unlocked() - 1]);
  if (a === "daily") return start(daily());
  if (a.startsWith("level:")) return start(levels[Number(a.split(":")[1]) - 1]);
  if (busy) return;
  if (a === "next") return start(levels[level.number]);
  if (a === "restart") return start(level);
  if (a === "undo" && history.length) {
    epoch++;
    const previous = history.pop();
    state = previous.state;
    angles = previous.angles;
    document.querySelector(".board").classList.remove("won");
    updateBoard();
    return;
  }
  if (a === "hint") {
    if (network(level, state).solved)
      return announce("A rede já está completa.");
    hints++;
    const text = document.querySelector("#hint");
    if (hints === 1)
      text.textContent =
        "A luz sai do gerador verde e só passa entre pontas que se encontram. Gire as peças para fechar o caminho.";
    else {
      const i = solve(level, state)?.[0];
      if (i === undefined) return;
      text.textContent = `Gire uma vez a peça da linha ${Math.floor(i / level.n) + 1}, coluna ${(i % level.n) + 1}.`;
      document.querySelector(`[data-node="${i}"]`).classList.add("suggested");
    }
  }
});
app.addEventListener("change", (e) => {
  if (e.target.id === "analytics-pref") { setAnalyticsConsent(e.target.checked); document.querySelector("#analytics-prompt")?.remove(); return; }
  if (e.target.id === "volume-pref") {
    data.volume = Number(e.target.value);
    setVolume(data.volume);
    persist();
    tone(data.sound);
    return;
  }
  if (e.target.id === "sound-pref") return setSound(e.target.checked);
  if (e.target.id === "motion-pref") {
    data.motion = e.target.checked;
    persist();
    applyMotion();
  }
});
app.addEventListener("keydown", (e) => {
  if (!e.target.matches("[data-node]") || screen !== "game") return;
  const deltas = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -level.n,
    ArrowDown: level.n,
  };
  if (e.key in deltas) {
    e.preventDefault();
    selected =
      (Number(e.target.dataset.node) + deltas[e.key] + state.length) %
      state.length;
    document
      .querySelectorAll("[data-node]")
      .forEach(
        (b) => (b.tabIndex = Number(b.dataset.node) === selected ? 0 : -1),
      );
    document.querySelector(`[data-node="${selected}"]`).focus();
  }
});
let tutorialPending = false;
function trackAbandonedTutorial() {
  if (tutorialPending && screen === "game" && level && !level.daily && level.number <= 3) {
    track("tutorial_abandon", { level_number: level.number, moves: history.length });
  }
  tutorialPending = false;
}
home();
creatorIntro(data.motion);
