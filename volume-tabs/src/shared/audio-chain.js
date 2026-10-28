// The Web Audio processing chain used by both engines:
//   input (volume) -> bass shelf -> voice cut -> voice presence -> destination
// The filters stay flat (0 dB) except for the selected sound mode.
// Classic script (not a module) so it can be injected as a content script too.
(() => {
  'use strict';
  if (globalThis.VolumeTabsAudio) return;

  const BASS = { frequency: 100, gain: 10 };
  const VOICE_CUT = { frequency: 250, Q: 0.9, gain: -3 };
  const VOICE_PRESENCE = { frequency: 2600, Q: 0.7, gain: 8 };
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

    input.connect(bass);
    bass.connect(voiceCut);
    voiceCut.connect(voicePresence);
    voicePresence.connect(destination);

    function apply(settings, immediate = false) {
      setParam(input.gain, settings.percent / 100, ctx, immediate);
      const voice = settings.effect === 'voice';
      setParam(bass.gain, settings.effect === 'bass' ? BASS.gain : 0, ctx, immediate);
      setParam(voiceCut.gain, voice ? VOICE_CUT.gain : 0, ctx, immediate);
      setParam(voicePresence.gain, voice ? VOICE_PRESENCE.gain : 0, ctx, immediate);
    }

    function disconnect() {
      for (const node of [input, bass, voiceCut, voicePresence]) node.disconnect();
    }

    return { input, apply, disconnect };
  }

  globalThis.VolumeTabsAudio = Object.freeze({ createChain });
})();
