import { access, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import { rectanglesOverlap } from './layout.mjs';

export const SEMANTIC_LAYER_NAMES = [
  '01-main-background',
  '02-portrait-cutout-materials',
  '03-green-cutout-windows',
  '04-text-islands',
  '05-graphics',
  '06-grain',
];

export function checkGeometry(layout, protectedRegions = []) {
  const issues = [];
  const headline = layout?.text?.headline;
  for (const [index, cutout] of (layout?.cutouts ?? []).entries()) {
    if (headline && rectanglesOverlap(headline, cutout)) issues.push(`headline overlaps cutout ${index + 1}`);
  }
  const island5 = layout?.text?.islands?.island5;
  if (island5) {
    const anchorX = Number(island5.x);
    const rightRuleX = Number(island5.rightRuleX);
    const minRightGap = Number(island5.minRightGap);
    if (island5.align !== 'end') issues.push('text island 5 must be right-aligned before the right rule');
    if (![anchorX, rightRuleX, minRightGap].every(Number.isFinite) || rightRuleX - anchorX + Number.EPSILON < minRightGap) {
      issues.push('text island 5 must keep its configured minimum gap before the right rule');
    }
  }
  return issues;
}

export function checkGeometryWarnings(layout, protectedRegions = []) {
  const warnings = [];
  for (const [index, cutout] of (layout?.cutouts ?? []).entries()) {
    if (protectedRegions.some((region) => rectanglesOverlap(cutout, region))) {
      warnings.push(`cutout ${index + 1} overlaps a protected region; preserve the locked polygon and ask the user how to handle the overlap`);
    }
  }
  const headline = layout?.text?.headline;
  if (headline && protectedRegions.some((region) => rectanglesOverlap(headline, region))) {
    warnings.push('headline overlaps a protected region; show the affected crop and ask the user how to handle it');
  }
  return warnings;
}

export function checkCopyIntegrity(spec, svg) {
  const issues = [];
  for (const field of ['subject', 'headline', 'subtitle', 'footer']) {
    const value = spec.copy?.[field] ?? '';
    if (value && !svg.includes(value)) issues.push(`${field} copy mismatch`);
  }
  for (const value of spec.copy?.micro ?? []) if (value && !svg.includes(value)) issues.push(`micro copy mismatch: ${value}`);
  if (spec.copy?.topLabel && !svg.includes(spec.copy.topLabel)) issues.push('topLabel copy mismatch');
  for (const value of spec.copy?.infoLines ?? []) if (value && !svg.includes(value)) issues.push(`info line copy mismatch: ${value}`);
  for (const group of spec.copy?.footerGroups ?? []) {
    for (const value of group) if (value && !svg.includes(value)) issues.push(`footer group copy mismatch: ${value}`);
  }
  for (const [islandId, lines] of Object.entries(spec.copy?.textIslands ?? {})) {
    for (const value of lines) {
      if (value && !svg.includes(value)) issues.push(`text island ${islandId.replace('island', '')} copy mismatch: ${value}`);
    }
  }
  return issues;
}

export async function checkOutputFiles(outDir, requiredFiles, canvas) {
  const issues = [];
  if (Array.isArray(canvas.layerOrder) && JSON.stringify(canvas.layerOrder) !== JSON.stringify(SEMANTIC_LAYER_NAMES)) {
    issues.push('semantic layer order mismatch');
  }
  for (const relative of requiredFiles) {
    const file = path.resolve(outDir, relative);
    try { if ((await stat(file)).size <= 0) issues.push(`empty output: ${relative}`); } catch { issues.push(`missing output: ${relative}`); }
  }
  const poster = path.resolve(outDir, 'poster.png');
  try {
    await access(poster);
    const metadata = await sharp(poster).metadata();
    if (metadata.width !== canvas.width || metadata.height !== canvas.height) issues.push('poster.png dimensions mismatch');
  } catch { issues.push('invalid poster.png'); }
  for (const name of SEMANTIC_LAYER_NAMES) {
    const layerPath = path.resolve(outDir, 'layers', `${name}.png`);
    try {
      const metadata = await sharp(layerPath).metadata();
      if (metadata.width !== canvas.width || metadata.height !== canvas.height) {
        issues.push(`${name}.png dimensions mismatch`);
      }
    } catch {
      issues.push(`invalid semantic layer: ${name}.png`);
    }
  }
  if (canvas.packageError) issues.push(`Photoshop delivery package failed: ${canvas.packageError}`);
  if (canvas.deliveryPackageRequested && !canvas.deliveryPackage) issues.push('missing requested complete Photoshop delivery package record');
  if (!canvas.deliveryPackageRequested && canvas.deliveryPackage) issues.push('unexpected Photoshop delivery package when the user did not request it');
  return issues;
}
