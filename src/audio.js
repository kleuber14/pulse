let context;
let generation = 0;
const active = new Set();
export function silence() {
  generation++;
  for (const oscillator of active) {
    try {
      oscillator.stop();
    } catch {}
  }
  active.clear();
}
// Called from a real click/touch before sound is scheduled; mobile browsers require this.
export async function tone(enabled, win = false) {
  if (!enabled) return false;
  const token = generation;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    context ??= new Audio();
    if (context.state === "suspended") await context.resume();
    if (token !== generation) return false;
    const t = context.currentTime;
    for (const [index, frequency] of (win
      ? [392, 493.88, 587.33, 783.99]
      : [392, 587.33]
    ).entries()) {
      const o = context.createOscillator(),
        g = context.createGain(),
        start = t + index * (win ? 0.075 : 0.015),
        length = win ? 0.65 : 0.24;
      o.type = "sine";
      o.frequency.setValueAtTime(frequency, start);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(win ? 0.1 : 0.075, start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, start + length);
      o.connect(g);
      g.connect(context.destination);
      active.add(o);
      o.onended = () => {
        active.delete(o);
        o.disconnect();
        g.disconnect();
      };
      o.start(start);
      o.stop(start + length + 0.02);
    }
    return true;
  } catch {
    return false;
  }
}
