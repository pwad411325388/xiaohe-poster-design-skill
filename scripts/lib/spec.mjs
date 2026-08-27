export const HEX = /^#[0-9a-f]{6}$/i;
export const UNIT_FIELDS = ['x', 'y', 'width', 'height'];
export const TEXT_ISLAND_LINE_COUNTS = Object.freeze({
  island1: 3,
  island2: 3,
  island3: 3,
  island4: 3,
  island5: 4,
});

const DEFAULTS = {
  version: 1,
  canvas: { width: 1200, height: 1800, background: '#090909' },
  style: { accent: '#29D3B2', grain: 0.42, seed: 1 },
  layout: { template: 'reference-01' },
  exports: { png: true, svg: true, psd: true, layers: true, photoshopPackage: null },
};

export function normalizeSpec(spec = {}) {
  const normalized = structuredClone(spec);
  normalized.version ??= DEFAULTS.version;
  normalized.canvas ??= {};
  normalized.canvas.width ??= DEFAULTS.canvas.width;
  normalized.canvas.height ??= DEFAULTS.canvas.height;
  normalized.canvas.background ??= DEFAULTS.canvas.background;
  normalized.sources ??= [];
  normalized.protectedRegions ??= [];
  normalized.copy ??= {};
  for (const field of ['subject', 'headline', 'subtitle', 'footer']) normalized.copy[field] ??= '';
  normalized.copy.topLabel ??= 'Control the moment';
  normalized.copy.infoLines ??= [
    'WORLDWIDE PORTRAIT ARCHIVE',
    'THE FIRST SIGNAL / ISSUE 01',
    'CONCEPTUAL PORTRAIT STUDY',
  ];
  normalized.copy.micro ??= [];
  normalized.copy.footerGroups ??= [];
  normalized.copy.textIslands ??= {};
  normalized.style ??= {};
  normalized.style.accent ??= DEFAULTS.style.accent;
  normalized.style.grain ??= DEFAULTS.style.grain;
  normalized.style.seed ??= DEFAULTS.style.seed;
  normalized.layout ??= {};
  normalized.layout.template ??= DEFAULTS.layout.template;
  if (normalized.layout.template === 'reference-01') delete normalized.layout.headlineOverrides;
  normalized.exports ??= {};
  for (const field of ['png', 'svg', 'psd', 'layers']) normalized.exports[field] ??= true;
  if (!Object.hasOwn(normalized.exports, 'photoshopPackage')) normalized.exports.photoshopPackage = null;
  return normalized;
}

