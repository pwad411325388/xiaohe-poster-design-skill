import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultLayoutDir = resolve(
  fileURLToPath(new URL('../../assets/layouts', import.meta.url)),
);

export function rectanglesOverlap(a, b, padding = 0.015) {
  return a.x < b.x + b.width + padding &&
    a.x + a.width + padding > b.x &&
    a.y < b.y + b.height + padding &&
    a.y + a.height + padding > b.y;
}

export async function resolveLayout(templateId = 'reference-01', layoutDir = defaultLayoutDir) {
  if (templateId !== 'reference-01') {
    throw new Error('Only reference-01 is supported');
  }

  const filePath = resolve(layoutDir, 'reference-01.json');
  const template = JSON.parse(await readFile(filePath, 'utf8'));
  if (template.id !== 'reference-01') {
    throw new Error("Layout template id mismatch for 'reference-01'");
  }

  return {
    id: template.id,
    mode: template.mode,
    text: template.text,
    cutouts: template.cutouts,
  };
}
