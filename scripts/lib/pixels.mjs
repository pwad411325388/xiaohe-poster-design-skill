import sharp from 'sharp';

function createXorshift(seed) {
  const numericSeed = Number(seed);
  let state = Number.isFinite(numericSeed) ? Math.trunc(numericSeed) >>> 0 : 1;

  if (state === 0) {
    state = 0x9e3779b9;
  }

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
}

function parseAccent(accent) {
  if (typeof accent !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(accent)) {
    throw new Error(`Invalid accent color; expected #RRGGBB, received ${String(accent)}`);
  }

  return {
    r: Number.parseInt(accent.slice(1, 3), 16),
    g: Number.parseInt(accent.slice(3, 5), 16),
    b: Number.parseInt(accent.slice(5, 7), 16),
  };
}

function accentMatrix({ r, g, b }) {
  const luminance = [0.2126, 0.7152, 0.0722];
  return [r, g, b].map((channel) => {
    const scale = channel / 255;
    return luminance.map((weight) => weight * scale);
  });
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
  const centerX = Math.max(0, Math.min(1, Number(focus.x))) * sourceWidth;
  const centerY = Math.max(0, Math.min(1, Number(focus.y))) * sourceHeight;
  const left = Math.max(0, Math.min(sourceWidth - width, Math.round(centerX - width / 2)));
  const top = Math.max(0, Math.min(sourceHeight - height, Math.round(centerY - height / 2)));
  return { left, top, width, height };
}

export async function renderMainLayer(sourcePath, width, height) {
  return sharp(sourcePath, { failOn: 'error' })
    .rotate()
    .resize(width, height, { fit: 'cover', position: 'attention' })
    .grayscale()
    .linear(1.28, -24)
    .sharpen(0.7)
    .ensureAlpha()
    .png()
    .toBuffer();
}

async function cutoutSource(sourcePath, box, canvas, focus = null, scale = 1) {
  const width = Math.max(1, Math.round(box.width * canvas.width));
  const height = Math.max(1, Math.round(box.height * canvas.height));
  const sourceScale = Number.isFinite(Number(scale)) && Number(scale) > 0 ? Number(scale) : 1;
  let image;

  if (focus && Number.isFinite(Number(focus.x)) && Number.isFinite(Number(focus.y))) {
    const oriented = await sharp(sourcePath, { failOn: 'error' }).rotate().toBuffer();
    const metadata = await sharp(oriented).metadata();
    if (!metadata.width || !metadata.height) throw new Error(`Unable to focus crop source: ${sourcePath}`);
    image = sharp(oriented).extract(focusCrop(metadata.width, metadata.height, width, height, focus, sourceScale));
  } else {
    image = sharp(sourcePath, { failOn: 'error' })
      .rotate()
      .resize(width, height, { fit: 'cover', position: box.sourcePosition || 'attention' });
  }

  return { image: image.resize(width, height, { fit: 'fill' }), width, height };
}

export async function renderCutoutMaterialLayer(sourcePath, box, canvas, focus = null, scale = 1) {
  const { image } = await cutoutSource(sourcePath, box, canvas, focus, scale);
  return image
    .grayscale()
    .linear(1.18, -12)
    .ensureAlpha()
    .png()
    .toBuffer();
}

export async function renderCutoutLayer(sourcePath, box, canvas, accent, focus = null, scale = 1) {
  const tint = parseAccent(accent);
  const { image } = await cutoutSource(sourcePath, box, canvas, focus, scale);
  return image
    .recomb(accentMatrix(tint))
    .linear(1.18, -12)
    .ensureAlpha()
    .png()
    .toBuffer();
}

export async function renderGrainLayer(width, height, intensity, seed) {
  const random = createXorshift(seed);
  const pixels = Buffer.alloc(width * height * 4);

  for (let offset = 0; offset < pixels.length; offset += 4) {
    const uniform = random() / 0x1_0000_0000;
    const value = Math.min(255, Math.max(0, Math.round((uniform * 2 - 1) * 255 * 1.5)));

    pixels[offset] = value;
    pixels[offset + 1] = value;
    pixels[offset + 2] = value;
    pixels[offset + 3] = 255;
  }

  return sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer();
}
