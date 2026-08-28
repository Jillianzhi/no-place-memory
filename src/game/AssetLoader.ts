import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AssetLoader {
  private readonly loader = new GLTFLoader();

  async loadSceneModel(path: string): Promise<THREE.Group | null> {
    try {
      const response = await fetch(path, { method: 'HEAD' });
      if (!response.ok) return null;
      const gltf = await this.loader.loadAsync(path);
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
