import { api, IS_FIREFOX } from '../shared/api.js';
import {
  MAX_PERCENT,
  NEUTRAL,
  clampPercent,
  isNeutral,
  isRestrictedUrl,
  levelOf,
  sameSettings,
  sanitizeSettings,
  siteKey,
} from '../shared/settings.js';
import { clearSites, getPrefs, getSite, rememberSite, setPrefs } from '../shared/storage.js';

const SOURCE_URL = 'https://github.com/cngil/volume-tabs';
const SEND_INTERVAL = 40; // ms between live updates while dragging
const ALL_SITES = { origins: ['<all_urls>'] };

const $ = (id) => document.getElementById(id);
const t = (key, subs) => api.i18n.getMessage(key, subs) || key;

const ui = {
  slider: $('slider'),
  input: $('percent-input'),
  mute: $('mute'),
  reset: $('reset'),
  restore: $('restore'),
  restoreLabel: $('restore-label'),
  modeChip: $('mode-chip'),
  status: $('status'),
  statusText: $('status-text'),
  switchEngine: $('switch-engine'),
  foot: $('foot'),
  footNote: $('foot-note'),
  favicon: $('current-favicon'),
  title: $('current-title'),
  host: $('current-host'),
  tabList: $('tab-list'),
  noTabs: $('no-tabs'),
  presets: [...document.querySelectorAll('[data-preset]')],
  effects: [...document.querySelectorAll('[data-effect]')],
};

const state = {
  tab: null,
  host: null,
  restricted: false,
  settings: { ...NEUTRAL },
  engine: null,
  forceCapture: false,
  info: null,
  error: null,
  saved: null,
  prefs: null,
  seq: 0,
  lastAudible: 100,
};

// ---------------------------------------------------------------- helpers

function localize() {
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-title]')) {
    el.title = t(el.dataset.i18nTitle);
    el.setAttribute('aria-label', el.title);
  }
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  document.documentElement.lang = api.i18n.getUILanguage();
}

function send(message) {
  return api.runtime.sendMessage(message).catch((error) => ({ ok: false, error: 'error', detail: String(error) }));
}

function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (el.hidden = true), 1800);
}

function openTab(url) {
  api.tabs.create({ url });
  window.close();
}

// Favicons: Chrome serves cached ones from its own _favicon endpoint (no network);
// Firefox gives us the tab's favicon URL. Falls back to the first letter.
function fillFavicon(holder, tab) {
  holder.replaceChildren();
  const letter = (siteKey(tab.url) ?? tab.title ?? '?').replace(/^www\./, '').charAt(0) || '?';
  let src = null;
  if (!IS_FIREFOX && /^https?:/.test(tab.url ?? '')) {
    src = `${api.runtime.getURL('/_favicon/')}?pageUrl=${encodeURIComponent(tab.url)}&size=32`;
  } else if (/^(data:image\/|https:)/.test(tab.favIconUrl ?? '')) {
    src = tab.favIconUrl;
  }
  if (!src) {
    holder.textContent = letter;
    return;
  }
  const img = document.createElement('img');
  img.alt = '';
  img.referrerPolicy = 'no-referrer';
  img.addEventListener('error', () => (holder.textContent = letter), { once: true });
  img.src = src;
  holder.append(img);
}

// ---------------------------------------------------------------- rendering

// The readout is exactly as wide as its digits, so the % sign always follows the number.
const readoutMeasure = document.createElement('span');
readoutMeasure.className = 'readout-measure';
readoutMeasure.setAttribute('aria-hidden', 'true');
ui.input.after(readoutMeasure);

function fitReadout() {
  readoutMeasure.textContent = ui.input.value || '0';
  ui.input.style.width = `${Math.ceil(readoutMeasure.getBoundingClientRect().width) + 1}px`;
}

function render() {
  const { settings, restricted } = state;
  const { percent } = settings;
  const level = levelOf(percent);

  document.body.dataset.level = level;
  document.body.classList.toggle('muted', percent === 0);
  ui.slider.value = String(percent);
  ui.slider.style.setProperty('--pos', `${(percent / MAX_PERCENT) * 100}%`);
  if (document.activeElement !== ui.input) ui.input.value = String(percent);
  fitReadout();
  ui.mute.title = t(percent === 0 ? 'unmute' : 'mute');
  ui.mute.setAttribute('aria-label', ui.mute.title);

  for (const button of ui.presets) button.classList.toggle('active', Number(button.dataset.preset) === percent);
  for (const button of ui.effects) {
    const checked = settings.effect === button.dataset.effect;
    button.setAttribute('aria-checked', String(checked));
    button.tabIndex = checked ? 0 : -1;
  }

  for (const el of [ui.slider, ui.input, ui.mute, ui.reset, ...ui.presets, ...ui.effects]) el.disabled = restricted;

  const showRestore = !restricted && state.prefs?.rememberSites && state.saved && !sameSettings(state.saved, settings);
  ui.restore.hidden = !showRestore;
  if (showRestore) ui.restoreLabel.textContent = t('restore', [String(state.saved.percent)]);

  ui.modeChip.hidden = !state.engine;
  if (state.engine) ui.modeChip.textContent = t(state.engine === 'capture' ? 'modeCapture' : 'modePage');

  renderStatus();
}

