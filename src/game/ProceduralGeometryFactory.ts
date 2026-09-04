import * as THREE from 'three';
import { CanvasTextureFactory } from './CanvasTextureFactory';
import { ChineseDreamcoreKit } from './ChineseDreamcoreKit';
import { DreamMaterials } from './DreamMaterials';
import type { SceneBuildResult, SceneDefinition } from './types';

interface TextureCrop {
  x: number;
  y: number;
  width: number;
  height: number;
  sourceWidth?: number;
  sourceHeight?: number;
}

const memoryPhotos = [
  { file: '01_幼儿园午休.jpg', width: 1200, height: 673 },
  { file: '02_厂区游乐场.jpg', width: 1200, height: 673 },
  { file: '03_照相馆合影.jpg', width: 1200, height: 802 },
  { file: '04_文化宫马戏.jpg', width: 1200, height: 675 },
  { file: '05_大院喷水池.jpg', width: 1200, height: 900 },
  { file: '06_旧教学楼旁.jpg', width: 1200, height: 1198 },
  { file: '07_乡镇大集市.jpg', width: 1200, height: 956 },
  { file: '08_车站蹦蹦床.jpg', width: 1194, height: 1200 },
  { file: '09_街边连廊道.jpg', width: 976, height: 1200 },
  { file: '10_老动物园笼.jpg', width: 1200, height: 833 },
  { file: '11_筒子楼过道.jpg', width: 926, height: 1200 },
  { file: '12_副食游乐屋.jpg', width: 1200, height: 1152 },
  { file: '13_公园旋转马.jpg', width: 868, height: 1200 },
  { file: '14_老式会客厅.jpg', width: 1177, height: 1200 },
  { file: '15_旧楼楼梯间.jpg', width: 1200, height: 845 },
  { file: '16_生日公告栏.jpg', width: 1200, height: 866 },
  { file: '17_校园走廊道.jpg', width: 1200, height: 832 },
  { file: '18_公园摇摇车.jpg', width: 968, height: 1200 },
  { file: '19_旧时滑滑梯.jpg', width: 1200, height: 1200 },
  { file: '20_童年小恐龙.jpg', width: 1200, height: 801 },
  { file: '21_闲置游乐场.jpg', width: 1200, height: 881 },
  { file: '22_旧时彩虹轨.jpg', width: 1200, height: 828 },
  { file: '23_澡堂游乐区.jpg', width: 1200, height: 786 },
  { file: '24_公园旋转椅.jpg', width: 1200, height: 850 },
  { file: '25_花园连廊道.jpg', width: 1200, height: 887 },
  { file: '26_老式小卖铺.jpg', width: 1200, height: 786 },
  { file: '27_学校的门口.jpg', width: 834, height: 1200 },
  { file: '28_小小报刊亭.jpg', width: 1200, height: 1001 },
  { file: '29_校园长走廊.jpg', width: 1200, height: 876 },
  { file: '30_桥洞石板路.jpg', width: 796, height: 1200 },
  { file: '31_废弃游乐屋.jpg', width: 789, height: 1200 },
  { file: '32_家门口乐园.jpg', width: 898, height: 1200 },
  { file: '33_杂货集市摊.jpg', width: 904, height: 1200 },
  { file: '34_飞椅游乐园.jpg', width: 1200, height: 891 },
  { file: '35_学校运动场.jpg', width: 1200, height: 848 },
  { file: '36_旧玩具商铺.jpg', width: 944, height: 1200 }
] as const;

export class ProceduralGeometryFactory {
  private readonly textureLoader = new THREE.TextureLoader();

  constructor(
    private readonly materials: DreamMaterials,
    private readonly textures: CanvasTextureFactory,
    private readonly kit: ChineseDreamcoreKit
  ) {}

  build(definition: SceneDefinition): SceneBuildResult {
    const root = new THREE.Group();
    root.name = `${definition.id}_procedural`;
    const hotspots: THREE.Object3D[] = [];
    this.kit.addMiniStage(root);

    if (definition.id === 'scene01_school') this.buildSchool(root, hotspots);
    if (definition.id === 'scene02_station') this.buildStation(root, hotspots);
    if (definition.id === 'scene03_building') this.buildBuilding(root, hotspots);
    if (definition.id === 'scene04_projection') this.buildProjection(root, hotspots);
    if (definition.id === 'scene05_memory') this.buildMemoryCorridor(root, hotspots);

    return { root, hotspots, usedFallback: true, usedModel: false };
  }

  private addHotspot(root: THREE.Group, hotspots: THREE.Object3D[], id: string, position: THREE.Vector3, size: THREE.Vector3): void {
    const hotspot = this.kit.createHotspotShell(id, size);
    hotspot.position.copy(position);
    root.add(hotspot);
    hotspots.push(hotspot);
  }

