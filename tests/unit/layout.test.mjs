import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  rectanglesOverlap,
  resolveLayout,
} from '../../scripts/lib/layout.mjs';

const layoutDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../assets/layouts',
);
test('treats boxes separated by less than the padding as overlapping', () => {
  const left = { x: 0.10, y: 0.10, width: 0.20, height: 0.20 };
  const right = { x: 0.31, y: 0.10, width: 0.20, height: 0.20 };

  assert.equal(rectanglesOverlap(left, right), true);
});

test('rejects every template except reference-01', async () => {
  await assert.rejects(
    resolveLayout('controlled-01', layoutDir),
    /Only reference-01 is supported/,
  );
  await assert.rejects(
    resolveLayout('../reference-01', layoutDir),
    /Only reference-01 is supported/,
  );
});

test('resolves reference-01 as the only four-polygon layout', async () => {
  const layout = await resolveLayout('reference-01', layoutDir);

  assert.equal(layout.id, 'reference-01');
  assert.equal(layout.cutouts.length, 4);
  assert.deepEqual(layout.cutouts[0].polygon, [
    [0.047, 0.364],
    [0.352, 0.401],
    [0.350, 0.523],
    [0.010, 0.512],
  ]);
  assert.deepEqual(layout.text.headline, {
    opacity: 0.88,
    color: '#E8EAE6',
    fontFamily: 'Bahnschrift, Arial Narrow, Arial, sans-serif',
    fontWeight: 800,
    trackingEm: 0,
    minGap: 0.020,
    who: { x: 0.032, y: 0.063, width: 0.377, height: 0.081, fontSizeFactor: 0.135, scaleX: 0.80, scaleY: 1.00, skewX: 0 },
    is: {
      text: 'IS',
      placement: 'after-who-visible-right',
      fontSizeFactor: 0.135,
      scaleX: 0.75,
      scaleY: 0.45,
      skewX: -8,
      targetInkAspect: 1.82,
      baselineOffset: 0.002,
    },
    subject: {
      x: 0.030,
      y: 0.166,
      width: 0.543,
      height: 0.082,
      suffix: '?',
      fontSizeFactor: 0.133333,
      scaleX: 0.80,
      scaleY: 1.00,
      skewX: 0,
      minScaleX: 0.74,
      maxScaleX: 0.80,
    },
  });
  assert.equal(layout.text.headline.who.scaleX, 0.80);
  assert.equal(layout.text.textIslandBodyColor, '#ECEDE8');
  assert.equal(layout.text.info.rightMargin, 0.015);
  assert.deepEqual(layout.text.islands.island1.baselines, [0.282, 0.301, 0.318]);
  assert.deepEqual(layout.text.islands.island2.fontSizeFactors, [0.024, 0.020, 0.020]);
  assert.equal(layout.text.islands.island2.scaleY, 0.84);
  assert.deepEqual(layout.text.islands.island3.baselines, [0.546, 0.570, 0.591]);
  assert.equal(layout.text.islands.island4.orientation, 'vertical-90');
  assert.deepEqual(layout.text.islands.island5.baselines, [0.824, 0.845, 0.866, 0.887]);
  assert.equal(layout.text.islands.island5.x, 0.935);
  assert.equal(layout.text.islands.island5.rightRuleX, 0.951);
  assert.equal(layout.text.islands.island5.minRightGap, 0.016);
  assert.equal(layout.text.islands.island5.align, 'end');
});
