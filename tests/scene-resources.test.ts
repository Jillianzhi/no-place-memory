import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { disposeSceneResources } from '../src/game/SceneResources.ts';

test('scene disposal releases unique GPU resources once and preserves reusable materials and textures', () => {
  const root = new THREE.Group();
  const sharedTexture = new THREE.Texture();
  const sharedMaterial = new THREE.MeshBasicMaterial({ map: sharedTexture });
  const texture = new THREE.Texture();
  const alternate = new THREE.Texture();
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const geometry = new THREE.BoxGeometry();
  const first = new THREE.Mesh(geometry, material);
  first.userData.alternateTexture = alternate;
  root.add(first, new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, sharedMaterial));
  const counts = new Map<unknown, number>();
  for (const resource of [geometry, material, texture, alternate, sharedMaterial, sharedTexture]) {
    resource.addEventListener('dispose', () => counts.set(resource, (counts.get(resource) ?? 0) + 1));
  }
  disposeSceneResources(root, [sharedMaterial]);
  for (const resource of [geometry, material, texture, alternate]) assert.equal(counts.get(resource), 1);
  assert.equal(counts.get(sharedMaterial), undefined);
  assert.equal(counts.get(sharedTexture), undefined);
});
