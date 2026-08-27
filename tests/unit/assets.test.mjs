import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { probeSources } from '../../scripts/lib/assets.mjs';

const fixturesDir = resolve(dirname(fileURLToPath(import.meta.url)), '../fixtures');
const mainPath = resolve(fixturesDir, 'main.png');
const fieldGuideDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../references/field-guides',
);

async function fingerprint(filePath) {
  const [contents, stat] = await Promise.all([fs.readFile(filePath), fs.stat(filePath)]);

  return {
    hash: createHash('sha256').update(contents).digest('hex'),
    size: stat.size,
    mtimeMs: stat.mtimeMs,
  };
}

test('probes the main portrait without rewriting its fixture', async () => {
  const before = await fingerprint(mainPath);

  const [source] = await probeSources([{ id: 'main', path: mainPath, role: 'main' }]);
  const after = await fingerprint(mainPath);

  assert.equal(source.path, resolve(mainPath));
  assert.equal(source.width, 1200);
  assert.equal(source.height, 1800);
  assert.equal(source.usable, true);
  assert.equal(source.warning, null);
  assert.deepEqual(after, before);
});

test('rejects a missing source file', async () => {
  const missingPath = resolve(fixturesDir, 'missing.png');

  await assert.rejects(
    probeSources([{ id: 'missing', path: missingPath, role: 'aux' }]),
    (error) => {
      assert.match(error.message, /Unable to probe image/);
      assert.match(error.message, new RegExp(missingPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      return true;
    },
  );
});

test('ships user-decision visual guides for all mapped poster fields', async () => {
  const guides = [
    'reference-01-text-islands-map.png',
    'headline.png',
    'top-label.png',
    'subtitle.png',
    'info-lines.png',
    'text-island-1.png',
    'text-island-2.png',
    'text-island-3.png',
    'text-island-4.png',
    'text-island-5.png',
    'footer-groups.png',
    'cutout-slots-map.png',
  ];

  for (const guide of guides) {
    const metadata = await fs.stat(resolve(fieldGuideDir, guide));
    assert.ok(metadata.size > 0, `${guide} should be a non-empty guide image`);
  }
});
