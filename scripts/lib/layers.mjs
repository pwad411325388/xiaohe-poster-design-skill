import sharp from 'sharp';

import {
  renderCutoutLayer,
  renderCutoutMaterialLayer,
  renderGrainLayer,
  renderMainLayer,
} from './pixels.mjs';
import { buildDecorationSvg, buildTextSvg } from './svg.mjs';

const pixels = (value, size) => Math.round((Number(value) || 0) * size);
const canvasBuffer = (width, height) => sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
const mainSource = (spec) => spec.sources?.find((source) => source.role === 'main');
const auxiliarySources = (spec) => spec.sources?.filter((source) => source.role === 'auxiliary' || source.role === 'aux') ?? [];

async function placeOnCanvas(image, left, top, width, height) {
  const x = Math.round(left);
  const y = Math.round(top);
  const cropLeft = Math.max(0, -x);
  const cropTop = Math.max(0, -y);
  const cropWidth = Math.min(width - cropLeft, image.width - cropLeft);
  const cropHeight = Math.min(height - cropTop, image.height - cropTop);
  if (cropWidth <= 0 || cropHeight <= 0) return canvasBuffer(width, height);
  const clipped = await sharp(image.png).extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight }).png().toBuffer();
  return sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: clipped, left: Math.max(0, x), top: Math.max(0, y) }]).png().toBuffer();
}

async function applyPolygonMask(png, cutout, canvas) {
  if (!Array.isArray(cutout.polygon) || cutout.polygon.length < 3) return png;
  const width = Math.max(1, pixels(cutout.width, canvas.width));
  const height = Math.max(1, pixels(cutout.height, canvas.height));
  const points = cutout.polygon.map(([x, y]) => {
    const localX = Math.round((x - cutout.x) * canvas.width);
    const localY = Math.round((y - cutout.y) * canvas.height);
    return `${localX},${localY}`;
  }).join(' ');
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><polygon points="${points}" fill="#ffffff"/></svg>`);
  return sharp(png).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

async function placeCutout(raw, effectiveCutout, cutout, canvas) {
  const { width, height } = canvas;
  const masked = await applyPolygonMask(raw, effectiveCutout, canvas);
  const rotated = await sharp(masked)
    .rotate(Number(cutout.rotation) || 0, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer({ resolveWithObject: true });
  const centerX = pixels(cutout.x, width) + pixels(cutout.width, width) / 2;
  const centerY = pixels(cutout.y, height) + pixels(cutout.height, height) / 2;
  return placeOnCanvas(
    { png: rotated.data, width: rotated.info.width, height: rotated.info.height },
    centerX - rotated.info.width / 2,
    centerY - rotated.info.height / 2,
    width,
    height,
  );
}

export async function compositeLayers(layers, canvas) {
  const { width, height } = canvas;
  const composite = [];
  for (const layer of layers) {
    let input = layer.png;
    if (Number.isFinite(layer.opacity) && layer.opacity >= 0 && layer.opacity < 1) {
      const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      for (let index = 3; index < data.length; index += info.channels) data[index] = Math.round(data[index] * layer.opacity);
      input = await sharp(data, { raw: info }).png().toBuffer();
    }
    composite.push({ input, blend: layer.blendMode || 'over' });
  }
  return sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(composite).png().toBuffer();
}

export async function renderSemanticLayers(spec, layout) {
  const { width, height } = spec.canvas;
  const main = mainSource(spec);
  if (!main) throw new Error('Cannot render layers without a main source');
  const mainPng = await renderMainLayer(main.path, width, height);
  const auxiliary = auxiliarySources(spec);
  const renderedCutouts = await Promise.all((layout?.cutouts ?? []).map(async (cutout, index) => {
    const slotId = cutout.slotId ?? `cutout-${index + 1}`;
    const slot = spec.cutoutSlots?.find((candidate) => candidate.slotId === slotId) ?? spec.cutoutSlots?.[index];
    const source = slot?.sourceId
      ? spec.sources?.find((candidate) => candidate.id === slot.sourceId)
      : auxiliary[index % auxiliary.length] ?? main;
    if (!source) throw new Error(`Cannot resolve source for ${slotId}`);
    const transform = slot?.sourceTransform ?? {};
    const effectiveCutout = slot?.polygon ? { ...cutout, polygon: slot.polygon } : cutout;
    const focus = transform.focus ?? source.focus;
    const scale = transform.scale ?? 1;
    const [materialRaw, greenRaw] = await Promise.all([
      renderCutoutMaterialLayer(source.path, effectiveCutout, { width, height }, focus, scale),
      renderCutoutLayer(source.path, effectiveCutout, { width, height }, spec.style?.accent, focus, scale),
    ]);
    const [material, green] = await Promise.all([
      placeCutout(materialRaw, effectiveCutout, cutout, { width, height }),
      placeCutout(greenRaw, effectiveCutout, cutout, { width, height }),
    ]);
    return { material, green };
  }));
  const materialPng = await compositeLayers(renderedCutouts.map(({ material }) => ({ png: material })), { width, height });
  const greenWindowPng = await compositeLayers(renderedCutouts.map(({ green }) => ({ png: green })), { width, height });
  const textPng = await sharp(Buffer.from(await buildTextSvg(spec, layout))).png().toBuffer();
  const decorationPng = await sharp(Buffer.from(await buildDecorationSvg(spec, layout))).png().toBuffer();
  const grainPng = await renderGrainLayer(width, height, spec.style?.grain, spec.style?.seed);
  return [
    { name: '01-main-background', png: mainPng, semantic: 'main-background' },
    { name: '02-portrait-cutout-materials', png: materialPng, semantic: 'portrait-cutout-materials' },
    { name: '03-green-cutout-windows', png: greenWindowPng, semantic: 'green-cutout-windows' },
    { name: '04-text-islands', png: textPng, semantic: 'text-islands' },
    { name: '05-graphics', png: decorationPng, semantic: 'graphics' },
    { name: '06-grain', png: grainPng, semantic: 'grain', blendMode: 'screen', opacity: spec.style?.grain },
  ];
}

export {
  renderMainLayer,
  renderCutoutLayer,
  renderCutoutMaterialLayer,
  renderGrainLayer,
  buildTextSvg,
  buildDecorationSvg,
};
