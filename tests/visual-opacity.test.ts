import assert from 'node:assert/strict';
import test from 'node:test';
import { applyVisualOpacity } from '../src/game/VisualOpacity.ts';

test('restoring a photo section does not turn its glass overlay opaque', () => {
  const glass = { opacity: 0.02, transparent: true, userData: {} };

  applyVisualOpacity(glass, 0.84);
  assert.equal(glass.opacity, 0.0168);

  applyVisualOpacity(glass, 1);
  assert.equal(glass.opacity, 0.02);
});

test('opaque frame materials still follow the requested group opacity', () => {
  const frame = { opacity: 1, transparent: false, userData: {} };

  applyVisualOpacity(frame, 0.84);
  assert.equal(frame.opacity, 0.84);
  assert.equal(frame.transparent, true);

  applyVisualOpacity(frame, 1);
  assert.equal(frame.opacity, 1);
});
