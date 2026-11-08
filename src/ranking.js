const origin = "https://pulse-ranking-kleuber14.kleuber14.chatgpt.site";
function token(data) {
  data.playerToken ??=
    crypto.randomUUID().replaceAll("-", "") +
    crypto.randomUUID().replaceAll("-", "");
  return data.playerToken;
}
async function request(path, data, payload) {
  const response = await fetch(origin + path, {
    method: payload ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(data ? { Authorization: "Bearer " + token(data) } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
    signal: AbortSignal.timeout(6000),
  });
  const body = await response.json();
  if (!response.ok) throw Error(body.error || "Placar indisponível.");
  return body;
}
export const fetchTop = () => request("/api/leaderboard");
export const previewScore = (data, proof) =>
  request("/api/preview", data, proof);
export const submitScore = (data, proof, alias) =>
  request("/api/scores", data, { ...proof, alias });
export function escapeText(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
}
