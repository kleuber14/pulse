let context,
  master,
  volume = 0.9,
  generation = 0;
const active = new Set();
export function setVolume(value) {
  volume = Math.max(0, Math.min(1, Number(value) || 0));
  if (master && context)
    master.gain.setValueAtTime(volume, context.currentTime);
}
export function silence() {
  generation++;
  for (const oscillator of active) {
    try {
      oscillator.stop();
    } catch {}
  }
  active.clear();
}
export async function tone(enabled, event = false) {
  if (!enabled || volume === 0) return false;
  const token = generation;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    if (!context) {
      context = new Audio();
      master = context.createGain();
      master.gain.setValueAtTime(volume, context.currentTime);
      const compressor = context.createDynamicsCompressor?.();
      if (compressor) {
        compressor.threshold.value = -14;
        compressor.knee.value = 18;
        compressor.ratio.value = 5;
        master.connect(compressor);
        compressor.connect(context.destination);
      } else master.connect(context.destination);
    }
    if (context.state === "suspended") await context.resume();
    if (token !== generation) return false;
    const record = event === "record",
      win = event === true,
      notes = record
        ? [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]
        : win
          ? [523.25, 659.25, 783.99, 1046.5]
          : [659.25, 987.77];
    const t = context.currentTime;
    for (const [i, frequency] of notes.entries()) {
      const o = context.createOscillator(),
        g = context.createGain(),
        start = t + i * (record ? 0.09 : win ? 0.075 : 0.014),
        length = record ? 0.65 : win ? 0.45 : 0.22;
      o.type = i % 2 ? "sine" : "triangle";
      o.frequency.setValueAtTime(frequency, start);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(
        record ? 0.26 : win ? 0.22 : 0.2,
        start + 0.012,
      );
      g.gain.exponentialRampToValueAtTime(0.0001, start + length);
      o.connect(g);
      g.connect(master);
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
