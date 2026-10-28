// Pure helpers shared by the background, the popup and the tests.
// Nothing in here touches browser APIs.

export const MIN_PERCENT = 0;
export const MAX_PERCENT = 600;
export const STEP_PERCENT = 10;

const FLAGS = ['bass', 'voice', 'limiter'];

export const NEUTRAL = Object.freeze({ percent: 100, bass: false, voice: false, limiter: false });

export function clampPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return NEUTRAL.percent;
  return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, Math.round(n)));
}

// Builds a clean settings object from untrusted input; missing or invalid
// fields fall back to `base`.
export function sanitizeSettings(input, base = NEUTRAL) {
  const src = input !== null && typeof input === 'object' ? input : {};
  const out = {
    percent: Number.isFinite(src.percent) ? clampPercent(src.percent) : clampPercent(base.percent),
  };
  for (const flag of FLAGS) out[flag] = typeof src[flag] === 'boolean' ? src[flag] : Boolean(base[flag]);
  return out;
}

export function isNeutral(settings) {
  return settings.percent === NEUTRAL.percent && FLAGS.every((flag) => !settings[flag]);
}

export function sameSettings(a, b) {
  return a.percent === b.percent && FLAGS.every((flag) => Boolean(a[flag]) === Boolean(b[flag]));
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