  private panel(texture: THREE.Texture, width: number, height: number): THREE.Mesh {
    return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true }));
  }

  private assetTexture(path: string, crop?: TextureCrop): THREE.Texture {
    const texture = this.textureLoader.load(path, (loadedTexture) => {
      loadedTexture.colorSpace = THREE.SRGBColorSpace;
      loadedTexture.anisotropy = 8;
      loadedTexture.needsUpdate = true;
    });
    if (crop) {
      const sourceWidth = crop.sourceWidth ?? 2048;
      const sourceHeight = crop.sourceHeight ?? 2048;
      texture.repeat.set(crop.width / sourceWidth, crop.height / sourceHeight);
      texture.offset.set(crop.x / sourceWidth, 1 - (crop.y + crop.height) / sourceHeight);
    }
    return texture;
  }

  private assetPanel(path: string, width: number, height: number, crop?: TextureCrop): THREE.Mesh {
    return this.panel(this.assetTexture(path, crop), width, height);
  }

  private assetDecorPanel(path: string, width: number, height: number, opacity = 1, crop?: TextureCrop): THREE.Mesh {
    const panel = this.assetPanel(path, width, height, crop);
    const material = panel.material as THREE.MeshBasicMaterial;
    material.alphaTest = 0.015;
    material.depthWrite = false;
    material.opacity = opacity;
    return panel;
  }

  private softGlowPanel(width: number, height: number): THREE.Mesh {
    const texture = this.assetTexture('/assets/generated/shared_vfx/shared_vfx_glow_soft.png');
    return new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        map: texture,
        color: 0xffe2a6,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
  }

  private stationPoster(path: string, width: number, height: number, renderOrder: number): THREE.Group {
    const poster = new THREE.Group();

    const oldPaper = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 1.035, height * 1.025),
      new THREE.MeshBasicMaterial({ color: 0x6a5b46, transparent: true, opacity: 0.46, depthWrite: false })
    );
    oldPaper.position.set(0.018, -0.018, -0.004);
    oldPaper.renderOrder = renderOrder - 1;

    const print = this.assetPanel(path, width, height);
    const printMaterial = print.material as THREE.MeshBasicMaterial;
    printMaterial.transparent = false;
    printMaterial.depthWrite = true;
    printMaterial.color.setHex(0xddd0b9);
    print.renderOrder = renderOrder;

    const tapeMaterial = new THREE.MeshBasicMaterial({
      color: 0xc9b98f,
      transparent: true,
      opacity: 0.48,
      depthWrite: false
    });
    const tape = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.24, Math.max(0.035, height * 0.045)), tapeMaterial);
    tape.position.set(renderOrder % 2 === 0 ? -width * 0.31 : width * 0.31, height * 0.49, 0.008);
    tape.rotation.z = renderOrder % 2 === 0 ? -0.13 : 0.11;
    tape.renderOrder = renderOrder + 1;

    const foldedCornerShape = new THREE.Shape();
    foldedCornerShape.moveTo(0, 0);
    foldedCornerShape.lineTo(width * 0.13, 0);
    foldedCornerShape.lineTo(width * 0.13, height * 0.11);
    foldedCornerShape.closePath();
    const foldedCorner = new THREE.Mesh(
      new THREE.ShapeGeometry(foldedCornerShape),
      new THREE.MeshBasicMaterial({ color: 0xb7a57e, transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide })
    );
    foldedCorner.position.set(width * 0.37, -height * 0.5, 0.009);
    foldedCorner.renderOrder = renderOrder + 1;

    poster.add(oldPaper, print, tape, foldedCorner);
    return poster;
  }

  private mappedMaterial(path: string, repeatX = 1, repeatY = 1, roughness = 0.86): THREE.MeshStandardMaterial {
    const texture = this.assetTexture(path);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    return new THREE.MeshStandardMaterial({ map: texture, roughness, metalness: 0.02 });
  }

  private ceilingLining(path: string, width: number, depth: number, color: number, repeatX: number, repeatY: number): THREE.Mesh {
    const texture = this.assetTexture(path);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    const lining = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshBasicMaterial({ map: texture, color, toneMapped: false })
    );
    lining.rotation.x = Math.PI / 2;
    return lining;
  }

  private stationOutdoorGroundMaterial(): THREE.MeshStandardMaterial {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable.');

    ctx.fillStyle = '#465158';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < image.data.length; index += 4) {
      const noise = Math.floor((Math.random() - 0.5) * 24);
      image.data[index] = Math.max(42, Math.min(108, image.data[index] + noise));
      image.data[index + 1] = Math.max(50, Math.min(116, image.data[index + 1] + noise));
      image.data[index + 2] = Math.max(55, Math.min(124, image.data[index + 2] + noise));
    }
    ctx.putImageData(image, 0, 0);

    for (let index = 0; index < 55; index += 1) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radiusX = 12 + Math.random() * 62;
      const radiusY = 4 + Math.random() * 22;
      const puddle = ctx.createRadialGradient(x, y, 0, x, y, radiusX);
      puddle.addColorStop(0, 'rgba(118,142,156,0.2)');
      puddle.addColorStop(0.62, 'rgba(79,99,110,0.1)');
      puddle.addColorStop(1, 'rgba(35,43,48,0)');
      ctx.save();
      ctx.scale(1, radiusY / radiusX);
      ctx.fillStyle = puddle;
      ctx.fillRect(x - radiusX, (y - radiusX) * radiusX / radiusY, radiusX * 2, radiusX * 2);
      ctx.restore();
    }

    ctx.strokeStyle = 'rgba(25,30,33,0.42)';
    ctx.lineWidth = 2;
    for (let index = 0; index < 12; index += 1) {
      let x = Math.random() * 512;
      let y = Math.random() * 512;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let segment = 0; segment < 4; segment += 1) {
        x += (Math.random() - 0.5) * 52;
        y += 18 + Math.random() * 44;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.6, 6.2);
    texture.anisotropy = 8;
    return new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: texture,
      bumpScale: 0.045,
      color: 0xaeb7ba,
      roughness: 0.62,
      metalness: 0.04,
      emissive: 0x26323a,
      emissiveIntensity: 0.24
    });
  }

  private atlasTexture(index: 0 | 1 | 2 | 3): THREE.Texture {
    const useScene34Atlas = index >= 2;
    const texture = this.textureLoader.load(useScene34Atlas ? '/assets/generated/dreamcore-scene34-atlas.png' : '/assets/generated/dreamcore-scene-atlas.png');
    texture.colorSpace = THREE.SRGBColorSpace;
    if (useScene34Atlas) {
      texture.repeat.set(0.5, 1);
      texture.offset.set(index === 2 ? 0 : 0.5, 0);
    } else {
      texture.repeat.set(0.5, 0.5);
      texture.offset.copy(index === 0 ? new THREE.Vector2(0, 0.5) : new THREE.Vector2(0.5, 0.5));
    }
    return texture;
  }

  private addSceneBackdrop(root: THREE.Group, index: 0 | 1 | 2 | 3): void {
    const texture = this.atlasTexture(index);
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(5.62, 2.28),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.82, depthWrite: false })
    );
    backdrop.name = `scene_backdrop_${index + 1}`;
    backdrop.position.set(0, 1.12, -1.255);
    root.add(backdrop);
  }

  private clock(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'clock_visual';

    const face = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 64),
      new THREE.MeshBasicMaterial({ map: this.textures.createClockFace(), transparent: true })
    );
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.305, 0.018, 10, 48), this.materials.silverBranch);
    const center = new THREE.Mesh(new THREE.CircleGeometry(0.028, 20), this.materials.lacquerBlack);
    group.add(face, rim, center);

    const hourPivot = new THREE.Group();
    hourPivot.name = 'clock_hour_hand_visual';
    hourPivot.rotation.z = -0.25;
    const hour = this.assetPanel('/assets/generated/scene01_p0/s01_prop_clock_hour_hand.webp', 0.08, 0.17);
    hour.position.set(0, 0.075, 0.024);
    hourPivot.add(hour);

    const minutePivot = new THREE.Group();
    minutePivot.name = 'clock_minute_hand_visual';
    minutePivot.rotation.z = Math.PI;
    const minute = this.assetPanel('/assets/generated/scene01_p0/s01_prop_clock_minute_hand.webp', 0.026, 0.22);
    minute.position.set(0, 0.105, 0.028);
    minutePivot.add(minute);

    group.add(hourPivot, minutePivot);
    return group;
  }

  private wallRadio(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'radio_visual';
    const shell = new THREE.MeshStandardMaterial({ color: 0x555c58, roughness: 0.84, metalness: 0.16 });
    const backing = this.box(0.52, 0.3, 0.065, shell, 0, 0, 0);
    const face = this.assetPanel(
      '/assets/generated/scene01_p0/s01_prop_radio_front.png',
      0.52,
      0.3,
      { x: 178, y: 437, width: 1728, height: 1200 }
    );
    face.position.z = 0.038;
    group.add(backing, face);
    return group;
  }

  private fogOverlay(width: number, height: number, assetPath?: string, maskMode: 'fog' | 'rain' = 'fog'): THREE.Mesh {
    const canvas = document.createElement('canvas');
    const aspect = width / Math.max(height, 0.001);
    canvas.width = aspect > 3 ? Math.min(2048, Math.round(256 * aspect)) : 512;
    canvas.height = aspect > 3 ? 256 : 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable.');
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(232,239,255,0.99)');
    gradient.addColorStop(0.55, 'rgba(201,210,246,0.98)');
    gradient.addColorStop(1, 'rgba(247,224,239,0.98)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const density = Math.max(90, Math.round((canvas.width * canvas.height) / 2900));
    for (let i = 0; i < density; i += 1) {
      ctx.fillStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.08})`;
      ctx.beginPath();
      const base = canvas.height / 512;
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, (18 + Math.random() * 58) * base, 0, Math.PI * 2);
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 1 }));
    mesh.userData.wipeCanvas = canvas;
    mesh.userData.wipeCtx = ctx;
    mesh.userData.wipeTexture = texture;
    mesh.userData.wipeProgress = 0;

    if (assetPath) {
      const image = new Image();
      image.onload = () => {
        if (Number(mesh.userData.wipeProgress ?? 0) > 0) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (maskMode === 'rain') {
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = canvas.width;
          maskCanvas.height = canvas.height;
          const maskCtx = maskCanvas.getContext('2d');
          if (!maskCtx) return;
          maskCtx.drawImage(image, 0, 0, canvas.width, canvas.height);
          const pixels = maskCtx.getImageData(0, 0, canvas.width, canvas.height);
          for (let index = 0; index < pixels.data.length; index += 4) {
            const alpha = Math.max(pixels.data[index], pixels.data[index + 1], pixels.data[index + 2]);
            pixels.data[index] = 205;
            pixels.data[index + 1] = 222;
            pixels.data[index + 2] = 244;
            pixels.data[index + 3] = alpha;
          }
          ctx.putImageData(pixels, 0, 0);
          texture.needsUpdate = true;
          const streaks = new Image();
          streaks.onload = () => {
            if (Number(mesh.userData.wipeProgress ?? 0) > 0) return;
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 0.48;
            ctx.drawImage(streaks, 0, 0, canvas.width, canvas.height);
            ctx.restore();
            texture.needsUpdate = true;
          };
          streaks.src = '/assets/generated/shared_vfx/shared_vfx_rain_streak.png';
          return;
        }
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.92;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        texture.needsUpdate = true;
      };
      image.src = assetPath;
    }
    return mesh;
  }

  private box(width: number, height: number, depth: number, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  private addBambooAndWater(root: THREE.Group, x = 0): void {
    const bamboo = this.kit.createBambooShadow(4.5, 2.1);
    bamboo.name = 'bamboo_shadow_visual';
    bamboo.position.set(x, 1.15, -1.48);
    root.add(bamboo);

    const water = this.kit.createWaterMirror(4.9, 0.74);
    water.name = 'water_mirror_visual';
    water.position.set(0, 0.005, 1.02);
    root.add(water);
  }

  private addMoonExit(root: THREE.Group, name: string, x: number, y: number, z: number, scale = 0.46): void {
    const exit = this.kit.createMoonGate(0.9, 0.1);
    exit.name = name;
    exit.position.set(x, y, z);
    exit.scale.setScalar(scale);
    exit.rotation.y = -0.18;
    root.add(exit);
  }

  private oldSchoolDoor(): THREE.Group {
    const door = new THREE.Group();
    door.name = 'exit_door_visual';
    const panel = this.assetPanel(
      '/assets/generated/scene01_p0/s01_prop_door_closed.png',
      0.9,
      2.05,
      { x: 410, y: 104, width: 1227, height: 1840 }
    );
    panel.name = 'school_door_image_visual';
    panel.position.z = 0.045;
    panel.userData.openTexture = this.assetTexture(
      '/assets/generated/scene01_p0/s01_prop_door_open.png',
      { x: 620, y: 128, width: 812, height: 1802 }
    );
    door.add(panel);
    return door;
  }

  private cylinderBetween(start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material, segments = 10): THREE.Mesh {
    const direction = end.clone().sub(start);
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), segments), material);
    cylinder.position.copy(start).add(end).multiplyScalar(0.5);
    cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    cylinder.castShadow = true;
    return cylinder;
  }

  private createSchoolLockers(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'school_lockers_visual';
    const steel = new THREE.MeshStandardMaterial({ color: 0x6f9293, roughness: 0.78, metalness: 0.28 });
    const steelDark = new THREE.MeshStandardMaterial({ color: 0x425f60, roughness: 0.82, metalness: 0.24 });
    const rust = new THREE.MeshStandardMaterial({ color: 0x765344, roughness: 0.9, metalness: 0.14 });
    const body = this.box(0.4, 0.88, 1.38, steelDark, 0, 0.46, 0);
    group.add(body, this.box(0.44, 0.055, 1.43, steel, -0.005, 0.93, 0));

    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        const z = -0.46 + column * 0.46;
        const y = 0.69 - row * 0.43;
        const door = this.box(0.028, 0.38, 0.41, steel, -0.214, y, z);
        const label = this.box(0.018, 0.065, 0.15, rust, -0.235, y + 0.085, z);
        const handle = this.box(0.025, 0.12, 0.028, steelDark, -0.24, y - 0.045, z - 0.12);
        group.add(door, label, handle);
      }
    }
    const detail = this.assetDecorPanel('/assets/generated/scene01_depth_v1/s01_mg_school_lockers.png', 1.42, 0.94);
    detail.rotation.y = -Math.PI / 2;
    detail.position.set(-0.226, 0.47, 0);
    group.add(detail);
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) object.receiveShadow = true;
    });
    return group;
  }

  private createSchoolBench(includeThermos = true): THREE.Group {
    const group = new THREE.Group();
    group.name = includeThermos ? 'school_bench_visual' : 'school_foreground_stool_visual';
    const wood = new THREE.MeshStandardMaterial({ color: 0x6a5040, roughness: 0.96 });
    const woodEdge = new THREE.MeshStandardMaterial({ color: 0x483329, roughness: 0.92 });
    const length = includeThermos ? 1.22 : 0.72;
    group.add(
      this.box(0.32, 0.065, length, wood, 0, 0.45, 0),
      this.box(0.26, 0.055, length, woodEdge, 0.01, 0.39, 0)
    );
    for (const z of [-length * 0.18, length * 0.18]) {
      group.add(this.box(0.326, 0.012, 0.012, woodEdge, -0.003, 0.487, z));
    }
    const nailMaterial = new THREE.MeshStandardMaterial({ color: 0x3b3734, roughness: 0.5, metalness: 0.58 });
    for (const z of [-length * 0.38, length * 0.38]) {
      const nail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.008, 10), nailMaterial);
      nail.rotation.z = Math.PI / 2;
      nail.position.set(-0.164, 0.49, z);
      group.add(nail);
    }
    for (const z of [-length * 0.36, length * 0.36]) {
      group.add(
        this.box(0.09, 0.42, 0.1, wood, -0.08, 0.21, z),
        this.box(0.09, 0.42, 0.1, wood, 0.08, 0.21, z)
      );
    }
    if (includeThermos) {
      const enamel = new THREE.MeshStandardMaterial({ color: 0x385b52, roughness: 0.52, metalness: 0.38 });
      const silver = new THREE.MeshStandardMaterial({ color: 0xa8aaa5, roughness: 0.34, metalness: 0.72 });
      const flask = new THREE.Group();
      flask.position.set(-0.02, 0.45, -0.32);
      flask.add(
        new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.38, 18), enamel),
        new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.1, 18), silver)
      );
      flask.children[0].position.y = 0.19;
      flask.children[1].position.y = 0.43;
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.016, 8, 20, Math.PI * 1.35), enamel);
      handle.rotation.y = Math.PI / 2;
      handle.position.set(0, 0.25, -0.095);
      flask.add(handle);
      group.add(flask);

      const detail = this.assetDecorPanel('/assets/generated/scene01_depth_v1/s01_mg_bench_thermos.png', 1.24, 0.7);
      detail.rotation.y = -Math.PI / 2;
      detail.position.set(-0.176, 0.35, 0);
      group.add(detail);
    }
    return group;
  }

  private createCleaningCorner(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'school_cleaning_corner_visual';
    const bamboo = new THREE.MeshStandardMaterial({ color: 0x9a764d, roughness: 0.96 });
    const straw = new THREE.MeshStandardMaterial({ color: 0x8b6741, roughness: 1 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x60777a, roughness: 0.5, metalness: 0.48 });
    const enamel = new THREE.MeshStandardMaterial({ color: 0xd7d4c6, roughness: 0.42, metalness: 0.08 });
    const blue = new THREE.MeshStandardMaterial({ color: 0x294b72, roughness: 0.5, metalness: 0.12 });

    group.add(
      this.cylinderBetween(new THREE.Vector3(0.02, 0.16, 0.18), new THREE.Vector3(0.08, 1.27, 0.08), 0.018, bamboo),
      this.cylinderBetween(new THREE.Vector3(0.06, 0.18, -0.12), new THREE.Vector3(-0.03, 1.17, -0.2), 0.018, bamboo)
    );
    const broomHead = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.17, 0.34, 14), straw);
    broomHead.position.set(0.015, 0.17, 0.185);
    broomHead.rotation.z = -0.12;
    group.add(broomHead);

    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.34, 20, 1, true), steel);
    bucket.position.set(-0.08, 0.17, -0.12);
    const bucketRim = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.014, 8, 24), steel);
    bucketRim.rotation.x = Math.PI / 2;
    bucketRim.position.set(-0.08, 0.34, -0.12);
    group.add(bucket, bucketRim);

    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.22, 0.11, 24, 1, true), enamel);
    basin.position.set(-0.22, 0.06, 0.29);
    const basinRim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.014, 8, 28), blue);
    basinRim.rotation.x = Math.PI / 2;
    basinRim.position.set(-0.22, 0.115, 0.29);
    group.add(basin, basinRim);
    const detail = this.assetDecorPanel('/assets/generated/scene01_depth_v1/s01_mg_cleaning_corner.png', 0.78, 0.98);
    detail.rotation.y = -Math.PI / 2;
    detail.position.set(-0.035, 0.49, 0.04);
    group.add(detail);
    return group;
  }

  private createForegroundRailing(): THREE.Group {
    const railing = new THREE.Group();
    railing.name = 'school_foreground_railing_visual';
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x171b1c, roughness: 0.55, metalness: 0.58 });
    const stepMaterial = new THREE.MeshStandardMaterial({ color: 0x4b4f4e, roughness: 0.97, metalness: 0.01 });
    for (let index = 0; index < 4; index += 1) {
      const step = this.box(0.82, 0.11 + index * 0.1, 0.34, stepMaterial, 0.04, 0.055 + index * 0.05, 0.16 + index * 0.3);
      railing.add(step);
    }
    const start = new THREE.Vector3(-0.18, 1.12, -0.18);
    const end = new THREE.Vector3(0.25, 0.3, 1.35);
    railing.add(this.cylinderBetween(start, end, 0.037, railMaterial, 12));
    for (const z of [0.02, 0.38, 0.74, 1.1]) {
      const t = (z + 0.18) / 1.53;
      const x = THREE.MathUtils.lerp(-0.17, 0.24, t);
      const y = THREE.MathUtils.lerp(1.02, 0.32, t);
      railing.add(this.cylinderBetween(new THREE.Vector3(x, 0, z), new THREE.Vector3(x, y, z), 0.017, railMaterial, 8));
    }
    return railing;
  }

  private stationBus3d(): THREE.Group {
    const bus = new THREE.Group();
    bus.name = 'station_bus_body_visual';

    const blueBody = this.mappedMaterial('/assets/generated/scene02_v7/s02_bus_blue_metal_v1.jpg', 1.4, 2.2, 0.72);
    blueBody.color.setHex(0x8fa4ad);
    blueBody.emissive.setHex(0x1d2b31);
    blueBody.emissiveIntensity = 0.12;
    blueBody.metalness = 0.16;
    const creamBody = this.mappedMaterial('/assets/generated/scene02_v7/s02_bus_cream_metal_v1.jpg', 1.2, 2.6, 0.78);
    creamBody.color.setHex(0xc8c9c3);
    creamBody.emissive.setHex(0x303536);
    creamBody.emissiveIntensity = 0.09;
    creamBody.metalness = 0.09;
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x273238, roughness: 0.58, metalness: 0.52 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x15191b, roughness: 0.9, metalness: 0.02 });
    const hubMaterial = new THREE.MeshStandardMaterial({ color: 0x7d8587, roughness: 0.48, metalness: 0.72 });
    const tireShadowMaterial = new THREE.MeshBasicMaterial({ color: 0x0d1418, transparent: true, opacity: 0.42, depthWrite: false });
    const windowMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x263944,
      roughness: 0.24,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9,
      clearcoat: 0.62,
      clearcoatRoughness: 0.28
    });

    const chassis = this.box(2.28, 0.34, 7.3, darkMetal, 0, 0.63, 0);
    chassis.name = 'station_bus_chassis_visual';
    const lowerShell = this.box(2.34, 1.2, 7.25, blueBody, 0, 1.18, 0);
    lowerShell.name = 'station_bus_lower_shell_visual';
    const upperShell = this.box(2.28, 1.22, 7.05, creamBody, 0, 2.24, 0.02);
    upperShell.name = 'station_bus_upper_shell_visual';
    const roof = this.box(2.18, 0.18, 6.96, creamBody, 0, 2.93, 0.04);
    roof.name = 'station_bus_roof_visual';
    bus.add(chassis, lowerShell, upperShell, roof);

    const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xcfd2cd, roughness: 0.74, metalness: 0.08 });
    for (const x of [-1.181, 1.181]) {
      const stripe = this.box(0.022, 0.1, 7.05, stripeMaterial, x, 1.47, 0.02);
      stripe.name = 'station_bus_cream_stripe_visual';
      bus.add(stripe);
    }

    for (const x of [-1.175, 1.175]) {
      for (const z of [2.45, 1.28, 0.11, -1.06, -2.1]) {
        const window = this.box(0.035, 0.86, 1.01, windowMaterial, x, 2.28, z);
        window.name = 'station_bus_side_window_visual';
        bus.add(window);
      }
    }

    const sideWindowDecal = this.assetDecorPanel(
      '/assets/generated/scene02_v7/s02_bus_side_window_strip_v1.png',
      5.62,
      1.2,
      0.88
    );
    sideWindowDecal.name = 'station_bus_side_window_decal_visual';
    sideWindowDecal.rotation.y = Math.PI / 2;
    sideWindowDecal.position.set(1.198, 2.29, 0.28);
    sideWindowDecal.renderOrder = 18;
    (sideWindowDecal.material as THREE.MeshBasicMaterial).side = THREE.DoubleSide;
    bus.add(sideWindowDecal);

    const sideBluePanel = this.assetDecorPanel(
      '/assets/generated/scene02_v7/s02_bus_blue_metal_v1.jpg',
      6.92,
      1.05,
      0.94
    );
    sideBluePanel.name = 'station_bus_side_blue_panel_visual';
    sideBluePanel.rotation.y = Math.PI / 2;
    sideBluePanel.position.set(1.196, 1.02, 0);
    sideBluePanel.renderOrder = 14;
    (sideBluePanel.material as THREE.MeshBasicMaterial).color.setHex(0x7f98a3);
    (sideBluePanel.material as THREE.MeshBasicMaterial).side = THREE.DoubleSide;
    bus.add(sideBluePanel);

    const sideCreamPanel = this.assetDecorPanel(
      '/assets/generated/scene02_v7/s02_bus_cream_metal_v1.jpg',
      6.9,
      0.34,
      0.94
    );
    sideCreamPanel.name = 'station_bus_side_cream_panel_visual';
    sideCreamPanel.rotation.y = Math.PI / 2;
    sideCreamPanel.position.set(1.199, 1.62, 0);
    sideCreamPanel.renderOrder = 15;
    (sideCreamPanel.material as THREE.MeshBasicMaterial).color.setHex(0xbcbeb8);
    (sideCreamPanel.material as THREE.MeshBasicMaterial).side = THREE.DoubleSide;
    bus.add(sideCreamPanel);

    const rearWindow = this.box(1.84, 0.92, 0.035, windowMaterial, 0, 2.28, 3.646);
    rearWindow.name = 'station_bus_rear_window_visual';
    const rearWindowDecal = this.assetDecorPanel(
      '/assets/generated/scene02_v7/s02_bus_rear_full_v1.png',
      2.15,
      3,
      0.96
    );
    rearWindowDecal.name = 'station_bus_rear_decal_visual';
    rearWindowDecal.position.set(0, 1.55, 3.7);
    rearWindowDecal.renderOrder = 19;
    bus.add(rearWindow, rearWindowDecal);

    const windshield = this.box(1.82, 0.88, 0.035, windowMaterial, 0, 2.28, -3.646);
    windshield.name = 'station_bus_windshield_visual';
    bus.add(windshield);

    for (const x of [-1.16, 1.16]) {
      for (const z of [-2.42, 3]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.24, 28), rubber);
        wheel.name = 'station_bus_wheel_visual';
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.52, z);
        wheel.castShadow = true;
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.255, 20), hubMaterial);
        hub.name = 'station_bus_wheel_hub_visual';
        hub.rotation.z = Math.PI / 2;
        hub.position.set(x, 0.52, z);
        bus.add(wheel, hub);
        if (x > 0) {
          const tireShadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), tireShadowMaterial);
          tireShadow.name = 'station_bus_tire_contact_shadow_visual';
          tireShadow.rotation.x = -Math.PI / 2;
          tireShadow.position.set(x, 0.012, z);
          tireShadow.scale.set(1.28, 0.64, 1);
          bus.add(tireShadow);
        }
      }
    }

    const redLight = new THREE.MeshStandardMaterial({ color: 0xb42a25, emissive: 0x7d1511, emissiveIntensity: 1.15, roughness: 0.38 });
    const amberLight = new THREE.MeshStandardMaterial({ color: 0xdb852b, emissive: 0x7d3b10, emissiveIntensity: 0.9, roughness: 0.42 });
    for (const x of [-0.92, 0.92]) {
      bus.add(
        this.box(0.18, 0.29, 0.055, redLight, x, 1.25, 3.69),
        this.box(0.18, 0.18, 0.058, amberLight, x, 0.99, 3.692)
      );
    }
    const bumper = this.box(2.35, 0.18, 0.18, darkMetal, 0, 0.42, 3.72);
    bumper.name = 'station_bus_rear_bumper_visual';
    bus.add(bumper);

    for (const z of [-1.5, 0.2, 1.85]) {
      const interiorLight = new THREE.PointLight(0xffc978, 0.2, 2.3, 1.8);
      interiorLight.name = 'station_bus_interior_light_visual';
      interiorLight.position.set(-0.58, 2.48, z);
      bus.add(interiorLight);
    }
    for (const z of [-1.45, 1.25]) {
      const roofUnit = this.box(1.15, 0.18, 0.74, darkMetal, 0, 3.08, z);
      roofUnit.name = 'station_bus_roof_unit_visual';
      bus.add(roofUnit);
    }

    const doorway = new THREE.Group();
    doorway.name = 'station_bus_door_visual';
    doorway.position.set(1.205, 0, 2.1);
    const doorwayBacking = this.box(0.05, 1.78, 0.78, new THREE.MeshStandardMaterial({ color: 0x11191d, roughness: 0.92 }), -0.01, 1.43, 0);
    doorwayBacking.name = 'station_bus_doorway_visual';
    const doorwayGlow = this.box(
      0.055,
      1.52,
      0.66,
      new THREE.MeshBasicMaterial({ color: 0x8b5c2c, toneMapped: false }),
      0.025,
      1.38,
      0
    );
    doorwayGlow.name = 'station_bus_doorway_glow_visual';
    doorwayGlow.visible = false;
    const doorLeft = this.box(0.075, 1.66, 0.35, windowMaterial.clone(), 0.035, 1.45, -0.19);
    doorLeft.name = 'station_bus_door_left_visual';
    const doorRight = this.box(0.075, 1.66, 0.35, windowMaterial.clone(), 0.035, 1.45, 0.19);
    doorRight.name = 'station_bus_door_right_visual';
    const doorDivider = this.box(0.085, 1.7, 0.04, darkMetal, 0.078, 1.44, 0);
    doorDivider.name = 'station_bus_door_divider_visual';
    const doorLight = new THREE.PointLight(0xffc36c, 1.15, 2.6, 1.7);
    doorLight.name = 'station_bus_door_light_visual';
    doorLight.position.set(0.36, 1.38, 0);
    doorLight.visible = false;
    doorway.add(doorwayBacking, doorwayGlow, doorLeft, doorRight, doorDivider, doorLight);
    bus.add(doorway);

    const steps = new THREE.Group();
    steps.name = 'station_bus_steps_visual';
    for (let index = 0; index < 3; index += 1) {
      steps.add(this.box(0.3 + index * 0.12, 0.1, 0.68, darkMetal, 1.31 + index * 0.1, 0.22 + index * 0.15, 2.1));
    }
    steps.visible = false;
    bus.add(steps);

    bus.position.set(2.8, 0, -11.5);
    bus.rotation.y = -0.45;
    bus.scale.setScalar(0.72);
    return bus;
  }

  private stationBusSideProfile(): THREE.Group {
    const bus = new THREE.Group();
    bus.name = 'station_bus_body_visual';

    const side = this.assetDecorPanel(
      '/assets/generated/scene02_v8/s02_bus_side_profile_v1.png',
      4.45,
      1.55,
      0.98,
      { x: 15, y: 70, width: 1910, height: 660, sourceWidth: 1942, sourceHeight: 809 }
    );
    side.name = 'station_bus_side_profile_visual';
    side.position.set(0, 0.76, 0);
    side.renderOrder = 20;
    const sideMaterial = side.material as THREE.MeshBasicMaterial;
    sideMaterial.color.setHex(0xc6d0d4);
    sideMaterial.side = THREE.DoubleSide;
    bus.add(side);

    const door = new THREE.Group();
    door.name = 'station_bus_door_visual';
    door.position.set(1.68, 0.73, 0.025);
    const doorwayBacking = this.box(
      0.43,
      0.98,
      0.035,
      new THREE.MeshBasicMaterial({ color: 0x101416, toneMapped: false }),
      0,
      0,
      -0.015
    );
    doorwayBacking.name = 'station_bus_doorway_visual';
    const doorwayGlow = this.box(
      0.4,
      0.94,
      0.025,
      new THREE.MeshBasicMaterial({ color: 0xb67b3b, toneMapped: false, transparent: true, opacity: 0.18 }),
      0,
      0,
      0.01
    );
    doorwayGlow.name = 'station_bus_doorway_glow_visual';
    doorwayGlow.visible = false;
    const doorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x26343a,
      roughness: 0.3,
      metalness: 0.18,
      transparent: true,
      opacity: 0.72,
      clearcoat: 0.45
    });
    const doorLeft = this.box(0.19, 0.94, 0.035, doorMaterial, -0.1, 0, 0.03);
    doorLeft.name = 'station_bus_door_left_visual';
    const doorRight = this.box(0.19, 0.94, 0.035, doorMaterial.clone(), 0.1, 0, 0.03);
    doorRight.name = 'station_bus_door_right_visual';
    const doorDivider = this.box(0.025, 0.96, 0.045, new THREE.MeshStandardMaterial({ color: 0x1f282b, roughness: 0.66, metalness: 0.5 }), 0, 0, 0.05);
    doorDivider.name = 'station_bus_door_divider_visual';
    const doorLight = new THREE.PointLight(0xffbd68, 0.95, 2.2, 1.7);
    doorLight.name = 'station_bus_door_light_visual';
    doorLight.position.set(0, 0, 0.38);
    doorLight.visible = false;
    door.add(doorwayBacking, doorwayGlow, doorLeft, doorRight, doorDivider, doorLight);
    bus.add(door);

    const steps = new THREE.Group();
    steps.name = 'station_bus_steps_visual';
    for (let index = 0; index < 3; index += 1) {
      steps.add(this.box(
        0.34 - index * 0.035,
        0.055,
        0.04,
        new THREE.MeshBasicMaterial({ color: index === 0 ? 0x4b4035 : 0x2d3232, toneMapped: false }),
        1.68,
        0.31 + index * 0.125,
        0.07
      ));
    }
    steps.visible = false;
    bus.add(steps);

    bus.position.set(2.08, 0, -10.15);
    bus.scale.setScalar(0.9);
    return bus;
  }

  private buildSchool(root: THREE.Group, hotspots: THREE.Object3D[]): void {
    this.addSceneBackdrop(root, 0);
    const legacyBackdrop = root.getObjectByName('scene_backdrop_1');
    if (legacyBackdrop) legacyBackdrop.visible = false;

    const backWallMaterial = this.mappedMaterial('/assets/generated/scene01_depth_v1/s01_env_back_wall.jpg', 1, 1, 0.96);
    const sideWallMaterial = this.mappedMaterial('/assets/generated/scene01_depth_v1/s01_env_side_wall.jpg', 5.5, 1, 0.96);
    backWallMaterial.color.setHex(0xe1dddd);
    sideWallMaterial.color.setHex(0xd5d8d3);
    backWallMaterial.emissive.setHex(0x252a2c);
    backWallMaterial.emissiveIntensity = 0.14;
    sideWallMaterial.emissive.setHex(0x22292a);
    sideWallMaterial.emissiveIntensity = 0.14;
    const floorTexture = this.assetTexture('/assets/generated/scene01_depth_v1/s01_env_floor_terrazzo.jpg');
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(2.6, 16);
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      color: 0xc2c6c5,
      roughness: 0.62,
      metalness: 0.04,
      emissive: 0x1b2226,
      emissiveIntensity: 0.18
    });
    const ceilingTexture = this.assetTexture('/assets/generated/scene01_depth_v1/s01_env_ceiling.jpg');
    ceilingTexture.wrapS = THREE.RepeatWrapping;
    ceilingTexture.wrapT = THREE.RepeatWrapping;
    ceilingTexture.repeat.set(2.2, 7.5);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      map: ceilingTexture,
      bumpMap: ceilingTexture,
      bumpScale: 0.032,
      color: 0xd1cdcc,
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide,
      emissive: 0x777172,
      emissiveMap: ceilingTexture,
      emissiveIntensity: 0.7
    });
    const beamMaterial = new THREE.MeshStandardMaterial({
      map: ceilingTexture,
      bumpMap: ceilingTexture,
      bumpScale: 0.038,
      color: 0xb2adad,
      roughness: 1,
      metalness: 0,
      emissive: 0x575152,
      emissiveMap: ceilingTexture,
      emissiveIntensity: 0.52
    });

    const stageBack = root.getObjectByName('stage_back_visual') as THREE.Mesh | undefined;
    if (stageBack) {
      stageBack.geometry.dispose();
      stageBack.geometry = new THREE.BoxGeometry(2.05, 3.15, 0.12);
      stageBack.material = backWallMaterial;
      stageBack.position.set(0.72, 1.575, -11.8);
    }
    const stageLeft = root.getObjectByName('stage_left_visual') as THREE.Mesh | undefined;
    if (stageLeft) stageLeft.visible = false;
    const stageRight = root.getObjectByName('stage_right_visual') as THREE.Mesh | undefined;
    if (stageRight) {
      stageRight.geometry.dispose();
      stageRight.geometry = new THREE.BoxGeometry(0.12, 3.15, 28);
      stageRight.material = sideWallMaterial;
      stageRight.position.set(1.75, 1.575, -3.2);
    }
    const stageFloor = root.getObjectByName('stage_floor_visual') as THREE.Mesh | undefined;
    if (stageFloor) {
      stageFloor.geometry.dispose();
      stageFloor.geometry = new THREE.BoxGeometry(3.5, 0.12, 28);
      stageFloor.material = floorMaterial;
      stageFloor.position.set(0, -0.08, -3.2);
    }
    const stageLip = root.getObjectByName('stage_lip_visual') as THREE.Mesh | undefined;
    if (stageLip) stageLip.visible = false;

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 28),
      ceilingMaterial
    );
    ceiling.name = 'school_ceiling_visual';
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.15, -3.2);
    ceiling.receiveShadow = true;

    const leftStructure = new THREE.Group();
    leftStructure.name = 'school_left_open_wall_visual';
    leftStructure.add(
      this.box(0.16, 1.02, 28, sideWallMaterial, -1.75, 0.51, -3.2),
      this.box(0.16, 0.62, 28, ceilingMaterial, -1.75, 2.84, -3.2)
    );
    for (const z of [3.25, -1.15, -5.55, -9.85]) {
      leftStructure.add(this.box(0.25, 1.52, 0.42, sideWallMaterial, -1.75, 1.77, z));
    }

    const outsideBays = new THREE.Group();
    outsideBays.name = 'school_outside_bays_visual';
    const outsideOpenings = [
      { z: 1.05, width: 4.15, offset: 0 },
      { z: -3.35, width: 4.15, offset: 0.16 },
      { z: -7.75, width: 4.15, offset: 0.34 }
    ];
    outsideOpenings.forEach(({ z, width, offset }) => {
      const slice = this.assetTexture('/assets/generated/scene01_depth_v1/s01_backdrop_window_clear.jpg');
      slice.wrapS = THREE.ClampToEdgeWrapping;
      slice.repeat.set(0.72, 1);
      slice.offset.set(offset, 0);
      const bay = this.panel(slice, width, 1.52);
      const bayMaterial = bay.material as THREE.MeshBasicMaterial;
      bayMaterial.color.setHex(0xaeb8d0);
      bayMaterial.opacity = 0.92;
      bay.rotation.y = Math.PI / 2;
      bay.position.set(-1.86, 1.78, z);
      outsideBays.add(bay);
    });

    const ceilingBeams = new THREE.Group();
    ceilingBeams.name = 'school_ceiling_beams_visual';
    for (const z of [4.35, 2.35, 0.35, -1.65, -3.65, -5.65, -7.65, -9.65]) {
      ceilingBeams.add(this.box(3.5, 0.25, 0.38, beamMaterial, 0, 3.02, z));
    }

    const ceilingAging = new THREE.Group();
    ceilingAging.name = 'school_ceiling_aging_visual';
    const ceilingAgingPath = '/assets/generated/scene01_depth_v1/s01_bg_wall_details.png';
    for (const [x, z, width, depth, opacity, rotation] of [
      [-0.58, 2.65, 1.1, 1.65, 0.08, 0.18],
      [0.42, -0.45, 1.25, 2.15, 0.07, -0.12],
      [-0.2, -4.8, 1.4, 2.6, 0.06, 0.08],
      [0.5, -8.55, 1.1, 1.85, 0.05, -0.18]
    ] as Array<[number, number, number, number, number, number]>) {
      const stain = this.assetDecorPanel(ceilingAgingPath, width, depth, opacity);
      stain.rotation.x = Math.PI / 2;
      stain.rotation.z = rotation;
      stain.position.set(x, 2.885, z);
      ceilingAging.add(stain);
    }

    const wallAging = new THREE.Group();
    wallAging.name = 'school_wall_aging_visual';
    const wallDetailPath = '/assets/generated/scene01_depth_v1/s01_bg_wall_details.png';
    const wallDetailCrops: Array<{ z: number; y: number; width: number; height: number; crop: TextureCrop; opacity: number }> = [
      { z: -0.85, y: 1.47, width: 1.45, height: 1.62, crop: { x: 145, y: 235, width: 640, height: 720 }, opacity: 0.56 },
      { z: -4.35, y: 1.54, width: 1.7, height: 1.85, crop: { x: 755, y: 530, width: 520, height: 720 }, opacity: 0.5 },
      { z: -7.7, y: 1.43, width: 1.35, height: 1.72, crop: { x: 1180, y: 570, width: 430, height: 650 }, opacity: 0.46 },
      { z: -10.35, y: 1.34, width: 1.3, height: 1.52, crop: { x: 1230, y: 1120, width: 620, height: 650 }, opacity: 0.4 }
    ];
    for (const detail of wallDetailCrops) {
      const decal = this.assetDecorPanel(wallDetailPath, detail.width, detail.height, detail.opacity, detail.crop);
      decal.rotation.y = -Math.PI / 2;
      decal.position.set(1.684, detail.y, detail.z);
      wallAging.add(decal);
    }
    const farWallDetail = this.assetDecorPanel(wallDetailPath, 1.85, 2.5, 0.38);
    farWallDetail.position.set(0.7, 1.48, -11.735);
    wallAging.add(farWallDetail);

    const architecturalTrim = new THREE.Group();
    architecturalTrim.name = 'school_architectural_trim_visual';
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x4b5f5d, roughness: 0.94, metalness: 0.02 });
    const sillMaterial = new THREE.MeshStandardMaterial({ color: 0x747b78, roughness: 0.9, metalness: 0.04 });
    architecturalTrim.add(
      this.box(0.045, 0.13, 24.6, trimMaterial, 1.676, 0.57, -3.3),
      this.box(0.045, 0.12, 24.6, trimMaterial, -1.676, 0.56, -3.3),
      this.box(0.24, 0.07, 24.6, sillMaterial, -1.64, 1.01, -3.3)
    );
    for (const z of [1.25, -3.15, -7.55]) {
      const dripMaterial = new THREE.MeshBasicMaterial({ color: 0x445d5f, transparent: true, opacity: 0.18, depthWrite: false });
      architecturalTrim.add(
        this.box(0.008, 0.42, 0.035, dripMaterial, -1.662, 0.78, z - 0.54),
        this.box(0.008, 0.28, 0.025, dripMaterial, -1.663, 0.84, z + 0.28)
      );
    }

    const floorAging = new THREE.Group();
    floorAging.name = 'school_floor_aging_visual';
    for (const [z, width, depth, opacity, rotation] of [
      [1.45, 2.9, 3.2, 0.19, -0.08],
      [-3.2, 3.05, 4.4, 0.15, 0.05],
      [-8.25, 2.9, 4.0, 0.11, -0.04]
    ] as Array<[number, number, number, number, number]>) {
      const damp = this.assetDecorPanel('/assets/generated/scene01_depth_v1/s01_decal_floor_light.png', width, depth, opacity);
      damp.rotation.x = -Math.PI / 2;
      damp.rotation.z = rotation;
      damp.position.set(-0.12, 0.014, z);
      floorAging.add(damp);
    }

    const ceilingDetails = new THREE.Group();
    ceilingDetails.name = 'school_ceiling_details_visual';
    for (const [index, [z, scale]] of ([[ -0.65, 0.72], [-6.15, 0.56]] as Array<[number, number]>).entries()) {
      const fixture = this.assetDecorPanel('/assets/generated/scene01_depth_v1/s01_arch_ceiling_fixture.png', 1.65 * scale, 1.15 * scale, 0.88);
      fixture.name = `school_fluorescent_fixture_${index}`;
      fixture.rotation.x = Math.PI / 2;
      fixture.rotation.z = Math.PI / 2;
      fixture.position.set(0.34, 2.884, z);
      ceilingDetails.add(fixture);
    }

    const wallHardware = new THREE.Group();
    wallHardware.name = 'school_wall_hardware_visual';
    const hardwareMaterial = new THREE.MeshStandardMaterial({ color: 0x4e5556, roughness: 0.62, metalness: 0.46 });
    for (const z of [0.42, -4.22, -8.85]) {
      const junction = this.box(0.045, 0.16, 0.13, hardwareMaterial, 1.648, 2.7, z);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.012, 8), hardwareMaterial);
      cap.rotation.z = Math.PI / 2;
      cap.position.set(1.62, 2.7, z);
      wallHardware.add(junction, cap);
    }

    const floorReflection = new THREE.Mesh(
      new THREE.PlaneGeometry(3.28, 16.5),
      new THREE.MeshBasicMaterial({
        map: this.assetTexture('/assets/generated/scene01_depth_v1/s01_decal_floor_light.png'),
        transparent: true,
        opacity: 0.12,
        depthWrite: false
      })
    );
    floorReflection.name = 'school_floor_reflection_visual';
    floorReflection.rotation.x = -Math.PI / 2;
    floorReflection.position.set(-0.12, 0.005, -2.9);

    const atmosphere = new THREE.Group();
    atmosphere.name = 'school_atmosphere_visual';

    const rainTexture = this.assetTexture('/assets/generated/shared_vfx/shared_vfx_rain_streak.png');
    rainTexture.wrapS = THREE.RepeatWrapping;
    rainTexture.wrapT = THREE.RepeatWrapping;
    rainTexture.repeat.set(6.5, 1);
    const rainVeil = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 1.55),
      new THREE.MeshBasicMaterial({
        map: rainTexture,
        color: 0x91a9bb,
        transparent: true,
        opacity: 0.44,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    rainVeil.name = 'school_rain_veil';
    rainVeil.rotation.y = Math.PI / 2;
    rainVeil.position.set(-1.842, 1.78, -3.3);

    const lightPools = new THREE.Group();
    lightPools.name = 'school_window_light_pools';
    for (const [z, width, depth, opacity] of [
      [1.25, 2.45, 3.2, 0.22],
      [-3.3, 2.2, 3.65, 0.17],
      [-7.45, 1.75, 3.15, 0.12]
    ] as Array<[number, number, number, number]>) {
      const lightPool = new THREE.Mesh(
        new THREE.PlaneGeometry(width, depth),
        new THREE.MeshBasicMaterial({
          map: this.assetTexture('/assets/generated/scene01_depth_v1/s01_decal_floor_light.png'),
          color: 0x90a8c3,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      lightPool.rotation.x = -Math.PI / 2;
      lightPool.rotation.z = -0.08;
      lightPool.position.set(-0.58, 0.022, z);
      lightPools.add(lightPool);
    }

    const farFogTexture = this.assetTexture('/assets/generated/shared_vfx/shared_vfx_fog_noise.png');
    farFogTexture.wrapS = THREE.RepeatWrapping;
    farFogTexture.wrapT = THREE.RepeatWrapping;
    farFogTexture.repeat.set(1.3, 1);
    const farHaze = new THREE.Mesh(
      new THREE.PlaneGeometry(2.55, 2.35),
      new THREE.MeshBasicMaterial({
        map: farFogTexture,
        alphaMap: farFogTexture,
        color: 0x9ba8b3,
        transparent: true,
        opacity: 0.14,
        depthWrite: false
      })
    );
    farHaze.name = 'school_far_haze';
    farHaze.position.set(0.32, 1.4, -10.95);

    const driftingHaze = new THREE.Group();
    driftingHaze.name = 'school_drifting_haze';
    for (const [z, y, width, height, opacity, speed] of [
      [-5.45, 0.64, 3.35, 1.05, 0.17, 0.000007],
      [-8.05, 1.04, 3.05, 0.86, 0.135, -0.000006]
    ] as Array<[number, number, number, number, number, number]>) {
      const hazeTexture = this.assetTexture('/assets/generated/shared_vfx/shared_vfx_fog_noise.png');
      hazeTexture.wrapS = THREE.RepeatWrapping;
      hazeTexture.wrapT = THREE.RepeatWrapping;
      hazeTexture.repeat.set(1.5, 0.85);
      const haze = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({
          map: hazeTexture,
          alphaMap: hazeTexture,
          color: 0x8d9da8,
          transparent: true,
          opacity,
          depthWrite: false
        })
      );
      haze.position.set(-0.08, y, z);
      haze.userData.speed = speed;
      haze.userData.baseOpacity = opacity;
      haze.userData.baseX = haze.position.x;
      haze.userData.seed = z * 0.73;
      driftingHaze.add(haze);
    }

    const bambooShadow = this.kit.createBambooShadow(4.2, 1.9);
    bambooShadow.name = 'school_wall_bamboo_shadow';
    bambooShadow.rotation.y = -Math.PI / 2;
    bambooShadow.position.set(1.682, 1.55, -2.15);
    const bambooShadowMaterial = bambooShadow.material as THREE.MeshBasicMaterial;
    bambooShadowMaterial.opacity = 0.42;

    const floaterCount = 110;
    const floaterPositions = new Float32Array(floaterCount * 3);
    const floaterBases = new Float32Array(floaterCount * 3);
    const floaterSpeeds = new Float32Array(floaterCount);
    const floaterSeeds = new Float32Array(floaterCount);
    for (let index = 0; index < floaterCount; index += 1) {
      floaterPositions[index * 3] = (Math.random() - 0.5) * 3.25;
      floaterPositions[index * 3 + 1] = 0.12 + Math.random() * 2.9;
      floaterPositions[index * 3 + 2] = 3.8 - Math.random() * 14.2;
      floaterSpeeds[index] = 0.000009 + Math.random() * 0.000018;
      floaterSeeds[index] = Math.random() * Math.PI * 2;
    }
    floaterBases.set(floaterPositions);
    const floaterGeometry = new THREE.BufferGeometry();
    floaterGeometry.setAttribute('position', new THREE.BufferAttribute(floaterPositions, 3));
    const floaters = new THREE.Points(
      floaterGeometry,
      new THREE.PointsMaterial({
        map: this.assetTexture('/assets/generated/shared_vfx/shared_vfx_dust_mote.png'),
        color: 0xcbd5df,
        alphaTest: 0.025,
        size: 0.065,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.3,
        depthWrite: false
      })
    );
    floaters.name = 'school_floaters';
    floaters.userData.basePositions = floaterBases;
    floaters.userData.speeds = floaterSpeeds;
    floaters.userData.seeds = floaterSeeds;

    const foregroundFloaters = new THREE.Group();
    foregroundFloaters.name = 'school_foreground_floaters';
    const floaterTextures = [
      this.assetTexture('/assets/generated/shared_vfx/shared_vfx_dust_mote.png'),
      this.assetTexture('/assets/generated/shared_vfx/shared_vfx_particle_soft.png'),
      this.assetTexture('/assets/generated/shared_vfx/shared_vfx_glow_soft.png')
    ];
    for (let index = 0; index < 72; index += 1) {
      const z = 3.35 - Math.random() * 12.1;
      const xRange = Math.min(1.5, 0.34 + (5.75 - z) * 0.17);
      const size = 0.045 + Math.random() * (index % 3 === 2 ? 0.105 : 0.068);
      const material = new THREE.SpriteMaterial({
        map: floaterTextures[index % floaterTextures.length],
        color: index % 3 === 2 ? 0xb7c9db : 0xd7dde2,
        transparent: true,
        opacity: index % 3 === 2 ? 0.29 : 0.48,
        depthTest: false,
        depthWrite: false
      });
      const mote = new THREE.Sprite(material);
      mote.name = `school_floating_mote_${index}`;
      mote.position.set((Math.random() - 0.5) * xRange * 2, 0.16 + Math.random() * 2.75, z);
      mote.scale.set(size, size, 1);
      mote.renderOrder = 30;
      mote.userData.baseX = mote.position.x;
      mote.userData.baseY = mote.position.y;
      mote.userData.seed = Math.random() * Math.PI * 2;
      mote.userData.speed = 0.000012 + Math.random() * 0.00002;
      mote.userData.baseOpacity = material.opacity;
      foregroundFloaters.add(mote);
    }

    const driftingPetals = new THREE.Group();
    driftingPetals.name = 'school_drifting_petals';
    const petalTextures = [
      this.assetTexture('/assets/generated/shared_vfx/shared_vfx_petal_01.png'),
      this.assetTexture('/assets/generated/shared_vfx/shared_vfx_petal_02.png')
    ];
    for (let index = 0; index < 20; index += 1) {
      const petal = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: petalTextures[index % petalTextures.length],
          color: 0xd6b9c5,
          transparent: true,
          opacity: 0.46,
          depthTest: false,
          depthWrite: false,
        })
      );
      const baseX = (Math.random() - 0.5) * 3.1;
      const baseY = 0.3 + Math.random() * 2.65;
      const baseZ = 3.4 - Math.random() * 13.2;
      petal.position.set(baseX, baseY, baseZ);
      const petalSize = 0.085 + Math.random() * 0.07;
      petal.scale.set(petalSize, petalSize * 1.35, 1);
      petal.renderOrder = 31;
      petal.userData.baseX = baseX;
      petal.userData.baseY = baseY;
      petal.userData.baseZ = baseZ;
      petal.userData.seed = Math.random() * Math.PI * 2;
      petal.userData.speed = 0.000012 + Math.random() * 0.000014;
      driftingPetals.add(petal);
    }

    const nearFluorescent = new THREE.PointLight(0xb8c8dc, 0.62, 5.2, 1.8);
    nearFluorescent.name = 'school_fluorescent_near';
    nearFluorescent.position.set(0.25, 2.82, -0.7);
    const farFluorescent = new THREE.PointLight(0xaabbd2, 0.34, 4.5, 1.8);
    farFluorescent.name = 'school_fluorescent_far';
    farFluorescent.position.set(0.2, 2.82, -6.15);

    atmosphere.add(
      rainVeil,
      lightPools,
      farHaze,
      driftingHaze,
      bambooShadow,
      floaters,
      foregroundFloaters,
      driftingPetals,
      nearFluorescent,
      farFluorescent
    );

    const doorwayMaterial = new THREE.MeshStandardMaterial({ color: 0x292d30, roughness: 1 });
    const schoolDoorZ = 2.25;
    const doorway = this.box(0.045, 2.25, 1.08, doorwayMaterial, 1.68, 1.125, schoolDoorZ);
    doorway.name = 'school_right_doorway_visual';
    const doorwayTop = this.box(0.18, 0.3, 1.28, sideWallMaterial, 1.66, 2.38, schoolDoorZ);
    doorwayTop.name = 'school_right_doorway_lintel_visual';
    const doorwayFarJamb = this.box(0.18, 2.3, 0.16, sideWallMaterial, 1.66, 1.15, schoolDoorZ - 0.62);
    doorwayFarJamb.name = 'school_right_doorway_jamb_visual';

    const turnFloor = this.box(4.4, 0.11, 4.8, floorMaterial, -1.45, -0.08, -13.85);
    turnFloor.name = 'school_turn_floor_visual';
    const turnBackMaterial = new THREE.MeshBasicMaterial({
      map: this.assetTexture('/assets/generated/scene01_depth_v1/s01_env_back_wall.jpg'),
      color: 0x747980,
      toneMapped: false
    });
    const turnBack = this.box(4.4, 3.15, 0.1, turnBackMaterial, -1.45, 1.575, -16.25);
    turnBack.name = 'school_turn_back_visual';
    const turnPier = this.box(0.26, 3.15, 0.34, sideWallMaterial, -0.3, 1.575, -11.65);
    turnPier.name = 'school_turn_pier_visual';

    const pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x42484b, roughness: 0.58, metalness: 0.48 });
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 12.8, 10), pipeMaterial);
    pipe.name = 'school_wall_conduit_visual';
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(1.67, 2.72, -3.4);
    const conduitClamps = new THREE.Group();
    conduitClamps.name = 'school_wall_conduit_clamps_visual';
    for (const z of [2.6, 0.5, -1.6, -3.7, -5.8, -7.9, -10]) {
      const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.006, 6, 18), pipeMaterial);
      clamp.position.set(1.67, 2.72, z);
      conduitClamps.add(clamp);
    }
    const conduitDrop = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.82, 10), pipeMaterial);
    conduitDrop.name = 'school_wall_conduit_drop_visual';
    conduitDrop.position.set(1.67, 2.32, -10.05);

    root.add(
      ceiling,
      leftStructure,
      outsideBays,
      ceilingBeams,
      ceilingAging,
      wallAging,
      architecturalTrim,
      floorAging,
      ceilingDetails,
      wallHardware,
      floorReflection,
      atmosphere,
      doorway,
      doorwayTop,
      doorwayFarJamb,
      turnFloor,
      turnBack,
      turnPier,
      pipe,
      conduitClamps,
      conduitDrop
    );

    const lockers = this.createSchoolLockers();
    lockers.position.set(1.44, 0, -5.6);
    lockers.rotation.y = THREE.MathUtils.degToRad(3);

    const cleaningCorner = this.createCleaningCorner();
    cleaningCorner.position.set(-1.3, 0, -3.55);
    cleaningCorner.rotation.y = Math.PI;

    const bench = this.createSchoolBench();
    bench.position.set(-1.4, 0, -1.42);
    bench.rotation.y = Math.PI;

    const bambooLeaves = this.assetDecorPanel('/assets/generated/scene01_depth_v1/s01_fg_bamboo_leaves.png', 1.75, 1.65, 0.82);
    bambooLeaves.name = 'school_foreground_bamboo_v2_visual';
    bambooLeaves.scale.setScalar(1.35);
    bambooLeaves.position.set(0, 2.12, 2.72);
    bambooLeaves.renderOrder = 60;
    bambooLeaves.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        material.color.setHex(0x8da18e);
        material.opacity = 0.96;
        material.depthTest = false;
        material.depthWrite = false;
      }
    });

    const railing = this.createForegroundRailing();
    railing.position.set(-0.76, 0, 1.3);
    railing.scale.setScalar(1.04);

    const foregroundStool = this.createSchoolBench(false);
    foregroundStool.position.set(1.4, 0, -0.82);

    root.add(lockers, cleaningCorner, bench, bambooLeaves, railing, foregroundStool);

    const interactionLayer = new THREE.Group();
    interactionLayer.name = 'school_interaction_layer';

    const slidingSash = new THREE.Group();
    slidingSash.name = 'curtain_visual';
    slidingSash.rotation.y = Math.PI / 2;
    slidingSash.position.set(-1.52, 1.78, -3.3);
    const sashGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 1.5),
      new THREE.MeshPhysicalMaterial({
        color: 0xb8c8d2,
        transparent: true,
        opacity: 0.008,
        roughness: 0.28,
        transmission: 0.5,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    slidingSash.add(sashGlass);

    const glass = this.fogOverlay(13, 1.5);
    glass.name = 'fog_glass_visual';
    glass.rotation.y = Math.PI / 2;
    glass.position.set(-1.655, 1.78, -3.3);
    const glassMaterial = glass.material as THREE.MeshBasicMaterial;
    glassMaterial.opacity = 0.52;
    glassMaterial.side = THREE.DoubleSide;
    glassMaterial.depthTest = true;
    glassMaterial.depthWrite = false;
    glass.renderOrder = 4;

    const radio = this.wallRadio();
    radio.position.set(1.25, 2.1, -11.7);

    const clock = this.clock();
    clock.position.set(0.9, 2.48, -11.7);
    clock.scale.setScalar(0.75);

    const door = this.oldSchoolDoor();
    door.rotation.y = THREE.MathUtils.degToRad(-82);
    door.position.set(1.65, 1.025, -3.28);

    interactionLayer.add(slidingSash, glass, radio, clock, door);
    root.add(interactionLayer);

    this.addHotspot(root, hotspots, 'hotspot_radio', new THREE.Vector3(1.25, 2.1, -11.7), new THREE.Vector3(0.52, 0.3, 0.16));
    this.addHotspot(root, hotspots, 'hotspot_fog_glass', new THREE.Vector3(-1.6, 1.78, -3.3), new THREE.Vector3(0.32, 1.52, 13));
    this.addHotspot(root, hotspots, 'hotspot_clock', new THREE.Vector3(0.9, 2.48, -11.7), new THREE.Vector3(0.45, 0.45, 0.16));
    this.addHotspot(root, hotspots, 'exit_door', new THREE.Vector3(1.65, 1.02, -3.28), new THREE.Vector3(0.66, 2.08, 0.96));
  }

  private buildStation(root: THREE.Group, hotspots: THREE.Object3D[]): void {
    for (const name of ['stage_back_visual', 'stage_left_visual', 'stage_right_visual', 'stage_floor_visual', 'stage_lip_visual']) {
      const legacy = root.getObjectByName(name);
      if (legacy) legacy.visible = false;
    }

    const stationPlasterPath = '/assets/generated/scene02_v9/s02_warm_aged_plaster_v1.jpg';
    const upperWall = this.mappedMaterial(stationPlasterPath, 1.65, 2.25, 0.97);
    upperWall.color.setHex(0xd6d0c2);
    upperWall.emissive.setHex(0x4f4b45);
    upperWall.emissiveIntensity = 0.13;
    upperWall.bumpMap = upperWall.map;
    upperWall.bumpScale = 0.018;
    const lowerWall = this.mappedMaterial(stationPlasterPath, 1.7, 2.35, 0.98);
    lowerWall.color.setHex(0x65817f);
    lowerWall.emissive.setHex(0x2f4544);
    lowerWall.emissiveIntensity = 0.14;
    lowerWall.bumpMap = lowerWall.map;
    lowerWall.bumpScale = 0.014;
    const floorMaterial = this.mappedMaterial('/assets/generated/scene02_v4/s02_floor_wet_terrazzo_basecolor.jpg', 2.4, 12, 0.5);
    floorMaterial.color.setHex(0xb1aaa0);
    floorMaterial.emissive.setHex(0x414747);
    floorMaterial.emissiveIntensity = 0.16;
    const ceilingMaterial = this.mappedMaterial(stationPlasterPath, 2.1, 8.5, 0.98);
    ceilingMaterial.color.setHex(0xbab2a7);
    ceilingMaterial.emissive.setHex(0x48443f);
    ceilingMaterial.emissiveIntensity = 0.13;
    ceilingMaterial.bumpMap = ceilingMaterial.map;
    ceilingMaterial.bumpScale = 0.012;

    const outsideFloorMaterial = this.stationOutdoorGroundMaterial();

    const architecture = new THREE.Group();
    architecture.name = 'station_architecture_v2_visual';
    const floor = this.box(6.6, 0.12, 24, floorMaterial, 0, -0.08, -4.15);
    floor.name = 'station_floor_visual';
    const ceiling = new THREE.Group();
    ceiling.name = 'station_ceiling_visual';
    const frontCeiling = this.box(6.6, 0.12, 6.4, ceilingMaterial, 0, 3.18, 0.8);
    frontCeiling.name = 'station_front_ceiling_visual';
    const rearLeftCeiling = this.box(4.25, 0.12, 13.75, ceilingMaterial, -1.175, 3.18, -9.275);
    rearLeftCeiling.name = 'station_rear_left_ceiling_visual';
    ceiling.add(frontCeiling, rearLeftCeiling);
    architecture.add(floor, ceiling);

    const outdoorPlatform = this.box(5.4, 0.08, 13.75, outsideFloorMaterial, 3.45, -0.045, -9.275);
    outdoorPlatform.name = 'station_outdoor_platform_floor_visual';
    architecture.add(outdoorPlatform);

    const drainage = new THREE.Group();
    drainage.name = 'station_platform_drainage_visual';
    const drainMaterial = new THREE.MeshStandardMaterial({ color: 0x252d31, roughness: 0.52, metalness: 0.5 });
    drainage.add(this.box(5.25, 0.018, 0.075, drainMaterial, 3.42, 0.01, -2.46));
    const curbMaterial = new THREE.MeshStandardMaterial({ color: 0x7a7f7d, roughness: 0.96, metalness: 0.02 });
    const warningMaterial = new THREE.MeshStandardMaterial({ color: 0x776d52, roughness: 0.9, metalness: 0.03 });
    drainage.add(
      this.box(0.18, 0.11, 13.3, curbMaterial, 1.02, 0.035, -9.25),
      this.box(0.085, 0.02, 13.15, warningMaterial, 1.16, 0.082, -9.25),
      this.box(0.12, 0.018, 13.15, drainMaterial, 0.86, 0.018, -9.25)
    );
    for (let index = 0; index < 25; index += 1) {
      drainage.add(this.box(0.16, 0.024, 0.018, drainMaterial, 0.86, 0.028, -2.9 - index * 0.52));
    }
    architecture.add(drainage);

    const platformPuddles = new THREE.Group();
    platformPuddles.name = 'station_outdoor_puddles_visual';
    const puddleTexture = this.assetTexture('/assets/generated/scene02_v4/s02_decal_floor_reflection.png');
    for (const [x, z, width, depth, opacity] of [
      [2.25, -4.8, 1.25, 2.3, 0.18],
      [4.15, -7.4, 1.65, 2.9, 0.22],
      [2.9, -11.2, 1.45, 2.45, 0.16]
    ] as Array<[number, number, number, number, number]>) {
      const puddle = new THREE.Mesh(
        new THREE.PlaneGeometry(width, depth),
        new THREE.MeshBasicMaterial({
          map: puddleTexture,
          color: 0x91a8b7,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.set(x, 0.004, z);
      platformPuddles.add(puddle);
    }
    architecture.add(platformPuddles);

    const leftSill = this.box(0.2, 0.82, 24, lowerWall, -3.18, 0.41, -4.15);
    leftSill.name = 'station_left_sill_visual';
    architecture.add(leftSill);
    architecture.add(
      this.box(0.2, 0.16, 6.4, upperWall, 3.18, 0.08, 0.8),
      this.box(0.28, 0.5, 24, upperWall, -3.14, 2.93, -4.15),
      this.box(0.28, 0.5, 6.4, upperWall, 3.14, 2.93, 0.8)
    );

    const columns = new THREE.Group();
    columns.name = 'station_columns_visual';
    for (const z of [3.35, 0.35, -2.65, -5.65, -8.65, -11.65]) {
      columns.add(
        this.box(0.42, 3.16, 0.42, upperWall, -3.12, 1.58, z),
        this.box(0.44, 0.9, 0.44, lowerWall, -3.12, 0.45, z)
      );
      if (z > -2.5) {
        columns.add(
          this.box(0.42, 3.16, 0.42, upperWall, 3.12, 1.58, z),
          this.box(0.44, 0.9, 0.44, lowerWall, 3.12, 0.45, z)
        );
      }
    }
    architecture.add(columns);

    const beams = new THREE.Group();
    beams.name = 'station_ceiling_beams_visual';
    for (const z of [3.55, 0.65, -2.25, -5.15, -8.05, -10.95]) {
      const rearBeam = z < -2.3;
      beams.add(this.box(rearBeam ? 4.25 : 6.6, 0.28, 0.34, ceilingMaterial, rearBeam ? -1.175 : 0, 2.96, z));
    }
    architecture.add(beams);

    const farWall = new THREE.Group();
    farWall.name = 'station_far_wall_visual';
    farWall.add(
      this.box(2.66, 3.16, 0.16, upperWall, -1.97, 1.58, -11.95),
      this.box(1.38, 0.82, 0.16, upperWall, 0, 2.75, -11.95),
      this.box(2.68, 0.9, 0.18, lowerWall, -1.97, 0.45, -11.84)
    );
    const farPassage = this.box(1.24, 2.34, 0.12, new THREE.MeshStandardMaterial({ color: 0x465153, roughness: 1 }), 0, 1.17, -12.12);
    farPassage.name = 'station_far_passage_visual';
    farWall.add(farPassage);
    architecture.add(farWall);

    const notices = new THREE.Group();
    notices.name = 'station_vintage_notices_visual';
    const posterRoot = '/assets/generated/scene02_v13/posters';
    const farWallPosters = [
      { file: 'bus_travel.jpg', x: -2.82, y: 1.75, width: 0.78, height: 1.17, rotation: -0.11 },
      { file: 'color_tv.jpg', x: -2.17, y: 1.86, width: 0.76, height: 1.14, rotation: 0.08 },
      { file: 'washing_powder.jpg', x: -1.48, y: 1.78, width: 0.72, height: 1.08, rotation: -0.07 },
      { file: 'orange_soda.jpg', x: -2.54, y: 2.2, width: 0.58, height: 0.87, rotation: 0.16 },
      { file: 'biscuits.jpg', x: -2.42, y: 1.28, width: 0.62, height: 0.93, rotation: -0.14 },
      { file: 'bicycle.jpg', x: -1.91, y: 2.18, width: 0.57, height: 0.86, rotation: 0.12 },
      { file: 'cassette_radio.jpg', x: -1.36, y: 1.28, width: 0.62, height: 0.93, rotation: 0.14 },
      { file: 'toothpaste.jpg', x: -0.91, y: 1.98, width: 0.54, height: 0.81, rotation: -0.12 },
      { file: 'table_fan.jpg', x: -1.02, y: 1.11, width: 0.5, height: 0.75, rotation: 0.09 }
    ] as const;
    farWallPosters.forEach((config, index) => {
      const poster = this.stationPoster(`${posterRoot}/${config.file}`, config.width, config.height, 50 + index * 3);
      poster.name = `station_far_wall_poster_${index + 1}_visual`;
      poster.position.set(config.x, config.y, -11.742 + index * 0.003);
      poster.rotation.z = config.rotation;
      notices.add(poster);
    });

    const leftWallPosters = [
      { file: 'cassette_radio.jpg', z: -4.02, y: 1.63, width: 0.72, height: 1.08, rotation: -0.075 },
      { file: 'toothpaste.jpg', z: -4.58, y: 1.38, width: 0.58, height: 0.87, rotation: 0.095 },
      { file: 'table_fan.jpg', z: -6.95, y: 1.68, width: 0.7, height: 1.05, rotation: 0.06 },
      { file: 'sewing_machine.jpg', z: -7.53, y: 1.42, width: 0.6, height: 0.9, rotation: -0.11 },
      { file: 'beauty_salon.jpg', z: -9.92, y: 1.72, width: 0.62, height: 0.88, rotation: 0.085 }
    ] as const;
    leftWallPosters.forEach((config, index) => {
      const mount = new THREE.Group();
      mount.name = `station_left_wall_poster_${index + 1}_visual`;
      mount.position.set(-3.065 + index * 0.0015, config.y, config.z);
      mount.rotation.y = Math.PI / 2;
      const poster = this.stationPoster(`${posterRoot}/${config.file}`, config.width, config.height, 72 + index * 3);
      poster.rotation.z = config.rotation;
      poster.position.z = index * 0.002;
      mount.add(poster);
      notices.add(mount);
    });

    const residueMaterial = new THREE.MeshBasicMaterial({ color: 0xb8a987, transparent: true, opacity: 0.42, depthWrite: false });
    for (const [x, y, width, height, rotation] of [
      [-2.95, 2.45, 0.24, 0.12, -0.18],
      [-2.25, 1.05, 0.32, 0.15, 0.09],
      [-1.16, 2.47, 0.26, 0.11, -0.08],
      [-1.47, 1.03, 0.18, 0.09, 0.16]
    ] as Array<[number, number, number, number, number]>) {
      const residue = new THREE.Mesh(new THREE.PlaneGeometry(width, height), residueMaterial);
      residue.position.set(x, y, -11.751);
      residue.rotation.z = rotation;
      residue.renderOrder = 44;
      notices.add(residue);
    }
    root.add(notices);

    const conduitMaterial = new THREE.MeshStandardMaterial({ color: 0x4c5152, roughness: 0.66, metalness: 0.42 });
    const conduit = this.cylinderBetween(new THREE.Vector3(2.94, 2.75, 3.5), new THREE.Vector3(2.94, 2.75, -2.4), 0.025, conduitMaterial, 10);
    conduit.name = 'station_conduit_visual';
    architecture.add(conduit);

    const outside = new THREE.Group();
    outside.name = 'station_outside_platform_visual';
    for (const [x, rotation] of [[-3.34, Math.PI / 2], [5.95, -Math.PI / 2]] as Array<[number, number]>) {
      const panorama = this.assetPanel('/assets/generated/scene02_v4/s02_backdrop_rain_platform.jpg', 23.5, 2.55);
      panorama.rotation.y = rotation;
      panorama.position.set(x, 1.38, -4.1);
      (panorama.material as THREE.MeshBasicMaterial).color.setHex(x < 0 ? 0xb7c6d5 : 0xaabbd0);
      outside.add(panorama);
    }
    const rearOutdoor = this.assetPanel(
      '/assets/generated/scene02_v4/s02_backdrop_rain_platform.jpg',
      6.2,
      3.25,
      { x: 650, y: 80, width: 1398, height: 1660, sourceHeight: 2048 }
    );
    rearOutdoor.name = 'station_rear_outdoor_backdrop_visual';
    rearOutdoor.position.set(3.3, 1.55, -12.02);
    (rearOutdoor.material as THREE.MeshBasicMaterial).color.setHex(0xaab9c5);
    outside.add(rearOutdoor);
    architecture.add(outside);

    const reflectionTexture = this.assetTexture('/assets/generated/scene02_v4/s02_decal_floor_reflection.png');
    reflectionTexture.wrapS = THREE.RepeatWrapping;
    reflectionTexture.wrapT = THREE.RepeatWrapping;
    reflectionTexture.repeat.set(1.4, 5.5);
    const reflection = new THREE.Mesh(
      new THREE.PlaneGeometry(6.28, 21),
      new THREE.MeshBasicMaterial({
        map: reflectionTexture,
        color: 0x9fb1bd,
        transparent: true,
        opacity: 0.17,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    reflection.name = 'station_floor_reflection_visual';
    reflection.rotation.x = -Math.PI / 2;
    reflection.position.set(0, 0.012, -3.35);
    architecture.add(reflection);
    root.add(architecture);

    const hangingLamps = new THREE.Group();
    hangingLamps.name = 'station_hanging_lamps_visual';
    const lampMetal = new THREE.MeshStandardMaterial({ color: 0x4d4037, roughness: 0.58, metalness: 0.48, side: THREE.DoubleSide });
    const lampUnderside = new THREE.MeshStandardMaterial({ color: 0xb68a48, roughness: 0.7, metalness: 0.22, emissive: 0x5b3215, emissiveIntensity: 0.1, side: THREE.DoubleSide });
    const bulbMaterial = new THREE.MeshStandardMaterial({ color: 0xffe1ad, emissive: 0xffb968, emissiveIntensity: 2.2, roughness: 0.45 });
    for (const [index, [x, z, drop]] of [[0.58, 0.25, 0.55], [-0.2, -3.75, 0.72], [-0.65, -8.35, 0.64]].entries()) {
      const lamp = new THREE.Group();
      lamp.name = `station_lamp_${index}`;
      lamp.position.set(x, 3.1, z);
      const cable = this.cylinderBetween(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -drop, 0), 0.011, conduitMaterial, 8);
      const ceilingCup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.068, 0.055, 18), lampMetal);
      ceilingCup.position.y = -0.025;
      const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.052, 0.12, 18), lampMetal);
      socket.position.y = -drop - 0.035;
      const shadeProfile = [
        new THREE.Vector2(0.05, -0.02),
        new THREE.Vector2(0.075, -0.055),
        new THREE.Vector2(0.13, -0.105),
        new THREE.Vector2(0.21, -0.145),
        new THREE.Vector2(0.3, -0.17)
      ];
      const shade = new THREE.Mesh(new THREE.LatheGeometry(shadeProfile, 32), lampMetal);
      shade.name = 'station_lamp_shade_visual';
      shade.position.y = -drop;
      const underside = new THREE.Mesh(new THREE.RingGeometry(0.064, 0.292, 32), lampUnderside);
      underside.name = 'station_lamp_underside_visual';
      underside.rotation.x = Math.PI / 2;
      underside.position.y = -drop - 0.171;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.298, 0.011, 8, 32), lampMetal);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = -drop - 0.171;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 12), bulbMaterial.clone());
      bulb.name = 'station_lamp_bulb_visual';
      bulb.position.y = -drop - 0.205;
      lamp.add(cable, ceilingCup, socket, shade, underside, rim, bulb);
      const glow = new THREE.PointLight(0xffc991, index === 0 ? 0.46 : 0.3, 4.4, 1.8);
      glow.name = 'station_lamp_light_visual';
      glow.position.y = -drop - 0.22;
      lamp.add(glow);
      hangingLamps.add(lamp);
    }
    root.add(hangingLamps);

    const fans = new THREE.Group();
    fans.name = 'station_ceiling_fans_visual';
    const fanMaterial = new THREE.MeshStandardMaterial({ color: 0x565958, roughness: 0.82, metalness: 0.34 });
    for (const [index, [x, z, scale]] of [[-1.18, 0.45, 0.74], [0.72, -6.45, 0.76]].entries()) {
      const fan = new THREE.Group();
      fan.name = `station_fan_${index}`;
      fan.position.set(x, 2.78, z);
      fan.scale.setScalar(scale);
      fan.add(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.18, 16), fanMaterial));
      for (let blade = 0; blade < 3; blade += 1) {
        const arm = new THREE.Group();
        arm.rotation.y = blade * Math.PI * 2 / 3;
        const paddle = this.box(0.15, 0.025, 0.82, fanMaterial, 0, -0.02, 0.45);
        arm.add(paddle);
        fan.add(arm);
      }
      fans.add(fan);
    }
    root.add(fans);

    const benches = new THREE.Group();
    benches.name = 'station_benches_visual';
    const benchFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x445356, roughness: 0.54, metalness: 0.62 });
    const benchSeatMaterial = new THREE.MeshStandardMaterial({ color: 0x527174, roughness: 0.82, metalness: 0.08 });
    for (const [index, [x, y, z, width, height]] of [
      [-1.72, 0.42, 1.25, 1.82, 0.83],
      [-1.74, 0.38, -1.45, 1.62, 0.74],
      [-1.68, 0.34, -4.35, 1.42, 0.65]
    ].entries()) {
      const row = new THREE.Group();
      row.name = `station_bench_row_${index + 1}_visual`;
      row.position.set(x, y, z);
      const benchImage = this.assetDecorPanel('/assets/generated/scene02_v4/s02_prop_waiting_bench_front.webp', width, height, 0.98);
      benchImage.name = `station_bench_row_${index + 1}_image_visual`;
      benchImage.position.z = 0.16;
      (benchImage.material as THREE.MeshBasicMaterial).color.setHex(0x789396);
      const seat = this.box(width * 0.92, 0.07, 0.42, benchSeatMaterial, 0, -height * 0.08, 0.02);
      const rearBeam = this.box(width * 0.9, 0.07, 0.08, benchFrameMaterial, 0, height * 0.18, -0.08);
      const lowerBeam = this.box(width * 0.82, 0.045, 0.07, benchFrameMaterial, 0, -height * 0.36, -0.04);
      row.add(benchImage, seat, rearBeam, lowerBeam);
      for (const legX of [-width * 0.34, width * 0.34]) {
        row.add(
          this.box(0.055, height * 0.5, 0.07, benchFrameMaterial, legX, -height * 0.24, -0.04),
          this.box(0.28, 0.045, 0.08, benchFrameMaterial, legX, -height * 0.49, 0.03)
        );
      }
      benches.add(row);
    }
    root.add(benches);

    const luggage = new THREE.Group();
    luggage.name = 'station_luggage_visual';
    const leather = new THREE.MeshStandardMaterial({ color: 0x71584f, roughness: 0.84, metalness: 0.04 });
    const leatherDark = new THREE.MeshStandardMaterial({ color: 0x302c2c, roughness: 0.9 });
    const luggageMetal = new THREE.MeshStandardMaterial({ color: 0x9c8568, roughness: 0.5, metalness: 0.48 });
    for (const [index, [x, z, width, height, depth]] of [
      [1.18, -5.15, 0.45, 0.5, 0.24],
      [1.62, -5.2, 0.38, 0.42, 0.22],
      [-0.92, 4.15, 1.28, 0.6, 0.48]
    ].entries()) {
      const suitcase = new THREE.Group();
      suitcase.name = `station_luggage_${index + 1}_visual`;
      suitcase.position.set(x, 0, z);
      if (index === 2) suitcase.rotation.y = -0.16;
      suitcase.add(
        this.box(width, height, depth, leather, 0, height / 2, 0),
        this.box(width * 0.38, 0.04, 0.04, leatherDark, 0, height + 0.06, 0),
        this.box(width * 0.82, 0.025, depth + 0.015, leatherDark, 0, height * 0.36, 0),
        this.box(width * 0.08, height * 0.12, 0.025, luggageMetal, -width * 0.2, height * 0.58, depth * 0.52),
        this.box(width * 0.08, height * 0.12, 0.025, luggageMetal, width * 0.2, height * 0.58, depth * 0.52)
      );
      luggage.add(suitcase);
    }
    root.add(luggage);

    const stationProps = new THREE.Group();
    stationProps.name = 'station_small_props_visual';
    const binMaterial = new THREE.MeshStandardMaterial({ color: 0x697577, roughness: 0.64, metalness: 0.48 });
    const trashBin = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.2, 0.72, 20), binMaterial);
    trashBin.name = 'station_trash_bin_visual';
    trashBin.position.set(2.35, 0.36, -2.45);
    stationProps.add(trashBin);
    for (const [standIndex, [x, z, scale]] of [[2.75, 2.8, 1], [2.05, -4.8, 0.68]].entries()) {
      const umbrellaGroup = new THREE.Group();
      umbrellaGroup.name = `station_umbrella_stand_${standIndex + 1}_visual`;
      umbrellaGroup.position.set(x, 0, z);
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.19 * scale, 0.52 * scale, 18), binMaterial);
      stand.position.set(0, 0.26 * scale, 0);
      umbrellaGroup.add(stand);
      for (let index = 0; index < 4; index += 1) {
        const stem = this.cylinderBetween(
          new THREE.Vector3(-0.08 * scale + index * 0.05 * scale, 0.22 * scale, 0),
          new THREE.Vector3(-0.03 * scale + index * 0.04 * scale, 1.12 * scale, 0),
          0.012 * scale,
          leatherDark,
          8
        );
        umbrellaGroup.add(stem);
      }
      stationProps.add(umbrellaGroup);
    }
    root.add(stationProps);

    const floorTraces = new THREE.Group();
    floorTraces.name = 'station_floor_traces_visual';
    const footprintMaterial = new THREE.MeshBasicMaterial({ color: 0x26363b, transparent: true, opacity: 0.2, depthWrite: false });
    for (const [index, [x, z, angle]] of [
      [-0.42, 1.05, -0.08],
      [-0.22, 0.55, 0.05],
      [-0.1, 0.02, -0.04],
      [0.1, -0.52, 0.08],
      [0.22, -1.08, 0],
      [0.43, -1.64, 0.1],
      [0.54, -2.18, 0.03]
    ].entries()) {
      const footprint = new THREE.Mesh(new THREE.CircleGeometry(0.075, 18), footprintMaterial.clone());
      footprint.name = `station_wet_footprint_${index}_visual`;
      footprint.rotation.x = -Math.PI / 2;
      footprint.rotation.z = angle;
      footprint.scale.set(0.62, 1.55, 1);
      footprint.position.set(x + (index % 2 === 0 ? -0.07 : 0.07), 0.017, z);
      floorTraces.add(footprint);
    }
    const paperMaterial = new THREE.MeshStandardMaterial({ color: 0xb2aaa0, roughness: 0.98, metalness: 0.01 });
    for (const [x, z, rotation] of [[-0.2, -3.65, 0.18], [0.22, -5.52, -0.11]] as Array<[number, number, number]>) {
      const paper = this.box(0.2, 0.008, 0.13, paperMaterial, x, 0.012, z);
      paper.rotation.y = rotation;
      floorTraces.add(paper);
    }
    root.add(floorTraces);

    const boardFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x252d31, roughness: 0.62, metalness: 0.5 });
    const boardFrame = this.box(1.3, 0.5, 0.1, boardFrameMaterial, 0.12, 2.42, -6.35);
    boardFrame.name = 'station_board_frame_visual';
    const board = this.assetPanel(
      '/assets/generated/scene02_v4/s02_prop_board_off.png',
      1.14,
      0.38,
      { x: 154, y: 230, width: 1740, height: 552, sourceHeight: 1024 }
    );
    board.name = 'board_visual';
    board.position.set(0.12, 2.42, -6.28);
    board.userData.onTexture = this.assetTexture(
      '/assets/generated/scene02_v4/s02_prop_board_on.png',
      { x: 151, y: 228, width: 1746, height: 556, sourceHeight: 1024 }
    );
    root.add(boardFrame, board);

    const ticket = this.assetPanel(
      '/assets/generated/scene02_v4/s02_prop_ticket_front_blank.png',
      0.32,
      0.15,
      { x: 160, y: 147, width: 1728, height: 714, sourceHeight: 1024 }
    );
    ticket.name = 'ticket_visual';
    ticket.position.set(-1.22, 0.48, 1.29);
    ticket.rotation.x = -0.08;
    ticket.rotation.z = -0.07;
    ticket.renderOrder = 36;
    const ticketMaterial = ticket.material as THREE.MeshBasicMaterial;
    ticketMaterial.depthWrite = false;
    ticket.userData.frontTexture = (ticket.material as THREE.MeshBasicMaterial).map;
    ticket.userData.backTexture = this.assetTexture('/assets/generated/scene02_v4/s02_prop_ticket_back.webp');
    const ticketGlow = this.softGlowPanel(0.46, 0.25);
    ticketGlow.name = 'station_ticket_glow_visual';
    ticketGlow.position.set(-1.22, 0.48, 1.275);
    ticketGlow.renderOrder = 35;
    const ticketGlowMaterial = ticketGlow.material as THREE.MeshBasicMaterial;
    ticketGlowMaterial.color.setHex(0xd8b98b);
    ticketGlowMaterial.opacity = 0.34;
    root.add(ticketGlow, ticket);

    const gate = new THREE.Group();
    gate.name = 'gate_visual';
    const gatePaint = new THREE.MeshStandardMaterial({ color: 0x718083, roughness: 0.78, metalness: 0.38 });
    const gatePaintDark = new THREE.MeshStandardMaterial({ color: 0x465256, roughness: 0.84, metalness: 0.32 });
    const gateEdge = new THREE.MeshStandardMaterial({ color: 0xa1a6a1, roughness: 0.54, metalness: 0.58 });
    const gateRust = new THREE.MeshStandardMaterial({ color: 0x5c3528, roughness: 0.96, metalness: 0.08 });
    const gateEnamel = new THREE.MeshStandardMaterial({ color: 0xb0aa92, roughness: 0.82, metalness: 0.12 });

    const gateBody = this.box(0.43, 0.66, 0.34, gatePaint, 0, 0, 0);
    gateBody.name = 'gate_body_visual';
    const gateFront = this.box(0.35, 0.47, 0.025, gatePaintDark, 0, -0.035, 0.184);
    gateFront.name = 'gate_front_panel_visual';
    const gateBase = this.box(0.49, 0.09, 0.39, gatePaintDark, 0, -0.375, 0);
    gateBase.name = 'gate_base_visual';
    const gateCap = this.box(0.47, 0.16, 0.36, gatePaint, 0, 0.385, 0);
    gateCap.name = 'gate_cap_visual';
    const gateSlot = this.box(0.24, 0.018, 0.08, gatePaintDark.clone(), 0.035, 0.472, 0.02);
    gateSlot.name = 'gate_slot_visual';
    const slotLipTop = this.box(0.29, 0.014, 0.025, gateEdge, 0.035, 0.477, -0.045);
    const slotLipBottom = this.box(0.29, 0.014, 0.025, gateEdge, 0.035, 0.477, 0.085);
    const labelPlate = this.box(0.19, 0.09, 0.018, gateEnamel, 0.025, 0.075, 0.207);
    labelPlate.name = 'gate_label_plate_visual';

    const redLensMaterial = new THREE.MeshStandardMaterial({
      color: 0x6f2520,
      roughness: 0.35,
      metalness: 0.05,
      emissive: 0x3c0906,
      emissiveIntensity: 0.85
    });
    const greenLensMaterial = new THREE.MeshStandardMaterial({
      color: 0x7fa18b,
      roughness: 0.28,
      metalness: 0.04,
      emissive: 0x5cd98b,
      emissiveIntensity: 2.4
    });
    const indicatorHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.035, 18), gatePaintDark);
    indicatorHousing.position.set(-0.13, 0.355, 0.192);
    indicatorHousing.rotation.x = Math.PI / 2;
    const redIndicator = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.04, 18), redLensMaterial);
    redIndicator.name = 'gate_indicator_red_visual';
    redIndicator.position.set(-0.13, 0.355, 0.214);
    redIndicator.rotation.x = Math.PI / 2;
    const greenIndicator = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.04, 18), greenLensMaterial);
    greenIndicator.name = 'gate_indicator_green_visual';
    greenIndicator.position.copy(redIndicator.position);
    greenIndicator.rotation.copy(redIndicator.rotation);
    greenIndicator.visible = false;
    const indicatorLight = new THREE.PointLight(0x7ff5a5, 0.28, 0.72, 1.9);
    indicatorLight.name = 'gate_indicator_light_visual';
    indicatorLight.position.set(-0.13, 0.355, 0.4);
    indicatorLight.visible = false;

    const gateBarrier = new THREE.Group();
    gateBarrier.name = 'gate_barrier_visual';
    gateBarrier.position.set(0.23, 0.205, 0.04);
    const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.18, 16), gatePaintDark);
    pivot.name = 'gate_barrier_pivot_visual';
    const arm = this.box(0.68, 0.05, 0.055, gatePaintDark, 0.34, 0, 0);
    arm.name = 'gate_barrier_arm_visual';
    const armBandA = this.box(0.11, 0.054, 0.059, gateEnamel, 0.23, 0, 0);
    const armBandB = this.box(0.11, 0.054, 0.059, gateEnamel, 0.5, 0, 0);
    const armTip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), gateRust);
    armTip.position.set(0.69, 0, 0);
    gateBarrier.add(pivot, arm, armBandA, armBandB, armTip);

    for (const [x, y, width, height] of [
      [-0.155, -0.22, 0.06, 0.025],
      [0.14, -0.16, 0.045, 0.02],
      [-0.12, 0.12, 0.035, 0.018],
      [0.13, 0.17, 0.055, 0.022]
    ] as Array<[number, number, number, number]>) {
      const chip = this.box(width, height, 0.012, gateRust, x, y, 0.205);
      chip.rotation.z = x * 0.9;
      gate.add(chip);
    }
    for (const [x, y] of [[-0.165, -0.235], [0.165, -0.235], [-0.165, 0.185], [0.165, 0.185]] as Array<[number, number]>) {
      const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 6), gateEdge);
      bolt.position.set(x, y, 0.21);
      gate.add(bolt);
    }

    gate.add(
      gateBody,
      gateFront,
      gateBase,
      gateCap,
      gateSlot,
      slotLipTop,
      slotLipBottom,
      labelPlate,
      indicatorHousing,
      redIndicator,
      greenIndicator,
      indicatorLight,
      gateBarrier
    );
    gate.position.set(0.72, 0.43, -3.35);
    gate.rotation.y = -0.08;

    const busBody = this.stationBusSideProfile();
    busBody.updateMatrixWorld(true);
    const busDoorWorld = busBody.localToWorld(new THREE.Vector3(1.68, 0.73, 0.025));

    const busContactShadow = new THREE.Group();
    busContactShadow.name = 'station_bus_contact_shadow_visual';
    busContactShadow.position.copy(busBody.position);
    busContactShadow.position.y = 0.008;
    busContactShadow.rotation.copy(busBody.rotation);
    busContactShadow.scale.copy(busBody.scale);
    const busShadowMesh = new THREE.Mesh(
      new THREE.CircleGeometry(1, 40),
      new THREE.MeshBasicMaterial({ color: 0x10171b, transparent: true, opacity: 0.34, depthWrite: false })
    );
    busShadowMesh.name = 'station_bus_contact_shadow_mesh_visual';
    busShadowMesh.rotation.x = -Math.PI / 2;
    busShadowMesh.scale.set(2.15, 0.42, 1);
    busContactShadow.add(busShadowMesh);

    const busDoorProxy = this.box(
      0.58,
      1.15,
      0.32,
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      busDoorWorld.x,
      busDoorWorld.y,
      busDoorWorld.z
    );
    busDoorProxy.name = 'exit_bus_door_visual';
    const busFillLight = new THREE.PointLight(0xb8d0e1, 0.54, 8, 1.7);
    busFillLight.name = 'station_bus_fill_light_visual';
    busFillLight.position.set(3.24, 1.36, -9.85);
    root.add(gate, busContactShadow, busBody, busDoorProxy, busFillLight);

    const farPlant = new THREE.Group();
    farPlant.name = 'station_far_plant_visual';
    farPlant.position.set(0.18, 0, -11.76);
    const potMaterial = new THREE.MeshStandardMaterial({ color: 0x6b5148, roughness: 0.88 });
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x3e5c4d, roughness: 0.86 });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.19, 0.3, 18), potMaterial);
    pot.position.y = 0.15;
    farPlant.add(pot);
    for (let index = 0; index < 5; index += 1) {
      const angle = -0.7 + index * 0.35;
      const end = new THREE.Vector3(Math.sin(angle) * 0.22, 0.72 + (index % 2) * 0.12, Math.cos(angle) * 0.08);
      farPlant.add(this.cylinderBetween(new THREE.Vector3(0, 0.28, 0), end, 0.012, leafMaterial, 8));
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), leafMaterial);
      leaf.scale.set(1.25, 0.48, 0.35);
      leaf.position.copy(end);
      leaf.rotation.z = -angle;
      farPlant.add(leaf);
    }
    root.add(farPlant);

    const atmosphere = new THREE.Group();
    atmosphere.name = 'station_atmosphere_visual';
    for (const [x, rotation] of [[-3.29, Math.PI / 2], [3.29, -Math.PI / 2]] as Array<[number, number]>) {
      const rainTexture = this.assetTexture('/assets/generated/shared_vfx/shared_vfx_rain_streak.png');
      rainTexture.wrapS = THREE.RepeatWrapping;
      rainTexture.wrapT = THREE.RepeatWrapping;
      rainTexture.repeat.set(8, 1.2);
      const rainVeil = new THREE.Mesh(
        new THREE.PlaneGeometry(23, 2.5),
        new THREE.MeshBasicMaterial({ map: rainTexture, color: 0xaabdd0, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide })
      );
      rainVeil.name = 'station_rain_veil_visual';
      rainVeil.rotation.y = rotation;
      rainVeil.position.set(x, 1.4, -4.1);
      atmosphere.add(rainVeil);
    }
    const outdoorRainTexture = this.assetTexture('/assets/generated/shared_vfx/shared_vfx_rain_streak.png');
    outdoorRainTexture.wrapS = THREE.RepeatWrapping;
    outdoorRainTexture.wrapT = THREE.RepeatWrapping;
    outdoorRainTexture.repeat.set(3.6, 1.15);
    const outdoorRain = new THREE.Mesh(
      new THREE.PlaneGeometry(6.4, 3.2),
      new THREE.MeshBasicMaterial({
        map: outdoorRainTexture,
        color: 0xa9bed0,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    outdoorRain.name = 'station_outdoor_rain_visual';
    outdoorRain.position.set(3.35, 1.55, -5.85);
    outdoorRain.renderOrder = 18;
    atmosphere.add(outdoorRain);
    const fogTexture = this.assetTexture('/assets/generated/shared_vfx/shared_vfx_fog_noise.png');
    fogTexture.wrapS = THREE.RepeatWrapping;
    const farHaze = new THREE.Mesh(
      new THREE.PlaneGeometry(3.9, 1.25),
      new THREE.MeshBasicMaterial({ map: fogTexture, alphaMap: fogTexture, color: 0x91a0ad, transparent: true, opacity: 0.13, depthWrite: false })
    );
    farHaze.name = 'station_far_haze_visual';
    farHaze.position.set(0, 0.76, -10.9);
    atmosphere.add(farHaze);
    root.add(atmosphere);

    this.addHotspot(root, hotspots, 'hotspot_ticket', new THREE.Vector3(-1.22, 0.48, 1.29), new THREE.Vector3(0.32, 0.15, 0.18));
    this.addHotspot(root, hotspots, 'hotspot_board', new THREE.Vector3(0.12, 2.42, -6.28), new THREE.Vector3(1.2, 0.44, 0.18));
    this.addHotspot(root, hotspots, 'hotspot_gate', new THREE.Vector3(0.72, 0.43, -3.35), new THREE.Vector3(1.04, 0.84, 0.42));
    this.addHotspot(root, hotspots, 'exit_bus_door', busDoorWorld, new THREE.Vector3(0.62, 1.18, 0.36));
  }

  private createBuildingStairs(stepMaterial: THREE.Material, railMaterial: THREE.Material): THREE.Group {
    const stairs = new THREE.Group();
    stairs.name = 'building_stairs_visual';

    const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x5e5e5b, roughness: 0.94, metalness: 0.02 });
    const wearMaterial = new THREE.MeshStandardMaterial({ color: 0x4b4745, roughness: 1, metalness: 0 });
    const stepHeight = 0.155;
    const stepDepth = 0.3;
    const mainCount = 12;
    const mainWidth = 1.5;
    const mainX = -0.68;
    const mainStartZ = -0.52;

    for (let index = 0; index < mainCount; index += 1) {
      const topY = (index + 1) * stepHeight;
      const z = mainStartZ - index * stepDepth;
      const step = this.box(mainWidth, topY, stepDepth + 0.025, stepMaterial, mainX, topY / 2, z);
      step.name = `building_main_step_${index}_visual`;
      const nosing = this.box(mainWidth + 0.08, 0.035, 0.06, edgeMaterial, mainX, topY + 0.017, z + stepDepth * 0.47);
      nosing.name = `building_main_nosing_${index}_visual`;
      stairs.add(step, nosing);
      if ([1, 4, 7, 10].includes(index)) {
        const wear = this.box(0.24 + (index % 3) * 0.05, 0.012, 0.09, wearMaterial, mainX - 0.18 + (index % 2) * 0.32, topY + 0.012, z + 0.04);
        wear.rotation.y = index % 2 === 0 ? 0.12 : -0.1;
        stairs.add(wear);
      }
    }

    const landingY = mainCount * stepHeight;
    const landing = this.box(2.95, 0.2, 0.82, stepMaterial, -0.14, landingY - 0.1, -4.08);
    landing.name = 'building_turn_landing_visual';
    stairs.add(landing);

    const mainRailStartZ = mainStartZ + 0.18;
    const mainRailEndZ = -3.82;
    for (const side of [-1, 1]) {
      const x = mainX + side * (mainWidth / 2 + 0.08);
      const railStart = new THREE.Vector3(x, 0.92, mainRailStartZ);
      const railEnd = new THREE.Vector3(x, landingY + 0.9, mainRailEndZ);
      stairs.add(
        this.cylinderBetween(railStart, railEnd, 0.032, railMaterial, 12),
        this.cylinderBetween(
          railStart.clone().add(new THREE.Vector3(0, -0.38, 0)),
          railEnd.clone().add(new THREE.Vector3(0, -0.38, 0)),
          0.018,
          railMaterial,
          10
        )
      );
      for (let index = 0; index < mainCount; index += 2) {
        const topY = (index + 1) * stepHeight;
        const z = mainStartZ - index * stepDepth;
        stairs.add(this.cylinderBetween(
          new THREE.Vector3(x, topY, z),
          new THREE.Vector3(x, topY + 0.86, z),
          0.019,
          railMaterial,
          10
        ));
      }
    }

    const landingRailY = landingY + 0.9;
    for (const x of [-1.5, -0.95, -0.4, 0.15, 0.7, 1.25]) {
      stairs.add(this.cylinderBetween(
        new THREE.Vector3(x, landingY, -4.18),
        new THREE.Vector3(x, landingRailY, -4.18),
        0.02,
        railMaterial,
        10
      ));
    }
    stairs.add(
      this.cylinderBetween(new THREE.Vector3(-1.52, landingRailY, -4.18), new THREE.Vector3(1.28, landingRailY, -4.18), 0.032, railMaterial, 12),
      this.cylinderBetween(new THREE.Vector3(-1.52, landingRailY - 0.4, -4.18), new THREE.Vector3(1.28, landingRailY - 0.4, -4.18), 0.018, railMaterial, 10)
    );

    const upperCount = 10;
    const upperWidth = 1.1;
    const upperX = 1.05;
    const upperStartZ = -3.72;
    const upperDepth = 0.285;
    const upperTopY = landingY + upperCount * stepHeight;
    const upperEndZ = upperStartZ + (upperCount - 1) * upperDepth;
    const upperRise = upperTopY - landingY;
    const upperRun = upperEndZ - upperStartZ + upperDepth;
    const upperSlabLength = Math.hypot(upperRun, upperRise);
    const upperSlab = this.box(
      upperWidth,
      0.18,
      upperSlabLength,
      stepMaterial,
      upperX,
      (landingY + upperTopY) / 2 - 0.12,
      (upperStartZ + upperEndZ) / 2
    );
    upperSlab.name = 'building_upper_stair_slab_visual';
    upperSlab.rotation.x = -Math.atan2(upperRise, upperRun);
    stairs.add(upperSlab);
    for (let index = 0; index < upperCount; index += 1) {
      const relativeTop = (index + 1) * stepHeight;
      const topY = landingY + relativeTop;
      const z = upperStartZ + index * upperDepth;
      const step = this.box(upperWidth, 0.1, upperDepth + 0.025, stepMaterial, upperX, topY - 0.05, z);
      step.name = `building_upper_step_${index}_visual`;
      const riser = this.box(upperWidth, stepHeight, 0.065, stepMaterial, upperX, topY - stepHeight / 2, z + upperDepth * 0.48);
      const nosing = this.box(upperWidth + 0.07, 0.035, 0.055, edgeMaterial, upperX, topY + 0.017, z + upperDepth * 0.47);
      stairs.add(step, riser, nosing);
      if ([2, 6, 9].includes(index)) {
        stairs.add(this.box(0.22, 0.012, 0.075, wearMaterial, upperX + (index % 2 ? 0.18 : -0.2), topY + 0.012, z + 0.02));
      }
    }

    const upperLanding = this.box(1.55, 0.2, 0.72, stepMaterial, upperX, upperTopY - 0.1, -0.72);
    upperLanding.name = 'building_upper_landing_visual';
    stairs.add(upperLanding);

    for (const side of [-1, 1]) {
      const x = upperX + side * (upperWidth / 2 + 0.08);
      const railStart = new THREE.Vector3(x, landingY + 0.9, upperStartZ - 0.12);
      const railEnd = new THREE.Vector3(x, upperTopY + 0.9, -1.08);
      stairs.add(
        this.cylinderBetween(railStart, railEnd, 0.032, railMaterial, 12),
        this.cylinderBetween(
          railStart.clone().add(new THREE.Vector3(0, -0.4, 0)),
          railEnd.clone().add(new THREE.Vector3(0, -0.4, 0)),
          0.018,
          railMaterial,
          10
        )
      );
      for (let index = 0; index < upperCount; index += 2) {
        const topY = landingY + (index + 1) * stepHeight;
        const z = upperStartZ + index * upperDepth;
        stairs.add(this.cylinderBetween(
          new THREE.Vector3(x, topY, z),
          new THREE.Vector3(x, topY + 0.86, z),
          0.019,
          railMaterial,
          10
        ));
      }
    }

    return stairs;
  }
  private createBuildingShoeCabinet(): THREE.Group {
    const cabinet = new THREE.Group();
    cabinet.name = 'building_shoe_cabinet_visual';
    cabinet.position.set(1.5, 0, -0.1);
    cabinet.rotation.y = -0.06;
    const wood = this.mappedMaterial('/assets/generated/scene03_v2/s03_ref_old_wood.jpg', 1.1, 1.3, 0.92);
    wood.color.setHex(0x9a7d65);
    wood.emissive.setHex(0x2a2019);
    wood.emissiveIntensity = 0.22;
    const woodDark = new THREE.MeshStandardMaterial({ color: 0x342820, emissive: 0x17100c, emissiveIntensity: 0.14, roughness: 0.95 });
    const enamel = new THREE.MeshStandardMaterial({ color: 0xcfc9bd, roughness: 0.48, metalness: 0.06 });
    cabinet.add(
      this.box(0.94, 0.72, 0.045, woodDark, 0, 0.43, -0.17),
      this.box(1.02, 0.08, 0.38, wood, 0, 0.06, 0),
      this.box(1.02, 0.08, 0.38, wood, 0, 0.42, 0),
      this.box(1.02, 0.08, 0.38, wood, 0, 0.78, 0),
      this.box(0.08, 0.82, 0.38, woodDark, -0.47, 0.41, 0),
      this.box(0.08, 0.82, 0.38, woodDark, 0.47, 0.41, 0),
      this.box(1.08, 0.09, 0.42, wood, 0, 0.86, 0)
    );
    for (const y of [0.42, 0.78]) {
      cabinet.add(this.box(0.28, 0.025, 0.035, woodDark, 0, y, 0.225));
    }
    for (const [x, y, rotation] of [[-0.24, 0.18, 0.12], [0.18, 0.18, -0.1], [-0.18, 0.55, -0.06], [0.25, 0.55, 0.08]] as Array<[number, number, number]>) {
      const shoe = this.box(0.32, 0.1, 0.16, woodDark, x, y, 0.11);
      shoe.rotation.y = rotation;
      cabinet.add(shoe);
    }
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.29, 0.17, 28, 1, true), enamel);
    basin.position.set(-0.18, 1.02, 0);
    const basinRim = new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.015, 8, 32), enamel);
    basinRim.rotation.x = Math.PI / 2;
    basinRim.position.copy(basin.position).add(new THREE.Vector3(0, 0.085, 0));
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.1, 18), enamel);
    cup.position.set(0.27, 0.97, 0.03);
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.018, 20), enamel);
    saucer.position.set(0.27, 0.91, 0.03);
    cabinet.add(basin, basinRim, cup, saucer);
    return cabinet;
  }

  private createBuildingLandingProps(
    wood: THREE.Material,
    metal: THREE.Material,
    fabric: THREE.Material
  ): THREE.Group {
    const props = new THREE.Group();
    props.name = 'building_landing_props_visual';

    const crate = new THREE.Group();
    crate.position.set(1.72, 0, -1.72);
    for (const x of [-0.25, 0.25]) crate.add(this.box(0.055, 0.54, 0.43, wood, x, 0.27, 0));
    for (const y of [0.08, 0.26, 0.44]) crate.add(this.box(0.56, 0.065, 0.43, wood, 0, y, 0));
    props.add(crate);

    const stool = new THREE.Group();
    stool.position.set(0.92, 0, 0.05);
    stool.add(this.box(0.42, 0.075, 0.3, wood, 0, 0.36, 0));
    for (const side of [-1, 1]) {
      const legA = this.box(0.045, 0.42, 0.045, wood, side * 0.14, 0.18, 0);
      legA.rotation.z = side * 0.42;
      const legB = legA.clone();
      legB.rotation.z *= -1;
      stool.add(legA, legB);
    }
    props.add(stool);

    for (const [x, z, rotation] of [[1.28, 0.52, -0.12], [1.66, 0.45, 0.16]] as Array<[number, number, number]>) {
      const shoe = this.box(0.34, 0.11, 0.17, fabric, x, 0.07, z);
      shoe.rotation.y = rotation;
      props.add(shoe);
    }

    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.32, 20, 1, true), metal);
    bucket.position.set(2.18, 0.16, -2.72);
    props.add(bucket);

    const dustpan = new THREE.Group();
    dustpan.position.set(2.18, 0.02, -0.32);
    const pan = this.box(0.3, 0.055, 0.32, metal, 0, 0.06, 0);
    pan.rotation.x = -0.12;
    dustpan.add(pan, this.cylinderBetween(new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(0.06, 0.88, 0), 0.016, metal, 8));
    props.add(dustpan);
    return props;
  }

  private createBuildingDetailLayer(
    pipeMaterial: THREE.Material,
    railMaterial: THREE.Material
  ): THREE.Group {
    const details = new THREE.Group();
    details.name = 'building_detail_layer_visual';

    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x43564f, roughness: 0.98, metalness: 0.02 });
    const chippedPlaster = new THREE.MeshStandardMaterial({ color: 0x777177, roughness: 1, metalness: 0 });
    const crackMaterial = new THREE.MeshStandardMaterial({ color: 0x36383a, roughness: 1, metalness: 0 });
    const wovenMaterial = new THREE.MeshStandardMaterial({ color: 0x625447, roughness: 1, metalness: 0 });
    const wovenDark = new THREE.MeshStandardMaterial({ color: 0x39322d, roughness: 1, metalness: 0 });
    const paperMaterial = new THREE.MeshStandardMaterial({ color: 0xafa796, roughness: 0.98, metalness: 0 });
    const paperInk = new THREE.MeshStandardMaterial({ color: 0x57534d, roughness: 1, metalness: 0 });

    details.add(
      this.box(4.04, 0.14, 0.065, baseMaterial, -0.57, 0.07, -4.64),
      this.box(0.14, 0.14, 0.065, baseMaterial, 2.52, 0.07, -4.64),
      this.box(0.065, 0.14, 12.04, baseMaterial, -2.54, 0.07, 1.4),
      this.box(0.065, 0.14, 12.04, baseMaterial, 2.54, 0.07, 1.4),
      this.box(0.025, 0.42, 1.08, baseMaterial, -2.575, 0.34, -1.2),
      this.box(0.025, 0.3, 0.72, baseMaterial, -2.575, 0.26, 1.78),
      this.box(0.025, 0.48, 0.9, baseMaterial, 2.575, 0.38, -2.1)
    );

    const chips = [
      [-2.1, 2.18, 0.38, 0.16, 0.08],
      [-2.32, 3.34, 0.24, 0.12, -0.16],
      [0.18, 2.08, 0.28, 0.11, -0.1],
      [1.3, 3.46, 0.34, 0.14, 0.12],
      [2.5, 2.72, 0.2, 0.1, -0.08]
    ] as Array<[number, number, number, number, number]>;
    for (const [x, y, width, height, rotation] of chips) {
      const chip = this.box(width, height, 0.025, chippedPlaster, x, y, -4.69);
      chip.rotation.z = rotation;
      details.add(chip);
    }

    const crackSegments = [
      [[-2.28, 3.75, -4.67], [-2.18, 3.45, -4.67]],
      [[-2.18, 3.45, -4.67], [-2.05, 3.26, -4.67]],
      [[-2.18, 3.45, -4.67], [-2.33, 3.3, -4.67]],
      [[1.28, 3.86, -4.67], [1.18, 3.62, -4.67]],
      [[1.18, 3.62, -4.67], [1.31, 3.44, -4.67]]
    ] as Array<[[number, number, number], [number, number, number]]>;
    for (const [start, end] of crackSegments) {
      details.add(this.cylinderBetween(new THREE.Vector3(...start), new THREE.Vector3(...end), 0.008, crackMaterial, 6));
    }

    const doorMat = this.box(0.84, 0.025, 0.46, wovenMaterial, 1.95, 0.012, -4.08);
    doorMat.name = 'building_door_mat_visual';
    details.add(doorMat);
    for (let index = -4; index <= 4; index += 1) {
      details.add(this.box(0.025, 0.012, 0.42, wovenDark, 1.95 + index * 0.085, 0.031, -4.08));
    }

    const drain = new THREE.Group();
    drain.name = 'building_floor_drain_visual';
    drain.add(this.box(0.46, 0.018, 0.32, railMaterial, 0.78, 0.006, 1.34));
    for (let index = -3; index <= 3; index += 1) {
      drain.add(this.box(0.025, 0.012, 0.27, crackMaterial, 0.78 + index * 0.058, 0.022, 1.34));
    }
    details.add(drain);

    const ceilingBox = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.055, 18),
      new THREE.MeshStandardMaterial({ color: 0x4b4b48, roughness: 0.72, metalness: 0.32 })
    );
    ceilingBox.position.set(-0.15, 5.32, 1.45);
    details.add(
      ceilingBox,
      this.cylinderBetween(new THREE.Vector3(-0.15, 5.31, 1.45), new THREE.Vector3(-0.15, 5.31, -1.2), 0.014, pipeMaterial, 8)
    );
    for (const z of [0.92, 0.22, -0.48]) {
      details.add(this.box(0.14, 0.025, 0.05, railMaterial, -0.15, 5.285, z));
    }

    const newspapers = new THREE.Group();
    newspapers.name = 'building_newspapers_visual';
    newspapers.position.set(2.12, 0.02, 1.02);
    for (let index = 0; index < 3; index += 1) {
      const sheet = this.box(0.42, 0.012, 0.3, paperMaterial, index * 0.015, index * 0.016, -index * 0.012);
      sheet.rotation.y = 0.08 - index * 0.06;
      newspapers.add(sheet);
    }
    newspapers.add(
      this.box(0.3, 0.008, 0.018, paperInk, 0, 0.06, -0.04),
      this.box(0.2, 0.008, 0.014, paperInk, -0.04, 0.06, 0.02)
    );
    details.add(newspapers);

    const umbrella = new THREE.Group();
    umbrella.name = 'building_umbrella_visual';
    umbrella.position.set(2.38, 0, 1.16);
    umbrella.rotation.z = -0.08;
    umbrella.add(
      this.cylinderBetween(new THREE.Vector3(0, 0.04, 0), new THREE.Vector3(-0.08, 1.1, 0), 0.015, railMaterial, 8),
      new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.52, 12), new THREE.MeshStandardMaterial({ color: 0x3f4546, roughness: 0.94 }))
    );
    umbrella.children[1].position.set(-0.025, 0.34, 0);
    details.add(umbrella);

    const fuseBox = new THREE.Group();
    fuseBox.name = 'building_old_fuse_box_visual';
    fuseBox.position.set(-2.08, 2.5, -4.61);
    const fuseCasing = new THREE.MeshStandardMaterial({ color: 0x9b978d, roughness: 0.88, metalness: 0.08 });
    const porcelain = new THREE.MeshStandardMaterial({ color: 0xc1bbae, roughness: 0.48, metalness: 0.02 });
    fuseBox.add(this.box(0.28, 0.38, 0.1, fuseCasing, 0, 0, 0));
    for (const x of [-0.07, 0.07]) {
      const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.035, 14), porcelain);
      fuse.rotation.x = Math.PI / 2;
      fuse.position.set(x, 0.03, 0.075);
      fuseBox.add(fuse);
    }
    fuseBox.add(this.box(0.16, 0.04, 0.018, crackMaterial, 0, -0.11, 0.07));
    details.add(
      fuseBox,
      this.cylinderBetween(new THREE.Vector3(-2.08, 2.69, -4.62), new THREE.Vector3(-2.08, 4.84, -4.62), 0.012, pipeMaterial, 8)
    );

    const floorPlate = this.panel(this.textures.createBuildingFloorPlate(), 0.36, 0.18);
    floorPlate.name = 'building_floor_plate_visual';
    floorPlate.position.set(-2.08, 1.86, -4.65);
    details.add(floorPlate);

    const thermos = new THREE.Group();
    thermos.name = 'building_red_thermos_visual';
    thermos.position.set(2.04, 0, 0.62);
    const thermosRed = new THREE.MeshStandardMaterial({ color: 0x783f3c, emissive: 0x28100f, emissiveIntensity: 0.16, roughness: 0.68, metalness: 0.12 });
    const thermosMetal = new THREE.MeshStandardMaterial({ color: 0xa6a096, roughness: 0.52, metalness: 0.46 });
    const thermosBody = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.13, 0.43, 20), thermosRed);
    thermosBody.position.y = 0.24;
    const thermosCap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.09, 18), thermosMetal);
    thermosCap.position.y = 0.5;
    const thermosHandle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 8, 20, Math.PI), thermosMetal);
    thermosHandle.position.set(0.1, 0.36, 0);
    thermosHandle.rotation.z = -Math.PI / 2;
    thermos.add(thermosBody, thermosCap, thermosHandle);
    details.add(thermos);

    const ceilingStainMaterial = new THREE.MeshBasicMaterial({
      color: 0x4b4550,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    for (const [x, z, scaleX, scaleY] of [[-1.35, 0.55, 1.4, 0.62], [1.45, -2.2, 0.9, 0.48]] as Array<[number, number, number, number]>) {
      const stain = new THREE.Mesh(new THREE.CircleGeometry(0.42, 28), ceilingStainMaterial.clone());
      stain.rotation.x = Math.PI / 2;
      stain.scale.set(scaleX, scaleY, 1);
      stain.position.set(x, 5.325, z);
      details.add(stain);
    }

    const footprintMaterial = new THREE.MeshBasicMaterial({
      color: 0x302e32,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const footprints = new THREE.Group();
    footprints.name = 'building_floor_footprints_visual';
    const footprintPath = [
      [-0.2, 2.72, -0.08],
      [0.13, 1.9, 0.09],
      [-0.04, 1.05, -0.06],
      [0.32, 0.15, 0.12],
      [0.48, -0.82, 0.07],
      [0.82, -1.82, 0.14]
    ] as Array<[number, number, number]>;
    for (const [x, z, rotation] of footprintPath) {
      const print = new THREE.Group();
      print.position.set(x, 0.024, z);
      print.rotation.y = rotation;
      const toe = new THREE.Mesh(new THREE.CircleGeometry(0.095, 18), footprintMaterial);
      toe.rotation.x = -Math.PI / 2;
      toe.scale.set(0.72, 1.05, 1);
      toe.position.z = -0.06;
      const heel = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.11), footprintMaterial);
      heel.rotation.x = -Math.PI / 2;
      heel.position.z = 0.08;
      print.add(toe, heel);
      footprints.add(print);
    }
    details.add(footprints);

    return details;
  }

  private createBuildingWindow(): THREE.Group {
    const windowGroup = new THREE.Group();
    windowGroup.name = 'building_window_visual';
    windowGroup.position.set(-0.68, 2.67, -4.72);

    const recessMaterial = new THREE.MeshStandardMaterial({ color: 0x222a2d, roughness: 0.96, metalness: 0.04 });
    const revealMaterial = new THREE.MeshStandardMaterial({ color: 0x77777b, roughness: 0.98 });
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x3b484c, roughness: 0.58, metalness: 0.58 });
    const recess = this.box(1.62, 1.68, 0.12, recessMaterial, 0, 0, -0.12);
    recess.name = 'building_window_recess_visual';
    const view = this.panel(this.textures.createSchoolWindowView(), 1.34, 1.38);
    view.name = 'building_window_view_visual';
    view.position.z = -0.045;
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.34, 1.38),
      new THREE.MeshPhysicalMaterial({
        color: 0x8394ae,
        transparent: true,
        opacity: 0.18,
        roughness: 0.28,
        transmission: 0.14,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    glass.position.z = 0.035;
    windowGroup.add(
      recess,
      view,
      glass,
      this.box(0.12, 1.72, 0.3, revealMaterial, -0.78, 0, 0),
      this.box(0.12, 1.72, 0.3, revealMaterial, 0.78, 0, 0),
      this.box(1.68, 0.12, 0.3, revealMaterial, 0, 0.8, 0),
      this.box(1.78, 0.12, 0.4, revealMaterial, 0, -0.82, 0.045)
    );
    for (const x of [-0.7, 0, 0.7]) windowGroup.add(this.box(0.055, 1.5, 0.065, frameMaterial, x, 0, 0.075));
    for (const y of [-0.74, 0, 0.74]) windowGroup.add(this.box(1.46, 0.055, 0.065, frameMaterial, 0, y, 0.075));
    return windowGroup;
  }

  private createBuildingBicycle(): THREE.Group {
    const bicycle = new THREE.Group();
    bicycle.name = 'bike_visual';
    const rubber = new THREE.MeshStandardMaterial({ color: 0x111314, roughness: 0.78, metalness: 0.08 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x252a2b, roughness: 0.42, metalness: 0.7 });
    const frame = new THREE.MeshStandardMaterial({ color: 0x202526, roughness: 0.48, metalness: 0.58 });
    const wornLeather = new THREE.MeshStandardMaterial({ color: 0x30251f, roughness: 0.9 });

    for (const x of [-0.52, 0.52]) {
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.026, 10, 42), rubber);
      tire.position.set(x, 0.38, 0);
      bicycle.add(tire);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.055, 14), steel);
      hub.rotation.x = Math.PI / 2;
      hub.position.set(x, 0.38, 0);
      bicycle.add(hub);
      for (let index = 0; index < 12; index += 1) {
        const angle = index * Math.PI / 6;
        bicycle.add(this.cylinderBetween(
          new THREE.Vector3(x, 0.38, 0),
          new THREE.Vector3(x + Math.cos(angle) * 0.33, 0.38 + Math.sin(angle) * 0.33, 0),
          0.004,
          steel,
          6
        ));
      }
    }

    const rearHub = new THREE.Vector3(-0.52, 0.38, 0);
    const crank = new THREE.Vector3(-0.02, 0.38, 0);
    const seatJoint = new THREE.Vector3(-0.18, 0.82, 0);
    const frontHub = new THREE.Vector3(0.52, 0.38, 0);
    const handleJoint = new THREE.Vector3(0.38, 0.88, 0);
    bicycle.add(
      this.cylinderBetween(rearHub, crank, 0.025, frame, 10),
      this.cylinderBetween(crank, seatJoint, 0.026, frame, 10),
      this.cylinderBetween(seatJoint, rearHub, 0.025, frame, 10),
      this.cylinderBetween(seatJoint, handleJoint, 0.025, frame, 10),
      this.cylinderBetween(handleJoint, frontHub, 0.027, frame, 10),
      this.cylinderBetween(crank, handleJoint, 0.023, frame, 10),
      this.cylinderBetween(seatJoint, new THREE.Vector3(-0.2, 0.98, 0), 0.018, steel, 8),
      this.cylinderBetween(handleJoint, new THREE.Vector3(0.43, 1.04, 0), 0.018, steel, 8)
    );
    const seat = this.box(0.25, 0.055, 0.12, wornLeather, -0.23, 1.01, 0);
    seat.rotation.z = -0.08;
    bicycle.add(seat);
    bicycle.add(
      this.cylinderBetween(new THREE.Vector3(0.34, 1.04, 0), new THREE.Vector3(0.55, 1.04, 0), 0.015, steel, 8),
      this.cylinderBetween(new THREE.Vector3(-0.16, 0.38, 0), new THREE.Vector3(0.12, 0.38, 0), 0.012, steel, 8)
    );
    for (const x of [-0.52, 0.52]) {
      const fender = new THREE.Mesh(new THREE.TorusGeometry(0.375, 0.012, 8, 34, Math.PI * 1.18), steel);
      fender.position.set(x, 0.38, 0);
      fender.rotation.z = -0.28;
      bicycle.add(fender);
    }
    const chainRing = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.022, 22), steel);
    chainRing.rotation.x = Math.PI / 2;
    chainRing.position.copy(crank);
    bicycle.add(
      chainRing,
      this.cylinderBetween(new THREE.Vector3(-0.56, 0.74, 0), new THREE.Vector3(-0.15, 0.74, 0), 0.016, steel, 8),
      this.cylinderBetween(new THREE.Vector3(-0.56, 0.74, 0), new THREE.Vector3(-0.52, 0.5, 0), 0.012, steel, 8),
      this.cylinderBetween(new THREE.Vector3(-0.15, 0.74, 0), new THREE.Vector3(-0.18, 0.82, 0), 0.012, steel, 8),
      this.cylinderBetween(new THREE.Vector3(-0.08, 0.36, 0), new THREE.Vector3(-0.22, 0.04, 0.12), 0.012, steel, 8)
    );
    bicycle.position.set(-1.42, 0.02, 0.88);
    bicycle.rotation.y = -0.24;
    return bicycle;
  }

  private createArchiveShelf(width: number, height: number, depth: number, seedOffset = 0): THREE.Group {
    const shelf = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({ color: 0x343434, roughness: 0.58, metalness: 0.52 });
    const paper = this.mappedMaterial('/assets/generated/scene04_v2/s04_ref_archive_boxes.jpg', 1.1, 1.1, 0.95);
    paper.color.setHex(0x8d7963);
    paper.emissive.setHex(0x32291f);
    paper.emissiveIntensity = 0.58;
    const paperDark = this.mappedMaterial('/assets/generated/scene04_v2/s04_ref_archive_boxes.jpg', 1.25, 1.15, 0.97);
    paperDark.color.setHex(0x5d554c);
    paperDark.emissive.setHex(0x211d19);
    paperDark.emissiveIntensity = 0.52;
    for (const x of [-width / 2 + 0.045, width / 2 - 0.045]) shelf.add(this.box(0.09, height, depth, metal, x, height / 2, 0));
    for (let row = 0; row <= 4; row += 1) shelf.add(this.box(width, 0.075, depth, metal, 0, row * height / 4, 0));
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        if ((row + column + seedOffset) % 5 === 0) continue;
        const boxWidth = width * 0.22;
        shelf.add(this.box(
          boxWidth,
          height * 0.13,
          depth * 0.78,
          (row + column) % 2 === 0 ? paper : paperDark,
          -width * 0.27 + column * width * 0.27,
          row * height / 4 + height * 0.12,
          0.015
        ));
      }
    }
    for (const child of shelf.children) child.position.y -= height / 2;
    return shelf;
  }

  private createProjectorReel(radius: number, metal: THREE.Material): THREE.Group {
    const reel = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.026, 10, 40), metal);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.42, 0.018, 8, 28), metal);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 16), metal);
    hub.rotation.x = Math.PI / 2;
    reel.add(outer, inner, hub);
    for (let index = 0; index < 6; index += 1) {
      const angle = index * Math.PI / 3;
      const spoke = this.box(radius * 0.66, 0.026, 0.022, metal, Math.cos(angle) * radius * 0.34, Math.sin(angle) * radius * 0.34, 0);
      spoke.rotation.z = angle;
      reel.add(spoke);
    }
    return reel;
  }

  private createProjectionStand(metal: THREE.Material, wood: THREE.Material): THREE.Group {
    const stand = new THREE.Group();
    stand.name = 'projector_stand_visual';
    stand.add(
      this.box(0.78, 0.07, 0.58, wood, 0, 0.405, 0),
      this.box(0.68, 0.055, 0.5, metal, 0, -0.405, 0)
    );
    for (const x of [-0.33, 0.33]) {
      for (const z of [-0.23, 0.23]) stand.add(this.box(0.045, 0.8, 0.045, metal, x, 0, z));
    }
    stand.position.set(-1.48, 0.44, 0.18);
    return stand;
  }

  private createProjectionProjector(metal: THREE.Material): THREE.Group {
    const projector = new THREE.Group();
    projector.name = 'projector_visual';
    projector.position.set(-1.48, 1.02, 0.16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x171818, roughness: 0.58, metalness: 0.56 });
    const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x7f94a5, emissive: 0x34455b, emissiveIntensity: 0.55, roughness: 0.18, metalness: 0.12 });
    projector.add(
      this.box(0.62, 0.35, 0.45, bodyMaterial, 0, -0.08, 0),
      this.box(0.42, 0.08, 0.32, metal, 0, -0.3, 0)
    );
    const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.12, 0.3, 24), metal);
    lensBarrel.rotation.x = Math.PI / 2;
    lensBarrel.position.set(0.12, -0.04, -0.32);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.083, 0.083, 0.025, 24), glassMaterial);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0.12, -0.04, -0.48);
    projector.add(lensBarrel, lens);
    const rearReel = this.createProjectorReel(0.29, metal);
    rearReel.position.set(-0.2, 0.37, 0.16);
    const frontReel = this.createProjectorReel(0.255, metal);
    frontReel.position.set(0.23, 0.34, 0.16);
    projector.add(rearReel, frontReel);

    const statePanel = this.assetDecorPanel('/assets/generated/scene04_v1/s04_prop_projector_off.webp', 0.28, 0.19, 0.72);
    statePanel.name = 'projector_image_visual';
    statePanel.position.set(0, -0.08, 0.236);
    statePanel.userData.onTexture = this.assetTexture('/assets/generated/scene04_v1/s04_prop_projector_on.webp');
    projector.add(statePanel);
    return projector;
  }

  private createProjectionTable(wood: THREE.Material): THREE.Group {
    const table = new THREE.Group();
    table.name = 'memory_table_visual';
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x241e1a, roughness: 0.82, metalness: 0.02 });
    table.add(
      this.box(1.62, 0.1, 1.0, wood, 0, 0.39, 0),
      this.box(1.46, 0.1, 0.08, darkWood, 0, 0.28, 0.45),
      this.box(1.46, 0.1, 0.08, darkWood, 0, 0.28, -0.45)
    );
    for (const x of [-0.68, 0.68]) {
      for (const z of [-0.39, 0.39]) table.add(this.box(0.09, 0.76, 0.09, darkWood, x, -0.04, z));
    }
    table.position.set(0.68, 0.43, 0.42);
    return table;
  }

  private createProjectorBeam(): THREE.Mesh {
    const near = [
      new THREE.Vector3(-1.57, 1.03, 0.05),
      new THREE.Vector3(-1.34, 1.03, 0.05),
      new THREE.Vector3(-1.34, 1.28, 0.05),
      new THREE.Vector3(-1.57, 1.28, 0.05)
    ];
    const far = [
      new THREE.Vector3(-1.43, 1.18, -4.28),
      new THREE.Vector3(0.62, 1.18, -4.28),
      new THREE.Vector3(0.62, 2.82, -4.28),
      new THREE.Vector3(-1.43, 2.82, -4.28)
    ];
    const points = [
      near[0], far[0], far[3], near[0], far[3], near[3],
      near[1], near[2], far[2], near[1], far[2], far[1],
      near[3], far[3], far[2], near[3], far[2], near[2],
      near[0], near[1], far[1], near[0], far[1], far[0]
    ];
    const positions = new Float32Array(points.flatMap((point) => [point.x, point.y, point.z]));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    return new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0xaebcff,
        transparent: true,
        opacity: 0.075,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
  }

  private buildBuilding(root: THREE.Group, hotspots: THREE.Object3D[]): void {
    for (const name of ['stage_back_visual', 'stage_left_visual', 'stage_right_visual', 'stage_floor_visual', 'stage_lip_visual']) {
      const legacy = root.getObjectByName(name);
      if (legacy) legacy.visible = false;
    }

    const wallMaterial = this.mappedMaterial('/assets/generated/scene03_v4/s03_mat_upper_plaster_v1.png', 1.55, 2.05, 0.98);
    wallMaterial.color.setHex(0xb8b1bc);
    wallMaterial.emissive.setHex(0x413d48);
    wallMaterial.emissiveIntensity = 0.15;
    wallMaterial.bumpMap = wallMaterial.map;
    wallMaterial.bumpScale = 0.038;
    const greenWallMaterial = this.mappedMaterial('/assets/generated/scene03_v4/s03_mat_green_wall_v1.png', 1.65, 1.3, 0.98);
    greenWallMaterial.color.setHex(0x71877e);
    greenWallMaterial.emissive.setHex(0x263d36);
    greenWallMaterial.emissiveIntensity = 0.14;
    greenWallMaterial.bumpMap = greenWallMaterial.map;
    greenWallMaterial.bumpScale = 0.028;
    const floorMaterial = this.mappedMaterial('/assets/generated/scene03_v4/s03_mat_concrete_floor_v1.png', 2.35, 5.2, 0.88);
    floorMaterial.color.setHex(0x87848b);
    floorMaterial.emissive.setHex(0x35323a);
    floorMaterial.emissiveIntensity = 0.16;
    floorMaterial.bumpMap = floorMaterial.map;
    floorMaterial.bumpScale = 0.035;
    const ceilingMaterial = this.mappedMaterial('/assets/generated/scene03_v4/s03_mat_upper_plaster_v1.png', 2.1, 3.8, 0.98);
    ceilingMaterial.color.setHex(0xaaa3ad);
    ceilingMaterial.emissive.setHex(0x3c3741);
    ceilingMaterial.emissiveIntensity = 0.16;
    ceilingMaterial.bumpMap = ceilingMaterial.map;
    ceilingMaterial.bumpScale = 0.026;
    const stairMaterial = this.mappedMaterial('/assets/generated/scene03_v4/s03_mat_concrete_floor_v1.png', 1.3, 3.2, 0.96);
    stairMaterial.color.setHex(0x77767b);
    stairMaterial.emissive.setHex(0x302e34);
    stairMaterial.emissiveIntensity = 0.32;
    stairMaterial.bumpMap = stairMaterial.map;
    stairMaterial.bumpScale = 0.045;
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x302d2a, roughness: 0.62, metalness: 0.5 });
    const pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x424744, roughness: 0.6, metalness: 0.48 });
    const oldWoodMaterial = this.mappedMaterial('/assets/generated/scene03_v2/s03_ref_old_wood.jpg', 1.2, 1.2, 0.94);
    oldWoodMaterial.color.setHex(0x7b6655);
    oldWoodMaterial.emissive.setHex(0x2a2018);
    oldWoodMaterial.emissiveIntensity = 0.18;

    const architecture = new THREE.Group();
    architecture.name = 'building_architecture_v4_visual';
    const floor = this.box(5.4, 0.12, 12.4, floorMaterial, 0, -0.08, 1.4);
    floor.name = 'building_floor_visual';
    const ceiling = this.box(5.4, 0.12, 7.2, ceilingMaterial, 0, 5.4, -1.2);
    ceiling.name = 'building_ceiling_visual';
    const leftWall = this.box(0.16, 5.45, 12.4, wallMaterial, -2.7, 2.725, 1.4);
    leftWall.name = 'building_left_wall_visual';
    const rightWall = this.box(0.16, 5.45, 12.4, wallMaterial, 2.7, 2.725, 1.4);
    rightWall.name = 'building_right_wall_visual';

    const backWall = new THREE.Group();
    backWall.name = 'building_back_wall_visual';
    backWall.add(
      this.box(1.28, 5.45, 0.16, wallMaterial, -2.06, 2.725, -4.8),
      this.box(1.48, 1.895, 0.16, wallMaterial, -0.68, 0.9475, -4.8),
      this.box(1.48, 2.005, 0.16, wallMaterial, -0.68, 4.4475, -4.8),
      this.box(1.39, 5.45, 0.16, wallMaterial, 0.755, 2.725, -4.8),
      this.box(1, 3.15, 0.16, wallMaterial, 1.95, 3.875, -4.8),
      this.box(0.25, 5.45, 0.16, wallMaterial, 2.575, 2.725, -4.8)
    );

    const crossBeam = this.box(5.25, 0.38, 0.5, wallMaterial, 0, 4.55, -1.25);
    crossBeam.name = 'building_cross_beam_visual';
    architecture.add(floor, ceiling, leftWall, rightWall, backWall, crossBeam);

    const wallSkirt = new THREE.Group();
    wallSkirt.name = 'building_green_wall_skirt_visual';
    wallSkirt.add(
      this.box(4.04, 1.42, 0.035, greenWallMaterial, -0.57, 0.71, -4.705),
      this.box(0.14, 1.42, 0.035, greenWallMaterial, 2.52, 0.71, -4.705),
      this.box(0.035, 1.42, 12.15, greenWallMaterial, -2.605, 0.71, 1.4),
      this.box(0.035, 1.42, 12.15, greenWallMaterial, 2.605, 0.71, 1.4)
    );

    const wallTrimMaterial = new THREE.MeshStandardMaterial({ color: 0x61716b, roughness: 0.9, metalness: 0.02 });
    const wallTrim = new THREE.Group();
    wallTrim.name = 'building_wall_trim_visual';
    wallTrim.add(
      this.box(4.04, 0.055, 0.055, wallTrimMaterial, -0.57, 1.42, -4.67),
      this.box(0.14, 0.055, 0.055, wallTrimMaterial, 2.52, 1.42, -4.67),
      this.box(0.055, 0.055, 12.12, wallTrimMaterial, -2.57, 1.42, 1.4),
      this.box(0.055, 0.055, 12.12, wallTrimMaterial, 2.57, 1.42, 1.4)
    );

    const ceilingBeams = new THREE.Group();
    ceilingBeams.name = 'building_ceiling_beams_visual';
    for (const z of [2.15, -0.15, -2.45, -4.45]) {
      ceilingBeams.add(this.box(5.22, 0.25, 0.34, ceilingMaterial, 0, 5.22, z));
    }
    root.add(
      architecture,
      wallSkirt,
      wallTrim,
      ceilingBeams,
      this.createBuildingStairs(stairMaterial, railMaterial),
      this.createBuildingWindow(),
      this.createBuildingDetailLayer(pipeMaterial, railMaterial)
    );
    const windowLight = new THREE.PointLight(0x9ba9df, 3.2, 6.4, 1.65);
    windowLight.name = 'building_window_light_visual';
    windowLight.position.set(-0.7, 2.35, -4.05);
    const landingFill = new THREE.PointLight(0x7d829a, 1.25, 5.2, 1.9);
    landingFill.name = 'building_landing_fill_visual';
    landingFill.position.set(0.2, 0.65, -1.35);
    const foregroundFill = new THREE.PointLight(0x777c9b, 1.65, 4.8, 1.8);
    foregroundFill.name = 'building_foreground_fill_visual';
    foregroundFill.position.set(-0.2, 0.45, 1.45);
    const livingAreaFill = new THREE.PointLight(0xc19d7f, 1.18, 4.1, 1.85);
    livingAreaFill.name = 'building_living_area_fill_visual';
    livingAreaFill.position.set(2.1, 1.3, 0.65);
    const dustPositions = new Float32Array(54 * 3);
    for (let index = 0; index < 54; index += 1) {
      dustPositions[index * 3] = Math.sin(index * 12.73) * 2.35;
      dustPositions[index * 3 + 1] = 0.18 + ((index * 0.43) % 4.75);
      dustPositions[index * 3 + 2] = 3.4 - ((index * 1.17) % 8.05);
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustTexture = this.assetTexture('/assets/generated/shared_vfx/shared_vfx_dust_mote.png');
    const dust = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({
        map: dustTexture,
        alphaMap: dustTexture,
        color: 0xc2bdc8,
        size: 0.035,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        sizeAttenuation: true
      })
    );
    dust.name = 'building_dust_motes_visual';
    root.add(windowLight, landingFill, foregroundFill, livingAreaFill, dust);

    const floorLight = this.assetDecorPanel('/assets/generated/scene03_v1/s03_decal_light_shadow.png', 3.6, 3.1, 0.23);
    floorLight.name = 'building_floor_light_visual';
    floorLight.rotation.x = -Math.PI / 2;
    floorLight.rotation.z = -0.12;
    floorLight.position.set(-0.55, 0.008, 0.15);

    const wallPatch = this.assetDecorPanel('/assets/generated/scene03_v1/s03_decal_wall_patch_01.png', 0.58, 0.72, 0.7);
    wallPatch.name = 'wall_visual';
    wallPatch.position.set(0.72, 1.72, -4.695);

    const light = new THREE.Group();
    light.name = 'sound_light_visual';
    light.position.set(-0.15, 4.12, -1.2);
    const lightImage = this.assetPanel(
      '/assets/generated/scene03_v1/s03_prop_sound_light_off.png',
      0.18,
      0.18,
      { x: 184, y: 178, width: 1675, height: 1675 }
    );
    lightImage.name = 'sound_light_image_visual';
    lightImage.visible = false;
    lightImage.userData.onTexture = this.assetTexture(
      '/assets/generated/scene03_v1/s03_prop_sound_light_on.png',
      { x: 185, y: 177, width: 1678, height: 1678 }
    );
    const lightCord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 1.28, 10),
      new THREE.MeshStandardMaterial({ color: 0x252424, roughness: 0.92 })
    );
    lightCord.position.y = 0.68;
    const lightSocket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.075, 0.13, 18),
      new THREE.MeshStandardMaterial({ color: 0x242728, roughness: 0.65, metalness: 0.24 })
    );
    const lightShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.19, 0.11, 24, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x626a65, roughness: 0.72, metalness: 0.16, side: THREE.DoubleSide })
    );
    lightShade.position.y = -0.07;
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 24, 18),
      new THREE.MeshStandardMaterial({ color: 0xe3ddce, emissive: 0x41382d, emissiveIntensity: 0.38, roughness: 0.26 })
    );
    bulb.name = 'building_bulb_visual';
    bulb.scale.y = 1.18;
    bulb.position.y = -0.15;
    light.add(lightCord, lightSocket, lightShade, bulb, lightImage);
    const lightShadow = this.assetDecorPanel('/assets/generated/scene03_v1/s03_decal_light_shadow.png', 2.35, 2.55, 0.28);
    lightShadow.name = 'building_light_shadow_visual';
    lightShadow.position.set(-0.18, 2.08, -4.69);
    lightShadow.visible = false;
    const lightGlow = this.softGlowPanel(1.18, 1.18);
    lightGlow.name = 'building_light_glow_visual';
    lightGlow.position.set(-0.15, 3.74, -1.18);
    lightGlow.visible = false;
    const pointLight = new THREE.PointLight(0xffd6a0, 3.8, 6.2, 1.7);
    pointLight.name = 'building_sound_point_light_visual';
    pointLight.position.set(-0.15, 3.82, -1.2);
    pointLight.visible = false;
    root.add(floorLight, wallPatch, light, lightShadow, lightGlow, pointLight);

    const bike = this.createBuildingBicycle();
    const bikeShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.54, 28),
      new THREE.MeshBasicMaterial({ color: 0x151822, transparent: true, opacity: 0.2, depthWrite: false })
    );
    bikeShadow.name = 'bike_shadow_visual';
    bikeShadow.rotation.x = -Math.PI / 2;
    bikeShadow.scale.set(1.55, 0.56, 1);
    bikeShadow.position.set(-1.42, 0.008, 0.88);
    bikeShadow.visible = false;
    root.add(bikeShadow, bike);

    const shoeCabinet = this.createBuildingShoeCabinet();
    const landingProps = this.createBuildingLandingProps(
      oldWoodMaterial,
      new THREE.MeshStandardMaterial({ color: 0x50524d, roughness: 0.82, metalness: 0.28 }),
      new THREE.MeshStandardMaterial({ color: 0x222326, roughness: 0.98 })
    );
    const broom = new THREE.Group();
    broom.name = 'building_cleaning_tools_visual';
    broom.position.set(2.34, 0, 0.05);
    broom.add(this.cylinderBetween(new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(-0.08, 1.42, 0), 0.022, pipeMaterial, 10));
    const bristles = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 14), new THREE.MeshStandardMaterial({ color: 0x75644e, roughness: 1 }));
    bristles.position.set(0.02, 0.18, 0);
    broom.add(bristles);

    const meters = new THREE.Group();
    meters.name = 'building_electrical_meters_visual';
    meters.position.set(2.59, 1.92, -2.45);
    meters.rotation.y = -Math.PI / 2;
    const meterMaterial = new THREE.MeshStandardMaterial({ color: 0x918f87, roughness: 0.82, metalness: 0.14 });
    const meterFaceMaterial = new THREE.MeshStandardMaterial({ color: 0xb5b2a8, roughness: 0.34, metalness: 0.18 });
    const meterGlassMaterial = new THREE.MeshPhysicalMaterial({ color: 0x82929a, roughness: 0.22, metalness: 0.05, transmission: 0.18 });
    meters.add(this.box(1.3, 1.02, 0.06, new THREE.MeshStandardMaterial({ color: 0x595b57, roughness: 0.9 }), 0, 0.12, -0.02));
    for (const [x, y, scale] of [[-0.45, 0.28, 1], [-0.08, 0.02, 0.8], [0.3, 0.34, 0.72], [0.46, -0.12, 0.62]] as Array<[number, number, number]>) {
      const casing = this.box(0.32 * scale, 0.42 * scale, 0.13, meterMaterial, x, y, 0.04);
      const face = new THREE.Mesh(new THREE.CylinderGeometry(0.085 * scale, 0.085 * scale, 0.018, 18), meterGlassMaterial);
      face.rotation.x = Math.PI / 2;
      face.position.set(x, y + 0.045 * scale, 0.12);
      const label = this.box(0.16 * scale, 0.045 * scale, 0.018, meterFaceMaterial, x, y - 0.11 * scale, 0.125);
      meters.add(casing, face, label);
    }
    const conduits = new THREE.Group();
    conduits.name = 'building_conduits_visual';
    conduits.add(
      this.cylinderBetween(new THREE.Vector3(2.58, 4.25, 1.8), new THREE.Vector3(2.58, 4.25, -4.55), 0.024, pipeMaterial, 10),
      this.cylinderBetween(new THREE.Vector3(2.58, 0.2, -3.8), new THREE.Vector3(2.58, 4.25, -3.8), 0.022, pipeMaterial, 10),
      this.cylinderBetween(new THREE.Vector3(2.58, 0.2, -3.8), new THREE.Vector3(2.58, 0.2, -4.55), 0.022, pipeMaterial, 10)
    );
    const radiator = new THREE.Group();
    radiator.name = 'building_radiator_visual';
    const radiatorMaterial = new THREE.MeshStandardMaterial({ color: 0x514e49, roughness: 0.62, metalness: 0.52 });
    radiator.position.set(2.18, 0, 1.72);
    for (let index = 0; index < 5; index += 1) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 0.92, 14), radiatorMaterial);
      pipe.position.set(-0.26 + index * 0.13, 0.58, 0);
      radiator.add(pipe);
    }
    radiator.add(
      this.cylinderBetween(new THREE.Vector3(-0.34, 0.16, 0), new THREE.Vector3(0.34, 0.16, 0), 0.045, radiatorMaterial, 12),
      this.cylinderBetween(new THREE.Vector3(-0.34, 1, 0), new THREE.Vector3(0.34, 1, 0), 0.045, radiatorMaterial, 12),
      this.cylinderBetween(new THREE.Vector3(0.34, 0.16, 0), new THREE.Vector3(0.48, 0.04, 0), 0.038, radiatorMaterial, 12)
    );
    root.add(shoeCabinet, landingProps, broom, meters, conduits, radiator);

    const foregroundRail = new THREE.Group();
    foregroundRail.name = 'building_foreground_railing_visual';
    foregroundRail.add(
      this.cylinderBetween(new THREE.Vector3(-2.45, 0, 2.25), new THREE.Vector3(-2.45, 1.38, 2.25), 0.04, railMaterial, 12),
      this.cylinderBetween(new THREE.Vector3(-2.45, 1.38, 2.25), new THREE.Vector3(-1.75, 1.08, 1.25), 0.04, railMaterial, 12)
    );
    root.add(foregroundRail);

    const door = new THREE.Group();
    door.name = 'iron_door_visual';
    const doorBacking = this.box(0.96, 2.2, 0.1, this.materials.createWall(0x252a2c), 0, 0, 0);
    const doorImage = this.assetDecorPanel(
      '/assets/generated/scene03_v1/s03_prop_iron_door_closed.png',
      0.94,
      2.12,
      1,
      { x: 551, y: 104, width: 945, height: 1831 }
    );
    doorImage.name = 'iron_door_image_visual';
    doorImage.position.z = 0.055;
    doorImage.userData.memoryTexture = this.assetTexture(
      '/assets/generated/scene03_v1/s03_prop_iron_door_memory.png',
      { x: 551, y: 108, width: 948, height: 1832 }
    );
    door.add(doorBacking, doorImage);
    door.position.set(1.95, 1.15, -4.69);
    const doorFrame = new THREE.Group();
    doorFrame.name = 'building_door_frame_visual';
    doorFrame.add(
      this.box(0.12, 2.3, 0.28, railMaterial, -0.54, 0, -0.03),
      this.box(0.12, 2.3, 0.28, railMaterial, 0.54, 0, -0.03),
      this.box(1.2, 0.12, 0.28, railMaterial, 0, 1.15, -0.03),
      this.box(1.08, 0.07, 0.3, railMaterial, 0, -1.115, 0)
    );
    door.add(doorFrame);
    const paper = this.assetDecorPanel(
      '/assets/generated/scene03_v1/s03_prop_award_blank.png',
      0.54,
      0.38,
      1,
      { x: 109, y: 119, width: 1830, height: 1298, sourceHeight: 1536 }
    );
    paper.name = 'red_paper_visual';
    paper.position.set(0.72, 0.028, 0.65);
    paper.rotation.set(-Math.PI / 2, 0, -0.12);
    paper.renderOrder = 16;
    const paperShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.59, 0.43),
      new THREE.MeshBasicMaterial({ color: 0x111317, transparent: true, opacity: 0.24, depthWrite: false })
    );
    paperShadow.name = 'building_award_shadow_visual';
    paperShadow.position.set(0.72, 0.012, 0.65);
    paperShadow.rotation.set(-Math.PI / 2, 0, -0.12);
    root.add(door, paperShadow, paper);

    this.addHotspot(root, hotspots, 'hotspot_wall', new THREE.Vector3(0.72, 1.72, -4.32), new THREE.Vector3(0.72, 0.88, 0.5));
    this.addHotspot(root, hotspots, 'hotspot_sound_light', new THREE.Vector3(-0.15, 4, -1.2), new THREE.Vector3(0.72, 0.9, 0.72));
    this.addHotspot(root, hotspots, 'hotspot_bike', new THREE.Vector3(-1.42, 0.56, 0.88), new THREE.Vector3(1.55, 1.16, 0.68));
    this.addHotspot(root, hotspots, 'hotspot_red_paper', new THREE.Vector3(0.72, 0.1, 0.65), new THREE.Vector3(0.66, 0.2, 0.54));
    this.addHotspot(root, hotspots, 'hotspot_iron_door', new THREE.Vector3(1.95, 1.15, -4.35), new THREE.Vector3(1.16, 2.34, 0.62));
  }

  private buildProjection(root: THREE.Group, hotspots: THREE.Object3D[]): void {
    for (const name of ['stage_back_visual', 'stage_left_visual', 'stage_right_visual', 'stage_floor_visual', 'stage_lip_visual']) {
      const legacy = root.getObjectByName(name);
      if (legacy) legacy.visible = false;
    }

    const wallMaterial = this.mappedMaterial('/assets/generated/scene04_v2/s04_ref_dark_wall.jpg', 1.3, 1.15, 0.98);
    wallMaterial.color.setHex(0x625c55);
    wallMaterial.emissive.setHex(0x342f32);
    wallMaterial.emissiveIntensity = 0.32;
    const floorMaterial = this.mappedMaterial('/assets/generated/scene04_v2/s04_ref_dark_floor.jpg', 1.6, 2.8, 0.72);
    floorMaterial.color.setHex(0x786d68);
    floorMaterial.emissive.setHex(0x2e272c);
    floorMaterial.emissiveIntensity = 0.42;
    const ceilingMaterial = this.mappedMaterial('/assets/generated/scene04_v2/s04_ref_dark_wall.jpg', 1.6, 2.2, 0.98);
    ceilingMaterial.color.setHex(0x4b4743);
    ceilingMaterial.emissive.setHex(0x171715);
    ceilingMaterial.emissiveIntensity = 0.26;
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x3b302a, roughness: 0.72, metalness: 0.08 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x59595b, roughness: 0.52, metalness: 0.58 });
    const tableWood = this.mappedMaterial('/assets/generated/scene04_v2/s04_ref_table_wood.jpg', 1.05, 1.05, 0.84);
    tableWood.color.setHex(0x746359);
    tableWood.emissive.setHex(0x332723);
    tableWood.emissiveIntensity = 0.46;

    const architecture = new THREE.Group();
    architecture.name = 'projection_architecture_v2_visual';
    architecture.add(
      this.box(5.4, 0.12, 7.4, floorMaterial, 0, -0.08, -1.05),
      this.box(5.4, 0.12, 7.4, ceilingMaterial, 0, 3.2, -1.05),
      this.box(5.4, 0.12, 4.95, floorMaterial, 0, -0.08, 5.125),
      this.box(5.4, 0.12, 4.95, ceilingMaterial, 0, 3.2, 5.125),
      this.box(5.4, 3.22, 0.16, wallMaterial, 0, 1.61, -4.76),
      this.box(0.16, 3.22, 7.4, wallMaterial, -2.7, 1.61, -1.05),
      this.box(0.16, 3.22, 7.4, wallMaterial, 2.7, 1.61, -1.05),
      this.box(0.16, 3.22, 4.95, wallMaterial, -2.7, 1.61, 5.125),
      this.box(0.16, 3.22, 4.95, wallMaterial, 2.7, 1.61, 5.125)
    );
    architecture.children[1].name = 'projection_ceiling_visual';
    for (const z of [1.8, -0.35, -2.5]) architecture.add(this.box(5.35, 0.22, 0.22, darkWood, 0, 3.04, z));
    const trim = new THREE.Group();
    trim.name = 'projection_wall_trim_visual';
    trim.add(
      this.box(0.79, 0.12, 0.12, darkWood, -2.175, 0.82, -4.64),
      this.box(0.79, 0.12, 0.12, darkWood, 2.175, 0.82, -4.64),
      this.box(0.12, 3.04, 0.12, darkWood, -2.57, 1.58, -4.64),
      this.box(0.12, 3.04, 0.12, darkWood, 2.57, 1.58, -4.64)
    );
    const ceilingLining = this.ceilingLining('/assets/generated/scene04_v2/s04_ref_dark_wall.jpg', 5.28, 12.2, 0x393634, 1.5, 2.8);
    ceilingLining.name = 'projection_ceiling_lining_visual';
    ceilingLining.position.set(0, 3.135, 1.425);
    root.add(architecture, ceilingLining, trim);

    const leftShelf = this.createArchiveShelf(0.92, 2.62, 0.42, 1);
    leftShelf.name = 'projection_left_archive_shelf_visual';
    leftShelf.position.set(-2.12, 1.31, -2.7);
    const rightShelf = this.createArchiveShelf(0.92, 2.62, 0.42, 3);
    rightShelf.name = 'archive_shelf_visual';
    rightShelf.position.set(2.08, 1.31, -2.35);
    root.add(leftShelf, rightShelf);

    const reels = new THREE.Group();
    reels.name = 'projection_film_reels_visual';
    for (const [x, y, z, radius, rotation] of [
      [-2.12, 0.3, -0.6, 0.25, 0],
      [-1.82, 0.25, -0.55, 0.2, 0.2],
      [2.22, 0.24, -0.55, 0.22, -0.16]
    ] as Array<[number, number, number, number, number]>) {
      const reel = new THREE.Group();
      reel.position.set(x, y, z);
      reel.rotation.z = rotation;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.035, 10, 36), metal);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.055, 16), metal);
      hub.rotation.x = Math.PI / 2;
      reel.add(ring, hub);
      reels.add(reel);
    }
    root.add(reels);

    const bambooShadow = this.assetDecorPanel('/assets/generated/scene04_v1/s04_decal_bamboo_shadow.webp', 1.6, 2.25, 0.3);
    bambooShadow.name = 'projection_bamboo_shadow_visual';
    bambooShadow.position.set(-1.75, 1.72, -4.64);
    const waterReflection = this.assetDecorPanel('/assets/generated/scene04_v1/s04_decal_water_reflection.webp', 4.7, 4.1, 0.28);
    waterReflection.name = 'projection_water_reflection_visual';
    waterReflection.rotation.x = -Math.PI / 2;
    waterReflection.rotation.z = 0.08;
    waterReflection.position.set(0, 0.008, -0.2);
    root.add(bambooShadow, waterReflection);

    const screenFrame = this.assetDecorPanel('/assets/generated/scene04_v1/s04_prop_projection_screen_front.webp', 3.45, 2.35, 1);
    screenFrame.name = 'screen_frame_visual';
    screenFrame.position.set(0, 1.93, -4.61);
    const screen = this.assetPanel('/assets/generated/scene04_v1/s04_projection_playground.jpg', 3.04, 1.71);
    screen.name = 'screen_visual';
    screen.position.set(0, 2, -4.53);
    (screen.material as THREE.MeshBasicMaterial).color.setHex(0x77758a);
    const playground = this.assetPanel('/assets/generated/scene04_v1/s04_projection_playground.jpg', 3.04, 1.71);
    playground.name = 'playground_visual';
    playground.position.set(0, 2, -4.49);
    playground.userData.memoryTexture = this.assetTexture('/assets/generated/scene04_v1/s04_projection_playground_memory.jpg');
    playground.visible = false;
    const projectorNoiseTexture = this.assetTexture('/assets/generated/shared_vfx/shared_vfx_projector_noise.png');
    projectorNoiseTexture.wrapS = THREE.RepeatWrapping;
    projectorNoiseTexture.wrapT = THREE.RepeatWrapping;
    projectorNoiseTexture.repeat.set(1.08, 1.08);
    const projectorNoise = new THREE.Mesh(
      new THREE.PlaneGeometry(3.04, 1.71),
      new THREE.MeshBasicMaterial({
        color: 0xdde8ff,
        alphaMap: projectorNoiseTexture,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    projectorNoise.name = 'projector_noise_visual';
    projectorNoise.position.set(0, 2, -4.455);
    projectorNoise.visible = false;
    root.add(screenFrame, screen, playground, projectorNoise);

    const projectorStand = this.createProjectionStand(metal, darkWood);
    const projector = this.createProjectionProjector(metal);
    const beam = this.createProjectorBeam();
    beam.name = 'projector_beam_visual';
    beam.visible = false;
    root.add(projectorStand, projector, beam);

    const table = this.createProjectionTable(tableWood);
    const archiveBag = new THREE.Group();
    archiveBag.name = 'archive_cabinet_visual';
    archiveBag.position.set(1.02, 0.91, 0.45);
    archiveBag.add(this.box(
      0.48,
      0.055,
      0.34,
      new THREE.MeshStandardMaterial({ color: 0x574535, roughness: 0.94 }),
      0,
      0,
      0
    ));
    const archiveBagImage = this.assetDecorPanel('/assets/generated/scene04_v1/s04_prop_archive_bag_closed.webp', 0.42, 0.31, 1);
    archiveBagImage.name = 'archive_bag_image_visual';
    archiveBagImage.rotation.x = -Math.PI / 2;
    archiveBagImage.position.y = 0.032;
    archiveBagImage.userData.openTexture = this.assetTexture('/assets/generated/scene04_v1/s04_prop_archive_bag_open.webp');
    archiveBag.add(archiveBagImage);
    const fragment = this.assetDecorPanel('/assets/generated/scene04_v1/s04_prop_memory_fragment.webp', 0.18, 0.18, 1);
    fragment.name = 'final_fragment_visual';
    fragment.position.set(0.38, 0.96, 0.48);
    fragment.visible = false;
    root.add(table, archiveBag, fragment);

    const branches = this.assetDecorPanel('/assets/generated/scene04_v1/s04_decal_silver_branch.webp', 0.94, 1.38, 0.84);
    branches.name = 'projection_branches_visual';
    branches.position.set(-2.05, 1.34, -3.92);
    branches.rotation.z = -0.12;
    const vase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.14, 0.3, 18),
      new THREE.MeshStandardMaterial({ color: 0x252525, roughness: 0.38, metalness: 0.26 })
    );
    vase.name = 'projection_branch_vase_visual';
    vase.position.set(-2.05, 0.2, -3.9);
    const petals = new THREE.Group();
    petals.name = 'projection_petals_visual';
    const petalTexture = this.assetTexture('/assets/generated/shared_vfx/shared_vfx_petal_01.png');
    for (let index = 0; index < 18; index += 1) {
      const petal = new THREE.Sprite(new THREE.SpriteMaterial({ map: petalTexture, color: 0xc796a8, transparent: true, opacity: 0.5, depthWrite: false }));
      petal.position.set(-2.25 + (index % 7) * 0.72, 0.025 + (index % 3) * 0.015, -3.8 + (index % 5) * 0.92);
      petal.scale.set(0.055, 0.08, 1);
      petal.material.rotation = index * 0.58;
      petals.add(petal);
    }
    root.add(branches, vase, petals);

    const warmLamp = new THREE.PointLight(0xffc58f, 3.4, 5.2, 1.75);
    warmLamp.name = 'projection_warm_lamp_visual';
    warmLamp.position.set(-2.1, 2.65, -1.1);
    const screenSpill = new THREE.PointLight(0x9da8e4, 1.05, 5.5, 1.7);
    screenSpill.name = 'projection_screen_spill_visual';
    screenSpill.position.set(0, 1.82, -3.7);
    screenSpill.visible = false;
    const idleScreenLight = new THREE.PointLight(0x8c96c8, 1.75, 5.2, 1.65);
    idleScreenLight.name = 'projection_idle_screen_light_visual';
    idleScreenLight.position.set(0, 1.9, -3.55);
    const floorFill = new THREE.PointLight(0x8b7780, 1.7, 4.8, 1.9);
    floorFill.name = 'projection_floor_fill_visual';
    floorFill.position.set(0.15, 0.42, 1.1);
    root.add(warmLamp, screenSpill, idleScreenLight, floorFill);

    this.addHotspot(root, hotspots, 'hotspot_projector', new THREE.Vector3(-1.45, 0.98, 0.42), new THREE.Vector3(0.7, 0.62, 0.52));
    this.addHotspot(root, hotspots, 'hotspot_archive_cabinet', new THREE.Vector3(1.02, 0.96, 0.68), new THREE.Vector3(0.5, 0.4, 0.44));
    this.addHotspot(root, hotspots, 'hotspot_screen', new THREE.Vector3(0, 2, -4.2), new THREE.Vector3(3.12, 1.82, 0.56));
    this.addHotspot(root, hotspots, 'hotspot_memory_table', new THREE.Vector3(0.38, 0.96, 0.7), new THREE.Vector3(0.34, 0.32, 0.4));
    this.addHotspot(root, hotspots, 'hotspot_final_fragment', new THREE.Vector3(0.38, 0.96, 0.7), new THREE.Vector3(0.34, 0.32, 0.4));
  }

  private buildMemoryCorridor(root: THREE.Group, hotspots: THREE.Object3D[]): void {
    for (const name of ['stage_floor_visual', 'stage_back_visual', 'stage_left_visual', 'stage_right_visual', 'stage_lip_visual']) {
      const stagePart = root.getObjectByName(name);
      if (stagePart) stagePart.visible = false;
    }

    const wall = this.mappedMaterial('/assets/generated/scene03_v4/s03_mat_upper_plaster_v1.png', 1.8, 6.8, 0.98);
    const lowerWall = this.mappedMaterial('/assets/generated/scene03_v4/s03_mat_green_wall_v1.png', 1.4, 6.2, 0.96);
    const floor = this.mappedMaterial('/assets/generated/scene04_v2/s04_ref_dark_floor.jpg', 2.4, 8.5, 0.74);
    const ceiling = this.mappedMaterial('/assets/generated/scene04_v2/s04_ref_dark_wall.jpg', 2.2, 8.5, 0.96);
    const darkWood = this.mappedMaterial('/assets/generated/scene04_v2/s04_ref_table_wood.jpg', 1.1, 1.1, 0.88);
    const agedMetal = new THREE.MeshStandardMaterial({ color: 0x37322d, roughness: 0.66, metalness: 0.38 });
    const plasterTrim = new THREE.MeshStandardMaterial({ color: 0x77736c, roughness: 0.94, metalness: 0.01 });

    const corridorFloor = this.box(4.8, 0.12, 18.4, floor, 0, -0.06, -7.35);
    corridorFloor.name = 'memory_floor_visual';
    const corridorCeiling = this.box(4.8, 0.12, 18.4, ceiling, 0, 3.46, -7.35);
    corridorCeiling.name = 'memory_ceiling_visual';
    const leftWall = this.box(0.18, 3.5, 18.4, wall, -2.4, 1.72, -7.35);
    leftWall.name = 'memory_left_wall_visual';
    const rightWall = this.box(0.18, 3.5, 18.4, wall, 2.4, 1.72, -7.35);
    rightWall.name = 'memory_right_wall_visual';
    const backWall = this.box(4.8, 3.5, 0.18, wall, 0, 1.72, -16.5);
    backWall.name = 'memory_back_wall_visual';
    root.add(corridorFloor, corridorCeiling, leftWall, rightWall, backWall);

    const leftLower = this.box(0.19, 1.18, 18.2, lowerWall, -2.3, 0.59, -7.35);
    const rightLower = this.box(0.19, 1.18, 18.2, lowerWall, 2.3, 0.59, -7.35);
    leftLower.name = 'memory_left_lower_wall_visual';
    rightLower.name = 'memory_right_lower_wall_visual';
    root.add(leftLower, rightLower);

    for (const side of [-1, 1]) {
      const baseboard = this.box(0.08, 0.18, 18.1, darkWood, side * 2.18, 0.09, -7.35);
      const pictureRail = this.box(0.065, 0.055, 18.1, agedMetal, side * 2.18, 2.88, -7.35);
      root.add(baseboard, pictureRail);
    }
    for (let index = 0; index < 7; index += 1) {
      const z = 0.4 - index * 2.7;
      const beam = this.box(4.62, 0.1, 0.14, plasterTrim, 0, 3.36, z);
      root.add(beam);
    }

    const sectionNames = ['memory_section_near_visual', 'memory_section_middle_visual', 'memory_section_far_visual'] as const;
    const sections = sectionNames.map((name) => {
      const section = new THREE.Group();
      section.name = name;
      root.add(section);
      return section;
    });
    const matBoardBase = new THREE.MeshStandardMaterial({ color: 0xc8bfae, roughness: 0.96 });
    const frameBase = new THREE.MeshStandardMaterial({ color: 0x211e1b, roughness: 0.76, metalness: 0.08 });

    memoryPhotos.forEach((photo, index) => {
      const section = sections[Math.floor(index / 12)];
      const side = index % 2 === 0 ? -1 : 1;
      const slot = Math.floor(index / 2);
      const z = 0.15 - slot * 0.88;
      const y = slot % 2 === 0 ? 2.18 : 1.25;
      const aspect = photo.width / photo.height;
      const photoHeight = aspect >= 1 ? Math.min(0.72, 1.16 / aspect) : 0.8;
      const photoWidth = aspect >= 1 ? photoHeight * aspect : photoHeight * aspect;
      const frameWidth = photoWidth + 0.105;
      const frameHeight = photoHeight + 0.105;
      const photoGroup = new THREE.Group();
      photoGroup.name = `memory_photo_${String(index + 1).padStart(2, '0')}_visual`;
      photoGroup.position.set(side * 2.205, y, z);
      photoGroup.rotation.y = side < 0 ? Math.PI / 2 - 0.15 : -Math.PI / 2 + 0.15;
      photoGroup.rotation.z = ((index % 5) - 2) * 0.012;

      const frame = this.box(frameWidth, frameHeight, 0.06, frameBase.clone(), 0, 0, 0);
      const matBoard = this.box(photoWidth + 0.035, photoHeight + 0.035, 0.025, matBoardBase.clone(), 0, 0, 0.042);
      const texture = this.assetTexture(`/assets/dreamcore/photos/${String(index + 1).padStart(2, '0')}.jpg`);
      const print = new THREE.Mesh(
        new THREE.PlaneGeometry(photoWidth, photoHeight),
        new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff, toneMapped: false, side: THREE.DoubleSide })
      );
      print.name = 'memory_photo_print_visual';
      print.position.z = 0.058;
      print.castShadow = false;
      print.renderOrder = 2;
      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(photoWidth, photoHeight),
        new THREE.MeshPhysicalMaterial({ color: 0xdbe2ea, transparent: true, opacity: 0.02, roughness: 0.08, metalness: 0.02, depthWrite: false, side: THREE.DoubleSide })
      );
      glass.position.z = 0.064;
      photoGroup.add(frame, matBoard, print, glass);
      section.add(photoGroup);

      const photoHotspot = this.kit.createHotspotShell('hotspot_memory_photo', new THREE.Vector3(frameWidth + 0.12, frameHeight + 0.12, 0.2));
      photoHotspot.position.copy(photoGroup.position);
      photoHotspot.rotation.copy(photoGroup.rotation);
      photoHotspot.userData.visualName = photoGroup.name;
      photoHotspot.userData.photoTitle = photo.file.replace(/^\d+_/, '').replace(/\.jpg$/, '');
      photoHotspot.userData.photoAspect = aspect;
      photoHotspot.userData.memorySection = Math.floor(index / 12);
      root.add(photoHotspot);
      hotspots.push(photoHotspot);
    });

    const sectionProxies = [
      { position: new THREE.Vector3(-1.78, 1.62, -2.1), visual: 'memory_photo_01_visual', title: '幼儿园午休', aspect: 1200 / 673, section: 0 },
      { position: new THREE.Vector3(1.62, 1.62, -7.15), visual: 'memory_photo_13_visual', title: '公园旋转马', aspect: 868 / 1200, section: 1 },
      { position: new THREE.Vector3(-1.25, 1.62, -11.9), visual: 'memory_photo_25_visual', title: '花园连廊道', aspect: 1200 / 887, section: 2 }
    ];
    for (const proxy of sectionProxies) {
      const sectionProxy = this.kit.createHotspotShell('hotspot_memory_photo', new THREE.Vector3(0.95, 2.25, 3.8));
      sectionProxy.position.copy(proxy.position);
      sectionProxy.userData.visualName = proxy.visual;
      sectionProxy.userData.photoTitle = proxy.title;
      sectionProxy.userData.photoAspect = proxy.aspect;
      sectionProxy.userData.memorySection = proxy.section;
      root.add(sectionProxy);
      hotspots.push(sectionProxy);
    }

    const focus = new THREE.Group();
    focus.name = 'memory_focus_visual';
    focus.position.set(0, 1.56, 2.42);
    const focusFrame = this.box(1.82, 1.35, 0.09, frameBase.clone(), 0, 0, 0);
    const focusMat = this.box(1.68, 1.21, 0.035, matBoardBase.clone(), 0, 0, 0.065);
    const focusPrint = new THREE.Mesh(
      new THREE.PlaneGeometry(1.55, 1.08),
      new THREE.MeshBasicMaterial({ map: this.assetTexture('/assets/dreamcore/photos/01.jpg'), color: 0xffffff, toneMapped: false, side: THREE.DoubleSide })
    );
    focusPrint.name = 'memory_focus_print_visual';
    focusPrint.position.z = 0.087;
    focusPrint.renderOrder = 4;
    focus.add(focusFrame, focusMat, focusPrint);
    focus.visible = false;
    root.add(focus);

    for (let index = 0; index < 6; index += 1) {
      const z = 1.05 - index * 3.2;
      const fixture = new THREE.Group();
      fixture.name = `memory_ceiling_lamp_${index + 1}_visual`;
      const mount = this.box(0.46, 0.08, 0.24, agedMetal.clone(), 0, 0, 0);
      const diffuser = this.box(
        0.34,
        0.035,
        0.14,
        new THREE.MeshStandardMaterial({ color: 0xd1c7ac, emissive: 0xb79b68, emissiveIntensity: index < 4 ? 0.6 : 0.32, roughness: 0.42 }),
        0,
        -0.055,
        0
      );
      fixture.position.set(0, 3.31, z);
      fixture.add(mount, diffuser);
      root.add(fixture);
      if (index % 2 === 0) {
        const lamp = new THREE.PointLight(index < 3 ? 0xe6c69a : 0xa8afd2, index < 3 ? 1.55 : 1.05, 5.2, 1.85);
        lamp.position.set(0, 3.05, z);
        root.add(lamp);
      }
    }

    const exitGroup = new THREE.Group();
    exitGroup.name = 'memory_exit_visual';
    exitGroup.position.set(0, 0, -16.34);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x171512, roughness: 0.78, metalness: 0.12 });
    const door = this.box(1.28, 2.46, 0.08, doorMaterial, 0, 1.23, 0);
    const topFrame = this.box(1.55, 0.12, 0.16, darkWood.clone(), 0, 2.52, 0.06);
    const leftFrame = this.box(0.12, 2.62, 0.16, darkWood.clone(), -0.715, 1.25, 0.06);
    const rightFrame = this.box(0.12, 2.62, 0.16, darkWood.clone(), 0.715, 1.25, 0.06);
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), agedMetal.clone());
    handle.position.set(0.43, 1.18, 0.1);
    const exitLabel = this.box(
      0.7,
      0.1,
      0.035,
      new THREE.MeshBasicMaterial({ color: 0xd6c69e, toneMapped: false }),
      0,
      2.27,
      0.095
    );
    exitLabel.name = 'memory_exit_label_visual';
    exitLabel.visible = false;
    exitGroup.add(door, topFrame, leftFrame, rightFrame, handle, exitLabel);
    root.add(exitGroup);

    const exitGlow = new THREE.PointLight(0xc7b58f, 2.2, 5.5, 1.6);
    exitGlow.name = 'memory_exit_glow_visual';
    exitGlow.position.set(0, 1.5, -15.65);
    exitGlow.visible = false;
    root.add(exitGlow);

    const nearMarker = new THREE.PointLight(0xd7b893, 0.8, 3.2, 2);
    nearMarker.position.set(-1.5, 1.8, -1.9);
    const middleMarker = new THREE.PointLight(0xb4a5bf, 0.72, 3.2, 2);
    middleMarker.position.set(1.5, 1.8, -7.2);
    const farMarker = new THREE.PointLight(0x8995be, 0.78, 3.2, 2);
    farMarker.position.set(-1.5, 1.8, -12.3);
    root.add(nearMarker, middleMarker, farMarker);

    this.addHotspot(root, hotspots, 'exit_archive', new THREE.Vector3(0, 1.3, -15.85), new THREE.Vector3(1.55, 2.65, 0.8));
  }
}
