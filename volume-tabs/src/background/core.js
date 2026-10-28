// Browser-independent background logic: per-tab state, messaging with the popup,
// keyboard shortcuts and the toolbar badge. The actual audio work is done by a
// backend (chrome-backend.js or firefox-backend.js).
import { api } from '../shared/api.js';
import { NEUTRAL, STEP_PERCENT, clampPercent, isNeutral, levelOf, sanitizeSettings, siteKey } from '../shared/settings.js';
import { getPrefs, rememberSite } from '../shared/storage.js';

const EXT_ORIGIN = api.runtime.getURL('');
const ENGINES = new Set(['page', 'capture']);
const BADGE_COLORS = { normal: '#16a34a', boost: '#d97706', high: '#dc2626' };

const recordKey = (tabId) => `tab:${tabId}`;
const isTabId = (v) => Number.isInteger(v) && v >= 0;

// Per-tab state lives in storage.session: survives service-worker restarts,
// cleared when the browser closes, never written to disk.
async function loadRecord(tabId) {
  const key = recordKey(tabId);
  const stored = (await api.storage.session.get(key))[key];
  return {
    settings: sanitizeSettings(stored?.settings),
    engine: ENGINES.has(stored?.engine) ? stored.engine : null,
    forceCapture: stored?.forceCapture === true,
  };
}

async function saveRecord(tabId, record) {
  const { settings, engine, forceCapture } = record;
  if (isNeutral(settings) && !engine && !forceCapture) {
    await api.storage.session.remove(recordKey(tabId));
  } else {
    await api.storage.session.set({ [recordKey(tabId)]: { settings, engine, forceCapture } });
  }
}

async function updateBadge(tabId, record) {
  const on = record.engine !== null && !isNeutral(record.settings);
  try {
    await api.action.setBadgeText({ tabId, text: on ? String(record.settings.percent) : '' });
    if (on) {
      await api.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLORS[levelOf(record.settings.percent)] });
      await api.action.setBadgeTextColor?.({ tabId, color: '#ffffff' });
    }
  } catch {
    // The tab was closed in the meantime.
  }
}

function view(record, extra = {}) {
  return { ok: true, settings: record.settings, engine: record.engine, forceCapture: record.forceCapture, info: null, error: null, ...extra };
}

