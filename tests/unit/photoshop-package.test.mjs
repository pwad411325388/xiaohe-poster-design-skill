import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildPhotoshopPackage } from '../../scripts/lib/photoshop-package.mjs';

const require = createRequire(import.meta.url);
const sharp = require('../../node_modules/sharp');
const { readPsd } = require('../../node_modules/ag-psd');
const fixtures = resolve(dirname(fileURLToPath(import.meta.url)), '../fixtures');

test('builds the approved Chinese Photoshop package with complete sources and unlinked masks', async (t) => {
  const outDir = await mkdtemp(join(tmpdir(), 'xiaohe-ps-package-'));
  t.after(() => rm(outDir, { recursive: true, force: true }));
  const fixture = resolve(fixtures, 'main.png');
  const width = 120;
  const height = 180;
  const main = await sharp(fixture).resize(width, height).ensureAlpha().png().toBuffer();
  const transparent = await sharp({ create: { width, height, channels: 4, background: '#00000000' } }).png().toBuffer();
  const teal = await sharp({ create: { width, height, channels: 4, background: '#29D3B2' } }).png().toBuffer();
  const grain = await sharp({ create: { width, height, channels: 4, background: '#404040' } }).png().toBuffer();
  const layers = [
    { name: '01-main-background', png: main },
    { name: '02-portrait-cutout-materials', png: transparent },
    { name: '03-green-cutout-windows', png: teal },
    { name: '04-text-islands', png: transparent },
    { name: '05-graphics', png: transparent },
    { name: '06-grain', png: grain, blendMode: 'screen', opacity: 0.51 },
  ];
  const polygons = [
    [[0.10, 0.10], [0.35, 0.10], [0.35, 0.25], [0.10, 0.25]],
    [[0.60, 0.10], [0.90, 0.10], [0.90, 0.25], [0.60, 0.25]],
    [[0.10, 0.60], [0.35, 0.60], [0.35, 0.80], [0.10, 0.80]],
    [[0.60, 0.60], [0.90, 0.60], [0.90, 0.80], [0.60, 0.80]],
  ];
  const layout = {
    cutouts: polygons.map((polygon, index) => ({
      slotId: `cutout-${index + 1}`,
      x: Math.min(...polygon.map(([x]) => x)),
      y: Math.min(...polygon.map(([, y]) => y)),
      width: Math.max(...polygon.map(([x]) => x)) - Math.min(...polygon.map(([x]) => x)),
      height: Math.max(...polygon.map(([, y]) => y)) - Math.min(...polygon.map(([, y]) => y)),
      polygon,
    })),
  };
  const spec = {
    canvas: { width, height },
    style: { accent: '#29D3B2', grain: 0.51 },
    sources: [
      { id: 'main', role: 'main', path: fixture },
      ...Array.from({ length: 4 }, (_, index) => ({ id: `aux-${index + 1}`, role: 'auxiliary', path: fixture })),
    ],
    cutoutSlots: polygons.map((polygon, index) => ({
      slotId: `cutout-${index + 1}`,
      sourceId: `aux-${index + 1}`,
      polygon,
      sourceTransform: { scale: 1, focus: { x: 0.5, y: 0.5 } },
    })),
  };

  const result = await buildPhotoshopPackage({ spec, layout, layers, composite: main, outDir });
  assert.equal(result.verification.materialGroups, 4);
  assert.equal(result.verification.vectorMaskLayers, 8);
  assert.equal(result.verification.allMasksUnlinked, true);
  assert.equal(result.verification.embeddedCompositeMatchesPoster, true);
  assert.deepEqual(result.verification.expectedPhotoshopTopToBottomOrder, [
    '06-噪点层', '05-图案层', '04-文字岛层', '03-绿色切片窗口层', '02-人像切片素材层', '01-主图背景层',
  ]);

  const packageDir = join(outDir, result.directory);
  const psd = readPsd(await readFile(join(packageDir, '00-可编辑海报工程-中文图层.psd')), {
    skipLayerImageData: true,
    skipCompositeImageData: true,
  });
  assert.deepEqual(psd.children.map((layer) => layer.name), [
    '01-主图背景层', '02-人像切片素材层', '03-绿色切片窗口层', '04-文字岛层', '05-图案层', '06-噪点层',
  ]);

  const isolated = await sharp(await readFile(join(packageDir, '13-切片1-青绿色窗口效果.png')))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(isolated.data[3], 0, 'teal effect must be transparent outside its window');
  const insideX = Math.round(width * 0.2);
  const insideY = Math.round(height * 0.18);
  assert.equal(isolated.data[(insideY * width + insideX) * 4 + 3], 255, 'teal effect must remain visible inside its window');
});
