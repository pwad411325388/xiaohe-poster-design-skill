import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { compositeLayers, renderSemanticLayers } from '../../scripts/lib/layers.mjs';
import { buildEditableSvg, buildTextSvg } from '../../scripts/lib/svg.mjs';

const require = createRequire(import.meta.url);
const sharp = require('../../node_modules/sharp');
const fixturesDir = resolve(dirname(fileURLToPath(import.meta.url)), '../fixtures');
const completeSpec = JSON.parse(await readFile(resolve(fixturesDir, 'complete-spec.json'), 'utf8'));
const spec = {
  ...completeSpec,
  sources: completeSpec.sources.map((source) => ({ ...source, path: resolve(fixturesDir, source.path) })),
};
const layout = {
  id: 'test-generic-layout',
  text: { headline: { x: 0.05, y: 0.05, width: 0.7, height: 0.2 }, micro: [] },
  cutouts: [],
};
const cutoutLayout = {
  ...layout,
  cutouts: [
    { x: 0.02, y: 0.02, width: 0.2, height: 0.1, rotation: 8, sourcePosition: 'north' },
    { x: 0.76, y: 0.88, width: 0.2, height: 0.1, rotation: -8, sourcePosition: 'east' },
  ],
};
const referenceSpec = {
  ...spec,
  copy: {
    subject: 'YEJI',
    headline: 'WHO IS YEJI?',
    subtitle: 'ITZY',
    textIslands: {
      island1: ['ENTER THE WILD', 'CONTROL THE FRAME', 'MOVE WITH INTENT'],
      island2: ['ITZY', 'FUTURE', 'YOURS'],
      island3: ['YEJI', 'IS', 'CALLING'],
      island4: ['YEJI', 'PORTRAIT', 'ARCHIVE'],
      island5: ['REAL PEOPLE.', 'REAL STORIES.', 'NEW SIGNAL.', 'WE RISE.'],
    },
    micro: ['YEJI / PORTRAIT ARCHIVE'],
    footer: 'CONTROL THE MOMENT / ISSUE 01',
  },
  style: { ...spec.style, grain: 0.72 },
  layout: { ...spec.layout, template: 'reference-01' },
};
const referenceLayout = {
  id: 'reference-01',
  text: {
    textIslandBodyColor: '#ECEDE8',
    headline: {
      who: { x: 0.032, y: 0.063, width: 0.377, height: 0.081 },
      is: { x: 0.417, y: 0.117, width: 0.099, height: 0.029 },
      subject: { x: 0.030, y: 0.166, width: 0.543, height: 0.082 },
    },
    topLabel: { x: 0.030, y: 0.019, width: 0.383, height: 0.027 },
    identity: { x: 0.731, y: 0.025, width: 0.239, height: 0.059 },
    info: { x: 0.688, y: 0.111, width: 0.283, height: 0.047, rightMargin: 0.015 },
    islands: {
      island1: {
        x: 0.050,
        baselines: [0.282, 0.301, 0.318],
        fontSizeFactors: [0.018, 0.015, 0.013],
        scaleY: 1,
        opacity: 0.96,
        accentLineIndex: 0,
      },
      island2: {
        x: 0.050,
        baselines: [0.551, 0.575, 0.596],
        underlineY: 0.605,
        fontSizeFactors: [0.024, 0.020, 0.020],
        scaleY: 0.84,
        opacity: 0.96,
        underlinePadding: 0.014,
        underlineMaxWidth: 0.22,
        accentLineIndex: 0,
      },
      island3: {
        x: 0.411,
        baselines: [0.546, 0.570, 0.591],
        underlineY: 0.600,
        fontSizeFactors: [0.024, 0.020, 0.020],
        scaleY: 0.84,
        opacity: 0.96,
        underlinePadding: 0.014,
        underlineMaxWidth: 0.115,
        accentLineIndex: 0,
      },
      island4: {
        x: 0.931,
        y: 0.433,
        lineOffsets: [0, 0.016, 0.032],
        fontSizeFactors: [0.018, 0.012, 0.012],
        orientation: 'vertical-90',
        opacity: 0.96,
        accentLineIndex: 0,
      },
      island5: {
        x: 0.935,
        rightRuleX: 0.951,
        minRightGap: 0.016,
        baselines: [0.824, 0.845, 0.866, 0.887],
        fontSizeFactors: [0.014, 0.014, 0.014, 0.014],
        align: 'end',
        opacity: 0.96,
        accentLineIndex: 3,
      },
    },
    footer: { x: 0, y: 0.933, width: 1, height: 0.067 },
  },
  cutouts: [
    { x: 0.010, y: 0.364, width: 0.342, height: 0.159, polygon: [[0.047, 0.364], [0.352, 0.401], [0.350, 0.523], [0.010, 0.512]], sourcePosition: 'attention' },
    { x: 0.621, y: 0.257, width: 0.288, height: 0.184, polygon: [[0.678, 0.280], [0.891, 0.257], [0.909, 0.411], [0.621, 0.441]], sourcePosition: 'attention' },
    { x: 0.034, y: 0.614, width: 0.359, height: 0.227, polygon: [[0.034, 0.690], [0.285, 0.614], [0.393, 0.687], [0.128, 0.841]], sourcePosition: 'attention' },
    { x: 0.520, y: 0.569, width: 0.446, height: 0.189, polygon: [[0.593, 0.569], [0.966, 0.589], [0.957, 0.758], [0.520, 0.680]], sourcePosition: 'attention' },
  ],
};

