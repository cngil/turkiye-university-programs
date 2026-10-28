// Pure helpers shared by the background, the popup and the tests.
// Nothing in here touches browser APIs.

export const MIN_PERCENT = 0;
export const MAX_PERCENT = 500;
export const STEP_PERCENT = 10;

// One sound mode at a time: 'default' (untouched), 'voice' or 'bass'.
export const EFFECTS = Object.freeze(['default', 'voice', 'bass']);

export const NEUTRAL = Object.freeze({ percent: 100, effect: 'default' });

export function clampPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return NEUTRAL.percent;
  return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, Math.round(n)));
}

// Builds a clean settings object from untrusted input; missing or invalid
// fields fall back to `base`.
export function sanitizeSettings(input, base = NEUTRAL) {
  const src = input !== null && typeof input === 'object' ? input : {};
  return {
    percent: Number.isFinite(src.percent) ? clampPercent(src.percent) : clampPercent(base.percent),
    effect: EFFECTS.includes(src.effect) ? src.effect : EFFECTS.includes(base.effect) ? base.effect : NEUTRAL.effect,
  };
}

export function isNeutral(settings) {
  return settings.percent === NEUTRAL.percent && settings.effect === NEUTRAL.effect;
}

export function sameSettings(a, b) {
  return a.percent === b.percent && a.effect === b.effect;
}

// The key used to remember a volume per website. Only real web pages qualify.
export function siteKey(url) {
  try {
    const u = new URL(url);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.hostname;
  } catch {
    // not a URL
  }
  return null;
}

// Hosts where browsers never let extensions touch the page.
const STORE_HOSTS = new Set([
  'chromewebstore.google.com',
  'chrome.google.com',
  'addons.mozilla.org',
  'microsoftedge.microsoft.com',
]);

export function isRestrictedUrl(url) {
  if (!url) return false; // unknown: let the engine decide
  let u;
  try {
    u = new URL(url);
  } catch {
    return true;
  }
  if (!['http:', 'https:', 'file:'].includes(u.protocol)) return true;
  return STORE_HOSTS.has(u.hostname);
}

export function levelOf(percent) {
  if (percent <= 100) return 'normal';
  if (percent <= 300) return 'boost';
  return 'high';
}
