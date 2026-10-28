import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  NEUTRAL,
  clampPercent,
  isNeutral,
  isRestrictedUrl,
  levelOf,
  sameSettings,
  sanitizeSettings,
  siteKey,
} from '../src/shared/settings.js';

test('clampPercent keeps values in 0..600 and rounds', () => {
  assert.equal(clampPercent(-5), 0);
  assert.equal(clampPercent(601), 600);
  assert.equal(clampPercent(249.6), 250);
  assert.equal(clampPercent('300'), 300);
  assert.equal(clampPercent('abc'), 100);
  assert.equal(clampPercent(Infinity), 100);
});

test('sanitizeSettings drops unknown and invalid fields', () => {
  assert.deepEqual(sanitizeSettings({ percent: 9999, bass: 'yes', evil: 1 }), { ...NEUTRAL, percent: 600 });
  assert.deepEqual(sanitizeSettings(null), { ...NEUTRAL });
  assert.deepEqual(sanitizeSettings({ voice: true }, { percent: 300, bass: true }), {
    percent: 300,
    bass: true,
    voice: true,
    limiter: false,
  });
});

test('isNeutral / sameSettings', () => {
  assert.ok(isNeutral(NEUTRAL));
  assert.ok(!isNeutral({ ...NEUTRAL, percent: 101 }));
  assert.ok(!isNeutral({ ...NEUTRAL, limiter: true }));
  assert.ok(sameSettings(NEUTRAL, { percent: 100 }));
  assert.ok(!sameSettings(NEUTRAL, { percent: 100, voice: true }));
});

test('siteKey only accepts web pages', () => {
  assert.equal(siteKey('https://www.youtube.com/watch?v=x'), 'www.youtube.com');
  assert.equal(siteKey('http://example.com:8080/a'), 'example.com');
  assert.equal(siteKey('chrome://settings'), null);
  assert.equal(siteKey('file:///tmp/a.mp3'), null);
  assert.equal(siteKey(undefined), null);
});

test('isRestrictedUrl', () => {
  assert.ok(isRestrictedUrl('chrome://extensions'));
  assert.ok(isRestrictedUrl('about:addons'));
  assert.ok(isRestrictedUrl('https://chromewebstore.google.com/detail/x'));
  assert.ok(isRestrictedUrl('https://addons.mozilla.org/en-US/firefox/'));
  assert.ok(!isRestrictedUrl('https://www.youtube.com/'));
  assert.ok(!isRestrictedUrl('file:///home/me/song.mp3'));
  assert.ok(!isRestrictedUrl(undefined));
});

test('levelOf', () => {
  assert.equal(levelOf(0), 'normal');
  assert.equal(levelOf(100), 'normal');
  assert.equal(levelOf(250), 'boost');
  assert.equal(levelOf(600), 'high');
});