test('buildEditableSvg retains the headline as editable SVG text', async () => {
  const svg = await buildEditableSvg(spec, layout);

  assert.match(svg, /<text[^>]*>WHO IS XIAOHE\?<\/text>/);
  assert.match(svg, /id="text-headline"/);
  assert.doesNotMatch(svg, /foreignObject/i);
});

test('buildEditableSvg cycles auxiliary source images for cutouts', async () => {
  const svg = await buildEditableSvg(spec, cutoutLayout);
  const auxiliaryPngs = await Promise.all(spec.sources.slice(1).map(async (source) => (
    sharp(source.path).rotate().png().toBuffer()
  )));

  for (const png of auxiliaryPngs) {
    assert.ok(svg.includes(`data:image/png;base64,${png.toString('base64')}`));
  }
});

test('buildEditableSvg honors explicit source-to-slot mappings and slot polygons', async () => {
  const reversedSources = [...referenceSpec.sources.slice(1)].reverse();
  const customPolygon = [[0.02, 0.02], [0.22, 0.03], [0.18, 0.12], [0.03, 0.11]];
  const mappedSpec = {
    ...referenceSpec,
    cutoutSlots: referenceLayout.cutouts.map((cutout, index) => ({
      slotId: `cutout-${index + 1}`,
      sourceId: reversedSources[index].id,
      polygon: index === 0 ? customPolygon : [
        [cutout.x, cutout.y],
        [cutout.x + cutout.width, cutout.y],
        [cutout.x + cutout.width, cutout.y + cutout.height],
        [cutout.x, cutout.y + cutout.height],
      ],
      sourceTransform: { scale: 1, focus: { x: 0.5, y: 0.5 } },
    })),
  };
  const expectedFirstSource = await sharp(reversedSources[0].path).rotate().png().toBuffer();
  const svg = await buildEditableSvg(mappedSpec, referenceLayout);
  const firstMaterial = svg.match(/<g id="portrait-cutout-material-0"[\s\S]*?<\/g>/)?.[0] ?? '';

  assert.ok(firstMaterial.includes(`data:image/png;base64,${expectedFirstSource.toString('base64')}`));
  assert.match(svg, /id="reference-cutout-0"[^>]*><polygon points="24,36 264,54 216,216 36,198"/);
});

test('renderSemanticLayers returns six full-canvas semantic PNG layers with stable names', async () => {
  const layers = await renderSemanticLayers(spec, cutoutLayout);

  assert.deepEqual(layers.map((layer) => layer.name), [
    '01-main-background',
    '02-portrait-cutout-materials',
    '03-green-cutout-windows',
    '04-text-islands',
    '05-graphics',
    '06-grain',
  ]);
  for (const layer of layers) {
    assert.ok(Buffer.isBuffer(layer.png));
    const metadata = await sharp(layer.png).metadata();
    assert.equal(metadata.width, spec.canvas.width);
    assert.equal(metadata.height, spec.canvas.height);
  }
});

