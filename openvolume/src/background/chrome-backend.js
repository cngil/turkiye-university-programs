// Chrome / Edge / Brave / Opera backend. Two engines:
//  - page:    routes the page's media elements (keeps fullscreen working)
//  - capture: chrome.tabCapture + an offscreen document (works on every site,
//             but Chrome limits fullscreen while a tab is captured)
// In "auto" mode the page engine is tried first and capture is the fallback.
import { EngineError } from '../shared/errors.js';
import { isNeutral } from '../shared/settings.js';
import { getPrefs } from '../shared/storage.js';
import { applyPage, forgetTab, neutralizePage, probePage } from './page-host.js';

const OFFSCREEN_PATH = 'offscreen/offscreen.html';
const OFFSCREEN_URL = chrome.runtime.getURL(OFFSCREEN_PATH);

let creating = null;

async function hasOffscreen() {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [OFFSCREEN_URL] });
  return contexts.length > 0;
}

async function ensureOffscreen() {
  if (await hasOffscreen()) return;
  creating ??= chrome.offscreen
    .createDocument({
      url: OFFSCREEN_PATH,
      reasons: ['USER_MEDIA'],
      justification: 'Processes the audio of the tab you chose so its volume can be changed.',
    })
    .finally(() => {
      creating = null;
    });
  await creating;
}

async function offscreen(command, payload = {}) {
  if (!(await hasOffscreen())) return null;
  return chrome.runtime.sendMessage({ type: `ov-offscreen:${command}`, ...payload });
}

async function capturedTabs() {
  const status = await offscreen('status');
  return new Set(Array.isArray(status?.tabs) ? status.tabs : []);
}

async function closeOffscreenIfIdle() {
  if ((await hasOffscreen()) && (await capturedTabs()).size === 0) {
    await chrome.offscreen.closeDocument().catch(() => {});
  }
}

function captureError(error) {
  const message = String(error?.message ?? error);
  if (/active stream/i.test(message)) return new EngineError('busy', message);
  if (/chrome pages|cannot be captured|webstore|extensions gallery/i.test(message)) return new EngineError('restricted', message);
  if (/invoked|activeTab|permission/i.test(message)) return new EngineError('no-access', message);
  return new EngineError('capture-failed', message);
}

async function startCapture(tabId, settings) {
  let streamId;
  try {
    streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
  } catch (error) {
    throw captureError(error);
  }
  await ensureOffscreen();
  const result = await offscreen('start', { tabId, streamId, settings, neutral: isNeutral(settings) });
  if (!result?.ok) throw new EngineError('capture-failed', result?.error);
}

export const chromeBackend = {
  init({ engineEnded }) {
    chrome.runtime.onMessage.addListener((message, sender) => {
      if (sender.id !== chrome.runtime.id || sender.url !== OFFSCREEN_URL) return false;
      if (message?.type === 'ov:capture-ended' && Number.isInteger(message.tabId)) {
        engineEnded(message.tabId, 'capture').then(closeOffscreenIfIdle);
      }
      return false;
    });
  },

  async apply(tabId, record) {
    const { settings } = record;
    const neutral = isNeutral(settings);

    // Already capturing this tab: just update the running chain. When it becomes
    // neutral the offscreen document stops the capture after a short delay.
    const update = await offscreen('update', { tabId, settings, neutral });
    if (update?.ok) return { engine: 'capture', info: null };

    if (neutral) {
      if (record.engine === 'page') await applyPage(tabId, settings).catch(() => {});
      return { engine: null, info: null };
    }

    const prefs = await getPrefs();
    if (prefs.engine === 'auto' && !record.forceCapture) {
      let info = null;
      try {
        info = await applyPage(tabId, settings);
      } catch {
        // Scripting not allowed here; tab capture may still work.
      }
      if (info && info.boosted > 0 && !info.blocked) return { engine: 'page', info };
      if (info) await neutralizePage(tabId);
    }

    await startCapture(tabId, settings);
    return { engine: 'capture', info: null };
  },

  // info object = page engine alive, null = alive without details, false = gone.
  async probe(tabId, record) {
    if (record.engine === 'capture') return (await capturedTabs()).has(tabId) ? null : false;
    return (await probePage(tabId)) ?? false;
  },

  async release(tabId, record, { closed = false } = {}) {
    if (closed) forgetTab(tabId);
    if (await offscreen('stop', { tabId })) await closeOffscreenIfIdle();
    if (record.engine === 'page' && !closed) await neutralizePage(tabId);
  },

  navigated(tabId) {
    forgetTab(tabId);
  },
};
