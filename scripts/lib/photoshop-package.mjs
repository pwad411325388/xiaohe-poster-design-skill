import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { readPsd, writePsdBuffer, initializeCanvas } = require('ag-psd');

initializeCanvas((width, height) => ({
  width,
  height,
  getContext: () => ({
    createImageData: (imageWidth, imageHeight) => ({
      width: imageWidth,
      height: imageHeight,
      data: new Uint8ClampedArray(imageWidth * imageHeight * 4),
    }),
  }),
}));

export const PHOTOSHOP_PACKAGE_DIR = 'PS导入素材包-中文-完整版';

const LAYER_FILES = [
  ['01-main-background', '01-主图背景层.png'],
  ['02-portrait-cutout-materials', '02-人像切片效果层-灰度.png'],
  ['03-green-cutout-windows', '03-绿色切片窗口效果层.png'],
  ['04-text-islands', '04-文字岛层.png'],
  ['05-graphics', '05-图案层.png'],
  ['06-grain', '06-噪点层.png'],
];

const TOP_LEVEL_NAMES = [
  '01-主图背景层',
  '02-人像切片素材层',
  '03-绿色切片窗口层',
  '04-文字岛层',
  '05-图案层',
  '06-噪点层',
];

function parseAccent(accent) {
  return {
    r: Number.parseInt(accent.slice(1, 3), 16),
    g: Number.parseInt(accent.slice(3, 5), 16),
    b: Number.parseInt(accent.slice(5, 7), 16),
  };
}

function accentMatrix({ r, g, b }) {
  const luminance = [0.2126, 0.7152, 0.0722];
  return [r, g, b].map((channel) => luminance.map((weight) => weight * (channel / 255)));
}

function focusCrop(sourceWidth, sourceHeight, targetWidth, targetHeight, focus, scale = 1) {
  const targetAspect = targetWidth / targetHeight;
  const sourceAspect = sourceWidth / sourceHeight;
  const baseWidth = Math.min(sourceWidth, Math.max(1, Math.round(
    sourceAspect > targetAspect ? sourceHeight * targetAspect : sourceWidth,
  )));
  const baseHeight = Math.min(sourceHeight, Math.max(1, Math.round(
    sourceAspect > targetAspect ? sourceHeight : sourceWidth / targetAspect,
  )));
  const sourceScale = Number.isFinite(Number(scale)) && Number(scale) > 0 ? Number(scale) : 1;
  const width = Math.min(sourceWidth, Math.max(1, Math.round(baseWidth / sourceScale)));
  const height = Math.min(sourceHeight, Math.max(1, Math.round(baseHeight / sourceScale)));
  const centerX = Math.max(0, Math.min(1, Number(focus?.x ?? 0.5))) * sourceWidth;
  const centerY = Math.max(0, Math.min(1, Number(focus?.y ?? 0.5))) * sourceHeight;
  return {
    left: Math.max(0, Math.min(sourceWidth - width, Math.round(centerX - width / 2))),
    top: Math.max(0, Math.min(sourceHeight - height, Math.round(centerY - height / 2))),
    width,
    height,
  };
}

async function imageData(png) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data };
}

function vectorMask(polygon, width, height) {
  return {
    notLink: true,
    fillStartsWithAllPixels: false,
    paths: [{
      open: false,
      operation: 'combine',
      fillRule: 'non-zero',
      knots: polygon.map(([x, y]) => {
        const pointX = x * width;
        const pointY = y * height;
        return { linked: true, points: [pointX, pointY, pointX, pointY, pointX, pointY] };
      }),
    }],
  };
}

async function maskPng(polygon, width, height) {
  const points = polygon.map(([x, y]) => `${Math.round(x * width)},${Math.round(y * height)}`).join(' ');
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#000000"/><polygon points="${points}" fill="#ffffff"/></svg>`);
  return sharp(svg).flatten({ background: '#000000' }).grayscale().removeAlpha().png({ compressionLevel: 9 }).toBuffer();
}