test('compositeLayers accepts a canvas object', async () => {
  const png = await compositeLayers([], { width: 31, height: 47 });
  const metadata = await sharp(png).metadata();

  assert.equal(metadata.width, 31);
  assert.equal(metadata.height, 47);
});

test('buildEditableSvg emits the locked reference typography and polygon masks', async () => {
  const svg = await buildEditableSvg(referenceSpec, referenceLayout);

  assert.match(svg, /id="reference-headline"/);
  assert.match(svg, />WHO<\/text>/);
  assert.match(svg, />IS<\/text>/);
  assert.match(svg, />YEJI\?<\/text>/);
  assert.doesNotMatch(svg, />YEJI!\?<\/text>/);
  assert.match(svg, />ITZY<\/text>/);
  assert.match(svg, /id="reference-cutout-0"[^>]*><polygon/);
  assert.match(svg, /id="reference-cutout-3"[^>]*><polygon/);
  assert.doesNotMatch(svg, /id="reference-mid-block"/);
  assert.match(svg, /id="reference-center-copy"/);
  assert.match(svg, /id="reference-vertical-copy"/);
  assert.match(svg, /id="reference-footer"/);
  assert.match(svg, /id="reference-barcode"/);
  assert.match(svg, /id="reference-top-label"[\s\S]*font-family="Georgia/);
  assert.match(svg, />Control the moment<\/text>/);
  assert.match(svg, /id="reference-headline"[\s\S]*font-family="Bahnschrift/);
  assert.match(svg, /id="reference-connector"[^>]*transform="[^"]*skewX\(-8\)/);
  assert.match(svg, /id="reference-subject-fit"[^>]*transform="[^"]*scale\(/);
  assert.match(svg, /fill="#E8EAE6"/);
  assert.match(svg, /id="main-background"/);
  assert.match(svg, /id="portrait-cutout-materials"/);
  assert.match(svg, /id="green-cutout-windows"/);
  assert.match(svg, /id="text-islands"/);
  assert.match(svg, /id="graphics"/);
  assert.match(svg, /id="reference-left-mid-identity"/);
  assert.match(svg, /id="reference-callout-accent"[^>]*fill="#29D3B2"/);
});

test('reference headline ends the subject with exactly one question mark', async () => {
  const svg = await buildTextSvg({
    ...referenceSpec,
    copy: {
      ...referenceSpec.copy,
      subject: 'YEJI!??',
      headline: 'WHO IS YEJI',
    },
  }, referenceLayout);
  const subjectMarkup = svg.match(/<g id="reference-subject-fit"[\s\S]*?<\/g>/)?.[0] ?? '';

  assert.match(subjectMarkup, />YEJI\?<\/text>/);
  assert.doesNotMatch(subjectMarkup, />YEJI\?\?+<\/text>/);
  assert.doesNotMatch(subjectMarkup, />YEJI!\?<\/text>/);
});

test('reference headline keeps WHO and IS separated by at least 24 px on a 1200 px canvas', async () => {
  const svg = await buildTextSvg(referenceSpec, referenceLayout);
  const whoRight = Number(svg.match(/id="reference-who-fit"[^>]*data-visual-right="([\d.]+)"/)?.[1]);
  const connectorLeft = Number(svg.match(/id="reference-connector"[^>]*data-visual-left="([\d.]+)"/)?.[1]);
  const minimumGap = Number(svg.match(/id="reference-connector"[^>]*data-min-gap="([\d.]+)"/)?.[1]);

  assert.equal(minimumGap, 24);
  assert.ok(connectorLeft - whoRight >= minimumGap);
  assert.match(svg, /id="reference-connector"[^>]*data-target-ink-aspect="1\.82"[^>]*transform="translate\([\d.]+ [\d.]+\) skewX\(-8\) scale\(0\.75 0\.45\)"[\s\S]*?<text x="0" y="0"/);

  const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha()
    .extract({ left: 0, top: 120, width: 700, height: 180 })
    .raw().toBuffer({ resolveWithObject: true });
  const occupiedColumns = [];
  for (let x = 0; x < info.width; x += 1) {
    let occupied = false;
    for (let y = 0; y < info.height; y += 1) {
      if (data[(y * info.width + x) * info.channels + 3] > 40) {
        occupied = true;
        break;
      }
    }
    if (occupied) occupiedColumns.push(x);
  }
  const runs = [];
  let start = occupiedColumns[0];
  let previous = occupiedColumns[0];
  for (const x of occupiedColumns.slice(1)) {
    if (x > previous + 1) {
      runs.push([start, previous]);
      start = x;
    }
    previous = x;
  }
  runs.push([start, previous]);

  assert.ok(runs.length >= 5);
  assert.ok(runs[3][0] - runs[2][1] - 1 >= minimumGap);
});

test('reference IS renders as the measured flattened 1.82 ink aspect', async () => {
  const svg = await buildTextSvg(referenceSpec, referenceLayout);
  const match = svg.match(/id="reference-connector"[^>]*transform="translate\(([\d.]+) ([\d.]+)\)/);
  const connectorX = Number(match?.[1]);
  const connectorBaseline = Number(match?.[2]);
  const left = Math.max(0, Math.floor(connectorX - 5));
  const top = Math.max(0, Math.floor(connectorBaseline - 90));
  const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha()
    .extract({ left, top, width: 180, height: 100 })
    .raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * info.channels + 3] > 40) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const inkAspect = (maxX - minX + 1) / (maxY - minY + 1);
  assert.ok(Math.abs(inkAspect - 1.82) <= 0.10, `IS ink aspect was ${inkAspect.toFixed(3)}`);
});

