import "./style.css";
import { levels, daily, goal, move, affected, solve, medal } from "./engine.js";
import { load, save } from "./storage.js";
import { tone } from "./audio.js";
const app = document.querySelector("#app"),
  data = load();
let screen = "home",
  level = null,
  state = 0,
  history = [],
  hints = 0,
  busy = false,
  epoch = 0,
  selected = 0;
const chapters = ["PULSO", "ESPELHO", "RESSONÂNCIA"];
const icons = {
  back: "←",
  sound: "♪",
  undo: "↶",
  restart: "⟳",
  hint: "✧",
  settings: "⚙",
  next: "↗",
};
const button = (text, action, cls = "", extra = "") =>
  `<button class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
function persist() {
  if (!save(data)) announce("Seu navegador não permitiu salvar o progresso.");
}
function unlocked() {
  let i = 1;
  while (data.wins[i] && i < 30) i++;
  return i;
}
function ruleName(l) {
  return [
    l.rules.pulse ? "Pulso" : "",
    l.rules.mirror ? "Espelho" : "",
    l.rules.diagonal ? "Ressonância" : "",
  ]
    .filter(Boolean)
    .join(" + ");
}
function hintText(l) {
  return [
    l.rules.pulse
      ? "O centro e os vizinhos em cruz alternam."
      : "O centro alterna.",
    l.rules.mirror ? "O correspondente do outro lado também alterna." : "",
    l.rules.diagonal ? "Os vizinhos diagonais também alternam." : "",
  ]
    .filter(Boolean)
    .join(" ");
}
function header() {
  return `<header><a class="brand" href="#" aria-label="PULSE início">P<span>U</span>LSE<i></i></a><nav>${button("Jogar", "continue", screen === "game" ? "nav-active" : "")}${button("Fases", "levels", screen === "levels" ? "nav-active" : "")}${button('Diário <span class="nav-dot"></span>', "daily")}${button(icons.settings, "settings", "icon", 'aria-label="Configurações"')}</nav></header>`;
}
function footer() {
  return `<footer><span>UM TOQUE. NOVAS CONEXÕES.</span><span>FEITO PARA DESCOBRIR <i>✦</i></span></footer>`;
}
function shell(content) {
  app.innerHTML =
    header() +
    content +
    footer() +
    `<div id="toast" role="status" aria-live="polite"></div><dialog id="dialog"></dialog>`;
  applyMotion();
}
function applyMotion() {
  document.documentElement.classList.toggle("still", !data.motion);
}
function drawBoard(l, s, decorative = false) {
  const n = l.n,
    spacing = 100 / (n + 1),
    point = (i) => [spacing * ((i % n) + 1), spacing * (Math.floor(i / n) + 1)];
  let lines = "";
  for (let i = 0; i < n * n; i++)
    for (const j of [i % n < n - 1 ? i + 1 : -1, i + n < n * n ? i + n : -1])
      if (j >= 0) {
        const a = point(i),
          b = point(j);
        lines += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
      }
  return `<div class="board ${decorative ? "decorative" : ""}" style="--n:${n}" ${decorative ? 'aria-hidden="true"' : 'role="group" aria-label="Tabuleiro. Ative todos os núcleos. Use as setas para navegar e Enter ou espaço para emitir um pulso."'}><svg viewBox="0 0 100 100" class="connections" aria-hidden="true">${lines}</svg>${Array.from(
    { length: n * n },
    (_, i) => {
      const p = point(i),
        on = !!(s & (1 << i));
      return `<button class="node ${on ? "on" : ""}" style="left:${p[0]}%;top:${p[1]}%;--delay:${i * 60}ms" data-node="${i}" ${decorative ? 'tabindex="-1" disabled' : `aria-label="Núcleo ${Math.floor(i / n) + 1}, ${(i % n) + 1}" aria-pressed="${on}" tabindex="${i === selected ? "0" : "-1"}"`}><span></span></button>`;
    },
  ).join(
    "",
  )}<span class="board-coordinate coord-a">01 / ${String(n * n).padStart(2, "0")}</span><span class="board-coordinate coord-b">REDE ATIVA</span></div>`;
}
function home() {
  screen = "home";
  epoch++;
  busy = false;
  shell(
    `<main class="home"><section class="hero-copy"><div class="eyebrow"><span></span> UM PUZZLE DE CONEXÕES</div><h1>Sinta o padrão.<br>Descubra a <em>lógica.</em></h1><p>Cada toque transforma a rede.<br>Encontre a conexão. Acenda todos os núcleos.</p><div class="hero-actions">${button("Jogar <span>↗</span>", "play", "primary")}${button("Continuar <span>→</span>", "continue", "secondary", Object.keys(data.wins).length ? "" : "disabled")}</div><div class="hero-meta"><span>30 FASES</span><b>·</b><span>3 CAPÍTULOS</span><b>·</b><span>SEM PRESSA</span></div></section><section class="hero-art"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="art-label"><span>●</span> TUDO ESTÁ CONECTADO</div>${drawBoard(levels[3], levels[3].state, true)}<div class="art-caption"><span>TOQUE. OBSERVE. CONECTE.</span><span>↗</span></div></section><section class="home-bottom"><button class="daily-card" data-action="daily"><span class="daily-icon">✳</span><div><small>UMA NOVA CONEXÃO, TODOS OS DIAS</small><h2>Desafio diário <span>↗</span></h2><p>${daily().date.split("-").reverse().join(".")} <b>·</b> ${data.daily[daily().date] ? "Concluído. Jogue novamente." : "Um padrão único espera por você."}</p></div><span class="pill">DISPONÍVEL</span></button><div class="progress-card"><div><small>SUA JORNADA</small><span>${Object.keys(data.wins).length}<b> / 30</b></span></div><div class="progress-track"><i style="width:${(Object.keys(data.wins).length / 30) * 100}%"></i></div><p>Uma descoberta de cada vez.</p></div></section></main>`,
  );
}
function levelSelect() {
  screen = "levels";
  epoch++;
  busy = false;
  shell(
    `<main class="level-page"><div class="eyebrow">SUA JORNADA</div><h1>Encontre seu próximo <em>padrão.</em></h1><p class="muted">Cada capítulo revela uma nova forma de conectar.</p><div class="chapters">${chapters
      .map(
        (c, k) =>
          `<section class="chapter"><div class="chapter-title"><span>0${k + 1} / ${c}</span><small>${levels.slice(k * 10, k * 10 + 10).filter((l) => data.wins[l.number]).length} DE 10</small></div><p>${["O começo de toda conexão.", "O outro lado também responde.", "A energia encontra novos caminhos."][k]}</p><div class="level-grid">${levels
            .slice(k * 10, k * 10 + 10)
            .map((l) =>
              button(
                `<span>${String(l.number).padStart(2, "0")}</span><small>${data.wins[l.number] ? "◆ " + data.wins[l.number].medal : l.number > unlocked() ? "⌑" : "○"}</small>`,
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
  state = l.state;
  history = [];
  hints = 0;
  selected = 0;
  busy = false;
  screen = "game";
  renderGame();
  if (level.number === 1 && !level.daily && !data.wins[1]) {
    document
      .querySelector(`[data-node="${level.solution[0]}"]`)
      .classList.add("intro");
  }
}
function renderGame() {
  const lit = count(state);
  shell(
    `<main class="game-page"><div class="game-top">${button("← <span>Fases</span>", "levels", "text-button")}<span>${level.daily ? "DESAFIO DIÁRIO · " + level.date : `CAPÍTULO 0${Math.ceil(level.number / 10)} / ${chapters[Math.ceil(level.number / 10) - 1]}`}</span><span class="stage-id">${level.daily ? "✳" : String(level.number).padStart(2, "0")}<small>${level.daily ? "DO DIA" : "/ 30"}</small></span></div><div class="game-heading"><div class="eyebrow">${ruleName(level).toUpperCase()}</div><h1>Acenda todas as conexões.</h1><p id="instruction">${level.number === 1 && !level.daily ? "Toque um núcleo. Observe o que muda." : level.daily && data.daily[level.date] ? `Seu melhor hoje: ${data.daily[level.date].moves} movimentos · ${data.daily[level.date].medal}.` : "Encontre o padrão. Um pulso de cada vez."}</p>${[11, 21, 24, 27].includes(level.number) && !level.daily ? button("▷ Observar nova conexão", "example", "text-button example-button") : ""}</div><div class="game-layout"><aside class="game-aside"><span class="tiny-label">OBJETIVO</span><h3>Todos acesos.</h3><p>Observe o caminho da energia a cada toque.</p><div class="legend"><i></i> Aceso <i class="off"></i> Apagado</div><div class="rule-tags">${Object.entries(
      level.rules,
    )
      .map(
        ([k]) =>
          `<span>${{ pulse: "＋ Pulso", mirror: "↔ Espelho", diagonal: "⤢ Ressonância" }[k]}</span>`,
      )
      .join(
        "",
      )}</div></aside><div class="board-wrap">${drawBoard(level, state)}<div class="board-status"><span><i></i> <b id="lit">${lit}</b> / ${level.n ** 2} ACESOS</span><span id="board-state">AGUARDANDO PULSO</span></div></div><aside class="stats"><span class="tiny-label">MOVIMENTOS</span><strong id="moves">${history.length.toString().padStart(2, "0")}</strong><div class="efficiency"><span>◇</span><div><small>NA MEDIDA CERTA</small><p>Referência: ${level.solution.length} movimentos</p></div></div><p class="gentle">Sem tempo limite.<br>Seu ritmo, sua descoberta.</p></aside></div><div class="game-controls">${button("↶ <span>Desfazer</span>", "undo", "secondary", history.length ? "" : "disabled")}${button("⟳ <span>Reiniciar</span>", "restart", "secondary")}${button("✧ <span>Dica</span>", "hint", "secondary")}</div><div class="hint-area" id="hint" role="status" aria-live="polite"></div></main>`,
  );
}
function count(s) {
  let c = 0;
  while (s) {
    c += s & 1;
    s >>>= 1;
  }
  return c;
}
function updateBoard() {
  document.querySelectorAll("[data-node]").forEach((b) => {
    const i = Number(b.dataset.node),
      on = !!(state & (1 << i));
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on);
    b.classList.remove("suggested");
  });
  document.querySelector("#moves").textContent = String(
    history.length,
  ).padStart(2, "0");
  document.querySelector("#lit").textContent = count(state);
  document.querySelector('[data-action="undo"]').disabled = !history.length;
}
function duration(ms) {
  return !data.motion || matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : ms;
}
async function pulse(index, example = false) {
  if (busy || screen !== "game") return;
  busy = true;
  document.querySelector(".intro")?.classList.remove("intro");
  const token = epoch;
  const nodes = affected(level.n, level.rules, index),
    origin = document.querySelector(`[data-node="${index}"]`);
  origin.classList.add("source");
  document.querySelector("#board-state").textContent = example
    ? "EXEMPLO · OBSERVE"
    : "PROPAGANDO";
  const svg = document.querySelector(".connections");
  const ns = "http://www.w3.org/2000/svg",
    sp = 100 / (level.n + 1),
    p = (i) => [sp * ((i % level.n) + 1), sp * (Math.floor(i / level.n) + 1)],
    a = p(index);
  for (const i of nodes) {
    const b = p(i),
      line = document.createElementNS(ns, "line");
    for (const [k, v] of Object.entries({
      x1: a[0],
      y1: a[1],
      x2: b[0],
      y2: b[1],
      class: "energy",
    }))
      line.setAttribute(k, v);
    svg.append(line);
    document.querySelector(`[data-node="${i}"]`).classList.add("receiving");
  }
  tone(data.sound);
  await new Promise((r) => setTimeout(r, duration(320)));
  if (token !== epoch) return;
  if (!example) {
    history.push(state);
    state = move(state, level.n, level.rules, index);
    updateBoard();
  }
  await new Promise((r) => setTimeout(r, duration(180)));
  if (token !== epoch) return;
  document.querySelectorAll(".energy").forEach((e) => e.remove());
  document
    .querySelectorAll(".source,.receiving")
    .forEach((e) => e.classList.remove("source", "receiving"));
  document.querySelector("#board-state").textContent = "AGUARDANDO PULSO";
  busy = false;
  if (!example && state === goal(level.n)) win();
}
async function win() {
  busy = true;
  document.querySelector(".board").classList.add("won");
  tone(data.sound, true);
  const result = {
    moves: history.length,
    medal: medal(history.length, level.solution.length),
  };
  const store = level.daily ? data.daily : data.wins,
    key = level.daily ? level.date : level.number;
  if (!store[key] || store[key].moves > result.moves) store[key] = result;
  persist();
  const token = epoch;
  await new Promise((r) => setTimeout(r, duration(650)));
  if (token !== epoch) return;
  busy = false;
  showDialog(
    `<div class="victory"><div class="medal ${result.medal}">✦</div><div class="eyebrow">${level.daily ? "PADRÃO DO DIA ENCONTRADO" : "CONEXÃO COMPLETA"}</div><h2>Em perfeita sintonia.</h2><p>Medalha de ${result.medal} · ${history.length} movimentos</p><small>Referência ideal: ${level.solution.length} movimentos</small><div class="victory-actions">${button(level.daily ? "Voltar ao início" : level.number === 30 ? "Jornada concluída ↗" : "Próxima fase ↗", level.daily || level.number === 30 ? "home" : "next", "primary")}${button("Compartilhar resultado", "share", "secondary")}${button("Revisitar tabuleiro", "close", "text-button")}</div></div>`,
  );
}
function showDialog(content) {
  const d = document.querySelector("#dialog");
  d.innerHTML = content;
  d.showModal();
  d.addEventListener("click", (e) => {
    if (e.target === d) d.close();
  });
}
function settings() {
  showDialog(
    `<div class="settings"><div class="eyebrow">NO SEU RITMO</div><h2>Configurações</h2><label><div>Som <small>Tons suaves a cada pulso</small></div><input id="sound-pref" type="checkbox" ${data.sound ? "checked" : ""}></label><label><div>Animações <small>Respeita o movimento reduzido do dispositivo</small></div><input id="motion-pref" type="checkbox" ${data.motion ? "checked" : ""}></label><p>Seu progresso fica salvo neste navegador.</p>${button("Tudo certo", "close", "primary")}</div>`,
  );
}
function announce(text) {
  document.querySelector("#toast").textContent = text;
  setTimeout(() => {
    const t = document.querySelector("#toast");
    if (t?.textContent === text) t.textContent = "";
  }, 4000);
}
async function share() {
  const text = `PULSE ${level.daily ? "· Diário " + level.date : "· Fase " + level.number + "/30"}\n${history.length} movimentos · ${medal(history.length, level.solution.length)} ✦\nSinta o padrão. Descubra a lógica.`;
  try {
    if (navigator.share) await navigator.share({ title: "PULSE", text });
    else {
      await navigator.clipboard.writeText(text);
      announce("Resultado copiado.");
    }
  } catch (e) {
    if (e.name !== "AbortError")
      showDialog(
        `<h2>Seu resultado</h2><textarea readonly aria-label="Resultado para copiar">${text}</textarea><p>Selecione o texto para copiar.</p>${button("Fechar", "close", "primary")}`,
      );
  }
}
app.addEventListener("click", (e) => {
  const brand = e.target.closest(".brand");
  if (brand) {
    e.preventDefault();
    home();
    return;
  }
  const node = e.target.closest("[data-node]");
  if (node) {
    if (state !== goal(level.n)) pulse(Number(node.dataset.node));
    return;
  }
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const a = b.dataset.action;
  if (a === "settings") return settings();
  if (a === "close") return document.querySelector("#dialog").close();
  if (a === "share") return share();
  if (a === "home") return home();
  if (a === "levels") return levelSelect();
  if (a === "play") return levelSelect();
  if (a === "continue") return start(levels[unlocked() - 1]);
  if (a === "daily") return start(daily());
  if (a.startsWith("level:")) return start(levels[Number(a.split(":")[1]) - 1]);
  if (busy) return;
  if (a === "next") return start(levels[level.number]);
  if (a === "restart") return start(level);
  if (a === "undo" && history.length) {
    epoch++;
    state = history.pop();
    document.querySelector(".board").classList.remove("won");
    updateBoard();
    return;
  }
  if (a === "hint") {
    if (state === goal(level.n))
      return announce("Todos os núcleos já estão acesos.");
    hints++;
    const text = document.querySelector("#hint");
    if (hints === 1) text.textContent = hintText(level);
    else {
      const i = solve(state, level.n, level.rules)[0];
      text.textContent = `Experimente o núcleo da linha ${Math.floor(i / level.n) + 1}, coluna ${(i % level.n) + 1}.`;
      document.querySelector(`[data-node="${i}"]`).classList.add("suggested");
    }
    return;
  }
  if (a === "example") {
    document.querySelector("#hint").textContent =
      hintText(level) + " Exemplo visual: o tabuleiro não é alterado.";
    pulse(Math.floor(level.n / 2), true);
  }
});
app.addEventListener("change", (e) => {
  if (e.target.id === "sound-pref") data.sound = e.target.checked;
  if (e.target.id === "motion-pref") data.motion = e.target.checked;
  persist();
  applyMotion();
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
      (Number(e.target.dataset.node) + deltas[e.key] + level.n ** 2) %
      level.n ** 2;
    document
      .querySelectorAll("[data-node]")
      .forEach(
        (b) => (b.tabIndex = Number(b.dataset.node) === selected ? 0 : -1),
      );
    document.querySelector(`[data-node="${selected}"]`).focus();
  }
});
home();
