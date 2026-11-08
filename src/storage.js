const key = "pulse-v1";
export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(key));
    return { wins: {}, daily: {}, sound: false, motion: true, ...d };
  } catch {
    return { wins: {}, daily: {}, sound: false, motion: true };
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