test('reference headline applies the approved 20 percent horizontal compression', async () => {
  const svg = await buildTextSvg(referenceSpec, referenceLayout);
  const whoScale = Number(svg.match(/id="reference-who-fit"[^>]*transform="[^"]*scale\(([^ ]+) 1\)/)?.[1]);

  assert.equal(whoScale, 0.80);
});

test('reference-01 does not let stale experimental headline overrides replace the locked baseline', async () => {
  const svg = await buildTextSvg({
    ...referenceSpec,
    layout: {
      ...referenceSpec.layout,
      headlineOverrides: { whoScaleX: 0.932, connectorX: 404, opacity: 0.80 },
    },
  }, referenceLayout);
  const whoScale = Number(svg.match(/id="reference-who-fit"[^>]*transform="[^"]*scale\(([^ ]+) 1\)/)?.[1]);
  const connectorLeft = Number(svg.match(/id="reference-connector"[^>]*data-visual-left="([\d.]+)"/)?.[1]);
  const whoRight = Number(svg.match(/id="reference-who-fit"[^>]*data-visual-right="([\d.]+)"/)?.[1]);

  assert.equal(whoScale, 0.80);
  assert.equal(connectorLeft, Math.ceil(whoRight + 24));
  assert.match(svg, /id="reference-headline"[^>]*opacity="0\.88"/);
});

