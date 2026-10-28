// Background side of the "page audio" engine: injects content/page-engine.js
// with the scripting API (only into the tab the user is controlling) and talks
// to it through executeScript return values. No persistent content scripts.
import { api } from '../shared/api.js';
import { EngineError } from '../shared/errors.js';
import { NEUTRAL, isNeutral } from '../shared/settings.js';

const FILES = ['shared/audio-chain.js', 'content/page-engine.js'];

// Tabs where injecting into all frames failed (usually a cross-origin iframe we
// have no access to); for those only the top frame is used until it navigates.
const topFrameOnly = new Set();

export function forgetTab(tabId) {
  topFrameOnly.delete(tabId);
}

function classify(error) {
  const message = String(error?.message ?? error);
  if (/chrome:\/\/|extensions gallery|cannot be scripted|restricted|about:/i.test(message)) return 'restricted';
  return 'no-access';
}

async function exec(tabId, details) {
  if (!topFrameOnly.has(tabId)) {
    try {
      return await api.scripting.executeScript({ ...details, target: { tabId, allFrames: true } });
    } catch {
      topFrameOnly.add(tabId);
    }
  }
  try {
    return await api.scripting.executeScript({ ...details, target: { tabId, frameIds: [0] } });
  } catch (error) {
    throw new EngineError(classify(error), error?.message);
  }
}

const usable = (r) => r && !r.error && r.result !== null && typeof r.result === 'object';
const missing = (r) => r && !r.error && (r.result === null || r.result === undefined);
const count = (v) => (Number.isFinite(v) && v > 0 ? v : 0);

// Sums the per-frame stats into one object (null if the engine is not loaded anywhere).
function aggregate(results) {
  const info = { frames: 0, media: 0, boosted: 0, unsupported: 0, playing: 0, blocked: false };
  for (const r of results ?? []) {
    if (!usable(r)) continue;
    const v = r.result;
    info.frames++;
    info.media += count(v.media);
    info.boosted += count(v.boosted);
    info.unsupported += count(v.unsupported);
    info.playing += count(v.playing);
    info.blocked ||= v.blocked === true;
  }
  return info.frames > 0 ? info : null;
}

const setInPage = (settings, neutral) => (globalThis.__volumeTabsPage ? globalThis.__volumeTabsPage.set(settings, neutral) : null);
const statsInPage = () => (globalThis.__volumeTabsPage ? globalThis.__volumeTabsPage.stats() : null);

export async function applyPage(tabId, settings) {
  const details = { func: setInPage, args: [settings, isNeutral(settings)] };
  let results = await exec(tabId, details);
  if (!results?.length || results.some(missing)) {
    await exec(tabId, { files: FILES });
    results = await exec(tabId, details);
  }
  const info = aggregate(results);
  if (!info) throw new EngineError('no-access');
  return info;
}

// Returns stats without injecting anything (null when the engine is not loaded).
export async function probePage(tabId) {
  try {
    return aggregate(await exec(tabId, { func: statsInPage }));
  } catch {
    return null;
  }
}

// Sets the page back to neutral; elements stay routed but are untouched.
export async function neutralizePage(tabId) {
  try {
    await exec(tabId, { func: setInPage, args: [NEUTRAL, true] });
  } catch {
    // Tab gone or no longer accessible: nothing left to undo.
  }
}
