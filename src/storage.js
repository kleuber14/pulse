const key = "pulse-circuits-v2";
export function load() {
  try {
    const old = JSON.parse(localStorage.getItem("pulse-v1")) || {};
    const saved = JSON.parse(localStorage.getItem(key)) || {};
    return {
      wins: {},
      daily: {},
      volume: 0.9,
      sound: old.sound === true,
      motion: old.motion !== false,
      ...saved,
    };
  } catch {
    return { wins: {}, daily: {}, volume: 0.9, sound: false, motion: true };
  }
}
export function save(data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
