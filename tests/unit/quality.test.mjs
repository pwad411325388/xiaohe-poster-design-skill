import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkCopyIntegrity,
  checkGeometry,
  checkGeometryWarnings,
} from '../../scripts/lib/quality.mjs';

test('checkGeometry reports headline collisions', () => {
  const issues = checkGeometry({ text: { headline: { x: 0.1, y: 0.1, width: 0.4, height: 0.2 } }, cutouts: [{ x: 0.2, y: 0.15, width: 0.2, height: 0.2 }] }, []);
  assert.match(issues.join('\n'), /headline overlaps cutout/);
});

test('checkCopyIntegrity reports exact copy mismatches', () => {
  const issues = checkCopyIntegrity({ copy: { headline: 'EXACT' } }, '<svg><text>ALTERED</text></svg>');
  assert.match(issues.join('\n'), /headline copy mismatch/);
});

test('checkCopyIntegrity checks all five numbered text islands', () => {
  const issues = checkCopyIntegrity({
    copy: {
      textIslands: {
        island1: ['ONE', 'TWO', 'THREE'],
        island2: ['FOUR', 'FIVE', 'SIX'],
        island3: ['SEVEN', 'EIGHT', 'NINE'],
        island4: ['TEN', 'ELEVEN', 'TWELVE'],
        island5: ['THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN'],
      },
    },
  }, '<svg><text>ONE</text></svg>');

  assert.match(issues.join('\n'), /text island 5 copy mismatch: SIXTEEN/);
});

test('protected-region overlap warns without overriding locked cutout polygons', () => {
  const layout = {
    cutouts: [{ x: 0.2, y: 0.2, width: 0.2, height: 0.2 }],
  };
  const protectedRegions = [{ x: 0.25, y: 0.25, width: 0.1, height: 0.1 }];

  assert.doesNotMatch(checkGeometry(layout, protectedRegions).join('\n'), /protected region/);
  assert.match(checkGeometryWarnings(layout, protectedRegions).join('\n'), /preserve the locked polygon/);
});

test('text island 5 accepts the locked right-rule gap', () => {
  const issues = checkGeometry({
    text: {
      islands: {
        island5: { x: 0.935, rightRuleX: 0.951, minRightGap: 0.016, align: 'end' },
      },
    },
    cutouts: [],
  });

  assert.doesNotMatch(issues.join('\n'), /text island 5/);
});

test('text island 5 rejects copy that enters the right-rule gap', () => {
  const issues = checkGeometry({
    text: {
      islands: {
        island5: { x: 0.950, rightRuleX: 0.951, minRightGap: 0.016, align: 'end' },
      },
    },
    cutouts: [],
  });

  assert.match(issues.join('\n'), /minimum gap before the right rule/);
});