const ERROR_TEXT = {
  restricted: 'statusRestricted',
  'no-access': 'statusNoAccess',
  busy: 'statusBusy',
  'capture-failed': 'statusCaptureFailed',
};

// Problems show in the card; engine notes and the engine switch sit quietly at the bottom.
function renderStatus() {
  let key = null;
  let tone = '';
  let note = null;
  let switchTo = null;

  if (state.restricted) {
    key = 'statusRestricted';
  } else if (state.error) {
    key = ERROR_TEXT[state.error] ?? 'statusError';
    tone = 'error';
  } else if (state.engine === 'page' && !isNeutral(state.settings)) {
    const info = state.info;
    if (info?.blocked) {
      key = 'statusBlocked';
      tone = 'warn';
    } else if (info && info.boosted === 0 && info.unsupported > 0) {
      key = 'statusUnsupported';
      tone = 'warn';
    } else if (info && info.media === 0) {
      key = 'statusNoMedia';
    }
    if (!IS_FIREFOX) switchTo = 'capture';
  } else if (state.engine === 'capture') {
    note = 'statusFullscreen';
    if (state.forceCapture && state.prefs?.engine === 'auto') switchTo = 'page';
  }

  ui.status.hidden = !key;
  ui.status.className = `status ${tone}`.trim();
  ui.statusText.textContent = key ? t(key) : '';

  ui.foot.hidden = !note && !switchTo;
  ui.footNote.hidden = !note;
  ui.footNote.textContent = note ? t(note) : '';
  ui.switchEngine.hidden = !switchTo;
  if (switchTo) {
    ui.switchEngine.textContent = t(switchTo === 'capture' ? 'useCapture' : 'usePage');
    ui.switchEngine.dataset.target = switchTo;
  }
}

function applyResponse(response) {
  if (!response) return;
  state.settings = sanitizeSettings(response.settings);
  state.engine = response.engine ?? null;
  state.forceCapture = response.forceCapture === true;
  state.info = response.info ?? null;
  state.error = response.ok ? null : response.error ?? 'error';
  if (state.settings.percent > 0) state.lastAudible = state.settings.percent;
  render();
}

// ---------------------------------------------------------------- applying

let pending = null;
let lastSend = 0;

async function push(extra = {}) {
  if (!state.tab || state.restricted) return;
  const seq = ++state.seq;
  const response = await send({ type: 'vt:set', tabId: state.tab.id, settings: state.settings, ...extra });
  // Ignore answers to requests that a newer one has already replaced.
  if (seq === state.seq) applyResponse(response);
}

// While dragging, send at most one update every SEND_INTERVAL ms (plus the final value).
function pushThrottled() {
  if (pending) return;
  const wait = Math.max(0, SEND_INTERVAL - (performance.now() - lastSend));
  pending = setTimeout(() => {
    pending = null;
    lastSend = performance.now();
    push();
  }, wait);
}

function remember() {
  if (state.prefs?.rememberSites && state.host && !isNeutral(state.settings)) {
    rememberSite(state.host, state.settings).then(() => {
      state.saved = { ...state.settings };
      render();
    });
  }
}

function change(patch, { live = false } = {}) {
  state.settings = sanitizeSettings(patch, state.settings);
  if (state.settings.percent > 0) state.lastAudible = state.settings.percent;
  render();
  if (live) {
    pushThrottled();
  } else {
    clearTimeout(pending);
    pending = null;
    push();
    remember();
  }
}

// ---------------------------------------------------------------- tab list

