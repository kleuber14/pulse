const STORAGE_KEY = "pulse-analytics-consent-v1";
const ID = (import.meta.env?.VITE_GA4_MEASUREMENT_ID || "G-QMC55XB137").trim();
const VALID_ID = /^G-[A-Z0-9]+$/.test(ID);
let initialized = false;

export function analyticsAvailable() {
  return VALID_ID;
}
export function analyticsConsent() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}
export function setAnalyticsConsent(accepted) {
  try { localStorage.setItem(STORAGE_KEY, accepted ? "yes" : "no"); } catch {}
  if (accepted) {
    if (initialized && typeof window.gtag === "function") window.gtag("consent", "update", { analytics_storage: "granted" });
    else initialize();
  }
  else if (initialized && typeof window.gtag === "function") {
    window.gtag("consent", "update", { analytics_storage: "denied" });
  }
}
function initialize() {
  if (!VALID_ID || analyticsConsent() !== "yes" || initialized || typeof document === "undefined") return;
  initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  window.gtag("js", new Date());
  window.gtag("config", ID, { send_page_view: true });
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ID);
  document.head.appendChild(script);
}
export function track(event, parameters = {}) {
  if (!VALID_ID || analyticsConsent() !== "yes") return;
  initialize();
  if (typeof window.gtag !== "function") return;
  const safe = {};
  for (const [key, value] of Object.entries(parameters)) {
    if (/^[a-z][a-z0-9_]{0,39}$/.test(key) && (typeof value === "string" || typeof value === "number" || typeof value === "boolean")) safe[key] = value;
  }
  window.gtag("event", event, safe);
}
initialize();
