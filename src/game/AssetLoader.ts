import * as THREE from 'three';

export class AssetLoader {

  async loadSceneModel(path: string): Promise<THREE.Group | null> {
    // The production build currently uses procedural scenes. Avoid a slow
    // network round-trip for model URLs that are intentionally not shipped.
    if (!path) return null;
    try {
      const response = await fetch(path, { method: 'HEAD' });
      if (!response.ok) return null;
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const gltf = await new GLTFLoader().loadAsync(path);
      const root = gltf.scene;
      root.traverse((object) => {
        object.userData.source = 'gltf';
        if (object.name.startsWith('hotspot_') || object.name.startsWith('exit_')) {
          object.userData.hotspotId = object.name;
          object.userData.isHotspot = true;
        }
      });
      return root;
    } catch {
      return null;
    }
  }
}
