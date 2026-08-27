import { createRequire } from 'node:module';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { writePsdBuffer, initializeCanvas } = require('ag-psd');

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

async function rgbaPsdImage(png, width, height) {
  const { data, info } = await sharp(png).ensureAlpha().resize(width, height, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data };
}

export async function exportPsd(width, height, layers, compositePng) {
  const children = [];
  // The tested Photoshop build presents ag-psd children in reverse order.
  // Serialize the semantic stack bottom-to-top so Photoshop displays 06→01
  // and keeps the main portrait at the bottom of the Layers panel.
  for (const layer of layers) {
    children.push({
      name: layer.name,
      top: 0,
      left: 0,
      // ag-psd expects opacity normalized to 0–1, not an 8-bit integer.
      opacity: Number(layer.opacity ?? 1),
      blendMode: layer.blendMode || 'normal',
      imageData: await rgbaPsdImage(layer.png, width, height),
    });
  }
  return writePsdBuffer({ width, height, imageData: await rgbaPsdImage(compositePng, width, height), children });
}
