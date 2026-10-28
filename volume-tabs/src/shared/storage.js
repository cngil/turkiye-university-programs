// Everything is stored locally with storage.local. Nothing is ever synced or sent anywhere.
import { api } from './api.js';
import { isNeutral, sanitizeSettings } from './settings.js';

const MAX_SITES = 1000;

export const DEFAULT_PREFS = Object.freeze({
  theme: 'auto', // auto | light | dark
  engine: 'auto', // auto | capture (Chrome only)
  rememberSites: true,
  autoRestore: false,
});

const CHOICES = { theme: ['auto', 'light', 'dark'], engine: ['auto', 'capture'] };

export function sanitizePrefs(input) {
  const src = input !== null && typeof input === 'object' ? input : {};
  const out = { ...DEFAULT_PREFS };
  for (const [key, allowed] of Object.entries(CHOICES)) {
    if (allowed.includes(src[key])) out[key] = src[key];
  }
  for (const key of ['rememberSites', 'autoRestore']) {
    if (typeof src[key] === 'boolean') out[key] = src[key];
  }
  return out;
}

export async function getPrefs() {
  const { prefs } = await api.storage.local.get('prefs');
  return sanitizePrefs(prefs);
}

export async function setPrefs(patch) {
  const prefs = sanitizePrefs({ ...(await getPrefs()), ...patch });
  await api.storage.local.set({ prefs });
  return prefs;
}

async function getSites() {
  const { sites } = await api.storage.local.get('sites');
  return sites !== null && typeof sites === 'object' ? sites : {};
}

export async function getSite(host) {
  if (!host) return null;
  const sites = await getSites();
  return Object.hasOwn(sites, host) ? sanitizeSettings(sites[host]) : null;
}

export async function rememberSite(host, settings) {
  if (!host || isNeutral(settings)) return;
  const sites = await getSites();
  delete sites[host]; // re-insert so the most recent site is last
  sites[host] = sanitizeSettings(settings);
  const hosts = Object.keys(sites);
  for (const old of hosts.slice(0, Math.max(0, hosts.length - MAX_SITES))) delete sites[old];
  await api.storage.local.set({ sites });
}

export async function clearSites() {
  await api.storage.local.remove('sites');
}
