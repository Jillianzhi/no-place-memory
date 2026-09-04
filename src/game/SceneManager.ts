import * as THREE from 'three';
import { AssetLoader } from './AssetLoader';
import { CanvasTextureFactory } from './CanvasTextureFactory';
import { ChineseDreamcoreKit } from './ChineseDreamcoreKit';
import { DreamMaterials } from './DreamMaterials';
import { ProceduralGeometryFactory } from './ProceduralGeometryFactory';
import { SceneLayoutStore, type SavedTransform } from './SceneLayoutStore';
import type { GestureType, HotspotDefinition, HotspotId, PointerGesture, SceneBuildResult, SceneDefinition, SceneState } from './types';

type CompletionHandler = (kind: 'scene' | 'game') => void;
type MessageHandler = (message: string) => void;

type MeterVector = readonly [number, number, number];

interface MeterPlacement {
  name: string;
  position: MeterVector;
  size: MeterVector;
}

interface PortraitSceneLayout {
  visuals: readonly MeterPlacement[];
  hotspots: Readonly<Partial<Record<HotspotId, string>>>;
}

const portraitLayouts: Record<SceneDefinition['id'], PortraitSceneLayout> = {
  scene01_school: {
    visuals: [],
    hotspots: {
      hotspot_radio: 'radio_visual',
      hotspot_fog_glass: 'fog_glass_visual',
      hotspot_clock: 'clock_visual',
      exit_door: 'exit_door_visual'
    }
  },
  scene02_station: {
    visuals: [
      { name: 'station_bench_row_1_visual', position: [-1.02, 0.48, 0.18], size: [1.68, 0.78, 0.48] },
      { name: 'station_bench_row_2_visual', position: [-1.2, 0.43, -2.05], size: [1.38, 0.65, 0.42] },
      { name: 'station_bench_row_3_visual', position: [-1.32, 0.38, -4.18], size: [1.04, 0.51, 0.34] },
      { name: 'ticket_visual', position: [-0.65, 0.55, 0.2], size: [0.34, 0.16, 0.02] },
      { name: 'station_ticket_glow_visual', position: [-0.65, 0.55, 0.185], size: [0.48, 0.26, 0.02] },
      { name: 'gate_visual', position: [0.72, 0.43, -3.35], size: [1.04, 0.84, 0.42] },
      { name: 'station_board_frame_visual', position: [0.08, 2.42, -6.28], size: [1.34, 0.5, 0.12] },
      { name: 'board_visual', position: [0.08, 2.42, -6.22], size: [1.18, 0.4, 0.02] },
      { name: 'station_luggage_1_visual', position: [-0.52, 0.24, -4.92], size: [0.42, 0.48, 0.24] },
      { name: 'station_luggage_2_visual', position: [-0.12, 0.2, -5.12], size: [0.35, 0.4, 0.22] },
      { name: 'station_luggage_3_visual', position: [-1.72, 0.24, 1.3], size: [0.7, 0.44, 0.34] },
      { name: 'station_trash_bin_visual', position: [0.28, 0.31, -3.82], size: [0.32, 0.62, 0.32] },
      { name: 'station_umbrella_stand_1_visual', position: [-1.25, 0.26, -4.65], size: [0.28, 0.82, 0.28] },
      { name: 'station_umbrella_stand_2_visual', position: [-0.82, 0.2, -5.32], size: [0.24, 0.64, 0.24] }
    ],
    hotspots: {
      hotspot_ticket: 'ticket_visual',
      hotspot_board: 'board_visual',
      hotspot_gate: 'gate_visual',
      exit_bus_door: 'exit_bus_door_visual'
    }
  },
  scene03_building: {
    visuals: [
      { name: 'iron_door_visual', position: [1.95, 1.15, -4.69], size: [1.2, 2.3, 0.28] },
      { name: 'wall_visual', position: [0.72, 1.72, -4.695], size: [0.58, 0.72, 0.02] },
      { name: 'sound_light_visual', position: [-0.15, 4.12, -1.2], size: [0.38, 1.56, 0.2] },
      { name: 'bike_visual', position: [-1.42, 0.02, 0.88], size: [1.5, 1.12, 0.42] },
      { name: 'building_light_shadow_visual', position: [-0.18, 2.08, -4.69], size: [2.35, 2.55, 0.02] },
      { name: 'building_light_glow_visual', position: [-0.15, 3.74, -1.18], size: [1.18, 1.18, 0.02] },
      { name: 'bike_shadow_visual', position: [-1.42, 0.008, 0.88], size: [1.52, 0.02, 0.72] }
    ],
    hotspots: {
      hotspot_wall: 'wall_visual',
      hotspot_sound_light: 'sound_light_visual',
      hotspot_bike: 'bike_visual',
      hotspot_red_paper: 'red_paper_visual',
      hotspot_iron_door: 'iron_door_visual'
    }
  },
  scene04_projection: {
    visuals: [
      { name: 'screen_frame_visual', position: [0, 1.93, -4.61], size: [3.45, 2.35, 0.02] },
      { name: 'screen_visual', position: [0, 2, -4.53], size: [3.04, 1.71, 0.02] },
      { name: 'playground_visual', position: [0, 2, -4.49], size: [3.04, 1.71, 0.02] },
      { name: 'projector_noise_visual', position: [0, 2, -4.455], size: [3.04, 1.71, 0.02] },
      { name: 'projector_stand_visual', position: [-1.45, 0.44, 0.22], size: [0.78, 0.88, 0.58] },
      { name: 'projector_visual', position: [-1.45, 1.02, 0.18], size: [0.72, 0.68, 0.5] },
      { name: 'memory_table_visual', position: [0.68, 0.43, 0.42], size: [1.62, 0.86, 1] },
      { name: 'archive_cabinet_visual', position: [1.02, 0.91, 0.45], size: [0.48, 0.1, 0.34] },
      { name: 'final_fragment_visual', position: [0.38, 0.96, 0.48], size: [0.18, 0.18, 0.02] },
      { name: 'archive_shelf_visual', position: [1.58, 1.18, -1.9], size: [0.88, 2.36, 0.5] },
      { name: 'projection_bamboo_shadow_visual', position: [-1.75, 1.72, -4.64], size: [1.6, 2.25, 0.02] },
      { name: 'projection_branches_visual', position: [-1.96, 1.32, -3.92], size: [0.94, 1.38, 0.02] }
    ],
    hotspots: {
      hotspot_projector: 'projector_visual',
      hotspot_archive_cabinet: 'archive_cabinet_visual',
      hotspot_screen: 'screen_visual',
      hotspot_memory_table: 'final_fragment_visual',
      hotspot_final_fragment: 'final_fragment_visual'
    }
  },
  scene05_memory: {
    visuals: [],
    hotspots: {}
  }
};

export const sceneDefinitions: SceneDefinition[] = [
  {
    id: 'scene01_school',
    title: '没有结束的午休',
    place: '旧学校走廊',
    modelPath: '/assets/models/scene01_school/scene.glb',
    hotspots: [
      { id: 'hotspot_radio', label: '广播', gestures: ['longPress'] },
      { id: 'hotspot_fog_glass', label: '雾玻璃', gestures: ['swipe'] },
      { id: 'hotspot_clock', label: '时钟', gestures: ['tap', 'drag'] },
      { id: 'exit_door', label: '门', gestures: ['tap'] }
    ]
  },
  {
    id: 'scene02_station',
    title: '没有终点的候车室',
    place: '老县城客运站',
    modelPath: '/assets/models/scene02_station/scene.glb',
    hotspots: [
      { id: 'hotspot_ticket', label: '车票', gestures: ['drag'] },
      { id: 'hotspot_board', label: '电子屏', gestures: ['tap'] },
      { id: 'hotspot_gate', label: '检票口', gestures: ['drag'] },
      { id: 'exit_bus_door', label: '车门', gestures: ['tap'] }
    ]
  },
  {
    id: 'scene03_building',
    title: '仍然亮着灯的楼道',
    place: '国企家属院楼道',
    modelPath: '/assets/models/scene03_building/scene.glb',
    hotspots: [
      { id: 'hotspot_wall', label: '墙面', gestures: ['tap'] },
      { id: 'hotspot_sound_light', label: '灯', gestures: ['tap'] },
      { id: 'hotspot_bike', label: '小车轮', gestures: ['observe', 'tap'] },
      { id: 'hotspot_red_paper', label: '奖状', gestures: ['drag'] },
      { id: 'hotspot_iron_door', label: '铁门', gestures: ['drag', 'tap'] }
    ]
  },
  {
    id: 'scene04_projection',
    title: '没有归处的放映厅',
    place: '旧放映厅 / 档案室 / 中式园林梦境',
    modelPath: '/assets/models/scene04_projection/scene.glb',
    hotspots: [
      { id: 'hotspot_projector', label: '放映机', gestures: ['longPress'] },
      { id: 'hotspot_archive_cabinet', label: '档案袋', gestures: ['tap'] },
      { id: 'hotspot_screen', label: '银幕', gestures: ['drag'] },
      { id: 'hotspot_memory_table', label: '记忆桌', gestures: ['drag'] },
      { id: 'hotspot_final_fragment', label: '记忆碎片', gestures: ['drag'] },
      { id: 'exit_restart', label: '重启门', gestures: ['tap'] }
    ]
  },
  {
    id: 'scene05_memory',
    title: '记忆不会排成一列',
    place: '旧照片长廊',
    modelPath: '/assets/models/scene05_memory/scene.glb',
    hotspots: [
      { id: 'hotspot_memory_photo', label: '旧照片', gestures: ['tap'] },
      { id: 'exit_archive', label: '档案室门', gestures: ['tap'] }
    ]
  }
];