export function validateSpec(spec) {
  const errors = [];
  const canvas = spec?.canvas ?? {};
  if (spec?.version !== 1) errors.push('version must be exactly 1');
  for (const field of ['width', 'height']) {
    if (!Number.isInteger(canvas[field]) || canvas[field] < 600 || canvas[field] > 6000) {
      errors.push(`canvas.${field} must be an integer from 600 to 6000`);
    }
  }
  if (!HEX.test(canvas.background ?? '')) errors.push('canvas.background must be a #RRGGBB color');
  if (!HEX.test(spec?.style?.accent ?? '')) errors.push('style.accent must be a #RRGGBB color');
  if (!Number.isFinite(spec?.style?.grain) || spec.style.grain < 0 || spec.style.grain > 1) {
    errors.push('style.grain must be a number from 0 to 1');
  }
  if (spec?.exports?.png !== true) errors.push('exports.png must be true because the flat poster is a mandatory deliverable');
  if (typeof spec?.exports?.photoshopPackage !== 'boolean') {
    errors.push('exports.photoshopPackage must be true or false after asking the user whether they want the complete package');
  }
  const sources = Array.isArray(spec?.sources) ? spec.sources : [];
  sources.forEach((source, index) => {
    if (source?.originalPath !== undefined && (typeof source.originalPath !== 'string' || !source.originalPath.trim())) {
      errors.push(`sources[${index}].originalPath must be a non-empty string when supplied`);
    }
  });
  const mainSources = sources.filter((source) => source?.role === 'main');
  const auxiliarySources = sources.filter((source) => source?.role === 'auxiliary' || source?.role === 'aux');
  if (mainSources.length !== 1) errors.push('spec must contain exactly one main source');
  if (auxiliarySources.length !== 4) errors.push('spec must contain exactly four auxiliary sources');
  if (!Array.isArray(spec?.protectedRegions)) {
    errors.push('protectedRegions must be an array');
  } else {
    spec.protectedRegions.forEach((region, index) => {
      for (const field of UNIT_FIELDS) {
        if (!Number.isFinite(region?.[field]) || region[field] < 0 || region[field] > 1) {
          errors.push(`protectedRegions[${index}].${field} must be a number from 0 to 1`);
        }
      }
      if (typeof region?.x === 'number' && typeof region?.width === 'number' && region.x + region.width > 1) {
        errors.push(`protectedRegions[${index}] exceeds the canvas width`);
      }
      if (typeof region?.y === 'number' && typeof region?.height === 'number' && region.y + region.height > 1) {
        errors.push(`protectedRegions[${index}] exceeds the canvas height`);
      }
    });
  }
  const sourceIds = new Set(sources.map((source) => source?.id));
  if (!Array.isArray(spec?.cutoutSlots) || spec.cutoutSlots.length !== 4) {
    errors.push('cutoutSlots must contain exactly four stable slots');
  } else {
    spec.cutoutSlots.forEach((slot, index) => {
      const expectedSlotId = `cutout-${index + 1}`;
      if (slot?.slotId !== expectedSlotId) errors.push(`cutoutSlots[${index}].slotId must be ${expectedSlotId}`);
      if (!sourceIds.has(slot?.sourceId)) errors.push(`cutoutSlots[${index}].sourceId must reference a declared source`);
      if (!Array.isArray(slot?.polygon) || slot.polygon.length < 3) errors.push(`cutoutSlots[${index}].polygon must contain at least three points`);
      const transform = slot?.sourceTransform;
      if (!transform || !Number.isFinite(transform.scale) || transform.scale <= 0) {
        errors.push(`cutoutSlots[${index}].sourceTransform.scale must be a positive number`);
      }
      if (transform?.scaleX !== undefined || transform?.scaleY !== undefined) {
        if (!Number.isFinite(transform.scaleX) || !Number.isFinite(transform.scaleY) || transform.scaleX !== transform.scaleY) {
          errors.push(`cutoutSlots[${index}].sourceTransform must use uniform scale`);
        }
      }
      for (const field of ['x', 'y']) {
        if (!Number.isFinite(transform?.focus?.[field]) || transform.focus[field] < 0 || transform.focus[field] > 1) {
          errors.push(`cutoutSlots[${index}].sourceTransform.focus.${field} must be a number from 0 to 1`);
        }
      }
    });
  }
  if (!(Array.isArray(spec?.copy?.micro) && spec.copy.micro.length <= 1 && spec.copy.micro.every((line) => typeof line === 'string'))) {
    errors.push('copy.micro must contain zero or one string');
  }
  for (const field of ['subject', 'headline', 'subtitle']) {
    if (typeof spec?.copy?.[field] !== 'string' || !spec.copy[field].trim()) {
      errors.push(`copy.${field} must be a non-empty string confirmed by the user`);
    }
  }
  const textIslands = spec?.copy?.textIslands;
  if (!textIslands || Array.isArray(textIslands) || typeof textIslands !== 'object') {
    errors.push('copy.textIslands must be an object containing island1 through island5');
  } else {
    for (const [field, lineCount] of Object.entries(TEXT_ISLAND_LINE_COUNTS)) {
      const lines = textIslands[field];
      if (!(Array.isArray(lines) && lines.length === lineCount && lines.every((line) => typeof line === 'string'))) {
        errors.push(`copy.textIslands.${field} must contain exactly ${lineCount} strings`);
      }
    }
    for (const field of Object.keys(textIslands)) {
      if (!(field in TEXT_ISLAND_LINE_COUNTS)) errors.push(`copy.textIslands.${field} is not supported`);
    }
  }
  if (spec?.copy?.topLabel !== undefined && typeof spec.copy.topLabel !== 'string') errors.push('copy.topLabel must be a string');
  const infoLines = spec?.copy?.infoLines;
  if (infoLines !== undefined && !(Array.isArray(infoLines) && infoLines.length === 3 && infoLines.every((line) => typeof line === 'string'))) {
    errors.push('copy.infoLines must contain exactly three strings');
  }
  const footerGroups = spec?.copy?.footerGroups;
  const validFooterGroups = Array.isArray(footerGroups) && (
    footerGroups.length === 0 ||
    (footerGroups.length === 2 && footerGroups.every((group) => (
      Array.isArray(group) && group.length === 2 && group.every((line) => typeof line === 'string')
    )))
  );
  if (!validFooterGroups) {
    errors.push('copy.footerGroups must be empty or contain exactly two groups of two strings');
  }
  if (spec?.layout?.template !== 'reference-01') errors.push('layout.template must be reference-01');
  if (spec?.layout?.textIslandBodyColor !== undefined && !HEX.test(spec.layout.textIslandBodyColor)) {
    errors.push('layout.textIslandBodyColor must be a #RRGGBB color');
  }
  const infoText = spec?.layout?.infoText;
  if (infoText !== undefined) {
    if (!['center', 'start'].includes(infoText.align)) errors.push('layout.infoText.align must be center or start');
    for (const field of ['fontFactors', 'baselineFactors']) {
      if (!Array.isArray(infoText[field]) || infoText[field].length !== 3 || !infoText[field].every((value) => Number.isFinite(value) && value > 0 && value < 1)) {
        errors.push(`layout.infoText.${field} must contain three numbers between 0 and 1`);
      }
    }
  }
  const headlineOverrides = spec?.layout?.headlineOverrides;
  if (headlineOverrides !== undefined) {
    for (const field of ['whoScaleX', 'subjectScaleX']) {
      if (!Number.isFinite(headlineOverrides?.[field]) || headlineOverrides[field] <= 0) {
        errors.push(`layout.headlineOverrides.${field} must be a positive number`);
      }
    }
    if (!Number.isFinite(headlineOverrides?.connectorX) || headlineOverrides.connectorX < 0) {
      errors.push('layout.headlineOverrides.connectorX must be a non-negative number');
    }
    if (!Number.isFinite(headlineOverrides?.opacity) || headlineOverrides.opacity < 0 || headlineOverrides.opacity > 1) {
      errors.push('layout.headlineOverrides.opacity must be a number from 0 to 1');
    }
  }
  return errors;
}

export function assertValidSpec(spec) {
  const normalized = normalizeSpec(spec);
  const errors = validateSpec(normalized);
  if (errors.length) throw new Error(`Invalid poster spec:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  return normalized;
}
