import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { probeSources } from './lib/assets.mjs';
import { compositeLayers, renderSemanticLayers } from './lib/layers.mjs';
import { resolveLayout } from './lib/layout.mjs';
import { buildPhotoshopPackage } from './lib/photoshop-package.mjs';
import { exportPsd } from './lib/psd.mjs';
import { checkCopyIntegrity, checkGeometry, checkGeometryWarnings } from './lib/quality.mjs';
import { assertValidSpec } from './lib/spec.mjs';
import { buildEditableSvg } from './lib/svg.mjs';

function argument(name) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : null; }
const specArg = argument('--spec');
const outArg = argument('--out');
if (!specArg || !outArg) throw new Error('Usage: node scripts/render.mjs --spec <spec.json> --out <empty-directory>');
const specPath = path.resolve(specArg);
const outDir = path.resolve(outArg);
try { if ((await fs.readdir(outDir)).length) throw new Error(`Refusing to overwrite nonempty output directory: ${outDir}`); } catch (error) { if (error.code === 'ENOENT') await fs.mkdir(outDir, { recursive: true }); else throw error; }

let spec = assertValidSpec(JSON.parse(await fs.readFile(specPath, 'utf8')));
const specDir = path.dirname(specPath);
spec.sources = await probeSources(spec.sources.map((source) => ({
  ...source,
  path: path.resolve(specDir, source.path),
  ...(source.originalPath ? { originalPath: path.resolve(specDir, source.originalPath) } : {}),
})));
const layout = await resolveLayout(spec.layout.template);
const svg = await buildEditableSvg(spec, layout);
const layers = await renderSemanticLayers(spec, layout);
const composite = await compositeLayers(layers, spec.canvas);
const layerDir = path.join(outDir, 'layers');
await fs.mkdir(layerDir);
await Promise.all(layers.map((layer) => fs.writeFile(path.join(layerDir, `${layer.name}.png`), layer.png)));
await fs.writeFile(path.join(outDir, 'poster.png'), composite);
await fs.writeFile(path.join(outDir, 'poster.svg'), svg);
await fs.writeFile(path.join(outDir, 'poster-spec.json'), JSON.stringify(spec, null, 2));
let psdError = null;
try { await fs.writeFile(path.join(outDir, 'poster.psd'), await exportPsd(spec.canvas.width, spec.canvas.height, layers, composite)); } catch (error) { psdError = error.message; }
const requiredFiles = ['poster.png', 'poster.svg', 'poster-spec.json', ...layers.map((layer) => `layers/${layer.name}.png`)];
if (!psdError) requiredFiles.push('poster.psd');
let deliveryPackage = null;
let packageError = null;
if (spec.exports.photoshopPackage) {
  try {
    deliveryPackage = await buildPhotoshopPackage({ spec, layout, layers, composite, outDir });
    requiredFiles.push(...deliveryPackage.files);
  } catch (error) {
    packageError = error.message;
  }
}
const issues = [...checkGeometry(layout, spec.protectedRegions), ...checkCopyIntegrity(spec, svg)];
const warnings = checkGeometryWarnings(layout, spec.protectedRegions);
const manifest = {
  width: spec.canvas.width,
  height: spec.canvas.height,
  layerOrder: layers.map((layer) => layer.name),
  layout,
  paths: { outDir, specPath, sources: spec.sources.map((source) => source.path) },
  psdError,
  packageError,
  deliveryPackageRequested: spec.exports.photoshopPackage,
  deliveryPackage,
  requiredFiles,
  issues,
  warnings,
};
await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ outDir, issues, warnings, psdError, packageError }, null, 2));
if (issues.length || psdError || packageError) process.exitCode = 2;
