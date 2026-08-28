import * as THREE from 'three';

export class ParticleSystem {
  readonly group = new THREE.Group();
  readonly points: THREE.Points;
  private readonly positions: Float32Array;
  private readonly basePositions: Float32Array;
  private readonly seeds: Float32Array;
  private readonly dust: THREE.Points;
  private readonly dustPositions: Float32Array;
  private readonly dustSpeeds: Float32Array;
  private readonly petals: THREE.Mesh[] = [];
  private lastTime = 0;

  constructor(count = 320) {
    const loader = new THREE.TextureLoader();
    const softTexture = loader.load('/assets/generated/shared_vfx/shared_vfx_particle_soft.png');
    softTexture.colorSpace = THREE.SRGBColorSpace;
    const dustTexture = loader.load('/assets/generated/shared_vfx/shared_vfx_dust_mote.png');
    dustTexture.colorSpace = THREE.SRGBColorSpace;

    this.positions = new Float32Array(count * 3);
    this.basePositions = new Float32Array(count * 3);
    this.seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      this.positions[i * 3] = (Math.random() - 0.5) * 7;
      this.positions[i * 3 + 1] = Math.random() * 3;
      this.positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      this.seeds[i] = Math.random() * Math.PI * 2;
    }
    this.basePositions.set(this.positions);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xf2d6ff,
      map: softTexture,
      alphaTest: 0.015,
      size: 0.075,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.points = new THREE.Points(geometry, material);
    this.points.name = 'dream_particles';

    const dustCount = 54;
    this.dustPositions = new Float32Array(dustCount * 3);
    this.dustSpeeds = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i += 1) {
      this.dustPositions[i * 3] = (Math.random() - 0.5) * 5.8;
      this.dustPositions[i * 3 + 1] = Math.random() * 2.9;
      this.dustPositions[i * 3 + 2] = -1.1 + Math.random() * 2.4;
      this.dustSpeeds[i] = 0.025 + Math.random() * 0.055;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));
    this.dust = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({
        color: 0xe9f3ef,
        map: dustTexture,
        alphaTest: 0.025,
        size: 0.09,
        transparent: true,
        opacity: 0.24,
        depthWrite: false
      })
    );
    this.dust.name = 'dream_dust_motes';

    const petalTextures = [
      loader.load('/assets/generated/shared_vfx/shared_vfx_petal_01.png'),
      loader.load('/assets/generated/shared_vfx/shared_vfx_petal_02.png')
    ];
    for (const texture of petalTextures) texture.colorSpace = THREE.SRGBColorSpace;
    const petalGeometry = new THREE.PlaneGeometry(0.1, 0.13);
    for (let i = 0; i < 14; i += 1) {
      const petal = new THREE.Mesh(
        petalGeometry,
        new THREE.MeshBasicMaterial({
          map: petalTextures[i % petalTextures.length],
          transparent: true,
          alphaTest: 0.025,
          opacity: 0.42,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      petal.position.set((Math.random() - 0.5) * 5.4, 0.15 + Math.random() * 2.8, -0.9 + Math.random() * 2.4);
      petal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      petal.scale.setScalar(0.65 + Math.random() * 0.7);
      petal.userData.speed = 0.035 + Math.random() * 0.055;
      petal.userData.seed = Math.random() * Math.PI * 2;
      petal.name = `dream_petal_${i + 1}`;
      this.petals.push(petal);
    }

    this.group.name = 'shared_dream_vfx';
    this.group.add(this.points, this.dust, ...this.petals);
  }

  update(time: number): void {
    const delta = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.05) : 0;
    this.lastTime = time;
    for (let i = 0; i < this.seeds.length; i += 1) {
      this.positions[i * 3] = this.basePositions[i * 3] + Math.cos(time * 0.00035 + this.seeds[i]) * 0.12;
      this.positions[i * 3 + 1] = this.basePositions[i * 3 + 1] + Math.sin(time * 0.00055 + this.seeds[i]) * 0.08;
    }
    const position = this.points.geometry.getAttribute('position');
    position.needsUpdate = true;

    for (let i = 0; i < this.dustSpeeds.length; i += 1) {
      this.dustPositions[i * 3 + 1] += this.dustSpeeds[i] * delta;
      this.dustPositions[i * 3] += Math.sin(time * 0.00032 + i) * delta * 0.012;
      if (this.dustPositions[i * 3 + 1] > 3.05) this.dustPositions[i * 3 + 1] = 0.02;
    }
    this.dust.geometry.getAttribute('position').needsUpdate = true;

    for (const petal of this.petals) {
      const speed = Number(petal.userData.speed);
      const seed = Number(petal.userData.seed);
      petal.position.y -= speed * delta;
      petal.position.x += Math.sin(time * 0.00065 + seed) * delta * 0.028;
      petal.rotation.z += delta * (0.12 + speed);
      petal.rotation.y += delta * 0.08;
      if (petal.position.y < 0.04) {
        petal.position.y = 3.05;
        petal.position.x = (Math.random() - 0.5) * 5.4;
      }
    }
  }

  setProfile(intensity: number, showPetals: boolean): void {
    (this.points.material as THREE.PointsMaterial).opacity = 0.34 * intensity;
    (this.dust.material as THREE.PointsMaterial).opacity = 0.24 * intensity;
    for (const petal of this.petals) {
      petal.visible = showPetals;
      (petal.material as THREE.MeshBasicMaterial).opacity = 0.42 * intensity;
    }
  }
}
