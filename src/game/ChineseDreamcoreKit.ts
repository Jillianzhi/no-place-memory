import * as THREE from 'three';
import { DreamMaterials } from './DreamMaterials';

export class ChineseDreamcoreKit {
  private readonly waterCaustics: THREE.Texture;

  constructor(private readonly materials: DreamMaterials) {
    this.waterCaustics = new THREE.TextureLoader().load('/assets/generated/shared_vfx/shared_vfx_water_caustics.png');
    this.waterCaustics.colorSpace = THREE.SRGBColorSpace;
    this.waterCaustics.wrapS = THREE.RepeatWrapping;
    this.waterCaustics.wrapT = THREE.RepeatWrapping;
    this.waterCaustics.repeat.set(1.8, 1);
  }

  createMoonGate(radius = 1.45, depth = 0.16): THREE.Group {
    const group = new THREE.Group();
    const ringShape = new THREE.Shape();
    ringShape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, radius * 0.72, 0, Math.PI * 2, true);
    ringShape.holes.push(hole);
    const geometry = new THREE.ExtrudeGeometry(ringShape, { depth, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 5 });
    geometry.center();
    const ring = new THREE.Mesh(geometry, this.materials.jade);
    group.add(ring);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.7, 64), this.materials.createGlow(0xb6baff, 0.18));
    glow.position.z = -0.05;
    group.add(glow);
    return group;
  }

  createBambooShadow(width = 3.6, height = 2.2): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable.');
    ctx.fillStyle = 'rgba(8, 12, 24, 0)';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(17, 40, 43, 0.28)';
    ctx.fillStyle = 'rgba(17, 40, 43, 0.2)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 7; i += 1) {
      const x = 44 + i * 76;
      ctx.beginPath();
      ctx.moveTo(x, 520);
      ctx.quadraticCurveTo(x + (i % 2 === 0 ? 24 : -18), 245, x - 8, -20);
      ctx.stroke();
      for (let y = 72; y < 480; y += 86) {
        const side = (Math.floor(y / 86) + i) % 2 === 0 ? 1 : -1;
        ctx.beginPath();
        ctx.ellipse(x + side * 24, y, 34, 7, side * -0.62, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x - side * 18, y + 30, 27, 6, side * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.26, depthWrite: false });
    return new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  }

  createWaterMirror(width = 5.2, depth = 2.4): THREE.Mesh {
    const material = this.materials.water.clone();
    material.emissive.set(0x8db9d5);
    material.emissiveIntensity = 0.26;
    material.emissiveMap = this.waterCaustics;
    const water = new THREE.Mesh(new THREE.PlaneGeometry(width, depth, 32, 8), material);
    water.rotation.x = -Math.PI / 2;
    water.userData.wave = true;
    return water;
  }

  createPorcelainVase(): THREE.Group {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 32, 18), this.materials.porcelain);
    body.scale.set(0.82, 1.28, 0.82);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.38, 32), this.materials.porcelain);
    neck.position.y = 0.34;
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.018, 8, 32), this.materials.jade);
    lip.position.y = 0.54;
    group.add(body, neck, lip);
    return group;
  }

  createMetalBranches(count = 5): THREE.Group {
    const group = new THREE.Group();
    for (let i = 0; i < count; i += 1) {
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 1.15, 10), this.materials.silverBranch);
      branch.position.set((i - count / 2) * 0.12, 0.48, 0);
      branch.rotation.z = (i - count / 2) * 0.28;
      const petal = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), this.materials.petal);
      petal.position.set(branch.position.x + Math.sin(branch.rotation.z) * 0.58, 1.05, 0.02);
      group.add(branch, petal);
    }
    return group;
  }

  createHotspotShell(id: string, size: THREE.Vector3): THREE.Mesh {
    const shell = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), this.materials.hotspot.clone());
    shell.name = id;
    shell.userData.hotspotId = id;
    shell.userData.isHotspot = true;
    shell.userData.hotspotSize = size.clone();
    return shell;
  }

  addMiniStage(root: THREE.Group, floorColor = 0x262b4d): void {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.12, 3.05), this.materials.createWall(floorColor));
    floor.name = 'stage_floor_visual';
    floor.position.set(0, -0.08, 0);
    floor.receiveShadow = true;
    const back = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.35, 0.1), this.materials.createWall(0xaab3d5));
    back.name = 'stage_back_visual';
    back.position.set(0, 1.1, -1.55);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.35, 3.05), this.materials.lacquerBlack);
    left.name = 'stage_left_visual';
    left.position.set(-2.95, 1.1, 0);
    const right = left.clone();
    right.name = 'stage_right_visual';
    right.position.x = 2.95;
    const lip = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.045, 0.1), this.materials.createWall(0x405172));
    lip.name = 'stage_lip_visual';
    lip.position.set(0, 0.035, 1.5);
    root.add(floor, back, left, right);
    root.add(lip);
  }
}