async function buildCompleteWorkingSource(source, slot, cutout, canvas, accent) {
  const oriented = await sharp(source.path, { failOn: 'error' }).rotate().png().toBuffer({ resolveWithObject: true });
  const targetWidth = Math.max(1, Math.round(cutout.width * canvas.width));
  const targetHeight = Math.max(1, Math.round(cutout.height * canvas.height));
  const crop = focusCrop(
    oriented.info.width,
    oriented.info.height,
    targetWidth,
    targetHeight,
    slot.sourceTransform?.focus,
    slot.sourceTransform?.scale,
  );
  const scaleX = targetWidth / crop.width;
  const scaleY = targetHeight / crop.height;
  if (Math.abs(scaleX - scaleY) / Math.max(scaleX, scaleY) > 0.015) {
    throw new Error(`${slot.slotId} complete source placement would require non-uniform scaling`);
  }
  const scale = (scaleX + scaleY) / 2;
  const sourceWidth = Math.max(1, Math.round(oriented.info.width * scale));
  const sourceHeight = Math.max(1, Math.round(oriented.info.height * scale));
  const left = Math.round(cutout.x * canvas.width - crop.left * scale);
  const top = Math.round(cutout.y * canvas.height - crop.top * scale);
  const resized = sharp(oriented.data).resize(sourceWidth, sourceHeight, { fit: 'fill' }).ensureAlpha();
  const [gray, teal] = await Promise.all([
    resized.clone().grayscale().linear(1.18, -12).png().toBuffer(),
    resized.clone().recomb(accentMatrix(parseAccent(accent))).linear(1.18, -12).png().toBuffer(),
  ]);
  return { gray, teal, left, top };
}

async function originalColorPng(source) {
  const originalPath = source.originalPath || source.path;
  return sharp(originalPath, { failOn: 'error' }).rotate().ensureAlpha().png({ compressionLevel: 9 }).toBuffer();
}

function layerByName(layers, name) {
  const layer = layers.find((candidate) => candidate.name === name);
  if (!layer) throw new Error(`Missing semantic layer for Photoshop package: ${name}`);
  return layer;
}

function comparePixels(first, second) {
  return first.length === second.length && Buffer.compare(Buffer.from(first), Buffer.from(second)) === 0;
}

async function isolateWithMask(image, mask) {
  const [imageRaw, maskRaw] = await Promise.all([
    sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(mask).raw().toBuffer({ resolveWithObject: true }),
  ]);
  const pixels = Buffer.from(imageRaw.data);
  for (let pixel = 0; pixel < imageRaw.info.width * imageRaw.info.height; pixel += 1) {
    pixels[pixel * 4 + 3] = Math.min(
      pixels[pixel * 4 + 3],
      maskRaw.data[pixel * maskRaw.info.channels],
    );
  }
  return sharp(pixels, { raw: imageRaw.info }).png({ compressionLevel: 9 }).toBuffer();
}