async function renderTabs() {
  const [audible, list] = await Promise.all([api.tabs.query({ audible: true }), send({ type: 'vt:list' })]);
  const boosted = list?.tabs ?? {};
  const ids = new Set([...audible.map((tab) => tab.id), ...Object.keys(boosted).map(Number)]);
  ids.delete(state.tab?.id);

  const tabs = (await Promise.all([...ids].map((id) => api.tabs.get(id).catch(() => null)))).filter(Boolean);
  tabs.sort((a, b) => Number(b.audible) - Number(a.audible) || (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));

  ui.tabList.replaceChildren(
    ...tabs.map((tab) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.title = t('switchTo');

      const icon = document.createElement('span');
      icon.className = 'favicon';
      icon.setAttribute('aria-hidden', 'true');
      fillFavicon(icon, tab);
      const text = document.createElement('span');
      text.className = 'tab-text';
      const title = document.createElement('span');
      title.className = 'tab-title';
      title.textContent = tab.title || tab.url || '';
      const host = document.createElement('span');
      host.className = 'tab-host';
      host.textContent = siteKey(tab.url) ?? '';
      text.append(title, host);
      button.append(icon, text);

      const settings = boosted[tab.id];
      if (settings && !isNeutral(settings)) {
        const badge = document.createElement('span');
        badge.className = `tab-badge ${levelOf(settings.percent)}`;
        badge.textContent = `${settings.percent}%`;
        button.append(badge);
      }
      const flag = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      const muted = tab.mutedInfo?.muted === true;
      use.setAttribute('href', muted ? '#i-mute' : '#i-volume-tab');
      flag.classList.add('tab-flag');
      if (tab.audible && !muted) flag.classList.add('playing');
      if (muted) flag.setAttribute('aria-label', t('tabMuted'));
      flag.append(use);
      button.append(flag);

      button.addEventListener('click', async () => {
        await api.tabs.update(tab.id, { active: true });
        await api.windows.update(tab.windowId, { focused: true });
        window.close();
      });
      li.append(button);
      return li;
    }),
  );
  ui.noTabs.hidden = tabs.length > 0;
}

let tabsTimer = null;
function scheduleTabs() {
  clearTimeout(tabsTimer);
  tabsTimer = setTimeout(renderTabs, 150);
}

// ---------------------------------------------------------------- settings view

const darkQuery = matchMedia('(prefers-color-scheme: dark)');

// Two themes. Until the user toggles, "auto" follows the system.
function effectiveTheme() {
  const theme = state.prefs?.theme;
  return theme === 'light' || theme === 'dark' ? theme : darkQuery.matches ? 'dark' : 'light';
}

function applyTheme() {
  const theme = state.prefs?.theme;
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
  else delete root.dataset.theme;
  root.dataset.effectiveTheme = effectiveTheme();
  try {
    localStorage.setItem('vt-theme', theme ?? 'auto');
  } catch {
    // ignore
  }
  const toggle = $('theme-toggle');
  toggle.title = t(effectiveTheme() === 'dark' ? 'themeToLight' : 'themeToDark');
  toggle.setAttribute('aria-label', toggle.title);
}

async function renderSettings() {
  const { prefs } = state;
  applyTheme();
  $('engine-group').hidden = IS_FIREFOX;
  for (const radio of document.querySelectorAll('input[name="engine"]')) radio.checked = radio.value === prefs.engine;
  $('pref-remember').checked = prefs.rememberSites;
  $('pref-autorestore').checked = prefs.autoRestore;
  $('pref-autorestore').disabled = !prefs.rememberSites;
  $('access-group').hidden = !IS_FIREFOX;
  if (IS_FIREFOX) $('pref-allsites').checked = await api.permissions.contains(ALL_SITES);
  $('version').textContent = t('version', [api.runtime.getManifest().version]);
}

async function updatePrefs(patch) {
  state.prefs = await setPrefs(patch);
  await renderSettings();
  render();
}

function wireSettings() {
  $('open-settings').addEventListener('click', () => {
    $('main-view').hidden = true;
    $('settings-view').hidden = false;
    $('close-settings').focus();
  });
  $('close-settings').addEventListener('click', () => {
    $('settings-view').hidden = true;
    $('main-view').hidden = false;
    ui.slider.focus();
  });
  $('theme-toggle').addEventListener('click', () => updatePrefs({ theme: effectiveTheme() === 'dark' ? 'light' : 'dark' }));
  darkQuery.addEventListener('change', applyTheme);
  for (const radio of document.querySelectorAll('input[name="engine"]')) {
    radio.addEventListener('change', () => radio.checked && updatePrefs({ engine: radio.value }));
  }
  $('pref-remember').addEventListener('change', (e) => updatePrefs({ rememberSites: e.target.checked }));
  $('pref-autorestore').addEventListener('change', (e) => updatePrefs({ autoRestore: e.target.checked }));
  $('clear-sites').addEventListener('click', async () => {
    await clearSites();
    state.saved = null;
    render();
    toast(t('clearedSites'));
  });
  // permissions.request must run directly in the click handler (user gesture).
  $('pref-allsites').addEventListener('change', (e) => {
    const request = e.target.checked ? api.permissions.request(ALL_SITES) : api.permissions.remove(ALL_SITES);
    request.finally(renderSettings);
  });
  $('edit-shortcuts').addEventListener('click', () => {
    if (!IS_FIREFOX) return openTab('chrome://extensions/shortcuts');
    if (api.commands.openShortcutSettings) return api.commands.openShortcutSettings();
    $('shortcuts-firefox').hidden = false;
  });
  $('source-link').addEventListener('click', () => openTab(SOURCE_URL));
}

