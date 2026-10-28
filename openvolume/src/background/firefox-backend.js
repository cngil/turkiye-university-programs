// Firefox backend. Firefox has no tabCapture API, so only the page engine is used.
import { isNeutral } from '../shared/settings.js';
import { applyPage, forgetTab, neutralizePage, probePage } from './page-host.js';

export const firefoxBackend = {
  async apply(tabId, record) {
    const neutral = isNeutral(record.settings);
    if (neutral && record.engine === null) return { engine: null, info: null };
    const info = await applyPage(tabId, record.settings);
    return { engine: neutral ? null : 'page', info };
  },

  async probe(tabId) {
    return (await probePage(tabId)) ?? false;
  },

  async release(tabId, record, { closed = false } = {}) {
    forgetTab(tabId);
    if (record.engine === 'page' && !closed) await neutralizePage(tabId);
  },

  navigated(tabId) {
    forgetTab(tabId);
  },
};