export function startBackground(backend) {
  // One operation per tab at a time, so fast slider moves never overlap.
  const queues = new Map();
  function serial(tabId, job) {
    const run = (queues.get(tabId) ?? Promise.resolve()).catch(() => {}).then(job);
    queues.set(tabId, run);
    run.finally(() => queues.get(tabId) === run && queues.delete(tabId)).catch(() => {});
    return run;
  }

  // Applies `record` and persists it only if the backend accepted it.
  async function commit(tabId, record) {
    try {
      const { engine, info } = await backend.apply(tabId, record);
      record.engine = engine;
      await saveRecord(tabId, record);
      await updateBadge(tabId, record);
      return view(record, { info: info ?? null });
    } catch (error) {
      const previous = await loadRecord(tabId);
      return view(previous, { ok: false, error: error?.code ?? 'error', detail: String(error?.message ?? error) });
    }
  }

  async function engineEnded(tabId, engine) {
    await serial(tabId, async () => {
      const record = await loadRecord(tabId);
      if (record.engine !== engine) return;
      record.engine = null;
      await saveRecord(tabId, record);
      await updateBadge(tabId, record);
    });
  }

  const handlers = {
    // The popup opened: report the tab's state. If the tab should be boosted but
    // is not (e.g. it was reloaded), opening the popup grants access again, so re-apply.
    'vt:get': ({ tabId }) =>
      serial(tabId, async () => {
        const record = await loadRecord(tabId);
        if (!isNeutral(record.settings) && record.engine === null) return commit(tabId, record);
        const info = record.engine ? await backend.probe(tabId, record) : null;
        if (record.engine && info === false) {
          // The engine is gone (navigation, crash): try again.
          record.engine = null;
          return commit(tabId, record);
        }
        return view(record, { info: info || null });
      }),

    'vt:set': ({ tabId, settings, forceCapture }) =>
      serial(tabId, async () => {
        const record = await loadRecord(tabId);
        record.settings = sanitizeSettings(settings, record.settings);
        if (typeof forceCapture === 'boolean' && forceCapture !== record.forceCapture) {
          // Switching engines: stop the current one first.
          await backend.release(tabId, record);
          record.engine = null;
          record.forceCapture = forceCapture;
        }
        return commit(tabId, record);
      }),

    'vt:reset': ({ tabId }) =>
      serial(tabId, async () => {
        const record = await loadRecord(tabId);
        await backend.release(tabId, record);
        const fresh = { settings: { ...NEUTRAL }, engine: null, forceCapture: false };
        await saveRecord(tabId, fresh);
        await updateBadge(tabId, fresh);
        return view(fresh);
      }),

    // Used by the popup's tab list.
    'vt:list': async () => {
      const all = await api.storage.session.get(null);
      const tabs = {};
      for (const [key, value] of Object.entries(all)) {
        const id = Number(key.slice(4));
        if (key.startsWith('tab:') && isTabId(id) && ENGINES.has(value?.engine)) tabs[id] = sanitizeSettings(value.settings);
      }
      return { ok: true, tabs };
    },
  };

  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Only our own extension pages (the popup) may control the audio.
    if (sender.id !== api.runtime.id || !String(sender.url ?? '').startsWith(EXT_ORIGIN)) return false;
    const handler = handlers[message?.type];
    if (!handler) return false;
    if (message.type !== 'vt:list' && !isTabId(message.tabId)) {
      sendResponse({ ok: false, error: 'error', detail: 'invalid tab' });
      return false;
    }
    Promise.resolve()
      .then(() => handler(message))
      .then(sendResponse, (error) => sendResponse({ ok: false, error: error?.code ?? 'error', detail: String(error?.message ?? error) }));
    return true;
  });

  api.commands?.onCommand.addListener(async (command, tab) => {
    if (!['volume-up', 'volume-down', 'volume-reset'].includes(command)) return;
    tab ??= (await api.tabs.query({ active: true, lastFocusedWindow: true }))[0];
    if (!isTabId(tab?.id)) return;
    if (command === 'volume-reset') {
      await handlers['vt:reset']({ tabId: tab.id });
      return;
    }
    await serial(tab.id, async () => {
      const record = await loadRecord(tab.id);
      const delta = command === 'volume-up' ? STEP_PERCENT : -STEP_PERCENT;
      record.settings = { ...record.settings, percent: clampPercent(record.settings.percent + delta) };
      const result = await commit(tab.id, record);
      const prefs = await getPrefs();
      if (result.ok && prefs.rememberSites) await rememberSite(siteKey(tab.url), result.settings);
    });
  });

  api.tabs.onRemoved.addListener((tabId) => {
    serial(tabId, async () => {
      await backend.release(tabId, await loadRecord(tabId), { closed: true });
      await api.storage.session.remove(recordKey(tabId));
    });
  });

  api.tabs.onUpdated.addListener((tabId, change) => {
    if (change.status !== 'loading' && change.status !== 'complete') return;
    serial(tabId, async () => {
      const record = await loadRecord(tabId);
      if (change.status === 'loading') {
        backend.navigated?.(tabId);
        // A new document drops the page engine; tab capture keeps running.
        if (record.engine === 'page') {
          record.engine = null;
          await saveRecord(tabId, record);
        }
        await updateBadge(tabId, record);
      } else if (record.engine === null && !isNeutral(record.settings)) {
        // Best effort: works while the browser still grants us access to the tab.
        await commit(tabId, record);
      } else {
        await updateBadge(tabId, record);
      }
    });
  });

  backend.init?.({ engineEnded });
}
