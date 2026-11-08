let context;
export function tone(enabled, win = false) {
  if (!enabled) return;
  try {
    context ??= new (window.AudioContext || window.webkitAudioContext)();
    context.resume();
    const o = context.createOscillator(),
      g = context.createGain(),
      t = context.currentTime;
    o.type = "sine";
    o.frequency.setValueAtTime(win ? 523 : 220, t);
    o.frequency.exponentialRampToValueAtTime(win ? 1046 : 440, t + 0.16);
    g.gain.setValueAtTime(0.055, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g);
    g.connect(context.destination);
    o.start();
    o.stop(t + 0.36);
  } catch {}
}
