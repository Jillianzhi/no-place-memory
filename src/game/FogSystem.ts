import * as THREE from 'three';

export class FogSystem {
  readonly group = new THREE.Group();
  private readonly sheets: THREE.Mesh[] = [];
  private readonly fogTexture: THREE.Texture;

  constructor() {
    this.fogTexture = new THREE.TextureLoader().load('/assets/generated/shared_vfx/shared_vfx_fog_noise.png');
    this.fogTexture.wrapS = THREE.RepeatWrapping;
    this.fogTexture.wrapT = THREE.RepeatWrapping;
    this.fogTexture.repeat.set(1.5, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0xbcc6ff,
      map: this.fogTexture,
      alphaMap: this.fogTexture,
      transparent: true,
      opacity: 0.075,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    for (let i = 0; i < 8; i += 1) {
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 1.2), material.clone());
      sheet.position.set((Math.random() - 0.5) * 1.8, 0.45 + Math.random() * 1.8, -1.15 + Math.random() * 1.6);
      sheet.rotation.y = (Math.random() - 0.5) * 0.5;
      sheet.userData.speed = 0.15 + Math.random() * 0.2;
      this.group.add(sheet);
      this.sheets.push(sheet);
    }
    this.group.name = 'blue_violet_fog';
  }

  update(time: number): void {
    this.fogTexture.offset.set((time * 0.000006) % 1, (time * 0.000002) % 1);
    for (const sheet of this.sheets) {
      sheet.position.x = Math.sin(time * 0.00012 * sheet.userData.speed + sheet.id) * 0.75;
    }
  }
}