// ---------------------------------------------------------------- controls

function wireControls() {
  ui.slider.addEventListener('input', () => change({ percent: Number(ui.slider.value) }, { live: true }));
  ui.slider.addEventListener('change', () => change({ percent: Number(ui.slider.value) }));

  ui.input.addEventListener('focus', () => ui.input.select());
  ui.input.addEventListener('input', () => {
    ui.input.value = ui.input.value.replace(/\D/g, '');
    fitReadout();
  });
  ui.input.addEventListener('change', () => change({ percent: clampPercent(ui.input.value || 0) }));
  ui.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      ui.input.blur();
      ui.slider.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      change({ percent: state.settings.percent + (e.key === 'ArrowUp' ? step : -step) });
      ui.input.value = String(state.settings.percent);
      fitReadout();
    }
  });
  ui.input.addEventListener('blur', () => {
    ui.input.value = String(state.settings.percent);
    fitReadout();
  });

  // Mouse wheel anywhere on the card: 5% steps, 1% with Shift.
  $('control-card').addEventListener(
    'wheel',
    (e) => {
      if (state.restricted || !e.deltaY) return;
      e.preventDefault();
      const step = e.shiftKey ? 1 : 5;
      change({ percent: state.settings.percent + (e.deltaY < 0 ? step : -step) }, { live: true });
      clearTimeout(wireControls.wheelEnd);
      wireControls.wheelEnd = setTimeout(remember, 400);
    },
    { passive: false },
  );

  ui.mute.addEventListener('click', () => change({ percent: state.settings.percent === 0 ? state.lastAudible || 100 : 0 }));
  for (const button of ui.presets) button.addEventListener('click', () => change({ percent: Number(button.dataset.preset) }));
  for (const button of ui.effects) button.addEventListener('click', () => change({ effect: button.dataset.effect }));
  // Radio group keyboard behaviour: arrow keys move the selection.
  document.querySelector('.effects').addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const index = ui.effects.findIndex((b) => b.dataset.effect === state.settings.effect);
    const next = ui.effects[(index + step + ui.effects.length) % ui.effects.length];
    change({ effect: next.dataset.effect });
    next.focus();
  });

  ui.reset.addEventListener('click', async () => {
    if (!state.tab) return;
    clearTimeout(pending);
    pending = null;
    const seq = ++state.seq;
    const response = await send({ type: 'vt:reset', tabId: state.tab.id });
    if (seq === state.seq) applyResponse(response);
  });

  ui.restore.addEventListener('click', () => state.saved && change({ ...state.saved }));

  ui.switchEngine.addEventListener('click', () => push({ forceCapture: ui.switchEngine.dataset.target === 'capture' }));

  document.addEventListener('keydown', (e) => {
    if (e.target === ui.input || e.altKey || e.ctrlKey || e.metaKey || !$('settings-view').hidden) return;
    if (e.key === 'm' || e.key === 'M') ui.mute.click();
    else if (e.key === '0') ui.reset.click();
  });
}

// ---------------------------------------------------------------- startup

async function init() {
  localize();
  wireControls();
  wireSettings();

  const [prefs, [tab]] = await Promise.all([getPrefs(), api.tabs.query({ active: true, currentWindow: true })]);
  state.prefs = prefs;
  state.tab = tab ?? null;
  renderSettings();

  if (tab) {
    state.host = siteKey(tab.url);
    state.restricted = isRestrictedUrl(tab.url);
    ui.title.textContent = tab.title || tab.url || '';
    ui.host.textContent = state.host ?? t('thisTab');
    fillFavicon(ui.favicon, tab);
    state.saved = await getSite(state.host);
    if (!state.restricted) applyResponse(await send({ type: 'vt:get', tabId: tab.id }));

    const untouched = isNeutral(state.settings) && !state.engine && !state.error;
    if (!state.restricted && prefs.rememberSites && prefs.autoRestore && state.saved && untouched) {
      state.settings = { ...state.saved };
      await push();
    }
  } else {
    state.restricted = true;
  }
  render();
  ui.slider.focus();

  renderTabs();
  api.tabs.onUpdated.addListener((_id, change) => {
    if ('audible' in change || 'title' in change || 'mutedInfo' in change) scheduleTabs();
  });
  api.tabs.onRemoved.addListener(scheduleTabs);
}

init();
