export function celebrate(motion = true) {
  if (!motion || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const layer = document.createElement("div");
  layer.className = "confetti";
  layer.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 32; i++) {
    const piece = document.createElement("i");
    piece.style.cssText = `--x:${(i * 37) % 100}vw;--spin:${i * 47}deg;--delay:${(i % 7) * 35}ms;--color:${["#7de8e5", "#d8f895", "#ffbd35", "#b8a4f4"][i % 4]}`;
    layer.append(piece);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 2400);
}
export function creatorIntro(motion = true) {
  try {
    if (window.sessionStorage.getItem("pulse-creator-intro")) return;
    window.sessionStorage.setItem("pulse-creator-intro", "1");
  } catch {}
  const layer = document.createElement("div");
  layer.className = "creator-intro";
  layer.setAttribute("role", "dialog");
  layer.setAttribute("aria-label", "Kleuber Avila apresenta");
  layer.setAttribute("aria-modal", "true");
  layer.innerHTML =
    '<img src="./creator-logo.webp" alt="Kleuber Avila" width="520" height="315"><span>APRESENTA</span><button type="button">Pular →</button>';
  document.body.append(layer);
  const app = document.querySelector("#app");
  app.inert = true;
  const dismiss = () => {
    layer.remove();
    app.inert = false;
    document.removeEventListener("keydown", escape);
  };
  const escape = (e) => {
    if (e.key === "Escape") dismiss();
  };
  layer.querySelector("button").onclick = dismiss;
  document.addEventListener("keydown", escape);
  layer.querySelector("button").focus();
  setTimeout(
    dismiss,
    motion && !matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 2300
      : 1200,
  );
}