export class SceneManager {
  readonly scene = new THREE.Scene();
  readonly materials = new DreamMaterials();
  readonly textures = new CanvasTextureFactory();
  readonly kit = new ChineseDreamcoreKit(this.materials);

  private readonly procedural = new ProceduralGeometryFactory(this.materials, this.textures, this.kit);
  private readonly layoutStore = new SceneLayoutStore();

  update(time: number): void {
    const water = this.findVisual('water_mirror_visual') as THREE.Mesh | null;
    const waterMaterial = water?.material as THREE.MeshPhysicalMaterial | undefined;
    if (waterMaterial?.emissiveMap) {
      waterMaterial.emissiveMap.offset.set((time * 0.000012) % 1, (time * 0.000007) % 1);
    }

    const projectorNoise = this.findVisual('projector_noise_visual') as THREE.Mesh | null;
    const noiseMaterial = projectorNoise?.material as THREE.MeshBasicMaterial | undefined;
    if (projectorNoise?.visible && noiseMaterial?.alphaMap) {
      noiseMaterial.alphaMap.offset.set((time * 0.00009) % 1, (time * 0.00013) % 1);
      noiseMaterial.opacity = 0.13 + Math.sin(time * 0.021) * 0.025;
    }

    if (this.currentDefinition.id === 'scene03_building') {
      const soundLight = this.findVisual('building_sound_point_light_visual') as THREE.PointLight | null;
      if (soundLight?.visible) soundLight.intensity = 3.7 + Math.sin(time * 0.0063) * 0.16 + Math.sin(time * 0.017) * 0.06;
      const floorLight = this.findVisual('building_floor_light_visual') as THREE.Mesh | null;
      const floorLightMaterial = floorLight?.material as THREE.MeshBasicMaterial | undefined;
      if (floorLightMaterial) floorLightMaterial.opacity = 0.2 + Math.sin(time * 0.00042) * 0.035;
    }

    if (this.currentDefinition.id === 'scene04_projection') {
      const reflection = this.findVisual('projection_water_reflection_visual') as THREE.Mesh | null;
      const reflectionMaterial = reflection?.material as THREE.MeshBasicMaterial | undefined;
      if (reflectionMaterial?.map) {
        reflectionMaterial.map.offset.x = Math.sin(time * 0.00012) * 0.025;
        reflectionMaterial.map.offset.y = (time * 0.000006) % 1;
        reflectionMaterial.opacity = 0.24 + Math.sin(time * 0.0005) * 0.035;
      }
      const petals = this.findVisual('projection_petals_visual');
      for (const [index, child] of (petals?.children ?? []).entries()) {
        const sprite = child as THREE.Sprite;
        sprite.position.x += Math.sin(time * 0.00028 + index) * 0.00016;
        (sprite.material as THREE.SpriteMaterial).rotation = index * 0.58 + time * 0.00008;
      }
    }

    if (this.currentDefinition.id === 'scene05_memory') {
      const exitGlow = this.findVisual('memory_exit_glow_visual') as THREE.PointLight | null;
      if (exitGlow?.visible) exitGlow.intensity = 2.2 + Math.sin(time * 0.0024) * 0.32;
    }

    if (this.currentDefinition.id === 'scene01_school') {
      const rain = this.findVisual('school_rain_veil') as THREE.Mesh | null;
      const rainMaterial = rain?.material as THREE.MeshBasicMaterial | undefined;
      if (rainMaterial?.map) rainMaterial.map.offset.y = -((time * 0.000035) % 1);

      const floorReflection = this.findVisual('school_floor_reflection_visual') as THREE.Mesh | null;
      const floorMaterial = floorReflection?.material as THREE.MeshBasicMaterial | undefined;
      if (floorMaterial) {
        floorMaterial.opacity = 0.22 + Math.sin(time * 0.00042) * 0.06;
        if (floorMaterial.map) {
          floorMaterial.map.offset.x = Math.sin(time * 0.00011) * 0.014;
          floorMaterial.map.offset.y = Math.cos(time * 0.00009) * 0.02;
        }
      }

      const farHaze = this.findVisual('school_far_haze') as THREE.Mesh | null;
      const hazeMaterial = farHaze?.material as THREE.MeshBasicMaterial | undefined;
      if (hazeMaterial?.map) {
        hazeMaterial.map.offset.x = (time * 0.000006) % 1;
        hazeMaterial.opacity = 0.13 + Math.sin(time * 0.00031) * 0.022;
      }

      const driftingHaze = this.findVisual('school_drifting_haze');
      for (const child of driftingHaze?.children ?? []) {
        const haze = child as THREE.Mesh;
        const material = haze.material as THREE.MeshBasicMaterial;
        const speed = Number(haze.userData.speed ?? 0.000005);
        const seed = Number(haze.userData.seed ?? 0);
        if (material.map) material.map.offset.x = (time * speed) % 1;
        haze.position.x = Number(haze.userData.baseX ?? -0.08) + Math.sin(time * 0.00016 + seed) * 0.16;
        material.opacity = Number(haze.userData.baseOpacity ?? 0.1) * (0.78 + Math.sin(time * 0.00042 + seed) * 0.22);
      }

      const floaters = this.findVisual('school_floaters') as THREE.Points | null;
      const floaterPosition = floaters?.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
      const bases = floaters?.userData.basePositions as Float32Array | undefined;
      const speeds = floaters?.userData.speeds as Float32Array | undefined;
      const seeds = floaters?.userData.seeds as Float32Array | undefined;
      if (floaterPosition && bases && speeds && seeds) {
        const values = floaterPosition.array as Float32Array;
        for (let index = 0; index < speeds.length; index += 1) {
          values[index * 3] = bases[index * 3] + Math.sin(time * 0.00035 + seeds[index]) * 0.09;
          values[index * 3 + 1] = 0.1 + ((bases[index * 3 + 1] + time * speeds[index]) % 2.95);
        }
        floaterPosition.needsUpdate = true;
      }

      const foregroundFloaters = this.findVisual('school_foreground_floaters');
      for (const child of foregroundFloaters?.children ?? []) {
        const mote = child as THREE.Sprite;
        const seed = Number(mote.userData.seed ?? 0);
        const speed = Number(mote.userData.speed ?? 0.000016);
        mote.position.x = Number(mote.userData.baseX ?? 0) + Math.sin(time * 0.00024 + seed) * 0.085;
        mote.position.y = 0.12 + ((Number(mote.userData.baseY ?? 0) + time * speed) % 2.85);
        const material = mote.material as THREE.SpriteMaterial;
        material.opacity = Number(mote.userData.baseOpacity ?? 0.3) * (0.72 + Math.sin(time * 0.0012 + seed) * 0.28);
      }

      const petals = this.findVisual('school_drifting_petals');
      for (const child of petals?.children ?? []) {
        const seed = Number(child.userData.seed ?? 0);
        const speed = Number(child.userData.speed ?? 0.000015);
        child.position.x = Number(child.userData.baseX ?? 0) + Math.sin(time * 0.0004 + seed) * 0.24;
        child.position.y = 0.15 + ((Number(child.userData.baseY ?? 0) - time * speed + 6) % 2.9);
        (child as THREE.Sprite).material.rotation = seed + time * 0.00018;
      }

      const nearLight = this.findVisual('school_fluorescent_near') as THREE.PointLight | null;
      const farLight = this.findVisual('school_fluorescent_far') as THREE.PointLight | null;
      const flicker = Math.sin(time * 0.012) * 0.026 + Math.sin(time * 0.0037) * 0.018;
      const oldTubeDip = Math.pow(Math.max(0, Math.sin(time * 0.0067 + 1.2)), 20) * 0.16;
      if (nearLight) nearLight.intensity = 0.68 + flicker * 2.8 - oldTubeDip;
      if (farLight) farLight.intensity = 0.38 + flicker * 1.7 - oldTubeDip * 0.55;
      const fixtures = this.findVisual('school_ceiling_details_visual');
      for (const [index, child] of (fixtures?.children ?? []).entries()) {
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.opacity = 0.82 + Math.sin(time * (index === 0 ? 0.0042 : 0.0035) + index) * 0.12 + flicker * 2.1 - oldTubeDip * 0.8;
      }

      const lightPools = this.findVisual('school_window_light_pools');
      for (const [index, child] of (lightPools?.children ?? []).entries()) {
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (material.map) material.map.offset.y = Math.sin(time * 0.00012 + index) * 0.018;
        material.opacity = [0.3, 0.23, 0.17][index] * (0.78 + Math.sin(time * 0.00028 + index * 1.7) * 0.22);
      }
    }

    if (this.currentDefinition.id === 'scene02_station') {
      const stationRain = this.findVisual('station_atmosphere_visual');
      for (const child of stationRain?.children ?? []) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshBasicMaterial;
        if (child.name === 'station_rain_veil_visual' && material.map) {
          material.map.offset.y = -((time * 0.000055) % 1);
          material.opacity = 0.34 + Math.sin(time * 0.0007 + child.position.x) * 0.045;
        }
        if (child.name === 'station_far_haze_visual' && material.map) {
          material.map.offset.x = (time * 0.000007) % 1;
          child.position.x = Math.sin(time * 0.00018) * 0.14;
          material.opacity = 0.12 + Math.sin(time * 0.00036) * 0.025;
        }
      }

      const reflection = this.findVisual('station_floor_reflection_visual') as THREE.Mesh | null;
      const reflectionMaterial = reflection?.material as THREE.MeshBasicMaterial | undefined;
      if (reflectionMaterial?.map) {
        reflectionMaterial.map.offset.x = Math.sin(time * 0.00009) * 0.018;
        reflectionMaterial.map.offset.y = (time * 0.000006) % 1;
        reflectionMaterial.opacity = 0.15 + Math.sin(time * 0.0003) * 0.028;
      }

      const fans = this.findVisual('station_ceiling_fans_visual');
      for (const [index, child] of (fans?.children ?? []).entries()) {
        child.rotation.y = time * (index === 0 ? 0.00115 : 0.00082);
      }

      const lamps = this.findVisual('station_hanging_lamps_visual');
      const lampFlicker = Math.sin(time * 0.0048) * 0.035 + Math.sin(time * 0.013) * 0.018;
      for (const [index, lamp] of (lamps?.children ?? []).entries()) {
        const light = lamp.getObjectByName('station_lamp_light_visual') as THREE.PointLight | undefined;
        if (light) light.intensity = (index === 0 ? 0.46 : 0.3) + lampFlicker * (index === 0 ? 1.1 : 0.65);
        const bulb = lamp.getObjectByName('station_lamp_bulb_visual') as THREE.Mesh | undefined;
        const bulbMaterial = bulb?.material as THREE.MeshStandardMaterial | undefined;
        if (bulbMaterial) bulbMaterial.emissiveIntensity = 2.1 + lampFlicker * 3.2;
      }

      const ticketGlow = this.findVisual('station_ticket_glow_visual') as THREE.Mesh | null;
      const ticketGlowMaterial = ticketGlow?.material as THREE.MeshBasicMaterial | undefined;
      if (ticketGlowMaterial) ticketGlowMaterial.opacity = 0.25 + Math.sin(time * 0.0022) * 0.09;
    }
  }
  private readonly states = new Map<string, SceneState>();
  private root: THREE.Group | null = null;
  private interactables: THREE.Object3D[] = [];
  private currentIndex = 0;
  private buildResult: SceneBuildResult | null = null;
  private onComplete: CompletionHandler = () => undefined;
  private onMessage: MessageHandler = () => undefined;
  private draggedVisual: THREE.Object3D | null = null;
  private layoutMode: 'landscape' | 'portrait' = 'landscape';
  private compareMode = false;
  private readonly hemisphereLight = new THREE.HemisphereLight(0xd9d7ff, 0x0e1020, 1.8);
  private readonly keyLight = new THREE.DirectionalLight(0xffd8ec, 2.2);
  private readonly dreamLight = new THREE.PointLight(0x7b8cff, 7, 8);

  constructor(private readonly loader: AssetLoader) {
    this.scene.background = new THREE.Color(0x111322);
    this.scene.fog = new THREE.FogExp2(0x1b1c3a, 0.08);
    this.keyLight.position.set(-2.5, 4, 4);
    this.dreamLight.position.set(1.7, 1.8, 1.4);
    this.scene.add(this.hemisphereLight, this.keyLight, this.dreamLight);
    for (const definition of sceneDefinitions) {
      this.states.set(definition.id, { flags: {}, completed: false });
    }
  }

  get currentDefinition(): SceneDefinition {
    return sceneDefinitions[this.currentIndex];
  }

  get currentState(): SceneState {
    return this.states.get(this.currentDefinition.id)!;
  }

  get usingModel(): boolean {
    return this.buildResult?.usedModel ?? false;
  }

  get usingFallback(): boolean {
    return this.buildResult?.usedFallback ?? true;
  }

  get currentSceneIndex(): number {
    return this.currentIndex;
  }

  get layoutOrientation(): 'portrait' | 'landscape' {
    return this.layoutMode;
  }

  get activeRootId(): string | null {
    return this.root?.uuid ?? null;
  }

  getEditableObjects(): THREE.Object3D[] {
    if (!this.root) return [];
    const objects: THREE.Object3D[] = [];
    this.root.traverse((object) => {
      if (!object.name.endsWith('_visual') || object.userData.isHotspot) return;
      let parent = object.parent;
      while (parent && parent !== this.root) {
        if (parent.name.endsWith('_visual')) return;
        parent = parent.parent;
      }
      objects.push(object);
    });
    return objects.sort((a, b) => a.name.localeCompare(b.name));
  }

  saveEditedObject(object: THREE.Object3D): void {
    if (!object.name) return;
    this.layoutStore.save(this.currentDefinition.id, this.layoutMode, object);
    this.updateEditorMetadata(object);
    this.syncHotspotForVisual(object.name);
  }

  previewEditedObject(object: THREE.Object3D): void {
    if (!object.name) return;
    this.updateEditorMetadata(object);
    this.syncHotspotForVisual(object.name);
  }

  resetEditedObject(object: THREE.Object3D): void {
    const original = object.userData.editorDefaultTransform as SavedTransform | undefined;
    if (!original) return;
    this.applyTransform(object, original);
    this.layoutStore.remove(this.currentDefinition.id, this.layoutMode, object.name);
    this.updateEditorMetadata(object);
    this.syncHotspotForVisual(object.name);
  }

  resetCurrentEditorLayout(): void {
    this.layoutStore.clearScene(this.currentDefinition.id, this.layoutMode);
    for (const object of this.getEditableObjects()) {
      const original = object.userData.editorDefaultTransform as SavedTransform | undefined;
      if (original) this.applyTransform(object, original);
      this.updateEditorMetadata(object);
    }
    this.syncAllHotspotsToVisuals();
  }

  exportEditorLayouts(): string {
    return this.layoutStore.exportJson();
  }

  async importEditorLayouts(json: string): Promise<void> {
    this.layoutStore.importJson(json);
    await this.load(this.currentIndex);
  }

  getInteractables(): THREE.Object3D[] {
    return this.interactables.filter((object) => !object.userData.disabled);
  }

  getVisualObject(name: string): THREE.Object3D | null {
    return this.findVisual(name);
  }

  getInteractableNames(): string[] {
    return this.getInteractables().map((object) => String(object.userData.hotspotId ?? object.name));
  }

  getObjectives(): Array<{ label: string; done: boolean }> {
    const flags = this.currentState.flags;
    if (this.currentDefinition.id === 'scene01_school') {
      return [
        { label: '按住广播', done: Boolean(flags.radio) },
        { label: '擦开雾玻璃', done: Boolean(flags.glass) },
        { label: '调整时钟', done: Boolean(flags.clock) }
      ];
    }
    if (this.currentDefinition.id === 'scene02_station') {
      return [
        { label: '拖出车票', done: Boolean(flags.ticket) },
        { label: '查看电子屏', done: Boolean(flags.board) },
        { label: '车票交到检票口', done: Boolean(flags.checked) }
      ];
    }
    if (this.currentDefinition.id === 'scene03_building') {
      return [
        { label: '点亮灯', done: Boolean(flags.light) },
        { label: '找出楼道变化', done: Boolean(flags.observed) },
        { label: '归还奖状', done: Boolean(flags.returned) }
      ];
    }
    if (this.currentDefinition.id === 'scene05_memory') {
      return [
        { label: '翻看近处照片', done: Boolean(flags.memoryNear) },
        { label: '翻看中段照片', done: Boolean(flags.memoryMiddle) },
        { label: '翻看尽头照片', done: Boolean(flags.memoryFar) }
      ];
    }
    return [
      { label: '启动放映机，看见乐园', done: Boolean(flags.projector) },
      { label: '碎片拖到银幕', done: Number(flags.fragments ?? 0) >= 1 },
      { label: '打开档案袋', done: Boolean(flags.cabinet) }
    ];
  }

  setHandlers(onComplete: CompletionHandler, onMessage: MessageHandler): void {
    this.onComplete = onComplete;
    this.onMessage = onMessage;
  }

  setCompareMode(enabled: boolean): void {
    this.compareMode = enabled;
    this.applyCompareVisibility();
  }

  setViewport(width: number, height: number): void {
    const nextMode: 'landscape' | 'portrait' = height > width * 1.08 ? 'portrait' : 'landscape';
    if (nextMode === this.layoutMode) return;
    this.layoutMode = nextMode;
    if (this.root) void this.load(this.currentIndex);
  }

  async load(index = this.currentIndex): Promise<void> {
    this.currentIndex = index;
    if (this.root) this.scene.remove(this.root);
    this.interactables = [];
    this.root = new THREE.Group();
    this.root.name = 'active_scene_root';
    this.scene.add(this.root);

    const definition = this.currentDefinition;
    const model = await this.loader.loadSceneModel(definition.modelPath);
    if (model) {
      this.root.add(model);
      this.decorateLoadedModel(model);
      const hotspots = this.collectModelHotspots(model, definition.hotspots);
      this.buildResult = { root: this.root, hotspots, usedFallback: false, usedModel: true };
      this.interactables = hotspots.length > 0 ? hotspots : this.addFallbackHotspotsOnly(definition);
      if (hotspots.length === 0) this.buildResult.usedFallback = true;
    } else {
      const fallback = this.procedural.build(definition);
      this.root.add(fallback.root);
      this.interactables = fallback.hotspots;
      this.buildResult = fallback;
    }

    this.applyResponsiveLayout();
    this.captureDefaultsAndApplyEditorLayout();
    this.configureSceneEntry();
    this.syncAllHotspotsToVisuals();
    this.configureSceneLighting();
    this.applyCompareVisibility();
    this.onMessage(definition.title);
  }

  nextScene(): void {
    if (this.currentIndex < sceneDefinitions.length - 1) {
      void this.load(this.currentIndex + 1);
      this.onComplete('scene');
    } else {
      this.onComplete('game');
    }
  }

  restart(): void {
    for (const state of this.states.values()) {
      state.flags = {};
      state.completed = false;
    }
    void this.load(0);
  }

  handleGesture(gesture: PointerGesture): boolean {
    if (!gesture.id) return false;
    const definition = this.findHotspotDefinition(gesture.id);
    if (!definition || !definition.gestures.includes(gesture.type)) {
      if (gesture.type !== 'observe') this.onMessage('空间没有回应。');
      return false;
    }
    const state = this.currentState;
    const flags = state.flags;
    const id = gesture.id;
    let success = false;

    if (this.currentDefinition.id === 'scene01_school') {
      success = this.handleSchool(id, gesture.type, gesture, flags);
    } else if (this.currentDefinition.id === 'scene02_station') {
      success = this.handleStation(id, gesture.type, gesture, flags);
    } else if (this.currentDefinition.id === 'scene03_building') {
      success = this.handleBuilding(id, gesture.type, gesture.dropId, flags);
    } else if (this.currentDefinition.id === 'scene04_projection') {
      success = this.handleProjection(id, gesture.type, gesture.dropId, flags);
    } else {
      success = this.handleMemory(id, gesture.type, gesture.object, flags);
    }

    this.updateCompletion();
    return success;
  }

  beginDrag(id: HotspotId, worldPoint: THREE.Vector3): void {
    const visualName = this.visualNameForDrag(id);
    if (!visualName) return;
    const visual = this.findVisual(visualName);
    if (!visual) return;
    visual.userData.dragWorldOffset = visual.position.clone().sub(worldPoint);
    visual.userData.dragBase = visual.position.clone();
    if (id === 'hotspot_ticket') {
      visual.userData.dragWorldOffset = new THREE.Vector3();
      this.swapVisualTexture('ticket_visual', 'backTexture');
      this.setVisualVisible('station_ticket_glow_visual', false);
      visual.userData.dragOriginalScale = visual.scale.clone();
      visual.scale.multiplyScalar(1.08);
    }
    if (id === 'hotspot_red_paper') {
      visual.userData.dragOriginalRotation = visual.rotation.clone();
      visual.userData.dragOriginalScale = visual.scale.clone();
      visual.rotation.set(0, 0, -0.02);
      visual.position.y = Math.max(visual.position.y, 0.48);
      visual.userData.dragWorldOffset = new THREE.Vector3();
      visual.userData.dragBase = visual.position.clone();
      visual.scale.multiplyScalar(1.08);
      this.setVisualVisible('building_award_shadow_visual', false);
    }
    this.draggedVisual = visual;
  }

  endDrag(): void {
    if (this.draggedVisual) {
      const draggedName = this.draggedVisual.name;
      if (this.draggedVisual.name === 'ticket_visual') this.swapVisualTexture('ticket_visual', 'frontTexture');
      const originalScale = this.draggedVisual.userData.dragOriginalScale as THREE.Vector3 | undefined;
      if (originalScale) this.draggedVisual.scale.copy(originalScale);
      const originalRotation = this.draggedVisual.userData.dragOriginalRotation as THREE.Euler | undefined;
      if (originalRotation) this.draggedVisual.rotation.copy(originalRotation);
      this.draggedVisual.userData.dragWorldOffset = undefined;
      this.draggedVisual.userData.dragOriginalScale = undefined;
      this.draggedVisual.userData.dragOriginalRotation = undefined;
      this.syncHotspotForVisual(draggedName);
      this.draggedVisual = null;
    }
    for (const name of ['fog_glass_visual']) {
      const wipeVisual = this.findVisual(name);
      if (wipeVisual) wipeVisual.userData.lastWipePoint = undefined;
    }
  }

  getDragPlaneZ(id: HotspotId): number | null {
    const visualName = this.visualNameForDrag(id);
    if (!visualName) return null;
    const visual = this.findVisual(visualName);
    if (!visual) return null;
    return visual.getWorldPosition(new THREE.Vector3()).z;
  }

  previewDrag(id: HotspotId, delta: THREE.Vector2, worldPoint?: THREE.Vector3): void {
    if (id === 'hotspot_ticket') {
      if (worldPoint) this.previewVisualAt('ticket_visual', worldPoint, this.layoutMode === 'portrait' ? { minX: -1.38, maxX: 1.34, minY: 0.42, maxY: 1.3 } : { minX: -2.55, maxX: 2.45, minY: 0.42, maxY: 1.32 });
      else this.previewVisual('ticket_visual', new THREE.Vector3(delta.x * 0.010, -delta.y * 0.006, 0), 2.55);
    }
    if (id === 'hotspot_red_paper') {
      if (worldPoint) this.previewVisualAt('red_paper_visual', worldPoint, this.layoutMode === 'portrait'
        ? { minX: 0.35, maxX: 2.25, minY: 0.48, maxY: 2.08 }
        : { minX: 0.35, maxX: 2.25, minY: 0.48, maxY: 2.08 });
      else this.previewVisual('red_paper_visual', new THREE.Vector3(delta.x * 0.008, -delta.y * 0.005, 0), 1.72);
    }
    if (id === 'hotspot_memory_table' || id === 'hotspot_final_fragment') {
      if (worldPoint) this.previewVisualAt('final_fragment_visual', worldPoint, { minX: -0.72, maxX: 1.22, minY: 0.72, maxY: 2.42 });
      else this.previewVisual('final_fragment_visual', new THREE.Vector3(delta.x * 0.008, -delta.y * 0.006, 0), 1.6);
    }
  }

  private handleSchool(id: HotspotId, type: GestureType, gesture: PointerGesture, flags: Record<string, boolean | number | string>): boolean {
    if (id === 'hotspot_radio' && type === 'longPress') {
      flags.radio = true;
      this.onMessage('广播里只剩下粉笔灰一样的午后。');
      this.pulseVisual('radio_visual', 1.18);
      this.setHotspotEnabled('hotspot_radio', false);
      return true;
    }
    if (id === 'hotspot_fog_glass' && type === 'swipe') {
      const progress = this.wipeFogGlass(gesture.localPoint);
      flags.glassProgress = progress;
      if (progress >= 0.62) {
        flags.glass = true;
        this.onMessage(progress >= 1 ? '整面雾玻璃都干净了。' : '雾玻璃被擦出一块清亮的午后。');
      } else {
        this.onMessage('雾气被擦开了一小片。');
      }
      return true;
    }
    if (id === 'hotspot_clock' && (type === 'tap' || type === 'drag')) {
      flags.clock = true;
      this.onMessage('时针跳过 12:30，门缝里亮了一下。');
      this.rotateClockHands();
      this.setHotspotEnabled('hotspot_clock', false);
      return true;
    }
    if (id === 'exit_door' && type === 'tap' && this.hasFlags('radio', 'glass', 'clock')) {
      if (flags.doorOpening) return false;
      flags.doorOpening = true;
      this.setHotspotEnabled('exit_door', false);
      this.showOpenSchoolDoor();
      this.onMessage('旧木门向走廊深处打开。');
      window.setTimeout(() => this.nextScene(), 600);
      return true;
    }
    return false;
  }

  private handleStation(id: HotspotId, type: GestureType, gesture: PointerGesture, flags: Record<string, boolean | number | string>): boolean {
    const dropId = gesture.dropId;
    if (id === 'hotspot_ticket' && type === 'drag') {
      flags.ticket = true;
      const checked = dropId === 'hotspot_gate';
      if (checked) {
        flags.checked = true;
        this.onMessage('车票被检过，终点仍然空着。');
        this.moveVisual('ticket_visual', this.layoutPoint(new THREE.Vector3(0.72, 0.82, -3.31), new THREE.Vector3(0.72, 0.82, -3.31)));
        this.syncHotspotToVisual('hotspot_ticket', 'ticket_visual');
        this.showAcceptedStationGate();
        this.setHotspotEnabled('hotspot_ticket', false);
        this.setHotspotEnabled('hotspot_gate', false);
      } else {
        this.onMessage('车票已经拿在手里，请继续拖到右侧检票槽。');
        this.syncHotspotToVisual('hotspot_ticket', 'ticket_visual');
      }
      this.finishStationIfReady(flags);
      return true;
    }
    if (id === 'hotspot_board' && type === 'tap') {
      flags.board = true;
      this.onMessage('电子屏闪了一下：所有班次都开往雨里。');
      this.swapVisualTexture('board_visual', 'onTexture');
      this.pulseVisual('board_visual', 1.06);
      this.setHotspotEnabled('hotspot_board', false);
      this.finishStationIfReady(flags);
      return true;
    }
    if (id === 'exit_bus_door' && type === 'tap' && this.hasFlags('ticket', 'checked', 'board')) {
      this.nextScene();
      return true;
    }
    return false;
  }

  private finishStationIfReady(flags: Record<string, boolean | number | string>): void {
    if (flags.stationFinished) return;
    if (flags.ticket && flags.checked && flags.board) {
      flags.stationFinished = true;
      this.showOpenBusDoor();
      this.setHotspotEnabled('exit_bus_door', true);
      this.onMessage('检票箱亮起，右后站台的车门打开了。请点击车门离开。');
    }
  }

  private handleBuilding(id: HotspotId, type: GestureType, dropId: HotspotId | undefined, flags: Record<string, boolean | number | string>): boolean {
    if ((id === 'hotspot_wall' || id === 'hotspot_sound_light') && type === 'tap') {
      flags.light = true;
      this.onMessage('灯亮起，楼道尽头的影子换了位置。');
      this.showBuildingChange();
      this.pulseVisual('sound_light_visual', 1.35);
      this.setHotspotEnabled('hotspot_wall', false);
      this.setHotspotEnabled('hotspot_sound_light', false);
      this.setHotspotEnabled('hotspot_bike', true);
      return true;
    }
    if (id === 'hotspot_bike' && (type === 'observe' || type === 'tap') && flags.light) {
      flags.observed = true;
      this.onMessage('你认出了变化：车轮的位置和影子对不上。');
      this.setHotspotEnabled('hotspot_bike', false);
      return true;
    }
    if (id === 'hotspot_red_paper' && type === 'drag') {
      flags.paper = true;
      if (dropId === 'hotspot_iron_door') {
        flags.returned = true;
        this.onMessage('褪色奖状回到铁门上，楼道安静下来。');
        this.placeRedPaperOnDoor();
        this.swapVisualTexture('iron_door_image_visual', 'memoryTexture');
        this.setHotspotEnabled('hotspot_red_paper', false);
      } else {
        this.onMessage('没有贴准，奖状重新平落在地面上。');
        this.placeRedPaperOnFloor();
      }
      return true;
    }
    if (id === 'hotspot_iron_door' && type === 'tap' && this.hasFlags('light', 'observed', 'returned')) {
      this.nextScene();
      return true;
    }
    return false;
  }

  private handleProjection(id: HotspotId, type: GestureType, dropId: HotspotId | undefined, flags: Record<string, boolean | number | string>): boolean {
    if (id === 'hotspot_projector' && type === 'longPress') {
      if (flags.projector) return false;
      flags.projector = true;
      this.onMessage('放映机转动，儿童乐园浮现在银幕里。');
      this.swapVisualTexture('projector_image_visual', 'onTexture');
      this.pulseVisual('projector_visual', 1.22);
      this.setVisualVisible('projector_beam_visual', true);
      this.setVisualVisible('playground_visual', true);
      this.setVisualVisible('projector_noise_visual', true);
      this.setVisualVisible('projection_screen_spill_visual', true);
      this.setVisualVisible('final_fragment_visual', true);
      this.setVisualOpacity('archive_cabinet_visual', 0.58);
      this.setHotspotEnabled('hotspot_projector', false);
      this.setHotspotEnabled('hotspot_memory_table', true);
      this.setHotspotEnabled('hotspot_final_fragment', true);
      this.setHotspotEnabled('hotspot_screen', true);
      this.finishProjectionIfReady(flags);
      return true;
    }
    if (id === 'hotspot_archive_cabinet' && type === 'tap') {
      if (Number(flags.fragments ?? 0) < 1) {
        this.onMessage('先把记忆碎片放进银幕，档案袋才会松开。');
        return false;
      }
      if (flags.cabinet) return false;
      flags.cabinet = true;
      this.onMessage('档案袋打开，非场所档案开始生成。');
      this.swapVisualTexture('archive_bag_image_visual', 'openTexture');
      this.pulseVisual('archive_cabinet_visual', 1.14);
      this.setVisualOpacity('archive_cabinet_visual', 1);
      this.setHotspotEnabled('hotspot_archive_cabinet', false);
      this.finishProjectionIfReady(flags);
      return true;
    }
    if ((id === 'hotspot_memory_table' || id === 'hotspot_final_fragment') && type === 'drag') {
      if (!flags.projector) {
        this.onMessage('先按住放映机，让银幕亮起来。');
        return false;
      }
      const count = Number(flags.fragments ?? 0);
      flags.fragments = count + (dropId === 'hotspot_screen' ? 1 : 0);
      this.onMessage(dropId === 'hotspot_screen' ? '记忆碎片落进银幕，乐园的影子被钉住了。' : '碎片要放进亮着乐园的银幕。');
      if (dropId === 'hotspot_screen') {
        this.moveVisual('final_fragment_visual', new THREE.Vector3(0, 2, -4.4));
        this.swapVisualTexture('playground_visual', 'memoryTexture');
        this.pulseVisual('screen_visual', 1.04);
        this.pulseVisual('archive_cabinet_visual', 1.18);
        this.setVisualOpacity('archive_cabinet_visual', 1);
        this.setHotspotEnabled('hotspot_memory_table', false);
        this.setHotspotEnabled('hotspot_final_fragment', false);
        this.setHotspotEnabled('hotspot_screen', false);
        this.setHotspotEnabled('hotspot_archive_cabinet', true);
      }
      this.finishProjectionIfReady(flags);
      return dropId === 'hotspot_screen';
    }
    if (id === 'exit_restart' && type === 'tap' && this.hasFlags('projector', 'cabinet') && Number(flags.fragments ?? 0) >= 1) {
      this.nextScene();
      return true;
    }
    return false;
  }

  private finishProjectionIfReady(flags: Record<string, boolean | number | string>): void {
    if (flags.projectionFinished) return;
    if (flags.projector && flags.cabinet && Number(flags.fragments ?? 0) >= 1) {
      flags.projectionFinished = true;
      window.setTimeout(() => this.nextScene(), 700);
    }
  }

  private handleMemory(id: HotspotId, type: GestureType, object: THREE.Object3D | undefined, flags: Record<string, boolean | number | string>): boolean {
    if (id === 'hotspot_memory_photo' && type === 'tap' && object) {
      const sectionIndex = Number(object.userData.memorySection ?? 0);
      const sectionFlags = ['memoryNear', 'memoryMiddle', 'memoryFar'] as const;
      const sectionFlag = sectionFlags[Math.min(2, Math.max(0, sectionIndex))];
      const firstInSection = !flags[sectionFlag];
      flags[sectionFlag] = true;
      const title = String(object.userData.photoTitle ?? '未命名照片');
      this.onMessage(`「${title}」被从长廊里轻轻抽出来。`);
      this.showFocusedMemoryPhoto(object);
      const sectionVisuals = ['memory_section_near_visual', 'memory_section_middle_visual', 'memory_section_far_visual'];
      if (firstInSection) this.setVisualOpacity(sectionVisuals[sectionIndex] ?? sectionVisuals[0], 1);
      if (flags.memoryNear && flags.memoryMiddle && flags.memoryFar) {
        this.setVisualVisible('memory_exit_glow_visual', true);
        this.setVisualVisible('memory_exit_label_visual', true);
        this.setHotspotEnabled('exit_archive', true);
        window.setTimeout(() => this.onMessage('最后一张照片归位，档案室门亮了。'), 720);
      }
      return true;
    }
    const sections: Partial<Record<HotspotId, { flag: string; visual: string; message: string }>> = {
      hotspot_memory_near: {
        flag: 'memoryNear',
        visual: 'memory_section_near_visual',
        message: '近处的照片有刚晒过的褪色边缘，午休和走廊挤在一起。'
      },
      hotspot_memory_middle: {
        flag: 'memoryMiddle',
        visual: 'memory_section_middle_visual',
        message: '中段的照片更亮，游乐场像从别人的童年里借来的。'
      },
      hotspot_memory_far: {
        flag: 'memoryFar',
        visual: 'memory_section_far_visual',
        message: '尽头留下集市、商铺和一条没有人的回家路。'
      }
    };
    const section = sections[id];
    if (section && type === 'tap') {
      if (flags[section.flag]) return false;
      flags[section.flag] = true;
      this.onMessage(section.message);
      this.pulseVisual(section.visual, 1.035);
      this.setVisualOpacity(section.visual, 1);
      this.setHotspotEnabled(id, false);
      if (flags.memoryNear && flags.memoryMiddle && flags.memoryFar) {
        this.setVisualVisible('memory_exit_glow_visual', true);
        this.setVisualVisible('memory_exit_label_visual', true);
        this.setHotspotEnabled('exit_archive', true);
        this.onMessage('三段照片都亮起，长廊尽头的档案室门打开了。');
      }
      return true;
    }
    if (id === 'exit_archive' && type === 'tap' && this.hasFlags('memoryNear', 'memoryMiddle', 'memoryFar')) {
      this.nextScene();
      return true;
    }
    return false;
  }

  private showFocusedMemoryPhoto(hotspot: THREE.Object3D): void {
    const source = this.findVisual(String(hotspot.userData.visualName ?? ''));
    const sourcePrint = source?.getObjectByName('memory_photo_print_visual') as THREE.Mesh | undefined;
    const focus = this.findVisual('memory_focus_visual');
    const focusPrint = focus?.getObjectByName('memory_focus_print_visual') as THREE.Mesh | undefined;
    if (!sourcePrint || !focus || !focusPrint) return;
    const sourceMaterial = sourcePrint.material as THREE.MeshBasicMaterial;
    const focusMaterial = focusPrint.material as THREE.MeshBasicMaterial;
    focusMaterial.map = sourceMaterial.map;
    focusMaterial.needsUpdate = true;
    const aspect = Number(hotspot.userData.photoAspect ?? 1.4);
    const frameAspect = 1.55 / 1.08;
    focusPrint.scale.set(aspect >= frameAspect ? 1 : aspect / frameAspect, aspect >= frameAspect ? frameAspect / aspect : 1, 1);
    focus.visible = true;
    this.pulseVisual('memory_focus_visual', 1.055);
    window.setTimeout(() => {
      focus.visible = false;
    }, 1900);
  }

  private updateCompletion(): void {
    const flags = this.currentState.flags;
    if (this.currentDefinition.id === 'scene01_school') this.currentState.completed = this.hasFlags('radio', 'glass', 'clock');
    if (this.currentDefinition.id === 'scene02_station') this.currentState.completed = this.hasFlags('ticket', 'checked', 'board');
    if (this.currentDefinition.id === 'scene03_building') this.currentState.completed = this.hasFlags('light', 'observed', 'returned');
    if (this.currentDefinition.id === 'scene04_projection') {
      this.currentState.completed = Boolean(flags.projector && flags.cabinet && Number(flags.fragments ?? 0) >= 1);
    }
    if (this.currentDefinition.id === 'scene05_memory') {
      this.currentState.completed = this.hasFlags('memoryNear', 'memoryMiddle', 'memoryFar');
    }
  }

  private hasFlags(...names: string[]): boolean {
    return names.every((name) => Boolean(this.currentState.flags[name]));
  }

  private findHotspotDefinition(id: HotspotId): HotspotDefinition | undefined {
    return this.currentDefinition.hotspots.find((hotspot) => hotspot.id === id);
  }

  private collectModelHotspots(model: THREE.Group, definitions: HotspotDefinition[]): THREE.Object3D[] {
    const found: THREE.Object3D[] = [];
    const ids = new Set(definitions.map((definition) => definition.id));
    model.traverse((object) => {
      if (ids.has(object.name as HotspotId)) {
        object.userData.hotspotId = object.name;
        object.userData.isHotspot = true;
        found.push(object);
      }
    });
    return found;
  }

  private addFallbackHotspotsOnly(definition: SceneDefinition): THREE.Object3D[] {
    const fallback = this.procedural.build(definition);
    this.root?.add(fallback.root);
    return fallback.hotspots;
  }

  private decorateLoadedModel(model: THREE.Group): void {
    const water = this.kit.createWaterMirror(5.5, 1.08);
    water.position.set(0, -0.02, 1.1);
    const bamboo = this.kit.createBambooShadow(4.8, 2.5);
    bamboo.position.set(-0.2, 1.25, -1.74);
    model.add(water, bamboo);
  }

  private findVisual(name: string): THREE.Object3D | null {
    return this.root?.getObjectByName(name) ?? null;
  }

  private captureDefaultsAndApplyEditorLayout(): void {
    for (const object of this.getEditableObjects()) {
      const original: SavedTransform = {
        position: object.position.toArray() as [number, number, number],
        rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
        scale: object.scale.toArray() as [number, number, number]
      };
      object.userData.editorDefaultTransform = original;
      const saved = this.layoutStore.get(this.currentDefinition.id, this.layoutMode, object.name);
      if (saved) this.applyTransform(object, saved);
      this.updateEditorMetadata(object);
    }
  }

  private applyTransform(object: THREE.Object3D, transform: SavedTransform): void {
    object.position.fromArray(transform.position);
    object.rotation.set(...transform.rotation);
    object.scale.fromArray(transform.scale);
    object.updateMatrixWorld(true);
  }

  private updateEditorMetadata(object: THREE.Object3D): void {
    const original = object.userData.editorDefaultTransform as SavedTransform | undefined;
    const base = original ? new THREE.Vector3().fromArray(original.position) : object.position.clone();
    object.userData.editorPositionOffset = object.position.clone().sub(base);
    object.userData.layoutScale = object.scale.clone();
    object.userData.dragBase = object.position.clone();
  }

  private syncAllHotspotsToVisuals(): void {
    const layout = portraitLayouts[this.currentDefinition.id];
    for (const [id, visualName] of Object.entries(layout.hotspots)) {
      if (visualName) this.syncHotspotToVisual(id as HotspotId, visualName);
    }
  }

  private syncHotspotForVisual(visualName: string): void {
    const layout = portraitLayouts[this.currentDefinition.id];
    for (const [id, mappedVisual] of Object.entries(layout.hotspots)) {
      if (mappedVisual === visualName) this.syncHotspotToVisual(id as HotspotId, visualName);
    }
  }

  private layoutPoint(landscape: THREE.Vector3, portrait: THREE.Vector3): THREE.Vector3 {
    return this.layoutMode === 'portrait' ? portrait : landscape;
  }

  private applyResponsiveLayout(): void {
    if (!this.root || this.layoutMode === 'landscape' || !this.buildResult?.usedFallback) return;

    for (let index = 1; index <= 4; index += 1) {
      const opacity = index === 1 ? 0.12 : 0.24;
      this.setVisualOpacity(`scene_backdrop_${index}`, opacity);
    }

    if (this.currentDefinition.id === 'scene05_memory') {
      const layout = portraitLayouts[this.currentDefinition.id];
      for (const [id, visualName] of Object.entries(layout.hotspots)) {
        if (visualName) this.syncHotspotToVisual(id as HotspotId, visualName);
      }
      return;
    }

    if (this.currentDefinition.id === 'scene01_school') {
      this.fitVisualToMeters({ name: 'stage_floor_visual', position: [0, -0.08, -3.2], size: [3.5, 0.12, 28] });
      this.fitVisualToMeters({ name: 'stage_back_visual', position: [0.72, 1.575, -11.8], size: [2.05, 3.15, 0.12] });
      this.fitVisualToMeters({ name: 'stage_right_visual', position: [1.75, 1.575, -3.2], size: [0.12, 3.15, 28] });
    } else {
      this.fitVisualToMeters({ name: 'stage_floor_visual', position: [0, -0.06, 0], size: [2.7, 0.12, 3] });
      this.fitVisualToMeters({ name: 'stage_back_visual', position: [0, 1.45, -1.55], size: [2.7, 2.9, 0.1] });
      this.fitVisualToMeters({ name: 'stage_left_visual', position: [-1.4, 1.45, 0], size: [0.1, 2.9, 3] });
      this.fitVisualToMeters({ name: 'stage_right_visual', position: [1.4, 1.45, 0], size: [0.1, 2.9, 3] });
      this.fitVisualToMeters({ name: 'stage_lip_visual', position: [0, 0.035, 1.5], size: [2.7, 0.045, 0.1] });
    }
    this.fitVisualToMeters({ name: `scene_backdrop_${this.currentIndex + 1}`, position: [0, 1.45, -1.255], size: [7.15, 2.9, 0.02] });
    this.fitVisualToMeters({ name: 'bamboo_shadow_visual', position: [0, 1.45, -1.48], size: [2.7, 2.9, 0.02] });

    const water = this.findVisual('water_mirror_visual');
    if (water) {
      water.position.set(0, 0.005, 0.92);
      water.scale.set(2.7 / 4.9, 2.75 / 0.74, 1);
      water.userData.layoutScale = water.scale.clone();
    }

    const layout = portraitLayouts[this.currentDefinition.id];
    for (const placement of layout.visuals) this.fitVisualToMeters(placement);
    for (const [id, visualName] of Object.entries(layout.hotspots)) {
      if (visualName) this.syncHotspotToVisual(id as HotspotId, visualName);
    }

  }

  private fitVisualToMeters(placement: MeterPlacement): void {
    const object = this.findVisual(placement.name);
    if (!object) return;

    object.scale.set(1, 1, 1);
    object.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(object);
    const baseSize = bounds.getSize(new THREE.Vector3());
    const safe = (value: number): number => Math.max(value, 0.0001);
    const scale = new THREE.Vector3(
      placement.size[0] / safe(baseSize.x),
      placement.size[1] / safe(baseSize.y),
      placement.size[2] / safe(baseSize.z)
    );

    if (baseSize.z < 0.001) scale.z = Math.min(scale.x, scale.y);
    object.scale.copy(scale);
    object.position.set(...placement.position);
    object.userData.layoutScale = scale.clone();
    object.userData.physicalSize = new THREE.Vector3(...placement.size);
  }

  private syncHotspotToVisual(id: HotspotId, visualName: string): void {
    const hotspot = this.interactables.find((item) => String(item.userData.hotspotId ?? item.name) === id) as THREE.Mesh | undefined;
    const visual = this.findVisual(visualName);
    if (!hotspot || !visual || !hotspot.parent) return;

    visual.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(visual);
    const worldCenter = bounds.getCenter(new THREE.Vector3());
    const worldSize = bounds.getSize(new THREE.Vector3());
    const parentScale = hotspot.parent.getWorldScale(new THREE.Vector3());
    const localCenter = hotspot.parent.worldToLocal(worldCenter.clone());
    const localSize = new THREE.Vector3(
      Math.max(worldSize.x / Math.max(parentScale.x, 0.0001), 0.24),
      Math.max(worldSize.y / Math.max(parentScale.y, 0.0001), 0.18),
      Math.max(worldSize.z / Math.max(parentScale.z, 0.0001), 0.12)
    );

    hotspot.geometry.dispose();
    hotspot.geometry = new THREE.BoxGeometry(localSize.x, localSize.y, localSize.z);
    hotspot.position.copy(localCenter);
    hotspot.rotation.set(0, 0, 0);
    hotspot.scale.set(1, 1, 1);
    hotspot.userData.hotspotSize = localSize;
    hotspot.userData.visualName = visualName;
  }

  private configureSceneLighting(): void {
    const school = this.currentDefinition.id === 'scene01_school';
    if (school) {
      this.scene.background = new THREE.Color(0x171923);
      this.scene.fog = new THREE.FogExp2(0x343942, this.compareMode ? 0.004 : 0.012);
      this.hemisphereLight.color.setHex(0xbfc7dd);
      this.hemisphereLight.groundColor.setHex(0x777d85);
      this.hemisphereLight.intensity = 1.18;
      this.keyLight.color.setHex(0xb9c9f4);
      this.keyLight.intensity = 1.52;
      this.keyLight.position.set(-5.5, 3.6, 1.8);
      this.dreamLight.color.setHex(0x7180ab);
      this.dreamLight.intensity = 0.24;
      this.dreamLight.distance = 10;
      this.dreamLight.position.set(-1.9, 1.5, -1.6);
      return;
    }

    if (this.currentDefinition.id === 'scene02_station') {
      this.scene.background = new THREE.Color(0x545d61);
      this.scene.fog = new THREE.FogExp2(0x68716f, 0.012);
      this.hemisphereLight.color.setHex(0xc8c6ba);
      this.hemisphereLight.groundColor.setHex(0x4e5856);
      this.hemisphereLight.intensity = 1.24;
      this.keyLight.color.setHex(0xc4ced0);
      this.keyLight.intensity = 1.36;
      this.keyLight.position.set(-5.2, 3.2, 0.8);
      this.dreamLight.color.setHex(0x7e9298);
      this.dreamLight.intensity = 0.18;
      this.dreamLight.distance = 13;
      this.dreamLight.position.set(2.2, 1.7, -1.5);
      return;
    }

    if (this.currentDefinition.id === 'scene03_building') {
      this.scene.background = new THREE.Color(0x252930);
      this.scene.fog = new THREE.FogExp2(0x383d46, 0.011);
      this.hemisphereLight.color.setHex(0xaeb5c5);
      this.hemisphereLight.groundColor.setHex(0x292d2d);
      this.hemisphereLight.intensity = 1.42;
      this.keyLight.color.setHex(0xa9b6d2);
      this.keyLight.intensity = 1.58;
      this.keyLight.position.set(-3.8, 4.2, 2.6);
      this.dreamLight.color.setHex(0x7f8fb6);
      this.dreamLight.intensity = 1.78;
      this.dreamLight.distance = 9;
      this.dreamLight.position.set(-1.6, 1.8, -2.1);
      return;
    }

    if (this.currentDefinition.id === 'scene05_memory') {
      this.scene.background = new THREE.Color(0x11100f);
      this.scene.fog = new THREE.FogExp2(0x272321, 0.038);
      this.hemisphereLight.color.setHex(0xb8aa98);
      this.hemisphereLight.groundColor.setHex(0x171412);
      this.hemisphereLight.intensity = 0.82;
      this.keyLight.color.setHex(0xcbb99f);
      this.keyLight.intensity = 1.28;
      this.keyLight.position.set(-3.4, 4.8, 3.2);
      this.dreamLight.color.setHex(0x8992c0);
      this.dreamLight.intensity = 1.9;
      this.dreamLight.distance = 14;
      this.dreamLight.position.set(0, 1.8, -7.8);
      return;
    }

    this.scene.background = new THREE.Color(0x100f0f);
    this.scene.fog = new THREE.FogExp2(0x211f20, 0.022);
    this.hemisphereLight.color.setHex(0x9d9891);
    this.hemisphereLight.groundColor.setHex(0x141312);
    this.hemisphereLight.intensity = 0.92;
    this.keyLight.color.setHex(0xc3b7a6);
    this.keyLight.intensity = 1.45;
    this.keyLight.position.set(-3.6, 4.4, 2.2);
    this.dreamLight.color.setHex(0x7787bb);
    this.dreamLight.intensity = 2.15;
    this.dreamLight.distance = 10;
    this.dreamLight.position.set(-0.8, 1.9, -2.8);
  }

  private applyCompareVisibility(): void {
    if (!this.root || this.currentDefinition.id !== 'scene01_school') return;
    const interactionLayer = this.root.getObjectByName('school_interaction_layer');
    if (interactionLayer) interactionLayer.visible = !this.compareMode;
    const atmosphere = this.root.getObjectByName('school_atmosphere_visual');
    if (atmosphere) atmosphere.visible = !this.compareMode;
  }

  private configureSceneEntry(): void {
    if (this.currentDefinition.id === 'scene02_station') {
      const flags = this.currentState.flags;
      if (flags.board) this.swapVisualTexture('board_visual', 'onTexture');
      if (flags.checked) this.showAcceptedStationGate();
      if (flags.stationFinished) this.showOpenBusDoor();
      this.setVisualVisible('station_ticket_glow_visual', !flags.checked && !flags.ticket);
      this.setHotspotEnabled('hotspot_ticket', !flags.checked);
      this.setHotspotEnabled('hotspot_gate', !flags.checked);
      this.setHotspotEnabled('hotspot_board', !flags.board);
      this.setHotspotEnabled('exit_bus_door', Boolean(flags.stationFinished));
      return;
    }
    if (this.currentDefinition.id === 'scene03_building') {
      const flags = this.currentState.flags;
      if (flags.light) this.showBuildingChange();
      if (flags.returned) {
        this.placeRedPaperOnDoor();
        this.swapVisualTexture('iron_door_image_visual', 'memoryTexture');
      } else {
        this.placeRedPaperOnFloor();
      }
      this.setHotspotEnabled('hotspot_wall', !flags.light);
      this.setHotspotEnabled('hotspot_sound_light', !flags.light);
      this.setHotspotEnabled('hotspot_bike', Boolean(flags.light && !flags.observed));
      this.setHotspotEnabled('hotspot_red_paper', !flags.returned);
      return;
    }
    if (this.currentDefinition.id === 'scene05_memory') {
      const flags = this.currentState.flags;
      this.setVisualVisible('memory_focus_visual', false);
      this.setVisualOpacity('memory_section_near_visual', flags.memoryNear ? 1 : 0.84);
      this.setVisualOpacity('memory_section_middle_visual', flags.memoryMiddle ? 1 : 0.84);
      this.setVisualOpacity('memory_section_far_visual', flags.memoryFar ? 1 : 0.84);
      this.setHotspotEnabled('hotspot_memory_near', !flags.memoryNear);
      this.setHotspotEnabled('hotspot_memory_middle', !flags.memoryMiddle);
      this.setHotspotEnabled('hotspot_memory_far', !flags.memoryFar);
      const complete = Boolean(flags.memoryNear && flags.memoryMiddle && flags.memoryFar);
      this.setVisualVisible('memory_exit_glow_visual', complete);
      this.setVisualVisible('memory_exit_label_visual', complete);
      this.setHotspotEnabled('exit_archive', complete);
      return;
    }
    if (this.currentDefinition.id !== 'scene04_projection') return;
    const flags = this.currentState.flags;
    const projectorOn = Boolean(flags.projector);
    const fragmentPlaced = Number(flags.fragments ?? 0) >= 1;
    const archiveOpen = Boolean(flags.cabinet);
    if (projectorOn) this.swapVisualTexture('projector_image_visual', 'onTexture');
    if (fragmentPlaced) {
      this.swapVisualTexture('playground_visual', 'memoryTexture');
      this.moveVisual('final_fragment_visual', new THREE.Vector3(0, 2, -4.4));
    }
    if (archiveOpen) this.swapVisualTexture('archive_bag_image_visual', 'openTexture');
    this.setVisualVisible('projector_beam_visual', projectorOn);
    this.setVisualVisible('playground_visual', projectorOn);
    this.setVisualVisible('projector_noise_visual', projectorOn);
    this.setVisualVisible('projection_screen_spill_visual', projectorOn);
    this.setVisualVisible('final_fragment_visual', projectorOn || fragmentPlaced);
    this.setVisualOpacity('screen_visual', 1);
    this.setVisualOpacity('archive_cabinet_visual', fragmentPlaced ? 1 : 0.58);
    const hasFragmentHotspot = this.interactables.some((item) => String(item.userData.hotspotId ?? item.name) === 'hotspot_final_fragment');
    this.setHotspotEnabled('hotspot_projector', !projectorOn);
    this.setHotspotEnabled('hotspot_memory_table', Boolean(projectorOn && !fragmentPlaced && !hasFragmentHotspot));
    this.setHotspotEnabled('hotspot_final_fragment', Boolean(projectorOn && !fragmentPlaced));
    this.setHotspotEnabled('hotspot_screen', Boolean(projectorOn && !fragmentPlaced));
    this.setHotspotEnabled('hotspot_archive_cabinet', Boolean(fragmentPlaced && !archiveOpen));
  }

  private setHotspotEnabled(id: HotspotId, enabled: boolean): void {
    const object = this.interactables.find((item) => String(item.userData.hotspotId ?? item.name) === id);
    if (object) object.userData.disabled = !enabled;
  }

  private setVisualVisible(name: string, visible: boolean): void {
    const object = this.findVisual(name);
    if (!object) return;
    object.visible = visible;
  }

  private setVisualOpacity(name: string, opacity: number): void {
    const object = this.findVisual(name);
    if (!object) return;
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      const material = mesh.material;
      if (!material) return;
      const materials = Array.isArray(material) ? material : [material];
      for (const item of materials) {
        item.transparent = opacity < 1 || item.transparent;
        item.opacity = opacity;
      }
    });
  }

  private visualNameForDrag(id: HotspotId): string | null {
    if (id === 'hotspot_ticket') return 'ticket_visual';
    if (id === 'hotspot_red_paper') return 'red_paper_visual';
    if (id === 'hotspot_memory_table' || id === 'hotspot_final_fragment') return 'final_fragment_visual';
    return null;
  }

  private moveVisual(name: string, delta: THREE.Vector3, relative = false): void {
    const object = this.findVisual(name);
    if (!object) return;
    if (relative) object.position.add(delta);
    else {
      const editorOffset = object.userData.editorPositionOffset as THREE.Vector3 | undefined;
      object.position.copy(delta).add(editorOffset ?? new THREE.Vector3());
    }
    object.userData.dragBase = object.position.clone();
  }

  private placeRedPaperOnFloor(): void {
    const paper = this.findVisual('red_paper_visual');
    if (!paper) return;
    paper.position.set(0.72, 0.028, 0.65);
    paper.rotation.set(-Math.PI / 2, 0, -0.12);
    paper.userData.dragBase = paper.position.clone();
    paper.userData.dragOriginalRotation = undefined;
    this.setVisualVisible('building_award_shadow_visual', true);
    this.syncHotspotToVisual('hotspot_red_paper', 'red_paper_visual');
  }

  private placeRedPaperOnDoor(): void {
    const paper = this.findVisual('red_paper_visual');
    if (!paper) return;
    paper.position.set(1.95, 1.55, -4.5);
    paper.rotation.set(0, 0, -0.02);
    paper.userData.dragBase = paper.position.clone();
    paper.userData.dragOriginalRotation = undefined;
    this.setVisualVisible('building_award_shadow_visual', false);
    this.syncHotspotToVisual('hotspot_red_paper', 'red_paper_visual');
  }

  private previewVisual(name: string, delta: THREE.Vector3, limit = 0.8): void {
    const object = this.findVisual(name);
    if (!object) return;
    const base = (object.userData.dragBase as THREE.Vector3 | undefined) ?? object.position.clone();
    object.userData.dragBase = base;
    const clamped = delta.clone();
    clamped.x = THREE.MathUtils.clamp(clamped.x, -limit, limit);
    clamped.y = THREE.MathUtils.clamp(clamped.y, -limit * 0.55, limit * 0.55);
    object.position.copy(base).add(clamped);
  }

  private previewVisualAt(
    name: string,
    worldPoint: THREE.Vector3,
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): void {
    const object = this.findVisual(name);
    if (!object) return;
    const offset = (object.userData.dragWorldOffset as THREE.Vector3 | undefined) ?? new THREE.Vector3();
    const baseZ = ((object.userData.dragBase as THREE.Vector3 | undefined) ?? object.position).z;
    object.position.set(
      THREE.MathUtils.clamp(worldPoint.x + offset.x, bounds.minX, bounds.maxX),
      THREE.MathUtils.clamp(worldPoint.y + offset.y, bounds.minY, bounds.maxY),
      baseZ
    );
  }

  private wipeFogGlass(localPoint?: THREE.Vector2): number {
    return this.wipeGlass('fog_glass_visual', localPoint);
  }

  private wipeGlass(visualName: string, localPoint?: THREE.Vector2): number {
    const object = this.findVisual(visualName) as THREE.Mesh | null;
    const texture = object?.userData.wipeTexture as THREE.CanvasTexture | undefined;
    const canvas = object?.userData.wipeCanvas as HTMLCanvasElement | undefined;
    const ctx = object?.userData.wipeCtx as CanvasRenderingContext2D | undefined;
    if (!object || !texture || !canvas || !ctx) {
      this.fadeVisual(visualName);
      return 1;
    }

    const uv = localPoint ?? new THREE.Vector2(0.5, 0.5);
    const x = THREE.MathUtils.clamp(uv.x, 0, 1) * canvas.width;
    const y = THREE.MathUtils.clamp(uv.y, 0, 1) * canvas.height;
    const previous = object.userData.lastWipePoint as THREE.Vector2 | undefined;
    const px = previous ? previous.x * canvas.width : x;
    const py = previous ? previous.y * canvas.height : y;
    object.userData.lastWipePoint = uv.clone();

    const sampleStep = Math.max(4, Math.floor(canvas.width / 160));
    const countOpaqueSamples = (): number => {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let count = 0;
      for (let sampleY = 0; sampleY < canvas.height; sampleY += sampleStep) {
        for (let sampleX = 0; sampleX < canvas.width; sampleX += sampleStep) {
          const alphaIndex = (sampleY * canvas.width + sampleX) * 4 + 3;
          if (pixels[alphaIndex] > 24) count += 1;
        }
      }
      return count;
    };
    if (!object.userData.wipeInitialSamples) {
      object.userData.wipeInitialSamples = Math.max(1, countOpaqueSamples());
    }

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const brushRadius = Math.max(12, canvas.height * 0.094);
    ctx.lineWidth = brushRadius * 1.7;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    texture.needsUpdate = true;
    const remainingSamples = countOpaqueSamples();
    const progress = THREE.MathUtils.clamp(
      1 - remainingSamples / Number(object.userData.wipeInitialSamples),
      0,
      1
    );
    object.userData.wipeProgress = progress;
    if (progress >= 0.985) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      texture.needsUpdate = true;
      object.userData.wipeProgress = 1;
      return 1;
    }
    return progress;
  }

  private clearWipeVisual(visualName: string): void {
    const object = this.findVisual(visualName) as THREE.Mesh | null;
    const texture = object?.userData.wipeTexture as THREE.CanvasTexture | undefined;
    const canvas = object?.userData.wipeCanvas as HTMLCanvasElement | undefined;
    const ctx = object?.userData.wipeCtx as CanvasRenderingContext2D | undefined;
    if (!object || !texture || !canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    object.userData.wipeProgress = 1;
    texture.needsUpdate = true;
  }

  private fadeVisual(name: string): void {
    const object = this.findVisual(name) as THREE.Mesh | null;
    if (!object) return;
    const material = object.material;
    if (Array.isArray(material)) return;
    material.transparent = true;
    material.opacity = 0.18;
  }

  private rotateClockHands(): void {
    const hour = this.findVisual('clock_hour_hand_visual');
    const minute = this.findVisual('clock_minute_hand_visual');
    if (hour) hour.rotation.z -= Math.PI / 6;
    if (minute) minute.rotation.z -= Math.PI / 2;
  }

  private showOpenSchoolDoor(): void {
    const panel = this.findVisual('school_door_image_visual') as THREE.Mesh | null;
    if (!panel || Array.isArray(panel.material)) return;
    const openTexture = panel.userData.openTexture as THREE.Texture | undefined;
    if (!openTexture) return;
    const material = panel.material as THREE.MeshBasicMaterial;
    material.map = openTexture;
    material.needsUpdate = true;
  }

  private showOpenBusDoor(): void {
    const left = this.findVisual('station_bus_door_left_visual');
    const right = this.findVisual('station_bus_door_right_visual');
    const divider = this.findVisual('station_bus_door_divider_visual');
    if (left) {
      left.rotation.y = 0;
      left.position.x = -0.3;
      left.position.z = 0.055;
    }
    if (right) {
      right.rotation.y = 0;
      right.position.x = 0.3;
      right.position.z = 0.055;
    }
    if (divider) divider.visible = false;
    this.setVisualVisible('station_bus_steps_visual', true);
    this.setVisualVisible('station_bus_door_light_visual', true);
    this.setVisualVisible('station_bus_doorway_glow_visual', true);
  }

  private showAcceptedStationGate(): void {
    const barrier = this.findVisual('gate_barrier_visual');
    if (barrier) barrier.rotation.y = -1.18;
    this.setVisualVisible('gate_indicator_red_visual', false);
    this.setVisualVisible('gate_indicator_green_visual', true);
    this.setVisualVisible('gate_indicator_light_visual', true);

    const slot = this.findVisual('gate_slot_visual') as THREE.Mesh | null;
    if (!slot || Array.isArray(slot.material)) return;
    const material = slot.material as THREE.MeshStandardMaterial;
    material.color.setHex(0x31453a);
    material.emissive.setHex(0x4db276);
    material.emissiveIntensity = 0.75;
  }

  private showBuildingChange(): void {
    this.swapVisualTexture('sound_light_image_visual', 'onTexture');
    this.swapVisualTexture('bike_image_visual', 'changedTexture');
    this.setVisualVisible('building_light_shadow_visual', true);
    this.setVisualVisible('building_light_glow_visual', true);
    this.setVisualVisible('building_sound_point_light_visual', true);
    this.setVisualVisible('bike_shadow_visual', true);
    this.setVisualOpacity('bike_visual', 0.88);

    const bulb = this.findVisual('building_bulb_visual') as THREE.Mesh | null;
    if (bulb && !Array.isArray(bulb.material)) {
      const material = bulb.material as THREE.MeshStandardMaterial;
      material.color.setHex(0xffe1ae);
      material.emissive.setHex(0xffa340);
      material.emissiveIntensity = 2.4;
    }

    const bike = this.findVisual('bike_visual');
    if (!bike) return;
    const base = new THREE.Vector3(-1.42, 0.02, 0.88);
    bike.position.copy(base).add(new THREE.Vector3(0.14, 0.025, 0));
    bike.rotation.z = -0.045;
  }

  private swapVisualTexture(visualName: string, textureKey: string): void {
    const panel = this.findVisual(visualName) as THREE.Mesh | null;
    if (!panel || Array.isArray(panel.material)) return;
    const texture = panel.userData[textureKey] as THREE.Texture | undefined;
    if (!texture) return;
    const material = panel.material as THREE.MeshBasicMaterial;
    material.map = texture;
    material.needsUpdate = true;
  }

  private pulseVisual(name: string, scale: number): void {
    const object = this.findVisual(name);
    if (!object) return;
    const base = ((object.userData.layoutScale as THREE.Vector3 | undefined) ?? object.scale).clone();
    object.scale.copy(base).multiplyScalar(scale);
    window.setTimeout(() => object.scale.copy(base), 260);
  }
}