export async function buildPhotoshopPackage({ spec, layout, layers, composite, outDir }) {
  const packageDir = path.join(outDir, PHOTOSHOP_PACKAGE_DIR);
  await fs.mkdir(packageDir, { recursive: false });
  const { width, height } = spec.canvas;

  await fs.writeFile(path.join(packageDir, '00-最终效果预览.png'), composite);
  for (const [semanticName, chineseName] of LAYER_FILES) {
    await fs.writeFile(path.join(packageDir, chineseName), layerByName(layers, semanticName).png);
  }

  const materialGroups = [];
  const greenLayers = [];
  const masks = [];
  const combinedTeal = layerByName(layers, '03-green-cutout-windows').png;
  const packageFiles = ['00-最终效果预览.png', ...LAYER_FILES.map(([, file]) => file)];

  for (let index = 0; index < 4; index += 1) {
    const cutout = layout.cutouts[index];
    const slotId = cutout.slotId ?? `cutout-${index + 1}`;
    const slot = spec.cutoutSlots.find((candidate) => candidate.slotId === slotId);
    if (!slot) throw new Error(`Missing ${slotId} while building Photoshop package`);
    const source = spec.sources.find((candidate) => candidate.id === slot.sourceId);
    if (!source) throw new Error(`Missing source ${slot.sourceId} while building Photoshop package`);
    const polygon = slot.polygon ?? cutout.polygon;
    const [complete, color, mask] = await Promise.all([
      buildCompleteWorkingSource(source, slot, cutout, spec.canvas, spec.style.accent),
      originalColorPng(source),
      maskPng(polygon, width, height),
    ]);
    masks.push(mask);

    const prefix = index + 1;
    const colorName = `${prefix}1-切片${prefix}-完整彩色人像素材.png`;
    const maskName = `${prefix}2-切片${prefix}-蒙版窗口.png`;
    const tealName = `${prefix}3-切片${prefix}-青绿色窗口效果.png`;
    const isolatedTeal = await isolateWithMask(combinedTeal, mask);
    await Promise.all([
      fs.writeFile(path.join(packageDir, colorName), color),
      fs.writeFile(path.join(packageDir, maskName), mask),
      fs.writeFile(path.join(packageDir, tealName), isolatedTeal),
    ]);
    packageFiles.push(colorName, maskName, tealName);

    const maskRecord = vectorMask(polygon, width, height);
    materialGroups.push({
      name: `切片${prefix} · 完整人像素材与窗口蒙版`,
      opened: true,
      children: [{
        name: `切片${prefix}-灰度完整素材-未链接窗口蒙版`,
        left: complete.left,
        top: complete.top,
        imageData: await imageData(complete.gray),
        vectorMask: maskRecord,
      }],
    });
    greenLayers.push({
      name: `切片${prefix}-青绿色完整素材-未链接窗口蒙版`,
      left: complete.left,
      top: complete.top,
      imageData: await imageData(complete.teal),
      vectorMask: maskRecord,
    });
  }

  const combinedMask = await sharp({ create: { width, height, channels: 3, background: '#000000' } })
    .composite(masks.map((input) => ({ input, blend: 'screen' })))
    .png({ compressionLevel: 9 })
    .toBuffer();
  await Promise.all([
    fs.writeFile(path.join(packageDir, '90-四个切片窗口-黑白蒙版合并版.png'), combinedMask),
    fs.writeFile(path.join(packageDir, '91-四个切片窗口-青绿色效果合并版.png'), combinedTeal),
  ]);
  packageFiles.push('90-四个切片窗口-黑白蒙版合并版.png', '91-四个切片窗口-青绿色效果合并版.png');

  const psdChildren = [
    { name: TOP_LEVEL_NAMES[0], left: 0, top: 0, imageData: await imageData(layerByName(layers, '01-main-background').png) },
    { name: TOP_LEVEL_NAMES[1], opened: true, children: [...materialGroups].reverse() },
    { name: TOP_LEVEL_NAMES[2], opened: true, children: [...greenLayers].reverse() },
    { name: TOP_LEVEL_NAMES[3], left: 0, top: 0, imageData: await imageData(layerByName(layers, '04-text-islands').png) },
    { name: TOP_LEVEL_NAMES[4], left: 0, top: 0, imageData: await imageData(layerByName(layers, '05-graphics').png) },
    {
      name: TOP_LEVEL_NAMES[5],
      left: 0,
      top: 0,
      opacity: Number(spec.style.grain ?? 0.51),
      blendMode: 'screen',
      imageData: await imageData(layerByName(layers, '06-grain').png),
    },
  ];
  const compositeData = await imageData(composite);
  const psdBuffer = writePsdBuffer({ width, height, imageData: compositeData, children: psdChildren });
  const psdName = '00-可编辑海报工程-中文图层.psd';
  await fs.writeFile(path.join(packageDir, psdName), psdBuffer);
  packageFiles.push(psdName);

  const parsed = readPsd(psdBuffer, { useImageData: true });
  const materialGroup = parsed.children.find((layer) => layer.name === TOP_LEVEL_NAMES[1]);
  const greenGroup = parsed.children.find((layer) => layer.name === TOP_LEVEL_NAMES[2]);
  const grain = parsed.children.find((layer) => layer.name === TOP_LEVEL_NAMES[5]);
  const maskLayers = [
    ...(materialGroup?.children ?? []).flatMap((group) => group.children ?? []).filter((layer) => layer.vectorMask),
    ...(greenGroup?.children ?? []).filter((layer) => layer.vectorMask),
  ];
  const verification = {
    serializedBottomToTopOrder: parsed.children.map((layer) => layer.name),
    expectedPhotoshopTopToBottomOrder: [...TOP_LEVEL_NAMES].reverse(),
    grainBlendMode: grain?.blendMode,
    grainOpacity: grain?.opacity,
    materialGroups: materialGroup?.children?.length ?? 0,
    completeColorSourcesExternal: 4,
    vectorMaskLayers: maskLayers.length,
    allMasksUnlinked: maskLayers.every((layer) => layer.vectorMask?.notLink),
    embeddedCompositeMatchesPoster: comparePixels(parsed.imageData?.data ?? [], compositeData.data),
  };
  if (JSON.stringify(verification.serializedBottomToTopOrder) !== JSON.stringify(TOP_LEVEL_NAMES)) {
    throw new Error('Photoshop package top-level serialized order mismatch');
  }
  if (verification.grainBlendMode !== 'screen' || Math.abs((verification.grainOpacity ?? 0) - Number(spec.style.grain ?? 0.51)) > 0.01) {
    throw new Error('Photoshop package grain settings mismatch');
  }
  if (verification.materialGroups !== 4 || verification.vectorMaskLayers !== 8 || !verification.allMasksUnlinked) {
    throw new Error('Photoshop package editable cutout structure mismatch');
  }
  if (!verification.embeddedCompositeMatchesPoster) throw new Error('PSD embedded composite does not match poster preview');

  const verificationName = '00-图层结构验证.json';
  await fs.writeFile(path.join(packageDir, verificationName), JSON.stringify(verification, null, 2));
  packageFiles.push(verificationName);
  const instructionsName = '99-文件说明.txt';
  const instructions = `PS 导入素材包（中文）\r\n\r\n优先打开：${psdName}\r\n最终预览：00-最终效果预览.png\r\n\r\nPSD 顶层从上到下：06 噪点、05 图案、04 文字岛、03 青绿色切片窗口、02 灰度人像切片素材、01 主图背景。\r\n噪点层为“滤色 / Screen”，不透明度 ${Math.round(Number(spec.style.grain ?? 0.51) * 100)}%。\r\n\r\n01–06：六个完整画布语义层。\r\n11/21/31/41：四张完整彩色原始人像素材。\r\n12/22/32/42：四张对应黑白蒙版窗口；白色显示、黑色隐藏。\r\n13/23/33/43：四张对应青绿色窗口效果。\r\n90：四个窗口的黑白蒙版合并版。\r\n91：四个窗口的青绿色效果合并版。\r\n\r\nPSD 内的灰度与青绿色人像均保留完整像素，窗口范围由未链接的矢量蒙版控制。移动人像时不要移动蒙版；调整窗口时不要裁剪底层人像。\r\n`;
  await fs.writeFile(path.join(packageDir, instructionsName), instructions, 'utf8');
  packageFiles.push(instructionsName);

  return {
    directory: PHOTOSHOP_PACKAGE_DIR,
    psd: `${PHOTOSHOP_PACKAGE_DIR}/${psdName}`,
    files: packageFiles.map((file) => `${PHOTOSHOP_PACKAGE_DIR}/${file}`),
    verification,
  };
}
