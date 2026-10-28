// Chrome only. Receives a tab's audio stream (tabCapture), runs it through the
// audio chain and plays it. Capturing a tab mutes it, so this is what you hear.
// The audio never leaves this document: nothing is recorded or stored.
const RELEASE_DELAY = 3000; // stop capturing shortly after the tab is back to neutral

const sessions = new Map();
let ctx = null;

function context() {
  if (!ctx || ctx.state === 'closed') ctx = new AudioContext({ latencyHint: 'interactive' });
  return ctx;
}

function scheduleRelease(tabId, session, neutral) {
  clearTimeout(session.timer);
  session.timer = neutral
    ? setTimeout(() => {
        stop(tabId);
        chrome.runtime.sendMessage({ type: 'ov:capture-ended', tabId }).catch(() => {});
      }, RELEASE_DELAY)
    : null;
}

function stop(tabId) {
  const session = sessions.get(tabId);
  if (!session) return false;
  sessions.delete(tabId);
  clearTimeout(session.timer);
  session.source.disconnect();
  session.chain.disconnect();
  for (const track of session.stream.getTracks()) track.stop();
  return true;
}

async function start({ tabId, streamId, settings, neutral }) {
  stop(tabId);
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } },
    video: false,
  });
  const ac = context();
  if (ac.state !== 'running') await ac.resume();
  const source = ac.createMediaStreamSource(stream);
  const chain = globalThis.OpenVolumeAudio.createChain(ac);
  chain.apply(settings, true);
  source.connect(chain.input);

  const session = { stream, source, chain, timer: null };
  sessions.set(tabId, session);
  for (const track of stream.getAudioTracks()) {
    // Fires when the tab closes or the capture is stopped from outside.
    track.addEventListener('ended', () => {
      if (sessions.get(tabId) !== session) return;
      stop(tabId);
      chrome.runtime.sendMessage({ type: 'ov:capture-ended', tabId }).catch(() => {});
    });
  }
  scheduleRelease(tabId, session, neutral);
  return { ok: true };
}

function update({ tabId, settings, neutral }) {
  const session = sessions.get(tabId);
  if (!session) return { ok: false };
  session.chain.apply(settings);
  scheduleRelease(tabId, session, neutral);
  return { ok: true };
}

const commands = {
  'ov-offscreen:start': start,
  'ov-offscreen:update': update,
  'ov-offscreen:stop': ({ tabId }) => ({ ok: true, stopped: stop(tabId) }),
  'ov-offscreen:status': () => ({ ok: true, tabs: [...sessions.keys()] }),
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const command = commands[message?.type];
  if (!command || sender.id !== chrome.runtime.id) return false;
  Promise.resolve()
    .then(() => command(message))
    .then(sendResponse, (error) => sendResponse({ ok: false, error: String(error?.message ?? error) }));
  return true;
});
