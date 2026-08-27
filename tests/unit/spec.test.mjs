import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeSpec,
  validateSpec,
} from '../../scripts/lib/spec.mjs';

const validSpec = {
  version: 1,
  canvas: { width: 1200, height: 1800, background: '#090909' },
  sources: [
    { id: 'main', path: 'main.png', role: 'main' },
    ...[1, 2, 3, 4].map((index) => ({ id: `aux-${index}`, path: `aux-${index}.png`, role: 'auxiliary' })),
  ],
  protectedRegions: [{ id: 'face', x: 0.32, y: 0.18, width: 0.36, height: 0.32 }],
  cutoutSlots: [1, 2, 3, 4].map((index) => ({
    slotId: `cutout-${index}`,
    sourceId: 'main',
    polygon: [[0.1, 0.1], [0.2, 0.1], [0.2, 0.2], [0.1, 0.2]],
    sourceTransform: { scale: 1, focus: { x: 0.5, y: 0.5 } },
  })),
  copy: {
    subject: 'XIAOHE',
    headline: 'WHO IS XIAOHE?',
    subtitle: 'STUDIO X',
    textIslands: {
      island1: ['ENTER THE WILD', 'CONTROL THE FRAME', 'MOVE WITH INTENT'],
      island2: ['STUDIO X', 'FUTURE', 'YOURS'],
      island3: ['XIAOHE', 'IS', 'CALLING'],
      island4: ['XIAOHE', 'PORTRAIT', 'ARCHIVE'],
      island5: ['REAL PEOPLE.', 'REAL STORIES.', 'NEW SIGNAL.', 'WE RISE.'],
    },
    micro: [],
    footer: '',
  },
  style: { accent: '#29D3B2', grain: 0.42, seed: 17 },
  layout: { template: 'reference-01', cutouts: [] },
  exports: { png: true, svg: true, psd: true, layers: true, photoshopPackage: false },
};

test('normalizes a complete specification without changing its accent', () => {
  const normalized = normalizeSpec(validSpec);

  assert.deepEqual(validateSpec(normalized), []);
  assert.equal(normalized.style.accent, '#29D3B2');
});

test('reports missing main source and invalid protected-region x coordinate', () => {
  const invalid = structuredClone(validSpec);
  invalid.sources = [];
  invalid.protectedRegions[0].x = 1.2;

  const errors = validateSpec(invalid);

  assert.ok(errors.some((error) => error.includes('main source')));
  assert.ok(errors.some((error) => error.includes('protectedRegions[0].x')));
});

test('rejects non-finite grain and protected-region geometry', () => {
  const invalid = structuredClone(validSpec);
  invalid.style.grain = Number.NaN;
  invalid.protectedRegions[0].width = Number.NaN;

  const errors = validateSpec(invalid);

  assert.ok(errors.some((error) => error.includes('style.grain')));
  assert.ok(errors.some((error) => error.includes('protectedRegions[0].width')));
});

test('normalizes a missing headline to an empty string', () => {
  const incomplete = structuredClone(validSpec);
  delete incomplete.copy.headline;

  assert.equal(normalizeSpec(incomplete).copy.headline, '');
});

test('requires an explicit package choice while keeping the flat poster mandatory', () => {
  const missingChoice = structuredClone(validSpec);
  delete missingChoice.exports.photoshopPackage;
  assert.ok(validateSpec(normalizeSpec(missingChoice)).some((error) => error.includes('exports.photoshopPackage')));

  const wantsPackage = structuredClone(validSpec);
  wantsPackage.exports.photoshopPackage = true;
  assert.deepEqual(validateSpec(normalizeSpec(wantsPackage)), []);

  const disablesFlatPoster = structuredClone(validSpec);
  disablesFlatPoster.exports.png = false;
  assert.ok(validateSpec(disablesFlatPoster).some((error) => error.includes('flat poster')));
});

test('requires exactly four auxiliary photos', () => {
  const tooFew = structuredClone(validSpec);
  tooFew.sources = tooFew.sources.slice(0, 4);
  assert.ok(validateSpec(tooFew).some((error) => error.includes('exactly four auxiliary')));

  const exactlyFour = structuredClone(validSpec);
  assert.doesNotMatch(validateSpec(exactlyFour).join('\n'), /auxiliary/);
});

test('requires a non-empty subtitle before rendering', () => {
  const missingSubtitle = structuredClone(validSpec);
  missingSubtitle.copy.subtitle = '';

  assert.ok(validateSpec(missingSubtitle).some((error) => error.includes('copy.subtitle')));
});

test('requires five numbered text islands with locked line counts', () => {
  const missingIsland = structuredClone(validSpec);
  delete missingIsland.copy.textIslands.island4;
  assert.ok(validateSpec(missingIsland).some((error) => error.includes('copy.textIslands.island4')));

  const wrongLineCount = structuredClone(validSpec);
  wrongLineCount.copy.textIslands.island5 = ['ONE', 'TWO', 'THREE'];
  assert.ok(validateSpec(wrongLineCount).some((error) => error.includes('copy.textIslands.island5')));

  assert.deepEqual(validateSpec(normalizeSpec(validSpec)), []);
});

test('defaults to reference-01 and rejects removed controlled templates', () => {
  const withoutLayout = structuredClone(validSpec);
  delete withoutLayout.layout;
  assert.equal(normalizeSpec(withoutLayout).layout.template, 'reference-01');

  const removedTemplate = structuredClone(validSpec);
  removedTemplate.layout.template = 'controlled-01';
  assert.ok(validateSpec(removedTemplate).some((error) => error.includes('reference-01')));
});

test('normalizes optional footer groups and validates two groups of two lines', () => {
  const withoutFooterGroups = structuredClone(validSpec);
  assert.deepEqual(normalizeSpec(withoutFooterGroups).copy.footerGroups, []);

  const withFooterGroups = structuredClone(validSpec);
  withFooterGroups.copy.footerGroups = [['A', 'B'], ['C', 'D']];
  assert.deepEqual(validateSpec(withFooterGroups), []);

  const invalid = structuredClone(validSpec);
  invalid.copy.footerGroups = [['A'], ['C', 'D']];
  assert.ok(validateSpec(invalid).some((error) => error.includes('copy.footerGroups')));
});

test('normalizes and validates dynamic top-label and info-frame copy', () => {
  const withoutDynamicCopy = structuredClone(validSpec);
  const normalized = normalizeSpec(withoutDynamicCopy);
  assert.equal(normalized.copy.topLabel, 'Control the moment');
  assert.deepEqual(normalized.copy.infoLines, [
    'WORLDWIDE PORTRAIT ARCHIVE',
    'THE FIRST SIGNAL / ISSUE 01',
    'CONCEPTUAL PORTRAIT STUDY',
  ]);

  const customized = structuredClone(validSpec);
  customized.copy.topLabel = 'MOVE';
  customized.copy.infoLines = ['A', 'B', 'C'];
  assert.deepEqual(validateSpec(normalizeSpec(customized)), []);

  const invalid = structuredClone(validSpec);
  invalid.copy.infoLines = ['A', 'B'];
  assert.ok(validateSpec(normalizeSpec(invalid)).some((error) => error.includes('copy.infoLines')));
});

test('removes stale experimental headline overrides from normalized reference specs', () => {
  const withStaleOverrides = structuredClone(validSpec);
  withStaleOverrides.layout.headlineOverrides = {
    whoScaleX: 0.932,
    connectorX: 404,
    opacity: 0.80,
  };

  const normalized = normalizeSpec(withStaleOverrides);

  assert.equal(normalized.layout.headlineOverrides, undefined);
});
