import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = join(import.meta.dirname, '..');
execFileSync(process.execPath, [join(root, 'scripts/build.mjs')], { cwd: root });
const manifest = (target) => JSON.parse(readFileSync(join(root, 'dist', target, 'manifest.json'), 'utf8'));

test('chrome build', () => {
  const m = manifest('chrome');
  assert.equal(m.manifest_version, 3);
  assert.equal(m.background.service_worker, 'background/chrome.js');
  assert.ok(m.permissions.includes('tabCapture'));
  assert.ok(!('host_permissions' in m), 'no host permissions by default');
  assert.ok(existsSync(join(root, 'dist/chrome/offscreen/offscreen.html')));
  assert.ok(!existsSync(join(root, 'dist/chrome/background/firefox.js')));
});

test('firefox build', () => {
  const m = manifest('firefox');
  assert.deepEqual(m.background.scripts, ['background/firefox.js']);
  assert.deepEqual(m.browser_specific_settings.gecko.data_collection_permissions.required, ['none']);
  assert.ok(!m.permissions.includes('tabCapture'));
  assert.ok(!('host_permissions' in m), 'host access is optional only');
  assert.ok(!existsSync(join(root, 'dist/firefox/offscreen')));
  assert.ok(!existsSync(join(root, 'dist/firefox/background/chrome.js')));
});

test('no remote code or network calls in shipped files', () => {
  const files = execFileSync('find', [join(root, 'src'), '-name', '*.js', '-o', '-name', '*.html'], { encoding: 'utf8' })
    .trim()
    .split('\n');
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const pattern of [/\bfetch\(/, /XMLHttpRequest/, /\beval\(/, /new Function\(/, /WebSocket/, /sendBeacon/, /\.innerHTML\s*=/]) {
      assert.doesNotMatch(text, pattern, `${file} must not use ${pattern}`);
    }
  }
});
