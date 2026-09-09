import assert from 'node:assert/strict';
import test from 'node:test';
import { getMemoryPhotoIdentity } from '../src/game/MemoryPhotoCatalog.ts';

test('each photo hitbox resolves to the same numbered image and title as its wall print', () => {
  const identities = Array.from({ length: 36 }, (_, index) => getMemoryPhotoIdentity(index));

  assert.equal(new Set(identities.map((item) => item.assetPath)).size, 36);
  assert.equal(new Set(identities.map((item) => item.visualName)).size, 36);
  assert.deepEqual(identities[0], {
    assetPath: '/assets/dreamcore/photos/01.jpg',
    visualName: 'memory_photo_01_visual',
    title: '幼儿园午休'
  });
  assert.deepEqual(identities[12], {
    assetPath: '/assets/dreamcore/photos/13.jpg',
    visualName: 'memory_photo_13_visual',
    title: '公园旋转马'
  });
  assert.deepEqual(identities[35], {
    assetPath: '/assets/dreamcore/photos/36.jpg',
    visualName: 'memory_photo_36_visual',
    title: '旧玩具商铺'
  });
});

test('invalid photo indexes fail instead of silently showing another photo', () => {
  assert.throws(() => getMemoryPhotoIdentity(-1), RangeError);
  assert.throws(() => getMemoryPhotoIdentity(36), RangeError);
});
