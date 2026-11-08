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
} from "./engine.js";
import { tutorial } from "./tutorial.js";
import { load, save } from "./storage.js";
import { tone, silence } from "./audio.js";
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
const chapters = ["CONEXÃO", "CIRCUITOS", "FLUXO"];
const button = (text, action, cls = "", extra = "") =>
  `<button class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
function persist() {
  if (!save(data)) announce("O navegador não permitiu salvar seu progresso.");
}
function unlocked() {
  let i = 1;
  while (data.wins[i] && i < 30) i++;
  return i;
}
function header() {
  return `<header><a class="brand" href="#" aria-label="PULSE início">P<span>U</span>LSE<i></i></a><nav>${button("Jogar", "continue", screen === "game" ? "nav-active" : "")}${button("Fases", "levels", screen === "levels" ? "nav-active" : "")}${button('Diário <span class="nav-dot"></span>', "daily")}${button(data.sound ? "♪ <span>Som ligado</span>" : "♪ <span>Ativar som</span>", "sound", "sound-toggle", `aria-label="${data.sound ? "Desligar" : "Ligar"} som" aria-pressed="${data.sound}"`)}${button("⚙", "settings", "icon", 'aria-label="Configurações"')}</nav></header>`;
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
  screen = "home";
  epoch++;
  busy = false;
  const day = daily(),
    completed = Object.keys(data.wins).length;
  shell(
    `<main class="home"><section class="hero-copy"><div class="eyebrow"><span></span> ENCONTRE SEU FLUXO</div><h1>Conecte a energia.<br>Deixe a mente <em>fluir.</em></h1><p>Gire as peças. Una os caminhos.<br>Leve a luz do gerador até toda a rede.</p><div class="hero-actions">${button("Jogar com som <span>♪</span>", "play-sound", "primary")}${button("Continuar <span>→</span>", "continue", "secondary", completed ? "" : "disabled")}</div>${button("Prefiro jogar sem som →", "play-silent", "text-button silent-start")}<div class="hero-meta"><span>30 CIRCUITOS</span><b>·</b><span>3 CAPÍTULOS</span><b>·</b><span>SEM PRESSA</span></div></section><section class="hero-art"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="art-label"><span>●</span> SIGA A LUZ</div>${drawBoard(levels[0], levels[0].target, true)}<div class="art-caption"><span>GIRE. CONECTE. RESPIRE.</span><span>↗</span></div></section><section class="home-bottom"><button class="daily-card" data-action="daily"><span class="daily-icon">✳</span><div><small>UM MOMENTO SÓ SEU</small><h2>Circuito diário <span>↗</span></h2><p>${day.date.split("-").reverse().join(".")} · ${data.daily[day.date] ? `Seu melhor: ${data.daily[day.date].moves} giros` : "Uma nova rede para descobrir."}</p></div><span class="pill">DISPONÍVEL</span></button><div class="progress-card"><div><small>SUA JORNADA</small><span>${completed}<b> / 30</b></span></div><div class="progress-track"><i style="width:${(completed / 30) * 100}%"></i></div><p>Comece com três circuitos guiados.</p></div></section></main>`,
  );
}
function levelSelect() {
  screen = "levels";
  epoch++;
  busy = false;
  shell(
    `<main class="level-page"><div class="eyebrow">SUA JORNADA</div><h1>Uma conexão de cada <em>vez.</em></h1><p class="muted">Nas três primeiras fases, a luz mostra o caminho.</p><div class="chapters">${chapters
      .map(
        (c, k) =>
          `<section class="chapter"><div class="chapter-title"><span>0${k + 1} / ${c}</span><small>${levels.slice(k * 10, k * 10 + 10).filter((l) => data.wins[l.number]).length} DE 10</small></div><p>${["Aprenda a girar e siga a energia.", "Encontre os caminhos que se encontram.", "Mais conexões. Um fluxo contínuo."][k]}</p><div class="level-grid">${levels
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
  epoch++;
  level = l;
  state = [...l.state];
  history = [];
  angles = state.map(() => 0);
  busy = false;
  hints = 0;
  selected = 1;
  screen = "game";
  renderGame();
}
function renderGame() {
  const status = network(level, state),
    lesson = tutorial(level, state, solve(level, state));
  shell(
    `<main class="game-page"><div class="game-top">${button("← <span>Fases</span>", "levels", "text-button")}<span>${level.daily ? "CIRCUITO DIÁRIO · " + level.date : `CAPÍTULO 0${Math.ceil(level.number / 10)} / ${chapters[Math.ceil(level.number / 10) - 1]}`}</span><span class="stage-id">${level.daily ? "✳" : String(level.number).padStart(2, "0")}<small>${level.daily ? "DO DIA" : "/ 30"}</small></span></div><div class="game-heading"><div class="eyebrow">${lesson ? lesson.lesson : "GIRE AS PEÇAS · CONECTE A REDE"}</div><h1>${lesson ? lesson.title : "Leve a energia a todos os núcleos."}</h1><p id="instruction">${lesson ? lesson.text : level.daily && data.daily[level.date] ? `Seu melhor hoje: ${data.daily[level.date].moves} giros · ${data.daily[level.date].medal}.` : "Conecte todos ao gerador verde, sem pontas soltas."}</p></div><div class="game-layout"><aside class="game-aside"><span class="tiny-label">COMO JOGAR</span><h3>Gire. Conecte.</h3><p>Cada toque gira uma peça em 90°. A luz percorre os fios conectados ao gerador.</p><div class="circuit-legend"><span><i class="source-dot"></i> Gerador fixo</span><span><i></i> Com energia</span><span><i class="unlit-dot"></i> Sem conexão</span></div></aside><div class="board-wrap">${drawBoard(level, state)}<div class="board-status"><span><i></i> <b id="lit">${status.powered.size}</b> / ${state.length} COM ENERGIA</span><span id="board-state">${status.loose} PONTAS SOLTAS</span></div><div id="tutorial" class="tutorial-card" ${lesson ? "" : "hidden"} role="status" aria-live="polite"></div></div><aside class="stats"><span class="tiny-label">GIROS</span><strong id="moves">00</strong><div class="efficiency"><span>◇</span><div><small>FLUXO IDEAL</small><p>Referência: ${level.solution.length} giros</p></div></div><p class="gentle">Sem tempo limite.<br>Uma conexão de cada vez.</p></aside></div><div class="game-controls">${button("↶ <span>Desfazer</span>", "undo", "secondary", "disabled")}${button("⟳ <span>Reiniciar</span>", "restart", "secondary")}${button("✧ <span>Dica</span>", "hint", "secondary")}</div><div id="hint" class="hint-area" role="status" aria-live="polite"></div></main>`,
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
  const progress = history.length
    ? `${status.powered.size} de ${state.length} núcleos com energia. `
    : "";
  card.innerHTML = `<span class="tutorial-step">↻</span><div><strong>${history.length ? "Agora conecte o próximo trecho." : "Toque na peça destacada."}</strong><p>${progress}Linha ${row}, coluna ${col}. ${lesson.remaining === 1 ? "Falta um giro para completar a rede." : `${lesson.remaining} giros podem completar o caminho.`}</p></div>`;
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
  busy = true;
  const token = epoch;
  history.push({ state: [...state], angles: [...angles] });
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
  persist();
  await new Promise((r) => setTimeout(r, duration(600)));
  if (token !== epoch) return;
  busy = false;
  showDialog(
    `<div class="victory"><div class="medal ${result.medal}">✦</div><div class="eyebrow">A ENERGIA ENCONTROU SEU CAMINHO</div><h2>Tudo flui.</h2><p>Medalha de ${result.medal} · ${history.length} giros</p><small>${level.number <= 3 && !level.daily ? ["Um toque conecta caminhos.", "A luz segue os fios conectados.", "Você já sabe: gire, una e complete a rede."][level.number - 1] : `Referência: ${level.solution.length} giros`}</small><div class="victory-actions">${button(level.daily ? "Voltar ao início" : level.number === 30 ? "Jornada concluída ↗" : "Próximo circuito ↗", level.daily || level.number === 30 ? "home" : "next", "primary")}${button("Compartilhar resultado", "share", "secondary")}${button("Revisitar circuito", "close", "text-button")}</div></div>`,
  );
  document.querySelector("#hint").innerHTML = button(
    level.daily || level.number === 30
      ? "Voltar ao início"
      : "Próximo circuito ↗",
    level.daily || level.number === 30 ? "home" : "next",
    "text-button",
  );
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
    `<div class="settings"><div class="eyebrow">NO SEU RITMO</div><h2>Configurações</h2><label><div>Som <small>Notas a cada giro e ao completar a rede</small></div><input id="sound-pref" type="checkbox" ${data.sound ? "checked" : ""}></label><label><div>Animações <small>Respeita o movimento reduzido do dispositivo</small></div><input id="motion-pref" type="checkbox" ${data.motion ? "checked" : ""}></label><p>Seu progresso fica salvo neste navegador.</p>${button("Tudo certo", "close", "primary")}</div>`,
  );
}
async function share() {
  const text = `PULSE ${level.daily ? "· Circuito diário " + level.date : "· Circuito " + level.number + "/30"}\n${history.length} giros · ${medal(history.length, level.solution.length)} ✦\nGire. Conecte. Deixe fluir.`;
  try {
    if (navigator.share) await navigator.share({ title: "PULSE", text });
    else {
      await navigator.clipboard.writeText(text);
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
home();
