// Builds dist/chrome and dist/firefox from src/ (no dependencies, no bundler:
// the shipped code is exactly the source code, so it is easy to review).
//   node scripts/build.mjs          -> unpacked folders
//   node scripts/build.mjs --zip    -> also dist/openvolume-<target>-<version>.zip
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const dist = join(root, 'dist');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const readJson = (file) => JSON.parse(readFileSync(join(root, file), 'utf8'));

// Files that only one browser needs.
const ONLY = {
  chrome: ['background/chrome.js', 'background/chrome-backend.js', 'offscreen'],
  firefox: ['background/firefox.js', 'background/firefox-backend.js'],
};
const TARGETS = Object.keys(ONLY);

function manifestFor(target) {
  const base = readJson('manifests/base.json');
  const extra = readJson(`manifests/${target}.json`);
  const manifest = { ...base, ...extra, version: pkg.version };
  manifest.permissions = [...new Set([...(base.permissions ?? []), ...(extra.permissions ?? [])])];
  return manifest;
}

function excludedFor(target) {
  return TARGETS.filter((other) => other !== target).flatMap((other) => ONLY[other]);
}

function build(target) {
  const out = join(dist, target);
  rmSync(out, { recursive: true, force: true });
  const excluded = excludedFor(target);
  cpSync(src, out, {
    recursive: true,
    filter: (path) => {
      const rel = relative(src, path).split(sep).join('/');
      return !excluded.some((ex) => rel === ex || rel.startsWith(`${ex}/`));
    },
  });
  writeFileSync(join(out, 'manifest.json'), `${JSON.stringify(manifestFor(target), null, 2)}\n`);
  return out;
}

// ---- minimal ZIP writer (deflate) ----

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function listFiles(dir) {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? listFiles(path) : [path];
    });
}

function zip(dir, file) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  // Fixed timestamp (1980-01-01) so builds are reproducible.
  const time = 0;
  const date = (0 << 9) | (1 << 5) | 1;
  for (const path of listFiles(dir)) {
    const name = Buffer.from(relative(dir, path).split(sep).join('/'));
    const data = readFileSync(path);
    const packed = deflateRawSync(data, { level: 9 });
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, packed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(packed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);

    offset += local.length + name.length + packed.length;
  }
  const centralSize = centrals.reduce((sum, b) => sum + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(centrals.length / 2, 8);
  end.writeUInt16LE(centrals.length / 2, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  writeFileSync(file, Buffer.concat([...locals, ...centrals, end]));
}

mkdirSync(dist, { recursive: true });
const wantZip = process.argv.includes('--zip');
for (const target of TARGETS) {
  const out = build(target);
  console.log(`built ${relative(root, out)}`);
  if (wantZip) {
    const file = join(dist, `openvolume-${target}-${pkg.version}.zip`);
    zip(out, file);
    console.log(`packed ${relative(root, file)}`);
  }
}
