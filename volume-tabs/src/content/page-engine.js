// "Page audio" engine. Injected on demand (activeTab + scripting) into the tab the
// user is controlling. It routes the page's <audio>/<video> elements through a
// Web Audio chain. It runs in the extension's isolated world, so page scripts
// cannot see or call it, and it never reads or sends page content anywhere.
(() => {
  'use strict';
  if (globalThis.__volumeTabsPage || !globalThis.VolumeTabsAudio) return;

  const DEEP_SCAN_INTERVAL = 2000;
  const RESUME_TIMEOUT = 400;
  const MEDIA_EVENTS = ['play', 'playing', 'loadedmetadata'];
  const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchend'];

  let settings = null;
  let neutral = true;
  let ctx = null;
  let chain = null;
  let listening = false;
  let unlockArmed = false;
  let shadowMedia = [];
  let lastDeepScan = 0;
  const routed = new WeakSet();
  const failed = new WeakMap(); // element -> currentSrc when routing failed

  const isMedia = (node) => node !== null && typeof node === 'object' && (node.tagName === 'VIDEO' || node.tagName === 'AUDIO');

  // Media inside open shadow roots is not reachable with querySelectorAll on the
  // document, so walk the tree now and then (it is too slow to do on every call).
  function deepScan() {
    const found = [];
    const visit = (root) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const shadow = node.openOrClosedShadowRoot ?? node.shadowRoot; // Firefox can see closed roots
        if (shadow) {
          found.push(...shadow.querySelectorAll('audio, video'));
          visit(shadow);
        }
      }
    };
    if (document.documentElement) visit(document.documentElement);
    shadowMedia = found;
    lastDeepScan = Date.now();
  }

  function collect() {
    if (Date.now() - lastDeepScan > DEEP_SCAN_INTERVAL) deepScan();
    return [...document.querySelectorAll('audio, video'), ...shadowMedia.filter((el) => el.isConnected)];
  }

  // Routing cross-origin media without CORS (or DRM media) through Web Audio
  // would make it silent, so such elements are left untouched.
  // Returns true (safe), false (unsafe) or null (not loaded yet, decide later).
  function canRoute(el) {
    if (el.mediaKeys) return false;
    if (failed.has(el) && failed.get(el) === el.currentSrc) return false;
    if (el.srcObject) return true;
    const src = el.currentSrc;
    if (!src) return null;
    let url;
    try {
      url = new URL(src, document.baseURI);
    } catch {
      return false;
    }
    if (url.protocol === 'blob:' || url.protocol === 'data:') return true;
    if (url.origin === location.origin) return true;
    return el.crossOrigin === 'anonymous' || el.crossOrigin === 'use-credentials';
  }

  function route(el) {
    if (routed.has(el) || canRoute(el) !== true) return;
    try {
      ctx.createMediaElementSource(el).connect(chain.input);
      routed.add(el);
    } catch {
      // Already owned by another AudioContext (e.g. the page's own).
      failed.set(el, el.currentSrc);
    }
  }

  const ready = () => !neutral && ctx !== null && ctx.state === 'running';

  function scan() {
    if (!ready()) return;
    for (const el of collect()) route(el);
  }

  function onMediaEvent(event) {
    if (ready() && isMedia(event.target)) route(event.target);
  }

  function listen() {
    if (listening) return;
    listening = true;
    for (const type of MEDIA_EVENTS) window.addEventListener(type, onMediaEvent, true);
  }

  // Browsers only let an AudioContext start after the user interacted with the page.
  function armUnlock() {
    if (unlockArmed) return;
    unlockArmed = true;
    const unlock = () => {
      ctx.resume().then(() => {
        if (ctx.state !== 'running') return;
        for (const type of UNLOCK_EVENTS) window.removeEventListener(type, unlock, true);
        unlockArmed = false;
        scan();
      }, () => {});
    };
    for (const type of UNLOCK_EVENTS) window.addEventListener(type, unlock, true);
  }

  async function ensureContext() {
    if (!ctx) {
      ctx = new AudioContext();
      chain = globalThis.VolumeTabsAudio.createChain(ctx);
      chain.apply(settings, true);
    }
    if (ctx.state !== 'running') {
      await Promise.race([ctx.resume().catch(() => {}), new Promise((resolve) => setTimeout(resolve, RESUME_TIMEOUT))]);
    }
    if (ctx.state !== 'running') armUnlock();
  }

  function stats() {
    let media = 0;
    let boosted = 0;
    let unsupported = 0;
    let playing = 0;
    for (const el of collect()) {
      media++;
      if (!el.paused) playing++;
      if (routed.has(el)) boosted++;
      else if (canRoute(el) === false) unsupported++;
    }
    return { media, boosted, unsupported, playing, blocked: !neutral && ctx !== null && ctx.state !== 'running' };
  }

  async function set(next, nextNeutral) {
    settings = next;
    neutral = nextNeutral;
    if (chain) chain.apply(settings);
    if (!neutral) {
      listen();
      await ensureContext();
      scan();
    }
    return stats();
  }

  globalThis.__volumeTabsPage = Object.freeze({ set, stats });
})();
