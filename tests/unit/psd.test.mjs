import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { exportPsd } from '../../scripts/lib/psd.mjs';

const require = createRequire(import.meta.url);
const { readPsd } = require('../../node_modules/ag-psd');
const sharp = require('../../node_modules/sharp');
const fixtures = resolve(dirname(fileURLToPath(import.meta.url)), '../fixtures');

test('exportPsd creates a layered 1200 by 1800 document', async () => {
  const main = await sharp(await readFile(resolve(fixtures, 'main.png'))).resize(1200, 1800).ensureAlpha().png().toBuffer();
  const composite = await sharp(main).png().toBuffer();
  const layerNames = [
    '01-main-background',
    '02-portrait-cutout-materials',
    '03-green-cutout-windows',
    '04-text-islands',
    '05-graphics',
    '06-grain',
  ];
  const buffer = await exportPsd(
    1200,
    1800,
    layerNames.map((name) => ({
      name,
      png: main,
      ...(name === '06-grain' ? { blendMode: 'screen', opacity: 0.51 } : {}),
    })),
    composite,
  );
  const psd = readPsd(buffer, { skipLayerImageData: true, skipCompositeImageData: true });

  assert.equal(psd.width, 1200);
  assert.equal(psd.height, 1800);
  assert.deepEqual(psd.children.map((layer) => layer.name), layerNames);
  const grain = psd.children.find((layer) => layer.name === '06-grain');
  assert.equal(grain.blendMode, 'screen');
  assert.ok(Math.abs(grain.opacity - 0.51) <= 0.01);
});
