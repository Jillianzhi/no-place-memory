import * as THREE from 'three';

/** Release scene-owned GPU allocations while retaining reusable kit resources. */
export function disposeSceneResources(root: THREE.Object3D, shared: unknown[]): void {
  const retained = new Set<unknown>();
  for (const value of shared) {
    retained.add(value);
    if (value instanceof THREE.Material) {
      for (const property of Object.values(value)) {
        if (property instanceof THREE.Texture) retained.add(property);
      }
    }
  }
  const resources = new Set<THREE.BufferGeometry | THREE.Material | THREE.Texture>();
  const collectTexture = (value: unknown): void => {
    if (value instanceof THREE.Texture) resources.add(value);
  };
  root.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) resources.add(mesh.geometry);
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const material of materials) {
      resources.add(material);
      Object.values(material).forEach(collectTexture);
      Object.values(material.userData).forEach(collectTexture);
    }
    Object.values(object.userData).forEach(collectTexture);
  });
  for (const resource of resources) {
    if (!retained.has(resource)) resource.dispose();
  }
}