test('reference footer uses subtitle branding and accepts two user footer groups', async () => {
  const customized = {
    ...referenceSpec,
    copy: {
      ...referenceSpec.copy,
      subtitle: 'AESPA',
      footerGroups: [
        ['FIRST CUSTOM LINE', 'SECOND CUSTOM LINE'],
        ['THIRD CUSTOM LINE', 'FOURTH CUSTOM LINE'],
      ],
    },
  };
  const svg = await buildEditableSvg(customized, referenceLayout);

  assert.match(svg, /id="reference-footer-brand"[^>]*>AESPA<\/text>/);
  assert.match(svg, />FIRST CUSTOM LINE<\/text>/);
  assert.match(svg, />SECOND CUSTOM LINE<\/text>/);
  assert.match(svg, />THIRD CUSTOM LINE<\/text>/);
  assert.match(svg, />FOURTH CUSTOM LINE<\/text>/);
  assert.doesNotMatch(svg, />I DON'T WAIT FOR THE SIGNAL\.<\/text>/);
});

test('reference top label background follows rendered copy width with fixed side padding', async () => {
  const shortSvg = await buildEditableSvg({
    ...referenceSpec,
    copy: { ...referenceSpec.copy, topLabel: 'MOVE' },
  }, referenceLayout);
  const longSvg = await buildEditableSvg({
    ...referenceSpec,
    copy: { ...referenceSpec.copy, topLabel: 'CONTROL THE MOMENT' },
  }, referenceLayout);
  const widthOf = (svg) => Number(svg.match(/id="reference-top-label-background"[^>]*?\swidth="([\d.]+)"/)?.[1]);

  assert.match(shortSvg, />MOVE<\/text>/);
  assert.match(longSvg, />CONTROL THE MOMENT<\/text>/);
  assert.ok(widthOf(shortSvg) > 32);
  assert.ok(widthOf(longSvg) > widthOf(shortSvg));
});

test('reference upper-right info frame uses content width with a near-edge minimum', async () => {
  const shortSvg = await buildEditableSvg({
    ...referenceSpec,
    copy: { ...referenceSpec.copy, infoLines: ['A', 'B', 'C'] },
  }, referenceLayout);
  const longSvg = await buildEditableSvg({
    ...referenceSpec,
    copy: { ...referenceSpec.copy, infoLines: ['A'.repeat(80), 'B', 'C'] },
  }, referenceLayout);
  const frameOf = (svg) => {
    const match = svg.match(/id="reference-info-frame"[^>]*?x="([\d.]+)"[^>]*?width="([\d.]+)"/);
    return { x: Number(match?.[1]), width: Number(match?.[2]) };
  };
  const shortFrame = frameOf(shortSvg);
  const longFrame = frameOf(longSvg);

  assert.match(longSvg, new RegExp(`>${'A'.repeat(80)}<\\/text>`));
  assert.ok(shortFrame.width >= 1200 - 1200 * 0.688 - 18 - 1);
  assert.ok(shortFrame.x + shortFrame.width <= 1200);
  assert.ok(longFrame.width > shortFrame.width);
  assert.ok(longFrame.x + longFrame.width <= 1200);
});

test('reference text islands use the locked size, spacing, opacity, and vertical compression', async () => {
  const svg = await buildTextSvg(referenceSpec, referenceLayout);

  assert.match(svg, /id="reference-left-mid-identity"[^>]*opacity="0\.96"[^>]*transform="translate\(0 [\d.]+\) scale\(1 0\.84\)/);
  assert.match(svg, /id="reference-center-copy"[^>]*opacity="0\.96"[^>]*transform="translate\(0 [\d.]+\) scale\(1 0\.84\)/);
  assert.match(svg, /id="reference-left-mid-identity"[\s\S]*font-size="29"/);
  assert.match(svg, /id="reference-center-copy"[\s\S]*font-size="29"/);
  assert.match(svg, /id="reference-left-underline"/);
  assert.match(svg, /id="reference-center-underline"/);
  assert.match(svg, /id="reference-left-mid-identity"[\s\S]*?<text[^>]*fill="#ECEDE8">FUTURE<\/text>/);
  assert.match(svg, /id="reference-center-copy"[\s\S]*?<text[^>]*fill="#ECEDE8">IS<\/text>/);
});

test('reference text island 5 stays left of the right rule by the locked gap', async () => {
  const svg = await buildEditableSvg(referenceSpec, referenceLayout);
  const calloutX = Number(svg.match(/id="reference-lower-callout"[^>]*>[\s\S]*?<text x="([\d.]+)"/)?.[1]);
  const rightRuleX = Number(svg.match(/id="reference-right-rule"[^>]*x1="([\d.]+)"/)?.[1]);
  const minimumGap = Number(svg.match(/id="reference-right-rule"[^>]*data-island5-min-gap="([\d.]+)"/)?.[1]);

  assert.equal(calloutX, 1122);
  assert.equal(rightRuleX, 1141);
  assert.equal(minimumGap, 19.2);
  assert.ok(rightRuleX - calloutX >= 19);
});

test('reference renderer reads all five numbered text-island fields', async () => {
  const svg = await buildTextSvg(referenceSpec, referenceLayout);

  for (const line of Object.values(referenceSpec.copy.textIslands).flat()) {
    assert.match(svg, new RegExp(`>${line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/text>`));
  }
  for (let index = 1; index <= 5; index += 1) {
    assert.match(svg, new RegExp(`id="reference-text-island-${index}"`));
  }
});

test('semantic grain uses Screen blending and layer opacity', async () => {
  const layers = await renderSemanticLayers(referenceSpec, referenceLayout);
  const grain = layers.find((layer) => layer.name === '06-grain');

  assert.equal(grain.blendMode, 'screen');
  assert.equal(grain.opacity, 0.72);
});
