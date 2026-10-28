// The Web Audio processing chain used by both engines:
//   input (volume) -> bass shelf -> voice cut -> voice presence -> [limiter] -> destination
// Classic script (not a module) so it can be injected as a content script too.
(() => {
  'use strict';
  if (globalThis.OpenVolumeAudio) return;

  const BASS = { frequency: 100, gain: 10 };
  const VOICE_CUT = { frequency: 250, Q: 0.9, gain: -3 };
  const VOICE_PRESENCE = { frequency: 2600, Q: 0.7, gain: 8 };
  const LIMITER = { threshold: -3, knee: 0, ratio: 20, attack: 0.002, release: 0.2 };
  const SMOOTHING = 0.015; // seconds; avoids clicks while dragging the slider

  // Filters start flat (0 dB); apply() sets their gain.
  function biquad(ctx, type, { frequency, Q }) {
    const node = ctx.createBiquadFilter();
    node.type = type;
    node.frequency.value = frequency;
    if (Q !== undefined) node.Q.value = Q;
    node.gain.value = 0;
    return node;
  }

  function setParam(param, value, ctx, immediate) {
    if (immediate) {
      param.cancelScheduledValues(ctx.currentTime);
      param.value = value;
    } else {
      param.setTargetAtTime(value, ctx.currentTime, SMOOTHING);
    }
  }

  function createChain(ctx, destination = ctx.destination) {
    const input = ctx.createGain();
    const bass = biquad(ctx, 'lowshelf', BASS);
    const voiceCut = biquad(ctx, 'peaking', VOICE_CUT);
    const voicePresence = biquad(ctx, 'peaking', VOICE_PRESENCE);
    const limiter = ctx.createDynamicsCompressor();
    for (const [key, value] of Object.entries(LIMITER)) limiter[key].value = value;

    input.connect(bass);
    bass.connect(voiceCut);
    voiceCut.connect(voicePresence);
    let limiterOn = null;

    function route(on) {
      if (on === limiterOn) return;
      voicePresence.disconnect();
      limiter.disconnect();
      if (on) {
        voicePresence.connect(limiter);
        limiter.connect(destination);
      } else {
        voicePresence.connect(destination);
      }
      limiterOn = on;
    }

    function apply(settings, immediate = false) {
      setParam(input.gain, settings.percent / 100, ctx, immediate);
      setParam(bass.gain, settings.bass ? BASS.gain : 0, ctx, immediate);
      setParam(voiceCut.gain, settings.voice ? VOICE_CUT.gain : 0, ctx, immediate);
      setParam(voicePresence.gain, settings.voice ? VOICE_PRESENCE.gain : 0, ctx, immediate);
      route(Boolean(settings.limiter));
    }

    function disconnect() {
      for (const node of [input, bass, voiceCut, voicePresence, limiter]) node.disconnect();
    }

    return { input, apply, disconnect };
  }

  globalThis.OpenVolumeAudio = Object.freeze({ createChain });
})();
