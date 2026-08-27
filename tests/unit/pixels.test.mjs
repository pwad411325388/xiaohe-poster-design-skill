import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('../../node_modules/sharp');
import {
  renderCutoutLayer,
  renderCutoutMaterialLayer,
  renderGrainLayer,
  renderMainLayer,
} from '../../scripts/lib/pixels.mjs';

const fixturesDir = resolve(dirname(fileURLToPath(import.meta.url)), '../fixtures');
const mainPath = resolve(fixturesDir, 'main.png');

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

test('renders the main source as an 800 by 1200 PNG layer', async () => {
  const layer = await renderMainLayer(mainPath, 800, 1200);
  const metadata = await sharp(layer).metadata();

  assert.ok(layer.length > 1000);
  assert.equal(metadata.width, 800);
  assert.equal(metadata.height, 1200);
  assert.equal(metadata.format, 'png');
});

test('renders accent cutouts as colored RGB pixels', async () => {
  const layer = await renderCutoutLayer(
    mainPath,
    { width: 0.25, height: 0.1, sourcePosition: 'attention' },
    { width: 1200, height: 1800 },
    '#29D3B2',
  );
  const { data, info } = await sharp(layer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let foundAccentPixel = false;

  for (let offset = 0; offset < data.length; offset += info.channels) {
    if (data[offset + 3] > 0 && data[offset + 1] > data[offset + 2] && data[offset + 2] > data[offset]) {
      foundAccentPixel = true;
      break;
    }
  }

  assert.equal(foundAccentPixel, true);
});

test('renders portrait cutout materials as grayscale source pixels', async () => {
  const layer = await renderCutoutMaterialLayer(
    mainPath,
    { width: 0.25, height: 0.1, sourcePosition: 'attention' },
    { width: 1200, height: 1800 },
  );
  const { data, info } = await sharp(layer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let offset = 0; offset < data.length; offset += info.channels) {
    assert.equal(data[offset], data[offset + 1]);
    assert.equal(data[offset], data[offset + 2]);
  }
});

test('uses an explicit face focus for wide cutout crops', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'xiaohe-focus-'));
  const source = join(directory, 'focus-source.png');

  try {
    await sharp({
      create: { width: 300, height: 300, channels: 3, background: '#000000' },
    }).composite([{
      input: await sharp({
        create: { width: 50, height: 50, channels: 3, background: '#ffffff' },
      }).png().toBuffer(),
      left: 125,
      top: 225,
    }]).png().toFile(source);

    const layer = await renderCutoutLayer(
      source,
      { width: 0.25, height: 1 / 12, sourcePosition: 'north' },
      { width: 1200, height: 1200 },
      '#29D3B2',
      { x: 0.5, y: 0.83 },
    );
    const { data, info } = await sharp(layer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let brightestGreen = 0;

    for (let offset = 0; offset < data.length; offset += info.channels) {
      brightestGreen = Math.max(brightestGreen, data[offset + 1]);
    }

    assert.ok(brightestGreen > 100);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('renders seeded grain deterministically and varies it by seed', async () => {
  const first = await renderGrainLayer(300, 450, 0.4, 7);
  const second = await renderGrainLayer(300, 450, 0.4, 7);
  const changedSeed = await renderGrainLayer(300, 450, 0.4, 8);

  assert.equal(sha256(first), sha256(second));
  assert.notEqual(sha256(first), sha256(changedSeed));
});

test('renders opaque black-based monochrome grain for Screen blending', async () => {
  const grain = await renderGrainLayer(256, 256, 0.51, 7);
  const opaquePixels = await sharp(grain).raw().toBuffer();
  let foundBlackPixel = false;
  let foundBrightPixel = false;

  for (let offset = 0; offset < opaquePixels.length; offset += 4) {
    assert.equal(opaquePixels[offset], opaquePixels[offset + 1]);
    assert.equal(opaquePixels[offset], opaquePixels[offset + 2]);
    assert.equal(opaquePixels[offset + 3], 255);
    if (opaquePixels[offset] === 0) {
      foundBlackPixel = true;
    }
    if (opaquePixels[offset] > 200) foundBrightPixel = true;
  }

  assert.equal(foundBlackPixel, true);
  assert.equal(foundBrightPixel, true);
});

test('uses a distinct deterministic state for zero and one grain seeds', async () => {
  const zero = await renderGrainLayer(300, 450, 0.4, 0);
  const one = await renderGrainLayer(300, 450, 0.4, 1);

  assert.notEqual(sha256(zero), sha256(one));
});
