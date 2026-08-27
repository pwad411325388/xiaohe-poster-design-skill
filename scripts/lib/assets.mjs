import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const MAX_PIXELS = 36_000_000;

const SUPPORTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'tiff', 'avif']);

export async function probeSources(sources) {
  const probedSources = [];

  for (const source of sources) {
    const sourcePath = path.resolve(source.path);
    let metadata;

    try {
      await fs.access(sourcePath);
      metadata = await sharp(sourcePath, { limitInputPixels: MAX_PIXELS }).metadata();
    } catch (cause) {
      if (cause.message?.includes('Input image exceeds pixel limit')) {
        throw new Error(`Source exceeds maximum pixel count of ${MAX_PIXELS}: ${sourcePath}`, { cause });
      }

      throw new Error(`Unable to probe image: ${sourcePath}`, { cause });
    }

    const { width, height, format } = metadata;

    if (!width || !height) {
      throw new Error(`Unable to determine dimensions for source: ${sourcePath}`);
    }

    if (!SUPPORTED_FORMATS.has(format)) {
      throw new Error(`Unsupported source format: ${format ?? 'unknown'}: ${sourcePath}`);
    }

    if (width * height > MAX_PIXELS) {
      throw new Error(`Source exceeds maximum pixel count of ${MAX_PIXELS}: ${sourcePath}`);
    }

    const minDimension = Math.min(width, height);

    probedSources.push({
      ...source,
      path: sourcePath,
      width,
      height,
      format,
      usable: minDimension >= 720,
      warning: minDimension < 1000 ? 'low-resolution' : null,
    });
  }

  return probedSources;
}
