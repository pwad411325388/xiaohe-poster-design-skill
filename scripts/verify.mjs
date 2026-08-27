import fs from 'node:fs/promises';
import path from 'node:path';

import { checkOutputFiles } from './lib/quality.mjs';

const outDir = process.argv[2];
if (!outDir) throw new Error('Usage: node scripts/verify.mjs <output-directory>');
const resolved = path.resolve(outDir);
const manifest = JSON.parse(await fs.readFile(path.join(resolved, 'manifest.json'), 'utf8'));
const issues = [...(manifest.issues ?? []), ...(await checkOutputFiles(resolved, manifest.requiredFiles ?? [], manifest))];
const warnings = manifest.warnings ?? [];
console.log(JSON.stringify({ ok: issues.length === 0, issues, warnings }, null, 2));
if (issues.length) process.exitCode = 2;
