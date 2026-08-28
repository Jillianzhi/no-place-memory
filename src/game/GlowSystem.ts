import * as THREE from 'three';

export class GlowSystem {
  private readonly glowables = new Set<THREE.Object3D>();

  register(object: THREE.Object3D): void {
    this.glowables.add(object);
  }

  pulse(time: number): void {
    const scale = 1 + Math.sin(time * 0.003) * 0.025;
    for (const object of this.glowables) {
      object.scale.multiplyScalar(scale / (object.userData.lastGlowScale ?? 1));
      object.userData.lastGlowScale = scale;
    }
  }

  markHit(object: THREE.Object3D | null): void {
    for (const item of this.glowables) {
      item.userData.isCurrentHit = false;
    }
    if (object) object.userData.isCurrentHit = true;
  }
}
